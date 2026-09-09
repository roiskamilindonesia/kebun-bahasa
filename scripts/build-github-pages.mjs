import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'github-pages-dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
fs.cpSync(path.join(root, 'github-pages'), output, { recursive: true });
fs.cpSync(path.join(root, 'public', 'audio'), path.join(output, 'audio'), { recursive: true });
fs.cpSync(path.join(root, 'public', 'fruits'), path.join(output, 'fruits'), { recursive: true });
fs.copyFileSync(path.join(root, 'public', 'icon.svg'), path.join(output, 'icon.svg'));
console.log(`GitHub Pages package ready: ${output}`);
