import './globals.css';
import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '../components/i18n/LanguageContext';

export const metadata = {
  title: 'AMA Gopalpur Constituency Dashboard',
  description: 'Map-based overview of departments and institutions in Gopalpur constituency.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LanguageProvider>
            <div className="page-container">{children}</div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

