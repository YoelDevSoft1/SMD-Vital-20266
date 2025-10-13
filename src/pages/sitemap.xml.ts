import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from 'astrowind:config';

// Función para formatear fechas al formato ISO 8601 requerido por Google
const formatDateForSitemap = (date: Date | string | undefined): string => {
  if (!date) return new Date().toISOString();
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verificar si la fecha es válida
  if (isNaN(dateObj.getTime())) {
    return new Date().toISOString();
  }
  
  return dateObj.toISOString();
};

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('post');
  const pages = await getCollection('page');

  const allPages = [...posts, ...pages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${allPages
    .map((page) => {
      const url = new URL(page.slug, site);
      const lastmod = formatDateForSitemap(page.data.publishDate || page.data.modDate);
      const publishDate = formatDateForSitemap(page.data.publishDate);
      
      return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.collection === 'post' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${page.collection === 'post' ? '0.8' : '0.6'}</priority>
    ${page.data.image ? `
    <image:image>
      <image:loc>${page.data.image.replace(/&/g, '&amp;')}</image:loc>
      <image:title>${page.data.title}</image:title>
      <image:caption>${page.data.excerpt}</image:caption>
    </image:image>` : ''}
    ${page.collection === 'post' ? `
    <news:news>
      <news:publication>
        <news:name>SMD Vital Bogotá</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${publishDate}</news:publication_date>
      <news:title>${page.data.title}</news:title>
      <news:keywords>${page.data.tags?.join(', ') || ''}</news:keywords>
    </news:news>` : ''}
  </url>`;
    })
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
