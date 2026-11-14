# Cabinet El Yakout, site web bilingue (FR / AR)

Static site (no framework, ~2.5 KB of JavaScript) for the clinic of Dr Atoui Nassima,
hépato-gastro-entérologue. French is LTR, Arabic is RTL, both fully built.

## Commands

    npm install
    npm run build   # builds dist/ then runs the verification suite (scripts/check.mjs)
    npm run qa      # browser QA: 36 renders + interactions (needs Playwright; add --shots for screenshots)
    npm run dev     # serves dist/ on http://localhost:4173

## Deploy on Vercel

1. Push this folder to a Git repository and import it in Vercel (settings come from `vercel.json`).
2. After the first deploy, set the real domain: add an environment variable
   `SITE_URL=https://your-domain.com` and redeploy (canonical links, hreflang and sitemap use it).
   On `*.vercel.app` it is detected automatically.

## What to confirm before going live (`src/config.mjs`)

* **Phone / WhatsApp**: `0699 89 49 68`, read from the clinic's sign. Confirm it is also the WhatsApp number.
* **Address, opening hours, email, map link**: empty on purpose (nothing in the supplied material).
  Fill them in and they appear on the Contact page and in structured data.
* **Arabic spelling of the doctor's name** (`doctor.nameAr`): the Latin spelling from the logo is used until supplied.
* **Qualifications / biography**: none were supplied, so none are shown.

## How requests work

The form has no server. It validates, then opens WhatsApp with a prepared message; nothing is stored.
The confirmation screen states that the appointment is not confirmed until the clinic replies.

## Structure

    src/config.mjs        facts (phone, optional blocks)
    src/content/*.mjs     all copy, FR and AR
    src/templates/        layout and pages
    src/assets/           styles.css, main.js
    source-images/        the clinic's original photos (optimised at build time)
    scripts/              build, check, qa, dev
