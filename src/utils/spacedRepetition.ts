export interface VocabCard {
  id: string;
  french: string;
  english: string;
  example?: string;
  repetitions: number;
  easiness: number;
  interval: number;
  nextReviewDate: string;
  lastReviewDate?: string;
  createdAt: string;
}

export type Rating = 0 | 1 | 2 | 3 | 4 | 5;
// 0=complete blackout, 1=wrong but remembered, 2=wrong but easy,
// 3=correct with difficulty, 4=correct, 5=perfect

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function calculateNextReview(card: VocabCard, rating: Rating): VocabCard {
  const today = toISODate(new Date());
  let { repetitions, easiness, interval } = card;

  if (rating < 3) {
    // Failed: reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
    }
    // Update easiness factor
    easiness = easiness + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (easiness < 1.3) easiness = 1.3;
    repetitions++;
  }

  const nextReviewDate = addDays(today, interval);

  return {
    ...card,
    repetitions,
    easiness,
    interval,
    nextReviewDate,
    lastReviewDate: today,
  };
}

export function getDueCards(cards: VocabCard[]): VocabCard[] {
  const today = toISODate(new Date());
  return cards.filter((card) => card.nextReviewDate <= today);
}

export function createCard(french: string, english: string, example?: string): VocabCard {
  const today = toISODate(new Date());
  return {
    id: crypto.randomUUID(),
    french,
    english,
    example,
    repetitions: 0,
    easiness: 2.5,
    interval: 1,
    nextReviewDate: today,
    createdAt: today,
  };
}
