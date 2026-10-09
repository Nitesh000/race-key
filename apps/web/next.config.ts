import type { NextConfig } from "next";

const config: NextConfig = {
  images: { unoptimized: true },
  transpilePackages: ["@race-key/themes", "@race-key/shared", "@race-key/passages", "@race-key/db"],
};

export default config;
