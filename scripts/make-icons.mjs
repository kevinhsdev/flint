// Gera os ícones PNG do app a partir da logo oficial (brand/flint-logo.svg).
import sharp from 'sharp';
import { copyFile, mkdir } from 'node:fs/promises';

const logo = 'brand/flint-logo.svg';
await mkdir('public/icons', { recursive: true });
for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]])
  await sharp(logo, { density: 300 }).resize(size, size).png().toFile(`public/icons/${file}`);
// maskable: a marca precisa caber na zona segura (80%); a logo já usa 62% do quadro
await sharp(logo, { density: 300 }).resize(512, 512).png().toFile('public/icons/maskable-512.png');
await copyFile('brand/flint-mark.svg', 'public/favicon.svg');
console.log('ícones gerados');
