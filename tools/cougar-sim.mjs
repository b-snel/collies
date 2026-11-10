// Headless test: `node tools/cougar-sim.mjs [hunt|rescue|penned|day] [--trials N]`. A cougar in the tree by the mountain camp.
//   hunt    the flock (two lambs in it) sleeps in the open by the tree at night, nobody guarding: what it takes (lambs
//           first), that the sheep only dies once the cougar is up its tree, its stone at the foot of the tree
//   rescue  the same, with a bot dog that pounces on the cougar once it has a sheep: is the sheep dropped and saved?
//   penned  the whole flock behind a shut gate, no dog: it jumps the fence, takes a lamb and jumps back out with it
//   penguard  the same, but a dog lies in the pen with them: it takes nobody
//   day     by day the cougar isn't there; at nightfall it's up on its limb
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
    G.clock.hour = 12; for (let i = 0; i < 40; i++) step(0.025);
    const dayState = k.state, dayVis = k.models.root.visible;
    G.clock.hour = 20.45; for (let i = 0; i < 200; i++) step(0.025);
    return { lairs, dayState, nightState: k.state, nightY: +(k.y - L.y).toFixed(2) };
  }
  // the flock lies down 14-24 m out from the tree, toward the trail
  const ux = Math.sin(L.yaw), uz = Math.cos(L.yaw);
  const live = living(); live.forEach((s, i) => { s.lamb = i < 2; s.ram = false; s.x = L.x + ux * 19 + (Math.random() - 0.5) * 9; s.z = L.z + uz * 19 + (Math.random() - 0.5) * 9; s.hunger = 0.3; s.vx = s.vz = 0; s.pen = null; });
  const pen = pens[1], penned = scen === 'penned' || scen === 'penguard';
  if (penned) { for (const s of live) { s.x = pen.x + (Math.random() - 0.5) * 6; s.z = pen.z + (Math.random() - 0.5) * 6; s.pen = pen; } }
  d.x = L.x + ux * 60; d.z = L.z + uz * 60;   // the dog is well away
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
    for (let i = 0; i < 4; i++) { step(0.025); if (k.prey) maxH = Math.max(maxH, k.prey.y - GAME.groundY(k.prey.x, k.prey.z)); }
    p.inp && (p.inp.pounce = false);
    t += 0.1; states[k.state] = (states[k.state] || 0) + 1;
    if (k.prey && !grabbed) { grabbed = k.prey.name; grabbedLamb = !!k.prey.lamb; grabbedInPen = GAME.penAt(k.prey.x, k.prey.z) === pen; }
    if (k.state === 'vault' && lastSt !== 'vault') vaults++; lastSt = k.state;
    if ((G.stats.cougar || 0) > lost0 && !diedWhen) diedWhen = { state: k.state, t: +t.toFixed(1), upTree: +(k.y - L.y).toFixed(2), maxH: +maxH.toFixed(2) };
    if (diedWhen || (scen === 'rescue' && G.stats.saved > saved0 && !k.prey && k.state === 'perch')) break;
  }
  const g = G.graves.find(g => g.name === grabbed);
  return { penShut: pen.gateT < 0.3, grabbedInPen, vaults, lairs, start, end: living().length, lambs: firstLamb, grabbed, grabbedLamb, diedWhen, saved: G.stats.saved - saved0, lost: G.stats.cougar || 0,
    graveFromTree: g ? +Math.hypot(g.x - L.x, g.z - L.z).toFixed(1) : null, memorial: (GAME.G.lost.at(-1) || {}).why, cougar: k.state, states, t: +t.toFixed(1) };
}, scen);
const scens = only ? [only] : ['day', 'hunt', 'rescue', 'penned', 'penguard'];
let fail = 0;
for (const sc of scens) {
  const n = sc === 'day' ? 1 : trials;
  for (let i = 0; i < n; i++) {
    const r = await run(sc);
    let ok = true;
    if (sc === 'day') ok = r.dayState === 'away' && r.nightState === 'perch' && r.nightY > 3;
    if (sc === 'hunt') ok = r.grabbedLamb === true && r.diedWhen && r.diedWhen.state === 'fed' && r.diedWhen.maxH > 2 && r.memorial === 'cougar' && r.graveFromTree < 4;
    if (sc === 'rescue') ok = r.saved >= 1 && r.lost === 0 && r.grabbedLamb === true;
    if (sc === 'penned') ok = r.penShut && r.grabbedLamb === true && r.grabbedInPen && r.vaults >= 2 && r.diedWhen && r.diedWhen.state === 'fed';
    if (sc === 'penguard') ok = r.lost === 0 && !r.grabbed;
    if (!ok) fail++;
    console.log(ok ? 'ok  ' : 'FAIL', sc, JSON.stringify(r));
  }
}
console.log(fail ? `${fail} failed` : 'all ok', h.errors.slice(0, 5));
await h.close();
process.exit(fail ? 1 : 0);
