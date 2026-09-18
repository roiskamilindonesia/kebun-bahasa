'use client';

import { useEffect, useState } from 'react';
import LearningGame from '../learning-game';
import '../access.css';

export default function FullApplicationPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const hasAccess = localStorage.getItem('kebun-kata:access') === 'owner-preview';
    if (!hasAccess) {
      window.location.replace('/masuk');
      return;
    }
    setAuthorized(true);
  }, []);

  if (!authorized) {
    return (
      <main className="access-page">
        <p className="access-loading">Membuka Kebun Kata…</p>
      </main>
    );
  }

  return <LearningGame />;
}
