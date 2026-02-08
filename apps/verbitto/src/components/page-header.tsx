import Balance from 'react-wrap-balancer';

import { cn } from '@/lib/utils';

function PageHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        'flex flex-col items-center gap-4 py-8 text-center md:py-12 lg:py-16',
        className
      )}
      {...props}
    >
      <div className="container flex w-full flex-col items-center">{children}</div>
    </section>
  );
}

function PageHeaderHeading({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        'font-bold text-5xl leading-[1.1] tracking-tighter md:text-6xl lg:text-7xl lg:leading-[1.05]',
        className
      )}
      {...props}
    />
  );
}

function PageHeaderDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Balance
      className={cn(
        'max-w-2xl text-balance text-center text-muted-foreground text-lg',
        className
      )}
      {...props}
    />
  );
}

function PageActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-start gap-2 pt-2',
        className
      )}
      {...props}
    />
  );
}

export { PageActions, PageHeader, PageHeaderDescription, PageHeaderHeading };
