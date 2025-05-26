/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
      "*.supabase.co",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
    ],
  },
  // Enable static exports
  trailingSlash: true,
  // Disable server-side image optimization
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
  // Add experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

module.exports = nextConfig;
