import { lessonThemes } from './vocabulary.ts';

const originals = ['grape', 'orange', 'mango', 'apple', 'banana', 'strawberry'];
const roman = ['‘Inab', 'Burtuqāl', 'Mānjū', 'Tuffāḥ', 'Mawz', 'Farāwilah'];
export const words = lessonThemes.flatMap((theme) =>
  theme.words.map((word, position) => ({
    ...word,
    themeId: theme.id,
    position,
    audio:
      theme.id === 'fruit' && position < 6
        ? originals[position]
        : `vocabulary/${word.id}`,
    image:
      theme.id === 'fruit' && position < 6
        ? `/fruits/${originals[position]}.webp`
        : null,
    roman: theme.id === 'fruit' && position < 6 ? roman[position] : '',
  })),
);
export const themes = lessonThemes.map((theme) => {
  const indices = words
    .map((w, index) => (w.themeId === theme.id ? index : -1))
    .filter((index) => index !== -1);
  // 18 words become three groups of six; 20 words become four groups of five.
  const size = Math.ceil(indices.length / Math.ceil(indices.length / 6));
  const lessons = Array.from(
    { length: Math.ceil(indices.length / size) },
    (_, i) => indices.slice(i * size, (i + 1) * size),
  );
  return {
    id: theme.id,
    title: theme.title,
    emoji: theme.emoji,
    lessons,
    count: indices.length,
  };
});
export function lessonMembers(themeId = 'fruit', lesson = 0): number[] {
  return (
    themes.find((theme) => theme.id === themeId)?.lessons[lesson] ??
    themes[0].lessons[0]
  );
}
