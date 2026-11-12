// Headless checks for open water and Hank's rescues: `node tools/swim-test.mjs [layout|dog|tire|drown|ko|asleep|alone|sheep|coyote|lake|sand]`.
//   layout  the sea and the lake are open to swimmers and waders (no wall at the water line); the river stays shut to sheep
//   dog     a dog runs off the beach into the sea and swims out (no invisible wall)
//   tire    swimming tires a dog slowly: a full one paddles over a minute; spent, it goes under (drowning, out)
//   drown   Hank: trunks on at the water's edge, swims out, tows it ashore, brings it round; dressed again after
//   ko      knocked out on land: stays down (a partner nosing it doesn't help) till Hank comes and brings it round
//   asleep  a dog down at night wakes Hank by the fire; he goes
//   alone   nobody comes (Hank far off, giveUp short): it comes round on its own
//   sheep   a sheep driven into the sea swims back ashore; one by the river is held off it
//   coyote  a coyote into the sea: swims out soggy, done for the night
//   lake    a dog walks from the Promised Land's grass into its lake
//   sand    the beach grows nothing; a calm sheep on it walks back onto the grass
import { open } from './harness.mjs';
const only = process.argv[2];
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${info === undefined ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const h = await open({ query: '?sim' });
await h.page.evaluate(() => {
  const { G, step, startGame } = GAME;
  startGame({ kind: 'bot', index: 0 });
  const H = window.H = {};
  H.p = () => G.players[0]; H.d = () => G.dogs[0];
  H.to = (dx, dz, extra = {}) => { const R = GAME.CAM_R, F = GAME.CAM_F, l = Math.hypot(dx, dz) || 1; return Object.assign({ mx: (dx * R.x + dz * R.z) / l, my: -(dx * F.x + dz * F.z) / l }, extra); };
  H.reset = (hour = 11) => {
    GAME.resetGame(); G.clock.hour = hour; for (const c of G.coyotes) c.gone = true; GAME.resetCougars();
    G.players.forEach(p => { p.bot = {}; });
    while (G.dogs.length > 1) GAME.dropPlayer(G.players[G.players.length - 1]);
  };
  H.place = (e, p) => { e.x = p.x; e.z = p.z; e.vx = e.vz = 0; e.y = GAME.groundY(p.x, p.z); };
  H.flockAt = p => { for (const s of G.sheep) { s.x = p.x + Math.random() * 6 - 3; s.z = p.z + Math.random() * 6 - 3; s.vx = s.vz = 0; s.air = null; } };
  H.hank = p => { const hk = GAME.HANK; hk.x = p.x; hk.z = p.z; hk.vx = hk.vz = 0; hk.goal = null; hk.asleep = false; };
  H.run = (sec, fn) => { let t = 0; for (; t < sec; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return t; };
  H.r = v => Math.round(v * 100) / 100;
  H.sea = lat => GAME.pathPoint(560, lat);   // Oceanside: the beach, then the sea from ~30 m east of the trail
});
const want = s => !only || only === s;

if (want('layout')) {
  const r = await h.page.evaluate(() => {
    const { sdfAt, swimSdfAt, wadeSdfAt, terrainH, pathPoint, RIVER, inRiver } = GAME, out = {};
    const sea = [40, 60, 90].map(l => H.sea(l));
    out.sea = sea.map(p => [H.r(terrainH(p.x, p.z)), H.r(sdfAt(p.x, p.z)), H.r(swimSdfAt(p.x, p.z)), H.r(wadeSdfAt(p.x, p.z))]);
    const rv = { x: RIVER.x + RIVER.nx * 0, z: RIVER.z + RIVER.nz * 0 };
    out.river = [H.r(swimSdfAt(rv.x, rv.z)), H.r(wadeSdfAt(rv.x, rv.z)), inRiver(rv.x, rv.z)];
    let lake = null; for (let lat = 30; lat < 90 && !lake; lat += 1) { const p = pathPoint(800, lat); if (terrainH(p.x, p.z) < -3.2) lake = p; }
    out.lake = lake && [H.r(sdfAt(lake.x, lake.z)), H.r(swimSdfAt(lake.x, lake.z)), H.r(wadeSdfAt(lake.x, lake.z))];
    return out;
  });
  ok('the sea: walls for walking (blk), open to swimmers and waders', r.sea.every(([y, s, sw, w]) => y < -3 && s < 0 && sw > 0 && w > 0), r.sea);
  ok('the river: open to dogs, shut to sheep', r.river[0] > 0 && r.river[1] < 0 && r.river[2], r.river);
  ok('the lake: open to swimmers and waders', r.lake && r.lake[1] > 0 && r.lake[2] > 0, r.lake);
}

if (want('dog')) {
  const r = await h.page.evaluate(() => {
    H.reset(); const d = H.d(), a = H.sea(12), b = H.sea(70); H.place(d, a); H.flockAt(H.sea(-5)); H.hank(H.sea(-8));
    let swamAt = -1; const t = H.run(25, t => { H.p().bot = H.to(b.x - d.x, b.z - d.z); if (d.air && d.air.swim && swamAt < 0) swamAt = t; return Math.hypot(b.x - d.x, b.z - d.z) < 2; });
    return { swamAt: H.r(swamAt), t: H.r(t), out: H.r(Math.hypot(d.x - a.x, d.z - a.z)), swim: !!(d.air && d.air.swim), st: H.r(d.stamina) };
  });
  ok('a dog runs into the sea and swims out (no wall at the water line)', r.swamAt > 0 && r.out > 50 && r.swim, r);
}

if (want('tire')) {
  const r = await h.page.evaluate(() => {
    H.reset(); const d = H.d(), b = H.sea(60); H.place(d, b); H.flockAt(H.sea(-5)); H.hank(H.sea(-160));   // (Hank well away)
    GAME.HANK.x += 0; H.run(0.1);
    const sw = !!(d.air && d.air.swim); d.stamina = 1;
    const c = H.sea(70); let t1 = -1;
    const t = H.run(200, t => { H.p().bot = H.to(Math.cos(t * 0.5), Math.sin(t * 0.5)); if (t1 < 0 && d.stamina < 0.5) t1 = t; return d.ko; });
    return { sw, half: H.r(t1), out: H.r(t), ko: d.ko, drown: !!(d.air && d.air.drown), st: d.stamina };
  });
  ok('swimming tires slowly: half its wind after half a minute or more', r.sw && r.half > 30, r);
  ok('spent in the water: under it goes (out, drowning) after a minute or more', r.ko && r.drown && r.out > 60, r);
}

if (want('drown')) {
  const r = await h.page.evaluate(() => {
    const { G, HANK, overWater } = GAME;
    H.reset(); const d = H.d(); H.place(d, H.sea(45)); H.flockAt(H.sea(-5)); H.hank(H.sea(12)); H.run(0.1); d.stamina = 0.005;
    const seen = {}; let changeAt = -1, swamAt = -1, towAt = -1, ashoreAt = -1, cprAt = -1, upAt = -1, dressedAt = -1, cough = 0;
    const r0 = G.stats.rescued || 0;
    const t = H.run(90, t => {
      const j = HANK.rescue;
      if (d.ko && d.air && d.air.drown) seen.drown = true;
      if (changeAt < 0 && HANK.changeT > 0) changeAt = t;
      if (swamAt < 0 && HANK.swim) { swamAt = t; seen.trunks = HANK.trunks; }
      if (towAt < 0 && j && j.phase === 'tow') towAt = t;
      if (ashoreAt < 0 && towAt > 0 && !d.air) { ashoreAt = t; seen.dry = !overWater(d.x, d.z); }
      if (cprAt < 0 && HANK.cpr) cprAt = t;
      if (upAt < 0 && seen.drown && !d.ko) { upAt = t; seen.hankD = H.r(Math.hypot(HANK.x - d.x, HANK.z - d.z)); }
      if (upAt > 0 && !HANK.trunks && dressedAt < 0) dressedAt = t;
      return dressedAt > 0;
    });
    return { seen, changeAt: H.r(changeAt), swamAt: H.r(swamAt), towAt: H.r(towAt), ashoreAt: H.r(ashoreAt), cprAt: H.r(cprAt), upAt: H.r(upAt), dressedAt: H.r(dressedAt), rescued: (G.stats.rescued || 0) - r0, hp: H.r(d.hp), st: H.r(d.stamina), canSteer: !d.ko && !d.air };
  });
  ok('drowning: Hank changes at the water\'s edge, then swims out', r.seen.drown && r.changeAt > 0 && r.swamAt > r.changeAt && r.seen.trunks, r);
  ok('...tows it ashore (dry land) and brings it round there', r.towAt > r.swamAt && r.ashoreAt > r.towAt && r.seen.dry && r.cprAt >= r.ashoreAt && r.upAt > r.cprAt && r.seen.hankD < 2.5 && r.rescued === 1, r);
  ok('...up with some wind and health; Hank dressed again', r.canSteer && r.st >= 0.5 && r.hp >= 0.25 && r.dressedAt > r.upAt, r);
}

if (want('ko')) {
  const r = await h.page.evaluate(() => {
    const { G, HANK, hurtDog, joinPlayer, T } = GAME;
    H.reset(); joinPlayer({ kind: 'bot', index: 1 }); const d = H.d(), d2 = G.dogs[1]; G.players[1].bot = {};
    const p = GAME.pathPoint(300, 0); H.place(d, p); H.place(d2, { x: p.x + 1.2, z: p.z }); H.flockAt(GAME.pathPoint(300, -10)); H.hank(GAME.pathPoint(240, 0));
    hurtDog(d, 1); const ko = d.ko;
    const r0 = G.stats.rescued || 0, run = T.rescue.run; T.rescue.run = 0;   // (Hank held up a while)
    H.run(T.dogHp.koT + 3, () => { d2.x = d.x + 1.1; d2.z = d.z; return false; });   // a partner right by it all along
    const stillDown = d.ko; T.rescue.run = run;
    let hd = 99; const t = H.run(60, () => { if (d.ko) hd = Math.hypot(HANK.x - d.x, HANK.z - d.z); return !d.ko; });
    const r = { ko, stillDown, t: H.r(t), up: !d.ko, hankD: H.r(hd), byHank: (G.stats.rescued || 0) === r0 + 1, hp: H.r(d.hp), dressed: !HANK.trunks };
    while (G.dogs.length > 1) GAME.dropPlayer(G.players[G.players.length - 1]);
    return r;
  });
  ok('knocked out: still down long after the stars (a partner nosing it doesn\'t help)', r.ko && r.stillDown, r);
  ok('...till Hank comes and brings it round (no trunks on dry land)', r.up && r.byHank && r.hankD < 2.5 && r.hp >= 0.25 && r.dressed, r);
}

if (want('asleep')) {
  const r = await h.page.evaluate(() => {
    const { G, HANK, hurtDog, pens } = GAME;
    H.reset(22); const p = pens[1], d = H.d();
    for (const s of G.sheep) { s.x = p.x + Math.random() * 4 - 2; s.z = p.z + Math.random() * 4 - 2; }
    GAME.setGate(p, false); H.place(d, { x: p.exitX + 18, z: p.exitZ + 6 });
    HANK.goal = null; HANK.upT = -99; GAME.step(0.025); const g = HANK.goal; HANK.x = g.x; HANK.z = g.z;   // (by the fire)
    H.run(90, () => { G.clock.hour = 22; return HANK.asleep; });
    const slept = HANK.asleep;
    hurtDog(d, 1);
    const t = H.run(60, () => !d.ko);
    return { slept, up: !d.ko, t: H.r(t), awake: !HANK.asleep };
  });
  ok('a dog down at night wakes Hank; he goes and brings it round', r.slept && r.up && r.t < 40, r);
}

if (want('alone')) {
  const r = await h.page.evaluate(() => {
    const { G, HANK, T } = GAME;
    H.reset(); const d = H.d(); H.place(d, H.sea(60)); H.flockAt(H.sea(-5)); H.run(0.1);
    const g = T.rescue.giveUp; T.rescue.giveUp = 4;
    const run = T.rescue.run; T.rescue.run = 0; d.stamina = 0.005;   // (Hank held up)
    H.run(2, () => d.ko); const ko = d.ko;
    const t = H.run(12, () => !d.ko); T.rescue.giveUp = g; T.rescue.run = run;
    return { ko, up: !d.ko, t: H.r(t), dry: !d.air };
  });
  ok('nobody comes in time: it comes round on its own, ashore', r.ko && r.up && r.dry && r.t > 3, r);
}

if (want('sheep')) {
  const r = await h.page.evaluate(() => {
    const { G, launchSheep, overWater, RIVER, wadeSdfAt } = GAME;
    H.reset(); const d = H.d(); H.flockAt(H.sea(-5)); H.hank(H.sea(-8));
    const s = G.sheep[0]; H.place(s, H.sea(28)); H.place(d, H.sea(18));
    const sea = H.sea(80); let swam = false, far = 0;
    let t = H.run(12, () => { H.p().bot = H.to(s.x - d.x + (sea.x - s.x) * 0.05, s.z - d.z + (sea.z - s.z) * 0.05, { sprint: true }); if (s.air && s.air.kind === 'swim') swam = true; far = Math.max(far, Math.hypot(s.x - H.sea(28).x, s.z - H.sea(28).z)); return swam; });
    H.p().bot = {}; H.place(d, H.sea(-10));
    const back = H.run(60, () => !s.air && !overWater(s.x, s.z));
    // the river: a sheep pressed at it is held off
    const q = { x: RIVER.x - RIVER.tx * (RIVER.hw + 3), z: RIVER.z - RIVER.tz * (RIVER.hw + 3) }, s2 = G.sheep[1]; H.place(s2, q); H.place(d, { x: q.x - RIVER.tx * 4, z: q.z - RIVER.tz * 4 });
    let inR = false; H.run(6, () => { H.p().bot = H.to(RIVER.tx, RIVER.tz, { sprint: true }); if (s2.air || wadeSdfAt(s2.x, s2.z) < -0.5) inR = true; return false; });
    return { swam, t: H.r(t), back: H.r(back), out: !s.air && !overWater(s.x, s.z), alive: !s.dead, inR };
  });
  ok('a sheep driven into the sea swims, then back ashore', r.swam && r.out && r.alive, r);
  ok('a sheep driven at the river is held off it', !r.inR, r);
}

if (want('coyote')) {
  const r = await h.page.evaluate(() => {
    const { G, spawnPack, overWater } = GAME;
    H.reset(23); H.flockAt(H.sea(-5)); const pk = spawnPack(1, { howl: false }), c = pk.members[0];
    H.place(c, H.sea(26)); c.state = 'flee'; c.fx = H.sea(0).x; c.fz = H.sea(0).z; c.stateT = 0; c.fleeDur = 30;
    let swam = false; H.run(8, () => { c.state = 'flee'; c.stateT = 0; if (c.air && c.air.swim) swam = true; return swam; });
    H.run(30, () => !c.air);
    return { swam, out: !c.air && !overWater(c.x, c.z), state: c.state };
  });
  ok('a coyote driven into the sea swims out soggy and leaves', r.swam && r.out && r.state === 'leave', r);
}

if (want('lake')) {
  const r = await h.page.evaluate(() => {
    const { pathPoint, terrainH } = GAME;
    H.reset(); const d = H.d(); let lake = null; for (let lat = 30; lat < 90 && !lake; lat++) { const p = pathPoint(800, lat); if (terrainH(p.x, p.z) < -3.6) lake = p; }
    const a = pathPoint(800, 20); H.place(d, a); H.flockAt(pathPoint(800, -10)); H.hank(pathPoint(800, -14));
    const b = { x: lake.x + (lake.x - a.x) * 0.3, z: lake.z + (lake.z - a.z) * 0.3 };
    const t = H.run(20, () => { H.p().bot = H.to(b.x - d.x, b.z - d.z); return d.air && d.air.swim; });
    return { swim: !!(d.air && d.air.swim), t: H.r(t) };
  });
  ok('a dog walks from the Promised Land into its lake', r.swim, r);
}

if (want('sand')) {
  const r = await h.page.evaluate(() => {
    const { G, grassAt, terrainH, pathPoint } = GAME, gc = GAME.grass;
    const cap = (x, z) => { const i = Math.round((x - gc.GMINX) / gc.VS), j = Math.round((z - gc.GMINZ) / gc.VS); return gc.gCap[j * gc.VX + i]; };
    H.reset(); const out = {};
    out.beach = [10, 14, 18, 22].map(l => { const p = H.sea(l); return H.r(cap(p.x, p.z)); });
    out.grass = [-8, -4, 4, 6].map(l => { const p = H.sea(l); return H.r(cap(p.x, p.z)); });
    // calm, fed sheep standing on the beach: back onto the grass
    const d = H.d(); H.place(d, H.sea(-60)); H.hank(H.sea(-20));
    G.sheep.forEach((s, i) => { H.place(s, H.sea(13 + (i % 4))); s.z += (i >> 2) * 2; s.hunger = 0.3; s.stress = 0; s.fear = 0; s.state = 'idle'; s.thinkT = Math.random(); });
    H.run(30);
    const on = G.sheep.filter(s => !s.dead && cap(s.x, s.z) < 0.12).length;
    out.onSand = on; out.n = G.sheep.length;
    return out;
  });
  ok('the beach grows nothing; the grass ends where the sand starts', r.beach.every(c => c < 0.05) && r.grass.every(c => c > 0.3), r);
  ok('calm sheep on the beach walk back onto the grass', r.onSand <= 1, r);
}

console.log(fails ? `${fails} failed` : 'all ok', h.errors.slice(0, 5));
await h.close();
process.exit(fails ? 1 : 0);
