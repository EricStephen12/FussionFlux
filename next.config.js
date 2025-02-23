/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'cdn.shopify.com',
      'www.apollographql.com',
      'nowpayments.io',
      'www.liblogo.com',
      'developers.cardano.org',
      'yt3.googleusercontent.com'
    ],
  },
  webpack: (config, { isServer }) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        undici: require.resolve('./src/utils/undici-mock.ts'),
      },
      fallback: {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
      }
    };

    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
        fetch: false,
      }
    }

    // Update babel-loader configuration
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript',
            ['@babel/preset-react', { runtime: 'automatic' }]
          ],
          plugins: [
            '@babel/plugin-syntax-jsx',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-private-methods'
          ]
        }
      }
    });

    return config;
  },
  // Disable experimental features
  experimental: {
    serverComponentsExternalPackages: ['undici'],
  },
  // Disable React DevTools in production
  reactStrictMode: false,
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Disable build error overlay
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // Transpile Firebase packages
  transpilePackages: ['firebase', '@firebase/auth', '@firebase/app'],
  // Optimize production build
  swcMinify: true,
  poweredByHeader: false,
  // Compiler options
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig; 