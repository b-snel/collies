// Headless checks for DUCKS: `node tools/duck-test.mjs [layout|find|press|fly|bark|grab|line|sleep|stay|save|reset]`.
//   layout  a few bunches a journey on every leg before Falcon Canyon (none in it or past it), by water where there's some, off the
//           trail, off the trials' ring; off in ?sim
//   find    a dog comes on a bunch: found (the journey's first: the hint), once
//   press   a dog walking at them: off they go, away from it, together (a bunch); a dog lying by: they settle
//   fly     a sprint at them, a dog right on them: they flap up and off a few metres, and land
//   bark    a bark close by: they scatter, up and off
//   grab    ✊ one: carried; let go on the run: flung, it flaps down
//   line    left alone by day: off to a new spot in a line behind the leader
//   sleep   by night: asleep, huddled
//   stay    driven somewhere and left be: they stay there (home's moved)
//   save    a reload (JOURNEY SAVE): the same bunches, the found ones still found
//   reset   a new journey: new bunches
import { open } from './harness.mjs';
const only = process.argv[2];
let h = null, fails = 0;
const errors = [];
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const want = k => !only || only === k;
const setup = async () => { if (h) { errors.push(...h.errors); await h.close(); } h = await open(); return h.page.evaluate(() => {
  const { G, T, step, startGame, CAM_R, CAM_F, groundY, pathPoint, herdGroup, herdMake, HERD, herdDropGroup } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.clock.hour = 10; T.duck.on = true;
  for (const g of [...HERD.groups]) herdDropGroup(g);
  const H = window.H = {};
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.d = () => G.dogs[0];
  H.place = (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); };
  H.run = (sec, fn) => { const d = H.d(); for (let t = 0; t < sec - 1e-9; t += 0.025) { if (fn) { const b = fn(t); if (b === true) return t; d.player.bot = b || { mx: 0, my: 0 }; } step(0.025); } d.player.bot = { mx: 0, my: 0 }; return sec; };
  H.P = pathPoint(170, 6);
  H.far = () => { for (const s of G.sheep) H.place(s, H.P.x + 90, H.P.z + 90); H.place(GAME.HANK, H.P.x + 60, H.P.z - 60); };
  H.bunch = (n = 5, o = {}) => { const g = herdGroup('duck', H.P.x, H.P.z, { found: true, ...o }); for (let i = 0; i < n; i++) herdMake('duck', H.P.x + (i % 3) * 0.6, H.P.z + Math.floor(i / 3) * 0.6, { grp: g }); GAME.updateHerds(0, 0); return g; };
  H.r = v => +(+v).toFixed(2);
  H.far();
  return true;
}); };

if (want('layout')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { T, HERD, resetDucks, duckWater, canyonK, sAt, CAMPS, trailInfo, trialClear, inSea, overWater } = GAME, out = { seeds: [] };
    const stop = T.canyon.s0 - T.canyon.pinch;
    for (const seed of [1, 7, 42, 1234, 99999, 5]) {
      resetDucks(seed);
      const G0 = HERD.groups.filter(g => !g.trial), legs = new Set(G0.map(g => g.leg));
      out.seeds.push({ n: G0.length, legs: [...legs].sort().join(''), before: G0.every(g => g.s < stop && canyonK(g.s) <= 0), wet: G0.filter(g => duckWater(g.x, g.z) !== null).length,
        off: G0.every(g => Math.abs(trailInfo(g.x, g.z).lat) > 5 && trialClear(g.x, g.z)), size: G0.every(g => g.list.length >= T.duck.n[0] && g.list.length <= T.duck.n[1]), dry: G0.every(g => !inSea(g.x, g.z) && !overWater(g.x, g.z)) });
    }
    return out;
  });
  ok('layout: bunches on every leg before Falcon Canyon (desert, mountains, ocean, Sweetgrass)', r.seeds.every(s => s.legs.includes('0') && s.legs.includes('1') && s.legs.includes('2') && s.n >= 6), r);
  ok('layout: none in the canyon or past it', r.seeds.every(s => s.before), r);
  ok('layout: most by water; off the trail and the trials\' ring; on dry land; n a bunch', r.seeds.every(s => s.wet >= s.n / 2 && s.off && s.size && s.dry), r);
  const off = await h.page.evaluate(() => { const { T, HERD, resetDucks } = GAME; T.duck.on = false; resetDucks(3); const n = HERD.groups.filter(g => !g.trial).length; T.duck.on = true; return n; });
  ok('layout: off in ?sim', off === 0, off);
}

if (want('find')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, HERD } = GAME, g = H.bunch(5, { found: false }), d = H.d(); HERD.seen = false;
    H.place(d, H.P.x - 40, H.P.z); H.run(0.3); const before = g.found;
    H.place(d, H.P.x - 12, H.P.z); H.run(0.3);
    return { before, found: g.found, seen: HERD.seen, hint: !!G.hints.duck };
  });
  ok('find: a dog comes on a bunch: found (the first: the hint)', !r.before && r.found && r.seen && r.hint, r);
}

if (want('press')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const g = H.bunch(5), d = H.d(), out = {};
    H.place(d, H.P.x - 7, H.P.z); const c0 = { x: g.cx, z: g.cz };
    H.run(2.5, () => H.inp(1, 0, { creep: true }));
    out.away = H.r(g.cx - c0.x); out.up = g.list.filter(e => e.fly).length;
    out.spread = H.r(Math.max(...g.list.map(e => Math.hypot(e.x - g.cx, e.z - g.cz))));
    // a dog lying by them: they settle (stress down)
    g.list.forEach(e => { e.stress = 0.6; }); H.place(d, g.cx - 5, g.cz); H.run(4, () => ({ mx: 0, my: 0, lie: true }));
    out.calm = H.r(Math.max(...g.list.map(e => e.stress)));
    return out;
  });
  ok('press: a dog creeping at them: they walk off away from it, none flying', r.away > 2 && r.up === 0, r);
  ok('press: they keep together', r.spread < 4, r);
  ok('press: a dog lying by them: they settle', r.calm < 0.35, r);
}

if (want('fly')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const g = H.bunch(5), d = H.d(); let up = 0, high = 0;
    H.place(d, H.P.x - 10, H.P.z);
    H.run(1.5, () => { up = Math.max(up, g.list.filter(e => e.fly).length); high = Math.max(high, ...g.list.map(e => e.hopY)); return H.inp(1, 0, { sprint: true }); });
    H.run(3); const down = g.list.every(e => !e.fly && e.hopY === 0);
    return { up, high: H.r(high), down };
  });
  ok('fly: a sprint right at them: up they go', r.up >= 3 && r.high > 0.5, r);
  ok('fly: and down again', r.down, r);
}

if (want('bark')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const g = H.bunch(5), d = H.d(); H.place(d, H.P.x - 4, H.P.z); H.run(0.2); let up = 0;
    H.run(0.05, () => ({ mx: 0, my: 0, bark: true })); H.run(0.8, () => { up = Math.max(up, g.list.filter(e => e.fly).length); return null; });
    return { up };
  });
  ok('bark: close by: they scatter, up and off', r.up >= 3, r);
}

if (want('grab')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const g = H.bunch(5), d = H.d(), e = g.list[0], out = {};
    H.place(d, e.x - 1.0, e.z); d.yaw = Math.PI / 2;
    out.pick = (GAME.grabPick(d) || {}).kind;
    H.run(0.2, () => ({ mx: 0, my: 0, grab: true })); out.held = e.heldBy === d;
    H.run(1, () => H.inp(0, 1, { grab: true })); out.carried = Math.hypot(e.x - d.x, e.z - d.z) < 1.6;
    H.run(0.05, () => H.inp(0, 1)); out.flung = !!e.air; H.run(3); out.down = !e.air && !e.heldBy;
    return out;
  });
  ok('grab: ✊ picks one up, carried', r.pick === 'duck' && r.held && r.carried, r);
  ok('grab: let go on the run: flung, it flaps down', r.flung && r.down, r);
}

if (want('line')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const g = H.bunch(5), d = H.d(); H.place(d, H.P.x - 60, H.P.z - 60); g.goT = 0; g.workT = -99;
    let lined = 0; H.run(25, () => { if (g.goal) { const walk = g.list.filter(e => e.state === 'walk').length; lined = Math.max(lined, walk); } return null; });
    return { lined, moved: H.r(Math.hypot(g.cx - H.P.x, g.cz - H.P.z)) };
  });
  ok('line: left be, off to a new spot in a line behind the leader', r.lined >= 4 && r.moved > 1.5, r);
}

if (want('sleep')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G } = GAME, g = H.bunch(5), d = H.d(); H.place(d, H.P.x - 60, H.P.z - 60); G.clock.hour = 23; H.run(4);
    return { asleep: g.list.filter(e => e.state === 'sleep').length, huddle: H.r(Math.max(...g.list.map(e => Math.hypot(e.x - g.cx, e.z - g.cz)))) };
  });
  ok('sleep: by night asleep, huddled', r.asleep === 5 && r.huddle < 1.6, r);
}

if (want('stay')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const g = H.bunch(5), d = H.d(); H.place(d, H.P.x - 6, H.P.z);
    H.run(6, () => H.inp(1, 0, { creep: true })); const at = { x: g.cx, z: g.cz };
    H.place(d, H.P.x - 70, H.P.z - 70); H.run(40);
    return { driven: H.r(Math.hypot(at.x - H.P.x, at.z - H.P.z)), home: H.r(Math.hypot(g.hx - at.x, g.hz - at.z)), stayed: H.r(Math.hypot(g.cx - at.x, g.cz - at.z)) };
  });
  ok('stay: driven off and left be: home is where they ended up', r.driven > 4 && r.home < 3 && r.stayed < 14, r);   // (pottering about it, within its range)
}

if (want('save')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { HERD, JOURNEY, journeySave, journeyRead, journeyResume, resetDucks } = GAME;
    resetDucks(4242); HERD.groups[1].found = true; JOURNEY.off = false; const where = HERD.groups.map(g => Math.round(g.x) + ',' + Math.round(g.z)).join(' ');
    journeySave(); resetDucks(7); JOURNEY.saved = journeyRead(); journeyResume();
    return { same: HERD.groups.map(g => Math.round(g.x) + ',' + Math.round(g.z)).join(' ') === where, found: HERD.groups[1].found && !HERD.groups[0].found };
  });
  ok('save: a reload: the same bunches, found ones found', r.same && r.found, r);
}

if (want('reset')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { HERD, resetGame, resetDucks } = GAME; resetDucks(11); const a = HERD.groups.map(g => Math.round(g.x)).join();
    resetGame(); return { differ: HERD.groups.map(g => Math.round(g.x)).join() !== a, n: HERD.groups.length };
  });
  ok('reset: a new journey: new bunches', r.differ && r.n >= 6, r);
}

if (h) { errors.push(...h.errors); await h.close(); }
ok('no page errors', errors.length === 0, errors.slice(0, 3));
process.exit(fails ? 1 : 0);
