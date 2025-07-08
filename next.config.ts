import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignorar errores de ESLint durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Opcional: También ignorar errores de TypeScript si hay alguno
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
