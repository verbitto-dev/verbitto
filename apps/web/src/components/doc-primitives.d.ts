import type React from 'react';
/** Styled code block with optional title */
export declare function CodeBlock({ children, title, className, }: {
    children: string;
    title?: string;
    className?: string;
}): React.JSX.Element;
/** Inline code span */
export declare function InlineCode({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
/** Section heading with automatic anchor */
export declare function H2({ id, children }: {
    id: string;
    children: React.ReactNode;
}): React.JSX.Element;
export declare function H3({ id, children }: {
    id: string;
    children: React.ReactNode;
}): React.JSX.Element;
/** Styled HTML table */
export declare function Table({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function Thead({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function Tr({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function Th({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function Td({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
/** Callout / alert box */
export declare function Callout({ type, title, children, }: {
    type?: 'info' | 'warning' | 'danger';
    title?: string;
    children: React.ReactNode;
}): React.JSX.Element;
/** Step indicator for numbered guides */
export declare function Steps({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function Step({ title, children }: {
    title: string;
    children: React.ReactNode;
}): React.JSX.Element;
