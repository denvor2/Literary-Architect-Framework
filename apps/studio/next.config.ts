import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverRuntimeConfig: {
    // Only available on the server side
    host: "127.0.0.1",
    port: 3000,
  },
};

export default nextConfig;
