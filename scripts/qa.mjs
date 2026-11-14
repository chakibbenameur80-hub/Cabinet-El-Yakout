// Browser QA: renders every page in both languages at three viewport sizes,
// checks overflow / console errors / fonts / RTL, and exercises the interactions.
// Needs Playwright (uses the sandbox copy if not installed locally).
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import { serve } from './dev.mjs';
import { pages, langs, urlFor } from '../src/config.mjs';

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { ({ chromium } = createRequire('/opt/npm-tools/package.json')('playwright')); }

const shots = process.argv.includes('--shots');
const server = await serve(undefined, 4173);
const base = 'http://localhost:4173';
const browser = await chromium.launch();
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
if (shots) await fs.mkdir('qa-shots', { recursive: true });

const viewports = { mobile: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 }, desktop: { width: 1440, height: 900 } };

for (const [vn, vp] of Object.entries(viewports)) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: vn !== 'desktop' });
  for (const lang of langs) for (const p of pages) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('requestfailed', (r) => errs.push(`request failed ${r.url()}`));
    page.on('response', (r) => r.status() >= 400 && errs.push(`HTTP ${r.status()} ${r.url()}`));
    const url = base + urlFor(lang, p.key);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1700); // hero entrance
    const tag = `${vn} ${lang}/${p.key}`;
    const m = await page.evaluate(async () => {
      await document.fonts.ready;
      const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''));
      const over = [...document.querySelectorAll('body *')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.menu,.skip,.lightbox,.visually-hidden');
      }).slice(0, 4).map((e) => e.tagName + '.' + e.className);
      return {
        sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
        dir: getComputedStyle(document.documentElement).direction,
        loaded, over,
        h1: getComputedStyle(document.querySelector('h1')).fontFamily.split(',')[0],
      };
    });
    ok(m.sw <= m.cw, `${tag}: horizontal overflow ${m.sw} > ${m.cw} (${m.over.join(', ')})`);
    ok(m.dir === (lang === 'ar' ? 'rtl' : 'ltr'), `${tag}: wrong computed direction`);
    ok(errs.length === 0, `${tag}: ${errs.join(' | ')}`);
    ok(m.loaded.length >= 2, `${tag}: fonts not loaded (${m.loaded})`);
    // scroll through so lazy images load and reveals fire, then back to top
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); });
    await page.waitForTimeout(1300);
    if (shots) await page.screenshot({ path: `qa-shots/${vn}-${lang}-${p.key}.png`, fullPage: true });
    await page.close();
  }
  await ctx.close();
}

/* ── Interactions ── */
for (const lang of langs) {
  const ctx = await browser.newContext({ viewport: viewports.mobile, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(base + urlFor(lang, 'home'), { waitUntil: 'networkidle' });

  // mobile menu
  await page.click('[data-menu-open]');
  await page.waitForTimeout(450);
  ok(await page.isVisible('[data-menu]'), `${lang}: menu did not open`);
  ok((await page.getAttribute('[data-menu-open]', 'aria-expanded')) === 'true', `${lang}: aria-expanded not true`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  ok(!(await page.isVisible('[data-menu]')), `${lang}: menu did not close on Escape`);

  // language switch goes to same page in other language
  const sw = await page.getAttribute('.header-actions .lang-switch', 'href');
  ok(sw === urlFor(lang === 'fr' ? 'ar' : 'fr', 'home'), `${lang}: language switch href ${sw}`);

  // booking form
  await page.goto(base + urlFor(lang, 'appointment'), { waitUntil: 'networkidle' });
  await page.evaluate(() => { window.__opened = null; window.open = (u) => { window.__opened = u; return null; }; });
  await page.click('[data-booking-form] button[type=submit]');
  ok(await page.isVisible('[data-summary]'), `${lang}: error summary not shown on empty submit`);
  ok((await page.locator('[data-summary-list] li').count()) === 4, `${lang}: expected 4 errors`);
  await page.fill('#f-name', 'Test Patient');
  await page.fill('#f-phone', '0555 12 34 56');
  await page.selectOption('#f-reason', '1');
  await page.fill('#f-date', '2020-01-01');
  await page.click('[data-booking-form] button[type=submit]');
  ok((await page.locator('[data-summary-list] li').count()) === 2, `${lang}: past date / consent should both error`);
  await page.fill('#f-date', '2099-05-20');
  await page.check('#f-consent');
  await page.click('[data-booking-form] button[type=submit]');
  ok(await page.isVisible('[data-done]'), `${lang}: confirmation not shown`);
  const opened = await page.evaluate(() => window.__opened);
  ok(opened && opened.startsWith('https://wa.me/213699894968?text='), `${lang}: WhatsApp URL wrong: ${opened}`);
  const preview = await page.textContent('[data-preview]');
  ok(preview.includes('Test Patient') && preview.includes('0555 12 34 56'), `${lang}: preview missing data`);
  ok((await page.textContent('[data-done]')).length > 100, `${lang}: done panel empty`);
  if (shots) await page.screenshot({ path: `qa-shots/interaction-${lang}-done.png`, fullPage: false });
  await page.click('[data-edit]');
  ok(await page.isVisible('[data-booking-form]'), `${lang}: edit did not restore the form`);

  // lightbox
  await page.goto(base + urlFor(lang, 'gallery'), { waitUntil: 'networkidle' });
  await page.click('[data-lightbox-index="0"]');
  await page.waitForTimeout(300);
  ok(await page.isVisible('[data-lightbox]'), `${lang}: lightbox did not open`);
  const first = await page.getAttribute('[data-lb-img]', 'src');
  await page.click('[data-lb-next]');
  ok((await page.getAttribute('[data-lb-img]', 'src')) !== first, `${lang}: lightbox next did nothing`);
  await page.keyboard.press('Escape');
  ok(!(await page.isVisible('[data-lightbox]')), `${lang}: lightbox did not close`);
  await ctx.close();
}

/* ── Lightbox swipe (real touch events through CDP), FR and AR ── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const lang of langs) {
  const rtl = lang === 'ar';
  const ctx = await browser.newContext({ viewport: viewports.mobile, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, id) => ({ x: p.x, y: p.y, id })) });
  const gesture = async (from, to, { steps = 8, delay = 18, end = 'touchEnd', extra = null } = {}) => {
    const start = extra ? [from, { x: from.x + extra, y: from.y }] : [from];
    await touch('touchStart', start);
    for (let k = 1; k <= steps; k++) {
      const pt = { x: from.x + ((to.x - from.x) * k) / steps, y: from.y + ((to.y - from.y) * k) / steps };
      await touch('touchMove', extra ? [pt, { x: pt.x + extra, y: pt.y }] : [pt]);
      await sleep(delay);
    }
    await touch(end, []);
    await sleep(450);
  };
  const index = () => page.evaluate(() => {
    const src = document.querySelector('[data-lb-img]').getAttribute('src');
    return [...document.querySelectorAll('[data-lightbox-index]')].findIndex((b) => b.dataset.full === src);
  });
  const isOpen = () => page.evaluate(() => document.querySelector('[data-lightbox]').open);
  const centre = async () => {
    const b = await page.locator('[data-lb-img]').boundingBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const mod = (n) => ((n % 4) + 4) % 4;
  const t = `${lang} swipe`;

  await page.goto(base + urlFor(lang, 'gallery'), { waitUntil: 'networkidle' });
  await page.tap('[data-lightbox-index="1"]');
  await page.waitForTimeout(400);
  ok(await isOpen(), `${t}: lightbox did not open by tap`);
  ok((await page.evaluate(() => getComputedStyle(document.querySelector('.lb-fig')).touchAction)) === 'pan-y', `${t}: touch-action must be pan-y`);

  // direction: content follows the finger; swipe left = next in LTR, previous in RTL
  let c = await centre(); let before = await index();
  await gesture(c, { x: c.x - 150, y: c.y + 6 });
  ok((await index()) === mod(before + (rtl ? -1 : 1)), `${t}: swipe left went the wrong way (${before} → ${await index()})`);
  c = await centre(); before = await index();
  await gesture(c, { x: c.x + 150, y: c.y - 6 });
  ok((await index()) === mod(before + (rtl ? 1 : -1)), `${t}: swipe right went the wrong way`);

  // too short and slow: nothing happens, image returns to place
  c = await centre(); before = await index();
  await gesture(c, { x: c.x - 25, y: c.y }, { steps: 5, delay: 40 });
  ok((await index()) === before, `${t}: a 25px drag must not change photo`);

  // quick flick counts
  c = await centre(); before = await index();
  await gesture(c, { x: c.x - 50, y: c.y }, { steps: 3, delay: 8 });
  ok((await index()) === mod(before + (rtl ? -1 : 1)), `${t}: fast flick should navigate`);

  // mostly vertical: not a swipe, and never closes the dialog
  c = await centre(); before = await index();
  await gesture(c, { x: c.x - 70, y: c.y + 220 });
  ok((await index()) === before, `${t}: vertical-dominant gesture must not navigate`);
  ok(await isOpen(), `${t}: vertical gesture closed the dialog`);

  // cancelled touch (e.g. system gesture) mid-drag: no navigation, no stuck offset
  c = await centre(); before = await index();
  await gesture(c, { x: c.x - 160, y: c.y }, { end: 'touchCancel' });
  await page.waitForTimeout(300);
  ok((await index()) === before, `${t}: cancelled touch must not navigate`);
  ok((await page.evaluate(() => document.querySelector('[data-lb-img]').style.transform)) === '', `${t}: image left offset after cancel`);

  // two fingers (pinch / accidental second touch): ignored
  c = await centre(); before = await index();
  await gesture({ x: c.x - 40, y: c.y }, { x: c.x - 200, y: c.y }, { extra: 90 });
  ok((await index()) === before, `${t}: multi-touch must not navigate`);

  // swiping never closes the dialog, and keyboard + buttons still work afterwards
  ok(await isOpen(), `${t}: dialog closed unexpectedly after swiping`);
  before = await index();
  await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
  ok((await index()) === mod(before + 1), `${t}: keyboard navigation broke after swiping`);
  await page.tap('[data-lb-prev]');
  ok((await index()) === before, `${t}: previous button broke after swiping`);
  ok((await page.evaluate(() => document.querySelector('[data-lb-caption]').textContent.length)) > 5, `${t}: caption empty`);
  ok((await page.getAttribute('.lb-fig figcaption', 'aria-live')) === 'polite', `${t}: caption not announced`);

  // swipe through all four photos and back without drifting
  for (let k = 0; k < 4; k++) { c = await centre(); await gesture(c, { x: c.x - 140, y: c.y }); }
  ok((await index()) === mod(before + (rtl ? -4 : 4)), `${t}: four swipes should loop to the same photo`);
  await page.keyboard.press('Escape');
  ok(!(await isOpen()), `${t}: Escape no longer closes the lightbox`);
  ok((await page.evaluate(() => document.activeElement.hasAttribute('data-lightbox-index'))), `${t}: focus not returned to the thumbnail`);
  await ctx.close();
}

// mouse dragging must not navigate (swipe is touch only)
{
  const ctx = await browser.newContext({ viewport: viewports.desktop });
  const page = await ctx.newPage();
  await page.goto(base + urlFor('fr', 'gallery'), { waitUntil: 'networkidle' });
  await page.click('[data-lightbox-index="0"]');
  await page.waitForTimeout(400);
  const first = await page.getAttribute('[data-lb-img]', 'src');
  const b = await page.locator('[data-lb-img]').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 - 250, b.y + b.height / 2, { steps: 10 });
  await page.mouse.up();
  ok((await page.getAttribute('[data-lb-img]', 'src')) === first, 'mouse drag must not change photo');
  ok(await page.evaluate(() => document.querySelector('[data-lightbox]').open), 'mouse drag closed the lightbox');
  await ctx.close();
}

// root language gate + 404
const ctx = await browser.newContext({ locale: 'ar-DZ' });
const pg = await ctx.newPage();
await pg.goto(base + '/', { waitUntil: 'networkidle' });
await pg.waitForURL('**/ar/', { timeout: 3000 }).catch(() => {});
ok(pg.url().endsWith('/ar/'), `root should redirect Arabic browsers to /ar/ (got ${pg.url()})`);
const r404 = await pg.goto(base + '/fr/nope/');
ok(r404.status() === 404, '404 status');
await ctx.close();

await browser.close();
server.close();
if (fails.length) {
  console.error(`QA: ${fails.length} failure(s)`);
  fails.forEach((f) => console.error(' ✗ ' + f));
  process.exit(1);
}
console.log('QA passed: 36 page renders (2 languages × 6 pages × 3 viewports), interactions, and lightbox swipe tests (FR + AR) ✓');
