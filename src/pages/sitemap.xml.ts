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
  
  // Forzar el uso de la URL sin www
  const baseUrl = 'https://smdvitalbogota.com';

  // Páginas estáticas del sitio
  const staticPages = [
    { slug: '', data: { title: 'SMD Vital Bogotá - Médicos a Domicilio 24/7', publishDate: new Date() } },
    { slug: 'acerca', data: { title: 'Acerca de SMD Vital', publishDate: new Date() } },
    { slug: 'contacto', data: { title: 'Contacto', publishDate: new Date() } },
    { slug: 'servicios', data: { title: 'Servicios Médicos', publishDate: new Date() } },
    { slug: 'precios', data: { title: 'Precios', publishDate: new Date() } },
    { slug: 'privacy', data: { title: 'Política de Privacidad', publishDate: new Date() } },
    { slug: 'terms', data: { title: 'Términos y Condiciones', publishDate: new Date() } },
    { slug: 'blog', data: { title: 'Blog', publishDate: new Date() } },
    { slug: 'equipo-medico', data: { title: 'Equipo Médico', publishDate: new Date() } },
    { slug: 'inicio/quienes-somos', data: { title: '¿Quiénes somos?', publishDate: new Date() } },
    { slug: 'inicio/mision', data: { title: 'Misión', publishDate: new Date() } },
    { slug: 'inicio/vision', data: { title: 'Visión', publishDate: new Date() } },
    { slug: 'inicio/filosofia', data: { title: 'Filosofía', publishDate: new Date() } },
    { slug: 'valoracion-medica-domiciliaria', data: { title: 'Valoración Médica Domiciliaria', publishDate: new Date() } },
    { slug: 'teleconsulta-medica', data: { title: 'Teleconsulta Médica', publishDate: new Date() } },
    { slug: 'electrocardiografia-basica', data: { title: 'Electrocardiografía Básica', publishDate: new Date() } },
    { slug: 'toma-de-signos-vitales', data: { title: 'Toma de Signos Vitales', publishDate: new Date() } },
    { slug: 'acompanamiento-a-citas-medicas', data: { title: 'Acompañamiento a Citas Médicas', publishDate: new Date() } },
    { slug: 'sutura-y-retiro-de-puntos', data: { title: 'Sutura y Retiro de Puntos', publishDate: new Date() } },
    { slug: 'laboratorio-a-domicilio', data: { title: 'Laboratorio a Domicilio', publishDate: new Date() } },
    { slug: 'lavado-de-oidos-a-domicilio', data: { title: 'Lavado de Oídos a Domicilio', publishDate: new Date() } },
    { slug: 'cura-de-heridas-simples-y-complejas', data: { title: 'Cura de Heridas Simples y Complejas', publishDate: new Date() } },
    { slug: 'retiro-y-colocacion-de-sonda-vesical', data: { title: 'Retiro y Colocación de Sonda Vesical', publishDate: new Date() } },
    { slug: 'toma-de-muestras-a-domicilio', data: { title: 'Toma de Muestras a Domicilio', publishDate: new Date() } },
    { slug: 'toma-de-muestra-pcr-covid-19', data: { title: 'Toma de Muestra PCR COVID-19', publishDate: new Date() } },
    { slug: 'prueba-de-antigeno-a-domicilio', data: { title: 'Prueba de Antígeno a Domicilio', publishDate: new Date() } },
    { slug: 'extraccion-y-cuidado-de-uñas-encarnadas', data: { title: 'Extracción y Cuidado de Uñas Encarnadas', publishDate: new Date() } },
    { slug: 'inyectologia-a-domicilio', data: { title: 'Inyectología a Domicilio', publishDate: new Date() } },
    { slug: 'suero-multivitaminico', data: { title: 'Suero Multivitamínico', publishDate: new Date() } },
    { slug: 'adultos-y-atencion-medica', data: { title: 'Adultos y Atención Médica', publishDate: new Date() } },
    { slug: 'atencion-a-pacientes-covid-19', data: { title: 'Atención a Pacientes COVID-19', publishDate: new Date() } },
    { slug: 'enfemeria-a-nivel-domiciliario-y-hospitalario', data: { title: 'Enfermería a Nivel Domiciliario y Hospitalario', publishDate: new Date() } },
    { slug: 'salud-domiciliaria', data: { title: 'Salud Domiciliaria', publishDate: new Date() } },
    { slug: 'beneficios-atencion-medica', data: { title: 'Beneficios Atención Médica', publishDate: new Date() } },
  ];

  const allPages = [...staticPages, ...posts, ...pages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${allPages
    .map((page) => {
      const url = new URL(page.slug, baseUrl);
      const lastmod = formatDateForSitemap(page.data.publishDate || page.data.modDate);
      const publishDate = formatDateForSitemap(page.data.publishDate);
      const isPost = page.collection === 'post';
      const isStatic = !page.collection;
      
      return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${isPost ? 'weekly' : 'monthly'}</changefreq>
    <priority>${isPost ? '0.8' : isStatic ? '0.7' : '0.6'}</priority>
    ${page.data.image ? `
    <image:image>
      <image:loc>${page.data.image.replace(/&/g, '&amp;')}</image:loc>
      <image:title>${page.data.title}</image:title>
      <image:caption>${page.data.excerpt || ''}</image:caption>
    </image:image>` : ''}
    ${isPost ? `
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
