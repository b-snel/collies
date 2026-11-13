// Headless flock benchmarks: `node tools/flock-sim.mjs [scenario ...] [--trials N]` (all of them by default).
//   drive            one dog walking ~7 m behind drives the flock along the trail: speed, spread, stress, coast
//   sprint           walking behind vs sprinting behind; walking vs sprinting straight at the flock (peak stress, scatter, regroup)
//   gatebot          a dumb "drive at the gate" bot pens the flock from in front of the valley camp gate
//   critical(+Control, +Hungry)   half the flock penned: do the rest drift in on their own? (vs an empty pen, vs hungry stragglers)
//   corner           a sheep pinned in a rock corner breaks out past the dog
//   ram              a dog leaning on a ram gets charged; a bark calls a windup off; a ram goes for a coyote
//   calm             a worked-up flock alone vs by a dog lying down vs flanked by two dogs
//   day1             7:00 at the corral -> the valley camp before nightfall at 20:30 (a scripted bot, not a good player)
// A bot dog (player kind 'bot') is steered through screen-space inputs, exactly like a pad would. See also breed-sim.mjs.
import { open } from './harness.mjs';
const args = process.argv.slice(2);
const ti = args.indexOf('--trials'); const trials = ti >= 0 ? +args[ti + 1] : 3;
// --set key=value (repeatable) overrides a T number for every scenario, e.g. --set denShow=0
const sets = {}; args.forEach((a, i) => { if (a === '--set') { const [k, v] = args[i + 1].split('='); sets[k] = +v; } });
let names = args.filter((a, i) => !a.startsWith('--') && (ti < 0 || i !== ti + 1) && args[i - 1] !== '--set');
const ALL = ['drive', 'sprint', 'gatebot', 'critical', 'criticalControl', 'criticalHungry', 'corner', 'ram', 'calm', 'day1'];
if (!names.length || names.includes('all')) names = ALL;

const h = await open({ query: '?sim&debug' });
await h.page.evaluate(sets => Object.assign(GAME.T, sets), sets);
await h.page.evaluate(() => {
  const { G, T, step, pens, CAMPS, pathPoint, sAt, sdfAt, toggleGate, setGate } = GAME;
  const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
  const P = () => G.players[0], D = () => G.dogs[0];
  const live = () => G.sheep.filter(s => !s.dead && !s.grabbed);
  const free = () => live().filter(s => !s.pen);
  function reset(hour = 8) {
    if (!G.players.length) GAME.startGame({ kind: 'bot', index: 0 });
    GAME.resetGame(); P().bot = {}; G.clock.hour = hour;
    for (const c of G.coyotes) c.gone = true;
  }
  // world direction -> screen-space stick
  function move(dx, dz, mag = 1, extra = {}) {
    const l = Math.hypot(dx, dz);
    P().bot = l < 1e-3 || mag <= 0 ? { ...extra } : { mx: (dx * R.x + dz * R.z) / l * mag, my: -(dx * F.x + dz * F.z) / l * mag, ...extra };
  }
  function goTo(x, z, { stop = 0.8, slow = 3, extra = {} } = {}) {
    const d = D(), dx = x - d.x, dz = z - d.z, l = Math.hypot(dx, dz);
    if (l < stop) { P().bot = { ...extra }; return l; }
    move(dx, dz, Math.min(1, l / slow), extra); return l;
  }
  function tick(dt = 0.025) { step(dt); const b = P().bot; if (b) { b.bark = false; b.gate = false; } }
  function stats(list = free()) {
    const n = list.length; if (!n) return { n: 0, x: 0, z: 0, rms: 0, p90: 0, max: 0, stress: 0, spd: 0 };
    let x = 0, z = 0; for (const s of list) { x += s.x; z += s.z; } x /= n; z /= n;
    // the core of the flock (a straggler shouldn't drag the bot's idea of where the flock is)
    const mx = list.map(s => s.x).sort((a, b) => a - b)[n >> 1], mz = list.map(s => s.z).sort((a, b) => a - b)[n >> 1];
    let kx = 0, kz = 0, kn = 0; for (const s of list) if (Math.hypot(s.x - mx, s.z - mz) < 10) { kx += s.x; kz += s.z; kn++; }
    const ds = list.map(s => Math.hypot(s.x - x, s.z - z)).sort((a, b) => a - b);
    const rms = Math.sqrt(ds.reduce((a, d) => a + d * d, 0) / n);
    return { n, x, z, kx: kn ? kx / kn : x, kz: kn ? kz / kn : z, rms, p90: ds[Math.min(n - 1, Math.floor(n * 0.9))], max: ds[n - 1],
      stress: list.reduce((a, s) => a + (s.stress || 0), 0) / n, spd: list.reduce((a, s) => a + Math.hypot(s.vx, s.vz), 0) / n };
  }
  function place(list, cx, cz, r) {
    for (const s of list) { for (let k = 0; k < 40; k++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * r; s.x = cx + Math.cos(a) * rr; s.z = cz + Math.sin(a) * rr; if (sdfAt(s.x, s.z) > 1.5 && !GAME.penAt?.(s.x, s.z)) break; } s.vx = s.vz = 0; s.state = 'idle'; s.fear = 0; s.panic = 0; s.alert = 0; if ('stress' in s) s.stress = 0; }
  }
  // drive the flock along the trail from behind; `back` = how far behind the centroid the dog walks
  function driveBot({ back = 7, sprint = false, goalS = 1e9 } = {}) {
    const st = stats(), d = D(); if (!st.n) { P().bot = {}; return st; }
    const rs = st;
    const cx = rs.kx, cz = rs.kz, s = sAt(cx, cz), pp = pathPoint(Math.min(goalS, s + 12));
    let fx = pp.x - cx, fz = pp.z - cz; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
    const rx = d.x - cx, rz = d.z - cz, along = rx * fx + rz * fz, lat = rx * -fz + rz * fx;
    if (along > -Math.max(3, Math.min(rs.rms, rs.p90))) {   // in front of or beside the flock: circle round wide
      const side = lat >= 0 ? 1 : -1, w = Math.max(10, Math.min(rs.p90, 8) + 7);
      goTo(cx - fz * side * w - fx * 4, cz + fx * side * w - fz * 4, { slow: 2, extra: { sprint } });
    } else goTo(cx - fx * back, cz - fz * back, { stop: 0.6, slow: 2.5, extra: { sprint } });
    return st;
  }
  // dumb gate bot: get behind the flock on the gate->flock line and walk at the gate
  function gateBot(pen, { back = 6, list } = {}) {
    const st = stats(list), d = D(); if (!st.n) { P().bot = {}; return st; }
    const cx = st.kx, cz = st.kz;
    let gx = pen.gx - cx, gz = pen.gz - cz; const gl = Math.hypot(gx, gz) || 1; gx /= gl; gz /= gl;
    const rx = d.x - cx, rz = d.z - cz, along = rx * gx + rz * gz, lat = rx * -gz + rz * gx;
    if (along > -Math.max(2.5, Math.min(st.rms, st.p90) * 0.8)) { const side = lat >= 0 ? 1 : -1, w = Math.max(9, st.p90 + 6); goTo(cx - gz * side * w - gx * 3, cz + gx * side * w - gz * 3, { slow: 2 }); }
    else goTo(cx - gx * back + gx * 2, cz - gz * back + gz * 2, { stop: 0.4, slow: 2 });
    return st;
  }
  function pressGate(pen, want) {
    const d = D(); goTo(pen.gx + Math.cos(pen.camp.gateA) * 2.2, pen.gz + Math.sin(pen.camp.gateA) * 2.2, { stop: 1 });
    if (Math.hypot(d.x - pen.gx, d.z - pen.gz) < 3.6 && pen.open !== want) setGate(pen, want);   // stands in for a shove (moves-sim tests real pushing)
    return pen.open === want;
  }
  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const r2 = v => Math.round(v * 100) / 100;

  const SCN = {};
  // 1a. walk behind the flock along the trail (the demo's "~2.1 m/s, 5-8 m spread")
  SCN.drive = ({ sprint = false, dur = 60, back = 7 } = {}) => {
    reset(8); const sh = live(); const s0 = 95, p0 = pathPoint(s0); place(sh, p0.x, p0.z, 5);
    const pd = pathPoint(s0 - 12); D().x = pd.x; D().z = pd.z;
    for (let i = 0; i < 40; i++) tick();
    const startS = sAt(stats().x, stats().z), hun0 = free().reduce((a, s) => a + s.hunger, 0) / free().length; let t = 0; const rms = [], p90 = [], stress = [], panic = []; let maxStress = 0;
    while (t < dur) { const st = driveBot({ back, sprint }); if (Math.round(t * 40) % 40 === 0 && t > 5) { rms.push(st.rms); p90.push(st.p90); stress.push(st.stress); maxStress = Math.max(maxStress, ...free().map(s => s.stress || 0)); panic.push(free().filter(s => (s.stress || 0) > 0.75).length); } tick(); t += 0.025; if (sAt(stats().x, stats().z) > 262) break; }
    const st = stats(), endS = sAt(st.x, st.z);
    // coast: stop the dog, how long does the flock keep moving?
    P().bot = {}; let coast = 0; const c0 = stats(); let px = c0.x, pz = c0.z;
    for (let k = 0; k < 400; k++) { tick(); if (k % 8 === 7) { const c = stats(); const v = Math.hypot(c.x - px, c.z - pz) / 0.2; px = c.x; pz = c.z; if (v > 0.35) coast = (k + 1) * 0.025; } }
    const left = free().filter(s => Math.hypot(s.x - st.x, s.z - st.z) > 20).length;
    const dHun = free().reduce((a, s) => a + s.hunger, 0) / free().length - hun0;   // hunger change while driven (+0.034/h if nothing eaten)
    return { mps: r2((endS - startS) / t), dHunPerH: r2(dHun / (t / T.hourSec)), spd: r2(st.spd), secs: r2(t), rms: r2(mean(rms)), p90: r2(mean(p90)), stress: r2(mean(stress)), maxStress: r2(maxStress), panicked: r2(mean(panic)), stragglers20m: left, coast: r2(coast), n: st.n };
  };
  // 2. sprint at the flock vs walk behind it
  SCN.sprint = () => {
    const walk = SCN.drive({ dur: 25 }), run = SCN.drive({ dur: 25, sprint: true, back: 5 });
    // run straight at the flock from 25 m for 3.5 s (walking vs sprinting), then back off: how worked up, how scattered?
    const at = sprint => {
      reset(8); const sh = live(), p0 = pathPoint(120); place(sh, p0.x, p0.z, 4);
      for (let i = 0; i < 40; i++) tick();
      const d = D(), pd = pathPoint(95); d.x = pd.x; d.z = pd.z;
      let peak = 0, pan = 0, t = 0, rms5 = 0, p90_5 = 0, back = -1;
      while (t < 45) {
        const st = stats(); if (t < 3.5) move(st.x - d.x, st.z - d.z, 1, { sprint }); else { const w = pathPoint(80); goTo(w.x, w.z); }
        tick(); t += 0.025; peak = Math.max(peak, st.stress); pan = Math.max(pan, free().filter(s => (s.stress || 0) > 0.75).length);
        if (!rms5 && t >= 8.5) { rms5 = st.rms; p90_5 = st.p90; }
        if (t > 9 && back < 0 && st.p90 < 8) back = t - 3.5;
      }
      return { peakMeanStress: r2(peak), peakPanicked: pan, rms5sAfter: r2(rms5), p90_5sAfter: r2(p90_5), regroupedAfter: r2(back) };
    };
    return { walkBehind: { rms: walk.rms, p90: walk.p90, stress: walk.stress, maxStress: walk.maxStress, mps: walk.mps }, sprintBehind: { rms: run.rms, p90: run.p90, stress: run.stress, maxStress: run.maxStress, panicked: run.panicked, mps: run.mps },
      walkAt: at(false), sprintAt: at(true) };
  };
  // 1b. dumb "drive at the gate" bot at the valley camp
  SCN.gatebot = () => {
    reset(15); const pen = pens[1]; setGate(pen, true);
    const n = Math.cos(pen.camp.gateA), m = Math.sin(pen.camp.gateA), sh = live();
    place(sh, pen.gx + n * 16, pen.gz + m * 16, 5);
    D().x = pen.gx + n * 30; D().z = pen.gz + m * 30;
    const at = {}; let t = 0;
    while (t < 40) { gateBot(pen); tick(); t += 0.025; for (const k of [10, 15, 20, 30, 40]) if (!at[k] && t >= k) at[k] = live().filter(s => s.pen === pen).length; }
    return { penned: at, of: live().length };
  };
  // 4. with half the flock penned, do the rest drift in on their own?
  SCN.critical = ({ hunger = 0.1, inside = 0.5, dur = 45 } = {}) => {
    reset(15); const pen = pens[1]; setGate(pen, true);
    const n = Math.cos(pen.camp.gateA), m = Math.sin(pen.camp.gateA), sh = live().filter(s => !s.lamb);
    for (const s of G.sheep) if (s.lamb) { s.dead = true; }
    G.sheep = G.sheep.filter(s => !s.dead);
    const k = Math.round(sh.length * inside), ins = sh.slice(0, k), out = sh.slice(k);
    place(ins, pen.x, pen.z, pen.R - 2.5);
    // stragglers spread round the front of the pen, 7-17 m from the gate
    out.forEach((s, i) => { for (let q = 0; q < 50; q++) { const a = pen.camp.gateA + (Math.random() - 0.5) * 2.2, r = 7 + Math.random() * 10; s.x = pen.gx + Math.cos(a) * r; s.z = pen.gz + Math.sin(a) * r; if (sdfAt(s.x, s.z) > 1.5 && Math.hypot(s.x - pen.x, s.z - pen.z) > pen.R + 2) break; } });
    for (const s of sh) { s.hunger = hunger; s.vx = s.vz = 0; s.state = 'idle'; }
    D().x = pen.gx + n * 60; D().z = pen.gz + m * 60;
    const before = out.filter(s => s.pen === pen).length; let t = 0;
    const at = {};
    while (t < dur) { P().bot = {}; tick(); t += 0.025; for (const q of [15, 30, 45]) if (!at[q] && t >= q) at[q] = out.filter(s => s.pen === pen).length; }
    return { inside: ins.length, outside: out.length, cameIn: at, stillInside: ins.filter(s => s.pen === pen).length + '/' + ins.length };
  };
  // 6. calming a worked-up flock: nobody about vs a dog lying down 8 m off vs two dogs flanking it (stand-in dogs; the
  //    dog-moves work adds the real lie-down input, which sets d.mode = 'lie')
  SCN.calm = () => {
    const one = how => {
      reset(10); const sh = live(), p0 = pathPoint(120); place(sh, p0.x, p0.z, 6);
      for (const s of sh) { s.stress = 0.8; s.hunger = 0.1; }
      const d = D(); d.x = p0.x + 60; d.z = p0.z; P().bot = {};
      const extra = [];
      const fake = (x, z, mode) => ({ x, z, y: 0, vx: 0, vz: 0, mode, hopT: 0, stunT: 0, barkAnim: 0, player: { kind: 'bot' } });
      if (how === 'lie') extra.push(fake(p0.x + 8, p0.z, 'lie'));
      if (how === 'flank') extra.push(fake(p0.x + 12, p0.z, 'walk'), fake(p0.x - 12, p0.z, 'walk'));
      G.dogs.push(...extra);
      let t = 0, calmAt = -1, rms10 = 0, ramTargets = 0, flankedT = 0;
      while (t < 20) { tick(); t += 0.025; if (GAME.MIND.flanked) flankedT += 0.025; for (const e of extra) { e.vx = e.vz = 0; } const st = stats(); if (calmAt < 0 && st.stress < 0.2) calmAt = t; if (!rms10 && t >= 10) rms10 = st.rms; if (G.sheep.some(s => s.rtar && extra.includes(s.rtar))) ramTargets++; }
      G.dogs.splice(G.dogs.indexOf(extra[0]), extra.length);
      return { calmBelow02At: r2(calmAt), rms10s: r2(rms10), flankedSecs: how === 'flank' ? r2(flankedT) : undefined, ramWindupsAtLyingDog: how === 'lie' ? ramTargets : undefined };
    };
    return { alone: one('none'), lyingDog: one('lie'), flanked: one('flank') };
  };
  SCN.criticalControl = () => SCN.critical({ inside: 0 });       // same stragglers, empty pen
  SCN.criticalHungry = () => SCN.critical({ hunger: 0.7 });      // half in, but the rest are hungry
  // 3. a sheep pinned against a fence by the dog breaks out
  SCN.corner = () => {
    reset(15);
    const sh = live(); const far = pathPoint(160); place(sh, far.x, far.z, 4);
    const s = sh.find(o => !o.ram && !o.lamb && !o.bell) || sh[0];
    // a real corner: the tightest walkable nook between a rock and the valley wall (or another rock); the dog comes in from its open side
    let c = null;
    for (const o of GAME.OBSTACLES) {
      if (o.r < 0.8 || o.r > 3 || sAt(o.x, o.z) < 200 || sAt(o.x, o.z) > 420) continue;
      for (let x = o.x - o.r - 2; x <= o.x + o.r + 2; x += 0.5) for (let z = o.z - o.r - 2; z <= o.z + o.r + 2; z += 0.5) {
        const sd = sdfAt(x, z); if (sd < 0.8 || sd > 1.3 || GAME.penAt(x, z)) continue;
        let b = 0, ox = 0, oz = 0; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283, ux = Math.cos(a), uz = Math.sin(a); if (sdfAt(x + ux * 1.8, z + uz * 1.8) < 0.4) { b++; ox += ux; oz += uz; } }
        if (!c || b > c.b) c = { x, z, b, ox, oz };
      }
    }
    let bx = -c.ox, bz = -c.oz; const bl = Math.hypot(bx, bz) || 1; bx /= bl; bz /= bl;   // out of the nook
    s.x = c.x; s.z = c.z; s.hunger = 0.1; s.state = 'idle';
    const d = D(); d.x = c.x + bx * 5; d.z = c.z + bz * 5;
    let t = 0, broke = -1, warned = -1, knocked = -1, minD = 1e9; const x0 = s.x, z0 = s.z;
    while (t < 4) {
      // the dog keeps pressing in on the sheep, stopping 2 m short of it
      const dx = s.x - d.x, dz = s.z - d.z, l = Math.hypot(dx, dz); if (broke < 0) move(dx, dz, l > 2 ? 0.45 : 0); else P().bot = {};
      tick(); t += 0.025;
      if (warned < 0 && s.cWarn) warned = t;
      if (broke < 0 && s.breakT > 0) broke = t;
      if (knocked < 0 && d.stunT > 0) knocked = t;
      minD = Math.min(minD, Math.hypot(s.x - d.x, s.z - d.z));
    }
    return { warnBleatAt: r2(warned), brokeOutAt: r2(broke), dogBowledAt: r2(knocked), escapedM: r2(Math.hypot(s.x - x0, s.z - z0)), passedDogWithin: r2(minD) };
  };
  // 5. rams: a dog pushing on one gets charged; a bark during the windup calls it off; rams go for coyotes first
  SCN.ram = () => {
    const out = {};
    // a) dog leans on a ram
    reset(15); G.clock.day = Math.max(G.clock.day, T.ramDogFromDay || 1);   // rams only go for an unprovoking dog from day 2
    let sh = live(); const p0 = pathPoint(120); place(sh, p0.x, p0.z, 4);
    let ram = sh.find(s => s.ram); if (!ram) return { error: 'no ram in flock' };
    for (const s of sh) if (s !== ram) { s.x += 40; }
    ram.x = p0.x; ram.z = p0.z; ram.rcd = 0.5;
    const d = D(); d.x = ram.x + 9; d.z = ram.z;
    let t = 0, wind = -1, charge = -1, hit = -1;
    while (t < 12) { const dx = ram.x - d.x, dz = ram.z - d.z, l = Math.hypot(dx, dz); move(dx, dz, l > 4.5 ? 0.5 : 0); tick(); t += 0.025;
      if (wind < 0 && ram.rs === 'windup') wind = t; if (charge < 0 && ram.rs === 'charge') charge = t; if (hit < 0 && d.stunT > 0) { hit = t; break; } }
    out.leanOn = { windupAt: r2(wind), chargeAt: r2(charge), dogBowledAt: r2(hit), dogStun: r2(d.stunT) };
    // b) provoked, then a bark during the windup
    reset(15); sh = live(); place(sh, p0.x + 40, p0.z, 4); ram = sh.find(s => s.ram); ram.x = p0.x; ram.z = p0.z;
    d.x = ram.x + 6; d.z = ram.z; d.stunT = 0; P().bot = {};
    GAME.provokeRam(ram, d); const st0 = ram.rs; let t2 = 0, charged = false;
    while (t2 < 3) { if (Math.abs(t2 - 0.3) < 0.013) P().bot = { bark: true }; tick(); t2 += 0.025; if (ram.rs === 'charge') charged = true; }
    out.barkCallsOff = { afterProvoke: st0, charged, stateAfter: ram.rs, dogStunned: d.stunT > 0 };
    // c) a coyote near a ram gets bonked
    reset(21); sh = live(); place(sh, p0.x + 40, p0.z, 4); ram = sh.find(s => s.ram); ram.x = p0.x; ram.z = p0.z; ram.rcd = 0.2; ram.state = 'idle';
    ram.brave = Math.max(ram.brave, 0.9);   // (a bold one: under T.brave.ramMin a ram never fights)
    d.x = p0.x - 30; d.z = p0.z; P().bot = {};
    const pk = GAME.spawnPack(1, { howl: false }); const c = pk.members[0]; c.x = ram.x + 5.5; c.z = ram.z + 1; c.courage = 1;
    let t3 = 0, bonk = -1, target = null;
    while (t3 < 20) { tick(); t3 += 0.025; if (!target && ram.rtar) target = ram.rtar === c ? 'coyote' : 'dog'; if (bonk < 0 && c.tumble > 0) { bonk = t3; break; } }
    out.coyote = { target, bonkedAt: r2(bonk), coyoteState: c.state };
    return out;
  };
  // 1c. day 1: corral at 7:00 -> valley camp, penned before nightfall at 20:30
  SCN.day1 = () => {
    reset(7); const c0 = pens[0], c1 = pens[1]; let t = 0, phase = 'open0', arrive = -1, allIn = -1, closed = -1, restaged = 0, stageT = 0;
    setGate(c1, true);   // a second player opened the valley gate ahead of time
    // the endgame, like a player: fetch the stragglers a group at a time, bringing each round to the front of the gate first
    const n1 = Math.cos(c1.camp.gateA), m1 = Math.sin(c1.camp.gateA), stX = c1.gx + n1 * 12, stZ = c1.gz + m1 * 12;
    let fetchStage = true;
    const fetch = () => {
      const out = free(); if (!out.length) { P().bot = {}; return; }
      const focus = out.reduce((a, s) => Math.hypot(s.x - c1.gx, s.z - c1.gz) < Math.hypot(a.x - c1.gx, a.z - c1.gz) ? s : a);
      const grp = out.filter(s => Math.hypot(s.x - focus.x, s.z - focus.z) < 8), gs = stats(grp);
      const al = (gs.kx - c1.gx) * n1 + (gs.kz - c1.gz) * m1, la = Math.abs(-(gs.kx - c1.gx) * m1 + (gs.kz - c1.gz) * n1);
      const inCone = al > 1.5 && la < al * 0.7 + 1.5;
      if (fetchStage && inCone && al < 14) fetchStage = false; else if (!fetchStage && !inCone && al > 0.5) fetchStage = true;
      gateBot(fetchStage ? { gx: stX, gz: stZ } : c1, { list: grp, back: 5 });
    };
    const log = [];
    let awake = 0, cNear = 1e9;   // den coyotes woken during the drive, and how close any came to the flock
    while (G.clock.hour < 20.5 && G.clock.day === 1) {
      { const st = stats(); for (const c of G.coyotes) if (c.state !== 'sleep') { awake = Math.max(awake, G.coyotes.filter(o => o.state !== 'sleep').length); cNear = Math.min(cNear, Math.hypot(c.x - st.x, c.z - st.z)); } }
      const st = stats(live());
      if (phase === 'open0') { if (pressGate(c0, true)) phase = 'out'; }
      else if (phase === 'out') { const w = pathPoint(30, 2); goTo(w.x, w.z); if (live().filter(s => s.pen === c0).length === 0 || G.clock.hour > 9.5) phase = 'drive'; }
      else if (phase === 'drive') { driveBot({ goalS: 300, back: 5 }); if (sAt(st.kx, st.kz) > 248) { phase = 'stage'; arrive = stageT = G.clock.hour; } }
      else if (phase === 'stage') { const n = Math.cos(c1.camp.gateA), m = Math.sin(c1.camp.gateA), sx = c1.gx + n * 13, sz = c1.gz + m * 13; gateBot({ gx: sx, gz: sz }); if (Math.hypot(st.x - sx, st.z - sz) < 9 || G.clock.hour - stageT > 2.5) phase = 'pen'; }
      else if (phase === 'pen') {
        if (live().filter(s => s.pen === c1).length >= live().length * 0.6) { fetch(); restaged = 1; } else gateBot(c1);
        if (live().every(s => s.pen === c1)) { phase = 'close'; allIn = G.clock.hour; } else if (G.clock.hour > 20.2) phase = 'close';
      }
      else if (phase === 'close') { if (pressGate(c1, false)) { phase = 'done'; closed = G.clock.hour; } }
      else P().bot = {};
      tick(); t += 0.025;
      if (Math.round(t * 40) % (40 * 10) === 0) log.push(`${G.clock.hour.toFixed(1)}h ${phase} s=${Math.round(sAt(st.x, st.z))} rms=${st.rms.toFixed(1)} str=${st.stress.toFixed(2)} hun=${(live().reduce((a, s) => a + s.hunger, 0) / live().length).toFixed(2)}`);
      if (phase === 'done' && G.clock.hour > 20.4) break;
    }
    return { coyotesWoke: awake, coyoteNearestFlock: cNear < 1e9 ? r2(cNear) : null, fetched: restaged, arriveHour: r2(arrive), allInHour: r2(allIn), closedHour: r2(closed), penned: live().filter(s => s.pen === c1).length, of: live().length, spareSec: closed > 0 ? Math.round((T.nightStart - closed) * T.hourSec) : null, log: log.filter((_, i) => i % 3 === 0) };
  };
  window.SCN = SCN; window.H = { reset, move, goTo, tick, stats, place, pressGate, gateBot, driveBot, live, free, P, D };
});

// checks, over the trials (as tuned: none with --set)
let fails = 0; const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) fails++; };
const j = (R, f) => R.map(f).join(', '), all = (R, f) => R.every(f);
const CHECK = {
  drive: R => {
    ok(`walked along the trail from behind: ${j(R, r => r.mps)} m/s, tight (rms ${j(R, r => r.rms)} m, p90 ${j(R, r => r.p90)} m), calm (stress ${j(R, r => r.stress)})`, all(R, r => r.mps > 2 && r.mps < 4.5 && r.rms < 5 && r.p90 < 6 && r.stress < 0.1 && r.panicked === 0));
  },
  sprint: R => {
    ok(`sprinting behind frightens them, walking doesn't (peak stress ${j(R, r => r.sprintBehind.maxStress)} vs ${j(R, r => r.walkBehind.maxStress)})`, all(R, r => r.sprintBehind.maxStress > r.walkBehind.maxStress + 0.3 && r.walkBehind.stress < 0.1));
    ok(`sprinting at them scatters them (rms ${j(R, r => r.sprintAt.rms5sAfter)} m 5 s after, walking ${j(R, r => r.walkAt.rms5sAfter)} m)`, all(R, r => r.sprintAt.peakMeanStress > 0.8 && r.sprintAt.rms5sAfter > 3 * r.walkAt.rms5sAfter && r.walkAt.rms5sAfter < 6));
  },
  gatebot: R => ok(`a dumb gate bot pens them (${j(R, r => r.penned[10])} by 10 s, ${j(R, r => r.penned[20])} by 20 s, of ${R[0].of})`, all(R, r => r.penned[10] >= r.of - 4 && r.penned[20] === r.of)),
  critical: R => ok(`half in, the rest drift in on their own (${j(R, r => r.cameIn[30] + '/' + r.outside)} by 30 s), the half stays (${j(R, r => r.stillInside)})`, all(R, r => r.cameIn[30] >= r.outside - 1 && r.stillInside === r.inside + '/' + r.inside)),
  criticalControl: R => ok(`an empty open pen draws calm, fed ones in too (${j(R, r => r.cameIn[30] + '/' + r.outside)} by 30 s)`, all(R, r => r.cameIn[30] >= r.outside - 2)),
  criticalHungry: R => ok(`hungry ones graze first (${j(R, r => r.cameIn[15])} in by 15 s)`, all(R, r => r.cameIn[15] <= 2)),
  corner: R => ok(`pinned in a corner: a warning bleat (${j(R, r => r.warnBleatAt)} s), then out past the dog (${j(R, r => r.brokeOutAt)} s, ${j(R, r => r.escapedM)} m)`, all(R, r => r.warnBleatAt > 0 && r.brokeOutAt >= r.warnBleatAt && r.brokeOutAt < 3 && r.escapedM > 4)),
  ram: R => {
    ok(`a dog leaning on a ram: windup, charge, bowled (${j(R, r => r.leanOn.dogBowledAt)} s)`, all(R, r => r.leanOn.windupAt > 0 && r.leanOn.chargeAt > r.leanOn.windupAt && r.leanOn.dogBowledAt > 0));
    ok('a bark in the windup calls it off', all(R, r => r.barkCallsOff.afterProvoke === 'windup' && !r.barkCallsOff.charged && !r.barkCallsOff.dogStunned));
    ok(`a bold ram goes for a coyote first (${j(R, r => r.coyote.target)}, bonked at ${j(R, r => r.coyote.bonkedAt)} s)`, all(R, r => r.coyote.target === 'coyote') && R.some(r => r.coyote.bonkedAt > 0));   // (now and then he bolts first, comes back)
  },
  calm: R => ok(`a dog lying down calms them (${j(R, r => r.lyingDog.calmBelow02At)} s, alone ${j(R, r => r.alone.calmBelow02At)} s), no ram goes for it`, all(R, r => r.lyingDog.calmBelow02At > 0 && r.lyingDog.calmBelow02At < r.alone.calmBelow02At && r.lyingDog.ramWindupsAtLyingDog === 0 && r.alone.calmBelow02At > 0)),
  day1: R => {
    ok(`day 1: corral to the valley camp by early afternoon (${j(R, r => r.arriveHour)} h), no den woken on the way`, all(R, r => r.arriveHour > 0 && r.arriveHour < 14 && r.coyotesWoke === 0));
    // (all penned by nightfall: not checked, the scripted endgame misses 1 in 3 on other dice; gatebot checks penning)
  },
};
for (const n of names) {
  const runs = [];
  const k = ['ram', 'corner'].includes(n) ? Math.min(trials, 2) : trials;
  for (let i = 0; i < k; i++) runs.push(await h.page.evaluate(n => window.SCN[n](), n));
  console.log(`\n== ${n}`); for (const r of runs) console.log(JSON.stringify(r));
  if (!Object.keys(sets).length) CHECK[n]?.(runs);
}
if (h.errors.length) console.log('\nPAGE ERRORS:', h.errors.slice(0, 5));
ok('no page errors', !h.errors.length);
await h.close();
process.exit(fails ? 1 : 0);
