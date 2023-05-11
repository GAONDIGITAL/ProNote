/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    api: {
		bodyParser: {
			sizeLimit: '50mb',
            parameterLimit: 50000,
		},
	},
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
