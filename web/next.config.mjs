/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const nextConfig = {
  async rewrites() {
    // Frontend calls /api/*; Next proxies straight to the FastAPI backend.
    return [{ source: "/api/:path*", destination: `${BACKEND}/:path*` }];
  },
};

export default nextConfig;
