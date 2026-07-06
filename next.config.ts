import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["steam-user", "@doctormckay/steam-crypto"],
  // steam-user resolves its (de)compression backend via a dynamic
  // require(moduleName), which @vercel/nft can't statically follow, so it
  // silently drops these packages from the serverless bundle on Vercel.
  outputFileTracingIncludes: {
    "/api/steam/**/*": ["./node_modules/lzma/**/*"],
  },
};

export default nextConfig;
