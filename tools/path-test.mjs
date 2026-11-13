// Headless test: `node tools/path-test.mjs [hank|coyote|den]`. Hank and coyotes round a shut pen: no shoving at the fence, no wiggling.
import { open } from './harness.mjs';
const only = process.argv[2];
const h = await open();
// wiggle: in some 3 s, walked > 3 m but got < 1 m anywhere
const wig = `const wiggles = pos => { let n = 0; for (let i = 0; i + 60 < pos.length; i += 10) { let L = 0; for (let k = i; k < i + 60; k++) L += Math.hypot(pos[k + 1][0] - pos[k][0], pos[k + 1][1] - pos[k][1]); if (L > 3 && Math.hypot(pos[i + 60][0] - pos[i][0], pos[i + 60][1] - pos[i][1]) < 1) n++; } return n; };`;
const setup = `
  const { G, T, step, startGame, resetGame, living, pens, setGate, HANK: HK } = GAME;
  const fresh = () => { if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); else resetGame(); G.players[0].bot = {}; T.burrow.on = false; for (const c of G.coyotes) c.gone = true; step(0.05); };
  const at = (o, x, z) => { o.x = x; o.z = z; o.vx = o.vz = 0; };
  ${wig}
`;
const tests = {
  // Hank on all sides of a shut pen, his goal on the far side (the campfire at dusk; a patient out there): round it, never over or into the fence
  hank: () => h.page.evaluate(new Function(`${setup}
    const out = { fire: [], treat: [] };
    for (const kind of ['fire', 'treat']) for (let ai = 0; ai < 12; ai++) {
      fresh();
      const pen = pens[0], d = G.dogs[0], live = living(), ang = pen.gateA + ai / 12 * Math.PI * 2;
      at(d, pen.x - Math.cos(pen.gateA) * 40, pen.z - Math.sin(pen.gateA) * 40);
      if (kind === 'fire') { live.forEach((s, i) => { const a = i * 2.4, r = 1 + (i % 4) * 1.2; at(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); s.pen = pen; s.state = 'idle'; }); G.clock.hour = 19; }
      else { live.forEach((s, i) => { const a = ang + Math.PI + (i % 5 - 2) * 0.08, r = pen.R + 6 + (i / 5 | 0) * 1.5; at(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); s.pen = null; s.state = 'idle'; }); G.clock.hour = 10; }
      setGate(pen, false); G.clock.day = 2;
      at(HK, pen.x + Math.cos(ang) * (pen.R + 2.5), pen.z + Math.sin(ang) * (pen.R + 2.5)); Object.assign(HK, { goal: null, asleep: false, stuckT: 0, lastX: HK.x, lastZ: HK.z });
      let pat = null, px = 0, pz = 0; if (kind === 'treat') { HK.meds = { venom: 0, bandage: 5, pills: 0 }; pat = live.find(s => !s.ram); pat.bleed = 0.05; pat.bleedRate = 1 / 50; px = pat.x; pz = pat.z; }
      let t = 0, done = null, hops = 0, inPen = 0; const pos = [];
      for (; t < 40 && done === null; t += 0.05) {
        if (pat) at(pat, px, pz);   // (it stays put: the way there's what's tested)
        step(0.05); pos.push([HK.x, HK.z]);
        if (HK.hopT > 1.4 || HK.climb) hops++;
        if (Math.hypot(HK.x - pen.x, HK.z - pen.z) < pen.R) inPen++;
        if (kind === 'fire' ? Math.hypot(HK.x - pen.fire.x, HK.z - pen.fire.z) < 2.8 : HK.care && HK.care.on) done = +t.toFixed(1);
      }
      out[kind].push({ ai, done, hops, inPen, wig: wiggles(pos) });
    }
    return out;
  `)),
  // a coyote outside a shut pen sent for a sheep inside it: it waits by the fence, not shoving at it; that sheep (s.pen or not) isn't prey
  coyote: () => h.page.evaluate(new Function(`${setup}
    fresh(); G.clock.day = 3; G.clock.hour = 21;
    const pen = pens[0], d = G.dogs[0], live = living();
    at(d, pen.x - Math.cos(pen.gateA) * 60, pen.z - Math.sin(pen.gateA) * 60);
    live.forEach((s, i) => { const a = i * 2.4, r = 1 + (i % 4) * 1.2; at(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); s.pen = pen; s.state = 'idle'; });
    setGate(pen, false);
    const p = GAME.spawnPack(1, { howl: false }), c = p.members[0], far = pen.gateA + Math.PI * 0.6;
    at(c, pen.x + Math.cos(far) * (pen.R + 6), pen.z + Math.sin(far) * (pen.R + 6));
    const s = live.find(s => !s.ram), sx = pen.x + Math.cos(far + Math.PI) * (pen.R - 1.5), sz = pen.z + Math.sin(far + Math.PI) * (pen.R - 1.5); s.pen = null;   // (inside, across the pen, whatever s.pen says)
    at(s, sx, sz); const prey = GAME.huntable(s);
    c.pack = null; p.members = []; G.packs = G.packs.filter(q => q !== p);   // (no pack brain: its goal is ours)
    const pos = []; let shove = 0, inside = 0;
    for (let t = 0; t < 12; t += 0.05) {
      at(s, sx, sz); c.state = 'pack'; c.gx = s.x; c.gz = s.z; c.spd = 4.6; c.crouchW = 0; c.courage = 9;
      step(0.05); pos.push([c.x, c.z]);
      const r = Math.hypot(c.x - pen.x, c.z - pen.z);
      if (t > 8 && Math.hypot(c.vx, c.vz) > 0.5) shove++;   // (still going at it once it's there)
      if (r < pen.R) inside++;
    }
    const r = Math.hypot(c.x - pen.x, c.z - pen.z) - pen.R, toSheep = Math.hypot(c.x - s.x, c.z - s.z);
    return { prey, wig: wiggles(pos.slice(100)), shove, inside, fromFence: +r.toFixed(2), toSheep: +toSheep.toFixed(1), v: +Math.hypot(c.vx, c.vz).toFixed(2) };
  `)),
  // home at dawn: every coyote gets to its den and curls up (no circling a slot by the rocks)
  den: () => h.page.evaluate(new Function(`${setup}
    const out = [];
    fresh(); const nD = G.dens.length;
    for (let di = 0; di < nD; di++) {
      fresh(); G.clock.day = 3; G.clock.hour = 4; const D = G.dens[di];   // (a new journey: new dens)
      const live = living(); live.forEach(s => at(s, s.x, s.z));
      GAME.wakeDen(D, 5); const p = D.pack;
      p.members.forEach((c, i) => { const a = i * 1.3; at(c, D.x + D.mx * 14 + Math.cos(a) * 3, D.z + D.mz * 14 + Math.sin(a) * 3); });
      GAME.setPhase(p, 'retreat');
      const pos = new Map(p.members.map(c => [c, []])); let t = 0;
      for (; t < 30 && !D.coyotes.every(c => c.state === 'sleep'); t += 0.05) { step(0.05); for (const c of p.members) pos.get(c).push([c.x, c.z]); }
      out.push({ asleep: D.coyotes.filter(c => c.state === 'sleep').length, n: D.coyotes.length, t: +t.toFixed(1), wig: Math.max(...[...pos.values()].map(wiggles)) });
    }
    return out;
  `)),
};
const checks = {
  hank: r => [['round the pen to the fire, every side', r.fire.every(o => o.done !== null && o.done < 15)], ['…to a patient past it', r.treat.every(o => o.done !== null && o.done < 25)],
    ['never over the fence', [...r.fire, ...r.treat].every(o => o.hops === 0 && o.inPen === 0)], ['no wiggling', [...r.fire, ...r.treat].every(o => o.wig === 0)]],
  coyote: r => [['penned sheep isn\'t prey', !r.prey], ['round to it, by the fence', r.inside === 0 && r.fromFence > 0.6 && r.fromFence < 2 && r.toSheep < 3.5], ['waits there', r.shove < 5 && r.v < 0.5], ['no wiggling', r.wig === 0]],
  den: r => [['home and asleep', r.every(o => o.asleep === o.n)], ['no circling', r.every(o => o.wig === 0)]],
};
let ok = true;
for (const k of Object.keys(tests)) {
  if (only && k !== only) continue;
  const r = await tests[k](); console.log(k, JSON.stringify(r));
  for (const [what, pass] of checks[k](r)) { ok &&= pass; console.log(pass ? 'PASS' : 'FAIL', `${k}: ${what}`); }
}
if (h.errors.length) { console.log(h.errors.slice(0, 5).join('\n')); ok = false; }
await h.close(); process.exit(ok ? 0 : 1);
