import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MapPin, BookOpen, Mic, PenLine } from 'lucide-react';
import { api, Topic } from '@/api/backendClient';

interface Props {
  onTopicSelect: (topic: Topic) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-green-100 text-green-800 border-green-200',
  A2: 'bg-blue-100 text-blue-800 border-blue-200',
  B1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  B2: 'bg-red-100 text-red-800 border-red-200',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  grammar: <BookOpen className="w-4 h-4" />,
  vocabulary: <PenLine className="w-4 h-4" />,
  communication: <Mic className="w-4 h-4" />,
  writing: <PenLine className="w-4 h-4" />,
};

export default function TopicMap({ onTopicSelect }: Props) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<'FIDE' | 'DELF'>('FIDE');
  const [activeLevel, setActiveLevel] = useState<string>('all');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getTopics();
      setTopics(data.topics);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="py-8 text-center text-red-600">{error}</CardContent>
      </Card>
    );
  }

  const fideTopics = topics.filter(t => t.exam_type === 'FIDE' || t.exam_type === 'BOTH');
  const delfTopics = topics.filter(t => t.exam_type === 'DELF' || t.exam_type === 'BOTH');
  const delfLevels = ['all', 'A1', 'A2', 'B1', 'B2'];

  const filteredDelf = activeLevel === 'all'
    ? delfTopics
    : delfTopics.filter(t => t.level === activeLevel);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Carte des thèmes</h2>
        <p className="text-gray-600 mt-1">Choisissez un thème pour générer un exercice IA personnalisé</p>
      </div>

      <Tabs value={activeExam} onValueChange={v => setActiveExam(v as 'FIDE' | 'DELF')}>
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="FIDE">
            <MapPin className="w-4 h-4 mr-2" /> FIDE
          </TabsTrigger>
          <TabsTrigger value="DELF">
            <BookOpen className="w-4 h-4 mr-2" /> DELF
          </TabsTrigger>
        </TabsList>

        {/* FIDE Tab */}
        <TabsContent value="FIDE" className="mt-6">
          <p className="text-sm text-gray-600 mb-4">
            Situations de la vie quotidienne en Suisse — banque, santé, logement, travail…
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fideTopics.map(topic => (
              <TopicCard key={topic.id} topic={topic} onSelect={onTopicSelect} showLevel={false} />
            ))}
          </div>
        </TabsContent>

        {/* DELF Tab */}
        <TabsContent value="DELF" className="mt-6">
          <div className="flex gap-2 mb-4 flex-wrap">
            {delfLevels.map(level => (
              <Button
                key={level}
                variant={activeLevel === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveLevel(level)}
                className={activeLevel === level && level !== 'all' ? LEVEL_COLORS[level] : ''}
              >
                {level === 'all' ? 'Tous les niveaux' : level}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDelf.map(topic => (
              <TopicCard key={topic.id} topic={topic} onSelect={onTopicSelect} showLevel />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TopicCard({ topic, onSelect, showLevel }: { topic: Topic; onSelect: (t: Topic) => void; showLevel: boolean }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
      onClick={() => onSelect(topic)}
    >
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold group-hover:text-blue-700 transition-colors">
            {topic.name}
          </CardTitle>
          <div className="flex gap-1 flex-shrink-0">
            {showLevel && topic.level && (
              <Badge className={`text-xs ${LEVEL_COLORS[topic.level] ?? ''}`}>
                {topic.level}
              </Badge>
            )}
            {topic.swiss_context && (
              <Badge className="text-xs bg-red-50 text-red-600 border-red-200">🇨🇭</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-gray-600 line-clamp-2">{topic.description}</p>
        <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
          {CATEGORY_ICONS[topic.category]}
          <span className="capitalize">{topic.category}</span>
        </div>
      </CardContent>
    </Card>
  );
}
