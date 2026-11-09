// Online co-op, end to end: a host page and guest pages (separate browser contexts) talking through real PeerJS.
//   node tools/net-test.mjs [--shots DIR] [--quick]
// PEERSERVER=host:port uses your own PeerJS server (e.g. `npx peer --port 9000`) instead of the public 0.peerjs.com.
// Checks: connect + lobby, the guest's keys move its dog on the host, the flock matches on both screens (time-aligned),
// grass grazed on the host reaches the guest, coyotes and tombstones appear/vanish, a silent guest's input is zeroed,
// a dropped guest's dog waits and Rejoin takes it back, host-hidden pauses, wrong code / other build / full are
// reported, a second friend drops in mid-journey, and the traffic in bytes per second with 14 and with 60 sheep.
// WebGL drawing is switched off while checking (SwiftShader would starve the CPU and slow the game clock) and back
// on for the screenshots. Prints a JSON report; exits 1 on any failure.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const argv = process.argv.slice(2);
const SHOTS = argv.includes('--shots') ? argv[argv.indexOf('--shots') + 1] : null;
const QUICK = argv.includes('--quick');
const PS = process.env.PEERSERVER ? `&peerserver=${process.env.PEERSERVER}` : '';
const port = 8200 + Math.floor(Math.random() * 600);
const srv = await serve(port);
// (the local-network check would block the faked-build page's fetch to a PeerJS server on 127.0.0.1)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required', '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessRespectPreflightResults'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const report = { checks: {}, numbers: {} };
let failed = 0;
function check(name, ok, info) { report.checks[name] = { ok: !!ok, ...(info !== undefined ? { info } : {}) }; if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${info !== undefined ? '  ' + JSON.stringify(info) : ''}`); }
const r2 = v => Math.round(v * 100) / 100, r3 = v => Math.round(v * 1000) / 1000;

async function openPage(query, { mutate = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 });
  if (mutate) await ctx.route('**/index.html*', async route => {   // a different build: one extra comment in the game script
    const res = await route.fetch(); const body = (await res.text()).replace("import * as THREE from 'three';", "import * as THREE from 'three'; // another build");
    await route.fulfill({ response: res, body });
  });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e.stack || e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://localhost:${port}/index.html${query}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.GAME && window.NET, null, { timeout: 120000 });
  await page.evaluate(() => { window.__render = GAME.renderer.render; GAME.renderer.render = () => {}; });   // see the note at the top
  return { ctx, page, errors };
}
const drawing = (P, on) => P.page.evaluate(on => { GAME.renderer.render = on ? window.__render : () => {}; }, on);
const until = (P, fn, arg, ms = 20000) => P.page.waitForFunction(fn, arg, { timeout: ms, polling: 50 });
async function joinAs(P, name, code) {
  if (code) { await P.page.click('#netOpen'); await P.page.fill('#netCode', code); }
  await P.page.fill('#netName', name);
  await P.page.click('#netJoinBtn');
}
// every frame, each page notes the wall-clock time and where every sheep is drawn, so the two screens can be
// compared at the same instant (the host's position interpolated to each guest frame)
const startRecorder = P => P.page.evaluate(() => {
  window.__rec = [];
  (function rec() { requestAnimationFrame(rec); window.__rec.push([Date.now(), GAME.G.sheep.map(s => [s.id, s.x, s.z, Math.hypot(s.vx, s.vz)])]); if (window.__rec.length > 2000) window.__rec.shift(); })();
});
const takeRecord = P => P.page.evaluate(() => window.__rec.splice(0));
function alignedErrors(host, guest) {
  const errs = [], speeds = [];
  let j = 0;
  for (const [t, gs] of guest) {
    while (j + 1 < host.length && host[j + 1][0] <= t) j++;
    if (j + 1 >= host.length || host[j][0] > t) continue;
    const [t0, h0] = host[j], [t1, h1] = host[j + 1], k = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
    const m0 = new Map(h0.map(r => [r[0], r])), m1 = new Map(h1.map(r => [r[0], r]));
    for (const [id, x, z] of gs) {
      const a = m0.get(id), b = m1.get(id); if (!a || !b) continue;
      errs.push(Math.hypot(x - (a[1] + (b[1] - a[1]) * k), z - (a[2] + (b[2] - a[2]) * k))); speeds.push(a[3]);
    }
  }
  errs.sort((a, b) => a - b);
  const q = f => errs[Math.min(errs.length - 1, Math.floor(errs.length * f))] || 0;
  return { samples: errs.length, meanErr: r3(errs.reduce((a, b) => a + b, 0) / Math.max(1, errs.length)), p50: r3(q(0.5)), p95: r3(q(0.95)), max: r3(errs[errs.length - 1] || 0),
    meanSpeed: r2(speeds.reduce((a, b) => a + b, 0) / Math.max(1, speeds.length)), movingShare: r2(speeds.filter(v => v > 0.5).length / Math.max(1, speeds.length)) };
}
// the whole grass map, host vs guest, byte by byte. Grazing changes cells every frame, so the host pauses first
// (the grass ticks keep running) and both are read once the last corrections have landed.
async function grassDiff(H, Gst) {
  await H.page.evaluate(() => NET.api.setPause(true, 'test')); await sleep(900);
  const [ha, ga] = await Promise.all([H.page.evaluate(() => Array.from(NET.api.grass(), v => Math.round(v * 255))), Gst.page.evaluate(() => Array.from(NET.api.grass(), v => Math.round(v * 255)))]);
  await H.page.evaluate(() => NET.api.setPause(false));
  let mx = 0, nd = 0; for (let k = 0; k < ha.length; k++) { const d = Math.abs(ha[k] - ga[k]); if (d > mx) mx = d; if (d > 2) nd++; }
  return { cells: ha.length, maxByteDiff: mx, cellsOffBy3plus: nd };
}
const fpsOf = P => P.page.evaluate(() => new Promise(r => { let n = 0; const t = performance.now(); (function f() { n++; if (performance.now() - t < 1000) requestAnimationFrame(f); else r(n); })(); }));
async function sideBySide(file, shots) {   // the screens next to each other in one picture (best effort: never fails the run)
  shots.forEach(([label, buf], i) => fs.writeFileSync(file.replace(/\.png$/, `-${i + 1}.png`), buf));
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctx = await browser.newContext({ viewport: { width: 640 * shots.length + 10 * (shots.length - 1), height: 430 } });
    try {
      const p = await ctx.newPage();
      await p.setContent(`<body style="margin:0;background:#111;display:flex;gap:10px;font:14px sans-serif;color:#fff">${shots.map(([label, buf]) =>
        `<div><img style="display:block" src="data:image/png;base64,${buf.toString('base64')}"><div style="padding:6px">${label}</div></div>`).join('')}</body>`);
      await p.waitForTimeout(200); await p.screenshot({ path: file }); return;
    } catch (e) { if (attempt) console.log(`  (couldn't compose ${file}: ${String(e.message).split('\n')[0]}; the single screens are saved next to it)`); }
    finally { await ctx.close(); }
  }
}

try {
  // ---------------------------------------------------------------- host opens a room
  const A = await openPage(`?debug${PS}`);
  await A.page.click('#netOpen');
  await A.page.fill('#netName', 'Hostie');
  await A.page.click('#netHostBtn');
  await until(A, () => NET.code, null, 30000);
  const code = await A.page.evaluate(() => NET.code);
  check('host opens a room', /^[A-Z0-9]{5}$/.test(code), { code, link: await A.page.evaluate(() => NET.api.link()) });

  // ---------------------------------------------------------------- guest joins from the invite link (lobby)
  const B = await openPage(`?debug&join=${code}${PS}`);
  const prefilled = await B.page.evaluate(() => document.getElementById('netCode').value);
  const t0 = Date.now();
  await joinAs(B, 'Moss');
  await until(B, () => NET.inRoom);
  report.numbers.joinMs = Date.now() - t0;
  await until(B, () => GAME.G.sheep.length === 14 && NET.roster.length === 2, null, 8000);
  await sleep(300);
  const lobby = await B.page.evaluate(() => ({ roster: NET.roster.map(r => r.n), mode: GAME.G.mode, sheep: GAME.G.sheep.length, press: document.querySelector('#title .press').textContent }));
  check('guest joins from the invite link; lobby shows both and the host\'s flock', prefilled === code && lobby.roster.join() === 'Hostie,Moss' && /Waiting for Hostie/.test(lobby.press), { joinMs: report.numbers.joinMs, ...lobby });

  // ---------------------------------------------------------------- host starts; the guest gets a dog
  await A.page.evaluate(() => { GAME.startGame({ kind: 'bot', index: 0 }); GAME.G.players[0].bot = {}; });
  await until(B, () => NET.slot >= 0 && GAME.G.dogs.length === 2 && GAME.G.mode === 'play');
  await sleep(300);
  const st = await B.page.evaluate(() => ({ slot: NET.slot, dogs: GAME.G.dogs.map(d => d.player.name), titleHidden: document.getElementById('title').classList.contains('hidden'), hud: !document.getElementById('hud').classList.contains('hidden'), chip: document.getElementById('netChipT').textContent }));
  check('journey starts on both; the guest has its own named dog', st.slot === 1 && st.dogs.includes('Moss') && st.dogs.includes('Hostie') && st.titleHidden && st.hud, st);
  report.numbers.fps = { host: await fpsOf(A), guest: await fpsOf(B) };

  // ---------------------------------------------------------------- guest input moves its dog (on the host)
  const hostDog = () => A.page.evaluate(() => { const d = GAME.G.dogs.find(d => d.player.kind === 'net'); return { x: d.x, z: d.z, vx: d.vx, vz: d.vz, t: GAME.G.time, wall: Date.now() }; });
  const d0 = await hostDog();
  await B.page.keyboard.down('KeyD');
  const tk = Date.now();
  await until(A, d0 => { const d = GAME.G.dogs.find(d => d.player.kind === 'net'); return Math.hypot(d.x - d0.x, d.z - d0.z) > 0.2; }, d0, 5000);
  const firstMoveMs = Date.now() - tk;
  await sleep(1000);
  await B.page.keyboard.up('KeyD');
  await sleep(600);
  const d1 = await hostDog();
  const dx = d1.x - d0.x, dz = d1.z - d0.z, gameSecs = d1.t - d0.t;
  check('guest keys move its dog on the host (screen-right = world +x −z), and it stops on release',
    Math.hypot(dx, dz) > 5 && dx > 0 && dz < 0 && Math.hypot(d1.vx, d1.vz) < 0.5, { moved: r2(Math.hypot(dx, dz)), dx: r2(dx), dz: r2(dz), gameSecs: r2(gameSecs), keyToMotionMs: firstMoveMs });
  report.numbers.keyToMotionMs = firstMoveMs;
  const gd = await B.page.evaluate(() => { const d = GAME.G.dogs.find(d => d.player.slot === NET.slot); return { x: d.x, z: d.z }; });
  check('the guest draws its own dog where the host has it', Math.hypot(gd.x - d1.x, gd.z - d1.z) < 0.1, { err: r3(Math.hypot(gd.x - d1.x, gd.z - d1.z)) });

  // ---------------------------------------------------------------- the flock moves on both screens
  // open the corral gate and walk the host's dog through the pen toward it: the flock pours out and is driven on
  await A.page.evaluate(() => {
    const { G, pens, toggleGate } = GAME, p = pens[0], d = G.dogs[0];
    if (!p.open) toggleGate(p, d);
    const ux = Math.cos(p.gateA), uz = Math.sin(p.gateA);
    d.x = p.x - ux * 6; d.z = p.z - uz * 6; d.vx = d.vz = 0;
    const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
    window.__drive = setInterval(() => {   // stay ~7 m behind the flock, pushing it out along the gate direction and then up the trail
      let cx = 0, cz = 0, n = 0; for (const s of G.sheep) { cx += s.x; cz += s.z; n++; } cx /= n; cz /= n;
      const out = Math.hypot(cx - p.x, cz - p.z) > p.R + 4, pt = GAME.pathPoint(GAME.sAt(cx, cz) + 20, 0);
      let ax = out ? pt.x - cx : ux, az = out ? pt.z - cz : uz; const al = Math.hypot(ax, az) || 1; ax /= al; az /= al;
      const tx = cx - ax * 7, tz = cz - az * 7, ddx = tx - d.x, ddz = tz - d.z, l = Math.hypot(ddx, ddz);
      const wx = l > 1 ? ddx / l : ax * 0.5, wz = l > 1 ? ddz / l : az * 0.5;
      G.players[0].bot = { mx: wx * R.x + wz * R.z, my: -(wx * F.x + wz * F.z) };
    }, 150);
  });
  await Promise.all([startRecorder(A), startRecorder(B)]);
  await sleep(QUICK ? 5000 : 10000);
  const [recA, recB] = await Promise.all([takeRecord(A), takeRecord(B)]);
  report.numbers.flockLive = alignedErrors(recA, recB);
  check('flock matches while being driven (p95 < 0.5 m, time-aligned)', report.numbers.flockLive.movingShare > 0.3 && report.numbers.flockLive.p95 < 0.5, report.numbers.flockLive);
  // settle: pause on the host; the guest should land exactly where the host is
  await A.page.evaluate(() => NET.api.setPause(true, 'Hostie'));
  await sleep(800);
  const sheepPos = P => P.page.evaluate(() => GAME.G.sheep.map(s => [s.id, s.x, s.z]));
  const [hs, gs] = await Promise.all([sheepPos(A), sheepPos(B)]);
  const gm = new Map(gs.map(r => [r[0], r]));
  const settled = Math.max(...hs.map(([id, x, z]) => { const q = gm.get(id); return q ? Math.hypot(q[1] - x, q[2] - z) : 99; }));
  report.numbers.flockSettledMaxErr = r3(settled);
  check('flock matches exactly once the host pauses (max error, m)', settled < 0.03 && hs.length === gs.length, { maxErr: r3(settled), sheep: [hs.length, gs.length] });
  const pauseWhy = await B.page.evaluate(() => !document.getElementById('pause').classList.contains('hidden') && document.getElementById('pauseWhy').textContent);
  check('the guest sees the pause screen, and who paused', pauseWhy === 'Paused by Hostie', { why: pauseWhy });
  await B.page.keyboard.press('KeyP');
  await until(A, () => !GAME.G.paused, null, 5000);
  check('the guest pressing P unpauses the host', true);
  let shots = {};
  if (SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true });
    await Promise.all([drawing(A, true), drawing(B, true)]);
    await sleep(2500);
    const [ia, ib] = await Promise.all([A.page.screenshot(), B.page.screenshot()]);
    shots = { ia, ib };
    await sideBySide(path.join(SHOTS, 'driving.png'), [['host (Hostie, P1)', ia], ['guest (Moss, P2)', ib]]);
    await Promise.all([drawing(A, false), drawing(B, false)]);
  }

  // ---------------------------------------------------------------- grass grazed on the host shows on the guest
  const patch = await A.page.evaluate(() => {   // a 12 x 12 m patch of good grass somewhere on the trail ahead
    for (let s = 95; s < 170; s += 5) for (const lat of [-12, -6, 0, 6]) {
      const c = GAME.pathPoint(s, lat), pts = [];
      for (let x = -6; x <= 6; x += 2) for (let z = -6; z <= 6; z += 2) pts.push([c.x + x, c.z + z]);
      if (pts.every(([x, z]) => GAME.grassAt(x, z) > 0.2 && GAME.sdfAt(x, z) > 1)) return (window.__patch = pts);
    }
    return (window.__patch = []);
  });
  const before = await B.page.evaluate(pts => pts.map(([x, z]) => GAME.grassAt(x, z)), patch);
  await A.page.evaluate(() => { for (const [x, z] of window.__patch) for (let i = 0; i < 40; i++) NET.api.eat(x, z, 1); });
  await sleep(900);
  const [hostG, guestG] = await Promise.all([A.page.evaluate(pts => pts.map(([x, z]) => GAME.grassAt(x, z)), patch), B.page.evaluate(pts => pts.map(([x, z]) => GAME.grassAt(x, z)), patch)]);
  const gErr = Math.max(...hostG.map((v, i) => Math.abs(v - guestG[i])));
  check('a patch grazed bare on the host is bare on the guest within a second', patch.length && Math.max(...hostG) < 0.02 && gErr < 0.02 && Math.min(...before) > 0.15,
    { points: patch.length, guestBefore: r2(Math.min(...before)), hostAfter: r3(Math.max(...hostG)), maxDiff: r3(gErr) });
  const gd1 = await grassDiff(A, B);
  check('the whole grass map matches (every cell within 2/255, compared with the host paused)', gd1.maxByteDiff <= 2, gd1);

  // ---------------------------------------------------------------- coyotes
  await A.page.evaluate(() => GAME.spawnCoyotes(3));
  await until(B, () => GAME.G.coyotes.length === 3 && GAME.G.coyotes.every(c => c.models.root.parent), null, 5000);
  await sleep(1500);
  const [hc, gc] = await Promise.all([A.page.evaluate(() => GAME.G.coyotes.map(c => [c.nid, c.x, c.z, c.alpha])), B.page.evaluate(() => GAME.G.coyotes.map(c => [c.nid, c.x, c.z, c.alpha]))]);
  const cErr = Math.max(...hc.map(([id, x, z]) => { const q = gc.find(r => r[0] === id); return q ? Math.hypot(q[1] - x, q[2] - z) : 99; }));
  check('coyotes spawned on the host appear on the guest (with the alpha\'s model)', gc.length === 3 && cErr < 0.6 && gc.filter(r => r[3]).length === hc.filter(r => r[3]).length, { n: gc.length, maxErr: r3(cErr) });
  await B.page.evaluate(() => { window.__coyRoots = GAME.G.coyotes.map(c => c.models.root); });
  await A.page.evaluate(() => { for (const c of GAME.G.coyotes) c.gone = true; });
  await until(B, () => GAME.G.coyotes.length === 0, null, 5000);
  check('coyotes that leave are removed on the guest, models too', await B.page.evaluate(() => window.__coyRoots.every(r => !r.parent)));

  // ---------------------------------------------------------------- a sheep dies: tombstone + toast on the guest
  await A.page.evaluate(() => { const s = GAME.G.sheep[GAME.G.sheep.length - 1]; GAME.killSheep(s, 'eaten'); });
  await until(B, () => GAME.G.graves.length === 1, null, 5000);
  await sleep(300);
  const grave = await B.page.evaluate(() => ({ name: GAME.G.graves[0].name, inScene: !!GAME.G.graves[0].root.parent, sheep: GAME.G.sheep.length, toasts: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent) }));
  const hostGrave = await A.page.evaluate(() => GAME.G.graves[0].name);
  check('tombstone and the "coyotes got X" toast reach the guest', grave.name === hostGrave && grave.inScene && grave.toasts.some(t => t.includes(hostGrave)), { ...grave, hostGrave });

  // ---------------------------------------------------------------- bandwidth (the flock still being driven)
  const measure = async secs => {
    const s0 = await A.page.evaluate(() => ({ ...NET.stats, t: performance.now() }));
    await sleep(secs * 1000);
    const s1 = await A.page.evaluate(() => ({ ...NET.stats, t: performance.now(), moving: GAME.G.sheep.filter(s => Math.hypot(s.vx, s.vz) > 0.5).length }));
    const dt = (s1.t - s0.t) / 1000, per = k => Math.round((s1[k] - s0[k]) / dt);
    return { seconds: r2(dt), totalBps: per('bytes'), snapshotBps: per('snap'), grassBps: per('grass'), otherBps: per('other'), msgsPerSec: per('msgs'), sheep: await A.page.evaluate(() => GAME.G.sheep.length), movingAtEnd: s1.moving };
  };
  report.numbers.bandwidth14 = await measure(QUICK ? 4 : 8);
  await A.page.evaluate(() => { const fc = GAME.flockCenter(); for (let i = GAME.G.sheep.length; i < 60; i++) { const a = Math.random() * 6.28, r = 3 + Math.random() * 10; GAME.G.sheep.push(GAME.makeSheep(fc.x + Math.cos(a) * r, fc.z + Math.sin(a) * r, { hunger: 0.4 })); } });
  await until(B, () => GAME.G.sheep.length === 60, null, 5000);
  report.numbers.bandwidth60 = await measure(QUICK ? 4 : 8);
  await Promise.all([startRecorder(A), startRecorder(B)]); await sleep(3000);
  report.numbers.flockLive60 = alignedErrors(...await Promise.all([takeRecord(A), takeRecord(B)]));
  check('traffic measured with 14 and 60 sheep', report.numbers.bandwidth14.snapshotBps > 0 && report.numbers.bandwidth60.snapshotBps > report.numbers.bandwidth14.snapshotBps, { b14: report.numbers.bandwidth14, b60: report.numbers.bandwidth60, live60: report.numbers.flockLive60 });
  await A.page.evaluate(() => { clearInterval(window.__drive); GAME.G.players[0].bot = {}; });

  // ---------------------------------------------------------------- stale input: nothing arrives for a second → zeroed
  await B.page.keyboard.down('KeyW');
  await until(A, () => { const d = GAME.G.dogs.find(d => d.player.kind === 'net'); return Math.hypot(d.vx, d.vz) > 6; }, null, 5000);
  const moving1 = await hostDog();
  await B.page.evaluate(() => { window.__send = NET.conn.send; NET.conn.send = () => {}; });   // the guest goes quiet with the key still down
  await sleep(1700);
  const stopped = await hostDog();
  await B.page.evaluate(() => { NET.conn.send = window.__send; });
  await B.page.keyboard.up('KeyW');
  check('a guest that goes quiet has its held input zeroed after ~1 s', Math.hypot(stopped.vx, stopped.vz) < 0.3, { before: r2(Math.hypot(moving1.vx, moving1.vz)), after: r2(Math.hypot(stopped.vx, stopped.vz)) });

  // ---------------------------------------------------------------- drop → the dog waits → Rejoin takes it back
  await B.page.keyboard.down('KeyS');
  await until(A, () => { const d = GAME.G.dogs.find(d => d.player.kind === 'net'); return Math.hypot(d.vx, d.vz) > 6; }, null, 5000);
  await B.page.evaluate(() => NET.conn.close());   // the link drops while the guest is running
  await until(B, () => !document.getElementById('netLost').classList.contains('hidden'), null, 8000);
  await B.page.keyboard.up('KeyS');
  await until(A, () => NET.seats.length === 1 && !NET.seats[0].conn, null, 8000);
  await sleep(1300);
  const waiting = await A.page.evaluate(() => { const p = GAME.G.players.find(p => p.kind === 'net'), d = p.dog; return { players: GAME.G.players.length, speed: Math.hypot(d.vx, d.vz), lie: !!(p.inp && p.inp.lie), toasts: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent) }; });
  check('dropped guest: "lost" card on the guest; on the host the dog stops and waits', waiting.players === 2 && waiting.speed < 0.3 && waiting.lie && waiting.toasts.some(t => /Moss lost connection/.test(t)), { ...waiting, speed: r2(waiting.speed) });
  if (SHOTS) { await drawing(B, true); await sleep(1500); const ib = await B.page.screenshot(); fs.writeFileSync(path.join(SHOTS, 'guest-lost.png'), ib); await drawing(B, false); }
  await B.page.click('#netRejoin');
  await until(B, () => NET.inRoom && !NET.dead && NET.slot === 1, null, 20000);
  await until(A, () => NET.seats.length === 1 && NET.seats[0].conn && NET.seats[0].conn.open, null, 8000);
  await sleep(800);
  const back = await A.page.evaluate(() => ({ sheep: GAME.G.sheep.length, players: GAME.G.players.length, seats: NET.seats.length, name: GAME.G.players.find(p => p.kind === 'net').name, toasts: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent) }));
  const bg = await B.page.evaluate(() => ({ dogs: GAME.G.dogs.length, sheep: GAME.G.sheep.length, lostHidden: document.getElementById('netLost').classList.contains('hidden') }));
  check('Rejoin reclaims the same dog (seat kept by client id)', back.players === 2 && back.seats === 1 && back.name === 'Moss' && bg.dogs === 2 && bg.sheep === back.sheep && bg.lostHidden && back.toasts.some(t => /Moss is back/.test(t)), { ...back, guest: bg });
  const q0 = await hostDog(); await B.page.keyboard.down('KeyA'); await sleep(900); await B.page.keyboard.up('KeyA'); await sleep(400); const q1 = await hostDog();
  check('the rejoined guest drives its dog again', Math.hypot(q1.x - q0.x, q1.z - q0.z) > 3, { moved: r2(Math.hypot(q1.x - q0.x, q1.z - q0.z)) });

  // ---------------------------------------------------------------- host tab hidden → pauses, the guest is told
  await A.page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await until(B, () => GAME.G.paused && !document.getElementById('pause').classList.contains('hidden'), null, 5000);
  await sleep(300);
  const why = await B.page.evaluate(() => document.getElementById('pauseWhy').textContent);
  check('host tab hidden: the game pauses and the guest sees why', /background/.test(why), { why });
  if (SHOTS) { await drawing(B, true); await sleep(1500); fs.writeFileSync(path.join(SHOTS, 'guest-host-hidden.png'), await B.page.screenshot()); await drawing(B, false); }
  await A.page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); NET.api.setPause(false); });
  await until(B, () => !GAME.G.paused, null, 5000);

  // ---------------------------------------------------------------- errors shown plainly
  const statusOf = P => P.page.evaluate(() => NET.status);
  const C = await openPage(`?debug${PS}`);
  await joinAs(C, 'Pip', 'ZZZ22');
  await until(C, () => NET.statusErr, null, 25000);
  check('wrong code: "No game with the code …"', /No game with the code ZZZ22/.test(await statusOf(C)), { msg: await statusOf(C) });
  await C.ctx.close();
  const D = await openPage(`?debug${PS}`, { mutate: true });
  await joinAs(D, 'Pip', code);
  await until(D, () => NET.statusErr, null, 25000);
  check('another build: version mismatch', /different version/.test(await statusOf(D)), { msg: await statusOf(D) });
  await D.ctx.close();
  await A.page.evaluate(() => { NET.api.limits.maxGuests = 1; });
  const E = await openPage(`?debug${PS}`);
  await joinAs(E, 'Juniper', code);
  await until(E, () => NET.statusErr, null, 25000);
  check('room full', /full/.test(await statusOf(E)), { msg: await statusOf(E) });
  await E.ctx.close();
  await A.page.evaluate(() => { NET.api.limits.maxGuests = 3; });

  // ---------------------------------------------------------------- a second friend drops in mid-journey
  const F = await openPage(`?debug&join=${code}${PS}`);
  await joinAs(F, 'Juniper');
  await until(F, () => NET.slot >= 0 && GAME.G.dogs.length === 3 && GAME.G.sheep.length > 50, null, 20000);
  await sleep(500);
  const third = await F.page.evaluate(() => ({ slot: NET.slot, names: GAME.G.dogs.map(d => d.player.name).sort(), graves: GAME.G.graves.length, hour: +GAME.G.clock.hour.toFixed(2), born: GAME.G.stats.eaten }));
  const hostHour = await A.page.evaluate(() => +GAME.G.clock.hour.toFixed(2));
  await until(B, () => GAME.G.dogs.length === 3, null, 8000);
  const gd3 = await grassDiff(A, F);
  check('a second guest drops in mid-journey with the full state (dogs, flock, grave, clock, grass)', third.slot === 2 && third.names.join() === 'Hostie,Juniper,Moss' && third.graves === 1 && Math.abs(third.hour - hostHour) < 0.05 && gd3.maxByteDiff <= 2, { ...third, hostHour, grass: gd3 });

  // ---------------------------------------------------------------- a local player drops in on the host too
  await A.page.evaluate(() => { const p = GAME.joinPlayer({ kind: 'bot', index: 1 }); p.bot = {}; });
  await until(B, () => GAME.G.dogs.length === 4, null, 8000);
  await until(F, () => GAME.G.dogs.length === 4, null, 8000);
  const four =await F.page.evaluate(() => GAME.G.dogs.map(d => d.player.name).sort());
  const hostScreenDogs = await A.page.evaluate(() => GAME.G.dogs.filter(d => d.player.kind !== 'net').length);
  check('a local drop-in on the host plays alongside the online friends (4 dogs everywhere)', four.length === 4 && four.includes('P4') && hostScreenDogs === 2, { names: four, hostScreenDogs });
  if (SHOTS) {
    await Promise.all([A, B, F].map(P => drawing(P, true)));
    await A.page.evaluate(() => { const fc = GAME.flockCenter(); GAME.G.dogs.forEach((d, i) => { if (d.player.kind !== 'net') { d.x = fc.x - 6 + i * 2; d.z = fc.z + 4; } }); GAME.G.clock.hour = 20.6; });   // dusk falls
    await sleep(3500);
    const ims = await Promise.all([A, B, F].map(P => P.page.screenshot()));
    await sideBySide(path.join(SHOTS, 'three-screens-four-dogs.png'), [['host (Hostie + local P4)', ims[0]], ['guest 1 (Moss)', ims[1]], ['guest 2 (Juniper)', ims[2]]]);
    await Promise.all([A, B, F].map(P => drawing(P, false)));
  }

  // ---------------------------------------------------------------- the end of the journey, and a new one
  await A.page.evaluate(() => { const p = GAME.pens[3]; for (const s of GAME.G.sheep) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * (p.R - 2); s.x = p.x + Math.cos(a) * r; s.z = p.z + Math.sin(a) * r; s.vx = s.vz = 0; } for (const c of GAME.G.coyotes) c.gone = true; });
  await sleep(500);
  await A.page.evaluate(() => GAME.toggleGate(GAME.pens[3], GAME.G.dogs[0]));
  await sleep(300);
  await A.page.evaluate(() => GAME.toggleGate(GAME.pens[3], GAME.G.dogs[0]));
  await until(B, () => GAME.G.mode === 'end' && document.getElementById('end').style.opacity === '1', null, 8000);
  await sleep(400);
  const endOf = P => P.page.evaluate(() => ({ mode: GAME.G.mode, title: document.getElementById('eTitle').textContent, line: document.getElementById('eLine').textContent, stats: document.getElementById('eStats').textContent }));
  const [endA, endB] = await Promise.all([endOf(A), endOf(B)]);
  check("the finale shows on the guest with the host's results", endA.mode === 'end' && endB.title === endA.title && endB.line === endA.line && endB.stats === endA.stats, { host: endA.line, guest: endB.line });
  if (SHOTS) { await drawing(B, true); await sleep(1500); fs.writeFileSync(path.join(SHOTS, 'guest-finale.png'), await B.page.screenshot()); await drawing(B, false); }
  // the guest asks to herd again (the host ignores it for the finale's first 1.5 s, so press until it takes)
  for (let i = 0; i < 8 && await A.page.evaluate(() => GAME.G.mode === 'end'); i++) { await B.page.keyboard.press('Enter'); await sleep(600); }
  await until(A, () => GAME.G.mode === 'play' && GAME.G.sheep.length === 14, null, 8000);
  await until(B, () => GAME.G.mode === 'play' && GAME.G.sheep.length === 14 && document.getElementById('end').style.opacity === '0', null, 8000);
  await sleep(1200);
  const again = await B.page.evaluate(() => ({ day: GAME.G.clock.day, hour: +GAME.G.clock.hour.toFixed(1), graves: GAME.G.graves.length, dogs: GAME.G.dogs.length, hud: !document.getElementById('hud').classList.contains('hidden') }));
  const gd4 = await grassDiff(A, B);
  check('a guest pressing Enter starts a new journey for everyone (flock, clock, graves, grass reset)', again.day === 1 && again.graves === 0 && again.dogs === 4 && again.hud && gd4.maxByteDiff <= 2, { ...again, grass: gd4 });
  report.errors = { host: A.errors, guest: B.errors, guest2: F.errors };
  check('no page errors', !A.errors.length && !B.errors.length && !F.errors.length, report.errors);
} catch (e) {
  console.error(e); failed++;
} finally {
  console.log(JSON.stringify(report.numbers, null, 1));
  console.log(failed ? `${failed} check(s) FAILED` : 'all checks passed');
  await browser.close(); srv.close();
  process.exit(failed ? 1 : 0);
}
