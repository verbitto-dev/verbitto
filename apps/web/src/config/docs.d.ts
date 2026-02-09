export type NavItem = {
    title: string;
    href?: string;
    label?: string;
    items?: NavItem[];
    disabled?: boolean;
};
export type DocsConfig = {
    sidebarNav: NavItem[];
};
export declare const docsConfig: DocsConfig;
/** Flat list of all doc nav items with hrefs */
export declare function getAllDocItems(): NavItem[];
/** Get previous and next doc pages for pager navigation */
export declare function getPagerForDoc(currentPath: string): {
    previous: NavItem | undefined;
    next: NavItem | undefined;
};
