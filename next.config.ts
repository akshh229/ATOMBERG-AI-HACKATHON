import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://127.0.0.1:3100", "http://localhost:3100"],
  typedRoutes: false
};

export default nextConfig;
