import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'AI Physiotherapist',
  description: 'Personalized injury assessment and rehabilitation planning powered by AI.',
  verification: {
    google: 'W6r9njDL8arNcw4n05gQ2EZEHYhVujeu75UtNxt68pA',
  },
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
