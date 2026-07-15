import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SkillSwap - Trade Skills, Not Money',
    description: 'Connect with skilled people in your community. Teach what you know, learn what you need — a true skill swap platform.',
    keywords: ['skill exchange', 'peer learning', 'skill swap', 'community', 'teach', 'learn'],
  authors: [{ name: 'SkillSwap' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-mark.svg',
    apple: '/icon-192x192.png',
    shortcut: '/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SkillSwap',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <ServiceWorkerRegister />
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
