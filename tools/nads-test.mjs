// Headless checks for RAM NADS: who has them, size by bravery, hanging at rest, lagging and swinging on starts and stops,
// damping, hind legs/belly/ground keeping them out, flips and dt spikes staying sane, tucking up (cold, scared, wet),
// dropping (desert sun, age), the barn turntable, cost. node tools/nads-test.mjs
import { open } from './harness.mjs';
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

await h.page.evaluate(() => {
  const { G, step, startGame } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {}; for (const c of G.coyotes) c.gone = true;
  for (let i = 0; i < 4; i++) step(0.025);
  // in body terms: the cord's end and each nut from the anchor (fwd, down, side), ground clearance, speed vs the body
  window.NL = (s, vx = 0, vz = 0) => {
    const N = s.nads, e = s.bodyM.elements, A = N.A;
    const ax = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
    const S = ax(e[0], e[1], e[2]), D = ax(-e[4], -e[5], -e[6]), F = ax(e[8], e[9], e[10]);
    const rel = p => { const d = [p.x - A.x, p.y - A.y, p.z - A.z]; const dot = v => d[0] * v[0] + d[1] * v[1] + d[2] * v[2]; return { f: dot(F), d: dot(D), s: dot(S) }; };
    const gy = GAME.groundY(s.x, s.z);
    return { c: rel(N.c.p), n: N.n.map(o => ({ ...rel(o.p), gy: o.p.y - gy, v: Math.hypot(o.v.x - vx, o.v.y, o.v.z - vz), y: o.p.y })), h: N.h, ok: [N.c.p, ...N.n.map(o => o.p)].every(p => isFinite(p.x + p.y + p.z)) };
  };
  // park a ram on open ground, alone, facing +x
  window.PARK = (s, brave = 0.5) => {
    const d = G.dogs[0]; s.x = d.x + 12; s.z = d.z + 6; s.yaw = Math.PI / 2; s.vx = s.vz = 0; s.state = 'idle'; s.stress = 0; s.air = null; s.pose = null; s.heldBy = null; s.rs = 'idle'; s.brave = brave; s.hopY = 0; s.y = GAME.groundY(s.x, s.z);
    for (const o of G.sheep) if (o !== s) { o.x = d.x - 40; o.z = d.z - 40; }
    s.nads = null; GAME.syncSheep(1 / 60);
  };
  window.RUN = (s, secs, fn, dt = 1 / 60) => { const out = []; for (let t = 0; t < secs; t += dt) { if (fn) fn(t, dt); s.y = GAME.groundY(s.x, s.z) + (s.lift || 0); GAME.syncSheep(dt); out.push(NL(s, s.vx, s.vz)); } return out; };
});

// 1. who has them; size by bravery
const r1b = await h.page.evaluate(() => {
  const { G, SI, renderOnce } = GAME; renderOnce(1 / 60);
  const rams = G.sheep.filter(s => s.ram && !s.lamb && !s.dead), others = G.sheep.filter(s => !(s.ram && !s.lamb));
  const s = rams[0], meas = b => { PARK(s, b); const L = RUN(s, 3).at(-1); const e = SI.nut.m.instanceMatrix.array; return { S: s.nads.D.S, w: Math.hypot(e[0], e[1], e[2]), low: Math.min(...L.n.map(n => n.gy)), drop: Math.max(...L.n.map(n => n.d)) }; };
  const lo = meas(0), hi = meas(1);
  return { rams: rams.length, cord: SI.cord.m.count, nut: SI.nut.m.count, others: others.filter(o => o.nads).length, lo, hi };
});
ok(`every grown ram has a pair, nobody else (${r1b.rams} rams)`, r1b.rams >= 2 && r1b.cord === r1b.rams && r1b.nut === 2 * r1b.rams && r1b.others === 0, r1b);
ok(`bravest pair ${(r1b.hi.w / r1b.lo.w).toFixed(2)}× the timidest, hangs lower`, r1b.hi.w / r1b.lo.w > 2.2 && Math.abs(r1b.hi.w / r1b.lo.w - r1b.hi.S / r1b.lo.S) < 0.05 && r1b.hi.drop > r1b.lo.drop, r1b);

// 2. at rest: hangs below the anchor, still, off the ground, the left a touch lower
const r2 = await h.page.evaluate(() => {
  const s = GAME.G.sheep.find(o => o.ram && !o.lamb); PARK(s, 0.5); const L = RUN(s, 4).at(-1);
  return { L, cord: s.nads.D.cord };
});
const n2 = r2.L.n;
ok('at rest: the pair hangs below, behind nothing, still', r2.L.ok && n2.every(n => n.d > 0.1 && Math.abs(n.f) < 0.03 && n.v < 0.01) && r2.L.c.d > 0.8 * r2.cord, r2.L);
ok('off the ground, side by side, the left lower', n2.every(n => n.gy > 0.05) && n2[0].s > 0.03 && n2[1].s < -0.03 && n2[0].d > n2[1].d, n2);

// 3. inertia: he sets off and they swing back; he stops dead and they swing forward, then die away
const r3 = await h.page.evaluate(() => {
  const s = GAME.G.sheep.find(o => o.ram && !o.lamb); PARK(s, 0.5); RUN(s, 3);
  const rest = NL(s).n[0].f; let v = 0;
  const go = RUN(s, 0.6, (t, dt) => { v = Math.min(5, v + 14 * dt); s.vx = v; s.x += v * dt; s.leg = (s.leg || 0) + v * dt * 3; });
  const cruise = RUN(s, 2, (t, dt) => { s.vx = v; s.x += v * dt; s.leg += v * dt * 3; });
  const stop = RUN(s, 0.25, (t, dt) => { v = Math.max(0, v - 25 * dt); s.vx = v; s.x += v * dt; s.leg += v * dt * 3; });
  s.vx = 0; const after = RUN(s, 6);
  const f = a => a.map(L => L.n[0].f - rest), amp = (a, i, j) => Math.max(...f(a.slice(i, j)).map(Math.abs));
  return { back: Math.min(...f(go)), fwd: Math.max(...f(stop.concat(after.slice(0, 30)))), a1: amp(after, 0, 60), a2: amp(after, 60, 120), a3: amp(after, 120, 180), end: amp(after, 300, 360), endV: Math.max(...after.at(-1).n.map(n => n.v)), ok: [...go, ...cruise, ...stop, ...after].every(L => L.ok) };
});
ok(`off he goes: they swing back (${r3.back.toFixed(3)} m)`, r3.back < -0.03 && r3.ok, r3);
ok(`stops dead: they swing on forward (${r3.fwd.toFixed(3)} m)`, r3.fwd > 0.03, r3);
ok(`the swing dies away, give or take a wobble (${r3.a1.toFixed(3)} → ${r3.a2.toFixed(3)} → ${r3.a3.toFixed(3)} → ${r3.end.toFixed(4)})`, r3.a2 < 0.8 * r3.a1 && r3.a3 < 0.5 * r3.a1 && r3.a3 < 1.25 * r3.a2 + 0.002 && r3.end < 0.006 && r3.endV < 0.03, r3);

// 4. trotting: the legs bat them about; never inside a leg, his belly or the ground
const r4 = await h.page.evaluate(() => {
  const { G } = GAME; const s = G.sheep.find(o => o.ram && !o.lamb); PARK(s, 0.8); RUN(s, 2);
  const out = RUN(s, 6, (t, dt) => { s.vx = 3.2; s.x += 3.2 * dt; s.leg = (s.leg || 0) + 3.2 * dt * 3.2; s.lift = Math.abs(Math.sin(s.leg)) * 0.05; });
  s.lift = 0;
  return { minGy: Math.min(...out.flatMap(L => L.n.map(n => n.gy))), ok: out.every(L => L.ok) };
});
const r4b = await h.page.evaluate(() => {
  // leg and belly clearance, measured the way the rig sees them: from the leg/body instance matrices
  const { G, SI } = GAME, s = G.sheep.find(o => o.ram && !o.lamb), ND = s.nads.D, M = (arr, i) => arr.slice(i * 16, i * 16 + 16);
  const xf = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
  let worstLeg = 9, fd = []; s.leg = 0;
  for (let k = 0; k < 360; k++) {
    const dt = 1 / 60; s.vx = 3.2; s.x += 3.2 * dt; s.leg += 3.2 * dt * 3.2; s.y = GAME.groundY(s.x, s.z) + Math.abs(Math.sin(s.leg)) * 0.05; GAME.syncSheep(dt);
    const idx = G.sheep.filter(o => !o.dead).indexOf(s), L = SI.leg.m.instanceMatrix.array;
    for (const o of s.nads.n) {
      for (const l of [2, 3]) {
        const m = M(L, idx * 4 + l), hp = xf(m, 0, 0, 0), fp = xf(m, 0, -0.46, 0), sg = [fp[0] - hp[0], fp[1] - hp[1], fp[2] - hp[2]], sl = sg[0] ** 2 + sg[1] ** 2 + sg[2] ** 2;
        const u = Math.max(0, Math.min(1, ((o.p.x - hp[0]) * sg[0] + (o.p.y - hp[1]) * sg[1] + (o.p.z - hp[2]) * sg[2]) / sl));
        const dd = Math.hypot(o.p.x - hp[0] - u * sg[0], o.p.y - hp[1] - u * sg[1], o.p.z - hp[2] - u * sg[2]);
        worstLeg = Math.min(worstLeg, dd / (ND.legR + ND.rx * 0.85));
      }
      fd.push(NL(s, s.vx, 0).n[0].f);
    }
  }
  const mean = fd.reduce((a, b) => a + b, 0) / fd.length, sd = Math.sqrt(fd.reduce((a, b) => a + (b - mean) ** 2, 0) / fd.length);
  return { worstLeg, swingSD: sd, ok: NL(s).ok };
});
ok(`trotting: never on the ground (min ${r4.minGy.toFixed(3)} m)`, r4.minGy > 0 && r4.ok, r4);
ok(`trotting: never inside a hind leg (worst ${(r4b.worstLeg * 100).toFixed(0)}% of contact distance) and they swing (sd ${r4b.swingSD.toFixed(3)} m)`, r4b.worstLeg > 0.9 && r4b.swingSD > 0.008 && r4b.ok, r4b);

// 5. punted: somersaults through the air and lands; stays on, settles back
const r5 = await h.page.evaluate(() => {
  const { G } = GAME, s = G.sheep.find(o => o.ram && !o.lamb); PARK(s, 0.9); RUN(s, 2); const ND = s.nads.D;
  let maxCord = 0, maxLink = 0, vy = 9, y = 0;
  const fly = RUN(s, 1.9, (t, dt) => {
    vy -= 9.8 * dt; y = Math.max(0, y + vy * dt); s.air = { kind: 'punt', spin: t * 7, vy }; s.pose = s.pose || {}; s.lift = y; s.x += 6 * dt; s.vx = 6;
    const N = s.nads; maxCord = Math.max(maxCord, N.c.p.distanceTo(N.A) / ND.cord); for (const [j, o] of N.n.entries()) maxLink = Math.max(maxLink, o.p.distanceTo(N.c.p) / ND.link[j]);
  });
  s.air = null; s.pose = null; s.lift = 0; s.vx = 0;
  const after = RUN(s, 8);   // (a circling swing can take a while to die)
  const last = after.slice(-30), moved = Math.max(...[0, 1].flatMap(j => ['f', 'd', 's'].map(k => { const v = last.map(L => L.n[j][k]); return Math.max(...v) - Math.min(...v); })));   // (still: not moving, whatever a contact leaves in o.v)
  return { maxCord, maxLink, ok: fly.concat(after).every(L => L.ok), end: after.at(-1), moved, whip: Math.max(...fly.map(L => Math.hypot(L.n[0].f, L.n[0].s))) };
});
ok(`punted, somersaulting: they whip about (${r5.whip.toFixed(2)} m) but stay on (cord ≤ ${r5.maxCord.toFixed(2)}×, nut ≤ ${r5.maxLink.toFixed(2)}×)`, r5.ok && r5.whip > 0.08 && r5.maxCord <= 1.81 && r5.maxLink <= 1.71, r5);
ok('landed: hanging still again', r5.end.n.every(n => n.d > 0.1 && n.gy > 0.03) && r5.moved < 0.004, { moved: r5.moved, end: r5.end });

// 6. lying down: they rest on the ground; sat up to be shorn: still sane
const r6 = await h.page.evaluate(() => {
  const s = GAME.G.sheep.find(o => o.ram && !o.lamb); PARK(s, 0.9); RUN(s, 1);
  s.state = 'sleep'; const lie = RUN(s, 3).at(-1); s.state = 'shear'; const shear = RUN(s, 3); s.state = 'idle'; const up = RUN(s, 3).at(-1);
  return { lie, shear: shear.at(-1), shOk: shear.every(L => L.ok && L.n.every(n => n.gy > 0)), up, ry: s.nads.D.ry };
});
ok('lying down: they rest on the ground, still', r6.lie.ok && r6.lie.n.every(n => n.gy < r6.ry * 1.1 && n.gy > 0.6 * r6.ry && n.v < 0.05), r6.lie);
ok('sat on his rump to be shorn, then up again: sane', r6.shOk && r6.up.n.every(n => n.d > 0.1 && n.v < 0.05), r6);

// 7. dt spikes and a teleport
const r7 = await h.page.evaluate(() => {
  const { G } = GAME, s = G.sheep.find(o => o.ram && !o.lamb); PARK(s, 1); RUN(s, 1); let maxL = 0; const ND = s.nads.D;
  for (let k = 0; k < 200; k++) { const dt = k % 3 ? 0.1 : 0.001; s.vx = 5; s.x += 5 * dt; s.leg = (s.leg || 0) + 15 * dt; s.y = GAME.groundY(s.x, s.z); GAME.syncSheep(dt); const N = s.nads; maxL = Math.max(maxL, ...N.n.map((o, j) => o.p.distanceTo(N.c.p) / ND.link[j])); }
  const spike = NL(s, 5, 0); s.vx = 0; s.x += 120; s.y = GAME.groundY(s.x, s.z); GAME.syncSheep(1 / 60); const jump = NL(s);
  return { spike, maxL, jump };
});
ok(`dt spikes (0.1 s / 1 ms): finite, on (nut ≤ ${r7.maxL.toFixed(2)}×)`, r7.spike.ok && r7.maxL <= 1.71, r7.spike);
ok('a 120 m jump: hanging at rest straight away', r7.jump.ok && r7.jump.n.every(n => n.d > 0.1 && Math.abs(n.f) < 0.01 && n.v < 1e-6), r7.jump);

// 8. cremaster: cold night, a fright, a dunking tuck them up; desert sun and age let them down
const r8 = await h.page.evaluate(() => {
  const { G, updateLighting, LIGHT } = GAME, s = G.sheep.find(o => o.ram && !o.lamb); PARK(s, 0.5);
  const sun = () => { G.clock.hour = 13; updateLighting(0); };
  sun(); RUN(s, 10); const hot = s.nads.h, hotDrop = NL(s).n[1].d;
  G.clock.hour = 23; updateLighting(0); RUN(s, 6); const cold = s.nads.h, coldDrop = NL(s).n[1].d;
  sun(); RUN(s, 15); const h0 = s.nads.h; s.stress = 1; RUN(s, 0.4); const scared = s.nads.h; s.stress = 0; RUN(s, 0.4); const still = s.nads.h; RUN(s, 15); const back = s.nads.h;
  s.age = s.life - 1; RUN(s, 20); const old = s.nads.h; s.age = 3; RUN(s, 20);
  s.air = { kind: 'swim' }; RUN(s, 2); const wet = s.nads.h; s.air = null; RUN(s, 5); const damp = s.nads.h;
  return { hot, cold, h0, scared, still, back, wet, damp, old, hotDrop, coldDrop, night: LIGHT.night };
});
ok(`cold night: tucked up (${r8.hot.toFixed(2)} → ${r8.cold.toFixed(2)}), hanging higher`, r8.cold < 0.8 && r8.hot > 1.05 && r8.coldDrop < r8.hotDrop - 0.03, r8);
ok(`a fright: up fast (${r8.h0.toFixed(2)} → ${r8.scared.toFixed(2)} in 0.4 s), down slowly (${r8.still.toFixed(2)} → ${r8.back.toFixed(2)})`, r8.scared < r8.h0 - 0.15 && r8.still < r8.h0 - 0.1 && Math.abs(r8.back - r8.h0) < 0.03, r8);
ok(`a dunking: tucked (${r8.wet.toFixed(2)}), still damp after (${r8.damp.toFixed(2)})`, r8.wet < 0.75 && r8.damp < r8.h0 - 0.1, r8);
ok(`old age: lower (${r8.old.toFixed(2)})`, r8.old > r8.h0 + 0.15, r8);

// 9. the barn: a ram on the turntable has them (and his horns); a ewe doesn't
const r9 = await h.page.evaluate(() => {
  const { G, BARN, openBarn, closeBarn, barnSelect, barnRender } = GAME, s = G.sheep.find(o => o.ram && !o.lamb), ewe = G.sheep.find(o => !o.ram && !o.lamb);
  openBarn(); barnSelect(s); for (let i = 0; i < 90; i++) barnRender(1 / 60);
  const ms = BARN.nadsMs, fin = ms && ms.every(m => m.matrix.elements.every(isFinite)), n = ms ? ms.length : 0, sw = BARN.nads && Math.hypot(BARN.nads.n[0].v.x, BARN.nads.n[0].v.z);
  barnSelect(ewe); const eweN = BARN.nadsMs; closeBarn();
  return { n, fin, sw, ewe: !!eweN };
});
ok('in the barn: on the ram, turning with the turntable; not on a ewe', r9.n === 3 && r9.fin && r9.sw > 0.05 && !r9.ewe, r9);

// 10. cost
const r10 = await h.page.evaluate(() => {
  const { G } = GAME, s = G.sheep.find(o => o.ram && !o.lamb); PARK(s, 0.5);
  const t0 = performance.now(); let k = 0;
  for (; k < 2000; k++) { s.x += 0.05; s.leg = (s.leg || 0) + 0.1; s.vx = 3; s.y = GAME.groundY(s.x, s.z); GAME.syncSheep(1 / 60); }
  const all = (performance.now() - t0) / k;
  return { msFrame: all, sheep: G.sheep.filter(o => !o.dead).length };
});
console.log(`     syncSheep, ${r10.sheep} sheep: ${r10.msFrame.toFixed(3)} ms/frame`);

ok('no page errors', h.errors.length === 0, h.errors);
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
