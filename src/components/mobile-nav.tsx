'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="size-8 p-0"
        onClick={() => setOpen(!open)}
      >
        <div className="relative size-4">
          <span
            className={cn(
              'absolute left-0 block h-0.5 w-4 bg-foreground transition-all duration-100',
              open ? '-rotate-45 top-[0.4rem]' : 'top-1'
            )}
          />
          <span
            className={cn(
              'absolute left-0 block h-0.5 w-4 bg-foreground transition-all duration-100',
              open ? 'top-[0.4rem] rotate-45' : 'top-2.5'
            )}
          />
        </div>
        <span className="sr-only">Toggle menu</span>
      </Button>

      {open && (
        <div className="fixed inset-x-0 top-14 z-50 bg-background/95 backdrop-blur p-6">
          <div className="flex flex-col gap-4">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xl font-medium"
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
