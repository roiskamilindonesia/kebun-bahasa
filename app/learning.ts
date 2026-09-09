export const words = [
  {
    id: 'grape',
    idn: 'Anggur',
    en: 'Grape',
    ar: 'عِنَب',
    roman: '‘Inab',
    tint: '#f0e9fa',
  },
  {
    id: 'orange',
    idn: 'Jeruk',
    en: 'Orange',
    ar: 'بُرْتُقَال',
    roman: 'Burtuqāl',
    tint: '#fff0d8',
  },
  {
    id: 'mango',
    idn: 'Mangga',
    en: 'Mango',
    ar: 'مَانْجُو',
    roman: 'Mānjū',
    tint: '#fff1d8',
  },
  {
    id: 'apple',
    idn: 'Apel',
    en: 'Apple',
    ar: 'تُفَّاح',
    roman: 'Tuffāḥ',
    tint: '#ffebeb',
  },
  {
    id: 'banana',
    idn: 'Pisang',
    en: 'Banana',
    ar: 'مَوْز',
    roman: 'Mawz',
    tint: '#fff5d2',
  },
  {
    id: 'strawberry',
    idn: 'Stroberi',
    en: 'Strawberry',
    ar: 'فَرَاوِلَة',
    roman: 'Farāwilah',
    tint: '#ffebee',
  },
];
export type Language = 'en' | 'ar';
export type Phase = 'learn' | 'sound' | 'bridge' | 'image' | 'done';
export type Stat = {
  attempts: number;
  correct: number;
  firstTry: number;
  needsPractice: boolean;
};
export type Session = {
  version: 1;
  phase: Phase;
  queue: number[];
  cursor: number;
  options: number[];
  heard: boolean;
  selected: number | null;
  feedback: 'idle' | 'wrong' | 'correct';
  missed: boolean;
  reviews: number[];
  stats: Stat[];
};
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function optionsFor(word: number, random = Math.random) {
  return shuffle(
    [
      word,
      ...shuffle(
        words.map((_, i) => i).filter((i) => i !== word),
        random,
      ).slice(0, 2),
    ],
    random,
  );
}
export function newSession(previous?: Stat[]): Session {
  // Start the next session with words that still need practice.
  const queue = shuffle(words.map((_, i) => i)).sort(
    (a, b) =>
      Number(previous?.[b]?.needsPractice ?? false) -
      Number(previous?.[a]?.needsPractice ?? false),
  );
  return {
    version: 1,
    phase: 'learn',
    queue,
    cursor: 0,
    options: optionsFor(queue[0]),
    heard: false,
    selected: null,
    feedback: 'idle',
    missed: false,
    reviews: [],
    stats:
      previous?.map((s) => ({ ...s })) ??
      words.map(() => ({
        attempts: 0,
        correct: 0,
        firstTry: 0,
        needsPractice: false,
      })),
  };
}
export function submit(session: Session, slot: number): Session {
  if (
    !['sound', 'image'].includes(session.phase) ||
    session.feedback === 'correct' ||
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot > 2 ||
    (session.phase === 'image' && !session.heard)
  )
    return session;
  const word = session.queue[session.cursor];
  const correct = session.options[slot] === word;
  const stats = session.stats.map((s) => ({ ...s }));
  const stat = stats[word];
  stat.attempts++;
  if (correct) {
    stat.correct++;
    if (!session.missed) stat.firstTry++;
  }
  // A correct retry does not erase a difficulty; a later unaided success does.
  stat.needsPractice = !correct || session.missed;
  const queue = [...session.queue],
    reviews = [...session.reviews];
  if (!correct && !reviews.includes(word)) {
    reviews.push(word);
    // Always interleave another word, even if the error occurs at the end.
    if (session.cursor === queue.length - 1)
      queue.push((word + 1) % words.length);
    queue.splice(Math.min(session.cursor + 3, queue.length), 0, word);
  }
  return {
    ...session,
    stats,
    queue,
    reviews,
    missed: session.missed || !correct,
    selected: slot,
    feedback: correct ? 'correct' : 'wrong',
  };
}
export function advance(session: Session): Session {
  if (session.feedback !== 'correct') return session;
  if (session.cursor + 1 === session.queue.length)
    return { ...session, phase: session.phase === 'image' ? 'done' : 'bridge' };
  const cursor = session.cursor + 1;
  return {
    ...session,
    cursor,
    phase: session.phase === 'image' ? 'image' : 'learn',
    options: optionsFor(session.queue[cursor]),
    heard: false,
    selected: null,
    feedback: 'idle',
    missed: false,
  };
}
export function startImages(session: Session): Session {
  const queue = shuffle(words.map((_, i) => i));
  return {
    ...session,
    phase: 'image',
    queue,
    cursor: 0,
    reviews: [],
    options: optionsFor(queue[0]),
    heard: false,
    selected: null,
    feedback: 'idle',
    missed: false,
  };
}
export function restore(raw: string | null): Session | null {
  try {
    const s = JSON.parse(raw ?? 'null') as Session;
    const word = (x: unknown) =>
      Number.isInteger(x) && Number(x) >= 0 && Number(x) < words.length;
    if (
      !s ||
      s.version !== 1 ||
      !['learn', 'sound', 'bridge', 'image', 'done'].includes(s.phase) ||
      !Array.isArray(s.queue) ||
      s.queue.length < 6 ||
      s.queue.length > 18 ||
      !s.queue.every(word) ||
      !Number.isInteger(s.cursor) ||
      s.cursor < 0 ||
      s.cursor >= s.queue.length ||
      !Array.isArray(s.options) ||
      s.options.length !== 3 ||
      new Set(s.options).size !== 3 ||
      !s.options.every(word) ||
      !s.options.includes(s.queue[s.cursor]) ||
      !Array.isArray(s.reviews) ||
      s.reviews.length > 6 ||
      new Set(s.reviews).size !== s.reviews.length ||
      !s.reviews.every(word) ||
      typeof s.heard !== 'boolean' ||
      typeof s.missed !== 'boolean' ||
      !['idle', 'wrong', 'correct'].includes(s.feedback) ||
      !(
        s.selected === null ||
        (Number.isInteger(s.selected) && s.selected >= 0 && s.selected <= 2)
      ) ||
      !Array.isArray(s.stats) ||
      s.stats.length !== words.length ||
      s.stats.some(
        (t) =>
          !t ||
          typeof t.needsPractice !== 'boolean' ||
          ![t.attempts, t.correct, t.firstTry].every(
            (n) => Number.isSafeInteger(n) && n >= 0,
          ) ||
          t.firstTry > t.correct ||
          t.correct > t.attempts,
      )
    )
      return null;
    return s;
  } catch {
    return null;
  }
}
