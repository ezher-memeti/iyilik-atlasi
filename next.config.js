const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = `
  default-src 'self';
  connect-src 'self' https://*.supabase.co https://api.supabase.com;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  frame-ancestors 'none';
`.replace(/\s{2,}/g, " ").trim();

const baseSecurityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];

const productionSecurityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  ...baseSecurityHeaders,
];

const securityHeaders = isDev ? baseSecurityHeaders : productionSecurityHeaders;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
