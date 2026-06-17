import { useState } from 'react';
import { VocabCard, Rating } from '@/utils/spacedRepetition';
import { Button } from '@/components/ui/button';

interface FlashCardProps {
  card: VocabCard;
  onRate: (rating: Rating) => void;
}

const RATING_BUTTONS: { label: string; rating: Rating; className: string }[] = [
  { label: 'Again (0)', rating: 0, className: 'bg-red-500 hover:bg-red-600 text-white' },
  { label: 'Hard (3)', rating: 3, className: 'bg-orange-400 hover:bg-orange-500 text-white' },
  { label: 'Good (4)', rating: 4, className: 'bg-green-500 hover:bg-green-600 text-white' },
  { label: 'Easy (5)', rating: 5, className: 'bg-blue-500 hover:bg-blue-600 text-white' },
];

export default function FlashCard({ card, onRate }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);

  const handleFlip = () => {
    if (!flipped) setFlipped(true);
  };

  const handleRate = (rating: Rating) => {
    setSelectedRating(rating);
    setTimeout(() => {
      setFlipped(false);
      setSelectedRating(null);
      onRate(rating);
    }, 400);
  };

  const getIntervalText = (rating: Rating): string => {
    if (rating === 0) return 'Next review: tomorrow';
    if (card.repetitions === 0) return 'Next review: tomorrow';
    if (card.repetitions === 1) return 'Next review: in 6 days';
    const nextInterval = Math.round(card.interval * card.easiness);
    return `Next review: in ${nextInterval} day${nextInterval !== 1 ? 's' : ''}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Card container with 3D flip */}
      <div
        className="w-full max-w-lg cursor-pointer"
        style={{ perspective: '1000px', minHeight: '220px' }}
        onClick={handleFlip}
        role="button"
        aria-label={flipped ? 'Card back' : 'Card front — click to reveal'}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '220px',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front face */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            className="rounded-2xl border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex flex-col items-center justify-center p-8"
          >
            <p className="text-xs uppercase tracking-widest text-blue-200 mb-3">French</p>
            <p className="text-4xl font-bold text-center">{card.french}</p>
            {!flipped && (
              <p className="mt-6 text-sm text-blue-200 animate-pulse">Click to reveal</p>
            )}
          </div>

          {/* Back face */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="rounded-2xl border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center p-8"
          >
            <p className="text-xs uppercase tracking-widest text-emerald-200 mb-3">English</p>
            <p className="text-3xl font-bold text-center mb-4">{card.english}</p>
            {card.example && (
              <p className="text-sm text-emerald-100 italic text-center border-t border-emerald-400/40 pt-3">
                "{card.example}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons — only shown when card is flipped */}
      {flipped && (
        <div className="w-full max-w-lg space-y-3">
          <p className="text-sm text-center text-gray-500 font-medium">How well did you know this?</p>
          <div className="grid grid-cols-4 gap-2">
            {RATING_BUTTONS.map(({ label, rating, className }) => (
              <button
                key={rating}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate(rating);
                }}
                disabled={selectedRating !== null}
                className={`rounded-lg py-2 px-1 text-xs font-semibold transition-all ${className} ${
                  selectedRating === rating ? 'opacity-70 scale-95' : 'hover:scale-105'
                } disabled:cursor-not-allowed`}
              >
                {label}
              </button>
            ))}
          </div>
          {selectedRating !== null && (
            <p className="text-xs text-center text-gray-400">{getIntervalText(selectedRating)}</p>
          )}
        </div>
      )}

      {!flipped && (
        <p className="text-xs text-gray-400 text-center">
          Click the card to see the answer
        </p>
      )}
    </div>
  );
}
