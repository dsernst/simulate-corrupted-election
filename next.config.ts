import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: { reactCompiler: true },
}

export default nextConfig
