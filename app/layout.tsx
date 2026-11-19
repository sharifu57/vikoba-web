import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "VIKOBA360 — Manage Your VIKOBA. Grow Together.",
  description:
    "A modern, secure platform for managing VIKOBA community savings groups across Tanzania and East Africa.",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#F7F7F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sw" className="bg-background" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('v360_theme');document.documentElement.classList.toggle('dark',t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))}catch(e){}` }} />
    </head>
    <body style={{ fontFamily: "Inter, 'DM Sans', system-ui, sans-serif" }}>
        <LanguageProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors closeButton expand />
            {process.env.NODE_ENV === "production" && <Analytics />}
          </QueryProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
