
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Arrow, Check, Circle, Book } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Topic {
  id: string;
  title: string;
  description: string;
  example: string;
  difficulty: string;
  exercises: number;
  color: string;
}

interface Exercise {
  type: string;
  prompt: string;
  text?: string;
  choices?: string[];
  words?: string[];
  answer: string;
  hint: string;
  explanation: string;
  blanks?: { position: number; options: string[] }[];
}

interface ExerciseInterfaceProps {
  topic: Topic | null;
  onComplete: (score: number, topic: Topic) => void;
  onBack: () => void;
}

// Enhanced exercise data with longer, more complex texts
const exerciseData: Record<string, Exercise[]> = {
  'si-present-imperatif': [
    {
      type: 'complex_text',
      prompt: 'Complétez le texte en utilisant la forme correcte (présent + impératif):',
      text: 'Conseils pour bien étudier le français. Si vous ____ (avoir) des difficultés avec la grammaire, ____ (consulter) votre manuel. Si tu ____ (vouloir) améliorer ta prononciation, ____ (écouter) des podcasts français. Si nous ____ (être) fatigués pendant les cours, ____ (faire) une pause de cinq minutes.',
      blanks: [
        { position: 0, options: ['avez', 'avoir', 'aviez'] },
        { position: 1, options: ['consultez', 'consulter', 'consultées'] },
        { position: 2, options: ['veux', 'vouloir', 'voudras'] },
        { position: 3, options: ['écoute', 'écouter', 'écoutez'] },
        { position: 4, options: ['sommes', 'être', 'soyons'] },
        { position: 5, options: ['faisons', 'faire', 'fais'] }
      ],
      answer: 'avez,consultez,veux,écoute,sommes,faisons',
      hint: 'Après "si + présent", utilisez l\'impératif pour donner des conseils',
      explanation: 'La structure "si + présent + impératif" permet de donner des conseils conditionnels.'
    },
    {
      type: 'text_analysis',
      prompt: 'Dans ce dialogue, identifiez et corrigez les erreurs dans l\'usage de "si + présent + impératif":',
      text: 'Marie : "Si tu vas au marché, tu achètes du pain ?" Jean : "Si vous voulez, vous venez avec moi." Sophie : "Si nous partons maintenant, nous prenons le bus."',
      answer: 'achète,venez,prenons',
      hint: 'Remplacez les formes indicatives par l\'impératif après les conditions',
      explanation: 'Après une condition au présent, on utilise l\'impératif pour exprimer une suggestion ou un conseil, pas l\'indicatif.'
    }
  ],
  
  'articulateurs-discours': [
    {
      type: 'complex_text',
      prompt: 'Complétez ce texte argumentatif avec les articulateurs appropriés:',
      text: 'L\'apprentissage des langues présente de nombreux avantages. ____, cela améliore les capacités cognitives. ____, les personnes multilingues ont souvent de meilleures opportunités professionnelles. ____, apprendre une langue permet de découvrir d\'autres cultures. ____, certains estiment que c\'est trop difficile. ____, je pense que les bénéfices dépassent largement les difficultés.',
      blanks: [
        { position: 0, options: ['Tout d\'abord', 'Finalement', 'Cependant'] },
        { position: 1, options: ['En outre', 'Néanmoins', 'D\'abord'] },
        { position: 2, options: ['Par ailleurs', 'Pourtant', 'Donc'] },
        { position: 3, options: ['Cependant', 'De plus', 'Ensuite'] },
        { position: 4, options: ['En conclusion', 'D\'ailleurs', 'Puis'] }
      ],
      answer: 'Tout d\'abord,En outre,Par ailleurs,Cependant,En conclusion',
      hint: 'Organisez logiquement : introduction, arguments pour, objection, conclusion',
      explanation: 'Les articulateurs structurent le discours : d\'abord les arguments positifs, puis l\'objection, enfin la conclusion.'
    }
  ],

  'adverbes-ment': [
    {
      type: 'transformation',
      prompt: 'Transformez ces phrases en remplaçant les expressions par des adverbes en "-ment":',
      text: 'Il répond avec politesse → Il répond ____. Elle travaille avec sérieux → Elle travaille ____. Nous agissons de manière prudente → Nous agissons ____. Ils parlent de façon claire → Ils parlent ____.',
      answer: 'poliment,sérieusement,prudemment,clairement',
      hint: 'Adjectif féminin + -ment (attention aux exceptions)',
      explanation: 'Formation : adjectif au féminin + -ment. Exceptions : prudent → prudemment, violent → violemment.'
    }
  ],

  'plus-que-parfait': [
    {
      type: 'complex_text',
      prompt: 'Complétez ce récit en utilisant les temps appropriés (plus-que-parfait, passé composé, imparfait):',
      text: 'Hier soir, quand je ____ (arriver) au cinéma, le film ____ (déjà commencer). Mes amis m\'____ (attendre) dans le hall car ils ____ (acheter) les billets à l\'avance. Nous ____ (entrer) discrètement dans la salle qui ____ (être) déjà plongée dans l\'obscurité. Le début du film que nous ____ (rater) ____ (sembler) important pour comprendre l\'histoire.',
      blanks: [
        { position: 0, options: ['suis arrivé', 'arrivais', 'étais arrivé'] },
        { position: 1, options: ['avait déjà commencé', 'a déjà commencé', 'commençait déjà'] },
        { position: 2, options: ['attendaient', 'ont attendu', 'avaient attendu'] },
        { position: 3, options: ['achetaient', 'avaient acheté', 'ont acheté'] },
        { position: 4, options: ['sommes entrés', 'entrions', 'étions entrés'] },
        { position: 5, options: ['était', 'a été', 'avait été'] },
        { position: 6, options: ['avions raté', 'avons raté', 'rations'] },
        { position: 7, options: ['semblait', 'a semblé', 'avait semblé'] }
      ],
      answer: 'suis arrivé,avait déjà commencé,attendaient,avaient acheté,sommes entrés,était,avions raté,semblait',
      hint: 'Plus-que-parfait = action antérieure à une autre action passée',
      explanation: 'Le plus-que-parfait exprime l\'antériorité par rapport à un autre moment du passé.'
    }
  ],

  'subjonctif-obligation': [
    {
      type: 'complex_text',
      prompt: 'Complétez avec le subjonctif ou l\'indicatif selon le contexte:',
      text: 'Il faut que tu ____ (comprendre) cette règle. Je pense qu\'il ____ (avoir) raison. Il est nécessaire que nous ____ (finir) ce projet. Je suis sûr qu\'elle ____ (venir) demain. Il vaut mieux que vous ____ (partir) maintenant. Il est probable qu\'ils ____ (arriver) en retard.',
      blanks: [
        { position: 0, options: ['comprennes', 'comprends', 'comprendras'] },
        { position: 1, options: ['ait', 'a', 'aura'] },
        { position: 2, options: ['finissions', 'finissons', 'finirons'] },
        { position: 3, options: ['vienne', 'vient', 'viendra'] },
        { position: 4, options: ['partez', 'partiez', 'partirez'] },
        { position: 5, options: ['arrivent', 'arriveront', 'arrivaient'] }
      ],
      answer: 'comprennes,a,finissions,viendra,partiez,arriveront',
      hint: 'Subjonctif après les expressions d\'obligation, d\'opinion et de certitude → indicatif',
      explanation: 'Le subjonctif s\'utilise après les expressions d\'obligation, de nécessité, mais l\'indicatif après les expressions de certitude.'
    }
  ],

  'pronoms-relatifs': [
    {
      type: 'complex_text',
      prompt: 'Complétez avec les pronoms relatifs appropriés:',
      text: 'Voici l\'ami ____ je t\'ai parlé. C\'est une personne ____ j\'admire beaucoup. Il travaille dans une entreprise ____ siège se trouve à Paris. C\'est quelqu\'un sur ____ on peut compter. La raison pour ____ il a déménagé reste mystérieuse. Le projet sur ____ nous travaillons est très intéressant.',
      blanks: [
        { position: 0, options: ['dont', 'que', 'qui'] },
        { position: 1, options: ['que', 'qui', 'dont'] },
        { position: 2, options: ['dont', 'que', 'où'] },
        { position: 3, options: ['qui', 'lequel', 'que'] },
        { position: 4, options: ['laquelle', 'que', 'qui'] },
        { position: 5, options: ['lequel', 'que', 'dont'] }
      ],
      answer: 'dont,que,dont,qui,laquelle,lequel',
      hint: 'Attention aux prépositions et aux constructions verbales',
      explanation: 'Le choix du pronom relatif dépend de sa fonction et de la construction du verbe (direct, indirect, avec préposition).'
    }
  ]
};

const ExerciseInterface = ({ topic, onComplete, onBack }: ExerciseInterfaceProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  const exercises = topic ? (exerciseData[topic.id] || []) : [];
  const exercise = exercises[currentExercise];

  useEffect(() => {
    if (exercise) {
      const blanksCount = exercise.blanks?.length || exercise.choices?.length || 0;
      setSelectedAnswers(new Array(blanksCount).fill(''));
    }
  }, [currentExercise, exercise]);

  const handleAnswerSelect = (index: number, answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[index] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleAnswerSubmit = () => {
    if (!exercise) return;
    
    const userAnswer = selectedAnswers.join(',');
    const correct = userAnswer === exercise.answer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(score + 25);
      toast({
        title: "Excellent !",
        description: "Votre réponse est parfaite !",
      });
    } else {
      toast({
        title: "Pas tout à fait...",
        description: "Consultez l'explication pour mieux comprendre.",
        variant: "destructive",
      });
    }
  };

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setSelectedAnswers([]);
      setShowResult(false);
      setShowHint(false);
    } else {
      if (topic) {
        const finalScore = Math.round((score / (exercises.length * 25)) * 100);
        onComplete(finalScore, topic);
        toast({
          title: "Exercices terminés !",
          description: `Score final: ${finalScore}%`,
        });
      }
    }
  };

  const renderExercise = () => {
    if (!exercise) return null;

    if (exercise.type === 'complex_text' && exercise.blanks) {
      const textParts = exercise.text?.split('____') || [];
      
      return (
        <div className="space-y-6">
          <div className="text-lg font-medium text-gray-900 mb-4">
            {exercise.prompt}
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
            <div className="text-base leading-relaxed">
              {textParts.map((part, index) => (
                <span key={index}>
                  {part}
                  {index < exercise.blanks!.length && (
                    <select
                      className="mx-2 px-3 py-1 border rounded-md bg-white font-medium text-blue-700 min-w-32"
                      value={selectedAnswers[index] || ''}
                      onChange={(e) => handleAnswerSelect(index, e.target.value)}
                      disabled={showResult}
                    >
                      <option value="">Choisir...</option>
                      {exercise.blanks![index].options.map((option, optIndex) => (
                        <option key={optIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-lg font-medium text-gray-900">
          {exercise.prompt}
        </div>
        
        {exercise.text && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-base leading-relaxed">{exercise.text}</p>
          </div>
        )}
      </div>
    );
  };

  if (!topic || !exercise) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Aucun exercice disponible pour ce sujet.</p>
        <Button onClick={onBack} className="mt-4">
          <Arrow className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <Arrow className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{topic.title}</h2>
          <Badge className="mt-2">{topic.difficulty}</Badge>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">Score</div>
          <div className="text-xl font-bold text-blue-600">{score} pts</div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Question {currentExercise + 1} sur {exercises.length}</span>
          <span>{Math.round(((currentExercise + 1) / exercises.length) * 100)}%</span>
        </div>
        <Progress value={((currentExercise + 1) / exercises.length) * 100} />
      </div>

      {/* Exercise Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Book className="w-5 h-5" />
            Exercice {currentExercise + 1} - Texte complexe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderExercise()}

          {/* Hint */}
          {showHint && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Book className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Indice :</p>
                  <p className="text-yellow-700">{exercise.hint}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {showResult && (
            <div className={`border rounded-lg p-4 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start space-x-2">
                {isCorrect ? (
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? 'Parfait !' : `Réponses correctes : ${exercise.answer.split(',').join(', ')}`}
                  </p>
                  <p className={`text-sm mt-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {exercise.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowHint(true)}
              disabled={showHint}
            >
              <Book className="w-4 h-4 mr-2" />
              Indice
            </Button>

            <div className="space-x-3">
              {!showResult ? (
                <Button 
                  onClick={handleAnswerSubmit}
                  disabled={selectedAnswers.some(answer => !answer)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Vérifier
                </Button>
              ) : (
                <Button onClick={handleNextExercise} className="bg-green-600 hover:bg-green-700">
                  {currentExercise < exercises.length - 1 ? 'Suivant' : 'Terminer'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExerciseInterface;
