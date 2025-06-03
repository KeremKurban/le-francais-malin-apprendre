
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Exercise data for each topic
const exerciseData = {
  'si-present-imperatif': [
    {
      type: 'fill_in_blank',
      prompt: 'Si tu vois Marie, ____ bonjour de ma part.',
      choices: ['dis', 'dit', 'dire'],
      answer: 'dis',
      hint: 'Impératif de "dire" (2e personne du singulier)',
      explanation: 'Avec "si + présent", on utilise l\'impératif pour donner un conseil ou un ordre.'
    },
    {
      type: 'fill_in_blank',
      prompt: 'Si vous avez froid, ____ la fenêtre.',
      choices: ['fermez', 'fermer', 'ferme'],
      answer: 'fermez',
      hint: 'Impératif de "fermer" (2e personne du pluriel)',
      explanation: 'L\'impératif s\'accorde avec le sujet de la condition (vous).'
    },
    {
      type: 'mcq',
      prompt: 'Si tu es fatigué, ____',
      choices: ['repose-toi', 'tu te reposes', 'reposer'],
      answer: 'repose-toi',
      hint: 'Utilisez l\'impératif avec le pronom réfléchi',
      explanation: 'Avec les verbes pronominaux à l\'impératif, le pronom se place après le verbe.'
    }
  ],
  'si-present-futur': [
    {
      type: 'fill_in_blank',
      prompt: 'Si tu étudies bien, tu ____ l\'examen.',
      choices: ['réussiras', 'réussir', 'réussis'],
      answer: 'réussiras',
      hint: 'Futur simple de "réussir" (2e personne du singulier)',
      explanation: 'Après "si + présent", on utilise le futur simple pour exprimer une conséquence.'
    },
    {
      type: 'mcq',
      prompt: 'Si nous partons maintenant, nous ____ à l\'heure.',
      choices: ['arriverons', 'arrivons', 'arriverions'],
      answer: 'arriverons',
      hint: 'Conséquence future de la condition présente',
      explanation: 'La structure "si + présent + futur" exprime une conséquence probable.'
    }
  ],
  'temps-passe': [
    {
      type: 'fill_in_blank',
      prompt: 'Quand j\'____ enfant, je ____ au football.',
      choices: ['étais, jouais', 'ai été, ai joué', 'étais, ai joué'],
      answer: 'étais, jouais',
      hint: 'Action habituelle dans le passé',
      explanation: 'L\'imparfait exprime une action habituelle ou un état dans le passé.'
    },
    {
      type: 'mcq',
      prompt: 'Hier, je ____ mes devoirs puis je ____ regarder la télé.',
      choices: ['ai fini, suis allé', 'finissais, allais', 'avais fini, suis allé'],
      answer: 'ai fini, suis allé',
      hint: 'Actions successives accomplies hier',
      explanation: 'Le passé composé exprime des actions accomplies et terminées.'
    }
  ],
  'conditionnel': [
    {
      type: 'fill_in_blank',
      prompt: 'À ta place, je ____ plus tôt.',
      choices: ['partirais', 'pars', 'partirai'],
      answer: 'partirais',
      hint: 'Conditionnel pour donner un conseil',
      explanation: 'Le conditionnel présent exprime un conseil ou une suggestion polie.'
    }
  ],
  'mise-en-relief': [
    {
      type: 'mcq',
      prompt: '____ m\'énerve, c\'est le bruit.',
      choices: ['Ce qui', 'Ce que', 'Qu\'est-ce qui'],
      answer: 'Ce qui',
      hint: 'Sujet de la phrase',
      explanation: '"Ce qui" est utilisé comme sujet de la phrase pour mettre en relief.'
    }
  ],
  'pronoms-interrogatifs': [
    {
      type: 'mcq',
      prompt: 'Parmi ces robes, ____ préfères-tu ?',
      choices: ['laquelle', 'lequel', 'lesquelles'],
      answer: 'laquelle',
      hint: 'Accord avec "robe" (féminin singulier)',
      explanation: '"Laquelle" s\'accorde avec le nom féminin singulier "robe".'
    }
  ],
  'place-adverbe': [
    {
      type: 'sentence_order',
      prompt: 'Remettez les mots dans l\'ordre :',
      words: ['Elle', 'va', 'souvent', 'au', 'cinéma'],
      answer: 'Elle va souvent au cinéma.',
      hint: 'L\'adverbe se place après le verbe conjugué',
      explanation: 'Les adverbes de fréquence se placent généralement après le verbe conjugué.'
    }
  ]
};

const ExerciseInterface = ({ topic, onComplete, onBack }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [orderedWords, setOrderedWords] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const { toast } = useToast();

  const exercises = exerciseData[topic.id] || [];
  const exercise = exercises[currentExercise];

  useEffect(() => {
    if (exercise && exercise.type === 'sentence_order') {
      setOrderedWords([]);
    }
  }, [currentExercise, exercise]);

  const handleAnswerSubmit = () => {
    if (!selectedAnswer && exercise.type !== 'sentence_order') return;
    
    let userAnswer = selectedAnswer;
    if (exercise.type === 'sentence_order') {
      userAnswer = orderedWords.join(' ') + '.';
    }

    const correct = userAnswer === exercise.answer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(score + 20);
      toast({
        title: "Correct !",
        description: "Excellente réponse !",
      });
    } else {
      toast({
        title: "Pas tout à fait...",
        description: "Réessayez ou consultez l'explication.",
        variant: "destructive",
      });
    }

    setAnsweredQuestions(answeredQuestions + 1);
  };

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setSelectedAnswer('');
      setOrderedWords([]);
      setShowResult(false);
      setShowHint(false);
    } else {
      // Exercise set complete
      const finalScore = Math.round((score / (exercises.length * 20)) * 100);
      onComplete(finalScore, topic);
      toast({
        title: "Exercices terminés !",
        description: `Score final: ${finalScore}%`,
      });
    }
  };

  const handleWordClick = (word, index) => {
    if (exercise.type === 'sentence_order') {
      setOrderedWords([...orderedWords, word]);
    }
  };

  const handleWordRemove = (index) => {
    const newOrdered = [...orderedWords];
    newOrdered.splice(index, 1);
    setOrderedWords(newOrdered);
  };

  const renderExercise = () => {
    if (!exercise) return null;

    switch (exercise.type) {
      case 'fill_in_blank':
      case 'mcq':
        return (
          <div className="space-y-6">
            <div className="text-lg font-medium text-gray-900">
              {exercise.prompt}
            </div>
            
            <div className="space-y-3">
              {exercise.choices.map((choice, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === choice ? 'default' : 'outline'}
                  className="w-full justify-start text-left h-auto p-4"
                  onClick={() => setSelectedAnswer(choice)}
                  disabled={showResult}
                >
                  {choice}
                </Button>
              ))}
            </div>
          </div>
        );

      case 'sentence_order':
        const availableWords = exercise.words.filter(word => !orderedWords.includes(word));
        
        return (
          <div className="space-y-6">
            <div className="text-lg font-medium text-gray-900">
              {exercise.prompt}
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg min-h-16">
                <div className="flex flex-wrap gap-2">
                  {orderedWords.map((word, index) => (
                    <Button
                      key={index}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleWordRemove(index)}
                      className="cursor-pointer"
                    >
                      {word}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {availableWords.map((word, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleWordClick(word, index)}
                    disabled={showResult}
                  >
                    {word}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!exercise) {
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
          <CardTitle className="text-xl">Exercice {currentExercise + 1}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderExercise()}

          {/* Hint */}
          {showHint && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
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
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? 'Correct !' : `Incorrect. La bonne réponse est : ${exercise.answer}`}
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
              <Lightbulb className="w-4 h-4 mr-2" />
              Indice
            </Button>

            <div className="space-x-3">
              {!showResult ? (
                <Button 
                  onClick={handleAnswerSubmit}
                  disabled={!selectedAnswer && orderedWords.length === 0}
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
