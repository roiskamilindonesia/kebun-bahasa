# Kebun Kata

Permainan belajar 200 kosakata bahasa Inggris dan Indonesia untuk anak, dengan panduan berbahasa Indonesia.

## Cara bermain

1. Sentuh gambar dan dengarkan nama buah sampai selesai.
2. Lanjutkan ke kuis dan dengarkan ketiga pilihan suara.
3. Geser pilihan ke kotak jawaban, atau ketuk pilihan lalu ketuk kotak.
4. Jawaban yang belum cocok dapat dicoba kembali. Jawaban benar membuka buah berikutnya.

Enam buah: anggur, jeruk, mangga, apel, pisang, stroberi. Soal pertama menggunakan orange, mango, grape (jawaban ketiga). Pilihan bahasa memulai sesi baru. Tidak ada mikrofon, iklan, batas waktu, akun anak, atau pengiriman data belajar. Progres hanya berlangsung selama sesi halaman terbuka.

## Development

Use the pinned dependencies and pnpm lockfile. Run `pnpm install --frozen-lockfile`, `pnpm run dev`, and `pnpm run build`. `pnpm exec tsc --noEmit` checks TypeScript.

Images are generated illustrations. English recordings are bundled with the app, while Indonesian recordings currently use the macOS Damayanti female voice as a temporary source. `scripts/generate-audio.mjs` is ready to replace both languages with Google Cloud Chirp 3 HD Aoede after Google Cloud billing is active. Audio files are served locally and do not depend on browser speech synthesis. This release requires a network connection to load the app and assets; it does not claim offline support.

## Validation

- Production build and TypeScript check pass.
- All 400 vocabulary WAV assets and both feedback recordings contain non-silent PCM audio.
- Root preview returns HTTP 200.
- Browser UI, real-device playback, touch drag, and pronunciation have not been manually tested.
- Optional WebMCP tools feature-detect the browser API. No supported WebMCP validation context was available, so live tool registration and execution are unverified.
