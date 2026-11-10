// Headless tests for foraging and salt: `node tools/forage-sim.mjs [name ...]`.
// The plants and salt rocks along the trail; a bot dog runs over plants till it can carry no more and tips them
// into the valley pen's troughs (from inside the pen and over the fence); penned sheep feed at several troughs at
// once overnight; a lump of salt goes from a rock to the pen's salt lick and penned sheep lick it; salt runs down,
// slows a sheep, and kills one left without long enough; picked plants and salt regrow; every camp's troughs and lick
// are reachable.
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
  H.walkTo = (x, z, sec = 30, r = 0.8, extra = {}) => { const d = H.d(); return H.run(sec, () => { const dx = x - d.x, dz = z - d.z; if (Math.hypot(dx, dz) < r) return true; H.p.bot = H.to(dx, dz, extra); }); };
  H.penSheep = (pen, hunger) => { for (const s of G.sheep) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (pen.R - 2.5); H.place(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); if (hunger !== undefined) s.hunger = hunger; } };
  // run from plant to plant (nearest first) till the dog can carry no more
  H.forage = (maxSec = 90) => {
    const d = H.d(), cap = GAME.T.forage.carryCap; let t = 0, dist = 0;
    const picked0 = GAME.FORAGE.picked;
    while (t < maxSec && d.greens < cap - 1e-6) {
      let best = null, bd = 1e9; for (const p of GAME.PLANTS) { if (p.picked) continue; const dd = Math.hypot(p.x - d.x, p.z - d.z); if (dd < bd) { bd = dd; best = p; } }
      if (!best) break;
      const x0 = d.x, z0 = d.z;
      t += H.walkTo(best.x, best.z, 20, 0.6); dist += Math.hypot(d.x - x0, d.z - z0);
      if (!best.picked) { best.picked = true; best.regrowAt = 1e9; }   // unreachable one: skip it
    }
    H.p.bot = {};
    return { secs: H.r(t), walked: H.r(dist), plants: GAME.FORAGE.picked - picked0, carrying: H.r(d.greens), full: d.greens >= cap - 1e-6 };
  };
});

const tests = {
  // where the plants and salt rocks are: how many, which biome, never on the worn trail, in a pen or on blocked ground
  async plants() {
    return h.page.evaluate(() => {
      const { PLANTS, SALT_ROCKS, sAt, sdfAt, pens, CAMPS } = GAME, by = { desert: 0, valley: 0, ocean: 0, promised: 0 }, kinds = { daisy: 0, alfalfa: 0 };
      const biome = s => s < 190 ? 'desert' : s < 448 ? 'valley' : s < 665 ? 'ocean' : 'promised';
      let inPen = 0, blocked = 0, sum = 0, food = 0;
      for (const p of PLANTS) {
        by[biome(sAt(p.x, p.z))]++; kinds[p.kind]++; food += p.food;
        if (sdfAt(p.x, p.z) < 0.5) blocked++; if (pens.some(q => Math.hypot(p.x - q.x, p.z - q.z) < q.R + 1)) inPen++;
        sum += p.x * 0.37 + p.z * 0.61;
      }
      const saltBy = { desert: 0, valley: 0, ocean: 0, promised: 0 }; for (const r of SALT_ROCKS) saltBy[biome(sAt(r.x, r.z))]++;
      const nearestSalt = CAMPS.map(c => H.r(Math.min(...SALT_ROCKS.map(r => Math.hypot(r.x - c.x, r.z - c.z)))));
      return { total: PLANTS.length, byBiome: by, kinds, totalFood: H.r(food), blocked, inPen, checksum: H.r(sum),
        saltRocks: SALT_ROCKS.length, saltByBiome: saltBy, saltBlocked: SALT_ROCKS.filter(r => sdfAt(r.x, r.z) < 1).length, nearestSaltToEachCamp: nearestSalt, troughsPerPen: pens.map(p => p.troughs.length) };
    });
  },
  // a bot dog runs over the plants near the valley camp till it's full, then tips them into the troughs: one from
  // inside the pen, the next reaching over the fence
  async gatherAndTip() {
    return h.page.evaluate(() => {
      const { G, pens, FORAGE, T, troughFood } = GAME; H.reset(11); const pen = pens[1], d = H.d();
      H.place(d, pen.exitX, pen.exitZ);
      const f = H.forage(120);
      const load = d.greens, back = H.walkTo(pen.gx, pen.gz, 40, 1.5), tr0 = pen.troughs[0];
      const t2 = H.walkTo(tr0.x + (pen.x - tr0.x) * 0.12, tr0.z + (pen.z - tr0.z) * 0.12, 20, 0.6);   // into the pen, up to the first trough (within tipR from any side)
      const tipped1 = H.r(troughFood(pen)), left1 = H.r(d.greens);
      // a second load, tipped over the fence from outside
      d.greens = T.forage.carryCap; const tr = pen.troughs[pen.troughs.length - 1], a = Math.atan2(tr.z - pen.z, tr.x - pen.x);
      H.place(d, pen.x + Math.cos(a) * (pen.R + 3), pen.z + Math.sin(a) * (pen.R + 3));
      H.walkTo(pen.x + Math.cos(a) * (pen.R + 0.45), pen.z + Math.sin(a) * (pen.R + 0.45), 10, 0.3);
      return { forage: f, load: H.r(load), walkBackSecs: H.r(back), tippedInside: tipped1, carryingAfter: left1, totalAfterFence: H.r(troughFood(pen)), leftAfterFence: H.r(d.greens),
        troughs: pen.troughs.map(t => H.r(t.food)), tips: FORAGE.tips, cap: T.forage.carryCap };
    });
  },
  // overnight: a hungry flock penned with its troughs full feeds several at a time, compared with empty troughs
  async troughNight() {
    return h.page.evaluate(() => {
      const { G, pens, T, fillTroughs, troughFood } = GAME, out = {};
      for (const food of [12, 0]) {
        H.reset(19.5); const pen = pens[1]; GAME.setGate(pen, false); fillTroughs(pen, food);
        H.penSheep(pen, 0.5); H.place(H.d(), pen.exitX + 8, pen.exitZ + 8);
        let maxAt = 0, maxWait = 0;
        H.run(600, () => { const at = G.sheep.filter(s => s.atTrough).length; maxAt = Math.max(maxAt, at); maxWait = Math.max(maxWait, G.sheep.filter(s => s.state === 'wait').length); return G.clock.day >= 2 && G.clock.hour >= 6; });
        const live = G.sheep.filter(s => !s.dead);
        out[food ? 'fullTroughs' : 'emptyTroughs'] = { hungerAtDawn: H.r(live.reduce((a, s) => a + s.hunger, 0) / live.length), foodLeft: H.r(troughFood(pen)), maxFeedingAtOnce: maxAt, maxWaiting: maxWait, penned: live.filter(s => s.pen === pen).length };
      }
      out.perSheep = H.r(out.emptyTroughs.hungerAtDawn - out.fullTroughs.hungerAtDawn);
      return out;
    });
  },
  // salt: the dog runs over a salt rock, takes the lump to the valley pen's lick, and the penned flock licks it
  async salt() {
    return h.page.evaluate(() => {
      const { G, pens, SALT_ROCKS, FORAGE, T } = GAME; H.reset(9); const pen = pens[1], d = H.d();
      let rock = null, rd = 1e9; for (const r of SALT_ROCKS) { const dd = Math.hypot(r.x - pen.x, r.z - pen.z); if (dd < rd) { rd = dd; rock = r; } }
      H.place(d, pen.exitX, pen.exitZ);
      const toRock = H.walkTo(rock.x, rock.z, 40, 0.5), got = d.salt, taken = rock.taken;
      const L = pen.lick, a = Math.atan2(L.z - pen.z, L.x - pen.x);
      H.walkTo(pen.x + Math.cos(a) * (pen.R + 3), pen.z + Math.sin(a) * (pen.R + 3), 40, 1);
      H.walkTo(pen.x + Math.cos(a) * (pen.R + 0.45), pen.z + Math.sin(a) * (pen.R + 0.45), 10, 0.3);   // up to the fence beside the lick
      const inLick = H.r(L.salt), stillCarrying = d.salt;
      // the penned flock, short of salt, licks it
      GAME.setGate(pen, false); H.penSheep(pen); for (const s of G.sheep) s.salt = 0.6; H.place(d, pen.exitX + 8, pen.exitZ + 8); H.p.bot = {};
      let maxLicking = 0; H.run(90, () => { maxLicking = Math.max(maxLicking, G.sheep.filter(s => s.atLick).length); });
      const live = G.sheep.filter(s => !s.dead);
      return { secsToRock: H.r(toRock), picked: got, rockTaken: taken, lickSalt: inLick, carryingAfter: stillCarrying, lumps: FORAGE.salted,
        maxLickingAtOnce: maxLicking, saltLeft: H.r(L.salt), flockSalt: H.r(live.reduce((a, s) => a + s.salt, 0) / live.length), toppedUp: live.filter(s => s.salt >= T.salt.want).length + '/' + live.length };
    });
  },
  // salt runs down: how long a sheep lasts, how much slower one out of salt is, and dying of it
  async saltNeed() {
    return h.page.evaluate(() => {
      const { G, T, saltPep } = GAME; H.reset(10);
      const s = G.sheep[2], days = T.salt.start.map(v => H.r(v / T.salt.perDay));
      const pep = [1, 0.75, 0.5, 0.25, 0].map(v => { s.salt = v; return H.r(saltPep(s)); });
      // a flock with no salt at all, left in the open for three days with plenty to eat
      for (const o of G.sheep) { o.salt = 0; o.hunger = 0; }
      let firstDeath = null;
      for (let k = 0; k < 3 * 24 * 10 / 0.5 && G.clock.day < 5; k++) { for (const o of G.sheep) if (!o.dead) o.hunger = 0; for (let i = 0; i < 20; i++) GAME.step(0.025); if (firstDeath === null && G.stats.salt) firstDeath = H.r((G.clock.day - 1) * 24 + G.clock.hour - 10); }
      return { daysOfSaltAtStart: days, speedAtSalt_1_075_05_025_0: pep, deathHoursRange: T.salt.deathHours, firstDeathAfterHours: firstDeath, diedOfSalt: G.stats.salt, of: G.sheep.length, lostLine: G.lost[0] && G.lost[0].why };
    });
  },
  // picked plants and salt rocks grow back
  async regrow() {
    return h.page.evaluate(() => {
      const { G, PLANTS, SALT_ROCKS, pens } = GAME; H.reset(11); H.place(H.d(), pens[1].exitX, pens[1].exitZ); H.forage(60);
      SALT_ROCKS[0].taken = true; SALT_ROCKS[0].regrowAt = GAME.absHour() + 48;
      const picked = () => PLANTS.filter(p => p.picked && p.regrowAt < 1e8).length, r = [picked()], salt = [SALT_ROCKS[0].taken];
      for (let day = 1; day <= 3; day++) { G.clock.day++; GAME.regrowPlants(); GAME.regrowSalt(); r.push(picked()); salt.push(SALT_ROCKS[0].taken); }
      return { pickedThenAfterDays: r, saltRockTakenThenAfterDays: salt };
    });
  },
  // every camp: the troughs and the salt lick can be reached from outside the fence, and tipping works there
  async allCamps() {
    return h.page.evaluate(() => {
      const { pens, sdfAt, T, troughFood } = GAME, out = [];
      for (const p of pens) {
        H.reset(12); const d = H.d(), spots = [...p.troughs, p.lick];
        const open = spots.map(o => { const a = Math.atan2(o.z - p.z, o.x - p.x), x = p.x + Math.cos(a) * (p.R + 0.6), z = p.z + Math.sin(a) * (p.R + 0.6); return sdfAt(x, z) > 0.6; });
        d.greens = T.forage.carryCap * 3; d.salt = 1;
        for (const o of spots) { const a = Math.atan2(o.z - p.z, o.x - p.x); H.place(d, p.x + Math.cos(a) * (p.R + 0.5), p.z + Math.sin(a) * (p.R + 0.5)); GAME.updateDogForage(d); }
        out.push({ camp: p.camp.name, troughs: p.troughs.length, openGroundOutside: open.every(Boolean), filled: H.r(troughFood(p)) + '/' + H.r(p.troughs.reduce((a, t) => a + t.cap, 0)), lick: H.r(p.lick.salt) });
      }
      return out;
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
