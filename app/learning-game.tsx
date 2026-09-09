'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowRight,
  Check,
  Grip,
  Headphones,
  Leaf,
  Sprout,
  Star,
  Volume2,
  X,
} from 'lucide-react';
import { flushSync } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { vocabularyThemes, vocabularyCount } from './vocabulary';
import {
  words,
  newSession,
  restore,
  submit,
  advance,
  startImages,
  type Language,
  type Session,
} from './learning';
import './learning.css';

const storageKey = (lang: Language) => `kebun-kata:learning-v1:${lang}`;

export default function LearningGame({ basePath = '' }: { basePath?: string }) {
  const [language, setLanguage] = useState<Language>('en');
  const [session, setSession] = useState<Session | null>(null);
  const [resumed, setResumed] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [catalog, setCatalog] = useState(false);
  const [theme, setTheme] = useState('fruit');
  const [drag, setDrag] = useState<{
    slot: number;
    x: number;
    y: number;
  } | null>(null);
  const [over, setOver] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const drop = useRef<HTMLButtonElement>(null);
  const live = useRef(session);
  live.current = session;
  const action = useRef<(slot: number) => void>(() => {});
  const gesture = useRef<{
    slot: number;
    pointer: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressClickUntil = useRef(0);

  useEffect(() => {
    let lang: Language = 'en',
      saved: Session | null = null;
    try {
      lang = localStorage.getItem('kebun-kata:language') === 'ar' ? 'ar' : 'en';
      saved = restore(localStorage.getItem(storageKey(lang)));
    } catch {
      setStorageError(true);
    }
    setLanguage(lang);
    setSession(saved ?? newSession());
    setResumed(!!saved);
    return () => {
      audio.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    try {
      localStorage.setItem(storageKey(language), JSON.stringify(session));
      localStorage.setItem('kebun-kata:language', language);
    } catch {
      setStorageError(true);
    }
  }, [session, language]);

  function stopAudio() {
    if (audio.current) {
      audio.current.pause();
      audio.current.onended = null;
      audio.current.onerror = null;
    }
    audio.current = null;
    setPlaying(null);
  }
  function play(file: string, key: string, done?: () => void) {
    stopAudio();
    setAudioError(false);
    const clip = new Audio(`${basePath}/audio/${file}.wav`);
    audio.current = clip;
    setPlaying(key);
    const fail = () => {
      if (audio.current !== clip) return;
      setPlaying(null);
      setAudioError(true);
    };
    clip.onended = () => {
      if (audio.current !== clip) return;
      setPlaying(null);
      done?.();
    };
    clip.onerror = fail;
    clip.play().catch(fail);
  }
  function hearWord() {
    if (!session) return;
    play(`${words[session.queue[session.cursor]].id}-${language}`, 'word', () =>
      setSession((s) => (s ? { ...s, heard: true } : s)),
    );
  }
  function answer(slot: number) {
    const s = live.current;
    if (!s) return;
    const result = submit(s, slot);
    if (result === s) return;
    live.current = result;
    setSession(result);
    play(result.feedback === 'correct' ? 'correct' : 'retry', 'feedback');
  }
  action.current = answer;
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability. */
      }
    };
    register({
      name: 'get_lesson_state',
      description:
        'Read the current learning stage, word, and answer feedback.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => {
        const current = live.current;
        return current
          ? {
              phase: current.phase,
              round: current.cursor,
              feedback: current.feedback,
              fruit:
                current.phase === 'image' && current.feedback !== 'correct'
                  ? undefined
                  : words[current.queue[current.cursor]].id,
            }
          : { phase: 'loading' };
      },
    });
    register({
      name: 'submit_sound_choice',
      description: 'Submit sound choice 1, 2, or 3 in the sound matching quiz.',
      inputSchema: {
        type: 'object',
        properties: { choice: { type: 'integer', minimum: 1, maximum: 3 } },
        required: ['choice'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input) => {
        const choice = (input as { choice?: unknown })?.choice;
        if (
          typeof choice !== 'number' ||
          !Number.isInteger(choice) ||
          choice < 1 ||
          choice > 3
        )
          throw new Error('Choice must be 1, 2, or 3.');
        if (
          live.current?.phase !== 'sound' ||
          live.current.feedback === 'correct'
        )
          throw new Error('Open a sound quiz before answering.');
        flushSync(() => action.current(choice - 1));
        return { feedback: live.current?.feedback };
      },
    });
    return () => lifecycle.abort();
  }, []);
  function changeLanguage(lang: Language) {
    if (lang === language) return;
    stopAudio();
    gesture.current = null;
    setDrag(null);
    setOver(false);
    setAudioError(false);
    let saved: Session | null = null;
    try {
      // Flush the current session before switching so quick taps never lose progress.
      if (live.current)
        localStorage.setItem(
          storageKey(language),
          JSON.stringify(live.current),
        );
      saved = restore(localStorage.getItem(storageKey(lang)));
    } catch {
      setStorageError(true);
    }
    setLanguage(lang);
    setSession(saved ?? newSession());
    setResumed(!!saved);
  }
  function next() {
    stopAudio();
    setAudioError(false);
    setResumed(false);
    setSession((s) => (s ? advance(s) : s));
  }
  function pointerDown(e: ReactPointerEvent<HTMLButtonElement>, slot: number) {
    if (e.button !== 0 || gesture.current || session?.feedback === 'correct')
      return;
    suppressClickUntil.current = 0;
    gesture.current = {
      slot,
      pointer: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  useEffect(() => {
    const inside = (x: number, y: number) => {
      const b = drop.current?.getBoundingClientRect();
      return !!b && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
    };
    const cancel = () => {
      gesture.current = null;
      setDrag(null);
      setOver(false);
    };
    const move = (e: PointerEvent) => {
      const g = gesture.current;
      if (!g || g.pointer !== e.pointerId) return;
      g.moved ||= Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8;
      if (!g.moved) return;
      e.preventDefault();
      setDrag({ slot: g.slot, x: e.clientX, y: e.clientY });
      setOver(inside(e.clientX, e.clientY));
    };
    const finish = (e: PointerEvent) => {
      const g = gesture.current;
      if (!g || g.pointer !== e.pointerId) return;
      if (g.moved) {
        e.preventDefault();
        suppressClickUntil.current = Date.now() + 500;
        if (inside(e.clientX, e.clientY)) action.current(g.slot);
      }
      cancel();
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', finish, { passive: false });
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
    };
  }, []);

  if (!session)
    return (
      <main className="main">
        <h1>Kebun Kata</h1>
        <p role="status">Menyiapkan permainan…</p>
      </main>
    );
  const s = session,
    word = words[s.queue[s.cursor]],
    imageMode = s.phase === 'image';
  const completed = new Set(
    s.queue.slice(0, s.cursor + (s.feedback === 'correct' ? 1 : 0)),
  ).size;
  const review = s.queue.slice(0, s.cursor).includes(s.queue[s.cursor]);
  const correct = s.feedback === 'correct';
  const changed = (patch: Partial<Session>) =>
    setSession((v) => (v ? { ...v, ...patch } : v));
  const feedback = (
    <div
      className={`result-note ${s.feedback}`}
      role="status"
      aria-live="polite"
    >
      {correct
        ? 'Betul! Kamu hebat!'
        : s.feedback === 'wrong'
          ? 'Belum cocok. Dengarkan lagi, yuk!'
          : 'Pelan-pelan saja. Kamu boleh mencoba lagi.'}
    </div>
  );
  const summary = s.phase === 'bridge' || s.phase === 'done';
  return (
    <div className={`app-shell learning-v2 phase-${s.phase}`}>
      <header className="topbar">
        <a href={basePath + '/'} className="brand" aria-label="Kebun Kata">
          <span className="brand-icon">
            <Sprout size={27} />
          </span>
          <span>
            Kebun<span className="brand-light">Kata</span>
            <small>TUMBUH BERSAMA KATA</small>
          </span>
        </a>
        <button
          className="help-button"
          onClick={() => {
            stopAudio();
            setHelp(true);
          }}
        >
          Panduan
        </button>
      </header>
      <main className="main">
        <div className="lesson-top">
          <div className="lesson-label">
            <Leaf size={16} /> Buah-buahan · 6 kata
          </div>
          <div className="top-actions">
            <button
              className="catalog-button"
              onClick={() => {
                stopAudio();
                setCatalog(true);
              }}
            >
              {vocabularyCount} kata
            </button>
            <Tabs
              value={language}
              onValueChange={(v) => changeLanguage(v as Language)}
            >
              <TabsList className="language-tabs" aria-label="Bahasa belajar">
                <TabsTrigger value="en">Inggris</TabsTrigger>
                <TabsTrigger value="ar">
                  Arab <span lang="ar">ع</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <p className="save-note" role="status">
          {storageError
            ? 'Progres belum bisa disimpan di browser ini. Kamu tetap bisa bermain.'
            : resumed
              ? 'Selamat datang kembali! Yuk, lanjutkan dari sini.'
              : 'Progres tersimpan otomatis di browser ini.'}
        </p>
        <nav className="learning-steps" aria-label="Tahap belajar">
          <span className={s.phase === 'learn' ? 'active' : ''}>
            1 · Kenalan
          </span>
          <span className={s.phase === 'sound' ? 'active' : ''}>
            2 · Cocokkan suara
          </span>
          <span className={imageMode || summary ? 'active' : ''}>
            {imageMode || summary ? '3 · Temukan gambar' : '3 · Gambar 🔒'}
          </span>
        </nav>
        {!summary && (
          <>
            <div className="progress-row">
              <Progress
                className="lesson-progress"
                value={(completed / words.length) * 100}
                aria-label={`${completed} dari 6 kata dilatih pada tahap ini`}
              />
              <span>
                <Star size={18} /> {completed} / 6
              </span>
            </div>
            <div className="title-row">
              <h1>
                {imageMode
                  ? 'Gambar mana yang cocok?'
                  : s.phase === 'learn'
                    ? 'Dengar dulu, lalu tirukan.'
                    : 'Suara mana yang cocok?'}
              </h1>
              <span className="round-label">
                {review ? 'Latihan lagi' : `Kata ${s.cursor + 1}`}
              </span>
            </div>
            {imageMode ? (
              <section
                className="image-game"
                aria-label="Dengarkan kata dan pilih gambar"
              >
                <button
                  className={`listen-prompt ${playing === 'word' ? 'is-playing' : ''}`}
                  onClick={hearWord}
                  aria-label="Dengarkan kata yang harus dicari"
                >
                  <Volume2 size={36} />
                  <span>
                    {s.heard ? 'Dengarkan lagi' : 'Sentuh untuk mendengar'}
                  </span>
                </button>
                <p>Dengarkan katanya, lalu sentuh gambar yang cocok.</p>
                <div className="picture-options">
                  {s.options.map((index, slot) => (
                    <button
                      key={slot}
                      className={`picture-option ${s.selected === slot ? s.feedback : ''}`}
                      onClick={() => answer(slot)}
                      disabled={!s.heard || correct}
                      aria-label={`Pilih gambar ${slot + 1}`}
                      aria-pressed={s.selected === slot}
                    >
                      <img
                        src={`${basePath}/fruits/${words[index].id}.webp`}
                        alt=""
                        draggable={false}
                      />
                      <span>{slot + 1}</span>
                    </button>
                  ))}
                </div>
                {feedback}
                {correct && (
                  <p className="revealed-word">
                    <strong
                      lang={language}
                      dir={language === 'ar' ? 'rtl' : undefined}
                    >
                      {word[language]}
                    </strong>{' '}
                    · {word.idn}
                  </p>
                )}
                {correct && (
                  <button className="primary next-button" onClick={next}>
                    Lanjut <ArrowRight size={20} />
                  </button>
                )}
              </section>
            ) : (
              <section
                className="game-board"
                aria-label={`Belajar ${word.idn}`}
              >
                <div
                  className="picture-side"
                  style={{ '--fruit-tint': word.tint } as React.CSSProperties}
                >
                  <span className="listen-label">
                    <Headphones size={16} /> Sentuh & dengarkan
                  </span>
                  <button
                    className={`fruit-button ${playing === 'word' ? 'is-playing' : ''}`}
                    onClick={hearWord}
                    aria-label={`Dengarkan nama ${word.idn}`}
                  >
                    <img
                      src={`${basePath}/fruits/${word.id}.webp`}
                      alt={word.idn}
                      draggable={false}
                    />
                    <span className="fruit-sound">
                      <Volume2 size={25} />
                    </span>
                  </button>
                  <div className="word-caption">
                    <strong
                      lang={language}
                      dir={language === 'ar' ? 'rtl' : undefined}
                    >
                      {s.heard || playing === 'word'
                        ? word[language]
                        : 'Ini buah apa, ya?'}
                    </strong>
                    <span>
                      {s.heard
                        ? `${language === 'ar' ? word.roman + ' · ' : ''}${word.idn}`
                        : 'Sentuh gambar untuk mendengar'}
                    </span>
                  </div>
                </div>
                <div className="activity-side">
                  {s.phase === 'learn' ? (
                    <div className="learn-content">
                      <span className="big-listen">
                        <Volume2 size={32} />
                      </span>
                      <h2>
                        {review
                          ? 'Kita dengarkan lagi, yuk!'
                          : 'Kenalan dengan satu kata.'}
                      </h2>
                      <p>
                        Sentuh gambar dan tirukan katanya. Boleh dengarkan
                        berkali-kali.
                      </p>
                      <button
                        className="primary"
                        disabled={!s.heard}
                        onClick={() => {
                          stopAudio();
                          changed({ phase: 'sound' });
                        }}
                      >
                        Ayo, cocokkan suara <ArrowRight size={20} />
                      </button>
                      <span className="gentle-note">
                        {s.heard
                          ? 'Sudah siap? Yuk, coba!'
                          : 'Dengarkan sampai selesai, lalu lanjut.'}
                      </span>
                    </div>
                  ) : (
                    <div className="quiz-content">
                      <h2>Dengarkan. Pilih. Cocokkan!</h2>
                      <p>
                        Sentuh suara untuk mendengar. Geser pilihanmu ke kotak.
                      </p>
                      <div className="sound-options">
                        {s.options.map((index, slot) => (
                          <button
                            key={slot}
                            className={`sound-option color-${slot} ${s.selected === slot ? 'selected' : ''} ${drag?.slot === slot ? 'dragging' : ''} ${playing === `choice-${slot}` ? 'is-playing' : ''}`}
                            disabled={correct}
                            aria-label={`Dengarkan suara ${slot + 1}`}
                            aria-pressed={s.selected === slot}
                            onPointerDown={(e) => pointerDown(e, slot)}
                            onClick={() => {
                              if (Date.now() < suppressClickUntil.current)
                                return;
                              changed({ selected: slot });
                              play(
                                `${words[index].id}-${language}`,
                                `choice-${slot}`,
                              );
                            }}
                          >
                            <span className="sound-top">
                              <span>{slot + 1}</span>
                              <Grip size={14} />
                            </span>
                            <Volume2 size={30} />
                            <span className="sound-name">Suara {slot + 1}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        ref={drop}
                        className={`answer-box ${s.feedback} ${over ? 'drag-over' : ''}`}
                        disabled={correct}
                        aria-label="Kotak jawaban"
                        aria-live="polite"
                        onClick={() => {
                          if (
                            Date.now() >= suppressClickUntil.current &&
                            s.selected !== null
                          )
                            answer(s.selected);
                        }}
                      >
                        <span className="box-icon">
                          {correct ? (
                            <Check size={26} />
                          ) : (
                            <Headphones size={27} />
                          )}
                        </span>
                        <strong>
                          {correct
                            ? 'Betul! Kamu hebat!'
                            : over
                              ? 'Lepaskan di sini!'
                              : s.feedback === 'wrong'
                                ? 'Belum cocok. Coba lagi, yuk!'
                                : 'Taruh suaramu di sini'}
                        </strong>
                        <span>
                          {correct
                            ? word[language]
                            : 'Bisa juga: ketuk suara, lalu ketuk kotak.'}
                        </span>
                      </button>
                      {correct && (
                        <button className="primary next-button" onClick={next}>
                          Lanjut <ArrowRight size={20} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
        {summary && (
          <section className="celebration">
            <div className="trophy">
              <Star size={60} fill="currentColor" />
            </div>
            <h1>
              {s.phase === 'bridge'
                ? 'Sekarang, cari gambarnya!'
                : 'Hebat, kamu sudah berlatih!'}
            </h1>
            <p>
              {s.phase === 'bridge'
                ? 'Kamu sudah mencocokkan suara. Sekarang dengarkan satu kata, lalu pilih gambarnya tanpa melihat nama buah.'
                : 'Setiap usaha membuatmu semakin kenal kata. Kata yang masih sulit akan kita latih lagi di sesi berikutnya.'}
            </p>
            {s.phase === 'done' && (
              <div className="harvest">
                {words.map((w) => (
                  <img
                    src={`${basePath}/fruits/${w.id}.webp`}
                    alt={w.idn}
                    key={w.id}
                  />
                ))}
              </div>
            )}
            <button
              className="primary"
              onClick={() => {
                stopAudio();
                setResumed(false);
                setSession(
                  s.phase === 'bridge' ? startImages(s) : newSession(s.stats),
                );
              }}
            >
              {s.phase === 'bridge'
                ? 'Ayo, temukan gambarnya'
                : 'Main sesi baru'}{' '}
              <ArrowRight size={20} />
            </button>
            <p className="gentle-note">
              Boleh istirahat. Progresmu tetap tersimpan di browser ini.
            </p>
          </section>
        )}
        {audioError && (
          <p role="alert" className="audio-alert">
            Suara belum bisa diputar. Periksa volume dan koneksi, lalu sentuh
            tombol suaranya lagi.
          </p>
        )}
      </main>
      <footer>
        <span>
          <Sprout size={16} /> Sedikit bermain, banyak belajar.
        </span>
        <span>Tanpa akun · Tanpa iklan</span>
      </footer>
      {drag && (
        <div
          className="drag-ghost"
          aria-hidden="true"
          style={{ left: drag.x, top: drag.y }}
        >
          <Volume2 size={25} />
          <b>Suara {drag.slot + 1}</b>
        </div>
      )}
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="guide" showCloseButton={false}>
          <div className="guide-heading">
            <DialogTitle>Panduan teman belajar</DialogTitle>
            <DialogClose className="close-guide" aria-label="Tutup panduan">
              <X size={20} />
            </DialogClose>
          </div>
          <DialogDescription>
            Dampingi si kecil, satu kata setiap kali bermain.
          </DialogDescription>
          <ol>
            <li>
              <b>Kenalan:</b> sentuh gambar, dengarkan, lalu tirukan.
            </li>
            <li>
              <b>Cocokkan suara:</b> dengarkan pilihan yang posisinya diacak.
              Geser ke kotak, atau ketuk suara lalu ketuk kotak.
            </li>
            <li>
              <b>Temukan gambar:</b> setelah tahap suara selesai, dengarkan kata
              dan pilih gambar tanpa petunjuk tulisan.
            </li>
          </ol>
          <p>
            Kata yang salah diulang setelah kata lain, maksimal satu pengulangan
            per kata pada setiap tahap. Jika masih sulit, kata itu didahulukan
            pada sesi berikutnya.
          </p>
          <p>
            Progres Inggris dan Arab tersimpan terpisah di browser ini. Progres
            tidak berpindah antarperangkat atau alamat situs dan dapat hilang
            jika data browser dihapus. Tidak menggunakan mikrofon.
          </p>
          <DialogClose className="primary">Yuk, bermain</DialogClose>
        </DialogContent>
      </Dialog>
      <Dialog open={catalog} onOpenChange={setCatalog}>
        <DialogContent className="catalog-dialog" showCloseButton={false}>
          <div className="guide-heading">
            <div>
              <DialogTitle>Perpustakaan kata</DialogTitle>
              <DialogDescription>
                {vocabularyCount} kosakata · Latihan aktif: 6 buah
              </DialogDescription>
            </div>
            <DialogClose
              className="close-guide"
              aria-label="Tutup perpustakaan"
            >
              <X size={20} />
            </DialogClose>
          </div>
          <div className="theme-grid">
            {vocabularyThemes.map((t) => (
              <button
                key={t.id}
                className={`theme-card ${theme === t.id ? 'active' : ''}`}
                onClick={() => setTheme(t.id)}
              >
                <span>{t.emoji}</span>
                <strong>{t.title}</strong>
                <small>{t.words.length} kata</small>
              </button>
            ))}
          </div>
          <div className="word-list">
            <h3>{vocabularyThemes.find((t) => t.id === theme)?.title}</h3>
            <div className="word-chips">
              {vocabularyThemes
                .find((t) => t.id === theme)
                ?.words.map((w, i) => (
                  <span key={i}>
                    {i + 1}. {w}
                  </span>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
