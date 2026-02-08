import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: false,
    },
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                hostname: 'avatars.githubusercontent.com',
                protocol: 'https',
            },
        ],
    },
};

export default nextConfig;
