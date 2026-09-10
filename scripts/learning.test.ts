import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { themes, words } from '../app/lesson-catalog.ts';
import { storageKey, readSaved } from '../app/learning-storage.ts';
import {
  newSession,
  submit,
  advance,
  startImages,
  optionsFor,
  restore,
  type Session,
} from '../app/learning.ts';

test('each option set has one target, two distinct distractors, and varied positions', () => {
  const slots = new Set<number>();
  for (let seed = 1; seed < 120; seed++) {
    let n = seed;
    const rng = () => {
      n = (n * 1664525 + 1013904223) >>> 0;
      return n / 4294967296;
    };
    for (let word = 0; word < 6; word++) {
      const options = optionsFor(word, rng);
      assert.equal(new Set(options).size, 3);
      assert.ok(options.includes(word));
      slots.add(options.indexOf(word));
    }
  }
  assert.equal(slots.size, 3);
});
test('mistakes schedule spaced reviews and retries do not erase a difficulty', () => {
  let s: Session = { ...newSession(), phase: 'sound' };
  const target = s.queue[0];
  s = submit(
    s,
    s.options.findIndex((w) => w !== target),
  );
  assert.equal(s.queue[3], target);
  assert.equal(s.queue.length, 7);
  s = submit(
    s,
    s.options.findIndex((w) => w !== target),
  );
  assert.equal(s.queue.length, 7);
  s = submit(s, s.options.indexOf(target));
  assert.equal(s.stats[target].needsPractice, true);
  assert.equal(s.stats[target].firstTry, 0);
  assert.equal(submit(s, 0), s);
});
test('last-word errors still have an intervening word', () => {
  const s: Session = { ...newSession(), phase: 'sound', cursor: 5 };
  s.options = optionsFor(s.queue[5]);
  const result = submit(
    s,
    s.options.findIndex((w) => w !== s.queue[5]),
  );
  assert.notEqual(result.queue[6], result.queue[5]);
  assert.equal(result.queue[7], result.queue[5]);
});
test('both stages finish within a bounded queue even when every turn has an error', () => {
  let s = newSession();
  let turns = 0;
  while (s.phase !== 'bridge') {
    s = { ...s, phase: 'sound' };
    const target = s.queue[s.cursor];
    s = submit(
      s,
      s.options.findIndex((w) => w !== target),
    );
    s = advance(submit(s, s.options.indexOf(target)));
    assert.ok(++turns <= 18);
  }
  s = startImages(s);
  assert.equal(submit(s, 0), s);
  while (s.phase !== 'done') {
    s = { ...s, heard: true };
    const target = s.queue[s.cursor];
    s = submit(
      s,
      s.options.findIndex((w) => w !== target),
    );
    s = advance(submit(s, s.options.indexOf(target)));
    assert.ok(++turns <= 36);
  }
});
test('reload preserves queue, option order and pending correct answers; corrupt saves rejected', () => {
  let s: Session = { ...newSession(), phase: 'sound' };
  s = submit(s, s.options.indexOf(s.queue[0]));
  const saved = restore(JSON.stringify(s));
  assert.deepEqual(saved, s);
  assert.equal(advance(saved!).cursor, 1);
  assert.equal(restore('{bad'), null);
  assert.equal(restore(JSON.stringify({ ...s, options: [0, 0, 0] })), null);
});
test('next session prioritizes difficult words and preserves progress', () => {
  const s = newSession();
  s.stats[4].needsPractice = true;
  const next = newSession(s.stats);
  assert.equal(next.queue[0], 4);
  assert.deepEqual(next.stats, s.stats);
  assert.notEqual(next.stats, s.stats);
});

test('all 200 words occur exactly once in 5–6 word lessons across 11 themes', () => {
  assert.equal(themes.length, 11);
  assert.equal(words.length, 200);
  const covered = themes.flatMap((t) => t.lessons.flat());
  assert.equal(covered.length, 200);
  assert.equal(new Set(covered).size, 200);
  for (const theme of themes)
    for (const members of theme.lessons) {
      assert.ok(members.length >= 5 && members.length <= 6);
      assert.ok(members.every((i) => words[i].themeId === theme.id));
    }
});

test('every theme and lesson can finish both stages with mistakes without mixing words', () => {
  for (const theme of themes)
    for (const [lesson, members] of theme.lessons.entries()) {
      let s = newSession(undefined, theme.id, lesson);
      let turns = 0;
      for (const finish of ['bridge', 'done']) {
        while (s.phase !== finish) {
          s = {
            ...s,
            phase: finish === 'bridge' ? 'sound' : 'image',
            heard: true,
          };
          assert.ok(s.options.every((i) => members.includes(i)));
          assert.equal(s.options.length, 3);
          assert.equal(new Set(s.options).size, 3);
          const target = s.queue[s.cursor];
          s = submit(
            s,
            s.options.findIndex((i) => i !== target),
          );
          s = advance(submit(s, s.options.indexOf(target)));
          assert.ok(++turns <= members.length * 6);
          assert.deepEqual(restore(JSON.stringify(s), theme.id, lesson), s);
        }
        if (finish === 'bridge') s = startImages(s);
      }
    }
});

test('language, theme and lesson progress are isolated; old fruit saves migrate', () => {
  const map = new Map<string, string>();
  const storage = { getItem: (key: string) => map.get(key) ?? null };
  const fruit = newSession();
  const vegetables = newSession(undefined, 'vegetables', 1);
  map.set(storageKey('en', 'fruit', 0), JSON.stringify(fruit));
  map.set(storageKey('ar', 'vegetables', 1), JSON.stringify(vegetables));
  assert.deepEqual(readSaved(storage, 'en'), fruit);
  assert.deepEqual(readSaved(storage, 'ar', 'vegetables', 1), vegetables);
  assert.equal(readSaved(storage, 'en', 'vegetables', 1), null);
  assert.equal(readSaved(storage, 'ar', 'vegetables', 0), null);
  assert.equal(restore(JSON.stringify(vegetables), 'home', 1), null);
  const legacy = { ...fruit, version: 1, stats: fruit.stats.slice(0, 6) };
  map.delete(storageKey('en'));
  map.set('kebun-kata:learning-v1:en', JSON.stringify(legacy));
  const migrated = readSaved(storage, 'en')!;
  assert.equal(migrated.version, 2);
  assert.equal(migrated.stats.length, 200);
  assert.deepEqual(migrated.queue, fruit.queue);
  assert.deepEqual(migrated.options, fruit.options);
});

test('all vocabulary recordings are present and have WAV audio data', () => {
  for (const word of words)
    for (const lang of ['en', 'ar']) {
      const file = new URL(
        `../public/audio/${word.audio}-${lang}.wav`,
        import.meta.url,
      );
      assert.ok(existsSync(file), `${word.id}/${lang}`);
      assert.ok(statSync(file).size > 44);
      assert.equal(readFileSync(file).subarray(0, 4).toString(), 'RIFF');
    }
});
