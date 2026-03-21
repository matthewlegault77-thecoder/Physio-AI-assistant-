import './globals.css';
import Link from 'next/link';

export const metadata = {
  metadataBase: new URL('https://physioaipal.com'),
  title: 'AI Physiotherapist',
  description: 'Physio AI Pal - pocket physiotherapist. Powered by Claude AI for deeply personalized injury assessments and rehab plans, available 24/7 from any device.',
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'W6r9njDL8arNcw4n05gQ2EZEHYhVujeu75UtNxt68pA',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="bg-slate-900 text-slate-400 py-8 px-4 mt-auto">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} Physio AI Pal</p>
            <nav className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/refund" className="text-sm hover:text-white transition-colors">Refund Policy</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
