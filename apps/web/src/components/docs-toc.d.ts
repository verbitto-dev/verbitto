import * as React from 'react';
type TocItem = {
    id: string;
    title: string;
    depth: number;
};
export declare function DocsTableOfContents({ items }: {
    items: TocItem[];
}): React.JSX.Element | null;
export {};
