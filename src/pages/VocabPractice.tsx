import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useVocabDeck } from '@/hooks/useVocabDeck';
import FlashCard from '@/components/FlashCard';
import VocabDeckStats from '@/components/VocabDeckStats';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowLeft, PartyPopper } from 'lucide-react';
import { Rating } from '@/utils/spacedRepetition';

const SEED_WORDS: { french: string; english: string }[] = [
  { french: 'bonjour', english: 'hello' },
  { french: 'merci', english: 'thank you' },
  { french: "s'il vous plaît", english: 'please' },
  { french: 'parler', english: 'to speak' },
  { french: 'comprendre', english: 'to understand' },
  { french: 'apprendre', english: 'to learn' },
  { french: 'maison', english: 'house' },
  { french: 'travail', english: 'work' },
  { french: 'école', english: 'school' },
  { french: "aujourd'hui", english: 'today' },
];

export default function VocabPractice() {
  const { cards, dueCards, addCard, reviewCard, stats } = useVocabDeck();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedToday, setReviewedToday] = useState(0);
  const [seeded, setSeeded] = useState(false);

  // Seed on first load if deck is empty
  useEffect(() => {
    if (!seeded && cards.length === 0) {
      SEED_WORDS.forEach(({ french, english }) => addCard(french, english));
      setSeeded(true);
    }
  }, [seeded, cards.length, addCard]);

  const handleRate = (rating: Rating) => {
    const card = dueCards[currentIndex];
    if (!card) return;
    reviewCard(card.id, rating);
    setReviewedToday((n) => n + 1);
    setCurrentIndex((prev) => Math.min(prev + 1, dueCards.length));
  };

  const allDone = dueCards.length === 0 || currentIndex >= dueCards.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Vocabulary Practice</h1>
                <p className="text-xs text-gray-500">Spaced Repetition (SM-2)</p>
              </div>
            </div>
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats widget */}
        <VocabDeckStats
          total={stats.total}
          dueToday={stats.dueToday}
          masteredCount={stats.masteredCount}
          reviewedToday={reviewedToday}
          onAddCard={addCard}
        />

        {/* Practice area */}
        {dueCards.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 space-y-4">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-700">No cards due today</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Add some words to your deck or come back tomorrow to review scheduled cards.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                // Scroll stats section into view which has the Add Word form
                const statsEl = document.querySelector('[data-vocab-stats]');
                if (statsEl) statsEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              Add your first word
            </Button>
          </div>
        ) : allDone ? (
          /* Completion state */
          <div className="text-center py-16 space-y-4">
            <div className="flex justify-center">
              <PartyPopper className="w-16 h-16 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">All done for today!</h2>
            <p className="text-gray-500">
              You reviewed {reviewedToday} card{reviewedToday !== 1 ? 's' : ''}. Come back tomorrow for your next session.
            </p>
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setReviewedToday(0);
              }}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Review again
            </Button>
          </div>
        ) : (
          /* Active practice */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Card {currentIndex + 1} of {dueCards.length}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {dueCards.length - currentIndex - 1} remaining
              </span>
            </div>

            {/* Progress bar for session */}
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex) / dueCards.length) * 100}%` }}
              />
            </div>

            <FlashCard
              key={dueCards[currentIndex]?.id}
              card={dueCards[currentIndex]}
              onRate={handleRate}
            />
          </div>
        )}
      </main>
    </div>
  );
}
