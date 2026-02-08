import React from 'react';

import { cn } from '@/lib/utils';

/** Styled code block with optional title */
export function CodeBlock({
  children,
  title,
  className,
}: {
  children: string;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn('my-4 overflow-hidden rounded-lg border', className)}>
      {title && (
        <div className="border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

/** Inline code span */
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
      {children}
    </code>
  );
}

/** Section heading with automatic anchor */
export function H2({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mt-10 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0"
    >
      {children}
    </h2>
  );
}

export function H3({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      id={id}
      className="mt-8 scroll-m-20 text-xl font-semibold tracking-tight"
    >
      {children}
    </h3>
  );
}

/** Styled HTML table */
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b">{children}</thead>;
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="border-b transition-colors hover:bg-muted/50">{children}</tr>;
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
      {children}
    </th>
  );
}

export function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-middle">{children}</td>;
}

/** Callout / alert box */
export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: 'border-blue-500/20 bg-blue-500/5 text-blue-900 dark:text-blue-200',
    warning:
      'border-yellow-500/20 bg-yellow-500/5 text-yellow-900 dark:text-yellow-200',
    danger: 'border-red-500/20 bg-red-500/5 text-red-900 dark:text-red-200',
  };

  return (
    <div className={cn('my-6 rounded-lg border p-4', styles[type])}>
      {title && <p className="mb-1 text-sm font-semibold">{title}</p>}
      <div className="text-sm">{children}</div>
    </div>
  );
}

/** Step indicator for numbered guides */
export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 ml-4 border-l border-border pl-6 [counter-reset:step]">
      {children}
    </div>
  );
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pb-8 last:pb-0 [counter-increment:step]">
      <div className="absolute -left-[1.625rem] flex size-6 items-center justify-center rounded-full border bg-background text-xs font-medium before:content-[counter(step)]" />
      <h4 className="mb-2 text-base font-semibold">{title}</h4>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
