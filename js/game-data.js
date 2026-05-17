// ════════════════════════════════════════════════════════════════════════════
//  WORDQUEST — GAME DATA
//  Відредагуй цей файл щоб змінити команди, кеші, пастки та питання.
// ════════════════════════════════════════════════════════════════════════════

'use strict';

// ─── TEAMS ───────────────────────────────────────────────────────────────────
// Variant auto-assignment: team at index 0 → default task,
// team at index N → variants[N-1] (if it exists).

const TEAMS = [
  { id: 'ecorangers',       name: 'Eco Rangers',       emoji: '🍃', color: '#2D7A3D' },
  { id: 'planetprotectors', name: 'Planet Protectors',  emoji: '🌎', color: '#1A6B8A' },
  { id: 'greenexplorers',   name: 'Green Explorers',    emoji: '🌱', color: '#4A8B3A' },
  { id: 'natureguardians',  name: 'Nature Guardians',   emoji: '🦋', color: '#7A4A9A' },
  { id: 'bioheroes',        name: 'Bio Heroes',         emoji: '🐾', color: '#8B5E37' },
];

// ─── CACHES ──────────────────────────────────────────────────────────────────
// 6 caches × 6 questions per team.
// task      = default question  → Team 1 (Eco Rangers)
// variants  = alt questions     → Teams 2-5 (in order)
//
// Fill-in-the-blank English questions use type:'unscramble'.
// Fill-in-the-blank Ukrainian questions use type:'mcq' with 4 choices.

const CACHES = [

  // ── CACHE 1 — English Q1 ──────────────────────────────────────────────────
  {
    id: 'C01',
    qr: 'WQUEST-C01',
    coord: 'A·1',
    clue: '"Where students first enter — look near the classroom door."',
    task: {
      type: 'mcq',
      label: 'TASK · MULTIPLE CHOICE',
      question: 'Which animal lives in eucalyptus forests?',
      options: ['Tiger', 'Koala', 'Panda', 'Eagle'],
      correct: 1,
    },
    variants: [
      {
        type: 'unscramble',
        label: 'TASK · FILL THE GAP',
        question: 'The Arctic is very ______ and icy.',
        scrambled: ['O', 'D', 'C', 'L'],
        answer: 'COLD',
      },
      {
        type: 'mcq',
        label: 'TASK · MULTIPLE CHOICE',
        question: 'Which animal carries pollen?',
        options: ['Elephant', 'Butterfly', 'Whale', 'Tiger'],
        correct: 1,
      },
      {
        type: 'unscramble',
        label: 'TASK · FILL THE GAP',
        question: 'Elephants use their ______ to drink water.',
        scrambled: ['N', 'U', 'T', 'K', 'R'],
        answer: 'TRUNK',
      },
      {
        type: 'mcq',
        label: 'TASK · MULTIPLE CHOICE',
        question: 'What is recycling?',
        options: ['Throwing trash everywhere', 'Using waste again', 'Cutting trees', 'Polluting water'],
        correct: 1,
      },
    ],
    nextClue: '"Where books and knowledge sleep — at the back of the room."',
    nextCoord: 'B·6',
    coins: 30,
  },

  // ── CACHE 2 — English Q2 ──────────────────────────────────────────────────
  {
    id: 'C02',
    qr: 'WQUEST-C02',
    coord: 'B·6',
    clue: '"Where books and knowledge sleep — at the back of the room."',
    task: {
      type: 'mcq',
      label: 'TASK · FILL THE GAP',
      question: 'Polar bears live in the ______.',
      options: ['Rainforest', 'Arctic', 'Savanna', 'Desert'],
      correct: 1,
    },
    variants: [
      {
        type: 'mcq',
        label: 'TASK · MULTIPLE CHOICE',
        question: 'Which ecosystem has almost no trees?',
        options: ['Rainforest', 'Desert', 'Tundra', 'Forest'],
        correct: 2,
      },
      {
        type: 'unscramble',
        label: 'TASK · FILL THE GAP',
        question: 'Macaws live in ______ rainforests.',
        scrambled: ['P', 'T', 'C', 'A', 'L', 'I', 'O', 'R'],
        answer: 'TROPICAL',
      },
      {
        type: 'mcq',
        label: 'TASK · MULTIPLE CHOICE',
        question: 'Which animal is endangered?',
        options: ['Dog', 'Tiger', 'Cat', 'Chicken'],
        correct: 1,
      },
      {
        type: 'unscramble',
        label: 'TASK · FILL THE GAP',
        question: 'A forest produces ______ for people.',
        scrambled: ['Y', 'G', 'E', 'N', 'O', 'X'],
        answer: 'OXYGEN',
      },
    ],
    nextClue: '"Where the teacher writes your future — the great white surface at the front."',
    nextCoord: 'C·1',
    coins: 35,
  },

  // ── CACHE 3 — English Q3 ──────────────────────────────────────────────────
  {
    id: 'C03',
    qr: 'WQUEST-C03',
    coord: 'C·1',
    clue: '"Where the teacher writes your future — the great white surface."',
    task: {
      type: 'mcq',
      label: 'TASK · MULTIPLE CHOICE',
      question: 'Why are forests important?',
      options: ['They produce oxygen', 'They make noise', 'They destroy animals', 'They increase pollution'],
      correct: 0,
    },
    variants: [
      {
        type: 'unscramble',
        label: 'TASK · FILL THE GAP',
        question: 'Climate change causes ice to ______.',
        scrambled: ['T', 'E', 'M', 'L'],
        answer: 'MELT',
      },
      {
        type: 'mcq',
        label: 'TASK · MULTIPLE CHOICE',
        question: 'What do plants need to grow?',
        options: ['Plastic', 'Water and sunlight', 'Smoke', 'Noise'],
        correct: 1,
      },
      {
        type: 'unscramble',
        label: 'TASK · FILL THE GAP',
        question: 'Savanna has many ______ and few trees.',
        scrambled: ['S', 'G', 'E', 'R', 'S', 'A', 'S'],
        answer: 'GRASSES',
      },
      {
        type: 'mcq',
        label: 'TASK · MULTIPLE CHOICE',
        question: 'What helps save biodiversity?',
        options: ['Pollution', 'Planting trees', 'Hunting animals', 'Cutting forests'],
        correct: 1,
      },
    ],
    nextClue: '"Look through the glass at the world outside — nature is calling!"',
    nextCoord: 'A·4',
    coins: 40,
  },

  // ── CACHE 4 — Ukrainian Q4 ────────────────────────────────────────────────
  {
    id: 'C04',
    qr: 'WQUEST-C04',
    coord: 'A·4',
    clue: '"Look through the glass at the world outside."',
    task: {
      type: 'mcq',
      label: 'ЗАВДАННЯ · ВИБІР ВІДПОВІДІ',
      question: 'Що таке біорізноманіття?',
      options: ['Транспорт', 'Різноманіття живих організмів', 'Кількість міст', 'Погода'],
      correct: 1,
    },
    variants: [
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ВИБІР ВІДПОВІДІ',
        question: 'Що таке екосистема?',
        options: ['Лише тварини', 'Взаємозв\'язок живих організмів і природи', 'Будинки', 'Транспорт'],
        correct: 1,
      },
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ВИБІР ВІДПОВІДІ',
        question: 'Який птах живе в тропіках?',
        options: ['Ворона', 'Ара', 'Сова', 'Горобець'],
        correct: 1,
      },
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ВИБІР ВІДПОВІДІ',
        question: 'Яка тварина живе в Арктиці?',
        options: ['Тигр', 'Білий ведмідь', 'Мавпа', 'Лев'],
        correct: 1,
      },
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ВИБІР ВІДПОВІДІ',
        question: 'Що таке сміття?',
        options: ['Кисень', 'Відходи', 'Вода', 'Ліс'],
        correct: 1,
      },
    ],
    nextClue: '"The keeper of knowledge — the great desk at the very front."',
    nextCoord: 'E·1',
    coins: 45,
  },

  // ── CACHE 5 — Ukrainian Q5 ────────────────────────────────────────────────
  {
    id: 'C05',
    qr: 'WQUEST-C05',
    coord: 'E·1',
    clue: '"The keeper of knowledge — the great desk at the very front."',
    task: {
      type: 'mcq',
      label: 'ЗАВДАННЯ · ЗАПОВНИ ПРОПУСК',
      question: 'Тропічні ліси називають ______.',
      options: ['сухими лісами', 'дощовими лісами', 'тайгою', 'пустелею'],
      correct: 1,
    },
    variants: [
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ЗАПОВНИ ПРОПУСК',
        question: 'Пустеля — це дуже ______ і сухе місце.',
        options: ['холодне', 'гаряче', 'вологе', 'темне'],
        correct: 1,
      },
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ЗАПОВНИ ПРОПУСК',
        question: 'Рослини виробляють ______.',
        options: ['вуглець', 'кисень', 'азот', 'водень'],
        correct: 1,
      },
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ЗАПОВНИ ПРОПУСК',
        question: 'Зміна клімату викликає ______ льоду.',
        options: ['замерзання', 'танення', 'збільшення', 'падіння'],
        correct: 1,
      },
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ЗАПОВНИ ПРОПУСК',
        question: 'Дерева виробляють ______ для людей.',
        options: ['вуглець', 'кисень', 'азот', 'водень'],
        correct: 1,
      },
    ],
    nextClue: '"On the wall where time never stops — look near the clock."',
    nextCoord: 'D·3',
    coins: 50,
  },

  // ── CACHE 6 — Ukrainian Q6 (last) ─────────────────────────────────────────
  {
    id: 'C06',
    qr: 'WQUEST-C06',
    coord: 'D·3',
    clue: '"On the wall where time never stops — look near the clock."',
    task: {
      type: 'mcq',
      label: 'ЗАВДАННЯ · ВИБІР ВІДПОВІДІ',
      question: 'Що загрожує тваринам?',
      options: ['Вирубка лісів', 'Чисте повітря', 'Захист природи', 'Вода'],
      correct: 0,
    },
    variants: [
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ВИБІР ВІДПОВІДІ',
        question: 'Яка причина зникнення тварин?',
        options: ['Захист природи', 'Полювання людини', 'Чисті ліси', 'Вода'],
        correct: 1,
      },
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ВИБІР ВІДПОВІДІ',
        question: 'Що допомагає зберегти природу?',
        options: ['Вирубка дерев', 'Переробка сміття', 'Забруднення', 'Полювання'],
        correct: 1,
      },
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ВИБІР ВІДПОВІДІ',
        question: 'Що потрібно тваринам для життя?',
        options: ['Хімікати', 'Їжа і середовище проживання', 'Шум', 'Пластик'],
        correct: 1,
      },
      {
        type: 'mcq',
        label: 'ЗАВДАННЯ · ВИБІР ВІДПОВІДІ',
        question: 'Як ми можемо допомогти планеті?',
        options: ['Забруднювати', 'Садити дерева', 'Вирубувати ліси', 'Спалювати сміття'],
        correct: 1,
      },
    ],
    nextClue: '🏆 You found all 6 caches! The expedition is complete!',
    nextCoord: 'FINISH',
    coins: 60,
    isLast: true,
  },

];

// ─── TRAPS ───────────────────────────────────────────────────────────────────

const TRAPS = {

  'WQUEST-TRAP-ICE': {
    title: 'ICE TRAP!',
    emoji: '❄️',
    msg: 'Your team walked into a BLIZZARD! You are frozen!',
    freezeSec: 60,
    bonus: {
      q: 'Which continent is the COLDEST on Earth?',
      opts: ['Antarctica', 'Arctic', 'Russia', 'Greenland'],
      correct: 0,
    },
    bonusSec: 20,
  },

  'WQUEST-TRAP-STORM': {
    title: 'STORM TRAP!',
    emoji: '⛈️',
    msg: 'A tropical storm hit your team! You must wait for it to pass!',
    freezeSec: 45,
    bonus: {
      q: 'What do we call very strong tropical storms over warm oceans?',
      opts: ['Hurricanes', 'Blizzards', 'Avalanches', 'Droughts'],
      correct: 0,
    },
    bonusSec: 15,
  },

};

// ─── SETTINGS ────────────────────────────────────────────────────────────────

const SETTINGS = {
  teacherPin:      '1234',
  wrongAnswerFine: 10,
  className:       '5-B',
};
