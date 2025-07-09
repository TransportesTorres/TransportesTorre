/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignorar errores de ESLint durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Opcional: También ignorar errores de TypeScript si hay alguno
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 