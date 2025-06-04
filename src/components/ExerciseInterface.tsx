
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

// Enhanced exercise data with exercises for all topics
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

  'si-present-futur': [
    {
      type: 'complex_text',
      prompt: 'Complétez avec si + présent + futur simple:',
      text: 'Si tu ____ (étudier) régulièrement, tu ____ (réussir) tes examens. Si nous ____ (partir) maintenant, nous ____ (arriver) à l\'heure. Si elle ____ (venir) demain, je ____ (être) très content.',
      blanks: [
        { position: 0, options: ['étudies', 'étudieras', 'étudiais'] },
        { position: 1, options: ['réussiras', 'réussis', 'réussirais'] },
        { position: 2, options: ['partons', 'partirons', 'partions'] },
        { position: 3, options: ['arriverons', 'arrivons', 'arriverions'] },
        { position: 4, options: ['vient', 'viendra', 'venait'] },
        { position: 5, options: ['serai', 'suis', 'serais'] }
      ],
      answer: 'étudies,réussiras,partons,arriverons,vient,serai',
      hint: 'Si + présent, puis futur simple pour exprimer une conséquence',
      explanation: 'La structure "si + présent + futur" exprime une condition et sa conséquence probable.'
    },
    {
      type: 'multiple_choice',
      prompt: 'Quelles phrases utilisent correctement si + présent + futur?',
      choices: ['Si il pleut, je resterai à la maison', 'Si tu viendras, nous serons contents', 'Si nous partons tôt, nous arriverons à temps', 'Si elle aura le temps, elle nous aidera'],
      answer: 'Si il pleut, je resterai à la maison,Si nous partons tôt, nous arriverons à temps',
      hint: 'Présent après "si", futur dans la principale',
      explanation: 'On utilise le présent après "si" et le futur dans la proposition principale.'
    }
  ],

  'temps-passe': [
    {
      type: 'complex_text',
      prompt: 'Complétez ce récit avec les temps du passé appropriés:',
      text: 'Hier, Marie ____ (se promener) dans le parc quand elle ____ (entendre) un bruit étrange. Elle ____ (s\'arrêter) et ____ (regarder) autour d\'elle. Un chat ____ (sortir) des buissons. Marie ____ (sourire) car elle ____ (avoir) peur pour rien.',
      blanks: [
        { position: 0, options: ['se promenait', 's\'est promenée', 's\'était promenée'] },
        { position: 1, options: ['a entendu', 'entendait', 'avait entendu'] },
        { position: 2, options: ['s\'arrêtait', 's\'est arrêtée', 's\'était arrêtée'] },
        { position: 3, options: ['regardait', 'a regardé', 'avait regardé'] },
        { position: 4, options: ['sortait', 'est sorti', 'était sorti'] },
        { position: 5, options: ['souriait', 'a souri', 'avait souri'] },
        { position: 6, options: ['avait eu', 'a eu', 'avait'] }
      ],
      answer: 'se promenait,a entendu,s\'est arrêtée,a regardé,est sorti,a souri,avait eu',
      hint: 'Imparfait pour le décor, passé composé pour les actions, plus-que-parfait pour l\'antériorité',
      explanation: 'L\'imparfait décrit le contexte, le passé composé les actions principales, le plus-que-parfait l\'antériorité.'
    },
    {
      type: 'multiple_choice',
      prompt: 'Quels temps expriment une action terminée dans le passé?',
      choices: ['Imparfait', 'Passé composé', 'Plus-que-parfait', 'Présent'],
      answer: 'Passé composé,Plus-que-parfait',
      hint: 'Cherchez les temps qui marquent l\'aspect accompli',
      explanation: 'Le passé composé et le plus-que-parfait expriment des actions accomplies.'
    }
  ],

  'conditionnel': [
    {
      type: 'complex_text',
      prompt: 'Complétez avec le conditionnel approprié:',
      text: 'À ta place, je ____ (partir) plus tôt. ____ (pouvoir)-vous m\'aider ? Nous ____ (aimer) visiter ce musée. Il ____ (falloir) que tu études davantage.',
      blanks: [
        { position: 0, options: ['partirais', 'partirai', 'partais'] },
        { position: 1, options: ['Pourriez', 'Pouvez', 'Pouviez'] },
        { position: 2, options: ['aimerions', 'aimerons', 'aimions'] },
        { position: 3, options: ['faudrait', 'faudra', 'fallait'] }
      ],
      answer: 'partirais,Pourriez,aimerions,faudrait',
      hint: 'Le conditionnel exprime la politesse, le souhait, le conseil',
      explanation: 'Le conditionnel sert à exprimer la politesse, les souhaits et les conseils.'
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
      type: 'complex_text',
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
    },
    {
      type: 'multiple_choice',
      prompt: 'Quels adverbes sont correctement formés?',
      choices: ['rapidement', 'facilement', 'gentillement', 'vraiment'],
      answer: 'rapidement,facilement,vraiment',
      hint: 'Attention aux doubles consonnes',
      explanation: 'On dit "gentiment" (pas gentillement). Les autres sont corrects.'
    }
  ],

  'hypothese-si': [
    {
      type: 'complex_text',
      prompt: 'Complétez avec si + imparfait + conditionnel:',
      text: 'Si j\' ____ (être) riche, j\' ____ (acheter) une grande maison. Si tu ____ (avoir) plus de temps, que ____ (faire)-tu ? Si nous ____ (habiter) près de la mer, nous ____ (se baigner) tous les jours.',
      blanks: [
        { position: 0, options: ['étais', 'suis', 'serais'] },
        { position: 1, options: ['achèterais', 'achète', 'achèterai'] },
        { position: 2, options: ['avais', 'as', 'aurais'] },
        { position: 3, options: ['ferais', 'fais', 'feras'] },
        { position: 4, options: ['habitions', 'habitons', 'habiterions'] },
        { position: 5, options: ['nous baignerions', 'nous baignons', 'nous baignerons'] }
      ],
      answer: 'étais,achèterais,avais,ferais,habitions,nous baignerions',
      hint: 'Si + imparfait, conditionnel pour exprimer l\'hypothèse',
      explanation: 'Pour une hypothèse irréelle au présent : si + imparfait + conditionnel présent.'
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

  'questions-formelles': [
    {
      type: 'complex_text',
      prompt: 'Transformez ces questions familières en questions formelles:',
      text: 'Tu peux m\'aider ? → ____ -vous m\'aider ? | Vous venez quand ? → Quand ____ -vous ? | Qu\'est-ce que vous faites ? → Que ____ -vous ?',
      blanks: [
        { position: 0, options: ['Pouvez', 'Pourriez', 'Pouviez'] },
        { position: 1, options: ['venez', 'viendrez', 'veniez'] },
        { position: 2, options: ['faites', 'ferez', 'feriez'] }
      ],
      answer: 'Pourriez,venez,faites',
      hint: 'Utilisez l\'inversion du sujet et les formes polies',
      explanation: 'Les questions formelles utilisent l\'inversion verbe-sujet et des formes de politesse.'
    }
  ],

  'adjectifs-indefinis': [
    {
      type: 'complex_text',
      prompt: 'Complétez avec les adjectifs indéfinis appropriés:',
      text: '____ les étudiants ont réussi l\'examen. ____ personnes sont venues à la réunion. J\'ai lu ____ livres intéressants. ____ problèmes restent à résoudre.',
      blanks: [
        { position: 0, options: ['Tous', 'Quelques', 'Certains'] },
        { position: 1, options: ['Plusieurs', 'Toutes', 'Quelques'] },
        { position: 2, options: ['quelques', 'tous', 'certains'] },
        { position: 3, options: ['Certains', 'Tous', 'Quelques'] }
      ],
      answer: 'Tous,Plusieurs,quelques,Certains',
      hint: 'Attention aux accords et au sens de chaque adjectif',
      explanation: 'Chaque adjectif indéfini a un sens précis : tous (totalité), plusieurs (quantité), quelques (petit nombre), certains (une partie).'
    }
  ],

  'superlatif': [
    {
      type: 'complex_text',
      prompt: 'Complétez avec le superlatif approprié:',
      text: 'C\'est ____ livre ____ intéressant de la bibliothèque. Marie est ____ étudiante ____ travailleuse de la classe. Ce restaurant sert ____ plats ____ délicieux de la ville.',
      blanks: [
        { position: 0, options: ['le', 'la', 'les'] },
        { position: 1, options: ['le plus', 'la plus', 'les plus'] },
        { position: 2, options: ['la', 'le', 'l\''] },
        { position: 3, options: ['la plus', 'le plus', 'les plus'] },
        { position: 4, options: ['les', 'le', 'la'] },
        { position: 5, options: ['les plus', 'le plus', 'la plus'] }
      ],
      answer: 'le,le plus,la,la plus,les,les plus',
      hint: 'Accord de l\'article avec le nom qualifié',
      explanation: 'Le superlatif s\'accorde avec le nom : le/la/les + plus/moins + adjectif.'
    }
  ],

  'pronoms-cod-coi': [
    {
      type: 'complex_text',
      prompt: 'Remplacez les compléments par les pronoms appropriés:',
      text: 'Je donne le livre à Marie → Je ____ ____ donne. | Nous regardons les photos → Nous ____ regardons. | Il parle à ses parents → Il ____ parle.',
      blanks: [
        { position: 0, options: ['le', 'la', 'lui'] },
        { position: 1, options: ['lui', 'la', 'le'] },
        { position: 2, options: ['les', 'leur', 'en'] },
        { position: 3, options: ['leur', 'les', 'y'] }
      ],
      answer: 'le,lui,les,leur',
      hint: 'COD avant COI, attention aux personnes et aux choses',
      explanation: 'Le/la/les (COD), lui/leur (COI personnes), y/en (COI choses/lieux).'
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

  'marqueurs-temporels': [
    {
      type: 'complex_text',
      prompt: 'Complétez avec les marqueurs temporels appropriés:',
      text: 'Je l\'ai vu ____ trois jours. J\'habite ici ____ 2020. Le cours dure ____ deux heures. Je partirai ____ une semaine.',
      blanks: [
        { position: 0, options: ['il y a', 'depuis', 'pendant'] },
        { position: 1, options: ['depuis', 'il y a', 'dans'] },
        { position: 2, options: ['pendant', 'depuis', 'il y a'] },
        { position: 3, options: ['dans', 'depuis', 'il y a'] }
      ],
      answer: 'il y a,depuis,pendant,dans',
      hint: 'Il y a (passé), depuis (durée qui continue), pendant (durée limitée), dans (futur)',
      explanation: 'Il y a = moment passé, depuis = durée continue, pendant = durée définie, dans = moment futur.'
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
    },
    {
      type: 'complex_text',
      prompt: 'Transformez ces phrases à la forme négative:',
      text: 'Il mange toujours → Il ne mange ____. | Elle voit quelqu\'un → Elle ne voit ____. | Nous faisons quelque chose → Nous ne faisons ____.',
      blanks: [
        { position: 0, options: ['jamais', 'plus', 'rien'] },
        { position: 1, options: ['personne', 'rien', 'jamais'] },
        { position: 2, options: ['rien', 'personne', 'plus'] }
      ],
      answer: 'jamais,personne,rien',
      hint: 'toujours ↔ jamais, quelqu\'un ↔ personne, quelque chose ↔ rien',
      explanation: 'Chaque mot positif a son équivalent négatif : toujours/jamais, quelqu\'un/personne, quelque chose/rien.'
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
