import type React from 'react';
type TocItem = {
    id: string;
    title: string;
    depth: number;
};
interface DocContentProps {
    title: string;
    description?: string;
    toc?: TocItem[];
    children: React.ReactNode;
}
export declare function DocContent({ title, description, toc, children }: DocContentProps): React.JSX.Element;
export {};
