'use client';

import { DocsNav } from '@/components/docs-nav';
import { docsConfig } from '@/config/docs';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container mx-auto flex flex-1 flex-col px-2">
        <div className="min-h-min flex-1 items-start px-0 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
            <div className="h-full overflow-auto scrollbar-hide">
              <DocsNav config={docsConfig} />
            </div>
          </aside>
          <div className="size-full">{children}</div>
        </div>
      </div>
    </>
  );
}
