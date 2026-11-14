import { config, pages, urlFor, langs } from '../config.mjs';
import { esc, plain } from '../i18n.mjs';
import { icons } from './icons.mjs';

export const img = (ctx, name, o = {}) => {
  const m = ctx.manifest[name];
  const { alt = '', sizes = '100vw', cls = '', eager = false, w = m.w, h = m.h } = o;
  const load = eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  return `<img${cls ? ` class="${cls}"` : ''} src="${m.src}" srcset="${m.srcset}" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}" ${load}>`;
};

const abs = (p) => `${config.siteUrl}${p}`;
const telHref = `tel:${config.phone.tel}`;
export const waLink = (text) =>
  `https://wa.me/${config.phone.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

const navKeys = ['home', 'doctor', 'specialties', 'gallery', 'contact'];

export function layout(ctx, { lang, t, key, title, description, main, jsonld = [], bodyAttrs = '' }) {
  const other = lang === 'fr' ? 'ar' : 'fr';
  const here = urlFor(lang, key);
  const alt = urlFor(other, key);
  const u = (k) => urlFor(lang, k);
  const pageTitle = plain(title);
  const pageDesc = plain(description);

  const navLinks = (cls = '') =>
    navKeys
      .map(
        (k) =>
          `<li><a${cls ? ` class="${cls}"` : ''} href="${u(k)}"${k === key ? ' aria-current="page"' : ''}>${t.nav[k]}</a></li>`,
      )
      .join('');

  const hreflangs = langs
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${abs(urlFor(l, key))}">`)
    .join('\n');

  const fontPreloads = (ctx.assets.preload[lang] || [])
    .map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`)
    .join('\n');

  const ld = jsonld
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`)
    .join('\n');

  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(pageDesc)}">
<meta name="theme-color" content="#F6F0E7">
<link rel="canonical" href="${abs(here)}">
${hreflangs}
<link rel="alternate" hreflang="x-default" href="${abs('/')}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(config.name.fr)}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(pageDesc)}">
<meta property="og:url" content="${abs(here)}">
<meta property="og:image" content="${abs('/og-image.jpg')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${lang === 'fr' ? 'ar_DZ' : 'fr_DZ'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
${fontPreloads}
<link rel="stylesheet" href="${ctx.assets.css}">
<script src="${ctx.assets.js}" defer></script>
${ld}
</head>
<body data-page="${key}"${bodyAttrs}>
<a class="skip" href="#main">${t.ui.skip}</a>

<header class="site-header" data-header>
  <div class="wrap header-in">
    <a class="brand" href="${u('home')}">
      ${img(ctx, 'emblem', { sizes: '48px', w: 48, h: 48, cls: 'brand-mark', alt: '', eager: true }).replace('fetchpriority="high" ', '')}
      <span class="brand-text">
        <span class="brand-name">${t.siteName}</span>
        <span class="brand-sub">${t.doctorFull}</span>
      </span>
    </a>
    <nav class="nav" aria-label="${t.ui.mainNav}">
      <ul>${navLinks()}</ul>
    </nav>
    <div class="header-actions">
      <a class="lang-switch" href="${alt}" hreflang="${other}" lang="${other}" data-lang="${other}" aria-label="${t.switchTo.aria}">${t.switchTo.label}</a>
      <a class="btn btn--primary btn--small header-cta" href="${u('appointment')}"${key === 'appointment' ? ' aria-current="page"' : ''}>${t.ui.bookShort}</a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="${t.ui.menuOpen}" data-menu-open>
        <span class="burger-lines" aria-hidden="true"><span></span><span></span></span>
      </button>
    </div>
  </div>
</header>

<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${t.ui.mainNav}" hidden data-menu>
  <div class="menu-top wrap">
    <a class="brand brand--light" href="${u('home')}">
      <span class="brand-text"><span class="brand-name">${t.siteName}</span></span>
    </a>
    <button class="menu-close" type="button" aria-label="${t.ui.menuClose}" data-menu-close>${icons.close}</button>
  </div>
  <nav class="menu-nav wrap" aria-label="${t.ui.mainNav}">
    <ul>
      ${navKeys.slice(0, 4).map((k) => `<li><a href="${u(k)}"${k === key ? ' aria-current="page"' : ''}>${t.nav[k]}</a></li>`).join('')}
      <li><a href="${u('appointment')}"${key === 'appointment' ? ' aria-current="page"' : ''}>${t.nav.appointment}</a></li>
      <li><a href="${u('contact')}"${key === 'contact' ? ' aria-current="page"' : ''}>${t.nav.contact}</a></li>
    </ul>
  </nav>
  <div class="menu-foot wrap">
    <a class="menu-phone" href="${telHref}">${icons.phone}<span dir="ltr">${config.phone.display}</span></a>
    <a class="lang-switch lang-switch--light" href="${alt}" hreflang="${other}" lang="${other}" data-lang="${other}" aria-label="${t.switchTo.aria}">${t.switchTo.label}</a>
  </div>
</div>

${main}

<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <p class="footer-name">${t.siteName}</p>
      <p class="footer-tag">${t.tagline}</p>
      <p class="footer-doc">${t.doctorFull}</p>
    </div>
    <nav class="footer-col" aria-label="${t.ui.footerNav}">
      <h2 class="footer-h">${t.ui.pagesTitle}</h2>
      <ul>
        ${pages.map((p) => `<li><a href="${u(p.key)}"${p.key === key ? ' aria-current="page"' : ''}>${t.nav[p.key]}</a></li>`).join('')}
      </ul>
    </nav>
    <div class="footer-col">
      <h2 class="footer-h">${t.ui.contactTitle}</h2>
      <ul>
        <li><a href="${telHref}"><span dir="ltr">${config.phone.display}</span></a></li>
        <li><a href="${waLink()}" rel="noopener" target="_blank">${t.ui.whatsappLabel}</a></li>
        ${config.email ? `<li><a href="mailto:${esc(config.email)}">${esc(config.email)}</a></li>` : ''}
        <li><a class="lang-switch lang-switch--light" href="${alt}" hreflang="${other}" lang="${other}" data-lang="${other}" aria-label="${t.switchTo.aria}">${t.switchTo.label}</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap footer-base">
    <p>${t.ui.footerNote}</p>
    <p>© <span data-year>2026</span> ${t.ui.rights}</p>
  </div>
</footer>

<div class="dock" data-dock>
  <a class="btn btn--primary" href="${u('appointment')}">${t.ui.book}</a>
  <a class="btn btn--ghost btn--icon" href="${telHref}" aria-label="${t.ui.call}">${icons.phone}</a>
</div>
</body>
</html>`;
}

export const breadcrumb = (ctx, lang, t, key) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: plain(t.nav.home), item: abs(urlFor(lang, 'home')) },
    { '@type': 'ListItem', position: 2, name: plain(t.nav[key]), item: abs(urlFor(lang, key)) },
  ],
});

export const clinicLd = (lang, t) => {
  const o = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: config.name.fr,
    alternateName: config.name.ar,
    url: abs(urlFor(lang, 'home')),
    image: abs('/og-image.jpg'),
    telephone: config.phone.tel,
    medicalSpecialty: 'Gastroenterology',
    inLanguage: lang,
    employee: {
      '@type': 'Physician',
      name: `Dr ${config.doctor.name}`,
      medicalSpecialty: 'Gastroenterology',
    },
  };
  if (config.address[lang]) o.address = { '@type': 'PostalAddress', streetAddress: config.address[lang] };
  if (config.email) o.email = config.email;
  return o;
};

export { telHref, abs };
