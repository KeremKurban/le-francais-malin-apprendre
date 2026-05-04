import { useState } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getDailyChallengeState,
  markTodayComplete,
  getCalendarDays,
  DailyChallengeState,
} from '@/utils/dailyChallenge';

interface DailyChallengeProps {
  onStartChallenge: () => void;
}

// Day-of-week letter headers starting Monday
const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function getSquareClasses(
  practiced: boolean,
  isToday: boolean
): string {
  const base = 'w-6 h-6 rounded-sm transition-colors';
  if (isToday && practiced) return `${base} bg-green-500 ring-2 ring-green-600`;
  if (isToday && !practiced) return `${base} bg-blue-200 ring-2 ring-blue-400`;
  if (practiced) return `${base} bg-green-400`;
  return `${base} bg-gray-100`;
}

export default function DailyChallenge({ onStartChallenge }: DailyChallengeProps) {
  const [state, setState] = useState<DailyChallengeState>(() => getDailyChallengeState());

  const handleStart = () => {
    const updated = markTodayComplete();
    setState(updated);
    onStartChallenge();
  };

  const calendarDays = getCalendarDays(35);

  // Determine the day-of-week index (0=Mon … 6=Sun) of the first calendar day
  // so we can render proper column headers aligned correctly.
  // We always render a flat 5×7 grid, columns L M M J V S D (Mon–Sun).
  // The first day index tells us where day 0 sits in the week.
  const firstDate = new Date(calendarDays[0].date + 'T00:00:00');
  // JS getDay(): 0=Sun,1=Mon,...,6=Sat → convert to Mon-based: (day+6)%7
  const firstDayOfWeek = (firstDate.getDay() + 6) % 7;

  // We build a padded array so the grid always starts on Monday
  const paddedDays: Array<{ date: string; practiced: boolean; isToday: boolean } | null> = [
    ...Array(firstDayOfWeek).fill(null),
    ...calendarDays,
  ];

  return (
    <div className="w-full space-y-4">
      {/* Challenge Card */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div
          className="p-6 text-white"
          style={{
            background: 'linear-gradient(135deg, #0055A4 0%, #003d78 50%, #002855 100%)',
          }}
        >
          {/* Streak badge */}
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-6 h-6 text-orange-400" />
            <span className="text-lg font-semibold text-orange-200">
              {state.streak > 0
                ? `${state.streak} jour${state.streak > 1 ? 's' : ''} de suite`
                : 'Commencez votre série !'}
            </span>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-7 h-7 text-yellow-300" />
            <h2 className="text-2xl font-bold tracking-tight">Défi du jour</h2>
          </div>

          {/* Subtitle */}
          <p className="text-blue-200 mb-6 text-sm leading-relaxed max-w-md">
            Complétez un exercice en mode IA pour maintenir votre série
          </p>

          {/* CTA Button */}
          <Button
            onClick={handleStart}
            disabled={state.todayCompleted}
            className={
              state.todayCompleted
                ? 'bg-green-500 hover:bg-green-500 text-white cursor-default font-semibold'
                : 'bg-white text-blue-800 hover:bg-blue-50 font-semibold shadow-lg'
            }
          >
            {state.todayCompleted ? 'Défi complété ✓' : 'Commencer le défi'}
          </Button>
        </div>
      </Card>

      {/* Heatmap Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-700">
            Historique des 5 dernières semaines
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Vert = jour pratiqué · Bleu = aujourd'hui · Gris = non pratiqué
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Column headers: Mon–Sun */}
          <div className="grid grid-cols-7 gap-1 mb-1 w-fit">
            {DAY_LETTERS.map((letter, i) => (
              <span
                key={i}
                className="w-6 text-center text-xs font-medium text-gray-400"
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Grid of squares — rows of 7, left to right Mon–Sun */}
          <div className="grid grid-cols-7 gap-1 w-fit">
            {paddedDays.map((day, idx) => {
              if (!day) {
                // Empty cell before the first day
                return <div key={`pad-${idx}`} className="w-6 h-6" />;
              }
              return (
                <div
                  key={day.date}
                  title={day.date}
                  className={getSquareClasses(day.practiced, day.isToday)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
