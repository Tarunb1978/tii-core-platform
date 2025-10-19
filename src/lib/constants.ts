export const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}` // production (Vercel)
  : process.env.NEXT_PUBLIC_BASE_URL;   // local development
