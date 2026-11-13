// Dawn report: never scrolls (any count, any screen: denser, then zoomed), everyone on it shows;
// held to go on (Ⓐ / Start, Enter / Space / Esc, ▶): taps and mashing never skip it, nor a press from before it opened.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { serve } from './serve.mjs';
const srv = await serve(0), port = srv.address().port;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.addInitScript(() => {
  window.FAKE = { index: 0, connected: true, id: 'fake', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
  navigator.getGamepads = () => [window.FAKE];
});
await page.goto(`http://localhost:${port}/index.html?debug`);
await page.waitForFunction(() => window.GAME, null, { timeout: 60000 });
await page.evaluate(() => dispatchEvent(new Event('gamepadconnected')));   // padPoll every 4 ms
let fails = 0;
const check = (ok, name, v) => { console.log(ok ? 'ok  ' : 'FAIL', name, JSON.stringify(v)); if (!ok) fails++; };
const sleep = ms => page.waitForTimeout(ms);
await page.evaluate(() => GAME.startGame({ kind: 'kb', index: 0 }));

// open a card with nb lambs (named Lamb0…) and nd losses (Lost0…)
const open = (nb, nd) => page.evaluate(([nb, nd]) => {
  GAME.closeDawn();
  const G = GAME.G; while (G.sheep.filter(s => !s.ram).length < nb) GAME.makeSheep && G.sheep.push(GAME.makeSheep({ x: 0, z: 0 }));
  const born = G.sheep.filter(s => !s.ram).slice(0, nb); born.forEach((s, i) => { s.name = 'Lamb' + i; });
  const why = ['eaten', 'cougar', 'falcon', 'old', 'cold', 'snake', 'drowned', 'starved'];
  const dead = Array.from({ length: nd }, (_, i) => { const m = { name: 'Lost' + i, why: why[i % why.length], brave: (i % 5) / 5, day: 3, age: 40 }; m.text = GAME.eulogy(m); return m; });
  GAME.openDawn(born, dead);
  return born.length;
}, [nb, nd]);
const view = () => page.evaluate(() => {
  const el = document.getElementById('dawn'), c = el.querySelector('.barnCard'), r = c.getBoundingClientRect();
  const inside = q => [...c.querySelectorAll(q)].every(n => { const b = n.getBoundingClientRect(); return b.width > 0 && b.top >= r.top - 1 && b.bottom <= r.bottom + 1 && b.left >= r.left - 1 && b.right <= r.right + 1; });
  return { lv: c.className.replace('barnCard', '').trim(), zoom: +(c.style.zoom || 1), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), vw: innerWidth, vh: innerHeight,
    scroll: c.scrollHeight > c.clientHeight + 1 || c.scrollWidth > c.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1 || document.scrollingElement.scrollHeight > innerHeight + 1,
    rows: c.querySelectorAll('.dawnRow').length, obits: c.querySelectorAll('.dawnObit').length, allIn: inside('.dawnRow, .dawnObit, .hold, [data-flock]'),
    eulogies: [...c.querySelectorAll('.dawnObit em')].filter(e => e.offsetParent).length };
});

// FIT: every size, every count: no scroll, all on the screen
for (const [w, h] of [[1920, 1080], [1280, 720], [844, 390], [640, 360]]) {
  await page.setViewportSize({ width: w, height: h });
  for (const [nb, nd] of [[2, 1], [5, 3], [12, 12], [30, 40], [12, 120], [0, 300]]) {
    const t0 = Date.now(), n = await open(nb, nd), ms = Date.now() - t0; await sleep(60);
    const v = { ...await view(), ms };
    const ok = !v.scroll && v.allIn && v.rows === n && v.obits === nd && v.top >= 0 && v.left >= 0 && v.bottom <= v.vh && v.right <= v.vw;
    check(ok, `${w}×${h}, ${n} 🐣 ${nd} 🕯️: fits`, v);
  }
}
await page.setViewportSize({ width: 1280, height: 720 });
await open(2, 1); await sleep(60);
let v = await view(); check(v.lv === '' && v.eulogies === 1 && v.zoom === 1, 'a short one: as it was (eulogies, no zoom)', v);
// a resize refits it
await open(12, 40); await sleep(60);
const v1 = await view(); await page.setViewportSize({ width: 844, height: 390 }); await sleep(120);
const v2 = await view(); await page.setViewportSize({ width: 1280, height: 720 }); await sleep(120);
check(!v2.scroll && v2.allIn && v2.bottom <= 390 && v2.lv !== v1.lv + 'x', 'a resize refits it', { v1: v1.lv, v2: [v2.lv, v2.zoom, v2.bottom] });

const frames = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const isOpen = async () => { await frames(); return page.evaluate(() => GAME.DAWN.open); };
const fresh = async () => { await open(3, 2); await sleep(500); };   // past the grace
const A = (b, down) => page.evaluate(([b, v]) => { const k = FAKE.buttons[b]; k.pressed = v; k.value = v ? 1 : 0; }, [b, down]);

// KEYS
await fresh();
for (let i = 0; i < 12; i++) { await page.keyboard.down('Space'); await sleep(30); await page.keyboard.up('Space'); await sleep(30); }
for (let i = 0; i < 6; i++) { await page.keyboard.press('Enter'); await page.keyboard.press('Escape'); await sleep(40); }
check(await isOpen(), 'mashing Space / Enter / Esc: still open', await isOpen());
await page.keyboard.down('Enter'); await sleep(350); const midK = await page.evaluate(() => !!GAME.DAWN.hold);
await page.keyboard.up('Enter'); await sleep(50);
check(await isOpen() && midK, 'Enter let go half way: still open', { open: await isOpen(), holding: midK });
await page.keyboard.down('Enter'); await sleep(950);
await page.keyboard.up('Enter');
check(!(await isOpen()), 'Enter held: on', await isOpen());
// a key held down from before it opened: auto-repeat doesn't start a hold
await page.keyboard.down('Space'); await open(3, 2);
for (let i = 0; i < 12; i++) { await page.keyboard.down('Space'); await sleep(80); }
check(await isOpen(), 'Space held from before: still open', await isOpen());
await page.keyboard.up('Space');
// within the grace: a hold doesn't start
await open(3, 2); await page.keyboard.down('Enter'); await sleep(1100); await page.keyboard.up('Enter');
check(await isOpen(), 'a press in the first moment: nothing', await isOpen());

// PAD
await fresh();
for (let i = 0; i < 10; i++) { await A(0, true); await sleep(40); await A(0, false); await A(1, true); await sleep(40); await A(1, false); await sleep(30); }
check(await isOpen(), 'mashing Ⓐ / Ⓑ: still open', await isOpen());
await A(0, true); await sleep(950); await A(0, false);
check(!(await isOpen()), 'Ⓐ held: on', await isOpen());
// Ⓐ held from before it opened
await A(0, true); await sleep(100); await open(3, 2); await sleep(1200);
check(await isOpen(), 'Ⓐ held from before: still open', await isOpen());
await A(0, false); await sleep(100);
await A(9, true); await sleep(950); await A(9, false);
check(!(await isOpen()), 'Start held: on', await isOpen());
const barks = await page.evaluate(() => GAME.G.barks || 0); await sleep(300);
check(await page.evaluate(() => GAME.G.barks || 0) === barks, 'no bark from it after', barks);

// ▶ (mouse / touch)
await fresh();
const go = await page.evaluate(() => { const b = document.querySelector('#dawn .hold').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
for (let i = 0; i < 8; i++) { await page.mouse.click(go.x, go.y); await sleep(40); }
check(await isOpen(), 'clicking ▶: still open', await isOpen());
await page.mouse.move(go.x, go.y); await page.mouse.down(); await sleep(950); await page.mouse.up();
check(!(await isOpen()), '▶ held: on', await isOpen());
// a click on 🐑 ✏️ in the first moment: nothing; after: the barn
await open(3, 2);
const fl = await page.evaluate(() => { const b = document.querySelector('#dawn [data-flock]').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
await page.mouse.click(fl.x, fl.y);
check(await isOpen(), 'a click in the first moment: nothing', await isOpen());
await sleep(500); await page.mouse.click(fl.x, fl.y);
check(!(await isOpen()) && await page.evaluate(() => GAME.BARN && GAME.BARN.open), 'after it: 🐑 ✏️ opens the barn', await isOpen());

check(!errors.length, 'no errors', errors.slice(0, 3));
console.log(fails ? `${fails} FAILED` : 'all ok');
await browser.close(); srv.close();
process.exit(fails ? 1 : 0);
