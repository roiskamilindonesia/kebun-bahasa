import assert from 'node:assert/strict';
import { test } from 'node:test';
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
