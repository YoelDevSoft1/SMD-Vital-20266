import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Inicio',
      links: [
        {
          text: '¿Quiénes somos?',
          href: getPermalink('/inicio/quienes-somos'),
        },
        {
          text: 'Nuestro Equipo Médico',
          href: getPermalink('/equipo-medico'),
        },
        {
          text: 'Misión',
          href: getPermalink('/inicio/mision'),
        },
        {
          text: 'Visión',
          href: getPermalink('/inicio/vision'),
        },
        {
          text: 'Filosofía',
          href: getPermalink('/inicio/filosofia'),
        },
      ],
    },
    {
      text: 'Servicios médicos',
      links: [
        {
          text: 'Características (Anclado)',
          href: getPermalink('/#features'),
        },
        {
          text: 'Teleconsulta médica',
          href: getPermalink('/teleconsulta-medica'),
        },
        {
          text: 'Electrocardiografía básica',
          href: getPermalink('/electrocardiografia-basica'),
        },
        {
          text: 'Lavado de oídos',
          href: getPermalink('/lavado-de-oidos-a-domicilio'),
        },
        {
          text: 'Suero multivitamínico',
          href: getPermalink('/suero-multivitaminico'),
        },
        {
          text: 'Sutura y retiro de puntos',
          href: getPermalink('/sutura-y-retiro-de-puntos'),
        },
        {
          text: 'Retiro y colocación de sonda vesical',
          href: getPermalink('/retiro-y-colocacion-de-sonda-vesical'),
        },
        {
          text: 'Atención a pacientes con COVID-19',
          href: getPermalink('/atencion-a-pacientes-covid-19'),
        },
        {
          text: 'Extracción y cuidado de uñas encarnadas',
          href: getPermalink('/extraccion-y-cuidado-de-uñas-encarnadas'),
        },
        {
          text: 'Cura de heridas: simples y complejas',
          href: getPermalink('/cura-de-heridas-simples-y-complejas'),
        },
        {
          text: 'Valoración médica domiciliaria',
          href: getPermalink('/valoracion-medica-domiciliaria'),
        },
      ],
    },
    {
      text: 'Servicios de enfermería',
      links: [
        {
          text: 'Toma de signos vitales',
          href: getPermalink('/toma-de-signos-vitales'),
        },
        {
          text: 'Inyectología a domicilio',
          href: getPermalink('/inyectologia-a-domicilio'),
        },
        {
          text: 'Enfermería domiciliaria y hospitalaria',
          href: getPermalink('/enfemeria-a-nivel-domiciliario-y-hospitalario'),
        },
        {
          text: 'Acompañamiento a citas médicas',
          href: getPermalink('/acompanamiento-a-citas-medicas'),
        },
      ],
    },
    {
      text: 'Laboratorio clínico',
      links: [
        {
          text: 'Laboratorio a domicilio',
          href: getPermalink('/laboratorio-a-domicilio'),
        },
        {
          text: 'Toma de muestras a domicilio',
          href: getPermalink('/toma-de-muestras-a-domicilio'),
        },
        {
          text: 'Prueba de antígeno a domicilio',
          href: getPermalink('/prueba-de-antigeno-a-domicilio'),
        },
        {
          text: 'Prueba PCR Covid-19 a domicilio',
          href: getPermalink('/toma-de-muestra-pcr-covid-19'),
        },
      ],
    },
    {
      text: 'Blog',
      links: [
        {
          text: 'Lista de artículos',
          href: getBlogPermalink(),
        },
        {
          text: 'Artículos destacados',
          href: getPermalink('get-started-website-with-astro-tailwind-css', 'post'),
        },
        {
          text: 'Guía Markdown',
          href: getPermalink('markdown-elements-demo-post', 'post'),
        },
        {
          text: 'Categorías',
          href: getPermalink('tutorials', 'category'),
        },
        {
          text: 'Etiquetas',
          href: getPermalink('astro', 'tag'),
        },
      ],
    },
  ],
  actions: [{ text: 'WhatsApp', href: 'https://wa.link/7cprhk', target: '_blank' }],
};

export const footerData = {
  links: [
    {
      title: 'Servicio',
      links: [{ text: 'Características', href: '/acerca' }],
    },
    {
      title: 'Plataforma',
      links: [
        { text: 'Nosotros', href: '/inicio/quienes-somos' },
        { text: 'Visión', href: '/inicio/vision' },
        { text: 'Misión', href: '/inicio/mision' },
        { text: 'Filosofía', href: '/inicio/filosofia' },
      ],
    },
    {
      title: 'Soporte',
      links: [
        { text: 'Comunidad Blog', href: '/blog' },
        { text: 'Servicios profesionales', href: '/servicios' },
      ],
    },
    {
      title: 'Compañía',
      links: [
        { text: 'Acerca', href: '/acerca' },
        { text: 'Blog', href: '/blog' },
        { text: 'Precios', href: '/precios' },
        { text: 'Contacto', href: '/contacto' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Términos', href: getPermalink('/terms') },
    { text: 'Política de privacidad', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'X', icon: 'tabler:brand-x', href: 'https://x.com/smdvitalbogotaoficial' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/smdvitalbogota_/' },
    {
      ariaLabel: 'Facebook',
      icon: 'tabler:brand-facebook',
      href: 'https://www.facebook.com/profile.php?id=61556817451561',
    },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com/YoelDevSoft1/SMD-Vital-2024' },
  ],
  footNote: `
    Hecho por <a class="text-blue-600 underline dark:text-muted" href="https://yoeldevsoft.com/">Yoel Dev Soft</a> — Todos los derechos reservados.
  `,
};

