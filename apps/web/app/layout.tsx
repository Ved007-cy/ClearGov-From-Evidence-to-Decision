import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ClearGov',
  description: 'Evidence-based public service decision platform.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
