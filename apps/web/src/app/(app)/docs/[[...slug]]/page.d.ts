import type { Metadata } from 'next';
type DocPageProps = {
    params: Promise<{
        slug?: string[];
    }>;
};
export declare function generateStaticParams(): Promise<any>;
export declare function generateMetadata({ params }: DocPageProps): Promise<Metadata>;
export default function DocPage({ params }: DocPageProps): Promise<import("react").JSX.Element>;
export {};
