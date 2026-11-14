// Headless checks for TRIALS: `node tools/trial-test.mjs [layout|start|course|ducks|brace|llama|agility|tug|throw|shear|fault|awards|keg|rosette|save|reset]`.
//   layout   the ring fits by Sweetgrass Meadow (east of the trail, before the camp), clear, dry; off in ?sim; built when a dog comes near,
//            anything inside it put out; closed all round; ducks, llamas and the vagabond keep off it
//   start    a dog on a mat barks: that event's on (the count, the clock slowed); not by night, not one already run, not two at once
//   course   the host's five sheep; the outrun, lift, fetch through the gates (a miss: points off), drive, shed, pen (Hank shuts the gate)
//   ducks    five ducks; through G1, G2, all into the house: points; one put up (a sprint at it): a fault
//   brace    ten sheep; fetched; five in each pen: full marks for the pens
//   llama    the host's llama on the trial rope, led through the poles in and out: none down, all on the right side: full marks; a pole brushed: down
//   agility  hurdles, tunnel, see-saw (its plank tips), weave, table (lie on it), hurdle, finish: a clear round; one skipped: a fault
//   tug      the local champion on the far end of the trial rope; heaving on the beat beats him
//   throw    three throws of the trial bone from behind the line: the best counts; over the line: no throw; the bone isn't kept
//   shear    sheep carried to Hank's board: he shears each (🧶); the rival shearer does his own
//   fault    a grip or a bonk on the host's sheep: a fault (points off)
//   awards   all eight run: placings; 🥇 the champion ram joins the flock (s.champ, saved with it, the dawn report) and the keg on every dog;
//            🥈 the keg and wool; 🥉 wool; no prize below that
//   keg      THE KEG: up the pass a dog wearing it warms the sheep round it (heatAt); its bark's a nip (cold down, then a wait)
//   rosette  an event won: a rosette for the dogs (once); never dug up
//   save     a reload (JOURNEY SAVE): the scores and the rivals as they were
//   reset    a new journey: nothing run, the rivals rolled afresh
import { open } from './harness.mjs';
const only = process.argv[2];
let h = null, fails = 0;
const errors = [];
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const want = k => !only || only === k;
const setup = async (o = {}) => { if (h) { errors.push(...h.errors); await h.close(); } h = await open(); return h.page.evaluate(o => {
  const { G, T, TF, step, startGame, devJump, trialBuild, CAM_R, CAM_F, fp, fu, fv, groundY } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.clock.hour = 9; T.trial.on = true;
  if (o.build !== false) { devJump(TF.s - 5); trialBuild(); }
  const H = window.H = {};
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.d = () => G.dogs[0];
  H.go = (u, v, x = {}) => { const d = H.d(), p = fp(u, v), dx = p.x - d.x, dz = p.z - d.z; return Math.hypot(dx, dz) < 0.5 ? { mx: 0, my: 0, ...x } : H.inp(dx, dz, x); };
  H.near = (u, v, r = 0.9) => { const d = H.d(); return Math.hypot(fu(d.x, d.z) - u, fv(d.x, d.z) - v) < r; };
  H.place = (e, u, v) => { const p = fp(u, v); e.x = p.x; e.z = p.z; e.vx = e.vz = 0; e.y = groundY(p.x, p.z); };
  H.run = (sec, fn) => { const d = H.d(); for (let t = 0; t < sec - 1e-9; t += 0.025) { if (fn) { const b = fn(t); if (b === true) return t; d.player.bot = b || { mx: 0, my: 0 }; } step(0.025); } d.player.bot = { mx: 0, my: 0 }; return sec; };
  H.start = id => { GAME.trialStart(id, H.d()); H.run(T.trial.count + 0.1); return GAME.TRIAL.ev; };
  H.r = v => +(+v).toFixed(2);
  return true;
}, o); };

if (want('layout')) {
  await setup({ build: false });
  const r = await h.page.evaluate(() => {
    const { G, T, TF, TL, TRIAL, CAMPS, sAt, trailInfo, wetAt, sdfAt, fp, staticFences, trialBuild, HERDS, LLAMAS, inRing, trialClear, VAG, LLAMA } = GAME;
    const camp = CAMPS.find(c => c.name === 'Sweetgrass Meadow'), lat = trailInfo(TF.x, TF.z).lat, out = { hl: TF.hl, hw: TF.hw, s: H.r(TF.s), camp: camp.s, lat: H.r(lat), off: !TRIAL.built };
    let dry = true, clear = true; for (let u = -TF.hl; u <= TF.hl; u += 2) for (let v = -TF.hw; v <= TF.hw; v += 2) { const p = fp(u, v); if (wetAt(p.x, p.z)) dry = false; if (sdfAt(p.x, p.z) < 1.5) clear = false; }
    out.dry = dry; out.clear = clear;
    // a sheep left in the ring when it goes up: put out
    const s = G.sheep[0]; H.place(s, 2, 1); const before = TRIAL.ring.length;
    GAME.devJump(TF.s - 5); trialBuild(); out.built = TRIAL.built; out.segs = TRIAL.ring.length; out.inStatic = TRIAL.ring.every(g => staticFences.includes(g));
    out.out = !inRing(s.x, s.z);
    // closed: every point on the ring's edge has a segment near it
    let gaps = 0; for (let k = 0; k < 200; k++) { const t = k / 200 * 4, side = Math.floor(t), f = t - side, u = side === 0 ? -TF.hl + f * 2 * TF.hl : side === 1 ? TF.hl : side === 2 ? TF.hl - f * 2 * TF.hl : -TF.hl, v = side === 0 ? -TF.hw : side === 1 ? -TF.hw + f * 2 * TF.hw : side === 2 ? TF.hw : TF.hw - f * 2 * TF.hw, p = fp(u, v);
      if (!TRIAL.ring.some(g => { const abx = g.bx - g.ax, abz = g.bz - g.az, L2 = abx * abx + abz * abz, q = Math.max(0, Math.min(1, ((p.x - g.ax) * abx + (p.z - g.az) * abz) / L2)); return Math.hypot(p.x - g.ax - abx * q, p.z - g.az - abz * q) < 0.3; })) gaps++; }
    out.gaps = gaps;
    out.keepOff = (VAG.pitches || []).every(P => trialClear(P.x, P.z)) && LLAMA.herds.every(H2 => trialClear(H2.x, H2.z)) && HERDS.filter(e => !e.trial).every(e => trialClear(e.x, e.z));
    return out;
  });
  ok('layout: the ring by Sweetgrass Meadow, before its camp, east of the trail', r.s > r.camp - 70 && r.s < r.camp && r.lat > 10 && r.hl >= 14, r);
  ok('layout: clear and dry inside', r.dry && r.clear, r);
  ok('layout: off till a dog comes near (built then), its hurdles fences', r.off && r.built && r.segs > 20 && r.inStatic, r);
  ok('layout: closed all round', r.gaps === 0, r);
  ok('layout: a sheep inside when it went up: put out', r.out, r);
  ok('layout: the vagabond, the llamas, the ducks keep off it', r.keepOff, r);
}

if (want('start')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, TL, TRIAL, trialPress, fp, step } = GAME, d = H.d(), out = {};
    H.place(d, TL.mats[0].u, TL.mats[0].v);
    G.clock.hour = 22; out.night = trialPress(d) && !TRIAL.ev;
    G.clock.hour = 9; const h0 = G.clock.hour; out.press = trialPress(d) && TRIAL.ev && TRIAL.ev.id === 'course';
    out.count = TRIAL.ev.t < 0;
    H.run(T.trial.count + 10); const dh = G.clock.hour - h0; out.slow = dh < 10 / T.dayHourSec * 0.3;
    H.place(d, TL.mats[1].u, TL.mats[1].v); out.two = trialPress(d) && TRIAL.ev.id === 'course';
    GAME.trialEnd(); out.res = TRIAL.res.course !== undefined;
    H.place(d, TL.mats[0].u, TL.mats[0].v); out.again = trialPress(d) && !TRIAL.ev;
    H.place(d, 0, 0); out.offMat = !trialPress(d);
    return out;
  });
  ok('start: not by night', r.night, r);
  ok('start: a bark on a mat: its event on, after a count', r.press && r.count, r);
  ok('start: the clock slowed while it is on', r.slow, r);
  ok('start: not another while one is on', r.two, r);
  ok('start: one run is done (no second go); off a mat a bark is a bark', r.res && r.again && r.offMat, r);
}

if (want('course')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, TL, TRIAL, fp, fu, fv, HANK } = GAME, out = {}, ev = H.start('course');
    const L = TRIAL.grp.list; out.n = L.length; out.mark = L.filter(e => e.mark).length;
    const herdTo = (u, v) => L.forEach((e, i) => H.place(e, u + (i % 3 - 1) * 0.8, v + Math.floor(i / 3) * 0.8));
    const d = H.d();
    H.place(d, TL.letout.u + 4.9, 2.5); H.run(0.2); out.outrun = ev.pts.outrun;
    // the lift, the fetch through the gates, the post: the herd walked down step by step
    const walk = (u0, v0, u1, v1, s = 2.5) => { for (let k = 0; k <= 20; k++) { herdTo(u0 + (u1 - u0) * k / 20, v0 + (v1 - v0) * k / 20); H.run(s / 20); } };
    walk(TL.letout.u, 0, TL.letout.u - 4, 0); out.lift = ev.pts.lift;
    walk(TL.letout.u - 4, 0, TL.post.u + 4, 0); out.gF = ev.gF; out.fetch = ev.pts.fetch;
    H.place(d, 0, 0); H.place(HANK, TL.post.u - 8, TL.post.v - 3); H.run(8, () => { herdTo(TL.post.u + 3, 0); return null; }); out.hankPost = H.r(Math.hypot(fu(HANK.x, HANK.z) - TL.post.u, fv(HANK.x, HANK.z) - TL.post.v));
    // the drive: up through D1, across through D2, back to the ring
    walk(TL.post.u + 3, TL.d1.v, TL.d1.u + 3, TL.d1.v); out.g1 = ev.g1;
    walk(TL.d2.u, TL.d1.v + 2, TL.d2.u, TL.d2.v + 3); out.g2 = ev.g2;
    walk(TL.d2.u, TL.d2.v + 3, TL.ring.u, TL.ring.v); out.drive = ev.pts.drive;
    // the shed: the one with the ribbon off on its own in the ring
    const m = L.find(e => e.mark); L.forEach((e, i) => H.place(e, TL.ring.u - 2 + (i % 2) * 0.8, TL.ring.v - 2 + (i % 3) * 0.6)); H.place(m, TL.ring.u + 2.5, TL.ring.v + 2.5);
    for (let k = 0; k < 60 && ev.pts.shed === undefined; k++) { H.place(m, TL.ring.u + 2.5, TL.ring.v + 2.5); L.forEach((e, i) => { if (e !== m) H.place(e, TL.ring.u - 2 + (i % 2) * 0.8, TL.ring.v - 2 + (i % 3) * 0.6); }); H.run(0.05); }
    out.shed = ev.pts.shed;
    // the pen: all in, Hank shuts it
    for (let k = 0; k < 80 && TRIAL.ev; k++) { L.forEach((e, i) => { if (e.state !== 'stay') H.place(e, TL.penB.u + (i % 3 - 1) * 1.1, TL.penB.v + (Math.floor(i / 3) - 0.5) * 1.1); }); H.run(0.05); }
    out.pen = TRIAL.last && TRIAL.last.pts.pen; out.shut = TRIAL.gateK; out.score = TRIAL.res.course; out.over = !TRIAL.ev;
    return out;
  });
  ok('course: five of the host\'s sheep, one with a ribbon', r.n === 5 && r.mark === 1, r);
  ok('course: Hank at the handler\'s post', r.hankPost < 3, r);
  ok('course: the outrun (round behind them)', r.outrun >= 15, r);
  ok('course: the lift, the fetch through its gates', r.lift > 0 && r.gF === 1 && r.fetch > 10, r);
  ok('course: the drive through D1 and D2 to the ring', r.g1 === 1 && r.g2 === 1 && r.drive > 15, r);
  ok('course: the shed, the pen (the gate shut)', r.shed > 5 && r.pen > 5 && r.shut === 1, r);
  ok('course: scored, over', r.over && r.score > 60, r);
  // a missed gate costs
  const m = await h.page.evaluate(() => {
    const { TL, TRIAL } = GAME; GAME.resetTrial(); const ev = H.start('course'), L = TRIAL.grp.list;
    ev.ph = 2; ev.cu = TL.fetch.u + 3; ev.cv = 9;
    L.forEach((e, i) => H.place(e, TL.fetch.u + 2, 9 + (i % 3) * 0.6)); H.run(0.1);
    L.forEach((e, i) => H.place(e, TL.fetch.u - 2, 9 + (i % 3) * 0.6)); H.run(0.1);
    return { gF: ev.gF, loss: ev.loss };
  });
  ok('course: a gate missed (wide of it): points off', m.gF === -1 && m.loss >= 6, m);
}

if (want('ducks')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { T, TL, TRIAL, fu, fv } = GAME, out = {}, ev = H.start('ducks'), L = TRIAL.grp.list;
    out.n = L.length; out.ducks = L.every(e => e.kind === 'duck');
    H.place(H.d(), 0, 9);   // (out of their way)
    const herdTo = (u, v) => L.forEach((e, i) => { if (e.state !== 'stay') H.place(e, u + (i % 3 - 1) * 0.5, v + Math.floor(i / 3) * 0.5); });
    const walk = (u0, v0, u1, v1) => { for (let k = 0; k <= 20; k++) { herdTo(u0 + (u1 - u0) * k / 20, v0 + (v1 - v0) * k / 20); GAME.step(0.025); } };
    walk(TL.g1.u + 2, TL.g1.v, TL.g1.u - 2, TL.g1.v); out.g1 = ev.pts.g1;
    walk(TL.g2.u + 2, TL.g2.v, TL.g2.u - 2, TL.g2.v); out.g2 = ev.pts.g2;
    for (let k = 0; k < 80 && TRIAL.ev; k++) { herdTo(TL.house.u, TL.house.v); H.run(0.05); }
    out.house = TRIAL.last && TRIAL.last.pts.house; out.score = TRIAL.res.ducks;
    // put up: a sprint right at one (a fault)
    GAME.resetTrial(); const ev2 = H.start('ducks'), d = H.d(), e = TRIAL.grp.list[0]; H.place(d, fu(e.x, e.z) - 6, fv(e.x, e.z));
    H.run(1.5, () => H.inp(e.x - d.x, e.z - d.z, { sprint: true })); out.flap = ev2.faults.filter(f => f === 'flap').length;
    return out;
  });
  ok('ducks: five of them', r.n === 5 && r.ducks, r);
  ok('ducks: through G1, G2, into the house: points', r.g1 > 10 && r.g2 > 10 && r.house === 40 && r.score >= 80, r);
  ok('ducks: one put up by a sprint: a fault', r.flap >= 1, r);
}

if (want('brace')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { TL, TRIAL } = GAME, ev = H.start('brace'), L = TRIAL.grp.list, out = { n: L.length };
    ev.ph = 1;   // (fetched)
    for (let k = 0; k < 80 && TRIAL.ev; k++) { L.forEach((e, i) => { if (e.state === 'stay') return; const P = i < 5 ? TL.penA : TL.penB; H.place(e, P.u + (i % 3 - 1) * 1.1, P.v + (Math.floor((i % 5) / 3) - 0.5) * 1.1); }); H.run(0.05); }
    out.a = TRIAL.last && TRIAL.last.pts.penA; out.b = TRIAL.last && TRIAL.last.pts.penB; out.over = !TRIAL.ev;
    return out;
  });
  ok('brace: ten sheep; five in each pen: full marks for both', r.n === 10 && r.a === 35 && r.b === 35 && r.over, r);
}

if (want('llama')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { TL, TRIAL, fu, fv } = GAME, ev = H.start('llama'), L = TRIAL.llama, R = TRIAL.rope, out = {};
    out.roped = R.llama === L;
    H.run(60, () => {
      const d = H.d();
      if (!TRIAL.ev) return true;
      if (d.holding !== R) { const k = R.n - 6, dx = R.x[k] - d.x, dz = R.z[k] - d.z; return Math.hypot(dx, dz) < 1.4 ? { ...H.inp(dx, dz), grab: true } : H.inp(dx, dz); }
      const P = TRIAL.poles[ev.pole]; if (!P) return { ...H.go(TL.lfinish + 1.5, TL.lstart.v), grab: true };
      const side = ev.pole % 2 ? 1 : -1, lu = fu(L.x, L.z); return { ...H.go(lu < P.u - 0.5 ? P.u + 1.2 : P.u + 3, P.v + side * 2.6), grab: true };
    });
    out.score = GAME.TRIAL.res.llama; out.down = TRIAL.poles.filter(P => P.down).length; out.free = R.llama === null;
    // brushing a pole: down
    GAME.resetTrial(); H.start('llama'); const P0 = TRIAL.poles[0]; H.place(L, P0.u - 1, P0.v); H.place(H.d(), P0.u - 3, P0.v);
    H.run(1, () => H.go(P0.u + 2, P0.v)); out.knock = P0.down === 1;
    return out;
  });
  ok('llama: the host\'s llama on the trial rope', r.roped, r);
  ok('llama: led through the poles in and out, none down: full marks', r.score === 100 && r.down === 0 && r.free, r);
  ok('llama: a pole brushed: down', r.knock, r);
}

if (want('agility')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { TL, TRIAL, fu, fv, trialY, groundY, fp } = GAME, ev = H.start('agility'), out = {}; let tipped = 0;
    H.run(110, () => {
      if (!TRIAL.ev) return true;
      const d = H.d(), o = TL.agi[ev.next]; if (!o) return null;
      if (o.k === 'hurdle' || o.k === 'finish') return H.go(o.u + o.dir * 2.5, o.v);
      if (o.k === 'tunnel') return H.near(o.u0 - 0.8, o.v, 1.2) || fu(d.x, d.z) > o.u0 - 1 ? H.go(o.u1 + 1.5, o.v) : H.go(o.u0 - 1, o.v);
      if (o.k === 'seesaw') { if (TRIAL.saw) tipped = Math.max(tipped, TRIAL.saw.ang < 0 ? 1 : 0); return fv(d.x, d.z) < o.v0 - 0.5 && !H.near(o.u, o.v0 - 0.8, 0.6) ? H.go(o.u, o.v0 - 0.8) : H.go(o.u, o.v1 + 1.2, { creep: true }); }
      if (o.k === 'weave') { const W = ev.weave, gap = (o.v1 - o.v0) / (o.n - 1), i = W ? W.i : 0; if (!W && !H.near(o.u - 0.5, o.v0 - 1.2, 0.8)) return H.go(o.u - 0.5, o.v0 - 1.2); return H.go(o.u + (i % 2 ? 0.5 : -0.5), o.v0 + i * gap + 0.4, { creep: true }); }
      if (o.k === 'table') { if (H.near(o.u, o.v, 0.5)) { out.up = H.r(H.d().y - GAME.terrainH(H.d().x, H.d().z)); return { mx: 0, my: 0, lie: true }; } return H.go(o.u, o.v); }
      return null;
    });
    out.score = TRIAL.res.agility; out.faults = TRIAL.last && TRIAL.last.pts; out.tipped = tipped;
    // a hurdle skipped (straight to the tunnel): a fault
    GAME.resetTrial(); const ev2 = H.start('agility'); const T0 = TL.agi[1]; H.place(H.d(), T0.u0 - 1.5, T0.v);
    H.run(4, () => fu(H.d().x, H.d().z) > T0.u1 + 1 ? true : H.go(T0.u1 + 2, T0.v)); out.skip = ev2.loss;
    return out;
  });
  ok('agility: a clear round (the see-saw tipped, up on the table)', r.score >= 90 && r.tipped && r.up > 0.5, r);
  ok('agility: a hurdle skipped: a fault', r.skip >= 5, r);
}

if (want('tug')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { T, TL, TRIAL, fp, G } = GAME, ev = H.start('tug'), R = TRIAL.rope, C = TRIAL.champ, out = { champ: R.champ === C && C.rope === R }; let bi = -1, tug = false;
    H.run(60, () => {
      const d = H.d(); if (!TRIAL.ev) return true;
      if (d.holding !== R) { const dx = R.x[2] - d.x, dz = R.z[2] - d.z; return Math.hypot(dx, dz) < 1.2 ? { ...H.inp(dx, dz), grab: true } : H.inp(dx, dz); }
      const U = R.tug, back = fp(-1, -20); if (U) tug = true; if (!U) return { ...H.inp(back.x - d.x, back.z - d.z), grab: true };
      const b = Math.floor((G.time - U.t0) / T.rope.tug.beat.T + 0.5), on = b !== bi && Math.abs(((G.time - U.t0) / T.rope.tug.beat.T) - b) * T.rope.tug.beat.T < 0.06; if (on) bi = b;
      return { ...H.inp(back.x - d.x, back.z - d.z), grab: true, pounce: on };
    });
    out.tug = tug; out.score = TRIAL.res.tug; out.home = !R.champ && !C.rope;
    return out;
  });
  ok('tug: the champion on the far end; a tug of war', r.champ && r.tug, r);
  ok('tug: heaving on the beat beats him (full marks); the rope home after', r.score === 100 && r.home, r);
}

if (want('throw')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { TL, TRIAL, fu, BONES } = GAME, ev = H.start('throw'), out = { bone: !!TRIAL.bone && TRIAL.bone.trial }; let foul = 0;
    H.run(100, () => {
      const d = H.d(), b = TRIAL.bone; if (!TRIAL.ev || !b) return true;
      if (d.holding !== b) { if (ev.fly || ev.back) return H.go(TL.bone0.u - 3, 0); const dx = b.x - d.x, dz = b.z - d.z; return Math.hypot(dx, dz) < 1.3 ? { ...H.inp(dx, dz), grab: true } : H.inp(dx, dz); }
      const u = fu(d.x, d.z); if (u < TL.line - 9) return H.go(TL.line - 12, 0, { grab: true });
      const over = ev.throws.length === 2;   // the last one: over the line
      return { ...H.go(TL.line + 5, 0, { sprint: true }), grab: over ? u < TL.line + 1.5 : u < TL.line - 0.6 };
    });
    out.throws = TRIAL.last && [TRIAL.last.pts.t1, TRIAL.last.pts.t2, TRIAL.last.pts.t3]; out.score = TRIAL.res.throw; out.gone = !BONES.some(b => b.trial);
    return out;
  });
  ok('throw: the trial bone, three throws measured, the best counts', r.bone && r.throws && r.throws[0] > 8 && r.throws[1] > 8 && r.score >= Math.round(100 * Math.min(1, Math.max(r.throws[0], r.throws[1]) / 22)) - 1, r);
  ok('throw: let go over the line: no throw', r.throws && r.throws[2] === 0, r);
  ok('throw: the bone gone after (not kept)', r.gone, r);
}

if (want('shear')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, TL, TRIAL, fp, fu, fv, HANK } = GAME, ev = H.start('shear'), out = { n: TRIAL.grp.list.length, w0: G.wool || 0 }, C = TL.catch, B = TL.boards[0];
    H.place(HANK, B.u - 1.2, B.v); let shearing = false;
    H.run(100, () => {
      const d = H.d(); if (!TRIAL.ev) return true; if (HANK.shearing) shearing = true;
      const bp = fp(B.u + 1.3, B.v);
      if (d.holding && d.holding.isHerd) { if (fu(d.x, d.z) > C.u0 - 0.5 && Math.abs(fv(d.x, d.z)) > 0.8) return { ...H.go(C.u0 + 0.8, 0), grab: true }; if (fu(d.x, d.z) > C.u0 - 0.5) return { ...H.go(C.u0 - 3, 0), grab: true }; return Math.hypot(bp.x - d.x, bp.z - d.z) < 0.6 ? { mx: 0, my: 0 } : { ...H.inp(bp.x - d.x, bp.z - d.z), grab: true }; }
      const L = TRIAL.grp ? TRIAL.grp.list.filter(e => e.wool > 0.5 && e.state !== 'shear') : []; if (!L.length) return null;
      const e = L.sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z))[0];
      if (fu(d.x, d.z) < C.u0 && fu(e.x, e.z) > C.u0 && Math.abs(fv(d.x, d.z)) > 1) return H.go(C.u0 - 1.5, 0);
      const dx = e.x - d.x, dz = e.z - d.z; return Math.hypot(dx, dz) < 1.5 ? { ...H.inp(dx, dz), grab: true } : H.inp(dx, dz);
    });
    out.shearing = shearing; out.wool = (G.wool || 0) - out.w0; out.score = TRIAL.res.shear; out.rival = TRIAL.shearer.n;
    return out;
  });
  ok('shear: ten woolly sheep in the catch pen', r.n === 10, r);
  ok('shear: carried to Hank\'s board, he shears them: 🧶', r.shearing && r.wool >= 3 && r.score > 0, r);
  ok('shear: the rival shearer shears his own', r.rival >= 3, r);
}

if (want('fault')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { TRIAL, fu, fv } = GAME, ev = H.start('course'), d = H.d(), e = TRIAL.grp.list[0], out = {};
    H.place(d, fu(e.x, e.z) - 1.1, fv(e.x, e.z)); d.yaw = Math.atan2(e.x - d.x, e.z - d.z); e.state = 'stay';
    H.run(0.1, () => ({ mx: 0, my: 0, grab: true })); out.grip = ev.faults.includes('grip');
    H.run(0.1); e.state = 'idle'; const e2 = TRIAL.grp.list[3]; H.place(d, fu(e2.x, e2.z) - 2.4, fv(e2.x, e2.z)); e2.state = 'stay'; d.yaw = Math.atan2(e2.x - d.x, e2.z - d.z);
    H.run(0.6, t => t < 0.05 ? { ...H.inp(e2.x - d.x, e2.z - d.z), pounce: true } : null); out.faults = ev.faults.slice();
    GAME.trialEnd(); out.score = TRIAL.res.course;
    return out;
  });
  ok('fault: a grip on one of the host\'s sheep', r.grip, r);
  ok('fault: a pounce into one; faults cost points', r.faults.includes('bonk') && r.score <= 20 - 5 * r.faults.length + 2, r);
}

if (want('awards')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, TRIAL, TRIAL_EVENTS, trialAwards, DOGS, dogLook, living, trialTotal } = GAME, out = {};
    const all = v => { TRIAL.res = {}; for (const E of TRIAL_EVENTS) TRIAL.res[E.id] = v; TRIAL.done = false; };
    const n0 = living().length, w0 = G.wool || 0;
    all(100); H.run(0.1); out.place1 = TRIAL.place; const ram = G.sheep.find(s => s.champ);
    out.ram = !!ram && ram.ram && ram.brave >= 0.9 && living().length === n0 + 1; out.keg = DOGS.found.includes('keg') && dogLook(0).acc.includes('keg');
    H.run(0.6); out.wears = !!H.d().keg;
    out.dawn = GAME.trialNewcomers().includes(ram);
    // second: the keg and wool; third: wool; fourth: nothing
    const cut = TRIAL.rivals.map(r2 => trialTotal(r2.sc)).sort((a, b) => b - a);
    const place = k => { G.wool = 0; all(0); const tgt = k === 2 ? (cut[0] + cut[1]) / 2 : k === 3 ? (cut[1] + cut[2]) / 2 : 0; TRIAL.res.course = 0; let left = tgt; for (const E of TRIAL_EVENTS) { const v = Math.min(100, Math.ceil(left)); TRIAL.res[E.id] = Math.max(0, v); left -= TRIAL.res[E.id]; } TRIAL.done = false; trialAwards(); return { p: TRIAL.place, wool: G.wool, ram: G.sheep.filter(s => s.champ).length }; };
    out.p2 = place(2); out.p3 = place(3); out.p4 = place(4);
    return out;
  });
  ok('awards: all eight run: 🥇 the champion ram joins the flock, brave', r.place1 === 1 && r.ram, r);
  ok('awards: 🥇 the keg on the dogs (found for good), worn', r.keg && r.wears, r);
  ok('awards: the champion on the next dawn report', r.dawn, r);
  ok('awards: 🥈 wool (and the keg), 🥉 wool, 4th nothing; one ram only', r.p2.p === 2 && r.p2.wool === 25 && r.p3.p === 3 && r.p3.wool === 12 && r.p4.p === 4 && r.p4.wool === 0 && r.p4.ram === 1, r);
}

if (want('keg')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, DOGS, dogLook, restyleDog, heatAt, devJump, step, living, PASS } = GAME, out = {}, d = H.d();
    devJump(T.pass.snow + 40); G.clock.hour = 23;
    for (const f of PASS.fires) f.fuel = 0;
    const s = living().find(o => !o.lamb), o2 = living().filter(o => !o.lamb)[1];
    out.cold0 = H.r(heatAt(d.x + 0.5, d.z));
    DOGS.found.push('keg'); dogLook(0).acc.push('keg'); restyleDog(d); H.run(0.6);
    out.warm = H.r(heatAt(d.x + 0.5, d.z)); out.far = H.r(heatAt(d.x + 8, d.z));
    s.cold = 0.8; o2.cold = 0.8; s.x = d.x + 1; s.z = d.z; o2.x = d.x + 30; o2.z = d.z;
    H.run(0.1, () => ({ mx: 0, my: 0, bark: true })); out.nip = H.r(s.cold); out.farNip = H.r(o2.cold);
    s.cold = 0.8; H.run(0.6, () => ({ mx: 0, my: 0 })); H.run(0.05, () => ({ mx: 0, my: 0, bark: true })); out.cd = H.r(s.cold);
    return out;
  });
  ok('keg: no keg, no warmth', r.cold0 === 0, r);
  ok('keg: up the pass the dog wearing it warms what\'s by it', r.warm > 0.5 && r.far === 0, r);
  ok('keg: a bark\'s a nip for the cold one by it (not one far off), then a wait', r.nip < 0.5 && r.farNip > 0.7 && r.cd > 0.7, r);
}

if (want('rosette')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { TRIAL, DOGS, dogLook, DOG_ITEMS } = GAME, out = { before: DOGS.found.includes('rosette') };
    TRIAL.rivals.forEach(r2 => { r2.sc.throw = 10; });
    const ev = H.start('throw'); ev.throws = [30, 30, 30]; ev.pts.best = 100; GAME.trialEnd();
    out.won = TRIAL.last.place === 1; out.after = DOGS.found.includes('rosette'); out.prize = DOG_ITEMS.filter(it => it.prize).map(it => it.id);
    return out;
  });
  ok('rosette: an event won: a rosette for the dogs', !r.before && r.won && r.after, r);
  ok('rosette: the rosette and the keg are prizes (never dug up)', r.prize.includes('rosette') && r.prize.includes('keg'), r);
}

if (want('save')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { TRIAL, JOURNEY, journeySave, journeyRead, journeyResume, resetTrial, trialTotal } = GAME;
    JOURNEY.off = false; TRIAL.res = { course: 77, ducks: 55 }; const seed = TRIAL.seed, tots = TRIAL.rivals.map(r2 => trialTotal(r2.sc));
    journeySave(); resetTrial(); JOURNEY.saved = journeyRead(); journeyResume();
    return { res: TRIAL.res, same: TRIAL.seed === seed && TRIAL.rivals.every((r2, i) => trialTotal(r2.sc) === tots[i]) };
  });
  ok('save: a reload: the scores and the rivals as they were', r.res.course === 77 && r.res.ducks === 55 && r.same, r);
}

if (want('reset')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { TRIAL, resetGame } = GAME; TRIAL.res = { course: 50 }; TRIAL.done = true; const seed = TRIAL.seed;
    resetGame(); return { res: Object.keys(TRIAL.res).length, done: TRIAL.done, seed: TRIAL.seed !== seed };
  });
  ok('reset: a new journey: nothing run, rivals rolled afresh', r.res === 0 && !r.done && r.seed, r);
}

if (h) { errors.push(...h.errors); await h.close(); }
ok('no page errors', errors.length === 0, errors.slice(0, 3));
process.exit(fails ? 1 : 0);
