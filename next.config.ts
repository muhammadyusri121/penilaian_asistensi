import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: {
      ignore: [/\/login/, /\/register/],
    },
  },
};

export default nextConfig;
