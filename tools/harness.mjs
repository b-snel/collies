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
  await page.goto(`http://localhost:${port}/index.html${query}`);
  await page.waitForFunction(() => window.GAME, null, { timeout: 60000 });
  return { page, errors, async close() { await browser.close(); srv.close(); } };
}
