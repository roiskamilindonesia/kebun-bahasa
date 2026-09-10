import { restore, type Language } from './learning.ts';
export const storageKey = (language: Language, themeId = 'fruit', lesson = 0) =>
  `kebun-kata:learning-v2:${language}:${themeId}:${lesson}`;
export function readSaved(
  storage: Pick<Storage, 'getItem'>,
  language: Language,
  themeId = 'fruit',
  lesson = 0,
) {
  const raw = storage.getItem(storageKey(language, themeId, lesson));
  return restore(
    raw ??
      (themeId === 'fruit' && lesson === 0
        ? storage.getItem(`kebun-kata:learning-v1:${language}`)
        : null),
    themeId,
    lesson,
  );
}
