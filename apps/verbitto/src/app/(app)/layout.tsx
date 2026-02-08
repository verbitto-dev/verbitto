import { Suspense } from 'react';

import { SiteHeader } from '@/components/site-header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
    </>
  );
}
