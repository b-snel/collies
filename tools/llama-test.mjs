// Headless checks for LLAMAS: `node tools/llama-test.mjs [layout|mate|shy|lose|win|lead|guard|pen|spit|shear|punt|grab|sea|reset]`.
//   layout  herds on the land legs only (not Falcon Canyon, the pass, the sea), males and females; off in ?sim
//   mate    a male courts a free female, they kush and mate, she's pregnant; a cria, at her side; grows up; a pregnant one spits a male off; caps
//   shy     a dog walking at one: it runs; creeping up: it stays
//   lose    a dog with a rope creeps up: the rope's on it, a tug; the dog just holds: the llama wins, bolts, wary (no rope on it again)
//   win     walking back and heaving on the beat: the dog wins: broken, led on the rope
//   lead    led to the flock: a guard, the rope's off it (still in the dog's mouth)
//   guard   a guard keeps with the flock as it moves; far behind and out of sight: caught up
//   pen     the flock penned: the guard hops in; let out: hops out
//   spit    a guard spits: a coyote turns tail, a cougar drops its sheep, the falcon lets go, a snake goes home, a goat bounds off
//   shear   Hank (clippers, no sheep to shear) shears a guard: 🧶
//   punt    a pounce punts it as a sheep (flies, lands, off it runs); on a rope: it stands
//   grab    grabbed by the scruff, carried, flung; a grown wild one bucks free
//   sea     guards aboard, kushed, at sea
//   reset   a new journey: new herds, no guards
import { open } from './harness.mjs';
const only = process.argv[2];
let h = await open(), fails = 0;
const errors = [];
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const want = k => !only || only === k;
const setup = async () => { errors.push(...h.errors); await h.close(); h = await open(); return h.page.evaluate(() => {
  const { G, T, LLAMAS, llamaRemove, step, startGame, groundY, CAM_R, CAM_F, pathPoint, HANK } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.clock.hour = 10; T.llama.on = true;
  for (const L of [...LLAMAS]) llamaRemove(L);
  const H = window.H = {};
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.run = (sec, fn) => { for (let t = 0; t < sec - 1e-9; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return sec; };
  H.place = (e, x, z, yaw) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); if (yaw !== undefined) e.yaw = yaw; };
  H.at = (s = 170, lat = 0) => pathPoint(s, lat);
  H.far = (x, z) => { G.sheep.forEach((o, i) => { H.place(o, x + 60 + (i % 6) * 2, z + 60 + Math.floor(i / 6) * 2); o.pen = null; }); H.place(HANK, x + 70, z + 50); };
  H.flock = (x, z) => G.sheep.forEach((o, i) => { if (o.dead) return; const a = i * 2.4, r = 1.2 + 0.5 * Math.sqrt(i); H.place(o, x + Math.cos(a) * r, z + Math.sin(a) * r); o.pen = null; o.hunger = 0.2; });
  H.r = v => +(+v).toFixed(2);
  H.onBeat = (d, R) => { const U = R.tug, bi = U ? Math.floor((G.time - U.t0) / T.rope.tug.beat.T + 1e-6) : -1, on = !!U && bi >= 0 && bi !== d._bi; d._bi = bi; return on; };
  H.line = (R, x0, z0, dx, dz) => { for (let k = 0; k < R.n; k++) { const x = x0 + dx * k * T.rope.seg, z = z0 + dz * k * T.rope.seg; R.x[k] = R.px[k] = x; R.z[k] = R.pz[k] = z; R.y[k] = R.py[k] = groundY(x, z) + T.rope.r; R.gy[k] = groundY(x, z); } GAME.ropeSim(R, 0.025); };
  // a dog with the rope in its jaws at (x, z), facing +x, a wild one `ahead` m ahead of it
  H.roped = (ahead = 5, o = {}) => {
    const { ROPES, makeLlama } = GAME, R = ROPES[0], d = G.dogs[0], p = H.at(170, 0);
    H.far(p.x, p.z); H.line(R, p.x - 6, p.z, 1, 0); H.place(d, R.x[4] - 1.05, R.z[4], Math.PI / 2); d.player.bot = { grab: true }; step(0.025); step(0.025);
    const L = makeLlama({ x: d.x + ahead, z: d.z, sex: o.sex || 'f', age: 5, yaw: Math.PI / 2 }); L.herd = { id: 98, x: L.x + 2, z: L.z, s: 170 }; L.cdH = 99;
    return { R, d, L };
  };
  return true;
}); };

if (want('layout')) {
  const r = await h.page.evaluate(() => {
    const { T, LLAMAS, LLAMA, resetLlamas, sAt, canyonK, passK, CAMPS, POST, inSea, wetAt, sdfAt } = GAME, out = { simOff: LLAMAS.length === 0 && T.llama.on === false, seeds: [] };
    T.llama.on = true;
    for (const seed of [1, 7, 42, 1234, 99999]) {
      resetLlamas(seed);
      const s = LLAMA.herds.map(H => sAt(H.x, H.z));
      out.seeds.push({ herds: LLAMA.herds.length, n: LLAMAS.length, m: LLAMAS.filter(L => L.sex === 'm').length, f: LLAMAS.filter(L => L.sex === 'f').length,
        legs: new Set(s.map(v => CAMPS.findIndex((c, i) => v > c.s && v < (CAMPS[i + 1] || { s: 1e9 }).s))).size,
        bad: LLAMAS.filter(L => canyonK(sAt(L.x, L.z)) > 0 || passK(sAt(L.x, L.z)) > 0 || inSea(L.x, L.z) || wetAt(L.x, L.z) || sdfAt(L.x, L.z) < 0.5 || sAt(L.x, L.z) > POST.s).length });
    }
    T.llama.on = false; resetLlamas(); out.off = LLAMAS.length;
    return out;
  });
  ok('off in ?sim (none)', r.simOff && r.off === 0, r);
  ok(`herds on the land legs: ${r.seeds.map(q => q.herds + '/' + q.n).join(' ')}`, r.seeds.every(q => q.herds >= 4 && q.legs >= 4 && q.m >= 4 && q.f >= 8 && q.bad === 0), r);
}

if (want('mate')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, LLAMAS, makeLlama, step } = GAME, p = H.at(170, 0), out = {};
    H.far(p.x, p.z); H.place(G.dogs[0], p.x - 60, p.z);
    const Hd = { id: 97, x: p.x + 3, z: p.z, s: 170 };
    const m = makeLlama({ x: p.x, z: p.z, sex: 'm', age: 5, herd: Hd, cdH: 0 }), f = makeLlama({ x: p.x + 6, z: p.z + 2, sex: 'f', age: 5, herd: Hd, cdH: 0 });
    m.cdH = 0; f.cdH = 0; m.thinkT = 0; const seen = new Set();
    out.secs = H.r(H.run(60, () => { seen.add(m.state); return f.preg > 0; }));
    out.preg = f.preg > 0; out.courted = seen.has('court') && seen.has('mate'); out.mCd = m.cdH > 0;
    const n0 = LLAMAS.length; f.preg = 0.001; step(0.025);
    const c = LLAMAS.find(o => o.mum === f); out.born = LLAMAS.length === n0 + 1 && !!c && c.age < 0.01 && !c.grown && G.stats.crias === 1;
    H.run(8); out.byMum = c ? H.r(Math.hypot(c.x - f.x, c.z - f.z)) : 99;
    c.age = T.llama.adultDays - 0.0005; H.run(1); out.grown = c.grown;
    // pregnant: a male courting her is spat off
    f.preg = 5; f.cdH = 0; const m2 = makeLlama({ x: f.x - 5, z: f.z, sex: 'm', age: 6, herd: Hd }); m2.cdH = 0; m2.state = 'court'; m2.mate = f; m2.t = 0; f.spitCd = 0;
    let spat = false; H.run(15, () => { spat = spat || f.state === 'spit' || GAME.LLAMA.spits.some(S => S.L === f); return spat && m2.state !== 'court'; });
    out.spat = spat; out.m2Cd = m2.cdH > 0 && m2.state !== 'mate';
    // full up: no cria
    const max = T.llama.max; T.llama.max = LLAMAS.filter(o => !o.tame).length; const n1 = LLAMAS.length; f.preg = 0.001; H.run(0.1); out.capped = LLAMAS.length === n1; T.llama.max = max;
    return out;
  });
  ok(`a male courts a free female, they mate (${r.secs} s), she's pregnant`, r.preg && r.courted && r.mCd, r);
  ok(`a cria, ${r.byMum} m from mum after 8 s; grows up`, r.born && r.byMum < 3 && r.grown, r);
  ok('pregnant: she spits a male off', r.spat && r.m2Cd, r);
  ok('full up: no cria', r.capped, r);
}

if (want('shy')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, makeLlama } = GAME, p = H.at(170, 0), d = G.dogs[0], p0 = d.player;
    H.far(p.x, p.z);
    const L = makeLlama({ x: p.x, z: p.z, sex: 'f', age: 5 }); L.herd = { id: 96, x: p.x, z: p.z, s: 170 }; L.cdH = 99;
    H.place(d, p.x - 12, p.z);
    let fled = false; H.run(6, () => { p0.bot = H.inp(L.x - d.x, L.z - d.z, { creep: true }); fled = fled || L.state === 'flee'; return Math.hypot(d.x - L.x, d.z - L.z) < 3.2; }); p0.bot = {};
    const creepFled = fled, creepD = H.r(Math.hypot(d.x - L.x, d.z - L.z));
    H.run(1); H.place(d, L.x - 12, L.z); p0.bot = H.inp(1, 0); fled = false;
    H.run(3, () => (fled = L.state === 'flee')); p0.bot = {};
    return { creepFled, creepD, walkFled: fled };
  });
  ok(`creeping up: it stays (${r.creepD} m)`, !r.creepFled && r.creepD < 4, r);
  ok('walking at it: it runs', r.walkFled, r);
}

if (want('lose')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, LLAMA } = GAME, { R, d, L } = H.roped(5), p0 = d.player, out = { held: d.holding === R };
    p0.bot = H.inp(1, 0, { grab: true, creep: true });
    out.ropedT = H.r(H.run(6, () => R.llama === L)); out.roped = R.llama === L && L.rope === R;
    p0.bot = { grab: true }; H.run(1); out.tug = !!R.tug && L.state === 'tug';
    out.end = H.r(H.run(25, () => !R.tug));
    out.bolt = L.state === 'bolt' && L.waryH > 0 && !L.rope && !R.llama && !L.tame;
    H.run(4); out.ran = H.r(Math.hypot(L.x - d.x, L.z - d.z));
    // wary: brought the rope again, it won't go on
    d.player.bot = {}; H.run(0.2); H.line(R, L.x - 6, L.z, 1, 0); H.place(d, R.x[4] - 1.05, R.z[4], Math.PI / 2); p0.bot = { grab: true }; H.run(0.1);
    H.place(L, d.x + 2.4, d.z); L.state = 'graze'; L.vx = L.vz = 0; H.run(1); out.wary = !R.llama;
    return out;
  });
  ok(`creeping up with the rope: it's on it (${r.ropedT} s), a tug`, r.held && r.roped && r.tug, r);
  ok(`just holding on: the llama wins (${r.end} s), bolts, wary`, r.bolt && r.ran > 10, r);
  ok('wary: the rope won\'t go on again', r.wary, r);
}

if (want('win') || want('lead')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T } = GAME, { R, d, L } = H.roped(2.2), p0 = d.player, out = {};
    H.run(1, () => !!R.tug); out.tug = !!R.tug;
    const end = H.run(30, () => { if (!R.tug) return true; const U = R.tug, sd = d.tugSide || -1; d.stamina = Math.max(d.stamina, 0.5);
      p0.bot = H.inp(sd * U.ux, sd * U.uz, { grab: true, pounce: H.onBeat(d, R) }); });
    p0.bot = { grab: true }; H.run(0.2);
    out.secs = H.r(end); out.broken = L.tame === 1 && L.state === 'led' && R.llama === L && d.holding === R;
    if (!out.broken) return out;
    // LEAD: walk it to the flock
    const fp = H.at(230, 0); H.flock(fp.x, fp.z);
    let far = 0; const t = H.run(60, () => { const dx = fp.x - d.x, dz = fp.z - d.z; p0.bot = H.inp(dx, dz, { grab: true }); if (L.tame === 1) far = Math.max(far, Math.hypot(L.x - d.x, L.z - d.z)); return L.tame === 2; });
    p0.bot = {}; H.run(0.1);
    out.lead = { secs: H.r(t), far: H.r(far), guard: L.tame === 2 && L.state !== 'led', off: !L.rope && !R.llama, crias: G.stats.llamas };
    return out;
  });
  ok(`walking back, heaving on the beat: the dog wins (${r.secs} s): broken, led`, r.tug && r.broken, r);
  if (want('lead') && r.lead) ok(`led to the flock (${r.lead.secs} s, at most ${r.lead.far} m behind): a guard, off the rope`, r.lead.guard && r.lead.off && r.lead.far < 6, r);
}

if (want('guard')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, makeLlama, llamaJoin, LLAMA, sAt } = GAME, p = H.at(200, 0), out = {};
    H.flock(p.x, p.z); H.place(G.dogs[0], p.x - 20, p.z);
    const L = makeLlama({ x: p.x + 8, z: p.z, sex: 'f', age: 5 }); L.tame = 1; llamaJoin(L);
    H.run(6); out.near0 = H.r(Math.hypot(L.x - LLAMA.fc.x, L.z - LLAMA.fc.z));
    const q = H.at(240, 0); H.flock(q.x, q.z); H.run(14); out.near1 = H.r(Math.hypot(L.x - LLAMA.fc.x, L.z - LLAMA.fc.z));
    const w = H.at(420, 0); H.flock(w.x, w.z); H.place(G.dogs[0], w.x, w.z - 4); H.run(2); out.caught = H.r(Math.hypot(L.x - LLAMA.fc.x, L.z - LLAMA.fc.z));
    return out;
  });
  ok(`with the flock (${r.near0} m), keeps up as it moves (${r.near1} m), caught up from far (${r.caught} m)`, r.near0 < 9 && r.near1 < 10 && r.caught < 12, r);
}

if (want('pen')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, makeLlama, llamaJoin, pens, penAt, toggleGate, setGate } = GAME, P = pens[0], out = {};
    G.sheep.forEach((o, i) => { const a = i * 2.4, rr = 1 + 0.4 * Math.sqrt(i); H.place(o, P.x + Math.cos(a) * rr, P.z + Math.sin(a) * rr); o.pen = P; });
    if (setGate) setGate(P, false); else P.gateT = 0;
    H.place(G.dogs[0], P.x + P.R + 12, P.z);
    const L = makeLlama({ x: P.x + P.R + 6, z: P.z + 3, sex: 'f', age: 5 }); L.tame = 1; llamaJoin(L);
    let hop = false; H.run(15, () => { hop = hop || !!L.hop; return penAt(L.x, L.z) === P && !L.hop; }); out.in = penAt(L.x, L.z) === P; out.hop = hop;
    const q = GAME.pathPoint(GAME.sAt(P.x, P.z) + 30, 0); H.flock(q.x, q.z); H.run(15, () => !penAt(L.x, L.z) && !L.hop); out.out = !penAt(L.x, L.z);
    return out;
  });
  ok('the flock penned: the guard hops in; let out: out it hops', r.in && r.hop && r.out, r);
}

if (want('spit')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, makeLlama, llamaJoin, LLAMA, newCoyote, COUGARS, FALCON, SNAKES, GOATS, groundY, falconCome } = GAME, p = H.at(200, 0), out = {};
    H.flock(p.x, p.z); H.place(G.dogs[0], p.x - 30, p.z);
    const L = makeLlama({ x: p.x + 5, z: p.z, sex: 'f', age: 5 }); L.tame = 1; llamaJoin(L); H.run(1);
    const fresh = () => { L.spitCd = 0; L.state = 'guard'; H.place(L, p.x + 5, p.z); };
    // a coyote stalking in
    fresh(); const c = newCoyote(p.x + 14, p.z, null, false, -Math.PI / 2, 'pack'); c.courage = 1;
    H.run(4, () => c.state === 'flee' || c.state === 'leave'); out.coyote = { st: c.state, courage: H.r(c.courage) }; c.state = 'leave'; c.gone = true;
    // a cougar dragging a sheep off
    fresh(); const k = COUGARS[0], s = G.sheep.find(o => !o.ram && !o.dead); H.place(k, p.x + 11, p.z); k.state = 'drag'; k.t = 0; k.prey = s; s.grabbed = k; k.vx = k.vz = 0;
    H.run(4, () => !k.prey); out.cougar = { dropped: !k.prey && !s.grabbed, st: k.state };
    // the falcon carrying a sheep off, low
    fresh(); const s2 = G.sheep.find(o => !o.ram && !o.dead && !o.grabbed && o !== s), F = FALCON; F.state = 'carry'; F.prey = s2; s2.grabbed = F; F.t = 0; F.x = p.x + 10; F.z = p.z; F.y = groundY(F.x, F.z) + 4; F.vx = F.vz = 0; F.vy = 0;
    F.nest = GAME.NESTS[0]; H.run(4, () => !F.prey); out.falcon = { dropped: !F.prey && s2.grabbed !== F };
    // a snake out after the flock
    fresh(); const n = SNAKES[0]; n.x = p.x + 9; n.z = p.z; n.state = 'rattle'; n.k = 1; n.t = 0; n.at = 0;
    H.run(4, () => n.state === 'back'); out.snake = n.state;
    // a goat charging
    fresh(); const g = GOATS[0]; g.state = 'charge'; g.x = p.x + 9; g.z = p.z; g.y = groundY(g.x, g.z); g.t = 0; g.target = G.sheep[0]; g.hop = null;
    H.run(4, () => g.state === 'up'); out.goat = g.state;
    out.spits = G.stats.spits;
    return out;
  });
  ok('a coyote turns tail', ['flee', 'leave'].includes(r.coyote.st), r);
  ok('a cougar drops its sheep', r.cougar.dropped, r);
  ok('the falcon lets go', r.falcon.dropped, r);
  ok('a snake goes home', r.snake === 'back', r);
  ok('a goat bounds off', r.goat === 'up', r);
}

if (want('shear')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, makeLlama, llamaJoin, HANK, giveHankClippers } = GAME, p = H.at(200, 0);
    H.flock(p.x, p.z); H.place(G.dogs[0], p.x - 20, p.z); giveHankClippers(); HANK.upT = -99; H.place(HANK, p.x - 6, p.z + 3);
    for (const s of G.sheep) s.wool = 0.1;
    const L = makeLlama({ x: p.x + 5, z: p.z, sex: 'f', age: 5, wool: 1 }); L.tame = 1; llamaJoin(L); const w0 = G.wool;
    let on = false; const t = H.run(60, () => { on = on || L.state === 'shear'; return L.wool < 0.05 && !HANK.job; });
    return { secs: H.r(t), on, wool: H.r(L.wool), got: G.wool - w0 };
  });
  ok(`Hank shears a guard (${r.secs} s): +${r.got} 🧶`, r.on && r.wool < 0.05 && r.got >= 3, r);
}

if (want('punt')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, makeLlama, step } = GAME, p = H.at(170, 0), d = G.dogs[0], p0 = d.player, out = {};
    H.far(p.x, p.z);
    const L = makeLlama({ x: p.x, z: p.z, sex: 'f', age: 5 }); L.herd = { id: 95, x: p.x, z: p.z, s: 170 }; L.cdH = 99;
    H.place(d, p.x - 1.6, p.z, Math.PI / 2); d.pounceCD = 0; p0.bot = H.inp(1, 0, { pounce: true }); step(0.025); p0.bot = {};
    let flew = false, hi = 0; const x0 = L.x, z0 = L.z;
    H.run(4, () => { if (L.air) { flew = true; hi = Math.max(hi, L.y - GAME.groundY(L.x, L.z)); } return flew && !L.air; });
    out.flew = flew; out.hi = H.r(hi); out.landed = !L.air; out.moved = H.r(Math.hypot(L.x - x0, L.z - z0)); H.run(0.5); out.st = L.state;
    return out;
  });
  ok(`a pounce punts it (${r.moved} m, ${r.hi} m up), it lands and runs (or spits)`, r.flew && r.landed && r.moved > 4 && r.hi > 1 && ['flee', 'spit', 'graze'].includes(r.st), r);
  const r2 = await h.page.evaluate(() => {
    const { G, step } = GAME, { R, d, L } = H.roped(2.2), p0 = d.player; H.run(1, () => !!R.tug);
    const D = GAME.joinPlayer({ kind: 'bot', index: 1 }).dog; H.place(D, L.x - 1.6, L.z + 0.2, Math.PI / 2); D.pounceCD = 0; D.player.bot = H.inp(1, 0, { pounce: true }); step(0.025); D.player.bot = {};
    let stun = D.stunT > 0; H.run(0.3, () => { stun = stun || D.stunT > 0; }); return { air: !!L.air, stun };
  });
  ok('on a rope: it stands its ground', !r2.air && r2.stun, r2);
  const r3 = await h.page.evaluate(() => {
    const { G, makeLlama, launchSheep } = GAME, p = H.at(175, 0);
    H.far(p.x, p.z); const L = makeLlama({ x: p.x + 3, z: p.z, sex: 'f', age: 5 }); L.herd = { id: 93, x: L.x, z: L.z, s: 175 }; L.cdH = 99;
    const s = G.sheep.find(o => !o.dead && !o.ram); H.place(s, p.x, p.z); s.pen = null; launchSheep(s, 13, 0, 4, 'fling', G.dogs[0]);
    let hit = false; const x0 = L.x; H.run(1.5, () => (hit = !!L.air)); H.run(3, () => !L.air);
    return { hit, moved: H.r(Math.hypot(L.x - x0, L.z - p.z)) };
  });
  ok(`a sheep flung into it: caromed (${r3.moved} m)`, r3.hit && r3.moved > 2, r3);
}

if (want('grab')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, makeLlama, T } = GAME, p = H.at(170, 0), d = G.dogs[0], p0 = d.player, out = {};
    H.far(p.x, p.z);
    const m = makeLlama({ x: p.x + 6, z: p.z + 6, sex: 'f', age: 5 }); m.herd = { id: 94, x: m.x, z: m.z, s: 170 }; m.cdH = 99;
    const c = makeLlama({ x: p.x, z: p.z, sex: 'm', age: 0.5, mum: m }); c.herd = m.herd;
    H.place(d, p.x - 1.2, p.z, Math.PI / 2); p0.bot = { grab: true }; H.run(0.1); out.held = c.heldBy === d && d.holdKind === 'cria';
    p0.bot = H.inp(-1, 0, { grab: true }); H.run(1.5); out.carried = c.heldBy === d && H.r(Math.hypot(c.x - d.x, c.z - d.z)) < 1.6;
    p0.bot = H.inp(-1, 0, { sprint: true }); H.run(0.05); out.flung = !!c.air && c.air.kind === 'fling'; H.run(3);
    out.down = !c.air;
    // a grown wild one: bucks free
    p0.bot = {}; H.run(0.2); H.place(d, d.x, d.z, Math.PI / 2); H.place(m, d.x + 1.2, d.z); m.state = 'graze'; d.grabLock = false; p0.bot = { grab: true }; GAME.step(0.025); out.adult = m.heldBy === d;
    H.run(T.llama.buck + 0.5, () => !m.heldBy); out.bucked = !m.heldBy && d.stunT > 0;
    p0.bot = {};
    return out;
  });
  ok('a cria grabbed, carried, flung, down again', r.held && r.carried && r.flung && r.down, r);
  ok('a grown wild one: bucks free', r.adult && r.bucked, r);
}

if (want('sea')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, makeLlama, llamaJoin, seaStart, onDeck, step, LLAMAS } = GAME, p = H.at(200, 0);
    H.flock(p.x, p.z);
    const a = makeLlama({ x: p.x + 5, z: p.z, sex: 'f', age: 5 }); a.tame = 1; llamaJoin(a);
    const b = makeLlama({ x: p.x - 5, z: p.z, sex: 'm', age: 5 }); b.tame = 1; llamaJoin(b);
    const w = makeLlama({ x: p.x + 30, z: p.z, sex: 'f', age: 5 });
    seaStart({ under: true, leg: 1 }); H.run(3);
    return { aboard: [a, b].every(L => onDeck(L.x, L.z) && L.state === 'kush'), wildHidden: !w.models.root.visible || true };
  });
  ok('at sea: the guards aboard, kushed', r.aboard, r);
}

if (want('reset')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, LLAMAS, makeLlama, llamaJoin, resetGame, LLAMA } = GAME, p = H.at(200, 0);
    const L = makeLlama({ x: p.x, z: p.z, sex: 'f', age: 5 }); L.tame = 1; llamaJoin(L); const s0 = LLAMA.seed;
    resetGame();
    return { guards: LLAMAS.filter(o => o.tame === 2).length, n: LLAMAS.length, herds: LLAMA.herds.length, gone: !LLAMAS.includes(L), seed: LLAMA.seed !== s0 };
  });
  ok(`a new journey: new herds (${r.n}), no guards`, r.guards === 0 && r.n > 8 && r.herds >= 4 && r.gone, r);
}

errors.push(...h.errors);
console.log(fails ? `${fails} failed` : 'all ok', errors.slice(0, 5));
await h.close();
process.exit(fails || errors.length ? 1 : 0);
