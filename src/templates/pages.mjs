import { config, urlFor, langs } from '../config.mjs';
import { esc } from '../i18n.mjs';
import { icons } from './icons.mjs';
import { img, layout, breadcrumb, clinicLd, telHref, waLink } from './layout.mjs';

const phoneLink = (cls = 'btn btn--ghost') =>
  `<a class="${cls}" href="${telHref}">${icons.phone}<span dir="ltr">${config.phone.display}</span></a>`;
const waButton = (t, cls = 'btn btn--ghost') =>
  `<a class="${cls}" href="${waLink()}" target="_blank" rel="noopener">${icons.chat}<span>${t.ui.whatsapp}</span></a>`;

const pageHead = (t, { title, lead, role }) => `
<header class="page-head wrap">
  <h1 class="page-title">${title}</h1>
  <div class="page-intro">
    ${role ? `<p class="page-role">${role}</p>` : ''}
    <p class="lead">${lead}</p>
  </div>
</header>`;

const ctaBand = (lang, t, { title, text }) => `
<section class="section band" aria-labelledby="band-title">
  <div class="wrap band-in">
    <div class="band-copy">
      <h2 id="band-title" class="h2">${title}</h2>
      <p>${text}</p>
    </div>
    <div class="actions">
      <a class="btn btn--primary" href="${urlFor(lang, 'appointment')}">${t.ui.book}${icons.arrow}</a>
      ${waButton(t)}
    </div>
  </div>
</section>`;

/* ───────────────────────── HOME ───────────────────────── */
function home(ctx, lang, t) {
  const u = (k) => urlFor(lang, k);
  const main = `
<main id="main" tabindex="-1">
  <section class="hero wrap" aria-labelledby="hero-title">
    <div class="hero-copy">
      <h1 id="hero-title" class="hero-title">${t.home.heroTitle}</h1>
      <p class="hero-lead">${t.home.heroLead}</p>
      <div class="actions">
        <a class="btn btn--primary" href="${u('appointment')}">${t.ui.book}${icons.arrow}</a>
        ${phoneLink()}
      </div>
      <p class="hero-note">${t.ui.notConfirmed}</p>
    </div>
    <div class="hero-art">
      <div class="arch">${img(ctx, 'reception', { alt: t.gallery.items.reception.alt, sizes: '(min-width: 900px) 38vw, 88vw', eager: true })}</div>
      <div class="medallion">${img(ctx, 'emblem', { alt: t.ui.logoAlt, sizes: '(min-width: 900px) 190px, 34vw' })}</div>
    </div>
  </section>

  <section class="section domains wrap" aria-labelledby="domains-title">
    <div class="sec-head">
      <h2 id="domains-title" class="h2">${t.home.domainsTitle}</h2>
      <a class="link-arrow" href="${u('specialties')}">${t.ui.specSee}${icons.arrow}</a>
    </div>
    <ul class="domain-row">
      ${t.domains
        .map(
          (d) => `<li><a class="domain-link" href="${u('specialties')}#${d.id}">
        <span class="domain-name">${d.name}</span>
        <span class="domain-short">${d.short}</span>
        ${icons.arrow}
      </a></li>`,
        )
        .join('')}
    </ul>
  </section>

  <section class="section feature" aria-labelledby="feature-title">
    <div class="wrap feature-grid">
      <div class="frame">${img(ctx, 'waiting', { alt: t.gallery.items.waiting.alt, sizes: '(min-width: 900px) 56vw, 92vw', cls: 'reveal' })}</div>
      <div class="feature-copy">
        <h2 id="feature-title" class="h2">${t.home.featureTitle}</h2>
        <p>${t.home.featureText}</p>
        <a class="link-arrow" href="${u('gallery')}">${t.ui.gallerySee}${icons.arrow}</a>
      </div>
    </div>
  </section>

  <section class="section dark doctor-teaser" aria-labelledby="doc-title">
    <div class="wrap dt-grid">
      <div class="dt-copy">
        <h2 id="doc-title" class="h2 h2--xl">${t.home.doctorTitle}</h2>
        <p class="dt-role">${t.role}</p>
        <p>${t.home.doctorText}</p>
        <a class="btn btn--light" href="${u('doctor')}">${t.ui.doctorSee}${icons.arrow}</a>
      </div>
      <div class="arch arch--soft">${img(ctx, 'model', { alt: t.gallery.items.model.alt, sizes: '(min-width: 900px) 34vw, 80vw' })}</div>
    </div>
  </section>

  ${ctaBand(lang, t, { title: t.home.bandTitle, text: t.home.bandText })}
</main>`;
  return layout(ctx, {
    lang, t, key: 'home',
    title: t.seo.home.title, description: t.seo.home.description,
    main, jsonld: [clinicLd(lang, t)],
  });
}

/* ───────────────────────── DOCTOR ───────────────────────── */
function doctor(ctx, lang, t) {
  const u = (k) => urlFor(lang, k);
  const main = `
<main id="main" tabindex="-1">
  ${pageHead(t, { title: t.doctor.title, lead: t.doctor.lead, role: t.role })}

  <section class="section wrap split" aria-labelledby="areas-title">
    <div class="split-main">
      <h2 id="areas-title" class="h2">${t.doctor.areasTitle}</h2>
      <ul class="rule-list">
        ${t.doctor.areas.map((a) => `<li>${a}</li>`).join('')}
      </ul>
      <p class="fine">${t.doctor.areasNote}</p>
    </div>
    <div class="split-aside">
      <figure class="logo-fig">
        ${img(ctx, 'logo', { alt: t.ui.logoAlt, sizes: '(min-width: 900px) 420px, 80vw', cls: 'logo-multiply' })}
      </figure>
    </div>
  </section>

  <section class="section paper wrap split split--reverse" aria-labelledby="emblem-title">
    <div class="split-aside">
      <div class="arch arch--soft">${img(ctx, 'waiting', { alt: t.gallery.items.waiting.alt, sizes: '(min-width: 900px) 34vw, 80vw', cls: 'pos-art' })}</div>
    </div>
    <div class="split-main prose">
      <h2 id="emblem-title" class="h2">${t.doctor.emblemTitle}</h2>
      <p>${t.doctor.emblemText}</p>
      <h2 class="h3">${t.doctor.nameTitle}</h2>
      <p>${t.doctor.nameText}</p>
      <h2 class="h3">${t.doctor.patienceTitle}</h2>
      <p>${t.doctor.patienceText}</p>
    </div>
  </section>

  <section class="section wrap closing">
    <p class="closing-text">${t.doctor.closing}</p>
    <div class="actions">
      <a class="btn btn--primary" href="${u('appointment')}">${t.ui.book}${icons.arrow}</a>
      ${phoneLink()}
    </div>
  </section>
</main>`;
  return layout(ctx, {
    lang, t, key: 'doctor',
    title: t.seo.doctor.title, description: t.seo.doctor.description,
    main, jsonld: [breadcrumb(ctx, lang, t, 'doctor')],
  });
}

/* ───────────────────────── SPECIALTIES ───────────────────────── */
function specialties(ctx, lang, t, tOther) {
  const otherLang = lang === 'fr' ? 'ar' : 'fr';
  const main = `
<main id="main" tabindex="-1">
  ${pageHead(t, { title: t.specialties.title, lead: t.specialties.lead })}

  <section class="section wrap spec-layout" aria-label="${t.specialties.title}">
    <ol class="spec-list">
      ${t.domains
        .map(
          (d, i) => `<li class="spec-item" id="${d.id}">
        <div class="spec-names">
          <h2 class="spec-name">${d.name}</h2>
          <p class="spec-twin" lang="${otherLang}">${tOther.domains[i].name}</p>
        </div>
        <p class="spec-desc">${d.short}</p>
      </li>`,
        )
        .join('')}
    </ol>
    <aside class="spec-aside">
      <div class="arch arch--soft">${img(ctx, 'model', { alt: t.gallery.items.model.alt, sizes: '(min-width: 900px) 30vw, 80vw' })}</div>
    </aside>
  </section>
  <div class="wrap"><p class="fine fine--rule">${t.specialties.note}</p></div>

  ${ctaBand(lang, t, { title: t.specialties.ctaTitle, text: t.specialties.ctaText })}
</main>`;
  return layout(ctx, {
    lang, t, key: 'specialties',
    title: t.seo.specialties.title, description: t.seo.specialties.description,
    main, jsonld: [breadcrumb(ctx, lang, t, 'specialties')],
  });
}

/* ───────────────────────── GALLERY ───────────────────────── */
const galleryOrder = ['exterior', 'reception', 'model', 'waiting'];

function gallery(ctx, lang, t) {
  const total = galleryOrder.length;
  const items = galleryOrder
    .map((k, i) => {
      const it = t.gallery.items[k];
      const m = ctx.manifest[k];
      const full = m.variants[m.variants.length - 1];
      return `<li class="g g--${k}">
      <figure>
        <button class="g-btn" type="button" data-lightbox-index="${i}"
          data-full="${full.src}" data-w="${full.w}" data-h="${full.h}"
          data-alt="${esc(it.alt)}" data-caption="${esc(it.caption)}"
          aria-label="${esc(t.ui.open)} : ${esc(it.caption)}">
          ${img(ctx, k, { alt: it.alt, sizes: k === 'exterior' || k === 'waiting' ? '(min-width: 900px) 58vw, 92vw' : '(min-width: 900px) 38vw, 92vw' })}
          <span class="g-icon">${icons.expand}</span>
        </button>
        <figcaption>${it.caption}</figcaption>
      </figure>
    </li>`;
    })
    .join('');

  const main = `
<main id="main" tabindex="-1">
  ${pageHead(t, { title: t.gallery.title, lead: t.gallery.lead })}
  <section class="section wrap" aria-label="${t.gallery.title}">
    <ul class="gallery">${items}</ul>
  </section>
  <dialog class="lightbox" data-lightbox aria-label="${t.gallery.title}" data-counter="${esc(t.ui.photoOf)}" data-total="${total}">
    <div class="lb-stage">
      <button class="lb-btn lb-close" type="button" data-lb-close aria-label="${t.ui.close}">${icons.close}</button>
      <button class="lb-btn lb-prev" type="button" data-lb-prev aria-label="${t.ui.prev}">${icons.chevron}</button>
      <figure class="lb-fig">
        <img class="lb-img" alt="" data-lb-img>
        <figcaption aria-live="polite"><span data-lb-caption></span> <span class="lb-count" data-lb-count></span></figcaption>
      </figure>
      <button class="lb-btn lb-next" type="button" data-lb-next aria-label="${t.ui.next}">${icons.chevron}</button>
    </div>
  </dialog>
</main>`;
  return layout(ctx, {
    lang, t, key: 'gallery',
    title: t.seo.gallery.title, description: t.seo.gallery.description,
    main, jsonld: [breadcrumb(ctx, lang, t, 'gallery')],
  });
}

/* ───────────────────────── APPOINTMENT ───────────────────────── */
function appointment(ctx, lang, t) {
  const f = t.appointment.form;
  const d = t.appointment.done;
  const err = (id, text) => `<p class="err" id="err-${id}" hidden>${text}</p>`;
  const json = JSON.stringify({
    wa: config.phone.whatsapp,
    clinic: plain(t.siteName),
    msg: t.appointment.msg,
    reasons: f.reasons,
    times: f.times,
    copied: d.copied,
    copyFail: d.copyFail,
  }).replace(/</g, '\\u003c');

  const main = `
<main id="main" tabindex="-1">
  ${pageHead(t, { title: t.appointment.title, lead: t.appointment.lead })}

  <section class="section wrap booking">
    <div class="booking-side">
      <h2 class="h3">${t.appointment.stepsTitle}</h2>
      <ol class="steps">
        ${t.appointment.steps.map((s) => `<li><span class="step-t">${s.t}</span><span class="step-d">${s.d}</span></li>`).join('')}
      </ol>
      <p class="fine">${t.appointment.privacy}</p>
      <div class="alt-contact">
        <h2 class="h3">${t.appointment.altTitle}</h2>
        <div class="actions actions--stack">
          ${phoneLink()}
          ${waButton(t)}
        </div>
      </div>
      <p class="notice">${t.ui.emergency}</p>
    </div>

    <div class="booking-main">
      <div class="form-card" data-form-card>
        <h2 class="h3 form-title">${f.title}</h2>
        <div class="err-summary" tabindex="-1" role="alert" hidden data-summary>
          <p class="err-summary-t">${f.summary}</p>
          <ul data-summary-list></ul>
        </div>
        <form novalidate data-booking-form autocomplete="on">
          <div class="field" data-field="name">
            <label class="label" for="f-name">${f.name}</label>
            <input class="input" id="f-name" name="name" type="text" autocomplete="name" required aria-required="true" aria-describedby="err-name" maxlength="80">
            ${err('name', f.errors.name)}
          </div>
          <div class="field" data-field="phone">
            <label class="label" for="f-phone">${f.phone}</label>
            <input class="input" id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required aria-required="true" aria-describedby="err-phone" dir="ltr" maxlength="24">
            ${err('phone', f.errors.phone)}
          </div>
          <div class="field" data-field="reason">
            <label class="label" for="f-reason">${f.reason}</label>
            <select class="input select" id="f-reason" name="reason" required aria-required="true" aria-describedby="err-reason">
              <option value="">${f.reasonPlaceholder}</option>
              ${f.reasons.map((r, i) => `<option value="${i}">${r}</option>`).join('')}
            </select>
            ${err('reason', f.errors.reason)}
          </div>
          <div class="field-row">
            <div class="field" data-field="date">
              <label class="label" for="f-date">${f.date} <span class="opt">(${f.optional})</span></label>
              <input class="input" id="f-date" name="date" type="date" aria-describedby="err-date" data-date>
              ${err('date', f.errors.date)}
            </div>
            <fieldset class="field fieldset">
              <legend class="label">${f.time} <span class="opt">(${f.optional})</span></legend>
              <div class="chips">
                ${f.times
                  .map(
                    (x, i) => `<label class="chip"><input type="radio" name="time" value="${i}"${i === 0 ? ' checked' : ''}><span>${x}</span></label>`,
                  )
                  .join('')}
              </div>
            </fieldset>
          </div>
          <div class="field">
            <label class="label" for="f-message">${f.message} <span class="opt">(${f.optional})</span></label>
            <textarea class="input textarea" id="f-message" name="message" rows="4" maxlength="500" aria-describedby="hint-message"></textarea>
            <p class="hint" id="hint-message">${f.messageHint}</p>
          </div>
          <div class="field field--check" data-field="consent">
            <label class="check">
              <input type="checkbox" id="f-consent" name="consent" required aria-required="true" aria-describedby="err-consent">
              <span>${f.consent}</span>
            </label>
            ${err('consent', f.errors.consent)}
          </div>
          <button class="btn btn--primary btn--block" type="submit">${icons.chat}<span>${f.submit}</span></button>
        </form>
        <noscript><p class="notice">${f.noscript}</p></noscript>
      </div>

      <div class="done" hidden tabindex="-1" data-done aria-labelledby="done-title">
        <h2 id="done-title" class="h3">${d.title}</h2>
        <p>${d.text}</p>
        <p class="important">${d.important}</p>
        <p class="preview-label">${d.preview}</p>
        <pre class="preview" data-preview tabindex="0"></pre>
        <div class="actions">
          <a class="btn btn--primary" href="${waLink()}" target="_blank" rel="noopener" data-wa>${icons.chat}<span>${d.open}</span></a>
          <button class="btn btn--ghost" type="button" data-copy>${icons.copy}<span>${d.copy}</span></button>
        </div>
        <div class="actions actions--sub">
          <button class="link-btn" type="button" data-edit>${icons.edit}<span>${d.edit}</span></button>
          <a class="link-btn" href="${telHref}">${icons.phone}<span>${d.call}</span></a>
        </div>
        <p class="copy-status" role="status" data-copy-status></p>
      </div>
    </div>
  </section>
  <script type="application/json" data-i18n>${json}</script>
</main>`;
  return layout(ctx, {
    lang, t, key: 'appointment',
    title: t.seo.appointment.title, description: t.seo.appointment.description,
    main, jsonld: [breadcrumb(ctx, lang, t, 'appointment')],
  });
}

/* ───────────────────────── CONTACT ───────────────────────── */
function contact(ctx, lang, t) {
  const u = (k) => urlFor(lang, k);
  const rows = [
    `<div class="c-row"><dt>${t.ui.phone}</dt><dd><a class="big-phone" href="${telHref}"><span dir="ltr">${config.phone.display}</span></a></dd></div>`,
    `<div class="c-row"><dt>${t.ui.whatsappLabel}</dt><dd>${waButton(t, 'btn btn--ghost')}</dd></div>`,
  ];
  if (config.address[lang])
    rows.push(`<div class="c-row"><dt>${t.ui.address}</dt><dd>${esc(config.address[lang])}${config.mapUrl ? ` <a class="link-arrow" href="${esc(config.mapUrl)}" target="_blank" rel="noopener">${t.ui.map}${icons.arrow}</a>` : ''}</dd></div>`);
  if (config.hours[lang]) rows.push(`<div class="c-row"><dt>${t.ui.hours}</dt><dd>${esc(config.hours[lang])}</dd></div>`);
  if (config.email) rows.push(`<div class="c-row"><dt>${t.ui.email}</dt><dd><a href="mailto:${esc(config.email)}">${esc(config.email)}</a></dd></div>`);

  const main = `
<main id="main" tabindex="-1">
  ${pageHead(t, { title: t.contact.title, lead: t.contact.lead })}
  <section class="section wrap contact-grid">
    <div class="contact-main">
      <dl class="c-list">${rows.join('')}</dl>
      <div class="actions">
        <a class="btn btn--primary" href="${u('appointment')}">${t.ui.book}${icons.arrow}</a>
      </div>
      <p class="notice">${t.ui.emergency}</p>
    </div>
    <figure class="contact-photo">
      <div class="frame">${img(ctx, 'exterior', { alt: t.gallery.items.exterior.alt, sizes: '(min-width: 900px) 56vw, 92vw' })}</div>
      <figcaption>
        <strong class="find-t">${t.contact.findTitle}</strong>
        <span>${t.contact.findText}</span>
      </figcaption>
    </figure>
  </section>
</main>`;
  return layout(ctx, {
    lang, t, key: 'contact',
    title: t.seo.contact.title, description: t.seo.contact.description,
    main, jsonld: [breadcrumb(ctx, lang, t, 'contact')],
  });
}

import { plain } from '../i18n.mjs';

export const renderers = { home, doctor, specialties, gallery, appointment, contact };

/* ───────────────────────── 404 + root chooser ───────────────────────── */
export function notFound(ctx, t, tAr) {
  const main = `
<main id="main" tabindex="-1" class="nf wrap">
  <h1 class="page-title">${t.notFound.title}</h1>
  <p class="lead">${t.notFound.text}</p>
  <p class="lead" lang="ar" dir="rtl">${tAr.notFound.title}. ${tAr.notFound.text}</p>
  <div class="actions">
    <a class="btn btn--primary" href="/fr/">${t.notFound.home}${icons.arrow}</a>
    <a class="btn btn--ghost" href="/ar/" lang="ar">${tAr.notFound.home}</a>
  </div>
</main>`;
  const html = layout(ctx, {
    lang: 'fr', t, key: 'home',
    title: `${t.notFound.title} | ${t.siteName}`,
    description: t.notFound.text,
    main,
  });
  return html.replace('<head>', '<head>\n<meta name="robots" content="noindex">');
}

export function rootPage(ctx, tFr, tAr) {
  const abs = (p) => `${config.siteUrl}${p}`;
  const ldAlt = langs.map((l) => `<link rel="alternate" hreflang="${l}" href="${abs(`/${l}/`)}">`).join('\n');
  const preload = [...(ctx.assets.preload.fr || [])]
    .map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`)
    .join('\n');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Cabinet El Yakout | عيادة الياقوت</title>
<meta name="description" content="Cabinet El Yakout, Dr Atoui Nassima, hépato-gastro-entérologue. عيادة الياقوت لأمراض الجهاز الهضمي والكبد والمنظار.">
<meta name="theme-color" content="#F6F0E7">
<link rel="canonical" href="${abs('/')}">
${ldAlt}
<link rel="alternate" hreflang="x-default" href="${abs('/')}">
<meta property="og:title" content="Cabinet El Yakout | عيادة الياقوت">
<meta property="og:image" content="${abs('/og-image.jpg')}">
<meta property="og:type" content="website">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
${preload}
<link rel="stylesheet" href="${ctx.assets.css}">
<script src="${ctx.assets.js}" defer></script>
</head>
<body class="root" data-root data-page="root">
<main id="main" class="root-main">
  ${img(ctx, 'emblem', { alt: tFr.ui.logoAlt, sizes: '220px', w: 220, h: 220, cls: 'root-mark', eager: true })}
  <h1 class="root-title"><span>Cabinet El Yakout</span> <span lang="ar" dir="rtl">عيادة الياقوت</span></h1>
  <p class="root-sub">Dr Atoui Nassima</p>
  <div class="root-choices">
    <a class="root-link" href="/fr/" hreflang="fr" lang="fr" data-lang="fr"><span>Français</span>${icons.arrow}</a>
    <a class="root-link" href="/ar/" hreflang="ar" lang="ar" dir="rtl" data-lang="ar"><span>العربية</span>${icons.arrow}</a>
  </div>
</main>
</body>
</html>`;
}
