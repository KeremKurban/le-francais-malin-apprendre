import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, Circle, Book, X } from 'lucide-react';
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

// Enhanced exercise data with more interactive exercises for all topics
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
      type: 'error_correction',
      prompt: 'Corrigez les erreurs dans ces phrases (cliquez sur les mots incorrects):',
      text: 'Si tu vas au marché, tu achètes du pain. Si vous voulez, vous venez avec moi. Si nous partons maintenant, nous prenons le bus.',
      words: ['Si', 'tu', 'vas', 'au', 'marché,', 'tu', 'achètes', 'du', 'pain.', 'Si', 'vous', 'voulez,', 'vous', 'venez', 'avec', 'moi.', 'Si', 'nous', 'partons', 'maintenant,', 'nous', 'prenons', 'le', 'bus.'],
      answer: '6,13,22',
      hint: 'Remplacez les formes indicatives par l\'impératif après les conditions',
      explanation: 'Après une condition au présent, on utilise l\'impératif : "achète", "venez", "prenons".'
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
    },
    {
      type: 'multiple_choice',
      prompt: 'Quels articulateurs expriment une opposition? (Sélectionnez toutes les bonnes réponses)',
      choices: ['Cependant', 'En outre', 'Néanmoins', 'Par ailleurs', 'Pourtant', 'De plus'],
      answer: 'Cependant,Néanmoins,Pourtant',
      hint: 'Cherchez les mots qui introduisent une idée contraire',
      explanation: 'Les articulateurs d\'opposition sont : cependant, néanmoins, pourtant.'
    }
  ],

  'adverbes-ment': [
    {
      type: 'transformation',
      prompt: 'Transformez ces expressions en adverbes en "-ment":',
      text: 'avec politesse → ____  |  de manière sérieuse → ____  |  de façon prudente → ____  |  avec clarté → ____',
      blanks: [
        { position: 0, options: ['poliment', 'politesse', 'poli'] },
        { position: 1, options: ['sérieusement', 'sérieuse', 'sérieux'] },
        { position: 2, options: ['prudemment', 'prudente', 'prudent'] },
        { position: 3, options: ['clairement', 'claire', 'clarté'] }
      ],
      answer: 'poliment,sérieusement,prudemment,clairement',
      hint: 'Adjectif féminin + -ment (attention aux exceptions)',
      explanation: 'Formation : adjectif au féminin + -ment. Exceptions : prudent → prudemment.'
    }
  ],

  'plus-que-parfait': [
    {
      type: 'complex_text',
      prompt: 'Complétez ce récit en utilisant les temps appropriés:',
      text: 'Hier soir, quand je ____ (arriver) au cinéma, le film ____ (déjà commencer). Mes amis m\'____ (attendre) dans le hall car ils ____ (acheter) les billets à l\'avance. Nous ____ (entrer) discrètement dans la salle qui ____ (être) déjà plongée dans l\'obscurité.',
      blanks: [
        { position: 0, options: ['suis arrivé', 'arrivais', 'étais arrivé'] },
        { position: 1, options: ['avait déjà commencé', 'a déjà commencé', 'commençait déjà'] },
        { position: 2, options: ['attendaient', 'ont attendu', 'avaient attendu'] },
        { position: 3, options: ['achetaient', 'avaient acheté', 'ont acheté'] },
        { position: 4, options: ['sommes entrés', 'entrions', 'étions entrés'] },
        { position: 5, options: ['était', 'a été', 'avait été'] }
      ],
      answer: 'suis arrivé,avait déjà commencé,attendaient,avaient acheté,sommes entrés,était',
      hint: 'Plus-que-parfait = action antérieure à une autre action passée',
      explanation: 'Le plus-que-parfait exprime l\'antériorité par rapport à un autre moment du passé.'
    }
  ],

  'subjonctif-obligation': [
    {
      type: 'complex_text',
      prompt: 'Complétez avec le subjonctif ou l\'indicatif selon le contexte:',
      text: 'Il faut que tu ____ (comprendre) cette règle. Je pense qu\'il ____ (avoir) raison. Il est nécessaire que nous ____ (finir) ce projet. Je suis sûr qu\'elle ____ (venir) demain.',
      blanks: [
        { position: 0, options: ['comprennes', 'comprends', 'comprendras'] },
        { position: 1, options: ['ait', 'a', 'aura'] },
        { position: 2, options: ['finissions', 'finissons', 'finirons'] },
        { position: 3, options: ['vienne', 'vient', 'viendra'] }
      ],
      answer: 'comprennes,a,finissions,viendra',
      hint: 'Subjonctif après les expressions d\'obligation, indicatif après les expressions de certitude',
      explanation: 'Le subjonctif s\'utilise après les expressions d\'obligation, l\'indicatif après les expressions de certitude.'
    }
  ],

  'pronoms-relatifs': [
    {
      type: 'complex_text',
      prompt: 'Complétez avec les pronoms relatifs appropriés:',
      text: 'Voici l\'ami ____ je t\'ai parlé. C\'est une personne ____ j\'admire beaucoup. Il travaille dans une entreprise ____ le siège se trouve à Paris. C\'est quelqu\'un sur ____ on peut compter.',
      blanks: [
        { position: 0, options: ['dont', 'que', 'qui'] },
        { position: 1, options: ['que', 'qui', 'dont'] },
        { position: 2, options: ['dont', 'que', 'où'] },
        { position: 3, options: ['qui', 'lequel', 'que'] }
      ],
      answer: 'dont,que,dont,qui',
      hint: 'Attention aux prépositions et aux constructions verbales',
      explanation: 'Le choix du pronom relatif dépend de sa fonction et de la construction du verbe.'
    }
  ],

  'negation': [
    {
      type: 'multiple_choice',
      prompt: 'Quelles sont les formes correctes de négation? (Sélectionnez toutes les bonnes réponses)',
      choices: ['Je ne vois personne', 'Je vois ne personne', 'Il ne mange rien', 'Il mange ne rien', 'Nous ne parlons jamais', 'Nous parlons ne jamais'],
      answer: 'Je ne vois personne,Il ne mange rien,Nous ne parlons jamais',
      hint: 'La négation encadre le verbe conjugué',
      explanation: 'En français, "ne" se place avant le verbe et le deuxième élément après.'
    }
  ]
};

const ExerciseInterface = ({ topic, onComplete, onBack }: ExerciseInterfaceProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [answerFeedback, setAnswerFeedback] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const exercises = topic ? (exerciseData[topic.id] || []) : [];
  const exercise = exercises[currentExercise];

  useEffect(() => {
    if (exercise) {
      if (exercise.type === 'multiple_choice') {
        setSelectedAnswers([]);
      } else if (exercise.type === 'error_correction') {
        setSelectedWords([]);
      } else {
        const blanksCount = exercise.blanks?.length || 0;
        setSelectedAnswers(new Array(blanksCount).fill(''));
      }
      setAnswerFeedback({});
    }
  }, [currentExercise, exercise]);

  const handleAnswerSelect = (index: number, answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[index] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleMultipleChoiceSelect = (choice: string) => {
    setSelectedAnswers(prev => 
      prev.includes(choice) 
        ? prev.filter(a => a !== choice)
        : [...prev, choice]
    );
  };

  const handleWordSelect = (wordIndex: number) => {
    setSelectedWords(prev => 
      prev.includes(wordIndex)
        ? prev.filter(i => i !== wordIndex)
        : [...prev, wordIndex]
    );
  };

  const handleAnswerSubmit = () => {
    if (!exercise) return;
    
    let userAnswer = '';
    let correct = false;

    if (exercise.type === 'multiple_choice') {
      userAnswer = selectedAnswers.sort().join(',');
      correct = userAnswer === exercise.answer;
      
      // Create feedback for each choice
      const correctAnswers = exercise.answer.split(',');
      const feedback: {[key: string]: boolean} = {};
      exercise.choices?.forEach(choice => {
        if (selectedAnswers.includes(choice)) {
          feedback[choice] = correctAnswers.includes(choice);
        }
      });
      setAnswerFeedback(feedback);
    } else if (exercise.type === 'error_correction') {
      userAnswer = selectedWords.sort((a, b) => a - b).join(',');
      correct = userAnswer === exercise.answer;
    } else {
      userAnswer = selectedAnswers.join(',');
      correct = userAnswer === exercise.answer;
    }

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
      setSelectedWords([]);
      setShowResult(false);
      setShowHint(false);
      setAnswerFeedback({});
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

    if (exercise.type === 'multiple_choice') {
      return (
        <div className="space-y-6">
          <div className="text-lg font-medium text-gray-900 mb-4">
            {exercise.prompt}
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {exercise.choices?.map((choice, index) => {
              const isSelected = selectedAnswers.includes(choice);
              const isCorrectChoice = exercise.answer.split(',').includes(choice);
              const showFeedback = showResult && isSelected;
              
              return (
                <div
                  key={index}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? showFeedback
                        ? answerFeedback[choice]
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => !showResult && handleMultipleChoiceSelect(choice)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? showFeedback
                          ? answerFeedback[choice]
                            ? 'border-green-500 bg-green-500'
                            : 'border-red-500 bg-red-500'
                          : 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        showFeedback
                          ? answerFeedback[choice]
                            ? <Check className="w-3 h-3 text-white" />
                            : <X className="w-3 h-3 text-white" />
                          : <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="font-medium">{choice}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (exercise.type === 'error_correction') {
      return (
        <div className="space-y-6">
          <div className="text-lg font-medium text-gray-900 mb-4">
            {exercise.prompt}
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
            <div className="text-base leading-relaxed flex flex-wrap gap-2">
              {exercise.words?.map((word, index) => {
                const isSelected = selectedWords.includes(index);
                const isCorrectError = exercise.answer.split(',').includes(index.toString());
                const showFeedback = showResult && isSelected;
                
                return (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded cursor-pointer transition-all ${
                      isSelected
                        ? showFeedback
                          ? isCorrectError
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                          : 'bg-blue-200 text-blue-800'
                        : 'hover:bg-gray-200'
                    }`}
                    onClick={() => !showResult && handleWordSelect(index)}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

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

  const canSubmit = () => {
    if (exercise.type === 'multiple_choice') {
      return selectedAnswers.length > 0;
    } else if (exercise.type === 'error_correction') {
      return selectedWords.length > 0;
    } else {
      return selectedAnswers.every(answer => answer !== '');
    }
  };

  if (!topic || !exercise) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Aucun exercice disponible pour ce sujet.</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
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
          <ArrowLeft className="w-4 h-4 mr-2" />
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
            Exercice {currentExercise + 1} - {exercise.type === 'multiple_choice' ? 'Choix multiples' : exercise.type === 'error_correction' ? 'Correction d\'erreurs' : 'Texte complexe'}
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
                  disabled={!canSubmit()}
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
