// Flocking structure test: `node tools/cluster-sim.mjs [structure|merge|corner|cost ...] [--trials N]` (all by default).
//  structure  20 sheep left to graze lush valley grass: how they break into knots (single-link clusters at 3.5 m),
//             knot sizes, the share of sheep alone, grazing spacing, the gap between knots, and how fast calm sheep
//             move in each state (walking to grass, rejoining, moving on, meandering).
//  merge      a big group of 10, a lone sheep 25 m off and a knot of 3 30 m off the other way, all fed: how long until
//             the loner and the knot drift over to the big group ("sheep gravity").
//  corner     a sheep in a tight spot with the flock on the far side of something: a rock/wall corner, the river bank
//             (flock across the water), the back of an open pen (flock outside the back fence). How long it stalls,
//             how long until it's out in open space, and until it's with the flock.
//  lost       a big group of 10, one hungry sheep 70 m off (past sheep gravity) on good grass: its peak anxiety, when it heads back, when it's with them.
//  shove      14 grazers on half-cropped ground, half starving and half fed: grass shoves, and who ends up on the better grass.
//  cost       60 sheep grazing: milliseconds per physics step (one step per frame at 60 fps).
import { open } from './harness.mjs';
const args = process.argv.slice(2);
const ti = args.indexOf('--trials'), trials = ti >= 0 ? +args[ti + 1] : 2;
let names = args.filter((a, i) => !a.startsWith('--') && (ti < 0 || i !== ti + 1));
if (!names.length) names = ['structure', 'merge', 'lost', 'shove', 'corner', 'cost'];
const h = await open({ query: '?sim&debug' });
await h.page.evaluate(() => {
  const { G, T, step, pathPoint, sdfAt, grassAt, pens, RIVER } = GAME;
  const r2 = v => Math.round(v * 100) / 100;
  const free = () => G.sheep.filter(s => !s.dead && !s.grabbed && !s.air && !s.heldBy && !s.pen);
  function reset(hour = 9, n = 14) {
    if (!G.players.length) GAME.startGame({ kind: 'bot', index: 0 });
    GAME.resetGame(); G.players[0].bot = {}; G.clock.hour = hour;
    for (const c of G.coyotes) c.gone = true;
    while (G.sheep.length < n) G.sheep.push(GAME.makeSheep(0, 0, { hunger: 0.3 }));
    while (G.sheep.length > n) G.sheep.pop();
    const d = G.dogs[0]; d.x = 1e4; d.z = 1e4;   // out of the way (no pressure)
    return G.sheep;
  }
  const tick = () => step(0.025);
  function place(list, cx, cz, r) { for (const s of list) { for (let k = 0; k < 60; k++) { const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * r; s.x = cx + Math.cos(a) * rr; s.z = cz + Math.sin(a) * rr; if (sdfAt(s.x, s.z) > 1.5 && !GAME.penAt(s.x, s.z)) break; } s.vx = s.vz = 0; s.state = 'idle'; s.mother = s.lamb ? s.mother : null; } }
  // single-link clusters at link metres
  function knots(list, link) {
    const n = list.length, par = list.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.hypot(list[i].x - list[j].x, list[i].z - list[j].z) < link) par[f(i)] = f(j);
    const m = new Map(); list.forEach((s, i) => { const r = f(i); if (!m.has(r)) m.set(r, []); m.get(r).push(s); });
    return [...m.values()];
  }
  const cen = l => { let x = 0, z = 0; for (const s of l) { x += s.x; z += s.z; } return { x: x / l.length, z: z / l.length }; };
  const SCN = {};
  SCN.structure = () => {
    const sh = reset(9, 20), p = pathPoint(330, -8); place(sh, p.x, p.z, 7);
    for (const s of sh) s.hunger = s.lamb ? 0.3 : 0.45 + Math.random() * 0.15;
    let t = 0; const nk = [], sizes = [], alone = [], nn = [], gaps = [], spd = {};
    while (t < 60) {
      tick(); t += 0.025;
      for (const s of free()) { const v = Math.hypot(s.vx, s.vz), k = s.state === 'graze' ? (v > 0.9 ? 'graze(moving on)' : 'graze') : s.state; if (v > 0.05 && k !== 'graze') { (spd[k] = spd[k] || [0, 0])[0] += v; spd[k][1]++; } }
      if (t > 15 && Math.abs(t % 1) < 0.0125) {
        const L = free(), K = knots(L, 3.5);
        nk.push(K.length); for (const k of K) sizes.push(k.length); alone.push(K.filter(k => k.length === 1).length / L.length);
        for (const a of L.filter(s => s.state === 'graze')) { let m = 1e9; for (const b of L) if (b !== a) m = Math.min(m, Math.hypot(a.x - b.x, a.z - b.z)); nn.push(m); }
        const cs = K.filter(k => k.length > 1).map(cen);
        for (let i = 0; i < cs.length; i++) { let m = 1e9; for (let j = 0; j < cs.length; j++) if (i !== j) m = Math.min(m, Math.hypot(cs[i].x - cs[j].x, cs[i].z - cs[j].z)); if (m < 1e9) gaps.push(m); }
      }
    }
    const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? r2(b[b.length >> 1]) : null; };
    const hist = { '1': 0, '2': 0, '3-6': 0, '7-10': 0, '11+': 0 }; for (const k of sizes) hist[k === 1 ? '1' : k === 2 ? '2' : k <= 6 ? '3-6' : k <= 10 ? '7-10' : '11+'] += k;   // sheep-weighted
    const tot = sizes.reduce((a, b) => a + b, 0); for (const k in hist) hist[k] = r2(hist[k] / tot);
    const speeds = {}; for (const k in spd) speeds[k] = r2(spd[k][0] / spd[k][1]);
    return { knots: r2(nk.reduce((a, b) => a + b, 0) / nk.length), meanKnot: r2(tot / sizes.length), sheepInKnotsOfSize: hist, alone: r2(alone.reduce((a, b) => a + b, 0) / alone.length),
      grazerNN: med(nn), touching: r2(nn.filter(d => d < 1.2).length / Math.max(1, nn.length)), knotGap: med(gaps), calmSpeeds: speeds };
  };
  SCN.merge = () => {
    const sh = reset(10, 14), p = pathPoint(330, -8), q = pathPoint(330, 17), w = pathPoint(330, -30);
    const big = sh.slice(0, 10), lone = sh[10], three = sh.slice(11, 14);
    place(big, p.x, p.z, 4); place([lone], q.x, q.z, 1); place(three, w.x, w.z, 2);
    for (const s of sh) { s.hunger = 0.15; s.mother = null; }
    let t = 0, loneT = -1, threeT = -1, oneT = -1;
    const near = (a, list) => list.some(b => Math.hypot(a.x - b.x, a.z - b.z) < 8);
    while (t < 60) {
      tick(); t += 0.025;
      if (loneT < 0 && near(lone, big)) loneT = t;
      if (threeT < 0 && three.every(s => near(s, big))) threeT = t;
      if (oneT < 0 && knots(free(), 8).length === 1) oneT = t;
    }
    return { loneJoinedAt: r2(loneT), knotOf3JoinedAt: r2(threeT), allOneGroupAt: r2(oneT), loneStartGap: r2(Math.hypot(q.x - p.x, q.z - p.z)) };
  };
  SCN.lost = () => {
    const sh = reset(10, 11), p = pathPoint(330, -8), q = pathPoint(330, 62);
    const big = sh.slice(0, 10), lone = sh[10];
    place(big, p.x, p.z, 4); place([lone], q.x, q.z, 1);
    for (const s of sh) { s.hunger = 0.15; s.mother = null; } lone.hunger = 0.6;
    let t = 0, goT = -1, joinT = -1, peak = 0;
    const d0 = Math.hypot(lone.x - p.x, lone.z - p.z);
    while (t < 60 && joinT < 0) {
      tick(); t += 0.025; peak = Math.max(peak, lone.anx || 0);
      if (goT < 0 && Math.hypot(lone.x - p.x, lone.z - p.z) < d0 - 8) goT = t;
      if (big.some(b => Math.hypot(lone.x - b.x, lone.z - b.z) < 6)) joinT = t;
    }
    return { startGap: r2(d0), peakAnx: r2(peak), headedBackAt: r2(goT), withFlockAt: r2(joinT), stressAfter: r2(lone.stress) };
  };
  SCN.shove = () => {
    const sh = reset(10, 14), p = pathPoint(330, -8);
    place(sh, p.x, p.z, 5); sh.forEach((s, i) => { s.mother = null; s.hunger = i % 2 ? 0.85 : 0.15; });
    const GR = GAME.grass;   // patchy: about half the 2 m cells round them cropped bare
    for (let b = 0; b < GR.VZ; b++) for (let a = 0; a < GR.VX; a++) { const x = GR.GMINX + a * GR.VS, z = GR.GMINZ + b * GR.VS; if (Math.hypot(x - p.x, z - p.z) < 14 && Math.random() < 0.55) GR.gAmt[b * GR.VX + a] = 0.03; }
    const n0 = G.grassShoves || 0, hungry = sh.filter(s => s.hunger > 0.5), fed = sh.filter(s => s.hunger < 0.5);
    let gH = 0, gF = 0, k = 0;
    for (let t = 0; t < 30; t += 0.025) { tick(); if (t > 5 && Math.round(t * 40) % 40 === 0) { k++; gH += hungry.reduce((a, s) => a + grassAt(s.x, s.z), 0) / hungry.length; gF += fed.reduce((a, s) => a + grassAt(s.x, s.z), 0) / fed.length; } }
    return { shoves: (G.grassShoves || 0) - n0, grassUnderHungry: r2(gH / k), grassUnderFed: r2(gF / k) };
  };
  // the most enclosed walkable spot near (cx, cz): blocked in the most directions 1.6 m out
  function findCorner(cx, cz, R) {
    let best = null, bb = -1;
    for (let x = cx - R; x <= cx + R; x += 0.5) for (let z = cz - R; z <= cz + R; z += 0.5) {
      const sd = sdfAt(x, z); if (sd < 0.8 || sd > 1.3 || GAME.penAt(x, z)) continue;
      let b = 0, bx = 0, bz = 0; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283, ux = Math.cos(a), uz = Math.sin(a); if (sdfAt(x + ux * 1.8, z + uz * 1.8) < 0.4) { b++; bx += ux; bz += uz; } }
      if (b > bb) { bb = b; best = { x, z, blocked: b, bx, bz }; }
    }
    return best;
  }
  function stuckRun(s, flock, isOut, dur = 30) {
    const x0 = s.x, z0 = s.z; let t = 0, movedT = -1, outT = -1, joinedT = -1, maxStall = 0, stall = 0, px = s.x, pz = s.z;
    while (t < dur) {
      tick(); t += 0.025;
      if (Math.abs(t % 0.25) < 0.0125) { const v = Math.hypot(s.x - px, s.z - pz) / 0.25, going = !['graze', 'idle', 'sleep'].includes(s.state); px = s.x; pz = s.z; stall = v < 0.3 && going ? stall + 0.25 : 0; maxStall = Math.max(maxStall, stall); }   // stalled: trying to go somewhere, getting nowhere
      if (movedT < 0 && Math.hypot(s.x - x0, s.z - z0) > 1.5) movedT = t;
      if (outT < 0 && isOut(s, x0, z0)) outT = t;
      if (joinedT < 0 && flock.some(b => b.pen === s.pen && Math.hypot(b.x - s.x, b.z - s.z) < 6)) joinedT = t;
    }
    return { movedAt: r2(movedT), longestStall: r2(maxStall), outAt: r2(outT), withFlockAt: r2(joinedT) };
  }
  SCN.corner = () => {
    const out = {};
    // a) rock / wall corner: the most enclosed spot along a stretch of the valley, with the flock on its far side
    {
      // the tightest nook between a rock and the valley wall (or another rock) on this stretch
      const sh = reset(10, 14); let c = null;
      for (const o of GAME.OBSTACLES) {
        if (o.r < 0.8 || o.r > 3 || GAME.sAt(o.x, o.z) < 200 || GAME.sAt(o.x, o.z) > 420) continue;
        const k = findCorner(o.x, o.z, o.r + 2); if (k && (!c || k.blocked > c.blocked)) c = k;
      }
      const s = sh[0]; s.mother = null; s.lamb = false; s.hunger = 0.05; s.x = c.x; s.z = c.z;
      // the flock: the nearest open spot it can't see from the corner but can walk to (round what boxes it in)
      let tx = 0, tz = 0, bd = 1e9;
      for (let k = 0; k < 24; k++) for (const r of [14, 17, 20, 24]) {
        const a = k / 24 * 6.283, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
        if (sdfAt(x, z) < 2.5 || GAME.navLOS(c.x, c.z, x, z)) continue;
        const path = GAME.findPath(c.x, c.z, x, z), end = path[path.length - 1];
        if (!end || Math.hypot(end.x - x, end.z - z) > 1.5) continue;
        if (r < bd) { bd = r; tx = x; tz = z; }
      }
      const flock = sh.slice(1); place(flock, tx, tz, 2.5); for (const o of flock) o.hunger = 0.05;
      out.rockWall = { blockedDirs: c.blocked, flockAt: r2(bd), ...stuckRun(s, flock, (s, x0, z0) => sdfAt(s.x, s.z) > 2.5 && Math.hypot(s.x - x0, s.z - z0) > 4) };
    }
    // b) the river bank, 25 m upstream of the bridge, with the flock straight across the water
    {
      const sh = reset(10, 14), s = sh[0]; s.mother = null; s.lamb = false; s.hunger = 0.05;
      const at = (across, along) => ({ x: RIVER.x + RIVER.tx * across + RIVER.nx * along, z: RIVER.z + RIVER.tz * across + RIVER.nz * along });
      let a = -(RIVER.hw + 1.2), p = at(a, -25); while (sdfAt(p.x, p.z) < 0.8 && a > -RIVER.hw - 12) { a -= 0.5; p = at(a, -25); }
      s.x = p.x; s.z = p.z;
      let b = RIVER.hw + 4, q = at(b, -25); while (sdfAt(q.x, q.z) < 2 && b < RIVER.hw + 20) { b += 1; q = at(b, -25); }
      const flock = sh.slice(1); place(flock, q.x, q.z, 3); for (const o of flock) o.hunger = 0.05;
      out.riverBank = stuckRun(s, flock, (s, x0, z0) => Math.hypot(s.x - x0, s.z - z0) > 4 && sdfAt(s.x, s.z) > 2.5, 40);
    }
    // c) the back of an open pen, the flock just outside the back fence
    {
      const sh = reset(10, 14), pen = pens[1]; GAME.setGate(pen, true);
      const gx = Math.cos(pen.camp.gateA), gz = Math.sin(pen.camp.gateA), s = sh[0]; s.mother = null; s.lamb = false; s.hunger = 0.05;
      s.x = pen.x - gx * (pen.R - 1); s.z = pen.z - gz * (pen.R - 1);
      const flock = sh.slice(1); let fx = pen.x - gx * (pen.R + 8), fz = pen.z - gz * (pen.R + 8);
      for (let k = 0; k < 20 && sdfAt(fx, fz) < 2; k++) { fx += gz * 2; fz -= gx * 2; }
      place(flock, fx, fz, 3); for (const o of flock) o.hunger = 0.05;
      out.penBack = { flockReachable: sdfAt(fx, fz) > 1.5, ...stuckRun(s, flock, (s, x0, z0) => !s.pen, 40) };
      GAME.setGate(pen, false);
    }
    return out;
  };
  SCN.cost = () => {
    const sh = reset(9, 60), p = pathPoint(330, -8); place(sh, p.x, p.z, 14);
    for (const s of sh) s.hunger = 0.3 + Math.random() * 0.4;
    for (let i = 0; i < 80; i++) tick();
    const M = GAME.MIND, p0 = M.pathN || 0, u0 = M.unstickN || 0;
    const ms = []; for (let i = 0; i < 600; i++) { const t0 = performance.now(); tick(); ms.push(performance.now() - t0); }
    const aStar = (M.pathN || 0) - p0, unsticks = (M.unstickN || 0) - u0;
    ms.sort((a, b) => a - b);
    return { sheep: G.sheep.length, aStarPer100Steps: r2(aStar / 6), unsticks, msPerStepMean: r2(ms.reduce((a, b) => a + b, 0) / ms.length), p95: r2(ms[Math.floor(ms.length * 0.95)]), max: r2(ms[ms.length - 1]) };
  };
  window.SCN2 = SCN;
});
let fails = 0; const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) fails++; };
const avg = a => a.reduce((x, y) => x + y, 0) / a.length, j = a => a.join(', ');
// checks, over the trials
const CHECK = {
  structure: R => {
    const nn = R.map(r => r.grazerNN).filter(v => v != null);   // (null: nobody grazing when it looked)
    ok(`grazing, they break into knots, neither one ball nor scattered (knots ${j(R.map(r => r.knots))}, alone ${j(R.map(r => r.alone))})`, avg(R.map(r => r.knots)) >= 2.5 && R.every(r => r.knots <= 14 && r.alone <= 0.45));
    ok(`grazers keep a little apart (nearest ${j(R.map(r => r.grazerNN))} m, touching ${j(R.map(r => r.touching))})`, nn.length && nn.every(v => v > 1.3 && v < 3.2) && R.every(r => r.touching <= 0.25));
  },
  merge: R => ok(`sheep gravity: a loner 25 m off joins (${j(R.map(r => r.loneJoinedAt))} s), a knot of 3 too (${j(R.map(r => r.knotOf3JoinedAt))} s)`, R.every(r => r.loneJoinedAt > 0 && r.loneJoinedAt < 10 && r.knotOf3JoinedAt > 0 && r.knotOf3JoinedAt < 20 && r.allOneGroupAt > 0 && r.allOneGroupAt < 20)),
  lost: R => ok(`lost 70 m off: anxious, heads back (${j(R.map(r => r.headedBackAt))} s), with the flock (${j(R.map(r => r.withFlockAt))} s)`, R.every(r => r.peakAnx > 0.5 && r.headedBackAt > 0 && r.headedBackAt < 12 && r.withFlockAt > 0 && r.withFlockAt < 40)),
  shove: R => ok(`the hungry get the better grass (${avg(R.map(r => r.grassUnderHungry)).toFixed(2)} under them, ${avg(R.map(r => r.grassUnderFed)).toFixed(2)} under the fed; ${R.reduce((a, r) => a + r.shoves, 0)} shoves)`, avg(R.map(r => r.grassUnderHungry)) >= avg(R.map(r => r.grassUnderFed)) - 0.03),
  corner: R => {
    ok(`a rock corner: out (${j(R.map(r => r.rockWall.outAt))} s), no long stall (${j(R.map(r => r.rockWall.longestStall))} s)`, R.every(r => r.rockWall.outAt > 0 && r.rockWall.outAt < 6 && r.rockWall.longestStall <= 1.5));
    ok(`the river bank: off it (${j(R.map(r => r.riverBank.outAt))} s), never across to the flock`, R.every(r => r.riverBank.outAt > 0 && r.riverBank.outAt < 15 && r.riverBank.longestStall <= 1.5 && r.riverBank.withFlockAt < 0));
    ok(`the back of an open pen: out the gate (${j(R.map(r => r.penBack.outAt))} s), round to the flock (${j(R.map(r => r.penBack.withFlockAt))} s)`, R.every(r => r.penBack.flockReachable && r.penBack.outAt > 0 && r.penBack.outAt < 8 && r.penBack.withFlockAt > 0 && r.penBack.withFlockAt < 35 && r.penBack.longestStall <= 1.5));
  },
  cost: R => ok(`60 sheep: A* now and then, not every step (${R[0].aStarPer100Steps} per 100 steps)`, R[0].aStarPer100Steps <= 6),
};
for (const n of names) {
  console.log(`\n== ${n}`); const R = [];
  for (let i = 0; i < (n === 'cost' ? 1 : trials); i++) { R.push(await h.page.evaluate(n => window.SCN2[n](), n)); console.log(JSON.stringify(R.at(-1))); }
  CHECK[n]?.(R);
}
if (h.errors.length) console.log('PAGE ERRORS', h.errors.slice(0, 5));
ok('no page errors', !h.errors.length);
await h.close();
process.exit(fails ? 1 : 0);
