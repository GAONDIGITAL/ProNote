/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                key: 'X-XSS-Protection',
                value: '1; mode=block'
            }
        ]
    },
};

module.exports = nextConfig;