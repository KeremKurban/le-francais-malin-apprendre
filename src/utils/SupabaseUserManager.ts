
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
    const { error } = await supabase
      .from('user_mistakes')
      .update({ 
        is_resolved: true,
        resolution_attempts: supabase.rpc('increment_resolution_attempts', { mistake_id: mistakeId })
      })
      .eq('id', mistakeId);

    if (error) throw error;
  }
}

export type { UserProfile, UserProgress, UserMistake, LeaderboardEntry };
