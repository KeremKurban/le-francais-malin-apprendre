interface UserData {
  name: string;
  level: string;
  streak: number;
  totalPoints: number;
  badges: string[];
  topicProgress: Record<string, number>;
  mistakes: Mistake[];
  sessionId: string;
  lastLoginDate: string;
}

interface Mistake {
  id: string;
  topic: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  timestamp: string;
}

interface LeaderboardEntry {
  name: string;
  totalPoints: number;
  level: string;
  completedTopics: number;
}

export class UserManager {
  private static STORAGE_KEY = 'francais_pro_user_data';
  private static LEADERBOARD_KEY = 'francais_pro_leaderboard';
  private static SESSION_KEY = 'francais_pro_session';

  static getCurrentUser(): UserData | null {
    const userData = localStorage.getItem(this.STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static saveUser(userData: UserData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
    this.updateLeaderboard(userData);
  }

  static createNewUser(name: string): UserData {
    const newUser: UserData = {
      name,
      level: 'A2',
      streak: 0,
      totalPoints: 0,
      badges: [],
      topicProgress: {},
      mistakes: [],
      sessionId: this.generateSessionId(),
      lastLoginDate: new Date().toISOString()
    };
    
    this.saveUser(newUser);
    sessionStorage.setItem(this.SESSION_KEY, newUser.sessionId);
    return newUser;
  }

  static updateUserProgress(updates: Partial<UserData>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      this.saveUser(updatedUser);
    }
  }

  static addMistake(mistake: Omit<Mistake, 'id' | 'timestamp'>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const newMistake: Mistake = {
        ...mistake,
        id: this.generateId(),
        timestamp: new Date().toISOString()
      };
      
      currentUser.mistakes.push(newMistake);
      this.saveUser(currentUser);
    }
  }

  static isNewSession(): boolean {
    const currentSessionId = sessionStorage.getItem(this.SESSION_KEY);
    const userData = this.getCurrentUser();
    
    if (!userData || !currentSessionId) return true;
    return currentSessionId !== userData.sessionId;
  }

  static resetProgressForNewSession(): UserData | null {
    const userData = this.getCurrentUser();
    if (!userData) return null;

    // Keep user data but reset session-specific progress
    const resetData: UserData = {
      ...userData,
      sessionId: this.generateSessionId(),
      lastLoginDate: new Date().toISOString()
    };

    sessionStorage.setItem(this.SESSION_KEY, resetData.sessionId);
    this.saveUser(resetData);
    return resetData;
  }

  private static updateLeaderboard(userData: UserData): void {
    const leaderboard = this.getLeaderboard();
    const existingIndex = leaderboard.findIndex(entry => entry.name === userData.name);
    
    const completedTopics = Object.values(userData.topicProgress).filter((progress: number) => progress >= 80).length;
    
    const entry: LeaderboardEntry = {
      name: userData.name,
      totalPoints: userData.totalPoints,
      level: userData.level,
      completedTopics
    };

    if (existingIndex >= 0) {
      leaderboard[existingIndex] = entry;
    } else {
      leaderboard.push(entry);
    }

    // Sort by points (descending)
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
    
    localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(leaderboard));
  }

  static getLeaderboard(): LeaderboardEntry[] {
    const leaderboard = localStorage.getItem(this.LEADERBOARD_KEY);
    return leaderboard ? JSON.parse(leaderboard) : [];
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LEADERBOARD_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
  }
}

export type { UserData, Mistake, LeaderboardEntry };
