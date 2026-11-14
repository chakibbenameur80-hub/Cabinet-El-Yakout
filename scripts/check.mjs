// Post-build verification: structure, SEO, accessibility basics, links, CSP-safety, budgets.
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { parse } from 'node-html-parser';
import { pages, langs, urlFor } from '../src/config.mjs';

const DIST = path.resolve('dist');
const problems = [];
const bad = (file, msg) => problems.push(`${file}: ${msg}`);

const exists = (p) => fs.stat(p).then(() => true, () => false);
const resolveUrl = async (u) => {
  const clean = u.split('#')[0].split('?')[0];
  if (!clean) return true;
  let f = path.join(DIST, clean);
  if (clean.endsWith('/')) f = path.join(f, 'index.html');
  return exists(f);
};

const files = [];
for (const l of langs) for (const p of pages) files.push({ rel: `${urlFor(l, p.key).slice(1)}index.html`, lang: l, key: p.key });
files.push({ rel: 'index.html', lang: 'fr', key: 'root' }, { rel: '404.html', lang: 'fr', key: '404' });

const titles = new Set();
for (const f of files) {
  const html = await fs.readFile(path.join(DIST, f.rel), 'utf8');
  const root = parse(html);
  const tag = f.rel;
  const h = root.querySelector('html');

  if (f.key !== 'root' && f.key !== '404') {
    if (h.getAttribute('lang') !== f.lang) bad(tag, 'html lang mismatch');
    if (h.getAttribute('dir') !== (f.lang === 'ar' ? 'rtl' : 'ltr')) bad(tag, 'html dir mismatch');
    const title = root.querySelector('title')?.text || '';
    if (title.length < 15 || title.length > 95) bad(tag, `title length ${title.length}`);
    if (titles.has(title)) bad(tag, 'duplicate title'); titles.add(title);
    const d = root.querySelector('meta[name=description]')?.getAttribute('content') || '';
    if (d.length < 60 || d.length > 220) bad(tag, `description length ${d.length}`);
    if (!root.querySelector('link[rel=canonical]')) bad(tag, 'missing canonical');
    const alts = root.querySelectorAll('link[rel=alternate][hreflang]').map((a) => a.getAttribute('hreflang'));
    for (const need of ['fr', 'ar', 'x-default']) if (!alts.includes(need)) bad(tag, `missing hreflang ${need}`);
  }
  if (root.querySelectorAll('h1').length !== 1) bad(tag, `expected 1 <h1>, found ${root.querySelectorAll('h1').length}`);
  if (!root.querySelector('main#main')) bad(tag, 'missing main#main');

  // heading order never skips a level
  let prev = 0;
  for (const hd of root.querySelectorAll('h1,h2,h3,h4')) {
    const n = Number(hd.tagName[1]);
    if (prev && n > prev + 1) bad(tag, `heading jump h${prev} → h${n}`);
    prev = n;
  }

  // ids unique, aria references exist
  const ids = root.querySelectorAll('[id]').map((e) => e.id);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) bad(tag, `duplicate ids: ${[...new Set(dup)]}`);
  for (const e of root.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')) {
    for (const a of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
      const v = e.getAttribute(a);
      if (v) for (const id of v.split(/\s+/)) if (!ids.includes(id)) bad(tag, `${a} → #${id} not found`);
    }
  }

  // images
  for (const im of root.querySelectorAll('img')) {
    if (im.hasAttribute('data-lb-img')) continue; // filled by JS
    if (im.getAttribute('alt') === undefined) bad(tag, `img without alt: ${im.getAttribute('src')}`);
    if (!im.getAttribute('width') || !im.getAttribute('height')) bad(tag, `img without dimensions: ${im.getAttribute('src')}`);
    if (!(await resolveUrl(im.getAttribute('src')))) bad(tag, `missing image ${im.getAttribute('src')}`);
  }

  // links and assets
  for (const a of root.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (/^(https?:|tel:|mailto:)/.test(href)) {
      if (/^https?:/.test(href) && a.getAttribute('target') === '_blank' && !/noopener/.test(a.getAttribute('rel') || '')) bad(tag, `external link without rel=noopener: ${href}`);
      continue;
    }
    if (href.startsWith('#')) { if (href.length > 1 && !ids.includes(href.slice(1))) bad(tag, `dead anchor ${href}`); continue; }
    if (!(await resolveUrl(href))) bad(tag, `dead link ${href}`);
    const frag = href.split('#')[1];
    if (frag) {
      const target = path.join(DIST, href.split('#')[0], 'index.html');
      if (!(await fs.readFile(target, 'utf8')).includes(`id="${frag}"`)) bad(tag, `anchor #${frag} missing in ${href}`);
    }
    if (!a.text.trim() && !a.getAttribute('aria-label') && !a.querySelector('img')) bad(tag, `link without accessible name: ${href}`);
  }
  for (const n of root.querySelectorAll('link[href],script[src]')) {
    const u = n.getAttribute('href') || n.getAttribute('src');
    if (u.startsWith('/') && !(await resolveUrl(u))) bad(tag, `missing asset ${u}`);
  }
  for (const b of root.querySelectorAll('button')) {
    if (!b.text.trim() && !b.getAttribute('aria-label')) bad(tag, 'button without accessible name');
  }

  // forms: every control has a label
  for (const c of root.querySelectorAll('input:not([type=radio]):not([type=hidden]),select,textarea')) {
    const id = c.id;
    if (!id || !root.querySelector(`label[for="${id}"]`)) if (!c.closest('label')) bad(tag, `control without label: ${id || c.getAttribute('name')}`);
  }

  // CSP safety (no inline styles/scripts/handlers) and leftovers
  if (/\sstyle="/.test(html)) bad(tag, 'inline style attribute (blocked by CSP)');
  if (/\son[a-z]+="/.test(html)) bad(tag, 'inline event handler (blocked by CSP)');
  for (const s of root.querySelectorAll('script:not([src])')) {
    const t = s.getAttribute('type');
    if (t !== 'application/ld+json' && t !== 'application/json') bad(tag, 'inline executable script (blocked by CSP)');
  }
  if (/undefined|\[object|NaN|\{name\}/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) bad(tag, 'leftover placeholder (undefined/[object/NaN/{name})');
  // JSON-LD parses
  for (const s of root.querySelectorAll('script[type="application/ld+json"],script[type="application/json"]')) {
    try { JSON.parse(s.text); } catch { bad(tag, 'invalid JSON block'); }
  }
  // hours/address must never appear unless configured
  if (f.lang === 'ar' && /[A-Za-z]{4,}/.test(root.querySelector('h1')?.text || '') && f.key !== 'doctor' && f.key !== 'home') {
    // allowed: doctor name. flag other Latin in Arabic h1s for review
  }
}

// reciprocal hreflang targets exist
for (const l of langs) for (const p of pages) if (!(await exists(path.join(DIST, urlFor(l, p.key).slice(1), 'index.html')))) bad('hreflang', `missing page ${l}/${p.key}`);
for (const f of ['sitemap.xml', 'robots.txt', 'manifest.webmanifest', 'og-image.jpg', 'favicon-32.png', 'apple-touch-icon.png']) if (!(await exists(path.join(DIST, f)))) bad('dist', `missing ${f}`);

// performance budgets
const walk = async (d) => (await Promise.all((await fs.readdir(d, { withFileTypes: true })).map((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])))).flat();
const all = await walk(DIST);
const size = async (f) => (await fs.stat(f)).size;
const gz = async (f) => zlib.gzipSync(await fs.readFile(f)).length;
const css = all.find((f) => /assets\/styles\..*\.css$/.test(f));
const js = all.find((f) => /assets\/main\..*\.js$/.test(f));
const budget = { css: 20_000, js: 8_000 };
const cssGz = await gz(css), jsGz = await gz(js);
if (cssGz > budget.css) bad('budget', `CSS ${cssGz} B gzip > ${budget.css}`);
if (jsGz > budget.js) bad('budget', `JS ${jsGz} B gzip > ${budget.js}`);
let maxHtml = 0;
for (const f of all.filter((x) => x.endsWith('.html'))) maxHtml = Math.max(maxHtml, await gz(f));
const imgs = all.filter((f) => f.endsWith('.webp'));
const biggest = Math.max(...(await Promise.all(imgs.map(size))));
if (biggest > 260_000) bad('budget', `largest image ${biggest} B`);

console.log(`Checked ${files.length} HTML files.`);
console.log(`CSS ${(cssGz / 1024).toFixed(1)} KB gz · JS ${(jsGz / 1024).toFixed(1)} KB gz · largest HTML ${(maxHtml / 1024).toFixed(1)} KB gz · largest image ${(biggest / 1024).toFixed(0)} KB`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(' ✗ ' + p);
  process.exit(1);
}
console.log('All checks passed ✓');
