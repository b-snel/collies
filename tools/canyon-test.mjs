// Headless test: `node tools/canyon-test.mjs [layout|eat|bark|shy|dog|limits]`. FALCON CANYON.
//   layout  the gorge between the Promised Land and the snakes: narrow, tall far wall, pillars with falcons, watchers,
//           bones; nothing else put in it; a way through; the same every load
//   eat     a falcon swoops off its pillar on a sheep in the gorge, takes it up and eats it: body at the pillar's foot
//   bark    a bark under one carrying a sheep: dropped, lands alive
//   shy     a bark near perched ones keeps them there a while
//   dog     one takes a dog: carried, dropped, lands
//   limits  never more than maxAir out at once; none at night; none on a flock outside the gorge; a new journey: all back
import { open } from './harness.mjs';
const only = process.argv[2];
const h = await open();
let fail = 0;
const ok = (name, cond, info) => { if (!cond) fail++; console.log(cond ? 'ok  ' : 'FAIL', name, cond ? '' : JSON.stringify(info)); };
// a fresh journey with the flock (and dog) dropped at s along the trail, canyon falcons on, by day
const setup = (s, o = {}) => h.page.evaluate(([s, o]) => {
  const { G, T, startGame, resetGame, pathPoint, living } = GAME;
  if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); else resetGame();
  G.players[0].bot = {}; T.canyon.on = o.on ?? true; T.canyon.dogChance = o.dogChance ?? 0.2; T.falcon.on = false;
  const p = pathPoint(s, 0), L = living();
  L.forEach(sh => { sh.x = p.x + (Math.random() - 0.5) * 8; sh.z = p.z + (Math.random() - 0.5) * 8; sh.vx = sh.vz = 0; sh.pen = null; sh.hunger = 0.3; });
  const d = G.dogs[0], q = pathPoint(o.dogS ?? s, o.dogLat ?? 0); d.x = q.x; d.z = q.z; G.clock.hour = o.hour ?? 10; G.clock.day = 2;
  return L.length;
}, [s, o]);

if (!only || only === 'layout') {
  const r = await h.page.evaluate(() => {
    const { T, CANYON, FALCONS, SNAKES, DENS, NESTS, PLANTS, SALT_ROCKS, BRAMBLES, CAMPS, sAt, sdfAt, terrainH, pathPoint, findPath, canyonK } = GAME;
    const K = T.canyon, mid = (K.s0 + K.s1) / 2;
    let free = 0; for (let l = -40; l <= 40; l += 0.5) { const p = pathPoint(mid, l); if (sdfAt(p.x, p.z) > 0) free += 0.5; }
    const wall = Math.max(...[10, 14, 18].map(o => { const p = pathPoint(mid, -(K.hwW + o)); return terrainH(p.x, p.z); }));
    const inG = list => list.filter(o => canyonK(sAt(o.x, o.z)) > 0.3).length;
    const a = pathPoint(K.s0 - 20, 0), b = pathPoint(K.s1 + 20, 0), path = findPath(a.x, a.z, b.x, b.z, 60000);
    const birds = FALCONS.filter(F => F.home);
    return { s0: K.s0, s1: K.s1, promised: CAMPS[3].s, snakes: Math.min(...SNAKES.map(n => sAt(n.x, n.z))), free, wall: +wall.toFixed(1),
      roosts: CANYON.roosts.length, birds: birds.length, perched: birds.every(F => F.state === 'perch'), up: Math.min(...CANYON.roosts.map(R => R.top - R.y)),
      watchers: CANYON.perched.list.length, bones: CANYON.bones, feet: Math.min(...CANYON.perches.map(P => sdfAt(P.x + Math.cos(P.ta) * 2.6, P.z + Math.sin(P.ta) * 2.6))),
      inGorge: { dens: inG(DENS), nests: inG(NESTS), plants: inG(PLANTS), salt: inG(SALT_ROCKS), brambles: inG(BRAMBLES) }, path: !!(path && path.length), x0: CANYON.roosts[0].x };
  });
  ok(`the gorge (s ${r.s0}–${r.s1}) is past the Promised Land (${r.promised}) and before the snakes (first at ${Math.round(r.snakes)})`, r.s0 > r.promised + 30 && r.snakes > r.s1, r);
  ok(`narrow (${r.free} m of floor), a tall far wall (${r.wall} m)`, r.free < 26 && r.free > 12 && r.wall > 15, r);
  ok(`${r.birds} falcons on ${r.roosts} pillars (≥ ${r.up.toFixed(1)} m up), ${r.watchers} more on the cliffs, ${r.bones} bones and feathers`, r.birds >= 14 && r.roosts >= 10 && r.perched && r.up > 4.5 && r.watchers >= 16 && r.bones >= 100, r);
  ok('below every pillar: open ground (where a body falls)', r.feet > 0.3, r);
  ok('no dens, nests, plants, salt or brambles in it', Object.values(r.inGorge).every(n => n === 0), r.inGorge);
  ok('a way through for the flock', r.path, r);
  const x0 = await h.page.evaluate(async () => { location.reload(); return 0; }).catch(() => 0);
  await h.page.waitForFunction(() => window.GAME, null, { timeout: 60000 });
  const x1 = await h.page.evaluate(() => GAME.CANYON.roosts[0].x);
  ok('the same pillars every load', x1 === r.x0, [x1, r.x0]);
}

if (!only || only === 'eat') {
  await setup(910, { dogS: 860, dogLat: 0 });
  const r = await h.page.evaluate(() => {
    const { G, T, step, FALCONS, CANYON, sdfAt } = GAME;
    let t = 0, swoop = null, nest = false, seen = false;
    while (t < 90 && !(G.stats.falcon > 0)) {
      step(0.025); t += 0.025; seen ||= CANYON.seen;
      for (const F of FALCONS) { if (!F.home) continue; if (F.state === 'circle' && !swoop) swoop = { t: +t.toFixed(1), i: F.i }; if (F.state === 'nest') nest = true; }
    }
    const g = G.graves.at(-1), P = g && CANYON.perches.reduce((b, P) => Math.hypot(P.x - g.x, P.z - g.z) < Math.hypot(b.x - g.x, b.z - g.z) ? P : b, CANYON.perches[0]);
    for (let i = 0; i < 400; i++) step(0.025);   // back home
    return { t: +t.toFixed(1), swoop, nest, seen, eaten: G.stats.falcon, why: (G.lost.at(-1) || {}).why, foot: g ? +Math.hypot(P.x - g.x, P.z - g.z).toFixed(1) : null, open: g ? +sdfAt(g.x, g.z).toFixed(2) : null,
      home: FALCONS.filter(F => F.home).every(F => F.state === 'perch' || F.state === 'circle' || F.state === 'dive' || F.state === 'carry' || F.state === 'nest' || F.state === 'home'), said: Object.keys(GAME.HANK.said).some(k => k.includes('Falcon country')) };
  });
  ok(`in the gorge a falcon swoops (after ${r.swoop && r.swoop.t}s) and takes one up to its pillar, eaten (${r.t}s)`, r.swoop && r.swoop.t < 15 && r.nest && r.eaten >= 1 && r.why === 'falcon', r);
  ok(`its body at the pillar's foot (${r.foot} m), on open ground`, r.foot !== null && r.foot < 4.5 && r.open > 0, r);
  ok('into the gorge: the banner, and a word from Hank', r.seen && r.said, r);
}

if (!only || only === 'bark') {
  await setup(910, { dogS: 860 });
  const r = await h.page.evaluate(() => {
    const { G, step, FALCONS } = GAME, d = G.dogs[0], P = G.players[0];
    let t = 0, F = null, prey = null, dropped = null, landed = null;
    while (t < 90) {
      F = F || FALCONS.find(f => f.home && f.state === 'carry' && f.prey);
      if (F && !prey) prey = F.prey;
      if (F && F.state === 'carry' && F.prey && F.t > 0.6) { d.x = F.x + 2; d.z = F.z; P.bot = { bark: true }; } else P.bot = {};
      step(0.025); t += 0.025;
      if (prey && !dropped && !prey.grabbed) dropped = +t.toFixed(1);
      if (dropped && !prey.air) { landed = { dead: !!prey.dead }; break; }
    }
    return { t: +t.toFixed(1), took: !!prey, dropped, landed, saved: G.stats.saved, eaten: G.stats.falcon };
  });
  ok(`a bark under one carrying a sheep: dropped (${r.dropped}s), lands alive, saved`, r.took && r.dropped && r.landed && !r.landed.dead && r.saved >= 1, r);
}

if (!only || only === 'shy') {
  await setup(905, { on: false });
  const r = await h.page.evaluate(() => {
    const { G, T, step, FALCONS, canyonBird, bark } = GAME, d = G.dogs[0], P = G.players[0];
    const near = FALCONS.filter(F => F.home && Math.hypot(F.x - d.x, F.z - d.z) < T.canyon.barkR);
    const before = canyonBird(d);
    P.bot = { bark: true }; step(0.025); P.bot = {}; step(0.025);
    const shy = near.every(F => F.rest > G.time + T.canyon.shy - 1), after = canyonBird(d);
    return { near: near.length, shy, before: before && before.i, after: after && after.i, nearIds: near.map(F => F.i) };
  });
  ok(`a bark near ${r.near} perched falcons: they stay put a while (the next swoop comes from further off)`, r.near > 0 && r.shy && r.before !== null && !r.nearIds.includes(r.after), r);
}

if (!only || only === 'dog') {
  await setup(860, { dogS: 905, dogChance: 1 });
  const r = await h.page.evaluate(() => {
    const { G, step, FALCONS } = GAME, d = G.dogs[0], x0 = d.x, z0 = d.z;
    let t = 0, took = false, landed = null;
    while (t < 60) { step(0.025); t += 0.025; if (FALCONS.some(F => F.home && F.dog === d)) took = true; if (took && !d.air) { landed = +Math.hypot(d.x - x0, d.z - z0).toFixed(1); break; } }
    return { t: +t.toFixed(1), took, landed, hp: d.hp };
  });
  ok(`one takes the dog: carried ${r.landed} m, dropped, on its feet`, r.took && r.landed > 8, r);
}

if (!only || only === 'limits') {
  await setup(910, { dogS: 860 });
  const r1 = await h.page.evaluate(() => {
    const { G, T, step, FALCONS } = GAME; let most = 0, swoops = 0, was = new Map();
    for (let i = 0; i < 60 / 0.025; i++) { step(0.025); const out = FALCONS.filter(F => F.home && F.state !== 'perch' && F.state !== 'home').length; most = Math.max(most, out); for (const F of FALCONS) { if (F.home && F.state === 'circle' && was.get(F) !== 'circle') swoops++; was.set(F, F.state); } }
    return { most, swoops, max: T.canyon.maxAir };
  });
  ok(`a minute in the gorge: ${r1.swoops} swoops, never more than ${r1.max} out at once (${r1.most})`, r1.swoops >= 4 && r1.most <= r1.max, r1);
  await setup(910, { dogS: 860, hour: 22 });
  const r2 = await h.page.evaluate(() => { const { step, FALCONS } = GAME; let n = 0; for (let i = 0; i < 40 / 0.025; i++) { step(0.025); if (FALCONS.some(F => F.home && F.state !== 'perch')) n++; } return n; });
  ok('none at night', r2 === 0, r2);
  await setup(800, { dogS: 790 });
  const r3 = await h.page.evaluate(() => { const { step, FALCONS } = GAME; let n = 0; for (let i = 0; i < 40 / 0.025; i++) { step(0.025); if (FALCONS.some(F => F.home && F.state !== 'perch')) n++; } return n; });
  ok('none on a flock outside the gorge', r3 === 0, r3);
  await setup(910, { dogS: 860 });
  const r4 = await h.page.evaluate(() => {
    const { step, FALCONS, resetGame, CANYON, G } = GAME; for (let i = 0; i < 30 / 0.025 && !FALCONS.some(F => F.home && F.prey); i++) step(0.025);
    const busy = FALCONS.some(F => F.home && F.state !== 'perch'); resetGame();
    return { busy, back: FALCONS.every(F => !F.home || (F.state === 'perch' && !F.prey && Math.hypot(F.x - F.home.x, F.z - F.home.z) < 0.01)), seen: CANYON.seen, grabbed: G.sheep.some(s => s.grabbed) };
  });
  ok('a new journey: every falcon back on its pillar', r4.busy && r4.back && !r4.seen && !r4.grabbed, r4);
}

console.log(fail ? `${fail} failed` : 'all ok', h.errors.slice(0, 5));
await h.close();
process.exit(fail ? 1 : 0);
