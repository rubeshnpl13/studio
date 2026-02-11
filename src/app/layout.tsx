import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Sprachheld - German Language Tutor',
  description: 'Practice German with your AI-powered tutor via text and voice.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sprachheld',
  },
};

export const viewport: Viewport = {
  themeColor: '#3F51B5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-body antialiased selection:bg-accent selection:text-white">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
