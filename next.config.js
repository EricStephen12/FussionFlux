const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  images: {
    domains: [
      'cdn.shopify.com',
      'www.apollographql.com',
      'nowpayments.io',
      'www.liblogo.com',
      'developers.cardano.org',
      'yt3.googleusercontent.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'source.unsplash.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'placehold.co',
      'picsum.photos',
      'via.placeholder.com'
    ],
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        events: require.resolve('events/'),
        process: require.resolve('process/browser'),
        path: require.resolve('path-browserify'),
        undici: false,
      };
      
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        }),
        new webpack.NormalModuleReplacementPlugin(
          /^node:process$/,
          'process/browser'
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^node:events$/,
          'events'
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^node:stream$/,
          'stream-browserify'
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^node:util$/,
          'util'
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^node:crypto$/,
          'crypto-browserify'
        )
      );
    }
    return config;
  },
  staticPageGenerationTimeout: 180,
  swcMinify: true,
  poweredByHeader: false,
  env: {
    NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY || '',
    NOWPAYMENTS_IPN_SECRET: process.env.NOWPAYMENTS_IPN_SECRET || '',
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react'],
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
};

// Temporarily disabled Sentry for debugging build issues
// const { withSentryConfig } = require("@sentry/nextjs");
// module.exports = withSentryConfig(
//   nextConfig,
//   {
//     org: "fussionflux",
//     project: "javascript-nextjs",
//     silent: process.env.NODE_ENV === 'development',
//     hideSourceMaps: true,
//     widenClientFileUpload: true,
//     reactComponentAnnotation: {
//       enabled: true,
//     },
//     tunnelRoute: "/monitoring",
//     disableLogger: true,
//     automaticVercelMonitors: true,
//   }
// );

// Export config directly while debugging build issues
module.exports = nextConfig;
