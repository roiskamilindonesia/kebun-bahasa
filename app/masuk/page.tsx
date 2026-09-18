'use client';

import { useState } from 'react';
import { ArrowLeft, KeyRound, LockKeyhole, Sprout } from 'lucide-react';
import '../access.css';

export default function AccessPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  return (
    <main className="access-page">
      <a className="access-back" href="/"><ArrowLeft size={18} /> Kembali</a>
      <section className="access-card">
        <a className="access-brand" href="/" aria-label="Kebun Kata">
          <span><Sprout size={28} /></span>
          Kebun<strong>Kata</strong>
        </a>
        <div className="access-icon"><LockKeyhole size={36} /></div>
        <span className="access-eyebrow">AKSES PEMBELI</span>
        <h1>Masukkan kode unik</h1>
        <p>
          Kode akses dikirim setelah pembayaran berhasil. Satu kode digunakan
          untuk membuka seluruh materi Kebun Kata.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (code === 'KEBUN-OWNER-2026') {
              localStorage.setItem('kebun-kata:access', 'owner-preview');
              window.location.href = '/aplikasi';
              return;
            }
            setError(true);
          }}
        >
          <label htmlFor="access-code">Kode akses Kebun Kata</label>
          <div className="code-field">
            <KeyRound size={21} />
            <input
              id="access-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase().replace(/\s/g, ''));
                setError(false);
              }}
              placeholder="CONTOH: KEBUN-AB12-CD34"
              autoComplete="one-time-code"
              spellCheck={false}
            />
          </div>
          <button type="submit" disabled={code.length < 8}>Buka aplikasi</button>
        </form>
        {error && (
          <p className="access-notice access-error" role="alert">
            Kode belum cocok. Periksa kembali huruf dan angkanya, lalu coba
            lagi.
          </p>
        )}
        <div className="purchase-note">
          <strong>Belum punya kode?</strong>
          <span>Penjualan Kebun Kata akan segera dibuka melalui Lynk.id.</span>
        </div>
      </section>
    </main>
  );
}
