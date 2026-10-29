import type { Metadata } from 'next';
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', weight: ['500', '700'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600'] });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'TransitOps',
  description: 'Smart Transport Operations Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
