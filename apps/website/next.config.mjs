/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["shiki"],
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/api/auth/:path*`,
      },
      { source: "/api/proxy/:path*", destination: `${apiUrl}/:path*` },
    ]
  },
}

export default nextConfig
