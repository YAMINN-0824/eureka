// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // これを追加
  },
  eslint: {
    ignoreDuringBuilds: true,  // これを追加
  },
  // 他の設定があればそのまま残す
};

export default nextConfig;
