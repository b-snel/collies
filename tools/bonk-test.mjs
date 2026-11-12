// Headless checks for BONK SPOTS: streams (walkable, wet, lush banks), mud bogs, cast sheep, the balking lead ewe,
// apple trees, carrying apples. node tools/bonk-test.mjs [world|cast|mud|balk|apple|carry]
import { open } from './harness.mjs';
const only = process.argv[2];
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const run = (k, fn, arg) => !only || only === k ? h.page.evaluate(fn, arg) : null;
// shared helpers, defined in the page
await h.page.evaluate(() => {
  const { G, step, groundY, CAM_R, CAM_F } = GAME;
  window.H = {
    inp: (dx, dz, x = {}) => ({ mx: dx * CAM_R.x + dz * CAM_R.z, my: -(dx * CAM_F.x + dz * CAM_F.z), ...x }),
    place: (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); },
    run: (sec, fn) => { for (let t = 0; t < sec; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return sec; },
    away: (except, x, z) => G.sheep.forEach((o, i) => { if (!except.includes(o)) H.place(o, x + (i % 6) * 2, z + Math.floor(i / 6) * 2); }),
    pounce: (d, tx, tz) => { const p = d.player, dx = tx - d.x, dz = tz - d.z, l = Math.hypot(dx, dz); d.yaw = Math.atan2(dx, dz); d.pounceCD = 0; p.bot = H.inp(dx / l, dz / l, { pounce: true }); step(0.025); p.bot = {}; },
    fresh: () => { GAME.resetGame(); const { T } = GAME; G.players[0].bot = {}; G.clock.hour = 10; for (const c of G.coyotes) c.gone = true; T.cast.on = T.mud.on = T.balk.on = false; },
  };
  GAME.startGame({ kind: 'bot', index: 0 });
});

// 1. the world: streams, bogs, apple trees
const w = await run('world', () => {
  const { STREAMS, MUDS, APPLE_TREES, APPLES, T, sdfAt, wetAt, inStream, streamD, trailInfo, sAt, CAMPS, grass, mudK, biomeW } = GAME;
  const capAt = (x, z) => grass.gCap[Math.round((z - grass.GMINZ) / grass.VS) * grass.VX + Math.round((x - grass.GMINX) / grass.VS)];
  const out = { streams: STREAMS.length, walk: 0, wet: 0, n: 0, bank: 0, far: 0, nb: 0, nf: 0, inCap: 0 };
  for (const st of STREAMS) for (const p of st.pts) {
    const ci = trailInfo(p.x, p.z); if (Math.max(ci.oW, ci.oE) > -3) continue;   // in the valley, off its walls
    out.n++; if (sdfAt(p.x, p.z) > 0.3) out.walk++; if (wetAt(p.x, p.z) && inStream(p.x, p.z)) out.wet++; out.inCap = Math.max(out.inCap, capAt(p.x, p.z));
    for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (const r of [3.5, 5.5]) { const x = p.x + ox * r, z = p.z + oz * r; if (streamD(x, z) > T.stream.hw + 1 && sdfAt(x, z) > 1 && !mudK(x, z)) { out.bank += capAt(x, z); out.nb++; } }
      for (const r of [24, 30]) { const x = p.x + ox * r, z = p.z + oz * r; if (streamD(x, z) > 20 && sdfAt(x, z) > 1 && Math.abs(trailInfo(x, z).lat) > 3 && !mudK(x, z) && CAMPS.every(c => Math.hypot(x - c.x, z - c.z) > c.R + 6)) { out.far += capAt(x, z); out.nf++; } }
    }
  }
  out.bank = +(out.bank / out.nb).toFixed(2); out.far = +(out.far / out.nf).toFixed(2);
  out.muds = MUDS.length; out.mudPL = MUDS.filter(m => biomeW(sAt(m.x, m.z))[3] > 0.8).length;
  out.mudCamp = MUDS.filter(m => CAMPS.some(c => Math.hypot(m.x - c.x, m.z - c.z) < c.R + 10)).length;
  out.mudStream = MUDS.filter(m => m.blobs.some(b => streamD(b.x, b.z) < T.stream.hw + b.r)).length;
  out.trees = APPLE_TREES.length; out.apples = APPLES.length; out.treeWet = APPLE_TREES.filter(t => GAME.inStream(t.x, t.z) || GAME.mudAt(t.x, t.z, 2)).length;
  out.streamCamp = STREAMS.filter(st => st.pts.some(p => CAMPS.some(c => Math.hypot(p.x - c.x, p.z - c.z) < c.R + 6))).length;
  return out;
});
if (w) {
  ok(`${w.streams} streams`, w.streams >= 2, w);
  ok(`walkable and wet (${w.walk}/${w.n}, ${w.wet}/${w.n})`, w.walk >= w.n * 0.97 && w.wet === w.n, w);
  ok(`lush banks (${w.bank} vs ${w.far} away), none in the water`, w.bank > w.far + 0.15 && w.inCap < 0.05, w);
  ok(`${w.muds} bogs, all in the Promised Land, none in a camp`, w.muds >= 5 && w.mudPL === w.muds && w.mudCamp === 0 && w.mudStream === 0, w);
  ok(`${w.trees} apple trees (${w.apples} apples), dry`, w.trees >= 5 && w.apples === w.trees * 6 && w.treeWet === 0, w);
  ok('no stream through a camp', w.streamCamp === 0, w);
}

// 2. streams: a sheep walks across one; a dog fills a bucket in one
const sx = await run('world', () => {
  const { G, STREAMS, pathPoint, T } = GAME; H.fresh();
  const st = STREAMS[1], p = st.pts.find(q => Math.abs(q.lat) < 1) || st.pts[60], s = G.sheep.find(o => !o.ram && !o.lamb), d = G.dogs[0];
  const o = pathPoint(st.s), dir = Math.sign((p.x - o.x) * o.tx + (p.z - o.z) * o.tz) || 1;
  H.away([s], p.x + 60, p.z + 60); H.place(s, p.x - o.tx * dir * 5, p.z - o.tz * dir * 5); H.place(d, p.x + 40, p.z + 40);
  s.state = 'seek'; s.tx = p.x + o.tx * dir * 6; s.tz = p.z + o.tz * dir * 6; s.hunger = 0.6;
  let wet = 0; H.run(8, () => { if (GAME.inStream(s.x, s.z)) wet++; s.state = 'seek'; s.thinkT = 1; });
  const across = Math.hypot(s.x - s.tx, s.z - s.tz) < 2.5;
  const b = GAME.BUCKETS[0]; b.w = 0; H.place(d, p.x, p.z); b.x = d.x; b.z = d.z; b.by = d; d.holding = b; d.holdKind = 'bucket'; H.run(1);
  return { across, wet, filled: +b.w.toFixed(1), y: GAME.streamY(p.x, p.z) };
});
if (sx) {
  ok(`a sheep wades across a stream (${sx.wet} steps in it)`, sx.across && sx.wet > 0, sx);
  ok(`a bucket fills in a stream (${sx.filled})`, sx.filled > 0, sx);
}

// 3. cast: full fleece → on its back, stays put, a pounce flips it (calm), left alone it dies; shorn never
const c = await run('cast', () => {
  const { G, T, castSheep } = GAME; H.fresh(); const out = {};
  const p = GAME.pathPoint(150, 8), d = G.dogs[0], S = G.sheep.filter(o => !o.lamb);
  S.forEach((o, i) => { H.place(o, p.x + (i % 4) * 2.5, p.z + Math.floor(i / 4) * 2.5); o.wool = i < 4 ? 1 : 0.3; o.state = 'graze'; o.stress = 0; });
  H.place(d, p.x + 60, p.z + 60);
  T.cast.on = true; T.cast.perHour = 3; T.cast.max = 1;
  out.secs = +H.run(20, () => G.sheep.some(o => o.state === 'cast')).toFixed(1);
  const s = G.sheep.find(o => o.state === 'cast'); out.cast = !!s; if (!s) return out;
  out.full = (s.wool ?? 1) >= T.cast.wool; T.cast.perHour = 0;
  const x0 = s.x, z0 = s.z; H.run(8); out.drift = +Math.hypot(s.x - x0, s.z - z0).toFixed(2); out.still = s.state === 'cast'; out.n = G.sheep.filter(o => o.state === 'cast').length;
  H.place(d, s.x - 1.6, s.z); d.yaw = Math.PI / 2; G.players[0].bot = H.inp(1, 0, { grab: true }); H.run(0.5); out.grabbed = d.holding === s; G.players[0].bot = {}; if (d.holding) GAME.releaseHold(d, false); H.run(0.3);   // (whatever it bit instead: let go)
  H.place(d, s.x - 2.2, s.z); H.pounce(d, s.x, s.z);
  out.flip = s.air && s.air.kind; out.up = s.state !== 'cast'; H.run(3);
  out.landed = !s.air; out.stress = +s.stress.toFixed(2); out.fled = s.state === 'flee'; out.saved = G.stats.saved; out.alive = !s.dead;
  // left alone: dies of it, with a tombstone
  T.cast.die = 0.5; const s2 = G.sheep.find(o => !o.dead && !o.lamb && o !== s); H.place(d, p.x + 60, p.z + 60); s2.wool = 1; s2.state = 'graze'; s2.stress = 0; s2.rs = 'idle'; castSheep(s2);
  H.run(10); out.died = s2.dead; out.why = G.lost.length ? G.lost[G.lost.length - 1].why : null; out.grave = G.graves.length; T.cast.die = 6;
  // shorn sheep don't cast
  T.cast.perHour = 3; T.cast.max = 9; G.sheep.forEach(o => { if (!o.dead) { o.wool = 0.4; if (o.state === 'cast') o.state = 'idle'; } });
  H.run(20); out.shorn = G.sheep.filter(o => o.state === 'cast').length; T.cast.perHour = 0.004; T.cast.max = 2;
  return out;
});
if (c) {
  ok(`a sheep in full fleece gets cast (${c.secs}s)`, c.cast && c.full, c);
  ok('stays put on its back', c.still && c.drift < 0.2, c);
  ok("a grab can't right it", !c.grabbed, c);
  ok('a pounce flips it over, and it lands calm', c.flip === 'flip' && c.up && c.landed && !c.fled && c.alive && c.saved >= 1, c);
  ok(`left cast, it dies of it (${c.why}, tombstone)`, c.died && c.why === 'cast' && c.grave >= 1, c);
  ok('shorn sheep never get cast', c.shorn === 0, c);
}

// 4. mud: a sheep driven into a bog sticks and sinks; a grab can't free it; a pounce pops it out, calm and muddy; calm sheep go round
const m = await run('mud', () => {
  const { G, T, MUDS } = GAME; H.fresh(); const out = {};
  const b = MUDS[1], d = G.dogs[0], s = G.sheep.find(o => !o.ram && !o.lamb);   // (one away from the streams: a sheep popped into one washes clean)
  H.away([s], b.x + 60, b.z + 60); H.place(s, b.x - b.blobs[0].r - 3, b.z); H.place(d, b.x + 50, b.z + 50);
  T.mud.on = true; T.mud.stickRun = 60; s.breakT = 3; s.bdx = 1; s.bdz = 0;
  out.secs = +H.run(3, () => !!s.bog).toFixed(2); out.bog = !!s.bog; T.mud.stickRun = 1.4; if (!s.bog) return out;
  const x0 = s.x, z0 = s.z; H.run(8); out.drift = +Math.hypot(s.x - x0, s.z - z0).toFixed(2); out.still = !!s.bog; out.sink = +(s.sink || 0).toFixed(2); out.stress = +s.stress.toFixed(2);
  H.place(d, s.x - 1.6, s.z); d.yaw = Math.PI / 2; G.players[0].bot = H.inp(1, 0, { grab: true }); H.run(0.5); out.grabbed = d.holding === s; G.players[0].bot = {}; if (d.holding) GAME.releaseHold(d, false); H.run(0.3);   // (whatever it bit instead: let go)
  H.place(d, s.x - 2.2, s.z); H.pounce(d, s.x, s.z); out.freed = !s.bog;
  H.run(4); out.flew = +Math.hypot(s.x - x0, s.z - z0).toFixed(1); out.calm = s.state !== 'flee'; out.mud = +(s.mud || 0).toFixed(2); out.reBog = !!s.bog;
  // calm walkers steer round the bogs
  let bogs = 0, n = 0;
  for (let k = 0; k < 12; k++) {
    const mb = MUDS[k % MUDS.length], r = mb.blobs[0].r, o = G.sheep.find(q => !q.dead && !q.ram && !q.lamb && q !== s);
    H.away([o], mb.x + 200, mb.z + 200); H.place(o, mb.x - r - 3, mb.z + (k % 3 - 1) * 0.5); o.bog = null; o.stress = o.fear = o.panic = 0; H.place(d, mb.x + 200, mb.z - 200);
    for (let t = 0; t < 6; t += 0.025) { o.state = 'seek'; o.tx = mb.x + r + 4; o.tz = mb.z; o.thinkT = 1; GAME.step(0.025); if (o.bog) { bogs++; break; } }
    n++; o.bog = null; o.sink = 0;
  }
  out.walkBogs = bogs; out.walks = n;
  return out;
});
if (m) {
  ok(`a bolting sheep sticks in the bog (${m.secs}s)`, m.bog, m);
  ok(`held fast and sinking (${m.sink} m)`, m.still && m.drift < 0.3 && m.sink > 0.2, m);
  ok("it gets stressed; a grab can't pull it out", m.stress > 0.3 && !m.grabbed, m);
  ok(`a pounce pops it out (${m.flew} m), calm and muddy`, m.freed && m.flew > 2 && m.calm && m.mud > 0.5, m);
  ok(`calm sheep walking past rarely stick (${m.walkBogs}/${m.walks})`, m.walkBogs <= 3, m);
}

// 5. the balker: the lead ewe plants herself at an open gate of an evening, the flock hangs back; bonked in, they follow
const b = await run('balk', () => {
  const { G, T, pens, setGate, startBalk, balkSpot } = GAME; const out = {};
  const trial = (balk, bonk) => {
    H.fresh(); G.clock.day = 2; G.clock.hour = 17.5; T.balk.on = balk; T.balk.chance = 1;
    const pen = pens[1], d = G.dogs[0], ga = pen.camp.gateA, nx = Math.cos(ga), nz = Math.sin(ga), lead = G.sheep.find(o => o.bell);
    setGate(pen, true);
    G.sheep.forEach((o, i) => { const a = (i % 5 - 2) * 0.5, r = 8 + Math.floor(i / 5) * 2.2; H.place(o, pen.gx + nx * r + -nz * a * 3, pen.gz + nz * r + nx * a * 3); o.hunger = 0.1; o.stress = 0; o.thirst = 0; });
    H.place(lead, pen.gx + nx * 5, pen.gz + nz * 5); H.place(d, pen.gx + nx * 30, pen.gz + nz * 30);
    let balked = false, atSpot = 1e9, inAt = null;
    H.run(25, t => { if (lead.balk) { balked = true; const q = balkSpot(pen); atSpot = Math.min(atSpot, Math.hypot(lead.x - q.x, lead.z - q.z)); } });
    const in25 = G.sheep.filter(o => !o.dead && o.pen === pen).length, leadIn = lead.pen === pen;
    let after = null, landed = null;
    if (bonk && lead.balk) {
      H.place(d, lead.x + nx * 2.2, lead.z + nz * 2.2);
      for (const o of G.sheep) if (o !== lead && Math.hypot(o.x - d.x, o.z - d.z) < 4.5) H.place(o, o.x + nx * 4, o.z + nz * 4);   // a clear shot at her
      H.pounce(d, pen.x, pen.z);
      H.run(3); landed = lead.pen === pen; H.run(17);
      after = G.sheep.filter(o => !o.dead && o.pen === pen).length;
    }
    return { balked, atSpot: +atSpot.toFixed(1), in25, leadIn, landed, after, n: G.sheep.filter(o => !o.dead).length, leadT: +((pen.leadT || 0) - G.time).toFixed(1) };
  };
  out.control = trial(false, false); out.balk = trial(true, true);
  T.balk.chance = 0.5;
  return out;
});
if (b) {
  ok(`without a balker the flock goes in (${b.control.in25}/${b.control.n})`, b.control.in25 >= b.control.n * 0.6, b.control);
  ok(`the lead ewe balks at her spot by the gate (${b.balk.atSpot} m)`, b.balk.balked && b.balk.atSpot < 1 && !b.balk.leadIn, b.balk);
  ok(`the rest hang back (${b.balk.in25} in vs ${b.control.in25})`, b.balk.in25 <= b.control.in25 * 0.5, { b, c: b.control });
  ok(`bonked in, she lands in the pen and the flock follows (${b.balk.after}/${b.balk.n})`, b.balk.landed && b.balk.after >= b.balk.n * 0.6, b.balk);
}

// 6. apples: a pounce into the trunk drops some; a hungry sheep goes for one before grass and eats it; they grow back
const a = await run('apple', () => {
  const { G, T, APPLE_TREES, APPLES } = GAME; H.fresh(); const out = {};
  const tr = APPLE_TREES[0], d = G.dogs[0], s = G.sheep.find(o => !o.ram && !o.lamb);
  const mates = G.sheep.filter(o => o !== s && !o.ram && !o.lamb).slice(0, 3);   // (not on its own: a lost sheep wants its flock first)
  H.away([s, ...mates], tr.x + 80, tr.z + 80); H.place(s, tr.x + 9, tr.z + 2); s.hunger = 0.5; s.stress = 0; s.state = 'graze';
  mates.forEach((o, i) => { H.place(o, tr.x + 10 + i * 1.5, tr.z + 4); o.hunger = 0; o.stress = 0; });
  H.place(d, tr.x - 3, tr.z); H.pounce(d, tr.x, tr.z); H.run(0.5);
  const down = APPLES.filter(x => x.tree === tr && x.st === 1); out.down = down.length; out.near = down.every(x => Math.hypot(x.x - tr.x, x.z - tr.z) < T.apple.spread[1] + 0.2);
  H.place(d, tr.x + 40, tr.z - 40);
  const h0 = s.hunger; out.went = +H.run(15, () => s.state === 'apple').toFixed(1);
  H.run(15, () => G.stats.apples > 0); out.ate = G.stats.apples || 0; out.hungerDrop = +(h0 - s.hunger).toFixed(2);
  out.gone = APPLES.filter(x => x.tree === tr && x.st === 2).length;
  // a second shake straight away: more come down
  H.place(d, tr.x - 3, tr.z + 0.5); H.pounce(d, tr.x, tr.z); H.run(0.5); out.down2 = APPLES.filter(x => x.tree === tr && x.st === 1).length;
  // ones left lying rot in a couple of days; all grow back
  G.clock.day += 3; GAME.updateApples(); G.clock.day += 1; GAME.updateApples(); out.back = APPLES.filter(x => x.tree === tr && x.st === 0).length;
  // a full sheep doesn't bother
  H.fresh(); const s2 = G.sheep.find(o => !o.ram && !o.lamb); H.away([s2], tr.x + 80, tr.z + 80); H.place(s2, tr.x + 6, tr.z); s2.hunger = 0.02;
  H.place(d, tr.x - 3, tr.z); H.pounce(d, tr.x, tr.z); H.place(d, tr.x + 40, tr.z - 40); out.fullWent = H.run(8, () => s2.state === 'apple') < 8;
  return out;
});
if (a) {
  ok(`a pounce into the trunk drops ${a.down} apples round the tree`, a.down === 3 && a.near, a);
  ok(`a hungry sheep goes for one (${a.went}s) and eats it (−${a.hungerDrop} hunger)`, a.went < 15 && a.ate >= 1 && a.hungerDrop > 0.15 && a.gone >= 1, a);
  ok(`a second shake drops more (${a.down2})`, a.down2 >= 3, a);
  ok(`they grow back (${a.back}/6)`, a.back === 6, a);
  ok("a full sheep doesn't bother", !a.fullWent, a);
}

// 7. carrying one: grabbed, carried, dropped at the nose / lobbed on the run; held out (standing still): a hungry sheep comes
// and takes it; walking about with it, nobody does; one tossed into a pen: the penned eat it; one being munched: snatched;
// the whole flock about, a dog standing near: all the apples shaken down get eaten
const cr = await run('carry', () => {
  const { G, T, APPLE_TREES, APPLES, pens, step } = GAME; const out = {};
  const tr = APPLE_TREES[0], d = G.dogs[0], p = d.player, fx = (dx, dz) => H.inp(dx, dz, { grab: true });
  const down = () => { H.place(d, tr.x - 3, tr.z); H.pounce(d, tr.x, tr.z); H.run(0.6); return APPLES.filter(a => a.tree === tr && a.st === 1); };
  const grab = a => { H.place(d, a.x - 1.1, a.z); d.yaw = Math.PI / 2; p.bot = { grab: true }; step(0.025); return d.holding === a; };
  // grabbed and carried
  H.fresh(); H.away([], tr.x + 90, tr.z + 90); let A = down(), a = A[0]; for (const o of A.slice(1)) o.st = 2;
  out.grab = grab(a) && d.holdKind === 'apple' && a.dog === d;
  p.bot = fx(1, 0); H.run(2); out.carried = +Math.hypot(a.x - d.x - Math.sin(d.yaw) * 0.95, a.z - d.z - Math.cos(d.yaw) * 0.95).toFixed(2); out.moved = +Math.hypot(a.x - tr.x, a.z - tr.z).toFixed(1);
  // let go standing: at its nose
  p.bot = { grab: true }; H.run(1); p.bot = {}; H.run(1); out.drop = +Math.hypot(a.x - d.x, a.z - d.z).toFixed(1); out.dropFree = !a.dog && d.holding === null && a.h === 0;
  // let go running: lobbed ahead
  out.regrab = grab(a); p.bot = fx(-1, 0); H.run(1.2); const x0 = d.x; p.bot = H.inp(-1, 0); step(0.025); const t0 = a.h; H.run(2.5, () => false); out.flew = t0 > 0; out.toss = +(x0 - a.x).toFixed(1); out.lands = a.h === 0 && Math.hypot(a.vx, a.vz) < 0.05;
  // held out, standing still: a hungry sheep comes over and takes it from the mouth, without running off
  H.fresh(); A = down(); a = A[0]; for (const o of A.slice(1)) o.st = 2;
  const s = G.sheep.find(o => !o.ram && !o.lamb), mates = G.sheep.filter(o => o !== s && !o.ram && !o.lamb).slice(0, 3);
  H.away([s, ...mates], tr.x + 90, tr.z + 90); grab(a);
  H.place(d, tr.x - 8, tr.z); d.yaw = Math.PI / 2; p.bot = { grab: true }; H.run(0.2);
  H.place(s, tr.x + 6, tr.z + 1); s.hunger = 0.4; s.stress = 0; s.state = 'graze'; s.fear = 0; s.alert = 0;
  mates.forEach((o, i) => { H.place(o, tr.x + 7 + i * 1.5, tr.z + 4); o.hunger = 0; o.stress = 0; });
  let fled = 0; out.came = +H.run(20, () => { if (s.state === 'flee') fled++; return !a.dog; }).toFixed(1); out.fled = fled; out.taken = !a.dog && a.by === s && d.holding === null;
  H.run(4, () => a.st === 2); out.heldEaten = a.st === 2;
  // walking about with it: nobody comes for it
  H.fresh(); A = down(); a = A[0]; for (const o of A.slice(1)) o.st = 2; grab(a);
  H.place(d, tr.x - 8, tr.z); H.place(s, tr.x + 6, tr.z + 1); s.hunger = 0.4; s.stress = 0; s.state = 'graze';
  mates.forEach((o, i) => { H.place(o, tr.x + 7 + i * 1.5, tr.z + 4); o.hunger = 0; o.stress = 0; });
  let went = false; for (let k = 0; k < 8; k++) { p.bot = fx(0, k % 2 ? 1 : -1); H.run(1, () => { if (s.state === 'apple') went = true; }); } out.walkWent = went;
  // tossed into a pen: penned sheep eat it
  H.fresh(); const pen = pens[1]; A = down(); a = A[0]; for (const o of A.slice(1)) o.st = 2;
  const ps = G.sheep.filter(o => !o.ram && !o.lamb).slice(0, 4); H.away(ps, tr.x + 90, tr.z + 90);
  ps.forEach((o, i) => { H.place(o, pen.x + (i - 1.5) * 2, pen.z + 2); o.pen = o.wasPen = pen; o.hunger = i ? 0 : 0.4; o.stress = 0; o.state = 'idle'; });
  GAME.setGate ? GAME.setGate(pen, 0) : (pen.gateT = 0); a.dog = null; a.x = pen.x; a.z = pen.z - 2; a.h = 0; a.vx = a.vz = a.vy = 0; H.place(d, pen.x + 40, pen.z + 40);
  H.run(15, () => a.st === 2); out.penEat = a.st === 2;
  // munching one: a dog snatches it
  H.fresh(); A = down(); a = A[0]; for (const o of A.slice(1)) o.st = 2; H.place(d, tr.x - 40, tr.z);
  const s3 = G.sheep.find(o => !o.ram && !o.lamb); H.away([s3], tr.x + 90, tr.z + 90); H.place(s3, a.x + 1, a.z); s3.hunger = 0.4; s3.stress = 0; s3.state = 'idle'; s3.thinkT = 0;
  H.run(6, () => s3.state === 'apple' && s3.appleT > 0.3); out.munching = s3.state === 'apple';
  H.place(d, a.x - 1.1, a.z); d.yaw = Math.PI / 2; p.bot = { grab: true }; step(0.025); out.snatched = d.holding === a && s3.apple !== a; p.bot = {}; step(0.025);
  // the whole flock about, the dog standing 6 m off the tree: all of them eaten
  H.fresh(); G.sheep.forEach((o, i) => { const q = i * 2.4, r = 5 + (i % 7) * 1.6; H.place(o, tr.x + 10 + Math.cos(q) * r, tr.z + Math.sin(q) * r); o.hunger = 0.25 + (i % 5) * 0.05; o.stress = 0; o.state = 'graze'; });
  H.run(2); A = down(); H.place(d, tr.x - 6, tr.z); const e0 = G.stats.apples || 0;
  out.flockT = +H.run(30, () => A.every(o => o.st === 2)).toFixed(1); out.flockAte = (G.stats.apples || 0) - e0; out.flockDown = A.length; out.flockSt = A.map(o => [o.st, !!o.dog, +o.h.toFixed(2)]); out.dogHold = d.holdKind;
  return out;
});
if (cr) { const c = cr;
  ok(`grabbed, carried at the mouth (${c.carried} m off it, ${c.moved} m from the tree)`, c.grab && c.carried < 0.3 && c.moved > 3, c);
  ok(`let go standing: dropped at its nose (${c.drop} m)`, c.dropFree && c.drop < 1.8, c);
  ok(`let go running: lobbed ${c.toss} m, lands`, c.regrab && c.flew && c.toss > 3 && c.lands, c);
  ok(`held out: a hungry sheep comes and takes it (${c.came}s, fled ${c.fled}×) and eats it`, c.came < 20 && c.taken && c.fled === 0 && c.heldEaten, c);
  ok('walking about with one: nobody comes for it', !c.walkWent, c);
  ok('tossed into a pen: the penned eat it', c.penEat, c);
  ok('one being munched: a dog snatches it', c.munching && c.snatched, c);
  ok(`the flock about, a dog by the tree: all eaten (${c.flockAte}/${c.flockDown})`, c.flockAte === c.flockDown && c.flockDown === 3, c);
}

if (h.errors.length) { console.log(h.errors.slice(0, 5)); fails++; }
console.log(fails ? `${fails} FAILED` : 'all ok');
await h.close();
process.exit(fails ? 1 : 0);
