import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';
import { SkipLink } from '@/components/SkipLink';
import DevPathFooter from '@/components/DevPathFooter';

const NoSSR = dynamic(() => import('@/components/NoSSR'), { ssr: false });
const ClientToaster = dynamic(
  () => import('react-hot-toast').then((mod) => ({ default: mod.Toaster })),
  { ssr: false }
);
const ClientAppProviders = dynamic(() => import('@/components/ClientAppProviders'), {
  ssr: false,
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Activity Tracker',
  description: 'Track and manage your activities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Tiny About link on top-left */}
        <a href="/about" className="fixed top-1 left-2 text-[10px] text-gray-400 hover:text-gray-600 z-50" aria-label="About & Build Info">
          about
        </a>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <NoSSR fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        }>
          <ClientAppProviders>
            {children}
          </ClientAppProviders>
        </NoSSR>
        <ClientToaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        {/* Dev-only path indicator */}
        {process.env.NODE_ENV !== 'production' && <DevPathFooter />}
        {/* Screen reader announcements */}
        <div
          id="live-region"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </body>
    </html>
  );
}
