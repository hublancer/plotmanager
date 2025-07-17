import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LoadingProvider } from '@/context/loading-context';
import { PageLoader } from '@/components/layout/page-loader';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'PlotPilot',
  description: 'Property Management Simplified',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#21589b" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <LoadingProvider>
          <PageLoader />
          <AuthProvider>
            {children}
          </AuthProvider>
        </LoadingProvider>
        <Toaster />
      </body>
    </html>
  );
}
