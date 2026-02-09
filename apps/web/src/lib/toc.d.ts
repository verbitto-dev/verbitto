export interface TocItem {
    id: string;
    title: string;
    depth: number;
}
/**
 * Extract headings from raw markdown/MDX body text.
 * Returns an array of {id, title, depth} for h2/h3/h4.
 */
export declare function getTableOfContents(raw: string): TocItem[];
