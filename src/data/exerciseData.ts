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

export const exerciseData: Record<string, Exercise[]> = {
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
