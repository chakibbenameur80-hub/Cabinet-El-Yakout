import fr from './content/fr.mjs';
import ar from './content/ar.mjs';
import { config } from './config.mjs';

const dicts = { fr, ar };

const frTypo = (s) =>
  s
    .replace(/\s+([;:?!»])/g, '\u00A0$1')
    .replace(/«\s+/g, '«\u00A0');

const walk = (node, fn) => {
  if (typeof node === 'string') return fn(node);
  if (Array.isArray(node)) return node.map((n) => walk(n, fn));
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v, fn)]));
  }
  return node;
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export { esc };

export const plain = (html) =>
  String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

export function getDict(lang) {
  const raw = dicts[lang];
  const nameHtml =
    lang === 'ar' && config.doctor.nameAr
      ? esc(config.doctor.nameAr)
      : `<bdi dir="ltr">${esc(config.doctor.name)}</bdi>`;
  return walk(raw, (s) => {
    let out = s.replace(/\{name\}/g, nameHtml);
    if (lang === 'fr') out = frTypo(out);
    return out;
  });
}
