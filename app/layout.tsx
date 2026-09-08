import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'Kebun Kata — Belajar Inggris & Arab', description:'Sentuh, dengarkan, dan cocokkan! Permainan nama buah dalam bahasa Inggris dan Arab yang ramah anak.', icons:{icon:'/icon.svg'}, };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="id"><body>{children}</body></html>; }
