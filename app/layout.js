import './globals.css';

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
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
