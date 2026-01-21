import './globals.css';

export const metadata = {
  title: 'marton.ai & Raumblick360 Dashboard',
  description: 'Business Intelligence Dashboard für marton.ai SaaS und Raumblick360 Agentur',
  icons: {
    icon: 'https://storage.googleapis.com/aistudio-community-public/marton-logo-teal.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
