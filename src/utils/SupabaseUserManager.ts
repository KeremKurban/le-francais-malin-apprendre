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
      details?: any; // Accept JSON details
    }> = []
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Call the database function to update progress and log mistakes
    const mistakesJson = mistakes.map(mistake => ({
      question: mistake.question,
      userAnswer: mistake.userAnswer,
      correctAnswer: mistake.correctAnswer,
      type: mistake.type,
      details: mistake.details ? JSON.stringify(mistake.details) : null
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
      const totalScore = profile.user_progress?.reduce((sum: number, progress: any) => sum + progress.best_score, 0) || 0;
      const masteredTopics = profile.user_progress?.filter((progress: any) => progress.mastery_level >= 3).length || 0;

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
    // Fetch current attempts
    const { data, error: fetchError } = await supabase
      .from('user_mistakes')
      .select('resolution_attempts')
      .eq('id', mistakeId)
      .single();
    if (fetchError) throw fetchError;
    const currentAttempts = data?.resolution_attempts || 0;
    const { error } = await supabase
      .from('user_mistakes')
      .update({ 
        is_resolved: true,
        resolution_attempts: currentAttempts + 1
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

    return achievements ? achievements.map((a: any) => a.achievement_type) : [];
  }

  // Add a new badge (achievement) for the user
  static async addUserBadge(achievementType: string, achievementData: any = null): Promise<void> {
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
      totalPoints = sessions.reduce((sum: number, s: any) => sum + (s.total_points || 0), 0);
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

  static async updateUserProfile(updates: { name?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) throw error;
  }

  static async resetUserScores() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    // Set all best_score, mastery_level, total_attempts to 0 for this user
    const { error } = await supabase
      .from('user_progress')
      .update({ best_score: 0, mastery_level: 0, total_attempts: 0 })
      .eq('user_id', user.id);
    if (error) throw error;
  }
}

export type { UserProfile, UserProgress, UserMistake, LeaderboardEntry };
