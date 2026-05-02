
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  name: string;
  level: string;
  created_at: string;
  updated_at: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  topic_id: string;
  best_score: number;
  total_attempts: number;
  mastery_level: number;
  last_practiced: string;
}

interface UserMistake {
  id: string;
  user_id: string;
  topic_id: string;
  question: string;
  user_answer: string;
  correct_answer: string;
  mistake_type: string;
  is_resolved: boolean;
  resolution_attempts: number;
  created_at: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  level: string;
  total_score: number;
  mastered_topics: number;
}

export class SupabaseUserManager {
  static async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  }

  static async updateUserProgress(
    topicId: string,
    score: number,
    mistakes: Array<{
      question: string;
      userAnswer: string;
      correctAnswer: string;
      type: string;
    }> = []
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Call the database function to update progress and log mistakes
    const mistakesJson = mistakes.map(mistake => ({
      question: mistake.question,
      userAnswer: mistake.userAnswer,
      correctAnswer: mistake.correctAnswer,
      type: mistake.type
    }));

    const { error } = await supabase.rpc('update_learning_progress', {
      p_user_id: user.id,
      p_topic_id: topicId,
      p_score: score,
      p_mistakes: mistakesJson
    });

    if (error) throw error;
  }

  static async getUserProgress(): Promise<Record<string, UserProgress>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id);

    if (!progress) return {};

    const progressMap: Record<string, UserProgress> = {};
    progress.forEach(p => {
      progressMap[p.topic_id] = p;
    });

    return progressMap;
  }

  static async getUserMistakes(): Promise<UserMistake[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: mistakes } = await supabase
      .from('user_mistakes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return mistakes || [];
  }

  static async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        level,
        user_progress (
          best_score,
          mastery_level
        )
      `);

    if (!profiles) return [];

    const leaderboard: LeaderboardEntry[] = profiles.map(profile => {
      const totalScore = profile.user_progress?.reduce((sum: number, progress: { best_score?: number }) => sum + (progress.best_score ?? 0), 0) || 0;
      const masteredTopics = profile.user_progress?.filter((progress: { mastery_level?: number }) => (progress.mastery_level ?? 0) >= 3).length || 0;

      return {
        id: profile.id,
        name: profile.name,
        level: profile.level,
        total_score: totalScore,
        mastered_topics: masteredTopics
      };
    });

    return leaderboard.sort((a, b) => b.total_score - a.total_score);
  }

  static async markMistakeAsResolved(mistakeId: string): Promise<void> {
    const { error } = await supabase
      .from('user_mistakes')
      .update({ 
        is_resolved: true,
        resolution_attempts: 1
      })
      .eq('id', mistakeId);

    if (error) throw error;
  }

  // Fetch user badges (achievements) from user_achievements table
  static async getUserBadges(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('achievement_type')
      .eq('user_id', user.id);

    return achievements ? achievements.map((a: { achievement_type: string }) => a.achievement_type) : [];
  }

  // Add a new badge (achievement) for the user
  static async addUserBadge(achievementType: string, achievementData: Record<string, unknown> | null = null): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: user.id,
        achievement_type: achievementType,
        achievement_data: achievementData,
        earned_at: new Date().toISOString(),
      });
    if (error) throw error;
  }

  // Fetch user session stats (total points, streak, etc.)
  static async getUserSessionStats(): Promise<{ totalPoints: number; streak: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalPoints: 0, streak: 0 };

    // Get all sessions for the user
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('session_start, total_points')
      .eq('user_id', user.id)
      .order('session_start', { ascending: false });

    let streak = 0;
    let lastDate: Date | null = null;
    let totalPoints = 0;
    
    if (sessions && sessions.length > 0) {
      totalPoints = sessions.reduce((sum: number, s: { total_points?: number }) => sum + (s.total_points || 0), 0);
      
      for (const session of sessions) {
        if (!session.session_start) continue;
        const sessionDate = new Date(session.session_start.split('T')[0]);
        
        if (!lastDate) {
          streak = 1;
          lastDate = sessionDate;
        } else {
          const diff = (lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            streak++;
            lastDate = sessionDate;
          } else if (diff > 1) {
            break;
          }
        }
      }
    }
    
    return { totalPoints, streak };
  }

  // Adaptive learning: Get personalized mistakes for review
  static async getPersonalizedMistakes(limit: number = 5): Promise<UserMistake[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: mistakes } = await supabase
      .from('user_mistakes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_resolved', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    return mistakes || [];
  }

  // Create learning insights for adaptive learning
  static async createLearningInsight(
    topicId: string,
    weaknessPattern: string,
    priorityLevel: number = 1,
    suggestedExercises: string[] = []
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('learning_insights')
      .insert({
        user_id: user.id,
        topic_id: topicId,
        weakness_pattern: weaknessPattern,
        priority_level: priorityLevel,
        suggested_exercises: suggestedExercises
      });

    if (error) throw error;
  }

  // Get learning insights for adaptive recommendations
  static async getLearningInsights(): Promise<Record<string, unknown>[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: insights } = await supabase
      .from('learning_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('priority_level', { ascending: false });

    return insights || [];
  }

  // Award achievements based on progress
  static async checkAndAwardAchievements(score: number, topicId: string): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const awarded: string[] = [];

    // Get user's current achievements
    const existingBadges = await this.getUserBadges();

    // Perfect score achievement
    if (score === 100 && !existingBadges.includes('perfect_score')) {
      await this.addUserBadge('perfect_score', { topic: topicId, score });
      awarded.push('perfect_score');
    }

    // First completion achievement
    if (score >= 60 && !existingBadges.includes('first_completion')) {
      await this.addUserBadge('first_completion', { topic: topicId, score });
      awarded.push('first_completion');
    }

    // Topic mastery achievement (80% or higher)
    if (score >= 80 && !existingBadges.includes(`mastery_${topicId}`)) {
      await this.addUserBadge(`mastery_${topicId}`, { topic: topicId, score });
      awarded.push(`mastery_${topicId}`);
    }

    // Check for streak achievements
    const { streak } = await this.getUserSessionStats();
    if (streak >= 7 && !existingBadges.includes('week_streak')) {
      await this.addUserBadge('week_streak', { streak });
      awarded.push('week_streak');
    }

    return awarded;
  }
}

export type { UserProfile, UserProgress, UserMistake, LeaderboardEntry };
