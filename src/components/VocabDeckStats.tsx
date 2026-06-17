import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Star, Zap, Plus } from 'lucide-react';

interface VocabDeckStatsProps {
  total: number;
  dueToday: number;
  masteredCount: number;
  reviewedToday: number;
  onAddCard: (french: string, english: string, example?: string) => void;
}

export default function VocabDeckStats({
  total,
  dueToday,
  masteredCount,
  reviewedToday,
  onAddCard,
}: VocabDeckStatsProps) {
  const [french, setFrench] = useState('');
  const [english, setEnglish] = useState('');
  const [example, setExample] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    const trimmedFrench = french.trim();
    const trimmedEnglish = english.trim();
    if (!trimmedFrench || !trimmedEnglish) return;
    onAddCard(trimmedFrench, trimmedEnglish, example.trim() || undefined);
    setFrench('');
    setEnglish('');
    setExample('');
    setShowForm(false);
  };

  const progressPercent = dueToday > 0 ? Math.min(100, Math.round((reviewedToday / dueToday) * 100)) : 100;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Vocab Deck
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">Total cards</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-orange-600">{dueToday}</p>
              {dueToday > 0 && (
                <Badge className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0 leading-5">Due</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">Due today</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-emerald-600">{masteredCount}</p>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-500">Mastered</p>
          </div>
        </div>

        {/* Today's progress bar */}
        {dueToday > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                Today's progress
              </span>
              <span>{reviewedToday} / {dueToday} reviewed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Add word form */}
        {showForm ? (
          <div className="space-y-2 border-t pt-3">
            <Input
              placeholder="French word or phrase"
              value={french}
              onChange={(e) => setFrench(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="English translation"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Example sentence (optional)"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!french.trim() || !english.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Word
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
