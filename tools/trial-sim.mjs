// TRIALS played as a player would: `node tools/trial-sim.mjs [event …] ['{T overrides}']` (nested ones merge).
//   Each of the eight events run by a bot on the dog's controls only (the stick, walk / creep / sprint, grab, heave, stop): no animal
//   placed. Herding (course, brace, ducks): round behind them, walk them on (flanking wide), line up on a gate, round to a pen's mouth.
//   Agility twice: a clean run, and a player's (the see-saw got on from its side, wobbling; the weave skipped; just stopped on the table).
//   Prints each run's score, seconds, phases, faults and the rivals' scores; then your total against theirs and your place.
//   Checks (the default run, as tuned): every event finishes, none scores under its floor, and the total takes a medal.
//   --trace S: every S s of each run, its phase, the herd (* penned) and the dog (field coords: u up the ring, v across).
import { open } from './harness.mjs';
const args = process.argv.slice(2), only = args.filter(a => /^[a-z]+$/.test(a)), over = JSON.parse(args.find(a => a.startsWith('{')) || '{}');
const trace = args.includes('--trace') ? +args[args.indexOf('--trace') + 1] : 0;
const plain = !Object.keys(over).length;
const h = await open();
let fails = 0; const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
await h.page.evaluate(([over, trace]) => {
  const { G, T, TF, step, startGame, devJump, trialBuild, CAM_R, CAM_F, fp, fu, fv } = GAME;
  const deep = (o, src) => { for (const k in src) { if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) deep(o[k], src[k]); else o[k] = src[k]; } };
  deep(T, over);
  startGame({ kind: 'bot', index: 0 }); G.clock.hour = 9; T.trial.on = true; devJump(TF.s - 5); trialBuild();
  const H = window.H = {}, wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  H.d = () => G.dogs[0];
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.go = (u, v, x = {}) => { const d = H.d(), p = fp(u, v), dx = p.x - d.x, dz = p.z - d.z; return Math.hypot(dx, dz) < 0.3 ? { mx: 0, my: 0, ...x } : H.inp(dx, dz, x); };
  H.du = () => fu(H.d().x, H.d().z); H.dv = () => fv(H.d().x, H.d().z);
  H.r = v => +(+v).toFixed(1);
  // the event, its bot fn(ev) → input, till it's over (or its time: then over)
  H.play = (id, fn, sec) => {
    GAME.resetTrial(); GAME.trialStart(id, H.d()); H.stuck = null; const ev = GAME.TRIAL.ev, d = H.d(); let t = 0;
    const log = [], at = e => `${H.r(fu(e.x, e.z))},${H.r(fv(e.x, e.z))}${e.state === 'stay' ? '*' : ''}`;
    for (; t < sec && GAME.TRIAL.ev; t += 0.025) {
      if (trace && Math.floor(t / trace) !== Math.floor((t - 0.025) / trace)) log.push(`  ${Math.round(t)}s ph${ev.ph} ${GAME.TRIAL.grp ? GAME.TRIAL.grp.list.map(at).join(' ') : ''}  dog ${at(d)}`);
      d.player.bot = ev.t >= 0 ? fn(ev) || { mx: 0, my: 0 } : { mx: 0, my: 0 }; step(0.025);
    }
    d.player.bot = { mx: 0, my: 0 }; const timeUp = !!GAME.TRIAL.ev; if (timeUp) GAME.trialEnd();
    const L = GAME.TRIAL.last; return { log, id, score: L.score, t: H.r(Math.max(0, ev.t)), timeUp, pts: L.pts, faults: L.faults, rivals: GAME.TRIAL.rivals.map(r => r.sc[id]) };
  };
  const free = () => GAME.TRIAL.grp ? GAME.TRIAL.grp.list.filter(e => !e.heldBy && e.state !== 'stay' && e.state !== 'leave') : [];
  H.c = (L = free()) => { if (!L.length) return null; let u = 0, v = 0; for (const e of L) { u += fu(e.x, e.z); v += fv(e.x, e.z); } return { u: u / L.length, v: v / L.length }; };
  const inU = u => Math.max(-TF.hl + 0.8, Math.min(TF.hl - 0.8, u)), inV = v => Math.max(-TF.hw + 0.8, Math.min(TF.hw - 0.8, v));
  // herding: a straggler first; behind them (from the goal) → walk on; off the line → flank round wide; going nowhere (on a fence): another angle
  H.herd = (goal, o = {}) => {
    const L = o.list || free(); if (!L.length) return null;
    const c = H.c(L); let far = null, fd = 0; for (const e of L) { const dd = Math.hypot(fu(e.x, e.z) - c.u, fv(e.x, e.z) - c.v); if (dd > fd) { fd = dd; far = e; } }
    let tu = c.u, tv = c.v, gu = goal.u, gv = goal.v;
    if (fd > 5 && L.length > 1) { tu = fu(far.x, far.z); tv = fv(far.x, far.z); gu = c.u; gv = c.v; }
    let au = tu - gu, av = tv - gv; const al = Math.hypot(au, av) || 1; au /= al; av /= al;
    const S = H.stuck || (H.stuck = { u: tu, v: tv, t: G.time, off: 0, until: 0 });
    if (Math.hypot(tu - S.u, tv - S.v) > 1) { S.u = tu; S.v = tv; S.t = G.time; } else if (G.time - S.t > 4) { S.t = G.time; S.off = S.off ? -S.off : 0.9; S.until = G.time + 2.5; }
    if (G.time < S.until) { const c0 = Math.cos(S.off), s0 = Math.sin(S.off); [au, av] = [au * c0 - av * s0, av * c0 + au * s0]; }
    const stand = o.stand ?? 5, du = H.du(), dv = H.dv(), ad = Math.hypot(du - tu, dv - tv), diff = wrap(Math.atan2(av, au) - Math.atan2(dv - tv, du - tu));
    if (Math.abs(diff) > 0.5) { const R = Math.max(9, Math.min(ad, 12)), a = Math.atan2(dv - tv, du - tu) + Math.sign(diff) * Math.min(Math.abs(diff), 0.7); return H.go(inU(tu + Math.cos(a) * R), inV(tv + Math.sin(a) * R)); }
    return H.go(tu + au * stand, tv + av * stand, ad < stand + 3 ? o.close || {} : {});
  };
  // a gate: lined up in front of it, then on through
  H.gate = (G, c) => { const al = G.ax === 'v', along = al ? c.u : c.v, across = al ? c.v : c.u, at = al ? G.u : G.v, mid = al ? G.v : G.u, P = (a, b) => al ? { u: a, v: b } : { u: b, v: a };
    return (along - at) * G.dir < -1 && Math.abs(across - mid) < G.w / 2 - 0.8 ? P(at + G.dir * 6, mid) : P(at - G.dir * 4.5, mid); };
  // a pen: round to its mouth, then in
  H.pen = (P, c) => { const O = { 'u+': [1, 0], 'u-': [-1, 0], 'v+': [0, 1], 'v-': [0, -1] }[P.m], h = P.s / 2, a = (c.u - P.u) * O[0] + (c.v - P.v) * O[1], b = (c.u - P.u) * O[1] - (c.v - P.v) * O[0];
    return a > h - 0.8 && Math.abs(b) < h ? { u: P.u, v: P.v } : { u: P.u + O[0] * (h + 2.5), v: P.v + O[1] * (h + 2.5) }; };
  H.fetchTo = (d, x, z, x2, z2, near) => Math.hypot(x - d.x, z - d.z) < near ? { ...H.inp(x - d.x, z - d.z), grab: true } : H.inp(x2 - d.x, z2 - d.z);
}, [over, trace]);

const BOTS = {
  course: `const { TL, TRIAL, TRIAL_PH } = GAME;
    return H.play('course', ev => { const P = TRIAL_PH.course[ev.ph][0], c = H.c(); if (!c) return null;
      if (P === 'outrun') return H.du() < c.u + 2.6 ? H.go(c.u + 4, c.v + 9.5) : H.go(c.u + 4, c.v);
      if (P === 'shed') { const m = TRIAL.grp.list.find(e => e.mark), mu = fu(m.x, m.z), mv = fv(m.x, m.z); return H.go(mu + (c.u - mu) * 0.5, mv + (c.v - mv) * 0.5); }
      if (P === 'pen') return H.herd(H.pen(TL.penB, c), { stand: 4, close: { creep: true } });
      const g = P === 'fetch' ? (ev.gF === undefined ? H.gate(TL.fetch, c) : TL.post) : P === 'drive' ? (ev.g1 === undefined ? H.gate(TL.d1, c) : ev.g2 === undefined ? H.gate(TL.d2, c) : TL.ring) : TL.post;
      return H.herd(g); }, 245);`,
  brace: `const { TL, TRIAL } = GAME;
    return H.play('brace', ev => { const c = H.c(); if (!c) return null;
      if (ev.ph === 0) return H.herd(ev.gF === undefined ? H.gate(TL.fetch, c) : TL.post);
      const L = TRIAL.grp.list.filter(e => e.state !== 'stay'), P = (ev.nA || 0) < GAME.trialHalf() ? TL.penA : TL.penB, one = L.slice(0, 1);
      return H.herd(H.pen(P, H.c(one)), { stand: 4, list: one }); }, 265);`,
  ducks: `const { TL, TRIAL_PH } = GAME;
    return H.play('ducks', ev => { const P = TRIAL_PH.ducks[ev.ph][0], c = H.c(); if (!c) return null;
      return H.herd(P === 'g1' || P === 'g2' ? H.gate(TL[P], c) : H.pen(TL.house, c), { stand: 4, close: { creep: true } }); }, 185);`,
  llama: `const { TL, TRIAL } = GAME, L = TRIAL.llama, R = TRIAL.rope;
    return H.play('llama', ev => { const d = H.d();
      if (d.holding !== R) { const k = R.n - 6; return H.fetchTo(d, R.x[k], R.z[k], R.x[k], R.z[k], 1.4); }
      const P = TRIAL.poles[ev.pole]; if (!P) return { ...H.go(TL.lfinish + 2, TL.lstart.v), grab: true };
      const sd = ev.pole % 2 ? 1 : -1; return { ...H.go(fu(L.x, L.z) < P.u - 0.5 ? P.u + 0.8 : P.u + 2.5, P.v + sd * 1.8), grab: true }; }, 155);`,
  agility: `const { TL } = GAME;
    return H.play('agility', ev => { const o = TL.agi[ev.next]; if (!o || (ev.rt || 0) < 0) return null; const du = H.du(), dv = H.dv();
      if (o.k === 'hurdle' || o.k === 'finish') return H.go(o.u + o.dir * 2.5, o.v);
      if (o.k === 'tunnel') return du > o.u0 - 1.5 && Math.abs(dv - o.v) < 0.6 ? H.go(o.u1 + 1.5, o.v) : H.go(o.u0 - 1.2, o.v);
      if (o.k === 'seesaw') return dv < o.v0 - 0.3 && Math.abs(du - o.u) > 0.2 ? H.go(o.u, o.v0 - 1) : H.go(o.u, o.v1 + 1.2);
      if (o.k === 'weave') { const W = ev.weave, gap = (o.v1 - o.v0) / (o.n - 1), i = W ? W.i : 0; return !W ? H.go(o.u - 0.6, o.v0 - 0.4) : H.go(o.u + (i % 2 ? 0.6 : -0.6), o.v0 + i * gap + 0.3); }
      if (o.k === 'table') return Math.abs(du - o.u) < 0.6 && Math.abs(dv - o.v) < 0.6 ? { mx: 0, my: 0, lie: true } : H.go(o.u, o.v);
      return null; }, 130);`,
  agility2: `let stage = 0, wait = 0, t = 0; const { T } = GAME;
    const r = H.play('agility', ev => { t += 0.025; if ((ev.rt || 0) < 0) return null;
      const route = [[-4.5, -9], [2.5, -9], [9, -9], [12, -5.2], [12 + Math.sin(t * 3) * 0.35, -1.4], [9, 3], [5.2, 9.1], [5.2, 9.1], [-3, 9], [-10, 9]], [u, v] = route[Math.min(stage, 9)];
      if (stage === 7) { if ((wait += 0.025) > T.trial.agility.table.t + 1) stage++; return null; }
      if (Math.hypot(H.du() - u, H.dv() - v) < (stage === 6 ? 0.7 : 0.6)) stage++; return H.go(u, v); }, 130);
    r.id = 'agility (a player\\'s)'; return r;`,
  tug: `const { TRIAL, T, G } = GAME, R = TRIAL.rope; let bi = -1;
    return H.play('tug', () => { const d = H.d(), back = fp(-1, -20);
      if (d.holding !== R) return H.fetchTo(d, R.x[2], R.z[2], R.x[2], R.z[2], 1.2);
      const U = R.tug; if (!U) return { ...H.inp(back.x - d.x, back.z - d.z), grab: true };
      const ph = (G.time - U.t0) / T.rope.tug.beat.T, b = Math.floor(ph), on = b !== bi && ph - b > 0.1; if (on) bi = b;   // (a heave a beat, a touch late)
      return { ...H.inp(back.x - d.x, back.z - d.z), grab: true, pounce: on }; }, 125);`,
  throw: `const { TL, TRIAL } = GAME;
    return H.play('throw', ev => { const d = H.d(), b = TRIAL.bone; if (!b) return null;
      if (d.holding !== b) return ev.fly || ev.back ? H.go(TL.bone0.u - 3, 0) : H.fetchTo(d, b.x, b.z, b.x, b.z, 1.3);
      const u = H.du(); if (u < TL.line - 9) return H.go(TL.line - 12, 0, { grab: true });
      return { ...H.go(TL.line + 5, 0, { sprint: true }), grab: u < TL.line - 1 }; }, 125);`,
  shear: `const { TL, TRIAL } = GAME, C = TL.catch, B = TL.boards[0];
    return H.play('shear', ev => { const d = H.d(), bp = fp(B.u + 1.3, B.v);
      if (d.holding && d.holding.isHerd) { const u = fu(d.x, d.z); return { ...(u > C.u0 - 0.5 ? H.go(Math.abs(fv(d.x, d.z)) > 0.8 ? C.u0 + 0.8 : C.u0 - 3, 0) : H.inp(bp.x - d.x, bp.z - d.z)), grab: true }; }
      const L = TRIAL.grp ? TRIAL.grp.list.filter(e => e.wool > 0.5 && e.state !== 'shear' && e.state !== 'stay' && Math.hypot(e.x - bp.x, e.z - bp.z) > 3) : []; if (!L.length) return null;
      const e = L.sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z))[0];
      if (fu(d.x, d.z) < C.u0 && fu(e.x, e.z) > C.u0 && Math.abs(fv(d.x, d.z)) > 1) return H.go(C.u0 - 1.5, 0);
      return H.fetchTo(d, e.x, e.z, e.x, e.z, 1.5); }, 95);`,
};
// floors: the least each should score (a medal needs them all about here)
const FLOOR = { course: 55, brace: 70, ducks: 45, llama: 80, agility: 85, agility2: 70, tug: 90, throw: 60, shear: 85 };
const res = {};
for (const [k, js] of Object.entries(BOTS)) {
  if (only.length && !only.includes(k) && !only.includes(k.replace(/\d$/, ''))) continue;
  const r = res[k] = await h.page.evaluate(`(() => { const { fu, fv, fp } = GAME; ${js} })()`), log = r.log; delete r.log;
  console.log(`${r.id.padEnd(22)} ${String(r.score).padStart(3)}  ${String(r.t).padStart(5)} s${r.timeUp ? ' (time)' : '       '}  ${JSON.stringify(r.pts)}${r.faults ? `  ✖${r.faults}` : ''}   rivals ${r.rivals.join(' ')}`);
  if (log.length) console.log(log.join('\n'));
}
if (!only.length) {
  const tot = await h.page.evaluate(best => { const { TRIAL, trialTotal } = GAME; TRIAL.res = best; return { me: trialTotal(TRIAL.res), them: TRIAL.rivals.map(r => trialTotal(r.sc)), place: GAME.trialPlaceAll() }; },
    Object.fromEntries(Object.entries(res).map(([k, r]) => [k.replace(/\d$/, ''), Math.max(r.score, (res[k.replace(/\d$/, '')] || r).score)])));
  console.log(`total ${tot.me}  rivals ${tot.them.join(' ')}  place ${tot.place}`);
  if (plain) {
    for (const [k, r] of Object.entries(res)) ok(`${r.id}: finished, ${r.score} ≥ ${FLOOR[k]}`, !r.timeUp && r.score >= FLOOR[k], r);
    ok('a medal (all eight)', tot.place <= 3, tot);
  }
}
ok('no page errors', !h.errors.length, h.errors.slice(0, 3));
await h.close();
process.exit(fails ? 1 : 0);
