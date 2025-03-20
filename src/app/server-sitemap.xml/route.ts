import { getServerSideSitemap } from 'next-sitemap';
import { GetServerSideProps } from 'next';
import { firestoreService } from '@/services/firestore';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  limit, 
  orderBy 
} from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    // Base URL from environment or default
    const baseUrl = process.env.SITE_URL || 'https://dropship-email-platform.com';
    
    // Arrays to collect different types of dynamic URLs
    const dynamicPages = [];
    const sitemapFields = [];
    
    // Get published templates that should be public (if applicable)
    try {
      const templatesRef = collection(firestoreService.db, 'templates');
      const publicTemplatesQuery = query(
        templatesRef,
        where('status', '==', 'published'),
        where('isPublic', '==', true),
        limit(1000)
      );
      
      const templatesSnapshot = await getDocs(publicTemplatesQuery);
      
      templatesSnapshot.forEach((doc) => {
        const data = doc.data();
        dynamicPages.push({
          loc: `${baseUrl}/templates/${doc.id}`,
          lastmod: new Date(data.lastModified || Date.now()).toISOString(),
          changefreq: 'weekly',
          priority: 0.7,
        });
      });
    } catch (error) {
      console.error('Error fetching templates for sitemap:', error);
    }
    
    // Get blog posts if you have them
    try {
      const blogRef = collection(firestoreService.db, 'blog');
      const publicBlogQuery = query(
        blogRef,
        where('published', '==', true),
        orderBy('publishDate', 'desc'),
        limit(1000)
      );
      
      const blogSnapshot = await getDocs(publicBlogQuery);
      
      blogSnapshot.forEach((doc) => {
        const data = doc.data();
        dynamicPages.push({
          loc: `${baseUrl}/blog/${doc.id}`,
          lastmod: new Date(data.updatedAt || data.publishDate || Date.now()).toISOString(),
          changefreq: 'monthly',
          priority: 0.6,
        });
      });
    } catch (error) {
      console.error('Error fetching blog posts for sitemap:', error);
    }
    
    // Add any feature pages you have
    const featurePages = [
      { slug: 'email-automation', name: 'Email Automation' },
      { slug: 'analytics-dashboard', name: 'Analytics Dashboard' },
      { slug: 'sms-marketing', name: 'SMS Marketing' },
      { slug: 'a-b-testing', name: 'A/B Testing' },
      { slug: 'lead-generation', name: 'Lead Generation' }
    ];
    
    featurePages.forEach(feature => {
      dynamicPages.push({
        loc: `${baseUrl}/features/${feature.slug}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      });
    });
    
    // Combine all dynamic pages
    sitemapFields.push(...dynamicPages);
    
    // Return the sitemap
    return getServerSideSitemap(sitemapFields);
  } catch (error) {
    console.error('Error generating server sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
} 