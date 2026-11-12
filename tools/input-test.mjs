// Gamepad Ⓐ on slow frames: quick taps between frames still bark, a held press barks once, an early press waits out the cooldown.
// RB grabs (Ⓧ too), RT sprints, RB doesn't; right-stick swings shake what's held: one a swing, a quick one between frames too, held over: one.
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

// a press that lands mid-frame (after the frame's read, before its end) counts next frame: short or held
const midFrame = (b, ms) => page.evaluate(([b, ms]) => new Promise(res => {
  const R = GAME.renderer, orig = R.render;
  R.render = function (...a) { R.render = orig; const k = FAKE.buttons[b]; k.pressed = true; k.value = 1; setTimeout(() => { k.pressed = false; k.value = 0; res(); }, ms); return orig.apply(this, a); };
}), [b, ms]);
for (const ms of [60, 400]) {
  await ready(); b0 = await barks();
  await midFrame(0, ms); await nextFrame(); await nextFrame();
  check(await barks() - b0 === 1, `Ⓐ mid-frame (${ms} ms)`, await barks() - b0);
  await page.waitForFunction(() => GAME.G.dogs[0].pounceCD <= 0 && !(GAME.G.dogs[0].pounceT > 0) && !(GAME.G.dogs[0].hopT > 0), null, { timeout: 60000 });
  const p0 = await page.evaluate(() => GAME.MV.pounces || 0);
  await midFrame(1, ms); await nextFrame(); await nextFrame();
  check(await page.evaluate(() => GAME.MV.pounces || 0) - p0 === 1, `Ⓑ mid-frame (${ms} ms)`, await page.evaluate(() => GAME.MV.pounces || 0) - p0);
}
// Ⓑ pressed just before the pounce cooldown's up still pounces
await page.waitForFunction(() => GAME.G.dogs[0].pounceCD <= 0 && !(GAME.G.dogs[0].pounceT > 0), null, { timeout: 60000 });
const earlyP = await page.evaluate(async () => {
  const d = GAME.G.dogs[0], n0 = GAME.MV.pounces || 0; d.pounceCD = 0.12; d.pounceBuf = GAME.T.pounceBuf;
  const t = GAME.G.time; while (GAME.G.time - t < 0.5) await new Promise(r => setTimeout(r, 30));
  return (GAME.MV.pounces || 0) - n0;
});
check(earlyP === 1, 'early Ⓑ waits', earlyP);

// RB: grab (held), not sprint; RT: sprint
const btn = (b, v) => page.evaluate(([b, v]) => { const k = FAKE.buttons[b]; k.pressed = v; k.value = v ? 1 : 0; }, [b, v]);
const stick = (x, y = 0) => page.evaluate(([x, y]) => { FAKE.axes[0] = x; FAKE.axes[1] = y; }, [x, y]);
const rstick = (x, y = 0) => page.evaluate(([x, y]) => { FAKE.axes[2] = x; FAKE.axes[3] = y; }, [x, y]);
const frames = async n => { for (let i = 0; i < n; i++) await nextFrame(); };
await stick(1); await btn(5, true); await frames(4);
const rb = await page.evaluate(() => { const d = GAME.G.dogs[0], r = GAME.readInput(GAME.G.players[0]); return { grab: r.grab, sprint: r.sprint, held: d.grabHeld, mode: d.mode }; });
await btn(5, false); await btn(7, true); await frames(4);
const rt = await page.evaluate(() => GAME.G.dogs[0].mode);
await btn(7, false); await stick(0); await frames(3);
check(rb.grab && rb.held && !rb.sprint && rb.mode !== 'sprint' && rt === 'sprint', 'RB grabs, RT sprints', { rb, rt });

// a sheep in its mouth (RB held): right-stick swings shake it
const bite = () => page.evaluate(() => { const { G } = GAME, d = G.dogs[0], s = G.sheep.find(o => !o.ram && !o.dead); s.x = d.x + Math.sin(d.yaw) * 1.1; s.z = d.z + Math.cos(d.yaw) * 1.1; s.vx = s.vz = 0; window._s = s; });
await bite(); await btn(5, true); await frames(3);
const holding = await page.evaluate(() => GAME.G.dogs[0].holding === window._s);
const shakes = () => page.evaluate(() => GAME.MV.shakes || 0);
const cool = () => page.waitForFunction(() => (GAME.G.dogs[0].shakeCD || 0) <= GAME.G.time, null, { timeout: 60000 });
let s0 = await shakes(); await rstick(1); await frames(2); await rstick(0); await frames(2); await cool();
const one = await shakes() - s0;
s0 = await shakes(); await rstick(-1); await page.waitForTimeout(25); await rstick(0); await frames(2); await cool();   // pushed and back between two frames
const quick = await shakes() - s0;
s0 = await shakes(); await rstick(1); await page.waitForTimeout(900); await rstick(0); await frames(2); await cool();
const held = await shakes() - s0;
s0 = await shakes(); for (const x of [1, -1, 1, -1]) { await rstick(x); await frames(1); await cool(); } await rstick(0); await frames(2);
const waggle = await shakes() - s0;
await btn(5, false); await frames(2);
check(holding && one === 1 && quick === 1 && held === 1 && waggle === 4, 'right stick: a swing a shake; between frames too; held over: one; waggled: one each', { holding, one, quick, held, waggle });
check(!errors.length, 'no page errors', errors);
await browser.close(); srv.close();
console.log(fails ? fails + ' check(s) FAILED' : 'all ok');
process.exit(fails ? 1 : 0);
