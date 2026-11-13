// SAILING online: a host and a guest (separate browser contexts, real PeerJS) at sea. The guest draws the host's voyage.
//   node tools/sea-net-test.mjs [--shots DIR]      PEERSERVER=host:port: your own PeerJS server (e.g. `npx peer --port 9000 --host 127.0.0.1`)
// Checks: Cold Harbour alongside (the boat, the gangway lashed, the guest's dog at the bow), the guest hauls her lines in with its own stick
// (the % on its screen), cast off (the land carried off, the chase camera), her pose and the waves the same on both, the guest's stick by its
// own camera, a life ring thrown and on the water, a sheep overboard (breath, on the ring), orcas, the kraken's arms, effects relayed,
// the anchor not dropped again just after it's weighed. WebGL drawing off while checking (as net-test), on for the screenshots. Exits 1 on a failure.
import { createRequire } from 'node:module';
import fs from 'node:fs';
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
  await page.evaluate(() => { window.__render = GAME.renderer.render; GAME.renderer.render = () => {}; });
  return { page, errors };
}
const drawing = (P, on) => P.page.evaluate(on => { GAME.renderer.render = on ? window.__render : () => {}; }, on);
const until = (P, fn, arg, ms = 20000) => P.page.waitForFunction(fn, arg, { timeout: ms, polling: 50 });
const pose = P => P.page.evaluate(() => { const S = GAME.SEA; return { on: S.on, docked: S.docked, e: S.e, n: S.n, hdg: S.hdg, heel: S.heel, eta: GAME.seaEta(S.e + 20, S.n - 30), t: GAME.G.time }; });
async function shot(name, ...Ps) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  for (const [i, P] of Ps.entries()) { await drawing(P, true); await sleep(900); await P.page.screenshot({ path: `${SHOTS}/${name}-${i ? 'guest' : 'host'}.png` }); await drawing(P, false); }
}

try {
  // ---------------------------------------------------------------- a room, a friend, a journey: straight to Cold Harbour, all aboard
  const A = await openPage(`?debug${PS}`);
  await A.page.click('#netOpen'); await A.page.fill('#netName', 'Hostie'); await A.page.click('#netHostBtn');
  await until(A, () => NET.code, null, 30000);
  const code = await A.page.evaluate(() => NET.code);
  const B = await openPage(`?debug&join=${code}${PS}`);
  await B.page.fill('#netName', 'Moss'); await B.page.click('#netJoinBtn');
  await until(B, () => NET.inRoom);
  await A.page.evaluate(() => { GAME.startGame({ kind: 'bot', index: 0 }); GAME.G.players[0].bot = {}; GAME.G.clock.hour = 9; });
  await until(B, () => NET.slot >= 0 && GAME.G.dogs.length === 2 && GAME.G.mode === 'play');
  check('the sea is the way on with a friend online', await A.page.evaluate(() => GAME.seaWay()));
  await A.page.evaluate(() => {
    const { G, SEA, STATIONS, T, seaStart } = GAME; seaStart({ leg: 0 }); T.sea.orca.from = 2;   // (no orcas till we call them)
    const d = G.dogs.find(d => d.player.kind === 'net'), st = STATIONS[3]; d.x = st.sx; d.z = st.sz; d.vx = d.vz = 0; d.yaw = st.yaw;   // the friend's dog at the bow
  });
  await until(B, () => GAME.SEA.on && GAME.DECK.lock, null, 10000).catch(() => {});
  await sleep(600);
  const dock = await B.page.evaluate(() => { const { SEA, DECK, QUAY, LAND, scene, SEAC } = GAME; return { on: SEA.on, docked: SEA.docked, berth: SEA.berth, lock: DECK.lock, quay: QUAY.on, land: LAND.parent === scene, camK: SEAC.k, h: SEA.hdg }; });
  const hdock = await pose(A);
  check('the guest has her alongside at Cold Harbour, the gangway lashed, the land where it is', dock.on && dock.docked && dock.berth === 0 && dock.lock && dock.quay && dock.land && Math.abs(dock.h - hdock.hdg) < 0.01, dock);
  await shot('dock', A, B);

  // ---------------------------------------------------------------- the guest takes the anchor station and hauls her lines in
  await B.page.keyboard.down('KeyE'); await sleep(600); await B.page.keyboard.up('KeyE');
  await until(B, () => { const d = GAME.G.dogs.find(d => d.player.slot === NET.slot); return d && d.holding === GAME.STATIONS[3]; }, null, 5000).catch(() => {});
  const bit = await B.page.evaluate(() => { const d = GAME.G.dogs.find(d => d.player.slot === NET.slot); return { st: GAME.STATIONS[3].by === d, holding: !!(d.holding && d.holding.isStation) }; });
  check('the guest\'s dog bites the anchor station (on both screens)', bit.st && bit.holding, bit);
  // stick up: in the bow's direction on the guest's screen (alongside: the land's camera, the bow's up the screen)
  await B.page.keyboard.down('KeyW');
  await until(B, () => GAME.SEA.weigh > 0.3, null, 8000).catch(() => {});
  const w = await B.page.evaluate(() => ({ k: GAME.SEA.weigh }));
  check('the guest sees the lines coming in (weigh %)', w.k > 0.3, { weigh: r2(w.k) });
  await until(A, () => !GAME.SEA.docked, null, 8000).catch(() => {});
  await B.page.keyboard.up('KeyW');
  await until(B, () => !GAME.SEA.docked && GAME.LAND.parent !== GAME.scene, null, 8000).catch(() => {});
  const away = await B.page.evaluate(() => ({ docked: GAME.SEA.docked, land: GAME.LAND.parent !== GAME.scene, quay: GAME.QUAY.on, aw: GAME.SEA.aweighT }));
  check('cast off with the guest\'s stick: on its screen she\'s away, the land carried off with the sea', !away.docked && away.land && !away.quay, away);

  // ---------------------------------------------------------------- just cast off: the stick swung down doesn't drop the anchor
  await B.page.keyboard.down('KeyS'); await sleep(900);
  const noDrop = await A.page.evaluate(() => GAME.SEA.anchor);
  await B.page.keyboard.up('KeyS');
  check('just cast off, the stick swung down doesn\'t drop the anchor', noDrop === 'up', { anchor: noDrop });
  await B.page.keyboard.down('KeyE'); await sleep(600); await B.page.keyboard.up('KeyE');   // (lets go of the station)
  await until(A, () => !GAME.STATIONS[3].by, null, 5000).catch(() => {});

  // ---------------------------------------------------------------- under way: her place, heading, heel and the waves the same on both
  await A.page.evaluate(() => { const S = GAME.SEA; S.pilot = 0.6; S.u = 4; });
  await sleep(4000);
  await until(B, () => GAME.SEAC.k > 0.9, null, 8000).catch(() => {});
  await A.page.evaluate(() => NET.api.hold(true, 'test')); await sleep(900);
  const [hp, gp] = await Promise.all([pose(A), pose(B)]);
  await A.page.evaluate(() => NET.api.hold(false, 'test'));
  const dPos = Math.hypot(hp.e - gp.e, hp.n - gp.n), dH = Math.abs(hp.hdg - gp.hdg), dEta = Math.abs(hp.eta - gp.eta);
  check('under way: her place, heading, heel and the sea\'s height match on both screens (paused)', gp.on && !gp.docked && dPos < 0.1 && dH < 0.01 && Math.abs(hp.heel - gp.heel) < 0.01 && dEta < 0.05, { dPos: r2(dPos), dHdg: r2(dH), dEta: r2(dEta), e: r2(hp.e) });
  const cam = await B.page.evaluate(() => ({ k: GAME.SEAC.k }));
  check('the guest has the chase camera', cam.k > 0.9, cam);
  await shot('under', A, B);

  // ---------------------------------------------------------------- the guest's stick goes by its own camera
  const f = await B.page.evaluate(() => ({ x: GAME.CAM_F.x, z: GAME.CAM_F.z }));
  await A.page.evaluate(() => { const { G, boatXZ } = GAME, d = G.dogs.find(d => d.player.kind === 'net'), q = boatXZ(-6, 0); d.x = q.x; d.z = q.z; d.vx = d.vz = 0; });
  await sleep(400);
  await B.page.keyboard.down('KeyW'); await sleep(700);
  const mv = await A.page.evaluate(f => { const d = GAME.G.dogs.find(d => d.player.kind === 'net'), l = Math.hypot(d.vx, d.vz) || 1; return { dot: (d.vx * f.x + d.vz * f.z) / l, sp: l, held: NET.seats[0].subs[0].held, paused: GAME.G.paused, t: GAME.G.time, hk: d.holdKind, mode: d.mode, stun: d.stunT, air: !!d.air }; }, f);
  await B.page.keyboard.up('KeyW');
  check('the guest\'s stick up: its dog runs up the guest\'s screen (its camera\'s way)', mv.sp > 2 && mv.dot > 0.9, { ...mv, dot: r2(mv.dot), sp: r2(mv.sp) });

  // ---------------------------------------------------------------- a sheep overboard, a life ring thrown to it
  for (let k = 0; k < 3; k++) {   // (one over the starboard rail; again if it didn't make it)
    await A.page.evaluate(() => {
      const { G, SEA, boatXZ, seaOverRail, onDeck } = GAME; SEA.u = 0.3; SEA.hoist = 0; SEA.pilot = null;
      const s = G.sheep.find(s => !s.dead && !s.air && !s.lamb && !s.heldBy && !s.grabbed && onDeck(s.x, s.z)); const q = boatXZ(-5.4, 3); s.x = q.x; s.z = q.z; s.vx = s.vz = 0; seaOverRail(s, 1, 5, 4, 'test'); window.__s = s;
    });
    if (await until(A, () => { const s = window.__s; return s.air && s.air.sea; }, null, 4000).then(() => true, () => false)) break;
  }
  await sleep(1200);
  const over = await B.page.evaluate(() => { const s = GAME.G.sheep.find(s => !s.dead && s.air && s.air.sea); return s ? { sea: s.air.sea, lung: s.air.lung, y: s.y } : null; });
  check('a sheep overboard: the guest has it in the sea, its breath running', over && over.sea && over.lung > 0 && over.lung <= 1, over);
  await A.page.evaluate(() => {   // the host's dog takes the starboard ring and throws it to her
    const { G, RINGS } = GAME, d = G.dogs[0], r = RINGS[1], s = window.__s;
    d.x = r.sx; d.z = r.sz; d.vx = d.vz = 0; d.yaw = Math.atan2(r.hx - d.x, r.hz - d.z); G.players[0].bot = { grab: true };
    window.__aim = setInterval(() => { if (r.st === 'held') d.yaw = Math.atan2(s.x - d.x, s.z - d.z); }, 20);
  });
  await until(A, () => GAME.RINGS[1].st === 'held', null, 5000).catch(() => {});
  await until(B, () => GAME.RINGS[1].st === 'held', null, 5000).catch(() => {});
  await sleep(200);
  const held = await B.page.evaluate(() => { const r = GAME.RINGS[1], d = GAME.G.dogs.find(d => d.player.slot === 0); return { st: r.st, by: r.by === d, near: Math.hypot(r.x - d.x, r.z - d.z), paused: GAME.G.paused, stop: GAME.FX && GAME.FX.stop }; });
  check('the guest sees the ring in the host\'s dog\'s mouth', held.st === 'held' && held.by && held.near < 1.5, held);
  await sleep(300);
  await A.page.evaluate(() => { GAME.G.players[0].bot = {}; });
  await until(B, () => GAME.RINGS[1].st === 'air' || GAME.RINGS[1].st === 'water', null, 5000).catch(() => {});
  await until(B, () => GAME.RINGS[1].st === 'water', null, 6000).catch(() => {});
  await A.page.evaluate(() => clearInterval(window.__aim));
  await A.page.evaluate(() => NET.api.hold(true, 'test')); await sleep(800);
  const [hr, gr] = await Promise.all([A.page.evaluate(() => { const r = GAME.RINGS[1]; return { st: r.st, x: r.x, z: r.z, sheep: r.sheep && r.sheep.id }; }), B.page.evaluate(() => { const r = GAME.RINGS[1]; return { st: r.st, x: r.x, z: r.z, sheep: r.sheep && r.sheep.id, fx: NET.fxIn.ringFx || 0 }; })]);
  await A.page.evaluate(() => NET.api.hold(false, 'test'));
  check('thrown: the guest sees the ring on the water where the host has it (and its effects)', gr.st === 'water' && Math.hypot(hr.x - gr.x, hr.z - gr.z) < 0.2 && gr.fx > 0, { host: hr.st, guest: gr.st, err: r2(Math.hypot(hr.x - gr.x, hr.z - gr.z)), fx: gr.fx });
  await A.page.evaluate(() => { const r = GAME.RINGS[1], s = window.__s, dx = r.x - r.hx, dz = r.z - r.hz, l = Math.hypot(dx, dz) || 1; if (!r.sheep && s.air) { s.x = r.x + dx / l * 0.8; s.z = r.z + dz / l * 0.8; } });   // (wherever it landed: she's by it, on the far side from the boat)
  await until(A, () => GAME.RINGS[1].sheep, null, 12000).catch(() => {});
  await sleep(600);
  const on = await B.page.evaluate(() => { const r = GAME.RINGS[1], s = r.sheep; return { ring: !!s, onRing: !!(s && s.air && s.air.ring === r) }; });
  const onH = await A.page.evaluate(() => { const r = GAME.RINGS[1], s = window.__s; return { st: r.st, sheep: !!r.sheep, air: s.air && (s.air.kind || 'swim'), dead: s.dead, why: s.why, d: Math.hypot(s.x - r.x, s.z - r.z) }; });
  check('the sheep takes hold of the ring: on the guest\'s screen too', on.ring && on.onRing, { ...on, host: onH });
  await shot('ring', A, B);

  // ---------------------------------------------------------------- orcas, the kraken
  await A.page.evaluate(() => { GAME.orcasCome(2); });
  await sleep(1500);
  const [ho, go] = await Promise.all([A.page.evaluate(() => GAME.HAZ.orcas.map(o => [o.e, o.n])), B.page.evaluate(() => GAME.HAZ.orcas.map(o => [o.e, o.n]))]);
  const oErr = go.length ? Math.max(...go.map(([e, n]) => Math.min(...ho.map(([e2, n2]) => Math.hypot(e - e2, n - n2))))) : 99;
  check('orcas: the guest has them where the host does', go.length === ho.length && ho.length === 2 && oErr < 6, { host: ho.length, guest: go.length, err: r2(oErr) });
  await A.page.evaluate(() => { const { SEA, KRAKEN, krakenGrip } = GAME; KRAKEN.on = true; KRAKEN.calm = true; KRAKEN.max = KRAKEN.hp = 3; SEA.hold = { heel: 0 }; krakenGrip(1); });
  await until(A, () => GAME.KRAKEN.arms.filter(a => a.st === 'grip').length > 1, null, 10000).catch(() => {}); await sleep(800);
  const kr = await B.page.evaluate(() => { const Q = GAME.KRAKEN; return { on: Q.on, hp: Q.hp, arms: Q.arms.length, grip: Q.arms.filter(a => a.st === 'grip').length, fx: NET.fxIn.seaFx || 0 }; });
  const kh = await A.page.evaluate(() => GAME.KRAKEN.arms.length), kst = await A.page.evaluate(() => ({ st: GAME.KRAKEN.arms.map(a => a.st + ':' + a.t.toFixed(1)), t: GAME.G.time, paused: GAME.G.paused, why: GAME.G.hold }));
  check('the kraken: its arms over the rail on the guest\'s screen, its hearts; sea effects relayed', kr.on && kr.hp === 3 && kr.arms === kh && kr.grip > 0 && kr.fx > 0, { ...kr, host: kh, kst });
  await shot('kraken', A, B);

  const errs = [...A.errors, ...B.errors];
  check('no errors on either screen', !errs.length, errs.slice(0, 4));
} catch (e) { console.log('FAIL (threw)', e); failed++; }
await browser.close(); srv.close();
process.exit(failed ? 1 : 0);
