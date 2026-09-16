import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { vocabularyThemes } from '../app/vocabulary.ts';

const run = promisify(execFile);
const root = new URL('../public/audio/', import.meta.url);
const output = new URL('vocabulary/', root);
await fs.mkdir(output, { recursive: true });
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kebun-kata-audio-'));

async function synthesize(text, target) {
  const aiff = path.join(tempDir, 'speech.aiff');
  await run('/usr/bin/say', ['-v', 'Damayanti', '-r', '150', '-o', aiff, text]);
  const targetPath = target instanceof URL ? fileURLToPath(target) : target;
  await run('/usr/bin/afconvert', ['-f', 'WAVE', '-d', 'LEI16', aiff, targetPath]);
}

let generated = 0;
try {
  for (const theme of vocabularyThemes) {
    for (const [index, word] of theme.words.entries()) {
      const id = `${theme.id}-${String(index + 1).padStart(2, '0')}`;
      const target = new URL(`${id}-id.wav`, output);
      await synthesize(word, target);
      generated++;
      console.log(`${generated}/200 ${path.basename(target.pathname)}`);
    }
  }
  await synthesize('Betul, kamu hebat!', new URL('correct.wav', root));
  await synthesize('Belum tepat. Coba lagi, ya!', new URL('retry.wav', root));
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}

console.log(`Complete: ${generated + 2} Indonesian recordings.`);
