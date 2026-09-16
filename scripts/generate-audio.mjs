import fs from 'node:fs';
import path from 'node:path';
import { vocabularyThemes } from '../app/vocabulary.ts';
import { translations } from '../app/translations.ts';

const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
const accessToken = process.env.GOOGLE_CLOUD_ACCESS_TOKEN;
if (!apiKey && !accessToken) {
  throw new Error(
    'Set GOOGLE_CLOUD_TTS_API_KEY or GOOGLE_CLOUD_ACCESS_TOKEN before generating audio.',
  );
}

const endpoint = new URL('https://texttospeech.googleapis.com/v1/text:synthesize');
if (apiKey) endpoint.searchParams.set('key', apiKey);
const output = new URL('../public/audio/vocabulary/', import.meta.url);
fs.mkdirSync(output, { recursive: true });

const voices = {
  en: { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Aoede' },
  id: { languageCode: 'id-ID', name: 'id-ID-Chirp3-HD-Aoede' },
};

async function synthesize(text, voice, target) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      input: { text },
      voice,
      audioConfig: { audioEncoding: 'LINEAR16' },
    }),
  });
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
  const body = await response.json();
  const audio = Buffer.from(body.audioContent, 'base64');
  if (audio.length < 44) throw new Error(`Empty audio for ${text}`);
  fs.writeFileSync(target, audio);
}

let generated = 0;
for (const theme of vocabularyThemes) {
  for (const [index, idn] of theme.words.entries()) {
    const en = translations[theme.id]?.[index];
    if (!en) throw new Error(`Missing English translation: ${theme.id}/${index}`);
    const id = `${theme.id}-${String(index + 1).padStart(2, '0')}`;
    for (const [language, text] of [['en', en], ['id', idn]]) {
      const target = new URL(`${id}-${language}.wav`, output);
      await synthesize(text, voices[language], target);
      generated++;
      console.log(`${generated}/400 ${path.basename(target.pathname)}`);
    }
  }
}

await synthesize(
  'Betul, kamu hebat!',
  voices.id,
  new URL('../public/audio/correct.wav', import.meta.url),
);
await synthesize(
  'Belum tepat. Coba lagi, ya!',
  voices.id,
  new URL('../public/audio/retry.wav', import.meta.url),
);
console.log(`Complete: ${generated + 2} Google Cloud recordings.`);
