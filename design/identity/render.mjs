import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(here, 'output');
await mkdir(output, { recursive: true });

const colors = {
  paper: '#FBF8F1', ink: '#161513', nocturne: '#0C0E12', panel: '#13161C',
  cream: '#EFECE4', white: '#F4F2ED', blue: '#78A9FF', tintGround: '#15233A'
};
const mark = (color) => `
  <path fill="${color}" d="M168 612 C240 290 784 290 856 612 C751 480 649 424 512 424 C375 424 273 480 168 612 Z"/>
  <circle cx="512" cy="638" r="76" fill="${color}"/>`;
const svg = (body, background = null) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${background ? `<rect width="1024" height="1024" fill="${background}"/>` : ''}${body}</svg>`;

const assets = {
  'icon-foreground.svg': svg(mark(colors.ink)),
  'icon-background.svg': svg('', colors.paper),
  'icon-default.svg': svg(mark(colors.ink), colors.paper),
  'icon-dark.svg': svg(mark(colors.cream), colors.panel),
  'icon-clear.svg': svg(`<rect x="18" y="18" width="988" height="988" fill="${colors.cream}" fill-opacity=".13" stroke="${colors.white}" stroke-opacity=".24" stroke-width="12"/>${mark(colors.white)}`, '#20242C'),
  'icon-tinted.svg': svg(mark(colors.blue), colors.tintGround),
  'mark.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${mark(colors.ink)}</svg>`,
  'web-maskable-512.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${colors.paper}"/><g transform="scale(.5)">${mark(colors.ink)}</g></svg>`
};
for (const [name, contents] of Object.entries(assets)) await writeFile(path.join(output, name), contents.trim() + '\n');

const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, 'boards.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const boards = [
  ['icon-system', '02-icon-system.png'],
  ['mark-wordmark', '03-mark-wordmark-web.png'],
  ['covers-dark', '04-library-covers-nocturne.png'],
  ['covers-light', '05-library-covers-matinee.png'],
  ['cover-rules', '06-cover-responsive-rules.png'],
  ['empty-states', '07-empty-states.png'],
  ['identity-sheet', '08-identity-sheet.png']
];
for (const [id, filename] of boards) {
  await page.locator(`#${id}`).screenshot({ path: path.join(output, filename) });
}

for (const name of ['icon-default', 'icon-dark', 'icon-clear', 'icon-tinted']) {
  const iconPage = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  await iconPage.goto(pathToFileURL(path.join(output, `${name}.svg`)).href, { waitUntil: 'load' });
  await iconPage.screenshot({ path: path.join(output, `${name}-1024.png`) });
  await iconPage.close();
}

for (const size of [16, 32, 180]) {
  const faviconPage = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await faviconPage.goto(pathToFileURL(path.join(output, 'icon-default.svg')).href, { waitUntil: 'load' });
  await faviconPage.screenshot({ path: path.join(output, `favicon-${size}.png`) });
  await faviconPage.close();
}
for (const size of [192, 512]) {
  const maskablePage = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await maskablePage.goto(pathToFileURL(path.join(output, 'web-maskable-512.svg')).href, { waitUntil: 'load' });
  await maskablePage.screenshot({ path: path.join(output, `web-maskable-${size}.png`) });
  await maskablePage.close();
}
await browser.close();
