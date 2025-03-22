import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Base URL from environment or default
    const baseUrl = process.env.SITE_URL || 'https://dropship-email-platform.com';
    
    // Array to collect URLs
    const sitemapFields = [];

    // Add static pages
    const staticPages = [
      '/',
      '/features',
      '/pricing',
      '/contact',
      '/about',
      '/faq',
      '/privacy',
      '/terms',
    ];

    // Add static pages to sitemap
    staticPages.forEach(page => {
      sitemapFields.push({
        loc: `${baseUrl}${page}`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: page === '/' ? 1.0 : 0.7,
      });
    });

    // Generate XML
    const xml = generateSitemapXml(sitemapFields);

    // Return the XML with appropriate headers
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}

function generateSitemapXml(fields: Array<{ loc: string, lastmod: string, changefreq: string, priority: number }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${fields.map(field => `
        <url>
          <loc>${field.loc}</loc>
          <lastmod>${field.lastmod}</lastmod>
          <changefreq>${field.changefreq}</changefreq>
          <priority>${field.priority}</priority>
        </url>
      `).join('')}
    </urlset>`;
} 