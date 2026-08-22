import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Raleway } from "next/font/google";
import './globals.css';
import { QueryProvider } from '@/components/query-provider';

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
  return <html lang="en" className="bg-background">
    <body className={inter.className}>
      <QueryProvider>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </QueryProvider>
    </body>
  </html>
}
