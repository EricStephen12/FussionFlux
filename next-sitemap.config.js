/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://example.com',
  generateRobotsTxt: true,
  exclude: ['/server-sitemap.xml'], // Exclude server-side sitemap
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://example.com/server-sitemap.xml',
    ],
  },
} 