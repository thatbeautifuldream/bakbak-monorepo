/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["shiki"],
  rewrites: async () => [
    {
      source: "/video",
      destination: "https://youtube.com/watch?v=8B5bvayecUE",
    },
  ],
}

export default nextConfig
