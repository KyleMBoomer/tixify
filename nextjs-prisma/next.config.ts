import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['http://127.0.0.1:3000'],
  env: {
    AUTH_URL: 'http://127.0.0.1:3000',
    NEXTAUTH_URL: 'http://127.0.0.1:3000',
  },
};

export default nextConfig;
