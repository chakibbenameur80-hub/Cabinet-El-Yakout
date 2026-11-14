import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { build as esbuild, transform } from 'esbuild';
import { processImages } from './images.mjs';
import { config, pages, langs, urlFor } from '../src/config.mjs';
import { getDict } from '../src/i18n.mjs';
import { renderers, notFound, rootPage } from '../src/templates/pages.mjs';

const DIST = path.resolve('dist');
const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
const write = async (rel, data) => {
  const f = path.join(DIST, rel);
  await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, data);
};

const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const ARABIC =
  'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';

const fonts = [
  { id: 'cormorant-500', family: 'Cormorant', pkg: '@fontsource/cormorant-garamond', file: 'cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal', range: LATIN },
  { id: 'cormorant-500i', family: 'Cormorant', pkg: '@fontsource/cormorant-garamond', file: 'cormorant-garamond-latin-500-italic.woff2', weight: '500', style: 'italic', range: LATIN },
  { id: 'dm-sans', family: 'DM Sans', pkg: '@fontsource-variable/dm-sans', file: 'dm-sans-latin-wght-normal.woff2', weight: '100 1000', style: 'normal', range: LATIN },
  { id: 'messiri-500', family: 'El Messiri', pkg: '@fontsource/el-messiri', file: 'el-messiri-arabic-500-normal.woff2', weight: '500', style: 'normal', range: ARABIC },
  { id: 'plex-400', family: 'IBM Plex Sans Arabic', pkg: '@fontsource/ibm-plex-sans-arabic', file: 'ibm-plex-sans-arabic-arabic-400-normal.woff2', weight: '400', style: 'normal', range: ARABIC },
  { id: 'plex-500', family: 'IBM Plex Sans Arabic', pkg: '@fontsource/ibm-plex-sans-arabic', file: 'ibm-plex-sans-arabic-arabic-500-normal.woff2', weight: '500', style: 'normal', range: ARABIC },
];

async function buildFonts() {
  const urls = {};
  let css = '';
  for (const f of fonts) {
    const buf = await fs.readFile(path.resolve('node_modules', f.pkg, 'files', f.file));
    const name = `${f.id}.${hash(buf)}.woff2`;
    await write(`assets/fonts/${name}`, buf);
    urls[f.id] = `/assets/fonts/${name}`;
    css += `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(${urls[f.id]}) format("woff2");unicode-range:${f.range}}\n`;
  }
  return { css, urls };
}

async function main() {
  const t0 = Date.now();
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  const manifest = await processImages(DIST);
  const fontsBuilt = await buildFonts();

  const cssSrc = fontsBuilt.css + (await fs.readFile('src/assets/styles.css', 'utf8'));
  const cssMin = (await transform(cssSrc, { loader: 'css', minify: true, target: ['chrome100', 'safari15', 'firefox100'] })).code;
  const cssName = `assets/styles.${hash(cssMin)}.css`;
  await write(cssName, cssMin);

  const jsMin = (await transform(await fs.readFile('src/assets/main.js', 'utf8'), { loader: 'js', minify: true, target: ['es2020'] })).code;
  const jsName = `assets/main.${hash(jsMin)}.js`;
  await write(jsName, jsMin);

  const ctx = {
    manifest,
    assets: {
      css: `/${cssName}`,
      js: `/${jsName}`,
      preload: {
        fr: [fontsBuilt.urls['cormorant-500'], fontsBuilt.urls['dm-sans']],
        ar: [fontsBuilt.urls['messiri-500'], fontsBuilt.urls['plex-400']],
      },
    },
  };

  const dict = Object.fromEntries(langs.map((l) => [l, getDict(l)]));
  const sitemapUrls = [];

  for (const lang of langs) {
    const other = lang === 'fr' ? 'ar' : 'fr';
    for (const p of pages) {
      const html = renderers[p.key](ctx, lang, dict[lang], dict[other]);
      await write(`${urlFor(lang, p.key).slice(1)}index.html`, html);
    }
  }

  await write('index.html', rootPage(ctx, dict.fr, dict.ar));
  await write('404.html', notFound(ctx, dict.fr, dict.ar));

  // sitemap with hreflang alternates
  const loc = (p) => `${config.siteUrl}${p}`;
  const entries = pages.map((p) => {
    const alts = langs.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${loc(urlFor(l, p.key))}"/>`).join('');
    return langs.map((l) => `<url><loc>${loc(urlFor(l, p.key))}</loc>${alts}<xhtml:link rel="alternate" hreflang="x-default" href="${loc('/')}"/></url>`).join('');
  });
  await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>\n`);
  await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${loc('/sitemap.xml')}\n`);
  await write('manifest.webmanifest', JSON.stringify({
    name: config.name.fr, short_name: 'El Yakout', start_url: '/', display: 'standalone',
    background_color: '#F6F0E7', theme_color: '#F6F0E7',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }));

  console.log(`Built ${pages.length * langs.length} pages + root + 404 in ${Date.now() - t0} ms → dist/`);
  console.log(`Site URL for canonical/sitemap: ${config.siteUrl}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
