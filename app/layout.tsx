import type { Metadata } from 'next';
import './globals.css';
export const dynamic = 'force-static';
export const metadata: Metadata = { title:'Kebun Kata — Belajar Bahasa Inggris untuk Anak', description:'Web app ramah anak untuk belajar 200 kosakata bahasa Inggris dan Indonesia melalui gambar, suara, dan permainan interaktif.', icons:{icon:'/icon.svg'}, };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="id"><body>{children}</body></html>; }
