import * as React from 'react';

import { cn } from '@/lib/utils';

function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}) {
  const variants: Record<string, string> = {
    default: 'border-transparent bg-primary text-primary-foreground shadow',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
    outline: 'text-foreground',
    success: 'border-transparent bg-success text-white shadow',
    warning: 'border-transparent bg-warning text-black shadow',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
