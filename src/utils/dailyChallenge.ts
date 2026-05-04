export interface DailyChallengeState {
  streak: number;
  lastPracticeDate: string | null; // ISO date string YYYY-MM-DD
  practiceHistory: string[]; // array of ISO date strings practiced
  todayCompleted: boolean;
}

const STORAGE_KEY = 'francais_daily_challenge';

export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultState(): DailyChallengeState {
  return {
    streak: 0,
    lastPracticeDate: null,
    practiceHistory: [],
    todayCompleted: false,
  };
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getYesterdayKey(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyChallengeState(): DailyChallengeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();

    const stored: DailyChallengeState = JSON.parse(raw);
    const today = getTodayKey();

    // Recompute todayCompleted
    const todayCompleted = stored.practiceHistory.includes(today);

    // Check for streak validity
    let streak = stored.streak;
    if (stored.lastPracticeDate) {
      const daysSinceLast = daysBetween(stored.lastPracticeDate, today);
      if (daysSinceLast > 1) {
        // Streak was broken (gap > 1 day)
        streak = 0;
      }
    }

    return {
      ...stored,
      streak,
      todayCompleted,
    };
  } catch {
    return getDefaultState();
  }
}

export function markTodayComplete(): DailyChallengeState {
  const state = getDailyChallengeState();
  const today = getTodayKey();
  const yesterday = getYesterdayKey();

  // Don't double-count if already completed today
  const practiceHistory = state.practiceHistory.includes(today)
    ? state.practiceHistory
    : [...state.practiceHistory, today];

  // Increment streak: if yesterday was practiced (or streak was already counting today)
  let streak = state.streak;
  if (!state.practiceHistory.includes(today)) {
    // Today not yet counted, decide whether to increment or start fresh
    if (state.lastPracticeDate === yesterday || state.streak === 0) {
      streak = state.streak + 1;
    } else if (state.lastPracticeDate === null) {
      streak = 1;
    } else {
      // Gap detected
      streak = 1;
    }
  }

  const newState: DailyChallengeState = {
    streak,
    lastPracticeDate: today,
    practiceHistory,
    todayCompleted: true,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  return newState;
}

export function getCalendarDays(
  numDays: number
): Array<{ date: string; practiced: boolean; isToday: boolean }> {
  const state = getDailyChallengeState();
  const historySet = new Set(state.practiceHistory);
  const today = getTodayKey();
  const result: Array<{ date: string; practiced: boolean; isToday: boolean }> = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    result.push({
      date: dateStr,
      practiced: historySet.has(dateStr),
      isToday: dateStr === today,
    });
  }

  return result;
}
