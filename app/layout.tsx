import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Raleway } from "next/font/google";
import { Toaster } from 'sonner';
import './globals.css';
import { QueryProvider } from '@/components/query-provider';
import { LanguageProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'VIKOBA360 — Manage Your VIKOBA. Grow Together.',
  description: 'A modern, secure platform for managing VIKOBA community savings groups across Tanzania and East Africa.',
  generator: 'v0.app',
}

const inter = Raleway({
  subsets: ['latin'],
  display: 'swap',
})

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F4F4F4',
  width: 'device-width',
  initialScale: 1,
}



export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="sw" className="bg-background">
    <body className={inter.className}>
      <LanguageProvider>
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors closeButton expand />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </QueryProvider>
      </LanguageProvider>
    </body>
  </html>
}
