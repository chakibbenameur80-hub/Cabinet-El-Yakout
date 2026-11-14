import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const SRC = path.resolve('source-images');

// name → source file and the widths to generate (never upscaled).
const photos = {
  exterior: { file: '01-clinic-exterior.jpg', widths: [640, 960, 1170] },
  waiting: { file: '02-waiting-area.jpg', widths: [640, 960, 1169] },
  reception: { file: '03-reception-area.jpg', widths: [480, 800, 991] },
  model: { file: '05-digestive-system-model.jpg', widths: [480, 800, 1170] },
  logo: { file: '04-clinic-logo.jpg', widths: [480, 800, 1170] },
};

// The circular emblem inside the logo (square crop around the ring).
const EMBLEM = { left: 84, top: 78, size: 1014 };

export async function processImages(outDir) {
  const imgDir = path.join(outDir, 'assets', 'img');
  await fs.mkdir(imgDir, { recursive: true });
  const manifest = {};

  for (const [name, def] of Object.entries(photos)) {
    const input = path.join(SRC, def.file);
    const meta = await sharp(input).metadata();
    const variants = [];
    for (const w of def.widths) {
      const width = Math.min(w, meta.width);
      const file = `${name}-${width}.webp`;
      const info = await sharp(input)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: name === 'logo' ? 88 : 80, effort: 5 })
        .toFile(path.join(imgDir, file));
      variants.push({ w: info.width, h: info.height, src: `/assets/img/${file}` });
    }
    const largest = variants[variants.length - 1];
    manifest[name] = {
      variants,
      w: largest.w,
      h: largest.h,
      src: largest.src,
      srcset: variants.map((v) => `${v.src} ${v.w}w`).join(', '),
    };
  }

  // Emblem (circle) as webp for header/hero + PNG icons.
  const logoPath = path.join(SRC, photos.logo.file);
  const emblemBuf = await sharp(logoPath)
    .extract({ left: EMBLEM.left, top: EMBLEM.top, width: EMBLEM.size, height: EMBLEM.size })
    .toBuffer();
  const circleMask = (s) =>
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="#fff"/></svg>`);

  const emblemVariants = [];
  for (const s of [96, 240, 480]) {
    const file = `emblem-${s}.webp`;
    await sharp(emblemBuf)
      .resize(s, s)
      .composite([{ input: circleMask(s), blend: 'dest-in' }])
      .webp({ quality: 90, effort: 5 })
      .toFile(path.join(imgDir, file));
    emblemVariants.push({ w: s, h: s, src: `/assets/img/${file}` });
  }
  manifest.emblem = {
    variants: emblemVariants,
    w: 480,
    h: 480,
    src: '/assets/img/emblem-480.webp',
    srcset: emblemVariants.map((v) => `${v.src} ${v.w}w`).join(', '),
  };

  // Favicons / app icons: emblem on the ivory brand colour, circular.
  const icon = async (s, file, round = true) => {
    let img = sharp(emblemBuf).resize(Math.round(s * (round ? 1 : 0.8)), Math.round(s * (round ? 1 : 0.8)));
    if (round) {
      const b = await img.composite([{ input: circleMask(Math.round(s)), blend: 'dest-in' }]).png().toBuffer();
      await sharp(b).toFile(path.join(outDir, file));
    } else {
      const inner = await img.png().toBuffer();
      await sharp({ create: { width: s, height: s, channels: 4, background: '#F6F0E7' } })
        .composite([{ input: inner, gravity: 'center' }])
        .png()
        .toFile(path.join(outDir, file));
    }
  };
  await icon(32, 'favicon-32.png');
  await icon(192, 'icon-192.png', false);
  await icon(512, 'icon-512.png', false);
  await icon(180, 'apple-touch-icon.png', false);

  // Open Graph card, 1200x630: emblem on ivory + waiting-room photo.
  const ogPhoto = await sharp(path.join(SRC, photos.waiting.file))
    .resize(680, 630, { fit: 'cover', position: 'centre' })
    .toBuffer();
  const ogEmblem = await sharp(emblemBuf)
    .resize(430, 430)
    .composite([{ input: circleMask(430), blend: 'dest-in' }])
    .png()
    .toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#F6F0E7' } })
    .composite([
      { input: ogPhoto, left: 520, top: 0 },
      { input: ogEmblem, left: 45, top: 100 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(outDir, 'og-image.jpg'));

  return manifest;
}
