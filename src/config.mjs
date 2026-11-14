// ──────────────────────────────────────────────────────────────
// Single source of truth for everything factual on the site.
// Only information visible on the clinic's own materials (sign,
// logo, photos) is filled in. Leave a field empty and the matching
// block is simply not rendered. Nothing is invented.
// ──────────────────────────────────────────────────────────────

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const config = {
  // Absolute site URL, used for canonical links, hreflang and sitemap.
  // On Vercel it is picked up automatically; override with SITE_URL.
  siteUrl: (
    process.env.SITE_URL ||
    (vercelHost ? `https://${vercelHost}` : 'https://cabinet-el-yakout.vercel.app')
  ).replace(/\/$/, ''),

  name: { fr: 'Cabinet El Yakout', ar: 'عيادة الياقوت' },

  doctor: {
    // Latin spelling as printed on the logo and the sign.
    name: 'Atoui Nassima',
    // Optional Arabic spelling. Left empty: the Latin spelling is used
    // in Arabic pages until the clinic supplies the official one.
    nameAr: '',
  },

  // Phone number as printed on the clinic's sign. PLEASE CONFIRM it is
  // also the number used for WhatsApp before going live.
  phone: {
    display: '0699 89 49 68',
    tel: '+213699894968',
    whatsapp: '213699894968', // international format, digits only
  },

  // Optional blocks. Fill in to display them on the Contact page and in
  // structured data; leave empty to hide.
  address: { fr: '', ar: '' },
  mapUrl: '',
  email: '',
  hours: { fr: '', ar: '' },
};

export const pages = [
  { key: 'home', slug: '' },
  { key: 'doctor', slug: 'doctor' },
  { key: 'specialties', slug: 'specialties' },
  { key: 'gallery', slug: 'gallery' },
  { key: 'appointment', slug: 'appointment' },
  { key: 'contact', slug: 'contact' },
];

export const langs = ['fr', 'ar'];

export const urlFor = (lang, key) => {
  const p = pages.find((x) => x.key === key);
  return `/${lang}/${p.slug ? p.slug + '/' : ''}`;
};
