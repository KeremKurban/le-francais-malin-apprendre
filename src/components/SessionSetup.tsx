import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Map, Trophy, PenLine } from 'lucide-react';

interface Props {
  onStart: (config: { examType: string; level: string; mode: 'practice' | 'mock_exam' }) => void;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const EXAMS = ['FIDE', 'DELF'];

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: 'Débutant — besoins essentiels',
  A2: 'Élémentaire — vie quotidienne simple',
  B1: 'Intermédiaire — situations courantes',
  B2: 'Avancé — sujets abstraits et formels',
};

const EXAM_DESCRIPTIONS: Record<string, string> = {
  FIDE: 'Vie quotidienne en Suisse — banque, santé, logement, travail',
  DELF: 'Certification DELF — niveaux A1 à B2 du CECR',
};

export default function SessionSetup({ onStart }: Props) {
  const [examType, setExamType] = useState('DELF');
  const [level, setLevel] = useState('B1');

  return (
    <div className="max-w-lg mx-auto py-8 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Nouvelle session</h2>
        <p className="text-gray-600 mt-1">Choisissez votre examen cible et votre niveau</p>
      </div>

      {/* Exam type */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Type d'examen</h3>
        <div className="grid grid-cols-2 gap-3">
          {EXAMS.map(exam => (
            <button
              key={exam}
              onClick={() => setExamType(exam)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                examType === exam
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {exam === 'FIDE' ? (
                  <span className="text-xl">🇨🇭</span>
                ) : (
                  <BookOpen className="w-5 h-5 text-blue-600" />
                )}
                <span className="font-bold text-gray-900">{exam}</span>
              </div>
              <p className="text-xs text-gray-600">{EXAM_DESCRIPTIONS[exam]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Niveau CECR</h3>
        <div className="grid grid-cols-2 gap-3">
          {LEVELS.map(lvl => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                level === lvl
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-bold">{lvl}</Badge>
              </div>
              <p className="text-xs text-gray-600">{LEVEL_DESCRIPTIONS[lvl]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Mode choice */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Mode</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => onStart({ examType, level, mode: 'practice' })}
          >
            <PenLine className="w-6 h-6 text-blue-600" />
            <span className="font-semibold">Pratique libre</span>
            <span className="text-xs text-gray-500 font-normal">Exercices ciblés avec feedback immédiat</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => onStart({ examType, level, mode: 'practice' })}
          >
            <Map className="w-6 h-6 text-green-600" />
            <span className="font-semibold">Par thème</span>
            <span className="text-xs text-gray-500 font-normal">Choisir un thème sur la carte</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => onStart({ examType, level, mode: 'mock_exam' })}
          >
            <Trophy className="w-6 h-6 text-purple-600" />
            <span className="font-semibold">Examen blanc</span>
            <span className="text-xs text-gray-500 font-normal">5 exercices chronométrés</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
