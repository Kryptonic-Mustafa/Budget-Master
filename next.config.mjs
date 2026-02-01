/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/portal',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;