/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow displaying images served from the Supabase storage host.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
