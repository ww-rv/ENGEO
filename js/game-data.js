// ════════════════════════════════════════════════════════════════════════════
//  WORDQUEST — GAME DATA
//  Відредагуй цей файл щоб змінити команди, кеші, пастки та питання.
// ════════════════════════════════════════════════════════════════════════════

'use strict';

// ─── TEAMS ───────────────────────────────────────────────────────────────────
// Додай або видали команди на свій розсуд.
// color: колір кружка команди (HEX)
// emoji: символ команди

const TEAMS = [
  { id: 'foxes',  name: 'Foxes',  emoji: '🦊', color: '#C66A3A' },
  { id: 'owls',   name: 'Owls',   emoji: '🦉', color: '#5C3A1E' },
  { id: 'pines',  name: 'Pines',  emoji: '🌲', color: '#2D5A3D' },
  { id: 'acorns', name: 'Acorns', emoji: '🌰', color: '#8B5E37' },
  { id: 'bears',  name: 'Bears',  emoji: '🐻', color: '#5C4F3D' },
  { id: 'hawks',  name: 'Hawks',  emoji: '🦅', color: '#7A2A22' },
];

// ─── CACHES ──────────────────────────────────────────────────────────────────
// Кожен кеш — це один QR-код в класі.
//
// qr      — текст, який закодований у QR-коді (роздрукуй саме це)
// coord   — координата в класі (для відображення дітям)
// clue    — підказка де шукати QR-код (поетична, англійською)
// task    — завдання яке треба вирішити після сканування:
//           type: 'mcq'        — вибір з 4 варіантів
//           type: 'unscramble' — скласти слово з букв
// nextClue  — підказка де шукати НАСТУПНИЙ кеш
// nextCoord — координата наступного кешу
// coins   — скільки монет отримує команда за правильну відповідь
// isLast  — true тільки для останнього кешу

const CACHES = [
  {
    id: 'C01',
    qr: 'WQUEST-C01',
    coord: 'A·1',
    clue: '"Where students first enter — look near the classroom door."',
    task: {
      type: 'mcq',
      label: 'TASK · FILL THE GAP',
      question: 'The ___ Ocean is the largest ocean on Earth, covering about 165 million km².',
      options: ['Pacific', 'Atlantic', 'Indian', 'Arctic'],
      correct: 0,
    },
    nextClue: '"Where books and knowledge sleep — at the back of the room."',
    nextCoord: 'B·6',
    coins: 30,
  },

  {
    id: 'C02',
    qr: 'WQUEST-C02',
    coord: 'B·6',
    clue: '"Where books and knowledge sleep — at the back of the room."',
    task: {
      type: 'mcq',
      label: 'TASK · MULTIPLE CHOICE',
      question: 'Which continent is the LARGEST by total land area?',
      options: ['Asia', 'Africa', 'Europe', 'Antarctica'],
      correct: 0,
    },
    nextClue: '"Where the teacher writes your future — the great white surface at the front."',
    nextCoord: 'C·1',
    coins: 35,
  },

  {
    id: 'C03',
    qr: 'WQUEST-C03',
    coord: 'C·1',
    clue: '"Where the teacher writes your future — the great white surface."',
    task: {
      type: 'unscramble',
      label: 'TASK · UNSCRAMBLE',
      question: 'Unscramble to find the name of the HIGHEST mountain peak in the world:',
      scrambled: ['E', 'V', 'E', 'R', 'E', 'S', 'T'],
      answer: 'EVEREST',
    },
    nextClue: '"Look through the glass at the world outside — nature is calling!"',
    nextCoord: 'A·4',
    coins: 40,
  },

  {
    id: 'C04',
    qr: 'WQUEST-C04',
    coord: 'A·4',
    clue: '"Look through the glass at the world outside."',
    task: {
      type: 'mcq',
      label: 'TASK · MULTIPLE CHOICE',
      question: 'Which river is considered the LONGEST in the world?',
      options: ['The Nile', 'The Amazon', 'The Yangtze', 'The Mississippi'],
      correct: 0,
    },
    nextClue: '"The keeper of knowledge at the very front of the room."',
    nextCoord: 'E·1',
    coins: 45,
  },

  {
    id: 'C05',
    qr: 'WQUEST-C05',
    coord: 'E·1',
    clue: '"The keeper of knowledge — the great desk at the very front."',
    task: {
      type: 'mcq',
      label: 'TASK · MULTIPLE CHOICE',
      question: 'Which country has the LARGEST total area in the world?',
      options: ['Russia', 'Canada', 'China', 'United States'],
      correct: 0,
    },
    nextClue: '🏆 You found all 5 caches! The expedition is complete!',
    nextCoord: 'FINISH',
    coins: 60,
    isLast: true,
  },
];

// ─── TRAPS ───────────────────────────────────────────────────────────────────
// Пастки — QR-коди без завдання, які заморожують команду на певний час.
// Ключ об'єкта = текст QR-коду (роздрукуй саме це).
//
// title      — заголовок на екрані заморозки
// emoji      — великий символ
// msg        — повідомлення команді
// freezeSec  — скільки секунд заморожена команда
// bonus      — бонусне запитання щоб скоротити час заморозки
//   q        — текст запитання
//   opts     — 4 варіанти відповіді
//   correct  — індекс правильної відповіді (0 = перший варіант)
// bonusSec   — на скільки секунд скорочується заморозка за правильну відповідь

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
// Загальні налаштування гри

const SETTINGS = {
  teacherPin:      '1234',   // PIN для входу в Teacher Panel
  wrongAnswerFine: 10,       // монет штрафу за неправильну відповідь
  className:       '5-B',    // назва класу (відображається в заголовку)
};
