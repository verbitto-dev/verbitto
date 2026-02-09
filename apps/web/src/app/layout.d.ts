import type { Metadata, Viewport } from 'next';
import type React from 'react';
import '@/app/globals.css';
export declare const metadata: Metadata;
export declare const viewport: Viewport;
export default function RootLayout({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
