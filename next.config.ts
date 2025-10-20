/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL: process.env.SUPABASE_EDGE_FUNCTION_URL,
  },
}

module.exports = nextConfig
module.exports = {
  images: {
    domains: ['acsobefarzmetevcseal.supabase.co'],
  },
};
