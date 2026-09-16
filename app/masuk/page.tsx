'use client';

import { useState } from 'react';
import { ArrowLeft, KeyRound, LockKeyhole, Sprout } from 'lucide-react';
import '../access.css';

export default function AccessPage() {
  const [code, setCode] = useState('');
  const [checked, setChecked] = useState(false);

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
            setChecked(true);
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
                setChecked(false);
              }}
              placeholder="CONTOH: KEBUN-AB12-CD34"
              autoComplete="one-time-code"
              spellCheck={false}
            />
          </div>
          <button type="submit" disabled={code.length < 8}>Buka aplikasi</button>
        </form>
        {checked && (
          <p className="access-notice" role="status">
            Sistem kode belum dibuka karena penjualan melalui Lynk.id belum
            dimulai. Halaman ini sudah siap dan akan diaktifkan saat integrasi
            pembayaran tersedia.
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
