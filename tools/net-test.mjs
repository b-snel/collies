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
  await until(A, () => { const d = GAME.G.dogs.find(d => d.player.kind === 'net'); return Math.hypot(d.vx, d.vz) < 0.3; }, null, 8000); await sleep(500);   // stopped, and the guest has caught up
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
  check('flock matches exactly once the host pauses (max error, m)', settled < 0.05 && hs.length === gs.length, { maxErr: r3(settled), sheep: [hs.length, gs.length] });
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
    for (let s = 95; s < 340; s += 5) for (const lat of [-12, -6, 0, 6]) {   // (well ahead of where the flock has been grazing)
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
  check('the whole grass map matches (every cell within 3/255, compared with the host paused)', gd1.maxByteDiff <= 3, gd1);

  // ---------------------------------------------------------------- coyotes
  // (dens keep their own sleeping packs about, so track just the ones spawned here)
  await A.page.evaluate(() => { window.__old = new Set(GAME.G.coyotes); GAME.spawnCoyotes(3); });
  await sleep(400);
  const newIds = await A.page.evaluate(() => GAME.G.coyotes.filter(c => !window.__old.has(c)).map(c => c.nid));
  await until(B, ids => ids.every(id => GAME.G.coyotes.some(c => c.nid === id && c.models.root.parent)), newIds, 5000);
  await sleep(1500);
  const [hc, gc] = await Promise.all([A.page.evaluate(ids => GAME.G.coyotes.filter(c => ids.includes(c.nid)).map(c => [c.nid, c.x, c.z, c.alpha]), newIds),
    B.page.evaluate(ids => GAME.G.coyotes.filter(c => ids.includes(c.nid)).map(c => [c.nid, c.x, c.z, c.alpha]), newIds)]);
  const cErr = Math.max(...hc.map(([id, x, z]) => { const q = gc.find(r => r[0] === id); return q ? Math.hypot(q[1] - x, q[2] - z) : 99; }));
  check('coyotes spawned on the host appear on the guest (with the alpha\'s model)', newIds.length === 3 && gc.length === 3 && cErr < 0.6 && gc.filter(r => r[3]).length === hc.filter(r => r[3]).length, { n: gc.length, maxErr: r3(cErr) });
  await B.page.evaluate(ids => { window.__coyRoots = GAME.G.coyotes.filter(c => ids.includes(c.nid)).map(c => c.models.root); }, newIds);
  await A.page.evaluate(ids => { for (const c of GAME.G.coyotes) if (ids.includes(c.nid)) c.gone = true; }, newIds);
  await until(B, ids => !GAME.G.coyotes.some(c => ids.includes(c.nid)), newIds, 5000);
  check('coyotes that leave are removed on the guest, models too', await B.page.evaluate(() => window.__coyRoots.every(r => !r.parent)));
  const sleepers = await Promise.all([A, B].map(X => X.page.evaluate(() => GAME.G.coyotes.filter(c => c.state === 'sleep').length)));
  check('coyotes asleep in their dens show asleep on the guest too', sleepers[0] === sleepers[1], { host: sleepers[0], guest: sleepers[1] });

  // ---------------------------------------------------------------- forage: picked plants, salt, what a dog carries, the troughs and lick reach the guest
  await A.page.evaluate(() => {
    const { PLANTS, SALT_ROCKS, pens, G } = GAME;
    for (const p of PLANTS.slice(0, 5)) { p.picked = true; p.regrowAt = 1e9; }
    SALT_ROCKS[0].taken = true; SALT_ROCKS[0].regrowAt = 1e9;
    G.dogs[0].greens = 2.5; G.dogs[0].salt = 1;
    pens[1].troughs[0].food = 3.2; pens[1].troughs[2].food = 1.5; pens[1].lick.salt = 7;
  });
  await sleep(1200);
  const fg = await B.page.evaluate(() => { const { PLANTS, SALT_ROCKS, pens, G } = GAME, d = G.dogs.find(o => o.player.slot === 0); return { picked: PLANTS.slice(0, 5).filter(p => p.picked).length, salt: SALT_ROCKS[0].taken, greens: d && d.greens, carriesSalt: d && d.salt, troughs: pens[1].troughs.map(t => t.food), lick: pens[1].lick.salt }; });
  check('forage reaches the guest: picked plants, a salt rock, what the dog carries, the troughs and the salt lick', fg.picked === 5 && fg.salt && Math.abs(fg.greens - 2.5) < 0.05 && fg.carriesSalt === 1 && Math.abs(fg.troughs[0] - 3.2) < 0.05 && Math.abs(fg.troughs[2] - 1.5) < 0.05 && Math.abs(fg.lick - 7) < 0.05, fg);

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

  // ---------------------------------------------------------------- the newer features, seen from the guest
  // every frame each page notes (wall clock, value) for whatever the probe returns, to compare at the same instant
  const probe = (P, fn, arg) => P.page.evaluate(([src, arg]) => { const f = new Function('arg', 'return (' + src + ')(arg)'), tok = {}; window.__probeTok = tok; window.__probe = []; (function rec() { if (window.__probeTok !== tok) return; requestAnimationFrame(rec); window.__probe.push([Date.now(), f(arg)]); })(); }, [fn.toString(), arg]);
  const probed = P => P.page.evaluate(() => { const r = window.__probe; window.__probeTok = null; window.__probe = null; return r; });
  // Hank: he walks on the host; his lines (only the ones he really says) show in the guest's bubble
  await sleep(1500);
  const [hkA, hkB] = await Promise.all([A.page.evaluate(() => [GAME.HANK.x, GAME.HANK.z]), B.page.evaluate(() => [GAME.HANK.x, GAME.HANK.z])]);
  await A.page.evaluate(() => { GAME.hank('good_dog', null, { force: true }); GAME.hank('thats_it'); });   // the second is inside his gap: he doesn't say it
  await until(B, () => document.getElementById('hankBubble').classList.contains('on'), null, 4000).catch(() => {});
  await sleep(500);
  const bub = await B.page.evaluate(() => ({ on: document.getElementById('hankBubble').classList.contains('on'), text: document.querySelector('#hankBubble span').textContent }));
  check("Hank walks where the host's Hank is, and his line shows in the guest's bubble (a line he didn't say doesn't)", Math.hypot(hkA[0] - hkB[0], hkA[1] - hkB[1]) < 0.6 && bub.on && bub.text === 'Good dog!',
    { hankErr: r2(Math.hypot(hkA[0] - hkB[0], hkA[1] - hkB[1])), ...bub });
  // a punted sheep flies on the guest's screen too
  const puntId = await A.page.evaluate(() => {
    const d = GAME.G.dogs[0], s = GAME.G.sheep.filter(s => !s.pen && !s.air && !s.heldBy && !s.ram).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z))[0];
    return s.id;
  });
  await Promise.all([probe(A, id => { const s = GAME.G.sheep.find(s => s.id === id); return s ? [s.x, s.z, s.air ? s.air.h - GAME.groundY(s.x, s.z) : 0, s.air ? s.air.kind : null] : null; }, puntId),
    probe(B, id => { const s = GAME.G.sheep.find(s => s.id === id); return s ? [s.x, s.z, s.air ? s.y - GAME.groundY(s.x, s.z) : 0, s.air ? s.air.kind : null, !!s.pose] : null; }, puntId)]);
  await A.page.evaluate(id => { const s = GAME.G.sheep.find(s => s.id === id), d = GAME.G.dogs[0], a = Math.random() * 6.28; GAME.launchSheep(s, Math.cos(a) * 9, Math.sin(a) * 9, 10, 'punt', d); }, puntId);
  await sleep(3500);
  const [pA, pB] = await Promise.all([probed(A), probed(B)]);
  const peak = r => Math.max(...r.filter(x => x[1]).map(x => x[1][2]));
  const kinds = [...new Set(pB.filter(x => x[1] && x[1][3]).map(x => x[1][3]))];
  const pEndA = pA[pA.length - 1][1], pEndB = pB[pB.length - 1][1];
  check('a punted sheep flies, spins and lands on the guest too', peak(pB) > 1.2 && Math.abs(peak(pB) - peak(pA)) < 0.6 && kinds.includes('punt') && pB.some(x => x[1] && x[1][4]) && !pEndB[3] && Math.hypot(pEndA[0] - pEndB[0], pEndA[1] - pEndB[1]) < 0.5,
    { peakHost: r2(peak(pA)), peakGuest: r2(peak(pB)), kinds, landedErr: r2(Math.hypot(pEndA[0] - pEndB[0], pEndA[1] - pEndB[1])) });
  // a gate swung on the host swings on the guest (the valley camp's)
  await Promise.all([probe(A, () => GAME.pens[1].phi), probe(B, () => GAME.pens[1].phi)]);
  await A.page.evaluate(() => GAME.toggleGate(GAME.pens[1]));
  await sleep(2500);
  const [gA, gB] = await Promise.all([probed(A), probed(B)]);
  let gateErr = 0; for (const [t, v] of gB) { const j = gA.findIndex(r => r[0] >= t); if (j > 0) gateErr = Math.max(gateErr, Math.abs(v - gA[j - 1][1])); }
  const gEnd = await Promise.all([A, B].map(P => P.page.evaluate(() => { const p = GAME.pens[1]; return { phi: p.phi, gateT: p.gateT, latched: p.latched, rot: p.gateMesh.rotation.y }; })));
  check('a gate swung on the host swings on the guest (eased, never far behind)', new Set(gB.map(x => x[1].toFixed(2))).size > 8 && gateErr < 0.5 && Math.abs(gEnd[0].rot - gEnd[1].rot) < 0.06 && Math.abs(gEnd[0].gateT - gEnd[1].gateT) < 0.05 && gEnd[1].gateT > 0.9,
    { steps: new Set(gB.map(x => x[1].toFixed(2))).size, maxLagRad: r2(gateErr), host: { phi: r2(gEnd[0].phi), gateT: r2(gEnd[0].gateT) }, guest: { phi: r2(gEnd[1].phi), gateT: r2(gEnd[1].gateT) } });
  // a ram squares up and charges: the guest sees the windup and the charge
  const ramId = await A.page.evaluate(() => { const r = GAME.G.sheep.find(s => s.ram && !s.lamb && !s.pen && !s.air && !s.heldBy); return r ? r.id : null; });
  let ramSeen = [];
  if (ramId) {
    await probe(B, id => { const s = GAME.G.sheep.find(s => s.id === id); return s ? s.rs : null; }, ramId);
    await A.page.evaluate(id => { const r = GAME.G.sheep.find(s => s.id === id), d = GAME.G.dogs[0]; d.x = r.x + 5; d.z = r.z; d.vx = d.vz = 0; GAME.provokeRam(r, d); }, ramId);
    await sleep(4000);
    ramSeen = [...new Set((await probed(B)).map(x => x[1]))];
  }
  check('a ram winds up and charges on the guest\'s screen', ramSeen.includes('windup') && (ramSeen.includes('charge') || ramSeen.includes('dazed')), { ramId, seen: ramSeen });
  // a hat and some paint from the barn show on the guest's copy of the sheep; she keeps the hat on her tombstone
  const hatId = await A.page.evaluate(() => { const s = GAME.G.sheep.find(s => !s.ram && !s.lamb && !s.pen); GAME.barnSet(s, { hat: 'tophat', hatColor: '#3a86ff', paint: [{ c: '#e63946', s: 0.08, p: [0.3, 0.5, 0.5, 0.6, 0.7, 0.5] }] }); return s.id; });
  await sleep(800);
  const hat = await B.page.evaluate(id => { const s = GAME.G.sheep.find(s => s.id === id); const tops = GAME.DRESS.item.tophat || []; return { hat: s && s.look && s.look.hat, paint: s && s.look ? s.look.paint.length : 0, tile: s ? s._tile : -1, tophatsDrawn: tops.reduce((a, p) => a + p.m.count, 0) }; }, hatId);
  await A.page.evaluate(id => GAME.killSheep(GAME.G.sheep.find(s => s.id === id), 'eaten'), hatId);
  await until(B, id => GAME.G.graves.length === 2, hatId, 5000).catch(() => {});
  const graveHat = await B.page.evaluate(() => { let h = null; const g = GAME.G.graves[GAME.G.graves.length - 1]; g && g.root.traverse(o => { if (o.userData.hat) h = o.userData.hat; }); return h; });
  check('a hat and paint from the barn show on the guest, and the hat rests on her tombstone', hat.hat === 'tophat' && hat.paint === 1 && hat.tile >= 0 && hat.tophatsDrawn >= 1 && graveHat === 'tophat', { ...hat, graveHat });
  // the guest's own moves: pounce (a one-shot) and lie down (held)
  const gdog = () => A.page.evaluate(() => { const d = GAME.G.dogs.find(d => d.player.kind === 'net'); return { pounceT: d.pounceT, mode: d.mode }; });
  await probe(A, () => { const d = GAME.G.dogs.find(d => d.player.kind === 'net'); return d.pounceT; });
  await B.page.keyboard.press('KeyE');
  await sleep(700);
  const pounced = Math.max(...(await probed(A)).map(x => x[1]));
  await B.page.keyboard.down('KeyC'); await sleep(700);
  const [lieA, lieB] = await Promise.all([gdog(), B.page.evaluate(() => GAME.G.dogs.find(d => d.player.slot === NET.slot).mode)]);
  await B.page.keyboard.up('KeyC'); await sleep(500);
  const upA = await gdog();
  check('the guest pounces (once per press) and lies down (held)', pounced > 0.1 && lieA.mode === 'lie' && lieB === 'lie' && upA.mode !== 'lie', { pounceT: r2(pounced), lyingHost: lieA.mode, lyingGuest: lieB, after: upA.mode });
  // sounds and juice from the dog moves arrived as effects (synth SFX, camera shake), and the mood readout matches
  const fxIn = await B.page.evaluate(() => NET.fxIn);
  const moods = await Promise.all([A, B].map(P => P.page.evaluate(() => [GAME.MIND.mood, document.getElementById('hMood').textContent])));
  check('dog-move sounds and juice reach the guest; its mood readout matches the host', Object.keys(fxIn).some(k => k.startsWith('X.')) && Math.abs(moods[0][0] - moods[1][0]) < 0.06,
    { sfx: Object.keys(fxIn).filter(k => k.startsWith('X.') || k === 'shakeCam' || k === 'hitStop' || k === 'dizzy' || k === 'landDog'), mood: moods });
  // the barn is the host's: Tab does nothing on a guest; the host in the barn pauses the game for the friends
  await B.page.keyboard.press('Tab'); await sleep(300);
  const guestBarn = await B.page.evaluate(() => GAME.BARN.open);
  await A.page.evaluate(() => GAME.openBarn());
  await until(B, () => GAME.G.paused && /barn/.test(document.getElementById('pauseWhy').textContent), null, 15000).catch(() => {});
  const barnWhy = await B.page.evaluate(() => document.getElementById('pauseWhy').textContent);
  await A.page.evaluate(() => GAME.closeBarn());
  await until(B, () => !GAME.G.paused, null, 5000).catch(() => {});
  const barnAfter = await B.page.evaluate(() => GAME.G.paused);
  check("Hank's barn is the host's: not on a guest, and the host in it pauses the friends", !guestBarn && /Hank's barn/.test(barnWhy) && !barnAfter, { guestBarn, barnWhy, pausedAfter: barnAfter });

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
  const waiting = await A.page.evaluate(() => { const p = GAME.G.players.find(p => p.kind === 'net'), d = p.dog; return { players: GAME.G.players.length, speed: Math.hypot(d.vx, d.vz), mode: d.mode, toasts: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent) }; });
  check('dropped guest: "lost" card on the guest; on the host the dog lies down and waits', waiting.players === 2 && waiting.speed < 0.3 && waiting.mode === 'lie' && waiting.toasts.some(t => /Moss lost connection/.test(t)), { ...waiting, speed: r2(waiting.speed) });
  if (SHOTS) { await drawing(B, true); await sleep(1500); const ib = await B.page.screenshot(); fs.writeFileSync(path.join(SHOTS, 'guest-lost.png'), ib); await drawing(B, false); }
  await B.page.click('#netRejoin');
  await until(B, () => NET.inRoom && !NET.dead && NET.slot === 1, null, 20000);
  await until(A, () => NET.seats.length === 1 && NET.seats[0].conn && NET.seats[0].conn.open, null, 8000);
  await sleep(800);
  const back = await A.page.evaluate(() => ({ sheep: GAME.G.sheep.length, players: GAME.G.players.length, seats: NET.seats.length, name: GAME.G.players.find(p => p.kind === 'net').name, toasts: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent) }));
  const bg = await B.page.evaluate(() => ({ dogs: GAME.G.dogs.length, sheep: GAME.G.sheep.length, lostHidden: document.getElementById('netLost').classList.contains('hidden') }));
  check('Rejoin reclaims the same dog (seat kept by client id)', back.players === 2 && back.seats === 1 && back.name === 'Moss' && bg.dogs === 2 && bg.sheep === back.sheep && bg.lostHidden && back.toasts.some(t => /Moss is back/.test(t)), { ...back, guest: bg });
  const q0 = await hostDog(); await B.page.keyboard.down('KeyA'); await sleep(1200); await B.page.keyboard.up('KeyA'); await sleep(400); const q1 = await hostDog();
  check('the rejoined guest drives its dog again', Math.hypot(q1.x - q0.x, q1.z - q0.z) > 1.5, { moved: r2(Math.hypot(q1.x - q0.x, q1.z - q0.z)) });

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
  const hostHour = await A.page.evaluate(() => +GAME.G.clock.hour.toFixed(2)), hostGraves = await A.page.evaluate(() => GAME.G.graves.length);
  await until(B, () => GAME.G.dogs.length === 3, null, 8000);
  const gd3 = await grassDiff(A, F);
  check('a second guest drops in mid-journey with the full state (dogs, flock, grave, clock, grass)', third.slot === 2 && third.names.join() === 'Hostie,Juniper,Moss' && third.graves === hostGraves && Math.abs(third.hour - hostHour) < 0.05 && gd3.maxByteDiff <= 3, { ...third, hostHour, hostGraves, grass: gd3 });

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
  await A.page.evaluate(() => GAME.setGate(GAME.pens[3], false));   // shut and latched (pushing it shut is moves-sim's job; this is about the finale reaching everyone)
  await sleep(300);
  await A.page.evaluate(() => GAME.onGateClosed(GAME.pens[3]));
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
  check('a guest pressing Enter starts a new journey for everyone (flock, clock, graves, grass reset)', again.day === 1 && again.graves === 0 && again.dogs === 4 && again.hud && gd4.maxByteDiff <= 3, { ...again, grass: gd4 });
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
