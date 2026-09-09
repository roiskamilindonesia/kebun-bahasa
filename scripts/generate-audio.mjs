import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../app/translations.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { translations } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const output = new URL('../public/audio/vocabulary/', import.meta.url);
fs.mkdirSync(output, { recursive: true });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kebun-voices-'));
let generated = 0;
for (const [theme, words] of Object.entries(translations)) {
  for (const [index, pair] of words.entries()) {
    for (const [language, text, voice, rate] of [['en', pair[0], 'Samantha', '135'], ['ar', pair[1], 'Majed', '125']]) {
      const id = `${theme}-${String(index + 1).padStart(2, '0')}-${language}`;
      const target = new URL(id + '.wav', output);
      if (fs.existsSync(target) && fs.statSync(target).size > 5000) continue;
      const aiff = path.join(temporary, id + '.aiff');
      execFileSync('/usr/bin/say', ['-v', voice, '-r', rate, '-o', aiff, text]);
      execFileSync('/usr/bin/afconvert', [aiff, fileURLToPath(target), '-f', 'WAVE', '-d', 'LEI16']);
      if (fs.statSync(target).size < 5000) throw new Error(`Empty audio: ${id}`);
      generated++;
    }
  }
  console.log(`${theme}: ${words.length * 2} vocabulary recordings ready`);
}
console.log(`Complete: ${generated} new audio files.`);
