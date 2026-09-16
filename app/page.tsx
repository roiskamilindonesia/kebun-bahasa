import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Headphones,
  Languages,
  Leaf,
  Play,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
} from 'lucide-react';
import './landing.css';

const themes = [
  'Buah-buahan',
  'Sayur-sayuran',
  'Benda di rumah',
  'Benda di sekolah',
  'Profesi',
  'Binatang',
];

export default function Home() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="/" aria-label="Kebun Kata — Beranda">
          <span className="landing-brand-mark"><Sprout size={26} /></span>
          <span>Kebun<strong>Kata</strong></span>
        </a>
        <nav aria-label="Navigasi utama">
          <a href="#cara-belajar">Cara belajar</a>
          <a href="#isi">Isi aplikasi</a>
          <a className="nav-play" href="/masuk">Beli Produk <ArrowRight size={17} /></a>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="hero-kicker"><Leaf size={16} /> Belajar lewat suara dan permainan</span>
            <h1>Kata baru tumbuh dari rasa ingin tahu.</h1>
            <p>
              Temani anak mengenal kosakata bahasa Inggris dan Arab dengan cara
              yang sederhana: sentuh gambar, dengarkan, lalu cocokkan suaranya.
            </p>
            <div className="hero-actions">
              <a className="primary-cta" href="/belajar"><Play size={20} fill="currentColor" /> Coba Trial</a>
              <a className="secondary-cta" href="/masuk">Sudah punya kode?</a>
            </div>
            <div className="hero-proof" aria-label="Ringkasan isi aplikasi">
              <span><strong>200</strong> kosakata</span>
              <span><strong>11</strong> tema</span>
              <span><strong>2</strong> bahasa</span>
            </div>
          </div>

          <div className="hero-garden" aria-label="Tema belajar Kebun Kata">
            <div className="garden-glow" />
            <div className="garden-card garden-card-main">
              <span className="garden-badge"><Headphones size={17} /> Sentuh &amp; dengarkan</span>
              <img src="/themes/fruit.png" alt="Ilustrasi tema buah-buahan" />
              <div><strong>Anggur</strong><span>Grape · عِنَب</span></div>
            </div>
            <div className="garden-card garden-card-small garden-one">
              <img src="/themes/mammals.png" alt="Ilustrasi tema binatang mamalia" />
            </div>
            <div className="garden-card garden-card-small garden-two">
              <img src="/themes/school.png" alt="Ilustrasi tema benda di sekolah" />
            </div>
            <span className="float-star star-one"><Star fill="currentColor" /></span>
            <span className="float-star star-two"><Sparkles /></span>
          </div>
        </section>

        <section className="benefit-strip" aria-label="Manfaat utama">
          <div><Headphones /><span><strong>Suara yang jelas</strong>Didengar berulang kali</span></div>
          <div><Languages /><span><strong>Inggris &amp; Arab</strong>Dalam satu aplikasi</span></div>
          <div><ShieldCheck /><span><strong>Ramah anak</strong>Tanpa iklan mengganggu</span></div>
        </section>

        <section className="how-section" id="cara-belajar">
          <div className="section-heading">
            <span>CARA BELAJAR</span>
            <h2>Tiga langkah kecil yang mudah diikuti</h2>
            <p>Anak belajar dengan melihat, mendengar, bergerak, dan mencoba kembali.</p>
          </div>
          <div className="steps-grid">
            <article>
              <span className="step-number">01</span>
              <div className="step-icon"><Headphones /></div>
              <h3>Kenalan dengan kata</h3>
              <p>Sentuh gambar beberapa kali, dengarkan pelafalannya, lalu tirukan bersama.</p>
            </article>
            <article>
              <span className="step-number">02</span>
              <div className="step-icon"><BookOpen /></div>
              <h3>Cocokkan suara</h3>
              <p>Dengarkan tiga pilihan suara dan pindahkan jawaban yang cocok ke kotak.</p>
            </article>
            <article>
              <span className="step-number">03</span>
              <div className="step-icon"><Sparkles /></div>
              <h3>Temukan gambarnya</h3>
              <p>Dengarkan kata tanpa petunjuk teks, lalu pilih gambar yang benar.</p>
            </article>
          </div>
        </section>

        <section className="content-section" id="isi">
          <div className="content-copy">
            <span className="section-label">ISI APLIKASI</span>
            <h2>Dekat dengan dunia anak sehari-hari</h2>
            <p>
              Kosakata dikelompokkan dalam tema yang mudah dikenali agar anak
              dapat menghubungkan kata baru dengan benda dan kegiatan di sekitarnya.
            </p>
            <ul>
              <li><CheckCircle2 /> 200 kosakata bergambar</li>
              <li><CheckCircle2 /> Pelafalan Inggris dan Arab</li>
              <li><CheckCircle2 /> Progres tersimpan di perangkat</li>
              <li><CheckCircle2 /> Latihan bisa diulang kapan saja</li>
            </ul>
          </div>
          <div className="theme-cloud">
            {themes.map((theme, index) => (
              <span key={theme} className={`theme-pill theme-${index + 1}`}>{theme}</span>
            ))}
            <span className="theme-more">+ 5 tema lainnya</span>
          </div>
        </section>

        <section className="final-cta">
          <div>
            <span><Sprout size={18} /> Siap bertumbuh bersama?</span>
            <h2>Mulai satu kata hari ini.</h2>
            <p>Sesi singkat, menyenangkan, dan nyaman dimainkan melalui hape.</p>
          </div>
          <a href="/masuk">Beli Produk <ArrowRight /></a>
        </section>
      </main>

      <footer className="landing-footer">
        <a className="landing-brand" href="/">
          <span className="landing-brand-mark"><Sprout size={23} /></span>
          <span>Kebun<strong>Kata</strong></span>
        </a>
        <p>Belajar bahasa dengan sentuhan, suara, dan rasa ingin tahu.</p>
      </footer>
    </div>
  );
}
