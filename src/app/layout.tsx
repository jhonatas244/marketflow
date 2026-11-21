import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'MARKETFLOW | Affiliate Intelligence', description: 'Central inteligente de marketing de afiliados' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
