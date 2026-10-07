import type { NextConfig } from "next";

const config: NextConfig = {
  images: { unoptimized: true },
  transpilePackages: ["@race-key/themes"],
};

export default config;
