
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingProvider } from '@/context/loading-context';
import { PageLoader } from '@/components/layout/page-loader';

export default function AppPagesLayout({ children }: { children: ReactNode }) {
  return (
    <LoadingProvider>
      <PageLoader />
      <AppShell>{children}</AppShell>
    </LoadingProvider>
  );
}
