import { getRssString } from '@astrojs/rss';

import { SITE, METADATA, APP_BLOG } from 'astrowind:config';
import { fetchPosts } from '~/utils/blog';
import { getPermalink } from '~/utils/permalinks';

export const GET = async () => {
  if (!APP_BLOG.isEnabled) {
    return new Response(null, {
      status: 404,
      statusText: 'Not found',
    });
  }

  try {
    const posts = await fetchPosts();

    // Si no hay posts, devolver un RSS vacío pero válido
    if (!posts || posts.length === 0) {
      const rss = await getRssString({
        title: `${SITE.name} - Blog Médico Domiciliario Bogotá`,
        description: 'Blog especializado en salud domiciliaria, medicina domiciliaria, enfermería domiciliaria y servicios médicos a domicilio en Bogotá. Artículos médicos especializados por profesionales certificados.',
        site: import.meta.env.SITE,
        language: 'es-CO',
        copyright: `© ${new Date().getFullYear()} ${SITE.name}. Todos los derechos reservados.`,
        managingEditor: 'salud@smdvitalbogota.com (SMD Vital Bogotá)',
        webMaster: 'salud@smdvitalbogota.com (SMD Vital Bogotá)',
        lastBuildDate: new Date(),
        ttl: 60,
        items: [], // Array vacío pero válido
        trailingSlash: SITE.trailingSlash,
      });

      return new Response(rss, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Filtrar y validar posts
    const validPosts = posts.filter(post => 
      post && 
      (post.title || post.description) && 
      post.publishDate && 
      post.permalink
    );

    const rss = await getRssString({
      title: `${SITE.name} - Blog Médico Domiciliario Bogotá`,
      description: 'Blog especializado en salud domiciliaria, medicina domiciliaria, enfermería domiciliaria y servicios médicos a domicilio en Bogotá. Artículos médicos especializados por profesionales certificados.',
      site: import.meta.env.SITE,
      language: 'es-CO',
      copyright: `© ${new Date().getFullYear()} ${SITE.name}. Todos los derechos reservados.`,
      managingEditor: 'salud@smdvitalbogota.com (SMD Vital Bogotá)',
      webMaster: 'salud@smdvitalbogota.com (SMD Vital Bogotá)',
      lastBuildDate: new Date(),
      ttl: 60,

      items: validPosts.map((post) => ({
        link: getPermalink(post.permalink, 'post'),
        title: post.title || 'Sin título',
        description: post.excerpt || post.description || 'Sin descripción',
        pubDate: post.publishDate,
        guid: getPermalink(post.permalink, 'post'),
        categories: post.tags || [],
        author: post.author || 'SMD Vital Bogotá',
        content: post.content || post.excerpt || post.description || 'Sin contenido',
        enclosure: post.image ? {
          url: post.image,
          type: 'image/jpeg',
          length: 0
        } : undefined,
      })),

      trailingSlash: SITE.trailingSlash,
    });

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap RSS feed:', error);
    
    // Devolver un RSS básico en caso de error
    const rss = await getRssString({
      title: `${SITE.name} - Blog Médico Domiciliario Bogotá`,
      description: 'Blog especializado en salud domiciliaria, medicina domiciliaria, enfermería domiciliaria y servicios médicos a domicilio en Bogotá.',
      site: import.meta.env.SITE,
      language: 'es-CO',
      copyright: `© ${new Date().getFullYear()} ${SITE.name}. Todos los derechos reservados.`,
      lastBuildDate: new Date(),
      items: [],
      trailingSlash: SITE.trailingSlash,
    });

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
};
