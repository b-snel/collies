// Headless test: `node tools/cougar-sim.mjs [hunt|rescue|penned|penguard|day|grove] [--trials N]`. A cougar in the tree by the mountain camp.
//   hunt    the flock (two lambs in it) sleeps in the open by the tree at night, nobody guarding: what it takes (lambs
//           first), that the sheep only dies once the cougar is up its tree, its stone at the foot of the tree
//   rescue  the same, with a bot dog that pounces on the cougar once it has a sheep: is the sheep dropped and saved?
//   penned  the whole flock behind a shut gate, no dog: it jumps the fence, takes a lamb and jumps back out with it
//   penguard  the same, but a dog lies in the pen with them: it takes nobody
//   day     by day the cougar isn't there; at nightfall (the flock at its camp) it's up on its limb
//   grove   loners: a territory (grove) each, legs[i] round the camp at the end of leg i, penGap+ m off pens, apart from each
//           other; nightfall at each of those camps: just that leg's up, each in a random tree of its own, all hunting;
//           a whole night at the last, the flock out: one after another, never two out at once
import { open } from './harness.mjs';
const args = process.argv.slice(2), ti = args.indexOf('--trials'), only = args.find((a, i) => !a.startsWith('--') && i !== ti + 1);
const trials = ti >= 0 ? +args[ti + 1] : 3;
const h = await open();
const run = (scen) => h.page.evaluate(async (scen) => {
  const { G, T, step, startGame, resetGame, CAMPS, LAIRS, COUGARS, cougarHunt, pens, living, toggleGate, stepClock } = GAME;
  if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); else resetGame();
  const p = G.players[0]; p.bot = {};
  const k = COUGARS[0], L = k.lair, d = G.dogs[0];
  const lairs = LAIRS.map(l => ({ x: Math.round(l.x), z: Math.round(l.z), s: Math.round(l.s), lat: Math.round(l.lat) }));
  if (scen === 'day') {
    const tp = GAME.pathPoint(CAMPS[1].s, 6); for (const s of living()) { s.x = tp.x + (Math.random() - 0.5) * 6; s.z = tp.z + (Math.random() - 0.5) * 6; s.vx = s.vz = 0; s.pen = null; }   // (by its camp; not penned: no fast-forward)
    G.clock.hour = 12; for (let i = 0; i < 40; i++) step(0.025);
    const dayState = k.state, dayVis = k.models.root.visible;
    G.clock.hour = 20.45; for (let i = 0; i < 200; i++) step(0.025);
    return { lairs, dayState, nightState: k.state, nightY: +(k.y - k.lair.y).toFixed(2) };
  }
  if (scen === 'grove') {
    const { GROVES, COUGAR_CAMPS } = GAME, C = T.cougar, abroad = k => !['away', 'perch', 'fed'].includes(k.state);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
    const layout = { legs: COUGAR_CAMPS.map((c, i) => GROVES.filter(g => g.leg === i).length), own: COUGARS.length === GROVES.length && COUGARS.every((k, i) => k.grove === GROVES[i]),
      penGap: +Math.min(...LAIRS.map(L => Math.min(...CAMPS.map(c => dist(L, c) - c.R)))).toFixed(1),
      apart: +Math.min(...GROVES.flatMap(g => g.trees.flatMap(L => GROVES.filter(o => o !== g).flatMap(o => o.trees.map(M => dist(L, M)))))).toFixed(1) };
    const night = (leg, open) => {
      const pen = pens[CAMPS.indexOf(COUGAR_CAMPS[leg])];
      for (const s of living()) { s.x = pen.x + (Math.random() - 0.5) * 6; s.z = pen.z + (Math.random() - 0.5) * 6; s.vx = s.vz = 0; s.pen = open ? null : pen; s.lamb = false; s.ram = false; }
      for (const o of G.dogs) { o.x = pen.x + 3; o.z = pen.z; if (open) { const g = GROVES.find(g => g.leg === 0).trees[0]; o.x = g.x; o.z = g.z + 3; } }   // (open: the dog's far away)
      GAME.resetCougars(); G.clock.day = 2; G.clock.hour = 20.4; for (let i = 0; i < 80; i++) step(0.025);
      const up = COUGARS.filter(k => k.state === 'perch');
      return { up: up.length, own: up.every(k => k.grove.trees.includes(k.lair)), leg: up.every(k => k.grove.leg === leg), hunt: COUGARS.filter(k => k.hunts).length, trees: up.map(k => k.lair.id) };
    };
    const nights = [0, 1, 2, 3].map(l => night(l));
    const again = [1, 2, 3, 4].map(() => night(3)), sets = new Set(again.map(n => n.trees.slice().sort().join())).size;
    night(3, true);
    let most = 0, steps = 0; const came = new Set();
    const dark = () => G.clock.hour >= T.nightStart || G.clock.hour < T.nightEnd;
    while (dark() && steps < 12000) { step(0.025); steps++; const out = COUGARS.filter(abroad); most = Math.max(most, out.length); for (const k of out) came.add(k.i); }
    return { layout, nights, sets, most, came: came.size, dawn: +G.clock.hour.toFixed(1) };
  }
  // the flock lies down 14-24 m out from the tree, toward the trail
  const ux = Math.sin(L.yaw), uz = Math.cos(L.yaw);
  const live = living(); live.forEach((s, i) => { s.lamb = i < 2; s.ram = false; s.x = L.x + ux * 19 + (Math.random() - 0.5) * 9; s.z = L.z + uz * 19 + (Math.random() - 0.5) * 9; s.hunger = 0.3; s.vx = s.vz = 0; s.pen = null; });
  const pen = pens[1], penned = scen === 'penned' || scen === 'penguard';
  if (penned) { for (const s of live) { s.x = pen.x + (Math.random() - 0.5) * 6; s.z = pen.z + (Math.random() - 0.5) * 6; s.pen = pen; } }
  d.x = L.x + ux * 60; d.z = L.z + uz * 60;   // the dog is well away
  if (scen === 'penned') { const ax = pen.x - L.x, az = pen.z - L.z, al = Math.hypot(ax, az) || 1; d.x = pen.x + ax / al * 30; d.z = pen.z + az / al * 30; }   // (past the pen, off its way home)
  if (scen === 'penguard') { d.x = pen.x; d.z = pen.z; p.bot = { lie: true }; }
  G.clock.hour = 21; G.clock.day = 2;
  cougarHunt(k, 0);
  const start = live.length, firstLamb = live.filter(s => s.lamb).map(s => s.name);
  let grabbedInPen = null, vaults = 0, lastSt = '', grabbed = null, grabbedLamb = null, diedWhen = null, maxH = 0, t = 0, saved0 = G.stats.saved, states = {};
  const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
  while (t < 90) {
    if (scen === 'rescue' && k.prey) {   // run at the cougar and pounce
      const dx = k.x - d.x, dz = k.z - d.z, l = Math.hypot(dx, dz) || 1;
      p.bot = { mx: (dx * R.x + dz * R.z) / l, my: -(dx * F.x + dz * F.z) / l, sprint: true, pounce: l < 5 };
    } else if (scen !== 'penguard') p.bot = {};
    const lost0 = G.stats.cougar || 0;
    for (let i = 0; i < 4; i++) {
      step(0.025); if (k.prey) maxH = Math.max(maxH, k.prey.y - GAME.groundY(k.prey.x, k.prey.z));
      if (k.prey && grabbedInPen === null) grabbedInPen = Math.hypot(k.prey.x - pen.x, k.prey.z - pen.z) < pen.R;   // where it was caught: inside the fence (a lamb at the fence is dragged past penAt's margin in a step)
    }
    p.inp && (p.inp.pounce = false);
    t += 0.1; states[k.state] = (states[k.state] || 0) + 1;
    if (k.prey && !grabbed) { grabbed = k.prey.name; grabbedLamb = !!k.prey.lamb; }
    if (k.state === 'vault' && lastSt !== 'vault') vaults++; lastSt = k.state;
    if ((G.stats.cougar || 0) > lost0 && !diedWhen) diedWhen = { state: k.state, t: +t.toFixed(1), upTree: +(k.y - L.y).toFixed(2), maxH: +maxH.toFixed(2) };
    if (diedWhen || (scen === 'rescue' && G.stats.saved > saved0 && !k.prey && k.state === 'perch')) break;
  }
  const g = G.graves.find(g => g.name === grabbed);
  return { penShut: pen.gateT < 0.3, grabbedInPen, vaults, start, end: living().length, lambs: firstLamb, grabbed, grabbedLamb, diedWhen, saved: G.stats.saved - saved0, lost: G.stats.cougar || 0,
    graveFromTree: g ? +Math.hypot(g.x - L.x, g.z - L.z).toFixed(1) : null, memorial: (GAME.G.lost.at(-1) || {}).why, cougar: k.state, states, t: +t.toFixed(1) };
}, scen);
const scens = only ? [only] : ['day', 'hunt', 'rescue', 'penned', 'penguard', 'grove'];
const [T_legs, T_penGap, T_apart] = await h.page.evaluate(() => { const C = GAME.T.cougar; return [C.legs, C.penGap, C.apart]; });
let fail = 0;
for (const sc of scens) {
  const n = sc === 'day' || sc === 'grove' ? 1 : trials;
  for (let i = 0; i < n; i++) {
    const r = await run(sc);
    let ok = true;
    if (sc === 'day') ok = r.dayState === 'away' && r.nightState === 'perch' && r.nightY > 3;
    if (sc === 'hunt') ok = r.grabbedLamb === true && r.diedWhen && r.diedWhen.state === 'fed' && r.diedWhen.maxH > 2 && r.memorial === 'cougar' && r.graveFromTree < 4;
    if (sc === 'rescue') ok = r.saved >= 1 && r.lost === 0 && r.grabbedLamb === true;
    if (sc === 'penned') ok = r.penShut && r.grabbedLamb === true && r.grabbedInPen && r.vaults >= 2 && r.diedWhen && r.diedWhen.state === 'fed';
    if (sc === 'penguard') ok = r.lost === 0 && !r.grabbed;
    if (sc === 'grove') { const L = r.layout, legs = T_legs; ok = L.own && L.legs.join() === legs.join() && L.penGap >= T_penGap - 0.5 && L.apart >= T_apart * 0.6 - 0.5
      && r.nights.every((n, i) => n.up === legs[i] && n.own && n.leg && n.hunt === legs[i]) && r.sets > 1 && r.most === 1 && r.came >= 2; }
    if (!ok) fail++;
    console.log(ok ? 'ok  ' : 'FAIL', sc, JSON.stringify(r));
  }
}
console.log(fail ? `${fail} failed` : 'all ok', h.errors.slice(0, 5));
await h.close();
process.exit(fail ? 1 : 0);
