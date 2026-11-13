// Headless checks for IDLE: a dog left alone (no input, still, mouth free) amuses itself after T.idle.after s: a poop (dropped behind it,
// then its back feet kick the grass), a pee (a puddle), chasing its tail (dizzy after), a nap (lying: calms; by day it wakes, at night
// it sleeps on). Night: mostly naps. Any input wakes it at once; nothing starts while it's busy. Poops are bones: grabbed, carried,
// thrown (SPLAT!), and Hank moans ("Drop it!" / "What's in your mouth?" / "You're disgusting!"). They go after a while, and on a new journey.
// node tools/idle-test.mjs [kinds|odds|wake|sleep|poop|hank|reset]
import { open } from './harness.mjs';
const only = process.argv[2];
let h = await open(), errors = [], fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const setup = async () => { errors.push(...h.errors); await h.close(); h = await open(); return h.page.evaluate(() => {
  const { G, T, step, startGame, groundY, CAM_R, CAM_F, pathPoint, HANK } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.clock.hour = 10; T.idle.on = true;
  const H = window.H = {};
  H.P = pathPoint(330, 6);
  H.d = G.dogs[0]; H.d.player.bot = {};
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.run = (sec, fn) => { for (let t = 0; t < sec - 1e-9; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return sec; };
  H.place = (e, x, z, yaw) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); if (yaw !== undefined) e.yaw = yaw; };
  H.away = () => { G.sheep.forEach((o, i) => H.place(o, H.P.x + 80 + (i % 6) * 2, H.P.z + 80 + Math.floor(i / 6) * 2)); H.place(HANK, H.P.x + 6, H.P.z + 3); HANK.asleep = false; HANK.goal = null; };
  H.only = k => { for (const w of [T.idle.w.day, T.idle.w.night]) for (const a of Object.keys(w)) w[a] = a === k ? 1 : 0; };
  H.r = v => +(+v).toFixed(2);
  H.place(H.d, H.P.x, H.P.z, 0.4); H.away();
  return true;
}); };
const run = name => !only || only === name;

// 1. each kind, by itself: when it starts, what it leaves, how long, the dog stays put
if (run('kinds')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, BONES, PUDDLES } = GAME, d = H.d, I = T.idle, out = {};
    for (const k of ['poop', 'pee', 'chase']) {
      H.only(k); H.place(d, H.P.x, H.P.z, 0.4); d.antic = null; d.idleT = 0; d.idleNext = I.after;
      const t0 = H.run(I.after + 2, () => d.antic), x0 = d.x, z0 = d.z, n0 = BONES.filter(b => b.poop).length, p0 = PUDDLES.length;
      const kind = d.antic, mode = []; let dur = H.run(10, () => { mode.push(d.mode); return !d.antic; });
      const poop = BONES.filter(b => b.poop).pop();
      out[k] = { t0: H.r(t0), kind, dur: H.r(dur), moved: H.r(Math.hypot(d.x - x0, d.z - z0)), poops: BONES.filter(b => b.poop).length - n0, puddles: PUDDLES.length - p0,
        behind: poop ? H.r(-((poop.x - d.x) * Math.sin(d.yaw) + (poop.z - d.z) * Math.cos(d.yaw))) : null, walk: mode.every(m => m === 'walk') };
    }
    return out;
  });
  for (const k of ['poop', 'pee', 'chase']) {
    const o = r[k];
    ok(`${k}: after ${o.t0} s idle, ${o.dur} s, the dog stays put (${o.moved} m)`, o.kind === k && o.t0 > 13 && o.t0 < 15 && o.dur > 3 && o.dur < 5 && o.moved < 0.05 && o.walk, o);
  }
  ok(`a poop drops behind it (${r.poop.behind} m)`, r.poop.poops === 1 && r.poop.behind > 0.5 && r.poop.behind < 1.2, r.poop);
  ok('a pee leaves a puddle', r.pee.puddles === 1 && r.pee.poops === 0, r.pee);
}

// 2. the odds: by day all four, at night mostly naps
if (run('odds')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T } = GAME, d = H.d, n = {};
    for (const hr of [10, 23]) {
      const c = n[hr] = { poop: 0, pee: 0, chase: 0, sleep: 0 };
      for (let i = 0; i < 400; i++) { G.clock.hour = hr; d.antic = null; d.idleT = 99; GAME.step(0.025); if (d.antic) c[d.antic]++; }
    }
    return n;
  });
  const day = r[10], night = r[23], share = c => c.sleep / Object.values(c).reduce((a, b) => a + b, 0);
  ok(`by day all four (${JSON.stringify(day)})`, Object.values(day).every(v => v > 20) && share(day) < 0.3, r);
  ok(`at night mostly naps (${Math.round(share(night) * 100)}%)`, share(night) > 0.65 && night.sleep > night.poop && night.sleep > night.pee && night.sleep > night.chase, r);
}

// 3. any input wakes it at once; busy (holding, a press, digging) nothing starts
if (run('wake')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, spawnBone } = GAME, d = H.d, p = d.player, I = T.idle, out = {};
    for (const [name, inp] of [['stick', H.inp(1, 0)], ['bark', { bark: true }], ['lie', { lie: true }], ['grab', { grab: true }]]) {
      H.only(name === 'lie' ? 'chase' : 'sleep'); H.place(d, H.P.x, H.P.z); d.antic = null; d.idleT = 99; GAME.step(0.025);
      H.run(2); const was = d.antic; p.bot = inp; GAME.step(0.025); out[name] = { was, now: d.antic }; p.bot = {}; H.run(0.3);
    }
    // holding a bone: nothing
    H.place(d, H.P.x, H.P.z, 0); const b = spawnBone(H.P.x, H.P.z + 1); p.bot = { grab: true }; GAME.step(0.025);
    out.held = d.holding === b; d.antic = null; d.idleT = 0; H.run(I.after + 3); out.heldAntic = d.antic;
    p.bot = {}; H.run(0.5); GAME.killBone(b);
    // a lone press now and then keeps it on its toes
    d.antic = null; d.idleT = 0; let any = false; H.run(40, t => { if (Math.floor(t / 10) !== Math.floor((t + 0.025) / 10)) p.bot = { bark: true }; else p.bot = {}; if (d.antic) any = true; });
    out.pressed = any;
    return out;
  });
  ok('stick moved: awake at once', r.stick.was === 'sleep' && r.stick.now === null, r);
  ok('a bark, a lie, a grab: back to work at once', r.bark.now === null && r.lie.was === 'chase' && r.lie.now === null && r.grab.now === null, r);
  ok('holding a bone: no antics', r.held && !r.heldAntic, r);
  ok('a press every 10 s: never idle long enough', !r.pressed, r);
}

// 4. the nap: round once, then lying (calms the flock); by day it wakes, at night it sleeps on
if (run('sleep')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T } = GAME, d = H.d, I = T.idle, out = {};
    H.only('sleep'); G.clock.hour = 10; d.antic = null; d.idleT = 99; GAME.step(0.025);
    out.turn = d.mode; H.run(I.turn + 0.3); out.lie = d.mode; out.dur = H.r(d.anticDur);
    out.dayWoke = H.run(I.nap[1] + 1, () => !d.antic) < I.nap[1] + 1;
    G.clock.hour = 22; d.antic = null; d.idleT = 99; GAME.step(0.025); out.nightDur = d.anticDur;
    H.run(90); out.night = d.antic; out.nightMode = d.mode;
    return out;
  });
  ok('a turn on the spot, then lying down', r.turn === 'walk' && r.lie === 'lie', r);
  ok(`by day a nap (${r.dur} s), then up`, r.dur >= 25 && r.dur <= 50 && r.dayWoke, r);
  ok('at night it sleeps on till woken', !(r.nightDur < 1e9) && r.night === 'sleep' && r.nightMode === 'lie', r);
}

// 5. poops: a bone of its own (grab, carry, throw, SPLAT), gone after a while, up to max
if (run('poop')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, BONES, spawnPoop, killBone, spawnBone } = GAME, d = H.d, p = d.player, P = T.idle.poop, out = {};
    T.idle.on = false;   // (no more of its own meanwhile)
    H.place(d, H.P.x, H.P.z, 0); const b = spawnPoop(d); out.poop = b.poop && BONES.includes(b);
    H.place(d, b.x, b.z - 1.6, 0); p.bot = {}; H.run(0.1); p.bot = { grab: true }; GAME.step(0.025);
    out.held = d.holding === b && d.holdKind === 'bone' && b.by === d;
    p.bot = H.inp(0, 1, { sprint: true, grab: true }); H.run(0.8); p.bot = H.inp(0, 1, { sprint: true }); GAME.step(0.025); p.bot = {};
    out.thrown = !b.by && Math.hypot(b.vx, b.vz) > 4;
    H.run(4, () => b.h <= 0 && Math.hypot(b.vx, b.vz) < 0.02); out.rest = b.h <= 0 && Math.hypot(b.vx, b.vz) < 0.02;
    // the same shot, a poop and a bone, into a ewe: SPLAT, less of a knock
    const ewe = G.sheep.find(s => !s.ram && !s.lamb), shot = poop => {
      H.place(ewe, H.P.x + 20, H.P.z + 20); ewe.lastBone = null;
      const o = poop ? spawnPoop(d) : spawnBone(0, 0); o.x = ewe.x - 2; o.z = ewe.z; o.h = 0.4; o.vx = 18; o.vy = 0.5; o.vz = 0; o.from = null;
      H.run(0.6, () => ewe.lastBone); const L = ewe.lastBone; killBone(o); return L ? { dv: H.r(L.dv), poop: !!L.poop } : null;
    };
    out.hitPoop = shot(true); out.hitBone = shot(false);
    // max, and gone after `life` s
    for (let i = 0; i < P.max + 4; i++) spawnPoop(d);
    out.max = BONES.filter(o => o.poop && !o.by).length;
    H.run(P.life + 1); out.left = BONES.filter(o => o.poop).length;
    out.saved = (() => { GAME.saveBones(); try { return JSON.parse(localStorage.getItem(GAME.BONE_KEY) || '[]').length; } catch (e) { return -1; } })();
    return out;
  });
  ok('a poop is a bone (b.poop)', r.poop, r);
  ok('grabbed, carried, thrown running, comes to rest', r.held && r.thrown && r.rest, r);
  ok(`a poop hit: SPLAT, lighter than a bone (Δv ${r.hitPoop && r.hitPoop.dv} vs ${r.hitBone && r.hitBone.dv})`, r.hitPoop && r.hitPoop.poop && r.hitBone && r.hitPoop.dv < r.hitBone.dv, r);
  ok(`up to ${r.max} lying, then gone after a while, never saved`, r.max === 12 && r.left === 0 && r.saved === 0, r);
}

// 6. Hank: "Drop it!" / "What's in your mouth?" on a pick, "You're disgusting!" on a throw; only what he sees; asleep: nothing
if (run('hank')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, HANK, spawnPoop, POOP_SAY } = GAME, d = H.d, p = d.player, out = {};
    const said = () => HANK.log.filter(l => l.said).map(l => l.text);
    H.place(d, H.P.x, H.P.z, 0); const b = spawnPoop(d); H.place(d, b.x, b.z - 1.6, 0); H.run(0.1);
    const n0 = said().length; p.bot = { grab: true }; GAME.step(0.025); out.pick = said().slice(n0);
    p.bot = H.inp(0, 1, { grab: true }); H.run(0.6); const n1 = said().length; p.bot = H.inp(0, 1); GAME.step(0.025); p.bot = {}; out.throw = said().slice(n1);
    H.run(3);
    // Hank asleep: nothing
    HANK.poopSaid = {}; HANK.asleep = true; const n2 = HANK.log.filter(l => l.said).length;
    H.place(d, b.x, b.z - 1.6, 0); p.bot = {}; H.run(0.1); p.bot = { grab: true }; GAME.step(0.025); p.bot = {}; H.run(0.3);
    out.asleep = HANK.log.filter(l => l.said).length - n2; HANK.asleep = false;
    // Hank far off: he doesn't see it
    HANK.poopSaid = {}; H.place(HANK, H.P.x + 150, H.P.z + 150); const n3 = said().length;
    H.place(d, b.x, b.z - 1.6, 0); H.run(0.1); p.bot = { grab: true }; GAME.step(0.025); p.bot = {}; H.run(0.3);
    out.far = said().slice(n3).filter(t => POOP_SAY.pick.includes(t)).length;
    out.lines = POOP_SAY;
    return out;
  });
  ok(`picked up: "${r.pick.join(' / ')}"`, r.pick.some(t => r.lines.pick.includes(t)), r);
  ok(`thrown: "${r.throw.join(' / ')}"`, r.throw.some(t => r.lines.throw.includes(t)), r);
  ok('Hank asleep or far off: not a word', r.asleep === 0 && r.far === 0, r);
}

// 7. a new journey: no poops or puddles, every dog awake; bones kept. Off in ?sim
if (run('reset')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, BONES, PUDDLES, spawnPoop, spawnBone, resetGame } = GAME, d = H.d, out = {};
    spawnPoop(d); spawnBone(H.P.x + 3, H.P.z); d.antic = 'sleep'; d.anticT = 3; GAME.puddleAdd(d); out.puddle0 = PUDDLES.length;
    resetGame(); H.run(0.2);
    out.poops = BONES.filter(b => b.poop).length; out.bones = BONES.filter(b => !b.poop).length; out.puddles = PUDDLES.length; out.antic = G.dogs[0].antic;
    T.idle.on = false; const e = G.dogs[0]; e.player.bot = {}; e.antic = null; e.idleT = 0; H.run(40, () => e.antic); out.off = e.antic;
    return out;
  });
  ok('new journey: no poops, no puddles, awake; the bone stays', r.puddle0 === 1 && r.poops === 0 && r.puddles === 0 && !r.antic && r.bones >= 1, r);
  ok('off (?sim default): nothing', !r.off, r);
}

errors.push(...h.errors); await h.close();
if (errors.length) { console.log('page errors:\n' + errors.join('\n')); fails++; }
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
