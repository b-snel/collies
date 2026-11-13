// Headless checks for MUDDY DOGS: a dog through a bog comes out caked (d.mud), and only water cleans it: a swim, or a leap
// into a pen's water trough (a sit, a scrub, out; water slopped out; an empty one: CLONK). Then a shake.
// node tools/mud-test.mjs [coat|bog|keep|swim|tub|clonk|hop|carry|reset]
// Checks: each dog its own coat materials (uMud), the coat follows d.mud, drawn without errors; a bog cakes it (lying: faster,
//   a run in: a splat); it doesn't wear off, nor wash off wading a stream; a swim washes it, then a shake on dry land; a muddy dog
//   hopping a water trough lands in it: clean, water slopped out, out the pen side, a shake; a clean dog's jump in too; an empty one:
//   CLONK, still muddy; a clean dog walking into one just hops it; a sheep in muddy jaws gets muddy; a new journey: clean
import { open } from './harness.mjs';
const only = process.argv[2];
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const h = await open();
await h.page.evaluate(() => {
  const { G, step, startGame, groundY, CAM_R, CAM_F } = GAME;
  startGame({ kind: 'bot', index: 0 });
  const H = window.H = {};
  H.d = () => G.dogs[0]; H.p = () => G.players[0];
  H.to = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.place = (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); };
  H.run = (sec, fn) => { let t = 0; for (; t < sec - 1e-9; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return t; };
  H.r = v => Math.round(v * 100) / 100;
  H.reset = () => {
    GAME.resetGame(); G.clock.hour = 10; for (const c of G.coyotes) c.gone = true; GAME.T.mud.on = true;
    G.players.forEach(p => { p.bot = {}; });
    const far = GAME.pathPoint(300, 0); G.sheep.forEach((s, i) => H.place(s, far.x + (i % 6) * 2, far.z + Math.floor(i / 6) * 2));
  };
  // a water trough: where it is, the pen side (n), and a spot by it
  H.trough = (pi = 0) => { const p = GAME.pens[pi], u = p.water, n = u.box.solid; return { p, u, nx: n.nx, nz: n.nz }; };
});
const want = s => !only || only === s;

if (want('coat')) {
  const r = await h.page.evaluate(() => {
    H.reset(); const d = H.d(), M = d.models, mats = new Set();
    M.root.traverse(o => { if (o.material && o.material.userData && o.material.userData.fur) mats.add(o.material); });
    const own = [...mats].every(m => m.onBeforeCompile && m.userData.fur) && mats.size > 0;
    d.mud = 1; d.wet = 0; for (let i = 0; i < 90; i++) GAME.syncDirt(1 / 60, false);
    const u = M.mud.u.value.x;
    GAME.renderOnce(); d.mud = 0; for (let i = 0; i < 120; i++) GAME.syncDirt(1 / 60, false);
    return { n: mats.size, own, u: H.r(u), after: H.r(M.mud.u.value.x), dm: GAME.DOG_MUD ? 1 : 0 };
  });
  ok(`the coat: its own fur materials (${r.n}), muddied by d.mud (${r.u}), clean again (${r.after})`, r.own && r.u > 0.9 && r.after < 0.05, r);
  ok('drawn without errors', h.errors.length === 0, h.errors.slice(0, 3));
}

if (want('bog')) {
  const r = await h.page.evaluate(() => {
    const { MUDS, mudK, T, DIRT } = GAME, out = {};
    H.reset(); const d = H.d(), m = MUDS[0], a = { x: m.x - m.r - 3, z: m.z }, b = { x: m.x + m.r + 3, z: m.z };
    H.place(d, a.x, a.z);
    H.run(8, () => { H.p().bot = H.to(b.x - d.x, b.z - d.z); return d.x > b.x - 0.5; }); H.p().bot = {};
    out.walk = H.r(d.mud); out.inMud = mudK(m.x, m.z);
    H.reset(); H.place(d, m.x, m.z); H.p().bot = { lie: true }; H.run(1); out.lie = H.r(d.mud);
    H.reset(); H.place(d, a.x - 6, a.z); const m0 = d.mud;
    H.run(4, () => { H.p().bot = H.to(1, 0, { sprint: true }); return d.inMud; }); out.splat = H.r(d.mud - m0); H.p().bot = {};
    return out;
  });
  ok(`walked across a bog: caked (${r.walk})`, r.walk > 0.3 && r.walk < 1, r);
  ok(`lying in one a second: a wallow (${r.lie})`, r.lie > 0.8, r);
  ok(`run in at a sprint: a splat at once (+${r.splat})`, r.splat >= 0.3, r);
}

if (want('keep')) {
  const r = await h.page.evaluate(() => {
    const { STREAMS, inStream, sdfAt } = GAME;
    H.reset(); const d = H.d(); let P = null;   // (away from the pens and the water: a circle on dry grass)
    for (let s = 200; s < 900 && !P; s += 10) { const q = GAME.pathPoint(s, 0); if (GAME.pens.every(p => Math.hypot(p.x - q.x, p.z - q.z) > p.R + 25) && [...Array(16)].every((_, k) => !GAME.wetAt(q.x + Math.cos(k) * 14, q.z + Math.sin(k) * 14))) P = q; }
    H.place(d, P.x, P.z); d.mud = 0.8;
    H.run(60, t => { H.p().bot = H.to(Math.cos(t * 1.2), Math.sin(t * 1.2)); }); H.p().bot = {};
    const grass = H.r(d.mud);
    let sp = null; for (const st of STREAMS) for (const p of st.pts) if (!sp && inStream(p.x, p.z) && sdfAt(p.x, p.z) > 1) sp = p;
    H.place(d, sp.x, sp.z); H.run(10); const wade = H.r(d.mud);
    return { grass, wade, swim: !!(d.air && d.air.swim) };
  });
  ok(`no wearing off: a minute on the grass (${r.grass})`, r.grass === 0.8, r);
  ok(`nor wading a stream (${r.wade})`, r.wade === 0.8 && !r.swim, r);
}

if (want('swim')) {
  const r = await h.page.evaluate(() => {
    const { DIRT } = GAME;
    H.reset(); const d = H.d(), a = GAME.pathPoint(560, 12), b = GAME.pathPoint(560, 70);
    H.place(d, a.x, a.z); d.mud = 1;
    let swamAt = -1, cleanAt = -1;
    H.run(20, t => { H.p().bot = H.to(b.x - d.x, b.z - d.z); if (d.air && d.air.swim && swamAt < 0) swamAt = t; if (swamAt >= 0 && !d.mud && cleanAt < 0) cleanAt = t; return cleanAt >= 0 && t > cleanAt + 0.5; });
    const wet = H.r(d.wet), c0 = DIRT.cleans, s0 = DIRT.shakes;
    H.run(30, () => { H.p().bot = H.to(a.x - d.x, a.z - d.z); return !d.air && Math.hypot(a.x - d.x, a.z - d.z) < 3; }); H.p().bot = {};
    H.run(1.5);
    return { took: H.r(cleanAt - swamAt), wet, cleans: c0, shakes: DIRT.shakes - s0, after: H.r(d.wet), mud: d.mud };
  });
  ok(`a swim washes it off (${r.took} s), soaked`, r.took > 0.8 && r.took < 4 && r.cleans === 1 && r.wet === 1, r);
  ok(`out of the water: a shake (wet ${r.after})`, r.shakes === 1 && r.after < 0.4 && r.mud === 0, r);
}

if (want('tub')) {
  const r = await h.page.evaluate(() => {
    const { DIRT, T } = GAME, out = {};
    H.reset(); const d = H.d(), q = H.trough(), W = q.p.water;
    W.w = W.cap; const w0 = W.w;
    H.place(d, q.u.x + q.nx * 2.2, q.u.z + q.nz * 2.2); d.mud = 1;
    let inAt = -1, outAt = -1, cleanAt = -1; const sh0 = DIRT.shakes;
    H.run(6, t => { H.p().bot = inAt < 0 ? H.to(-q.nx, -q.nz) : {}; if (d.tub && inAt < 0) inAt = t; if (inAt >= 0 && !d.mud && cleanAt < 0) cleanAt = t; if (inAt >= 0 && !d.tub && outAt < 0) outAt = t; return outAt >= 0 && t > outAt + 1.2; });
    const side = (d.x - q.u.x) * q.nx + (d.z - q.u.z) * q.nz;
    Object.assign(out, { inAt: H.r(inAt), sat: H.r(outAt - inAt), clean: H.r(cleanAt - inAt), mud: d.mud, slop: H.r(w0 - W.w), side: H.r(side), tubs: DIRT.tubs, shakes: DIRT.shakes - sh0, muck: H.r(W.muck || 0) });
    // a clean dog jumps in on purpose
    H.place(d, q.u.x + q.nx * 2.4, q.u.z + q.nz * 2.4); d.mud = 0; d.wet = 0; d.tubCd = 0; let jin = false;
    H.run(2, t => { H.p().bot = H.to(-q.nx, -q.nz, { jump: t > 0.1 && t < 0.15 }); if (d.tub) jin = true; return jin; }); H.p().bot = {};
    out.jump = jin; H.run(3);
    return out;
  });
  ok(`a muddy dog hopping a water trough lands in it (${r.inAt} s), scrubbed clean in ${r.clean} s`, r.inAt > 0 && r.tubs >= 1 && r.mud === 0 && r.clean > 0 && r.clean < 1.5, r);
  ok(`it sits a moment (${r.sat} s), hops out the pen side (${r.side} m), shakes`, r.sat > 1 && r.sat < 2 && r.side > 1 && r.shakes === 1, r);
  ok(`water slopped out (${r.slop}), the trough mucky (${r.muck})`, r.slop > 1 && r.slop < 2 && r.muck > 0.5, r);
  ok('a clean dog jumping at it: in it goes too', r.jump, r);
}

if (want('clonk')) {
  const r = await h.page.evaluate(() => {
    const { DIRT } = GAME;
    H.reset(); const d = H.d(), q = H.trough(), W = q.p.water; W.w = 0;
    H.place(d, q.u.x + q.nx * 2.2, q.u.z + q.nz * 2.2); d.mud = 0.9; const c0 = DIRT.clonks; let dry = false;
    H.run(4, t => { H.p().bot = H.to(-q.nx, -q.nz); if (d.tubT < 0) dry = true; return dry && !d.tub && t > 2; });
    return { clonks: DIRT.clonks - c0, dry, mud: H.r(d.mud) };
  });
  ok(`an empty one: CLONK, still muddy (${r.mud})`, r.clonks === 1 && r.dry && r.mud === 0.9, r);
}

if (want('hop')) {
  const r = await h.page.evaluate(() => {
    const { DIRT } = GAME;
    H.reset(); const d = H.d(), q = H.trough(), W = q.p.water; W.w = W.cap;
    H.place(d, q.u.x + q.nx * 2.2, q.u.z + q.nz * 2.2); d.mud = 0; const t0 = DIRT.tubs; let hopped = false;
    H.run(2, () => { H.p().bot = H.to(-q.nx, -q.nz); if (d.hopT > 0) hopped = true; });
    return { tubs: DIRT.tubs - t0, hopped, w: H.r(W.cap - W.w) };
  });
  ok('a clean dog walking into a water trough just hops it', r.hopped && r.tubs === 0 && r.w === 0, r);
}

if (want('carry')) {
  const r = await h.page.evaluate(() => {
    const { G } = GAME;
    H.reset(); const d = H.d(), s = G.sheep.find(s => !s.ram && !s.lamb), P = GAME.pathPoint(330, 6);
    H.place(d, P.x, P.z); d.yaw = 0; H.place(s, P.x, P.z + 1.2); s.mud = 0; d.mud = 1;
    H.run(1, () => { H.p().bot = { grab: true }; }); const held = d.holding === s;
    H.run(0.5, () => { H.p().bot = { grab: true }; }); H.p().bot = {}; H.run(0.2);
    return { held, mud: H.r(s.mud || 0) };
  });
  ok(`a sheep in muddy jaws gets muddy (${r.mud})`, r.held && r.mud > 0.4, r);
}

if (want('reset')) {
  const r = await h.page.evaluate(() => {
    const d = H.d(); d.mud = 1; d.wet = 1; H.trough().p.water.muck = 1; GAME.resetGame();
    return { mud: d.mud, wet: d.wet, muck: H.trough().p.water.muck, prints: GAME.PAWS.list.filter(q => q.t >= 0).length };
  });
  ok('a new journey: clean dogs, clear water, no prints', r.mud === 0 && r.wet === 0 && r.muck === 0 && r.prints === 0, r);
}

ok('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
await h.close();
console.log(fails ? `${fails} failed` : 'all ok');
process.exit(fails ? 1 : 0);
