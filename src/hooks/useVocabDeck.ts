import { useState, useCallback } from 'react';
import {
  VocabCard,
  Rating,
  calculateNextReview,
  getDueCards,
  createCard,
} from '@/utils/spacedRepetition';

const STORAGE_KEY = 'vocab_deck';

function loadCards(): VocabCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VocabCard[];
  } catch {
    return [];
  }
}

function saveCards(cards: VocabCard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function useVocabDeck() {
  const [cards, setCards] = useState<VocabCard[]>(() => loadCards());

  const addCard = useCallback((french: string, english: string, example?: string): void => {
    const newCard = createCard(french, english, example);
    setCards((prev) => {
      const updated = [...prev, newCard];
      saveCards(updated);
      return updated;
    });
  }, []);

  const reviewCard = useCallback((id: string, rating: Rating): void => {
    setCards((prev) => {
      const updated = prev.map((card) =>
        card.id === id ? calculateNextReview(card, rating) : card
      );
      saveCards(updated);
      return updated;
    });
  }, []);

  const deleteCard = useCallback((id: string): void => {
    setCards((prev) => {
      const updated = prev.filter((card) => card.id !== id);
      saveCards(updated);
      return updated;
    });
  }, []);

  const dueCards = getDueCards(cards);
  const masteredCount = cards.filter((c) => c.interval >= 21).length;

  const stats = {
    total: cards.length,
    dueToday: dueCards.length,
    masteredCount,
  };

  return {
    cards,
    dueCards,
    addCard,
    reviewCard,
    deleteCard,
    stats,
  };
}
