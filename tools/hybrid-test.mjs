// Hybrid online co-op: two players sharing the host's screen and two sharing a friend's screen, in one game.
//   node tools/hybrid-test.mjs [--shots DIR]
// PEERSERVER=host:port uses your own PeerJS server (e.g. `npx peer --port 9000`) instead of the public 0.peerjs.com.
// Checks: a second person on the guest's keyboard joins in the lobby (roster), both get dogs when the journey
// starts, each keyboard side drives only its own dog on the host, the guest's camera follows both of its dogs,
// a local drop-in on the host makes 4, a third browser is then turned away, and the guest's sofa can't go past 4.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const argv = process.argv.slice(2);
const SHOTS = argv.includes('--shots') ? argv[argv.indexOf('--shots') + 1] : null;
const PS = process.env.PEERSERVER ? `&peerserver=${process.env.PEERSERVER}` : '';
const port = 8200 + Math.floor(Math.random() * 600);
const srv = await serve(port);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required', '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessRespectPreflightResults'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let failed = 0;
function check(name, ok, info) { if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${info !== undefined ? '  ' + JSON.stringify(info) : ''}`); }
const r2 = v => Math.round(v * 100) / 100;

async function openPage(query) {
  const ctx = await browser.newContext({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e.stack || e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://localhost:${port}/index.html${query}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.GAME && window.NET, null, { timeout: 120000 });
  await page.evaluate(() => { window.__render = GAME.renderer.render; GAME.renderer.render = () => {}; });   // SwiftShader would starve the game clock
  return { ctx, page, errors };
}
const drawing = (P, on) => P.page.evaluate(on => { GAME.renderer.render = on ? window.__render : () => {}; }, on);
const until = (P, fn, arg, ms = 20000) => P.page.waitForFunction(fn, arg, { timeout: ms, polling: 50 });
async function hold(P, key, ms) { await P.page.keyboard.down(key); await sleep(ms); await P.page.keyboard.up(key); }

try {
  // ---------------------------------------------------------------- host opens a room
  const A = await openPage(`?debug${PS}`);
  await A.page.click('#netOpen'); await A.page.fill('#netName', 'Hostie'); await A.page.click('#netHostBtn');
  await until(A, () => NET.code, null, 30000);
  const code = await A.page.evaluate(() => NET.code);

  // ---------------------------------------------------------------- a guest joins; a second person on its keyboard joins in the lobby
  const B = await openPage(`?debug&join=${code}${PS}`);
  await B.page.fill('#netName', 'Moss'); await B.page.click('#netJoinBtn');
  await until(B, () => NET.inRoom && NET.roster.length === 2, null, 30000);
  await B.page.evaluate(() => document.activeElement && document.activeElement.blur());
  await hold(B, 'KeyW', 120);                 // player one touches WASD: that side is theirs
  await hold(B, 'ArrowUp', 120);              // the other side of the keyboard: a second player
  await until(B, () => NET.roster.length === 3 && NET.locals.length === 2, null, 8000);
  const lobby = await B.page.evaluate(() => ({ roster: NET.roster.map(r => r.n), you: NET.you, locals: NET.locals.map(L => L.kind + L.index) }));
  const hostLobby = await A.page.evaluate(() => NET.seats.map(s => s.subs.length));
  check('a second person on the guest\'s keyboard joins in the lobby', lobby.roster.length === 3 && lobby.you.join() === '1,2' && lobby.locals.join() === 'kb0,kb1' && hostLobby.join() === '2', { ...lobby, hostSubs: hostLobby });

  // ---------------------------------------------------------------- the host starts (two on its sofa): 2 + 2
  await A.page.evaluate(() => { GAME.startGame({ kind: 'bot', index: 0 }); GAME.G.players[0].bot = {}; });
  await until(B, () => NET.locals.every(L => L.slot >= 0) && GAME.G.dogs.length === 3 && GAME.G.mode === 'play', null, 10000);
  await A.page.evaluate(() => { const p = GAME.joinPlayer({ kind: 'bot', index: 1 }); p.bot = {}; });
  await until(B, () => GAME.G.dogs.length === 4, null, 8000);
  await sleep(400);
  const slots = await B.page.evaluate(() => NET.locals.map(L => L.slot));
  const hostView = await A.page.evaluate(() => ({ dogs: GAME.G.dogs.length, local: GAME.G.dogs.filter(d => d.player.kind !== 'net').length, net: GAME.G.dogs.filter(d => d.player.kind === 'net').map(d => d.player.slot) }));
  const camB = await B.page.evaluate(() => { const d = GAME.G.dogs.filter(d => NET.locals.some(L => L.slot === d.player.slot)); return d.length; });
  check('two on the host\'s screen + two on the guest\'s = 4 dogs; the guest\'s camera follows its two', hostView.dogs === 4 && hostView.local === 2 && hostView.net.length === 2 && slots.length === 2 && slots.every(s => hostView.net.includes(s)) && camB === 2, { slots, hostView, guestCamDogs: camB });

  // ---------------------------------------------------------------- each side of the guest's keyboard drives only its own dog
  const pos = () => A.page.evaluate(sl => sl.map(s => { const d = GAME.G.dogs.find(d => d.player.slot === s); return [d.x, d.z]; }), slots);
  const moved = (a, b) => a.map((p, i) => r2(Math.hypot(b[i][0] - p[0], b[i][1] - p[1])));
  await A.page.evaluate(sl => { const [a, b] = sl.map(s => GAME.G.dogs.find(d => d.player.slot === s)); b.x = a.x - GAME.CAM_R.x * 6; b.z = a.z - GAME.CAM_R.z * 6; }, slots);   // apart, so one doesn't nudge the other
  await sleep(300);
  let p0 = await pos(); await hold(B, 'KeyD', 900); await sleep(500); let m1 = moved(p0, await pos());
  p0 = await pos(); await hold(B, 'ArrowLeft', 900); await sleep(500); let m2 = moved(p0, await pos());
  check('WASD moves the first guest dog only; the arrows move the second only', m1[0] > 1.5 && m1[1] < 0.5 && m2[1] > 1.5 && m2[0] < 0.5, { wasd: m1, arrows: m2 });

  // ---------------------------------------------------------------- the guest's two dogs share one screen: leashed together on the host
  const leash = await A.page.evaluate(sl => {
    const [a, b] = sl.map(s => GAME.G.dogs.find(d => d.player.slot === s));
    b.x = a.x + 150; b.z = a.z - 150; GAME.step(0.02);
    return GAME.CAM_R.x * (b.x - a.x) + GAME.CAM_R.z * (b.z - a.z);
  }, slots);
  check('the guest\'s two dogs are kept within one screen', Math.abs(leash) < 120, { screenDx: r2(leash) });

  // ---------------------------------------------------------------- full: no third browser, and no fifth dog from the guest's sofa
  const C = await openPage(`?debug${PS}`);
  await C.page.click('#netOpen'); await C.page.fill('#netCode', code); await C.page.fill('#netName', 'Pip'); await C.page.click('#netJoinBtn');
  await until(C, () => NET.statusErr, null, 25000);
  check('a third browser is turned away at 4 dogs', await C.page.evaluate(() => /full/.test(NET.status)), { msg: await C.page.evaluate(() => NET.status) });
  await C.ctx.close();
  const hint = await B.page.evaluate(() => document.getElementById('joins').textContent);
  check('the "press Ⓐ to join" prompt is gone on the guest at 4 dogs', hint === '', { hint });

  if (SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true });
    await Promise.all([A, B].map(P => drawing(P, true))); await sleep(2500);
    fs.writeFileSync(path.join(SHOTS, 'hybrid-host.png'), await A.page.screenshot());
    fs.writeFileSync(path.join(SHOTS, 'hybrid-guest.png'), await B.page.screenshot());
  }
  check('no page errors', !A.errors.length && !B.errors.length, { host: A.errors, guest: B.errors });
} catch (e) {
  console.error(e); failed++;
} finally {
  console.log(failed ? `${failed} check(s) FAILED` : 'all checks passed');
  await browser.close(); srv.close();
  process.exit(failed ? 1 : 0);
}
