/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-secret-key',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://sanmemik2000:s6IJeH00mI1CLifg@cluster0.aism76i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    MONGODB_DB: process.env.MONGODB_DB || 'greenleaf',
  },
  // Disable TypeScript checks during build for Vercel deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint checks during build for Vercel deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig