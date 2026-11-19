// Headless checks for DUCKS: `node tools/duck-test.mjs [layout|find|press|fly|bark|grab|line|sleep|stay|brood|grow|mate|imprint|prey|cougar|pop|save|reset]`.
//   layout  a few bunches a journey on every leg before Falcon Canyon (none in it or past it), by water where there's some, off the
//           trail, off the trials' ring; drakes and hens; off in ?sim
//   find    a dog comes on a bunch: found (the journey's first: the hint), once
//   press   a dog walking at them: off they go, away from it, together (a bunch); a dog lying by: they settle
//   fly     a sprint at them, a dog right on them: they flap up and off a few metres, and land
//   bark    a bark close by: they scatter, up and off
//   grab    ✊ one: carried; let go on the run: flung, it flaps down
//   line    left alone by day: off to a new spot in a line behind the leader
//   sleep   by night: asleep, huddled
//   stay    driven somewhere and left be: they stay there (home's moved)
//   brood   LIFE: ducklings trail their mum in a line as she walks (on her own march 10 m off: the bunch's own are the dice's; the line
//           3 s on, once they've sorted into it), peck round her, sleep tucked in by her; rushed, they run (can't fly)
//   grow    LIFE: a duckling grows to full size and leaves her side; old: paler, slower; then gone
//   mate    LIFE: a drake and a free hen mate (by day), she hatches a clutch by her; none past a full bunch; no drake: one comes over (or she
//           goes to them: either's dice); no prey meanwhile (out of sight by night it takes one: `prey`, `pop`)
//   imprint IMPRINT: orphans take the first dog near for their mum: trail it, unafraid (pressure, barks); grown: on their own, in a bunch;
//           a reload: still with it
//   prey    PREY: a coyote takes one asleep (the rest up and off), eats it; awake they fly up; a pounce on the coyote drops it; no alerts
//   cougar  PREY: a cougar hunts one in its range, up its tree with it; no alerts. Wild crias too (LLAMAS): no toast; ours: one
//   pop     LIFE, PREY: 30 days of it out of sight: they breed, age, die and are taken; never past the cap, never gone
//   save    a reload (JOURNEY SAVE): the same bunches, the found ones still found; every duck as it was (age, drake, mum, clutch)
//   reset   a new journey: new bunches
// Dice (SEED): where P lies and when a bunch marches off are the world's; `brood` sets her a march, `mate` keeps prey off and takes a visit
//   either way.
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
        off: G0.every(g => Math.abs(trailInfo(g.x, g.z).lat) > 5 && trialClear(g.x, g.z)), size: G0.every(g => { const n = g.list.filter(e => !GAME.duckling(e)).length; return n >= T.duck.n[0] && n <= T.duck.n[1]; }), dry: G0.every(g => !inSea(g.x, g.z) && !overWater(g.x, g.z)),
        sexes: G0.every(g => g.list.some(e => e.male && !GAME.duckling(e)) && g.list.some(e => !e.male && !GAME.duckling(e))), broods: G0.filter(g => g.list.some(e => e.mum)).length });
    }
    return out;
  });
  ok('layout: bunches on every leg before Falcon Canyon (desert, mountains, ocean, Sweetgrass)', r.seeds.every(s => s.legs.includes('0') && s.legs.includes('1') && s.legs.includes('2') && s.n >= 6), r);
  ok('layout: none in the canyon or past it', r.seeds.every(s => s.before), r);
  ok('layout: most by water; off the trail and the trials\' ring; on dry land; n a bunch', r.seeds.every(s => s.wet >= s.n / 2 && s.off && s.size && s.dry), r);
  ok('layout: LIFE: a drake and a hen in every bunch; some with a brood', r.seeds.every(s => s.sexes) && r.seeds.some(s => s.broods > 0), r);
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
    let lined = 0, goal = null, reached = false; H.run(25, () => { if (g.goal) { goal = goal || g.goal; const walk = g.list.filter(e => e.state === 'walk').length; lined = Math.max(lined, walk); }
      if (goal && Math.hypot(g.list[0].x - goal.x, g.list[0].z - goal.z) < 1) reached = true; return null; });
    return { lined, reached, moved: H.r(Math.hypot(g.list[0].x - H.P.x, g.list[0].z - H.P.z)) };
  });
  ok('line: left be, off to a new spot in a line behind the leader', r.lined >= 4 && r.reached, r);
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
    H.run(6, () => H.inp(1, 0, { creep: true }));
    H.place(d, H.P.x - 70, H.P.z - 70); H.run(9); const at = { x: g.cx, z: g.cz };   // (walked on a little, then settled)
    H.run(31);
    return { driven: H.r(Math.hypot(at.x - H.P.x, at.z - H.P.z)), moved: H.r(Math.hypot(g.hx - H.P.x, g.hz - H.P.z)), home: H.r(Math.hypot(g.hx - at.x, g.hz - at.z)), stayed: H.r(Math.hypot(g.cx - at.x, g.cz - at.z)) };
  });
  ok('stay: driven off and left be: home is where they ended up', r.driven > 4 && r.moved > 4 && r.home < 3 && r.stayed < 14, r);   // (pottering about it, within its range)
}

// a hen (and her brood) by the bunch: { g, hen, kids }
const BROOD = `H.brood = (n = 4, age = 0.5) => { const g = H.bunch(3), hen = g.list[1]; for (const e of g.list) { e.male = e === g.list[0]; e.age = 4; e.life = 12; } hen.male = false;
  const kids = []; for (let i = 0; i < n; i++) kids.push(GAME.herdMake('duck', hen.x + 0.3 * i, hen.z - 0.4, { grp: g, age, mum: hen })); GAME.updateHerds(0, 0); return { g, hen, kids }; };`;

if (want('brood')) {
  await setup();
  const r = await h.page.evaluate(`${BROOD}(() => {
    const { G } = GAME, d = H.d(), out = {}; H.place(d, H.P.x - 60, H.P.z - 60);
    let { g, hen, kids } = H.brood(4), far = 0, behind = 0, walks = 0, flew = false, on = 0;
    g.workT = -99;
    const goal = () => {   // (a march 10 m off, on dry land: how far and how soon the bunch's own go is the dice's)
      const { sdfAt, overWater, penAt } = GAME;
      for (let a = 0; a < 6.28; a += 0.2) { const x = g.cx + Math.cos(a) * 10, z = g.cz + Math.sin(a) * 10; if (sdfAt(x, z) > 2 && !overWater(x, z) && !penAt(x, z)) { g.goal = { x, z }; g.goT = 0; return; } }
    };
    H.run(30, () => {
      if (!g.goal) goal();
      const sp = Math.hypot(hen.vx, hen.vz); on = sp > 0.6 ? on + 0.025 : 0;
      if (on > 3) for (const k of kids) far = Math.max(far, Math.hypot(k.x - hen.x, k.z - hen.z));   // (once in line: she sets off through them, they sort into it)
      if (sp > 0.6) { walks++; const fx = Math.sin(hen.yaw), fz = Math.cos(hen.yaw); if (kids.every(k => (k.x - hen.x) * fx + (k.z - hen.z) * fz < 0.2)) behind++; }
      return null;
    });
    out.trail = { far: H.r(far), walks, behind };
    // pecking about: round her (no march meanwhile: when the next is, is the dice's)
    g.goal = null; g.goT = 99; H.run(8); out.round = H.r(Math.max(...kids.map(k => Math.hypot(k.x - hen.x, k.z - hen.z))));
    // rushed: they run, never fly; then back by her
    H.place(d, hen.x - 4, hen.z); H.run(3, t => { flew = flew || kids.some(k => k.fly); return H.inp(1, 0, { sprint: true }); });
    H.place(d, H.P.x - 60, H.P.z - 60); g.goT = 99; H.run(15); out.rush = { flew, back: H.r(Math.max(...kids.map(k => Math.hypot(k.x - hen.x, k.z - hen.z)))) };
    // asleep: tucked in by her
    G.clock.hour = 23; H.run(6); out.sleep = { asleep: kids.every(k => k.state === 'sleep'), tuck: H.r(Math.max(...kids.map(k => Math.hypot(k.x - hen.x, k.z - hen.z)))) };
    return out;
  })()`);
  ok('brood: ducklings trail her in a line as she walks', r.trail.far < 3.2 && r.trail.walks > 20 && r.trail.behind / r.trail.walks > 0.6, r);
  ok('brood: she pecks about: they keep round her', r.round < 1.8, r);
  ok('brood: rushed: they run (can\'t fly), then back by her', !r.rush.flew && r.rush.back < 2, r);
  ok('brood: asleep, tucked in by her', r.sleep.asleep && r.sleep.tuck < 1.1, r);
}

if (want('grow')) {
  await setup();
  const r = await h.page.evaluate(`${BROOD}(() => {
    const { G, T, HERD, duckLife, duckling, duckGrowK, duckOldK } = GAME, L = T.duck.life, d = H.d(), out = {}; H.place(d, H.P.x - 60, H.P.z - 60);
    const { g, hen, kids } = H.brood(1, 0), k = kids[0]; T.duck.life.mateP = 0;
    out.small = H.r(k.scale); out.duckling = duckling(k);
    for (let h = 0; h < L.grow * 24 + 1; h += 1) duckLife(1);
    out.grown = { scale: H.r(k.scale), mum: !!k.mum, duckling: duckling(k) };
    k.age = L.old + (k.life - L.old) * 0.6; duckLife(0.01); out.old = { k: H.r(duckOldK(k)), pep: H.r(k.pep) };
    const died = HERD.died.old; k.age = k.life - 0.01; duckLife(1); out.gone = { gone: !g.list.includes(k), died: HERD.died.old - died };
    return out;
  })()`);
  ok('grow: a duckling small, grown in its days: full size, off on its own', r.duckling && r.small < 0.5 && r.grown.scale === 1 && !r.grown.mum && !r.grown.duckling, r);
  ok('grow: old: paler, slower; at its end: gone', r.old.k > 0.3 && r.old.pep < 0.95 && r.gone.gone && r.gone.died === 1, r);
}

if (want('mate')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, HERD, duckLife, herdGroup, herdMake, updateHerds, cam } = GAME, L = T.duck.life, d = H.d(), out = {};
    H.place(d, H.P.x - 300, H.P.z - 300); cam.x = d.x; cam.z = d.z; G.clock.hour = 10;
    T.duck.prey.farP = 0;   // (out of sight by night the dice take one: the drake gone, no clutch. PREY's are `prey` / `pop`)
    const g = H.bunch(2), [dr, hen] = g.list; dr.male = true; hen.male = false; dr.age = hen.age = 4; dr.life = hen.life = 50; updateHerds(0, 0);
    let n = 0; while (!hen.clutch && n++ < 3000) duckLife(0.25);
    out.mated = !!hen.clutch; out.night = (() => { hen.clutch = 0; G.clock.hour = 23; for (let i = 0; i < 400 && !hen.clutch; i++) duckLife(0.25); const v = !!hen.clutch; G.clock.hour = 10; return v; })();
    hen.clutch = 0; dr.age = hen.age = 4; n = 0; while (!hen.clutch && n++ < 3000) duckLife(0.25);
    hen.dad = 3; dr.coat = 3; hen.coat = 0;
    for (let h = 0; h < L.incubH + 0.5; h += 0.25) duckLife(0.25);
    const kids = g.list.filter(e => e.mum === hen);
    out.hatch = { n: kids.length, by: H.r(Math.max(...kids.map(k => Math.hypot(k.x - hen.x, k.z - hen.z)))), coats: [...new Set(kids.map(k => k.coat))].every(c => c === 0 || c === 3), small: kids.every(k => k.age < 0.1) };
    // a full bunch: none
    const f = herdGroup('duck', H.P.x + 40, H.P.z, { found: true }); for (let i = 0; i < L.cap; i++) herdMake('duck', H.P.x + 40 + i * 0.3, H.P.z, { grp: f, male: i < 3, age: 4, life: 50 }); updateHerds(0, 0);
    for (let i = 0; i < 400; i++) duckLife(0.25); out.full = f.list.some(e => e.clutch > 0);
    // no drake: one comes over from a bunch near
    const a = herdGroup('duck', H.P.x + 220, H.P.z, { found: true }), b = herdGroup('duck', H.P.x + 220, H.P.z + 60, { found: true });   // (the others past `seek`)
    herdMake('duck', a.x, a.z, { grp: a, male: false, age: 4, life: 50 }); for (let i = 0; i < 2; i++) herdMake('duck', b.x + i, b.z, { grp: b, male: true, age: 4, life: 50 }); updateHerds(0, 0);
    // (each lacks what the other has: whichever's dice come up first sends one over: a drake to her, or she to them)
    const met = () => a.list.some(e => e.male) || b.list.some(e => !e.male);
    for (let i = 0; i < 400 && !met(); i++) duckLife(0.25);
    const to = a.list.some(e => e.male) ? a : b;
    out.visit = { a: a.list.length, b: b.list.length, to: to === a ? 'a' : 'b', pair: to.list.some(e => e.male) && to.list.some(e => !e.male), near: to.list.every(e => Math.hypot(e.x - to.hx, e.z - to.hz) < 3) };
    return out;
  });
  ok('mate: a drake and a free hen mate by day (not by night)', r.mated && !r.night, r);
  ok('mate: she hatches a clutch at her side, the drake\'s or her coat', r.hatch.n >= 2 && r.hatch.n <= 5 && r.hatch.by < 2 && r.hatch.coats && r.hatch.small, r);
  ok('mate: a full bunch: none', !r.full, r);
  ok('mate: no drake in her bunch: one comes over from one near (or she to them)', r.visit.pair && r.visit.a + r.visit.b === 3 && (r.visit.to === 'a' ? r.visit.a === 2 : r.visit.b === 3) && r.visit.near, r);
}

if (want('imprint')) {
  await setup();
  const r = await h.page.evaluate(`${BROOD}(() => {
    const { G, T, HERD, preyKill, duckLife, updateHerds, JOURNEY, journeySave, journeyRead, journeyResume, resetDucks } = GAME, L = T.duck.life, d = H.d(), out = {};
    H.place(d, H.P.x - 40, H.P.z); T.duck.life.mateP = 0;
    const { g, hen, kids } = H.brood(3, 0.4); H.run(2);
    preyKill(hen, 'eaten'); H.run(1);
    out.orphans = kids.every(k => k.orphan && !k.dog);
    out.far = kids.every(k => !k.dog);   // (no dog near: not yet)
    H.place(d, kids[0].x - 4, kids[0].z); d.yaw = Math.PI / 2; H.run(0.5);
    out.took = kids.every(k => k.dog === d);
    // walked off: they trail it, behind, unafraid
    let stress = 0; const ux = 1, x0 = d.x;
    H.run(8, () => { stress = Math.max(stress, ...kids.map(k => k.stress)); return H.inp(ux, 0, { creep: true }); });
    H.run(3); out.walk = { went: H.r(d.x - x0), near: H.r(Math.max(...kids.map(k => Math.hypot(k.x - d.x, k.z - d.z)))), stress: H.r(stress) };
    H.run(0.5, () => H.inp(0, 0, { bark: true })); H.run(1.5);
    out.bark = { fly: kids.some(k => k.fly), with: kids.every(k => k.dog === d), near: H.r(Math.max(...kids.map(k => Math.hypot(k.x - d.x, k.z - d.z)))) };
    // a reload: still with its dog
    JOURNEY.off = false; journeySave(); resetDucks(7); JOURNEY.saved = journeyRead(); journeyResume(); H.run(0.5);
    const back = GAME.HERDS.filter(e => e.dog === G.dogs[0]);
    out.reload = { with: back.length, near: H.r(Math.max(...back.map(k => Math.hypot(k.x - G.dogs[0].x, k.z - G.dogs[0].z)))) };
    // grown: on its own, in a bunch near (or one of its own)
    for (const k of back) k.age = L.grow - 0.01; duckLife(0.5); updateHerds(0, 0);
    out.grown = back.every(k => !k.dog && !k.orphan && k.grp && k.grp.list.includes(k) && Math.hypot(k.grp.cx - k.x, k.grp.cz - k.z) < L.settleR);
    return out;
  })()`);
  ok('imprint: her ducklings orphaned; no dog near: none yet', r.orphans && r.far, r);
  ok('imprint: a dog comes near: they take it for their mum', r.took, r);
  ok('imprint: they trail it, unafraid', r.walk.went > 8 && r.walk.near < 4 && r.walk.stress < 0.2, r);
  ok('imprint: its bark: they stay with it', !r.bark.fly && r.bark.with && r.bark.near < 4, r);
  ok('imprint: a reload: still with it', r.reload.with === 3 && r.reload.near < 8, r);
  ok('imprint: grown: on their own, in a bunch', r.grown, r);
}

if (want('prey')) {
  await setup();
  const r = await h.page.evaluate(`${BROOD}(() => {
    const { G, T, HERD, pens, setGate, spawnPack, cam } = GAME, d = H.d(), P0 = pens[0], out = {}, box = document.getElementById('toasts');
    for (const s of G.sheep) { H.place(s, P0.x + (Math.random() - 0.5) * 5, P0.z + (Math.random() - 0.5) * 5); s.pen = P0; } setGate(P0, false);
    H.place(d, H.P.x - 60, H.P.z - 60); G.clock.hour = 22; G.clock.day = 3;
    const g = H.bunch(5); H.run(3, () => { G.clock.hour = 22; });
    out.asleep = g.list.every(e => e.state === 'sleep');
    // a coyote on the hunt by them: one taken, the rest up and off; eaten; no alerts
    const p = spawnPack(2, { howl: false }), c = p.members[0]; p.members.forEach((o, i) => H.place(o, H.P.x + 6 + i * 2, H.P.z + 3)); GAME.T.duck.prey.cd = 0;
    let took = null, scattered = 0, toasts = 0, ate = HERD.died.prey;
    H.run(40, () => { G.clock.hour = 22; toasts = Math.max(toasts, box.children.length); const k = g.list.find(e => e.grabbed); if (k && !took) { took = k; scattered = g.list.filter(e => e.fly).length; } return took && !g.list.includes(took) ? true : null; });
    out.coyote = { took: !!took, scattered, eaten: HERD.died.prey - ate, gone: took && !g.list.includes(took), toasts, phase: p.phase, ff: G.ff, ar: G.coyotes.filter(o => o.prey).length };
    // awake by day: up they go (and a duckling runs)
    for (const o of G.coyotes) { o.state = 'leave'; o.gone = true; } H.run(0.1); G.clock.hour = 10;
    const B = H.brood(2, 0.3); H.run(2);
    const q = spawnPack(1, { howl: false }), c2 = q.members[0]; H.place(c2, B.hen.x + 3.5, B.hen.z); setGate(P0, false);
    let flew = 0, kidFly = false; H.run(2, () => { flew = Math.max(flew, B.g.list.filter(e => e.fly).length); kidFly = kidFly || B.kids.some(k => k.fly); });
    out.day = { flew, kidFly };
    // a pounce on the coyote: it drops it, up and off it goes
    for (const o of G.coyotes) { o.state = 'leave'; o.gone = true; } H.run(0.1); G.clock.hour = 22;
    const g3 = H.bunch(3); H.run(2, () => { G.clock.hour = 22; });
    const p3 = spawnPack(1, { howl: false }), c3 = p3.members[0]; H.place(c3, g3.cx + 4, g3.cz);
    let held = null; H.run(10, () => { G.clock.hour = 22; held = c3.prey && c3.prey.isHerd ? c3.prey : null; return held ? true : null; });   // (g3's, or one of the bunches by it)
    let saved = false; if (held) { H.place(d, c3.x - 2, c3.z); H.run(2, () => { G.clock.hour = 22; if (!held.grabbed) { saved = true; return true; } return H.inp(c3.x - d.x, c3.z - d.z, { pounce: true }); }); }
    out.saved = { held: !!held, saved, alive: !!held && !!held.grp && held.grp.list.includes(held), fled: !!held && (held.fly || held.state === 'move'), stats: G.stats.saved, toasts: box.children.length };
    return out;
  })()`);
  ok('prey: asleep at night', r.asleep, r);
  ok('prey: a coyote takes one asleep, the rest up and off; eaten, gone', r.coyote.took && r.coyote.scattered >= 2 && r.coyote.eaten === 1 && r.coyote.gone, r);
  ok('prey: none of ours: no toast; the pack hunts on (no retreat)', r.coyote.toasts === 0 && r.coyote.phase !== 'retreat', r);
  ok('prey: awake by day: up they go (ducklings run)', r.day.flew >= 2 && !r.day.kidFly, r);
  ok('prey: a pounce on the coyote drops it: up and off, alive, no "saved"', r.saved.held && r.saved.saved && r.saved.alive && r.saved.fled && r.saved.stats === 0 && r.saved.toasts === 0, r);
}

if (want('cougar')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, HERD, COUGARS, cougarTarget, cougarHunt, makeLlama, LLAMAS, llamaRemove } = GAME, d = H.d(), out = {}, box = document.getElementById('toasts');
    const k = COUGARS[0], Lr = k.lair, ux = Math.sin(Lr.yaw), uz = Math.cos(Lr.yaw);
    for (const s of G.sheep) { H.place(s, Lr.x + ux * 160, Lr.z + uz * 160); s.pen = null; s.lamb = false; }
    H.place(d, Lr.x - ux * 70, Lr.z - uz * 70); G.clock.hour = 22; G.clock.day = 3;
    H.P = { x: Lr.x + ux * 20, z: Lr.z + uz * 20 }; const g = H.bunch(4); H.run(3, () => { G.clock.hour = 22; });
    const t0 = cougarTarget(k); out.picks = g.list.includes(t0);
    const died = HERD.died.prey; cougarHunt(k, 0); let up = false, toasts = 0;
    H.run(150, () => { G.clock.hour = 22; toasts = Math.max(toasts, box.children.length); up = up || (k.prey && k.prey.isHerd && k.state === 'climb'); return HERD.died.prey > died ? true : null; });
    out.cougar = { up, eaten: HERD.died.prey - died, toasts, sheep: G.sheep.filter(s => s.dead).length };
    // LLAMAS: a wild cria taken: no toast, not counted; a guard's: both
    const cria = (tame) => { const m = makeLlama({ x: Lr.x + ux * 22, z: Lr.z + uz * 22, sex: 'f', age: 5, tame, herd: tame ? null : { id: 90 } }); const c = makeLlama({ x: Lr.x + ux * 22 + 1, z: Lr.z + uz * 22, sex: 'm', age: 0.4, tame, herd: m.herd, mum: m }); m.cdH = c.cdH = 99; if (tame) llamaRemove(m); return c; };   // (ours: no guard by it to spit the cougar off)
    for (const e of [...g.list]) GAME.herdRemove(e);
    const runCria = c => { k.state = 'perch'; k.hunts = true; k.prey = k.target = null; k.driven = 0; k.treedAt = -1e9; cougarHunt(k, 0); let t = 0, took = false, st = []; H.run(150, () => { G.clock.hour = 22; if (st.at(-1) !== k.state) st.push(k.state); t = Math.max(t, box.children.length); took = took || c.grabbed === k; return !LLAMAS.includes(c) || (took && t) ? true : null; }); return { took, gone: !LLAMAS.includes(c), toasts: t, st: st.join() }; };
    for (const el of [...box.children]) el.remove();
    out.wild = runCria(cria(0)); out.wild.lost = G.stats.criasLost;
    for (const L of [...LLAMAS]) llamaRemove(L); for (const el of [...box.children]) el.remove(); H.run(1, () => { G.clock.hour = 22; });
    const c2 = cria(2); out.ours = runCria(c2); if (LLAMAS.includes(c2)) GAME.preyKill(c2, 'cougar'); out.ours.lost = G.stats.criasLost;   // (its mum may spit it free: done for anyway)
    return out;
  });
  ok('cougar: hunts a duck in its range (the sheep far off)', r.picks, r);
  ok('cougar: up its tree with it, eaten; no toast', r.cougar.up && r.cougar.eaten === 1 && r.cougar.toasts === 0 && r.cougar.sheep === 0, r);
  ok('cougar: a wild cria taken: no toast, not counted as ours', r.wild.gone && r.wild.toasts === 0 && r.wild.lost === 0, r);
  ok('cougar: a guard\'s cria (ours): the toast, counted', r.ours.took && r.ours.toasts > 0 && r.ours.lost === 1, r);
}

if (want('pop')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, HERD, HERDS, resetDucks, updateHerds, duckLife, duckling, cam } = GAME, d = H.d(), out = { n: [] };
    resetDucks(777); H.place(d, -5000, -5000); cam.x = cam.z = -5000; updateHerds(0, 0);
    const wild = () => HERDS.filter(e => e.kind === 'duck' && !e.trial).length, n0 = wild(), born = HERD.born; let lo = 1e9, hi = 0, over = 0;
    for (let h = 0; h < 24 * 30; h++) { G.clock.hour = (h + 6) % 24; duckLife(1); const n = wild(); lo = Math.min(lo, n); hi = Math.max(hi, n); if (HERD.groups.some(g => !g.trial && g.list.length > T.duck.life.cap + T.duck.life.clutch[1])) over++; if (h % 72 === 0) out.n.push(n); }
    Object.assign(out, { n0, lo, hi, end: wild(), born: HERD.born - born, old: HERD.died.old, prey: HERD.died.prey, over, max: T.duck.max, kids: HERDS.filter(duckling).length });
    return out;
  });
  console.log(`  pop: ${r.n0} → ${r.n.join(' ')} → ${r.end} (lo ${r.lo}, hi ${r.hi}); born ${r.born}, old age ${r.old}, taken ${r.prey}`);
  ok('pop: 30 days: they breed, grow old and die, are taken', r.born > 20 && r.old > 3 && r.prey > 20, r);
  ok("pop: kept in check: never past the cap, never gone", r.hi <= r.max && r.over === 0 && r.lo >= r.n0 * 0.35 && r.end >= r.n0 * 0.4, r);
}

if (want('save')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { HERD, JOURNEY, journeySave, journeyRead, journeyResume, resetDucks } = GAME;
    resetDucks(4242); HERD.groups[1].found = true; JOURNEY.off = false; const where = HERD.groups.map(g => Math.round(g.x) + ',' + Math.round(g.z)).join(' ');
    const g0 = HERD.groups[0], hen = g0.list.find(e => !e.male); hen.clutch = 5; GAME.herdMake('duck', hen.x, hen.z, { grp: g0, age: 0.7, mum: hen }); g0.list[0].age = 8.5;
    const who = () => HERD.groups.flatMap((g, i) => g.list.map(e => [i, e.x, e.z, e.age, e.male ? 1 : 0, e.coat, e.clutch, g.list.indexOf(e.mum)]));
    const was = who();
    journeySave(); resetDucks(7); JOURNEY.saved = journeyRead(); journeyResume();
    const now = who(), diff = was.filter((a, i) => !now[i] || a.some((v, j) => Math.abs(v - now[i][j]) > 0.011));
    return { same: HERD.groups.map(g => Math.round(g.x) + ',' + Math.round(g.z)).join(' ') === where, found: HERD.groups[1].found && !HERD.groups[0].found, ducks: now.length === was.length && !diff.length, diff: diff.slice(0, 3), n: [was.length, now.length] };
  });
  ok('save: a reload: the same bunches, found ones found', r.same && r.found, r);
  ok('save: LIFE: every duck as it was (age, drake, coat, clutch, mum)', r.ducks, r);
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
