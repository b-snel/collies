// Headless harness: loads the game in Chromium and hands back a page to drive through window.GAME.
// `?sim` stops the render loop so tests can step the simulation as fast as the CPU allows.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { serve } from './serve.mjs';
export async function open({ query = '?sim&debug', port = 8123 + Math.floor(Math.random() * 500), width = 1280, height = 720, scale = 1 } = {}) {
  const srv = await serve(port);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.stack || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  // offline: nothing from outside (Google Fonts), so no network errors and the same font every run
  await page.route(u => !/^http:\/\/localhost[:/]/.test(u.href), r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  // Math.random seeded: the same run every time (SEED=n another; SEED=random a new one, printed)
  const seed = process.env.SEED === 'random' ? (Math.random() * 2 ** 32) >>> 0 : +(process.env.SEED || 1) >>> 0;
  if (process.env.SEED === 'random') console.error('SEED=' + seed);
  await page.addInitScript(s => {
    let a = s >>> 0;
    Math.random = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }, seed);
  await page.goto(`http://localhost:${port}/index.html${query}`);
  await page.waitForFunction(() => window.GAME, null, { timeout: 60000 });
  return { page, errors, async close() { await browser.close(); srv.close(); } };
}
