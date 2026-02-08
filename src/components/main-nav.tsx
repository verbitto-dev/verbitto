'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

import { Icons } from './icons';

export function Logo() {
  return (
    <Button asChild size="lg" variant="ghost" className="hidden gap-1.5 font-bold md:flex">
      <Link href="/">
        <Icons.logo className="size-5" />
        <span>{siteConfig.name}</span>
      </Link>
    </Button>
  );
}

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('items-center gap-0.5', className)}>
      {siteConfig.navItems.map((item) => (
        <Button key={item.href} asChild size="default" variant="ghost">
          <Link
            className={cn(pathname === item.href && 'text-primary')}
            href={item.href}
          >
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
