/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://dropship-email-platform.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 5000,
  exclude: [
    '/admin/*',
    '/api/*',
    '/dashboard/*',
    '/server-sitemap.xml',
    '/auth/*',
    '/_*',
    '/404',
    '/500',
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://dropship-email-platform.com/server-sitemap.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/dashboard',
          '/auth',
        ],
      },
    ],
  },
  transform: async (config, path) => {
    // Custom priority and change frequency based on path
    let priority = 0.7;
    let changefreq = 'weekly';
    
    // Homepage gets highest priority
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    }
    // Main landing pages get higher priority
    else if (path.match(/^\/(features|pricing|about|contact|faq)$/)) {
      priority = 0.9;
      changefreq = 'weekly';
    }
    // Product/service pages get medium-high priority
    else if (path.includes('/features/')) {
      priority = 0.8;
      changefreq = 'weekly';
    }
    // Blog posts get medium priority
    else if (path.includes('/blog/')) {
      priority = 0.6;
      changefreq = 'monthly';
    }
    
    return {
      loc: path, // The URL of the page
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
} 