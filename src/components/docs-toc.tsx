'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type TocItem = {
  id: string;
  title: string;
  depth: number;
};

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '0% 0% -80% 0%' }
    );

    for (const id of itemIds) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => {
      for (const id of itemIds) {
        const element = document.getElementById(id);
        if (element) observer.unobserve(element);
      }
    };
  }, [itemIds]);

  return activeId;
}

export function DocsTableOfContents({ items }: { items: TocItem[] }) {
  const itemIds = React.useMemo(() => items.map((item) => item.id), [items]);
  const activeId = useActiveItem(itemIds);

  if (!items.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">On This Page</p>
      <div className="flex flex-col gap-1 text-sm">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              'text-muted-foreground hover:text-foreground transition-colors',
              item.depth === 3 && 'pl-4',
              item.depth === 4 && 'pl-8',
              activeId === item.id && 'font-medium text-foreground'
            )}
          >
            {item.title}
          </a>
        ))}
      </div>
    </div>
  );
}
