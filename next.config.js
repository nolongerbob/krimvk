const { buildContentSecurityPolicy } = require('./lib/security/csp.js');

/** @type {import('next').NextConfig} */
const siteUrl =
  process.env.SITE_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://krimvk.ru' : 'http://localhost:3000');

const assetPrefixRaw = process.env.NEXT_PUBLIC_ASSET_PREFIX?.trim();
const assetPrefix =
  assetPrefixRaw && assetPrefixRaw.length > 0
    ? assetPrefixRaw.replace(/\/$/, '')
    : undefined;

const nextConfig = {
  ...(assetPrefix ? { assetPrefix } : {}),
  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl.replace(/\/$/, ''),
    ...(assetPrefix ? { NEXT_PUBLIC_ASSET_PREFIX: assetPrefix } : {}),
  },
  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
      },
      // Для локального хранилища на VPS
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'krimvk.ru',
      },
      {
        protocol: 'https',
        hostname: '*.krimvk.ru',
      },
      {
        protocol: 'https',
        hostname: 'yourdomain.com',
      },
    ],
  },
  // Сжатие только на CDN (gzip-on) или nginx. Двойное gzip (Next + CDN) ломает Safari на HTTP/2.
  compress: false,
  // Оптимизация production сборки
  swcMinify: true,
  // Отключаем ESLint во время сборки для Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Отключаем проверку типов во время сборки для Vercel (если есть проблемы)
  typescript: {
    ignoreBuildErrors: true, // Временно включаем для деплоя, потом можно вернуть false
  },
  // Увеличиваем лимит размера тела запроса для больших файлов
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // 50MB для больших файлов
    },
  },
  // Явно указываем webpack для разрешения путей
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };
    return config;
  },
  // Безопасность заголовков
  async headers() {
    return [
      {
        // Не вешать security headers на /_next/static — при 404 HTML браузер блокирует chunk (nosniff)
        source: '/((?!_next/static).*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: buildContentSecurityPolicy(),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

