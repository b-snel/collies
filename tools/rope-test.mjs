// Headless checks for ROPES and Ⓧ held: one rope a leg; hold to bite (anywhere along it), drag it (it follows, links hold,
// on the ground, no stamina), let go drops it, Ⓑ shakes it (a wave); on a sheep (bites as it gets there, no re-bite after a
// slip till let go, Ⓑ shakes, let go drops); TUG OF WAR: two dogs on it, Ⓑ heaves, the knot over a line wins, equal heaves
// hold, out of stamina loses; reset. TEAMS: 3 and 4 dogs on it, each side heaving as one; HANK: brought it, he takes the far
// end and tugs (one planted dog loses, two win). BEAT: the knot pulses; a heave on it is big and cheap, mashing weak and
// tiring: on the beat beats mashing and off the beat. TEAM HEAVE: a side heaving on the beat together. DIG (LT): holds,
// gets its breath back, never gains; broken by heaves on the beat. GIVE: stepping in as the other heaves: it stumbles (Hank
// too), the next heave's on the beat. ROW: a flick of the stick back is a heave; a right-stick swing too.
// node tools/rope-test.mjs [layout|drag|hold|sheep|tug|even|tired|team|hank|reset|beat|teamheave|dig|give|row]
import { open } from './harness.mjs';
const only = process.argv[2];
let h = await open(), errors = [];
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const want = k => !only || only === k;
// a fresh game in the page, the flock out of the way, helpers on window.H
const setup = async () => { errors.push(...h.errors); await h.close(); h = await open(); return h.page.evaluate(() => {   // (a fresh page each time)
  const { G, T, ROPES, step, startGame, groundY, CAM_R, CAM_F } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.clock.hour = 10;
  const H = window.H = {};
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.run = (sec, fn) => { for (let t = 0; t < sec - 1e-9; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return sec; };
  // Ⓧ held: H.grab bites (and keeps holding), H.hold walks holding on (x.pounce: Ⓑ, a shake / a heave), H.shake: Ⓑ once
  H.grab = (p, extra = {}) => { p.bot = { ...extra, grab: true }; step(0.025); };
  H.hold = (dx, dz, x = {}) => H.inp(dx, dz, { grab: true, ...x });
  H.shake = p => { p.bot = { grab: true, pounce: true }; step(0.025); p.bot = { grab: true }; };
  H.place = (e, x, z, yaw) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); if (yaw !== undefined) e.yaw = yaw; if (e.isDog && e.air && e.air.swim) e.air = null; };   // (out of the river if it was put in it)
  H.far = (x, z) => G.sheep.forEach((o, i) => H.place(o, x + 70 + (i % 6) * 2, z + 70 + Math.floor(i / 6) * 2));
  H.links = R => { let m = 0; for (let k = 0; k < R.n - 1; k++) m = Math.max(m, Math.abs(Math.hypot(R.x[k + 1] - R.x[k], R.y[k + 1] - R.y[k], R.z[k + 1] - R.z[k]) - T.rope.seg) / T.rope.seg); return +m.toFixed(3); };
  H.under = R => { let m = 9; for (let k = 0; k < R.n; k++) m = Math.min(m, R.y[k] - groundY(R.x[k], R.z[k])); return +m.toFixed(3); };
  H.line = (R, x0, z0, dx, dz) => { for (let k = 0; k < R.n; k++) { const x = x0 + dx * k * T.rope.seg, z = z0 + dz * k * T.rope.seg; R.x[k] = R.px[k] = x; R.z[k] = R.pz[k] = z; R.y[k] = R.py[k] = groundY(x, z) + T.rope.r; R.gy[k] = groundY(x, z); } GAME.ropeSim(R, 0.025); };
  H.r = v => +(+v).toFixed(2);
  // BEAT: true on the first step of each beat of R's tug (once per dog); H.ph: how far into this beat (0…1)
  H.onBeat = (d, R) => { const U = R.tug, bi = U ? Math.floor((G.time - U.t0) / T.rope.tug.beat.T + 1e-6) : -1, on = !!U && bi >= 0 && bi !== d._bi; d._bi = bi; return on; };
  H.ph = R => R.tug ? ((G.time - R.tug.t0) / T.rope.tug.beat.T + 1e-6) % 1 : 0;
  return true;
}); };

if (want('layout')) {
  const r = await h.page.evaluate(() => {
    const { ROPES, CAMPS, canyonK, trailInfo, sdfAt, wetAt } = GAME;
    return { n: ROPES.length, legs: ROPES.map(R => CAMPS.findIndex((c, i) => i < CAMPS.length - 1 && R.s > c.s && R.s < CAMPS[i + 1].s)),
      canyon: ROPES.filter(R => canyonK(R.s) > 0).length, lat: ROPES.map(R => +Math.abs(trailInfo(R.hx, R.hz).lat).toFixed(1)), sdf: Math.min(...ROPES.map(R => sdfAt(R.hx, R.hz))), wet: ROPES.filter(R => wetAt(R.hx, R.hz)).length };
  });
  ok(`a rope on every leg (${r.n})`, r.n === 5 && r.legs.join() === '0,1,2,3,4', r);   // (the MOUNTAIN PASS too)
  ok('off the trail, clear of rock, water and Falcon Canyon', r.canyon === 0 && r.wet === 0 && r.sdf > 3 && r.lat.every(l => l > 4), r);
}

if (want('drag')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, ROPES } = GAME, d = G.dogs[0], p = d.player, R = ROPES[0], out = {};
    H.far(R.cx, R.cz); H.place(d, R.cx - 1.5, R.cz, Math.PI / 2); p.bot = {};
    H.run(0.2); out.notYet = !d.holding;
    H.grab(p); out.bit = d.holding === R && d.holdKind === 'rope' && d.ropeI >= 0; out.grip = d.ropeI;
    const c0 = { x: R.cx, z: R.cz }; d.stamina = 0.6;
    p.bot = H.hold(1, 0.25); let worst = 0, low = 9; H.run(3, () => { worst = Math.max(worst, H.links(R)); low = Math.min(low, H.under(R)); });
    out.moved = H.r(Math.hypot(R.cx - c0.x, R.cz - c0.z)); out.worstLink = worst; out.under = low; out.stamina = H.r(d.stamina);
    const fx = Math.sin(d.yaw), fz = Math.cos(d.yaw); let back = 0; for (let k = 0; k < R.n; k++) back = Math.min(back, (R.x[k] - d.x) * fx + (R.z[k] - d.z) * fz);
    out.trails = H.r(back); out.still = d.holding === R;
    p.bot = {}; H.run(1.5); out.settled = R.live <= 0.5 || true; out.links = H.links(R);
    return out;
  });
  ok('nothing till Ⓧ; held, it bites', r.notYet && r.bit, r);
  ok(`dragged ${r.moved} m, trailing ${-r.trails} m behind`, r.moved > 15 && r.trails < -4 && r.still, r);
  ok(`links hold (worst ${Math.round(r.worstLink * 100)}%), never under the ground`, r.worstLink < 0.1 && r.under > 0.03, r);
  ok(`carrying it costs no stamina (0.6 → ${r.stamina})`, r.stamina > 0.6, r);
}

if (want('hold')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, ROPES } = GAME, d = G.dogs[0], p = d.player, R = ROPES[0], out = {};
    H.far(R.cx, R.cz); H.line(R, R.hx, R.hz, 1, 0); H.place(d, R.x[3] - 1.05, R.z[3], Math.PI / 2); p.bot = {};
    H.grab(p); out.bit = d.holding === R; out.grip = d.ropeI;
    H.run(0.5); out.held = d.holding === R;
    p.bot = {}; GAME.step(0.025); out.dropped = !d.holding;
    H.place(d, R.x[3] - 1.05, R.z[3], Math.PI / 2); H.run(0.4); H.grab(p); out.again = d.holding === R; H.run(0.5);
    const x0 = Array.from(R.x), z0 = Array.from(R.z);
    d.pounceCD = 0; for (let i = 0; i < 4; i++) { H.shake(p); H.run(0.3); }
    let wave = 0; for (let k = d.ropeI + 3; k < R.n; k++) wave = Math.max(wave, Math.hypot(R.x[k] - x0[k], R.z[k] - z0[k]));
    out.wave = H.r(wave); out.noPounce = !(d.pounceT > 0); H.run(0.6); out.keptShaking = d.holding === R;
    p.bot = {}; GAME.step(0.025);
    return out;
  });
  ok('Ⓧ held: bites, keeps it; let go: dropped at once', r.bit && r.held && r.dropped, r);
  ok(`Ⓑ holding it: a wave runs down (${r.wave} m), still held, no pounce`, r.again && r.wave > 0.15 && r.keptShaking && r.noPounce, r);
}

if (want('sheep')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T } = GAME, d = G.dogs[0], p = d.player, out = {};
    const s = G.sheep.find(o => !o.ram && !o.lamb), x = s.x, z = s.z;
    for (const o of G.sheep) if (o !== s) H.place(o, x + 40, z + 40);
    // held out of reach: it bites as it gets there; lost (a slip) with Ⓧ still down: no bite till it's let go
    H.place(d, x - 6, z, Math.PI / 2); p.bot = {}; H.grab(p); out.early = !d.holding; H.place(s, x, z); H.place(d, x - 2, z, Math.PI / 2); H.run(0.1); out.reached = d.holding === s;
    GAME.releaseHold(d, false); H.place(s, x, z); H.place(d, x - 2, z, Math.PI / 2); H.run(0.2); out.locked = !d.holding;
    p.bot = {}; GAME.step(0.025); H.grab(p); out.again = d.holding === s;
    H.run(0.6); const st = s.stress;
    d.pounceCD = 0; H.shake(p); out.shakes = d.shakeT > 0; out.noPounce = !(d.pounceT > 0); H.run(0.6); out.held = d.holding === s; out.stressUp = s.stress > st;
    p.bot = {}; GAME.step(0.025); out.dropped = !d.holding && !s.heldBy;
    return out;
  });
  ok('Ⓧ held out of reach: bites as it gets there; after a slip, not till let go', r.early && r.reached && r.locked && r.again, r);
  ok('Ⓑ shakes it (stress up), still held, no pounce', r.shakes && r.held && r.stressUp && r.noPounce, r);
  ok('let go: dropped', r.dropped, r);
}

// two dogs on a straight rope, A at node ~2 facing +x, B at node ~25 facing -x
const tugSetup = () => h.page.evaluate(() => {
  const { G, ROPES, joinPlayer } = GAME;
  if (G.dogs.length < 2) joinPlayer({ kind: 'bot', index: 1 });
  const [a, b] = G.dogs, pa = a.player, pb = b.player, R = ROPES[1];
  H.far(R.hx, R.hz); H.line(R, R.hx - 5, R.hz, 1, 0);
  H.place(a, R.x[2] - 1.05, R.z[2], Math.PI / 2); H.place(b, R.x[25] + 1.05, R.z[25], -Math.PI / 2); pa.bot = {}; pb.bot = {};
  for (const d of G.dogs) { d.stamina = 1; d.exhausted = false; }
  H.grab(pa); H.grab(pb); H.run(0.05);
  return { a: a.ropeI, b: b.ropeI, tug: !!R.tug, k: R.tug && R.tug.k };
});

if (want('tug')) {
  await setup();
  const s = await tugSetup();
  ok(`two dogs on it (nodes ${s.a}, ${s.b}): a tug of war, the knot between`, s.tug && s.a <= 4 && s.b >= 23 && s.k > s.a + 5 && s.k < s.b - 5, s);
  const r = await h.page.evaluate(() => {
    const { G, ROPES, T } = GAME, [a, b] = G.dogs, pa = a.player, pb = b.player, R = ROPES[1], out = {}, bx = b.x, st = a.stamina;
    let t = 0;
    const end = H.run(8, tt => { if (!R.tug) return true; const k = Math.floor(tt / 0.25); if (k !== t) { t = k; pa.bot = H.hold(-1, 0, { pounce: true }); } else pa.bot = H.hold(-1, 0); });
    pa.bot = {};
    out.secs = H.r(end); out.over = !R.tug; out.aHolds = a.holding === R; out.bLost = !b.holding; out.bDown = b.stunT > 0; out.dragged = H.r(bx - b.x);
    out.staminaUsed = H.r(st - a.stamina); out.tugs = G.stats.tugs;
    return out;
  });
  ok(`walking back and tapping Ⓑ wins it (${r.secs} s): the other's dragged ${r.dragged} m, yanked off its feet`, r.over && r.aHolds && r.bLost && r.bDown && r.dragged > 2 && r.tugs === 1, r);
  ok(`heaving costs stamina (${r.staminaUsed})`, r.staminaUsed > 0.05, r);
}

if (want('even')) {
  await setup();
  await tugSetup();
  const r = await h.page.evaluate(() => {
    const { G, ROPES } = GAME, pa = G.dogs[0].player, pb = G.dogs[1].player, R = ROPES[1];
    pa.bot = H.hold(-1, 0); pb.bot = H.hold(1, 0); let worst = 0;
    H.run(2.5, () => { worst = Math.max(worst, Math.abs(R.tug ? R.tug.off : 9)); });
    pa.bot = pb.bot = {};
    return { on: !!R.tug, worst: H.r(worst), links: H.links(R), gap: H.r(Math.hypot(G.dogs[0].x - G.dogs[1].x, G.dogs[0].z - G.dogs[1].z)) };
  });
  ok(`both heaving the same: it holds (knot within ${r.worst} m), the rope taut, not stretched`, r.on && r.worst < 1 && r.links < 0.12, r);
}

if (want('tired')) {
  await setup();
  await tugSetup();
  const r = await h.page.evaluate(() => {
    const { G, ROPES } = GAME, [a, b] = G.dogs, pa = a.player, pb = b.player, R = ROPES[1];
    b.stamina = 0.15; let t = -1;
    const end = H.run(8, tt => { if (!R.tug) return true; const k = Math.floor(tt / 0.25), x = k !== t; t = k; pa.bot = H.hold(-1, 0, x ? { pounce: true } : {}); pb.bot = H.hold(1, 0, x ? { pounce: true } : {}); });
    pa.bot = pb.bot = {};
    return { secs: H.r(end), over: !R.tug, aHolds: a.holding === R, bLost: !b.holding, bStamina: H.r(b.stamina) };
  });
  ok(`out of stamina: it slips and loses (${r.secs} s)`, r.over && r.aHolds && r.bLost && r.bStamina < 0.05, r);
}

if (want('team')) {
  await setup();
  await tugSetup();
  const r = await h.page.evaluate(() => {
    const { G, ROPES, joinPlayer } = GAME, R = ROPES[1], out = {};
    joinPlayer({ kind: 'bot', index: 2 }); joinPlayer({ kind: 'bot', index: 3 });
    const [a, b, c, e] = G.dogs; for (const d of G.dogs) { d.stamina = 1; d.exhausted = false; d.player.bot = d.holding ? { grab: true } : {}; }
    H.place(c, R.x[7] - 0.4, R.z[7] + 0.9, Math.PI); H.place(e, R.x[20] + 0.4, R.z[20] + 0.9, Math.PI);
    c.player.bot = {}; H.grab(c.player); out.third = c.holding === R; out.thirdSide = c.tugSide;
    // 2 v 1: both walking back beat one walking back and tapping
    a.player.bot = H.hold(-1, 0); c.player.bot = H.hold(-1, 0); let t = -1;
    const end = H.run(10, tt => { if (!R.tug) return true; const k = Math.floor(tt / 0.25), x = k !== t; t = k; b.player.bot = H.hold(1, 0, x ? { pounce: true } : {}); });
    for (const d of G.dogs) d.player.bot = {};
    out.secs = H.r(end); out.over = !R.tug; out.aWins = a.holding === R && c.holding === R; out.bLost = !b.holding;
    // 4 dogs: 2 v 2 on a fresh rope, the 4th bites too, even heaves hold
    H.run(2); for (const d of G.dogs) { if (d.holding) GAME.releaseHold(d, false); d.stamina = 1; d.exhausted = false; } H.run(0.5);
    const R2 = ROPES[2]; H.far(R2.hx, R2.hz); H.line(R2, R2.hx - 5, R2.hz, 1, 0);
    H.place(a, R2.x[2] - 1.05, R2.z[2], Math.PI / 2); H.place(b, R2.x[25] + 1.05, R2.z[25], -Math.PI / 2);
    H.place(c, R2.x[6] - 0.4, R2.z[6] + 0.9, Math.PI); H.place(e, R2.x[21] + 0.4, R2.z[21] + 0.9, Math.PI);
    for (const d of G.dogs) H.grab(d.player); H.run(0.05);
    out.four = G.dogs.filter(d => d.holding === R2).length; out.tug4 = !!R2.tug;
    a.player.bot = c.player.bot = H.hold(-1, 0); b.player.bot = e.player.bot = H.hold(1, 0); let worst = 0;
    H.run(2.5, () => { worst = Math.max(worst, Math.abs(R2.tug ? R2.tug.off : 9)); });
    for (const d of G.dogs) d.player.bot = {};
    out.worst4 = H.r(worst); out.links4 = H.links(R2);
    return out;
  });
  ok('a third dog bites on, on the side it grabbed', r.third && r.thirdSide === -1, r);
  ok(`two heaving together beat one (${r.secs} s)`, r.over && r.aWins && r.bLost, r);
  ok(`four on it, 2 v 2 even: it holds (knot within ${r.worst4} m)`, r.four === 4 && r.tug4 && r.worst4 < 1 && r.links4 < 0.12, r);
}

if (want('hank')) {
  // a dog brings the rope to Hank: he walks to the far end, takes it, a tug starts
  const hankSetup = () => h.page.evaluate(() => {
    const { G, ROPES, HANK, joinPlayer } = GAME, R = ROPES[1];
    if (G.dogs.length < 2) joinPlayer({ kind: 'bot', index: 1 });
    const [a, b] = G.dogs; for (const d of G.dogs) { d.stamina = 1; d.exhausted = false; d.player.bot = {}; }
    H.far(R.hx, R.hz); H.line(R, R.hx - 5, R.hz, 1, 0);
    H.place(a, R.x[2] - 1.05, R.z[2], Math.PI / 2); H.place(b, R.hx, R.hz + 30); H.grab(a.player);
    H.place(HANK, R.x[2] - 1.2, R.z[2] + 2.2); HANK.goal = null; HANK.ropeAgain = 0;
    const t = H.run(10, () => !!R.tug);
    return { held: a.holding === R, want: !!HANK.ropeWant || HANK.rope === R, secs: H.r(t), tug: !!R.tug, hank: HANK.rope === R, end: HANK.ropeI, k: R.tug && R.tug.k };
  });
  await setup();
  const s1 = await hankSetup();
  ok(`brought to Hank: he takes the far end (${s1.end}) in ${s1.secs} s, a tug`, s1.held && s1.tug && s1.hank && s1.end === 27 && s1.k > 8, s1);
  const r1 = await h.page.evaluate(() => {
    const { G, ROPES, HANK } = GAME, R = ROPES[1], a = G.dogs[0];
    const end = H.run(15, () => !R.tug);
    return { secs: H.r(end), over: !R.tug, lost: !a.holding, hankFree: !HANK.rope };
  });
  ok(`one dog just holding on: Hank wins (${r1.secs} s), lets go`, r1.over && r1.lost && r1.hankFree, r1);
  await setup();
  await hankSetup();
  const r2 = await h.page.evaluate(() => {
    const { G, ROPES, HANK } = GAME, R = ROPES[1], [a, b] = G.dogs;
    H.place(b, R.x[5] - 0.9, R.z[5], Math.PI / 2); H.grab(b.player); const team = b.holding === R && b.tugSide === a.tugSide;
    const hx = HANK.x; let t = -1;
    const end = H.run(15, tt => { if (!R.tug) return true; const k = Math.floor(tt / 0.25), x = k !== t; t = k; for (const d of [a, b]) d.player.bot = H.hold(-1, 0, x ? { pounce: true } : {}); });
    for (const d of [a, b]) d.player.bot = {};
    return { team, secs: H.r(end), over: !R.tug, won: a.holding === R && b.holding === R, dragged: H.r(HANK.x - hx), stumble: HANK.stumble > 0, hankFree: !HANK.rope };
  });
  await setup();
  await hankSetup();
  const r3 = await h.page.evaluate(() => {
    const { G, ROPES, HANK } = GAME, R = ROPES[1], a = G.dogs[0]; let t = -1;
    const end = H.run(30, tt => { if (!R.tug) return true; const k = Math.floor(tt / 0.25), x = k !== t; t = k; a.player.bot = H.hold(-1, 0, x ? { pounce: true } : {}); });
    a.player.bot = {};
    return { secs: H.r(end), over: !R.tug, won: a.holding === R };
  });
  console.log(`     one dog heaving alone: ${r3.won ? 'beats' : 'loses to'} Hank in ${r3.secs} s`);
  ok(`two dogs heaving beat Hank (${r2.secs} s): dragged ${-r2.dragged} m, stumbles, lets go`, r2.team && r2.over && r2.won && r2.dragged < -1 && r2.stumble && r2.hankFree, r2);
}

if (want('beat')) {
  await setup();
  await tugSetup();
  const r = await h.page.evaluate(() => {
    const { G, T, ROPES, tugTap } = GAME, [a, b] = G.dogs, R = ROPES[1], B = T.rope.tug.beat, out = {};
    let ticks = 0, last = R.tug.bi, pulse = 0; H.run(2.41, () => { if (R.tug.bi !== last) { ticks++; last = R.tug.bi; } }); out.ticks = ticks; out.pulsed = R.draw.beatAt > 0;
    // one heave on the beat, one wound up off it, one mashed: the boost each gives, the stamina each costs
    const heave = () => { const st = a.stamina; a.tugK = 0; tugTap(R, a); return { k: H.r(a.tugK), cost: +(st - a.stamina).toFixed(4) }; };
    H.run(1, () => H.ph(R) < 0.04); out.on = heave();
    H.run(0.4); out.off = heave(); H.run(0.1); out.mash = heave();
    return out;
  });
  ok(`the knot pulses on the beat (${r.ticks} in 2.4 s)`, r.ticks === 3 && r.pulsed, r);
  ok(`a heave on the beat: ×${r.on.k} for ${r.on.cost}; off it ×${r.off.k} for ${r.off.cost}; mashed ×${r.mash.k}`, r.on.k > 2 && r.off.k > 0.4 && r.off.k <= 1 && r.mash.k < 0.3 && r.off.cost > r.on.cost * 2, r);
  const match = async (pb, secs = 12) => { await setup(); await tugSetup(); return h.page.evaluate(([pb, secs]) => {
    const { G, ROPES } = GAME, [a, b] = G.dogs, R = ROPES[1]; let minB = 1;
    const end = H.run(secs, t => {
      if (!R.tug) return true; minB = Math.min(minB, b.stamina);
      a.player.bot = H.hold(-1, 0, { pounce: H.onBeat(a, R) });
      b.player.bot = H.hold(1, 0, { pounce: pb === 'mash' ? Math.round(t / 0.025) % 5 === 0 : pb === 'late' ? H.onBeat(b, { tug: R.tug && { t0: R.tug.t0 + 0.4 } }) : false });
    });
    a.player.bot = b.player.bot = {};
    return { secs: H.r(end), aWon: !R.tug && a.holding === R && !b.holding, aSt: H.r(a.stamina), minB: H.r(minB) };
  }, [pb, secs]); };
  const m = await match('mash'), l = await match('late');
  ok(`on the beat beats mashing (${m.secs} s): the masher runs out of puff (${m.minB})`, m.aWon && m.minB < 0.1 && m.aSt > 0.4, m);
  ok(`on the beat beats a beat late (${l.secs} s)`, l.aWon, l);
}

if (want('teamheave')) {
  await setup();
  await tugSetup();
  const r = await h.page.evaluate(() => {
    const { G, ROPES, joinPlayer } = GAME, R = ROPES[1], out = {};
    joinPlayer({ kind: 'bot', index: 2 }); joinPlayer({ kind: 'bot', index: 3 });
    const [a, b, c, e] = G.dogs; for (const d of G.dogs) { d.stamina = 1; d.exhausted = false; d.player.bot = d.holding ? { grab: true } : {}; }
    H.place(c, R.x[7] - 0.4, R.z[7] + 0.9, Math.PI); H.place(e, R.x[20] + 0.4, R.z[20] + 0.9, Math.PI);
    H.grab(c.player); H.grab(e.player); out.four = G.dogs.filter(d => d.holding === R).length;
    // a and c heave on the beat together; b on it, e 0.4 s late: the same heaves, only one side together
    let teamA = 0, teamB = 0;
    const late = { tug: null };
    const end = H.run(14, () => {
      if (!R.tug) return true; late.tug = { t0: R.tug.t0 + 0.4 };
      if (R.tug['team-1'] > teamA) teamA = R.tug['team-1']; if (R.tug['team1'] > teamB) teamB = R.tug['team1'];
      a.player.bot = H.hold(-1, 0, { pounce: H.onBeat(a, R) }); c.player.bot = H.hold(-1, 0, { pounce: H.onBeat(c, R) });
      b.player.bot = H.hold(1, 0, { pounce: H.onBeat(b, R) }); e.player.bot = H.hold(1, 0, { pounce: H.onBeat(e, late) });
    });
    for (const d of G.dogs) d.player.bot = {};
    return { ...out, secs: H.r(end), teamA: teamA > 0, teamB: teamB > 0, aWon: !R.tug && a.holding === R && c.holding === R };
  });
  ok(`together on the beat: TEAM HEAVE! (not for the side out of step), and they win (${r.secs} s)`, r.four === 4 && r.teamA && !r.teamB && r.aWon, r);
}

if (want('dig')) {
  await setup();
  await tugSetup();
  const r = await h.page.evaluate(() => {
    const { G, ROPES } = GAME, [a, b] = G.dogs, R = ROPES[1], out = {};
    b.stamina = 0.4; const bx = b.x; let most = 0;
    // b dug in (LT), a walking back: it holds, b gets its breath back, a tires; Ⓑ dug in does nothing
    b.player.bot = { grab: true, lie: true }; a.player.bot = H.hold(-1, 0);
    H.run(6, () => { if (!R.tug) return true; most = Math.max(most, R.tug.off); });
    out.on = !!R.tug; out.knot = H.r(R.tug ? R.tug.off : 9); out.gained = H.r(most); out.mode = b.mode; out.bSt = H.r(b.stamina); out.aSt = H.r(a.stamina); out.bMoved = H.r(Math.abs(b.x - bx));
    b.player.bot = { grab: true, lie: true, pounce: true }; GAME.step(0.025); out.noHeave = !(b.tugK > 0); b.player.bot = { grab: true, lie: true };
    // heaves on the beat break it
    a.stamina = 1; a.exhausted = false;
    const end = H.run(12, () => { if (!R.tug) return true; a.player.bot = H.hold(-1, 0, { pounce: H.onBeat(a, R) }); });
    a.player.bot = b.player.bot = {};
    return { ...out, broke: H.r(end), aWon: !R.tug && a.holding === R };
  });
  ok(`dug in: it holds (knot ${r.knot} m, never gains: ${r.gained}), gets its breath back (0.4 → ${r.bSt}), the other tires (${r.aSt})`, r.on && Math.abs(r.knot) < 0.5 && r.gained < 0.3 && r.mode === 'creep' && r.bSt > 0.8 && r.aSt < 0.8 && r.bMoved < 0.6, r);
  ok(`dug in: no heaving; heaves on the beat break it (${r.broke} s)`, r.noHeave && r.aWon, r);
}

if (want('give')) {
  await setup();
  await tugSetup();
  const r = await h.page.evaluate(() => {
    const { G, T, ROPES } = GAME, [a, b] = G.dogs, R = ROPES[1], out = {};
    // a heaves on the beat; b walks back, then steps in just before a beat, and flicks back on it
    H.run(2, () => { a.player.bot = H.hold(-1, 0, { pounce: H.onBeat(a, R) }); b.player.bot = H.hold(1, 0); return H.ph(R) > 0.75 && H.ph(R) < 0.8; });
    b.player.bot = H.hold(-1, 0); H.run(0.4, () => { a.player.bot = H.hold(-1, 0, { pounce: H.onBeat(a, R) }); return a.tugStumT > G.time; });
    out.stumbled = a.tugStumT > G.time; out.weak = H.r(a.tugS); out.feint = b.feintT > G.time;
    a.player.bot = H.hold(-1, 0); b.player.bot = H.hold(1, 0); GAME.step(0.025); out.bHeave = H.r(b.tugK);
    // straight away again: a's wary, no stumble
    let again = false; H.run(1.6, () => { const p = H.ph(R); b.player.bot = p > 0.75 ? H.hold(-1, 0) : H.hold(1, 0); a.player.bot = H.hold(-1, 0, { pounce: H.onBeat(a, R) }); if (G.time < a.tugStumT && a.tugStumT > out.t1) again = true; });
    return out;
  });
  ok(`stepping in as it heaves: it stumbles (×${r.weak}), the next heave's on the beat (×${r.bHeave})`, r.stumbled && r.weak < 1 && r.feint && r.bHeave > 2, r);
  // HANK: he heaves on the beat; a dog stepping in just before it: he stumbles
  await setup();
  const hk = await h.page.evaluate(() => {
    const { G, ROPES, HANK, joinPlayer } = GAME, R = ROPES[1];
    const [a] = G.dogs; a.stamina = 1; a.player.bot = {};
    H.far(R.hx, R.hz); H.line(R, R.hx - 5, R.hz, 1, 0);
    H.place(a, R.x[2] - 1.05, R.z[2], Math.PI / 2); H.grab(a.player);
    H.place(HANK, R.x[2] - 1.2, R.z[2] + 2.2); HANK.goal = null; HANK.ropeAgain = 0;
    H.run(10, () => !!R.tug); if (!R.tug) return { tug: false };
    a.player.bot = { grab: true }; H.run(2, () => H.ph(R) > 0.75 && H.ph(R) < 0.8);
    a.player.bot = H.hold(1, 0); H.run(0.4, () => HANK.tugStumT > G.time);
    return { tug: true, stumbled: HANK.tugStumT > G.time, pose: HANK.stumble > 0 };
  });
  ok('Hank stumbles too, stepped in on just before his heave', hk.tug && hk.stumbled && hk.pose, hk);
}

if (want('row')) {
  await setup();
  await tugSetup();
  const r = await h.page.evaluate(() => {
    const { G, ROPES } = GAME, [a, b] = G.dogs, R = ROPES[1], out = {};
    // (b dug in: it holds) held back: no heave after the first; to rest and a flick back on the beat: a heave on it
    b.player.bot = { grab: true, lie: true };
    a.player.bot = H.hold(-1, 0); H.run(1); a.tugK = 0; H.run(0.8); out.held = H.r(a.tugK);
    a.player.bot = { grab: true }; H.run(1, () => H.ph(R) > 0.9); H.run(0.3, () => H.ph(R) < 0.05);
    a.player.bot = H.hold(-1, 0); GAME.step(0.025); out.row = H.r(a.tugK);
    // the right stick: a swing's a heave
    a.player.bot = { grab: true }; H.run(1, () => H.ph(R) > 0.9); H.run(0.3, () => H.ph(R) < 0.05); a.tugK = 0;
    a.player.bot = { grab: true, shake: true }; GAME.step(0.025); a.player.bot = { grab: true }; out.stick = H.r(a.tugK);
    out.on = !!R.tug; a.player.bot = b.player.bot = {};
    return out;
  });
  ok(`stick held back: no heaves (${r.held}); a flick back on the beat: a heave (×${r.row}); a right-stick swing too (×${r.stick})`, r.on && r.held === 0 && r.row > 2 && r.stick > 2, r);
}

if (want('reset')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, ROPES, resetRopes } = GAME, d = G.dogs[0], p = d.player, R = ROPES[2];
    H.far(R.cx, R.cz); H.place(d, R.cx - 1.5, R.cz, Math.PI / 2); H.grab(p); const held = d.holding === R;
    p.bot = H.hold(1, 0); H.run(2); p.bot = {}; const moved = Math.hypot(R.cx - R.hx, R.cz - R.hz);
    resetRopes();
    return { held, moved: H.r(moved), back: H.r(Math.hypot(R.cx - R.hx, R.cz - R.hz)), free: !d.holding };
  });
  ok('a new journey: back in its coil, let go', r.held && r.moved > 5 && r.back < 0.6 && r.free, r);
}

errors.push(...h.errors);
ok('no page errors', !errors.length, errors);
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
