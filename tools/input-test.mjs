// Gamepad Ⓐ on slow frames: quick taps between frames still bark, a held press barks once, an early press waits out the cooldown.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { serve } from './serve.mjs';
const port = 8123 + Math.floor(Math.random() * 500), srv = await serve(port);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.addInitScript(() => {
  window.FAKE = { index: 0, connected: true, id: 'fake', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
  navigator.getGamepads = () => [window.FAKE];
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => setTimeout(() => raf(cb), 120);   // slow frames
});
await page.goto(`http://localhost:${port}/index.html?debug`);
await page.waitForFunction(() => window.GAME, null, { timeout: 60000 });
await page.evaluate(() => dispatchEvent(new Event('gamepadconnected')));
const A = (down) => page.evaluate(v => { const b = FAKE.buttons[0]; b.pressed = v; b.value = v ? 1 : 0; }, down);
const tap = async () => { await A(true); await page.waitForTimeout(25); await A(false); };   // shorter than a frame
const nextFrame = async () => { const t = await page.evaluate(() => GAME.G.time); await page.waitForFunction(t => GAME.G.time > t, t); };
const ready = () => page.waitForFunction(() => GAME.G.dogs[0] && GAME.G.dogs[0].barkCd < -0.05 && !GAME.G.dogs[0].barkBuf, null, { timeout: 60000 });
const barks = () => page.evaluate(() => GAME.G.barks || 0);
let fails = 0;
const check = (ok, name, v) => { console.log(ok ? 'ok  ' : 'FAIL', name, JSON.stringify(v)); if (!ok) fails++; };

for (let i = 0; i < 20 && await page.evaluate(() => GAME.G.mode) !== 'play'; i++) { await tap(); await nextFrame(); await page.waitForTimeout(200); }
check(await page.evaluate(() => GAME.G.mode) === 'play', 'tap joins', await page.evaluate(() => GAME.G.mode));

let b0 = await barks();
for (let i = 0; i < 5; i++) { await ready(); await tap(); await nextFrame(); }
await ready();
check(await barks() - b0 === 5, 'quick taps bark', await barks() - b0);

b0 = await barks(); await A(true);
const t0 = await page.evaluate(() => GAME.G.time);
await page.waitForFunction(t0 => GAME.G.time > t0 + 1.5, t0, { timeout: 60000 }); await A(false);
check(await barks() - b0 === 1, 'held: one bark', await barks() - b0);

await ready();
const early = await page.evaluate(async () => {
  const d = GAME.G.dogs[0], n0 = GAME.G.barks; d.barkCd = 0.2; d.barkBuf = 0.25;   // pressed 0.4 s into the cooldown
  const t = GAME.G.time; while (GAME.G.time - t < 0.5) await new Promise(r => setTimeout(r, 30));
  return GAME.G.barks - n0;
});
check(early === 1, 'early press waits', early);
check(!errors.length, 'no page errors', errors);
await browser.close(); srv.close();
console.log(fails ? fails + ' check(s) FAILED' : 'all ok');
process.exit(fails ? 1 : 0);
