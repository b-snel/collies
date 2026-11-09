// Headless tests for foraging: `node tools/forage-sim.mjs [name ...]`.
// The plants along the trail; a bot dog takes a camp's bucket, walks it over plants till it's full and
// brings it back; Hank's twilight run tips it into the trough (pen.trough.food rises by what was in it);
// penned sheep eat from the trough overnight; picked plants grow back; pounce/bark/drop/spill with the bucket.
import { open } from './harness.mjs';
const only = process.argv.slice(2);
const h = await open({ query: '?sim' });
await h.page.evaluate(() => {
  const { G, step, startGame, resetGame } = GAME;
  startGame({ kind: 'bot', index: 0 });
  const H = window.H = {};
  H.p = G.players[0]; H.d = () => G.dogs[0];
  H.to = (dx, dz, extra = {}) => { const R = GAME.CAM_R, F = GAME.CAM_F, l = Math.hypot(dx, dz) || 1; return Object.assign({ mx: (dx * R.x + dz * R.z) / l, my: -(dx * F.x + dz * F.z) / l }, extra); };
  H.reset = (hour = 10) => { resetGame(); G.clock.hour = hour; for (const c of G.coyotes) GAME.scene.remove(c.models.root); G.coyotes.length = 0; G.packs.length = 0; H.p.bot = {}; };
  H.place = (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = GAME.groundY(x, z); };
  H.run = (sec, fn) => { let t = 0; for (; t < sec; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return t; };
  H.r = v => Math.round(v * 100) / 100;
  // walk the dog (holding grab) to a point; returns seconds taken, or null if it didn't get there
  H.walkTo = (x, z, sec = 30, r = 0.8, extra = { grab: true }) => { const d = H.d(); return H.run(sec, () => { const dx = x - d.x, dz = z - d.z; if (Math.hypot(dx, dz) < r) return true; H.p.bot = H.to(dx, dz, extra); }); };
  // take a pen's bucket off its hook
  H.takeBucket = pen => {
    const d = H.d(), b = GAME.BUCKETS.find(o => o.home === pen), a = Math.atan2(b.z - pen.z, b.x - pen.x);
    H.place(d, pen.x + Math.cos(a) * (pen.R + 2.2), pen.z + Math.sin(a) * (pen.R + 2.2)); d.yaw = Math.atan2(b.x - d.x, b.z - d.z);
    H.p.bot = { grab: true }; GAME.step(0.025); return b;
  };
  // fill it from the nearest plants (the bot walks from plant to plant)
  H.forage = (b, maxSec = 90) => {
    const d = H.d(), cap = GAME.T.forage.bucketCap; let t = 0, dist = 0, food = 0;
    const picked0 = GAME.FORAGE.picked;
    while (t < maxSec && b.fill < cap - 1e-6 && d.holding === b) {
      let best = null, bd = 1e9; for (const p of GAME.PLANTS) { if (p.picked) continue; const dd = Math.hypot(p.x - d.x, p.z - d.z); if (dd < bd) { bd = dd; best = p; } }
      if (!best) break;
      const x0 = d.x, z0 = d.z, f0 = b.fill;
      const tt = H.walkTo(best.x, best.z, 20, 0.6);
      t += tt; dist += Math.hypot(d.x - x0, d.z - z0);
      if (!best.picked) { best.picked = true; best.regrowAt = 1e9; }   // unreachable one: skip it
    }
    return { secs: H.r(t), walked: H.r(dist), plants: GAME.FORAGE.picked - picked0, fill: H.r(b.fill), full: b.fill >= cap - 1e-6 };
  };
});

const tests = {
  // where the plants grew: how many, which biome, never on the worn trail, in a pen or on blocked ground
  async plants() {
    return h.page.evaluate(() => {
      const { PLANTS, sAt, sdfAt, pens } = GAME, by = { desert: 0, valley: 0, ocean: 0, promised: 0 }, kinds = { daisy: 0, alfalfa: 0 };
      let onTrail = 0, inPen = 0, blocked = 0, sum = 0, food = 0;
      for (const p of PLANTS) {
        const s = sAt(p.x, p.z); by[s < 190 ? 'desert' : s < 448 ? 'valley' : s < 665 ? 'ocean' : 'promised']++; kinds[p.kind]++; food += p.food;
        if (sdfAt(p.x, p.z) < 0.5) blocked++; if (pens.some(q => Math.hypot(p.x - q.x, p.z - q.z) < q.R + 1)) inPen++;
        sum += p.x * 0.37 + p.z * 0.61;
      }
      return { total: PLANTS.length, byBiome: by, kinds, totalFood: H.r(food), blocked, inPen, checksum: H.r(sum) };
    });
  },
  // a bot dog takes the valley camp's bucket, fills it on the plants nearby, and brings it back
  async fillAndDeliver() {
    return h.page.evaluate(() => {
      const { G, pens, FORAGE, T } = GAME; H.reset(11); const pen = pens[1], d = H.d();
      const b = H.takeBucket(pen); const took = d.holding === b && b.state === 'held';
      const f = H.forage(b, 120);
      const back = H.walkTo(pen.gx + Math.cos(pen.gateA) * 3, pen.gz + Math.sin(pen.gateA) * 3, 60, 1.2);
      const fill = b.fill; H.p.bot = {}; GAME.step(0.025);
      return { took, forage: f, walkBackSecs: H.r(back), delivered: FORAGE.delivered, state: b.state, onItsHook: b.home === pen, fillKept: H.r(b.fill), fillAtRelease: H.r(fill), cap: T.forage.bucketCap, popups: GAME.floats.length };
    });
  },
  // Hank's twilight run: the full bucket on the hook, the flock penned; at 19:00 he tips it into the trough
  async hankRun() {
    return h.page.evaluate(() => {
      const { G, pens, BUCKETS, FORAGE, HANK, T } = GAME; H.reset(18.6); const pen = pens[1], b = BUCKETS[1];
      b.fill = T.forage.bucketCap; GAME.hangBucket(b, pen);
      for (const s of G.sheep) { const a = Math.random() * 6.283, r = Math.random() * (pen.R - 2.5); H.place(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); s.hunger = 0.5; }
      const d = H.d(); H.place(d, pen.exitX + 6, pen.exitZ + 6);
      const hp = GAME.pathPoint(pen.camp.s - 35, 3); HANK.x = hp.x; HANK.z = hp.z;   // he's back on the trail
      const food0 = pen.trough.food, fill0 = b.fill, stages = []; let startH = null, pourH = null, doneH = null, last = null, atPour = null;
      H.run(400, () => {
        const R = FORAGE.run, st = R ? R.stage : null;
        if (st !== last) { stages.push(st || 'idle'); last = st; }
        if (R && startH === null) startH = G.clock.hour;
        if (R && R.poured && pourH === null) { pourH = G.clock.hour; atPour = pen.trough.food; }
        if (startH !== null && !R && doneH === null) doneH = G.clock.hour;
        return doneH !== null && G.clock.hour > 21;
      });
      const f = pen.fire, toFire = Math.hypot(HANK.x - f.x, HANK.z - f.z);
      return { trough: [H.r(food0), H.r(atPour), H.r(pen.trough.food)], rose: H.r(atPour - food0), eatenBy21: H.r(atPour - pen.trough.food), bucketHad: fill0, bucketNow: H.r(b.fill), bucketOnHook: b.state === 'hook' && b.home === pen,
        startedAt: startH && H.r(startH), pouredAt: pourH && H.r(pourH), doneAt: doneH && H.r(doneH), beforeDark: pourH !== null && pourH < T.nightStart, stages, hankToFireAfter: H.r(toFire), runs: FORAGE.runs };
    });
  },
  // overnight: penned sheep eat from the trough (the stand-in), compared with an empty trough
  async troughNight() {
    return h.page.evaluate(() => {
      const { G, pens, T } = GAME, out = {};
      for (const food of [T.forage.bucketCap, 0]) {
        H.reset(20.4); const pen = pens[1]; pen.trough.food = food; pens[1].trough.shown = food;
        for (const s of G.sheep) { const a = Math.random() * 6.283, r = Math.random() * (pen.R - 2.5); H.place(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); s.hunger = 0.45; }
        H.place(H.d(), pen.exitX + 8, pen.exitZ + 8);
        H.run(600, () => G.clock.day >= 2 && G.clock.hour >= 6);
        const live = G.sheep.filter(s => !s.dead);
        out[food ? 'fullTrough' : 'emptyTrough'] = { hungerAtDawn: H.r(live.reduce((a, s) => a + s.hunger, 0) / live.length), troughLeft: H.r(pen.trough.food), penned: live.filter(s => s.pen === pen).length, hour: H.r(G.clock.hour) };
      }
      out.perSheep = H.r((out.emptyTrough.hungerAtDawn - out.fullTrough.hungerAtDawn));
      return out;
    });
  },
  // picked plants grow back after a day or two
  async regrow() {
    return h.page.evaluate(() => {
      const { G, PLANTS, pens } = GAME; H.reset(11);
      const b = H.takeBucket(pens[1]); H.forage(b, 60);
      const picked = () => PLANTS.filter(p => p.picked && p.regrowAt < 1e8).length, n0 = picked(), r = [n0];
      for (let day = 1; day <= 3; day++) { G.clock.day++; GAME.regrowPlants(); r.push(picked()); }
      return { pickedThenAfterDays: r };
    });
  },
  // with the bucket in its mouth the dog can still pounce and bark (and hop a fence); let go away from a pen and it stays put
  async carryMoves() {
    return h.page.evaluate(() => {
      const { G, pens, pathPoint, BUCKETS } = GAME; H.reset(11); const d = H.d(), b = H.takeBucket(pens[1]);
      const P = pathPoint(330, 0); H.place(d, P.x, P.z);
      H.p.bot = H.to(P.tx, P.tz, { grab: true, pounce: true }); GAME.step(0.025);
      const pounced = d.pounceT > 0, held1 = d.holding === b; H.p.bot = { grab: true }; H.run(0.5);
      const barks0 = G.barks || 0; H.p.bot = { grab: true, bark: true }; GAME.step(0.025); H.p.bot = { grab: true }; H.run(0.2);
      const barked = (G.barks || 0) > barks0, held2 = d.holding === b;
      // a pen fence in the way: it hops over with the bucket
      const pen = pens[1], a = pen.gateA + Math.PI; H.place(d, pen.x + Math.cos(a) * (pen.R + 3), pen.z + Math.sin(a) * (pen.R + 3));
      let hopped = false; H.p.bot = H.to(-Math.cos(a), -Math.sin(a), { grab: true }); H.run(1.2, () => { if (d.hopT > 0) hopped = true; });
      const inPen = Math.hypot(d.x - pen.x, d.z - pen.z) < pen.R, held3 = d.holding === b;
      // out on the trail, let go: it sits on the ground, not delivered
      H.place(d, P.x, P.z); H.p.bot = { grab: true }; H.run(0.1); b.fill = 2; H.p.bot = {}; GAME.step(0.025);
      const dropped = b.state; const x0 = b.x, z0 = b.z; H.run(1);
      // sprint into it: it gets knocked and spills
      H.place(d, b.x - P.tx * 6, b.z - P.tz * 6); const f0 = b.fill;
      H.p.bot = H.to(P.tx, P.tz, { sprint: true }); H.run(1.5, () => b.fill < f0);
      return { pounced, keptThroughPounce: held1, barked, keptThroughBark: held2, hoppedFence: hopped, landedInPen: inPen, keptOverFence: held3, droppedState: dropped, stayedPut: H.r(Math.hypot(b.x - x0, b.z - z0)), spilled: H.r(f0 - b.fill), knockedTo: H.r(Math.hypot(b.x - x0, b.z - z0)) };
    });
  },
  // a bucket delivered after dark with the flock penned: he still does it, from the campfire, and stays by the fire
  async lateDelivery() {
    return h.page.evaluate(() => {
      const { G, pens, BUCKETS, FORAGE, HANK, T } = GAME; H.reset(21.5); const pen = pens[1], b = BUCKETS[1];
      for (const s of G.sheep) { const a = Math.random() * 6.283, r = Math.random() * (pen.R - 2.5); H.place(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); }
      const f = pen.fire; HANK.x = f.x + 1.5; HANK.z = f.z; H.place(H.d(), pen.exitX + 6, pen.exitZ + 6);
      H.run(2);
      b.fill = 2.5; GAME.hangBucket(b, pen);
      let maxFromFire = 0; const poured0 = FORAGE.poured, runs0 = FORAGE.runs;
      const t = H.run(60, () => { maxFromFire = Math.max(maxFromFire, Math.hypot(HANK.x - f.x, HANK.z - f.z)); return FORAGE.runs > runs0 && !FORAGE.run; });
      const eatenSoFar = H.r(FORAGE.poured - poured0 - pen.trough.food);
      H.run(4);
      return { poured: H.r(FORAGE.poured - poured0), runSecs: H.r(t), finishedAt: H.r(G.clock.hour), eatenSoFar, maxFromFire: H.r(maxFromFire), backByFire: H.r(Math.hypot(HANK.x - f.x, HANK.z - f.z)), bucketOnHook: b.state === 'hook' };
    });
  },
};

const results = {};
for (const [name, fn] of Object.entries(tests)) {
  if (only.length && !only.includes(name)) continue;
  try { results[name] = await fn(); } catch (e) { results[name] = { error: String(e) }; }
  console.log(name, JSON.stringify(results[name]));
}
if (h.errors.length) console.log('PAGE ERRORS', h.errors.slice(0, 5));
await h.close();
