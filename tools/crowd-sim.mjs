// Big flock: `node tools/crowd-sim.mjs [graze|trough|day] [--n N] [--trials N] ['[{T overrides}, ...]']` (nested ones merge).
//  graze: N hungry sheep (0.55…0.95) packed together, left alone 8 in-game hours. Mean / worst hunger, how many still
//    hungry (>0.7) or starving, and the middle third's eating share vs the edge third's.
//    --at S: that far along the trail (330: the valley, default; 100: desert). --bare R: the ground within R m grazed to stubble first.
//  trough: N hungry sheep (0.5…0.95) shut in the valley pen at 18:00, troughs holding enough for all, no predators. How many ate,
//    worst hunger at 21:00 and dawn, how many never got a place.
//  day: N sheep (hunger 0.4…0.8) at the valley camp from 07:00 to 20:00, no dog: deaths, worst / mean hunger.
import { open } from './harness.mjs';
const args = process.argv.slice(2), mode = args.find(a => /^(graze|trough|day)$/.test(a)) || 'graze';
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
const n = arg('--n', 40), trials = arg('--trials', 1), bare = arg('--bare', 0), at = arg('--at', 330);
const variants = JSON.parse(args.find(a => a.startsWith('[')) || '[{}]');
const h = await open({ query: '?sim&debug' });
for (const v of variants) for (let k = 0; k < trials; k++) {
  const r = await h.page.evaluate(([v, mode, n, bare, at]) => {
    const { G, T, step, pathPoint, pens } = GAME;
    const deep = (o, src) => { for (const key in src) { if (src[key] && typeof src[key] === 'object' && !Array.isArray(src[key])) deep(o[key], src[key]); else o[key] = src[key]; } };
    const keep = JSON.parse(JSON.stringify(T)); deep(T, v);
    GAME.startGame({ kind: 'bot', index: 0 }); GAME.resetGame(); G.players[0].bot = {};
    G.shoves = G.grassShoves = 0;
    const d = G.dogs[0], pen = pens[1];
    const rnd = (a, b) => a + Math.random() * (b - a);
    // grow the flock to n (ewes; the two rams stay)
    while (G.sheep.length < n) G.sheep.push(GAME.makeSheep(0, 0, { age: 12 }));
    const S = () => G.sheep.filter(s => !s.dead);
    for (const s of G.sheep) { s.thirst = 0; s.salt = 0.9; s.lamb = false; s.grow = 1; s.r = s.ram ? T.ramRadius : T.sheepR; }
    const stat = (out, tag) => { const L = S(), hs = L.map(s => s.hunger).sort((a, b) => a - b); out[tag] = { mean: +(hs.reduce((a, b) => a + b, 0) / hs.length).toFixed(2), p90: +hs[Math.floor(hs.length * 0.9)].toFixed(2), max: +hs[hs.length - 1].toFixed(2), over07: hs.filter(x => x > 0.7).length, starving: hs.filter(x => x >= 1).length }; };
    const out = { v, mode, n, ...(mode === 'graze' ? { at, bare } : {}) };
    if (mode === 'graze') {
      const p = pathPoint(at, -8); d.x = p.x + 80; d.z = p.z; G.clock.hour = 8;
      const side = Math.sqrt(n) * 1.6;
      if (bare) {   // the ground under the flock grazed to stubble, lush grass beyond
        const GR = GAME.grass; for (let b = 0; b < GR.VZ; b++) for (let a = 0; a < GR.VX; a++) { const x = GR.GMINX + a * GR.VS, z = GR.GMINZ + b * GR.VS; if (Math.hypot(x - p.x, z - p.z) < bare) GR.gAmt[b * GR.VX + a] = 0.03; }
        GR.uploadGrass();
      }
      for (const s of G.sheep) { s.x = p.x + rnd(-side / 2, side / 2); s.z = p.z + rnd(-side / 2, side / 2); s.hunger = rnd(0.55, 0.95); s.state = 'graze'; }
      const eat = new Map(), mid = new Map(); let t = 0;
      const end = 8 * T.dayHourSec;
      while (t < end) {
        for (let i = 0; i < 4; i++) step(0.025); t += 0.1;
        const L = S(); let cx = 0, cz = 0; for (const s of L) { cx += s.x; cz += s.z; } cx /= L.length; cz /= L.length;
        const ds = L.map(s => [s, Math.hypot(s.x - cx, s.z - cz)]).sort((a, b) => a[1] - b[1]);
        ds.forEach(([s], i) => { eat.set(s, (eat.get(s) || 0) + (s.eating ? 1 : 0)); if (i < L.length / 3) mid.set(s, (mid.get(s) || 0) + 1); else if (i >= L.length * 2 / 3) mid.set(s, (mid.get(s) || 0) - 1); });
        if (Math.abs(t - 2 * T.dayHourSec) < 0.05) stat(out, '2h');
        if (Math.abs(t - 4 * T.dayHourSec) < 0.05) stat(out, '4h');
      }
      stat(out, '8h');
      const steps = end / 0.1, L = S(), inner = L.filter(s => (mid.get(s) || 0) > steps * 0.3), outer = L.filter(s => (mid.get(s) || 0) < -steps * 0.3);
      const sh = a => a.length ? +(a.reduce((x, s) => x + eat.get(s), 0) / a.length / steps).toFixed(2) : null;
      Object.assign(out, { eatMid: sh(inner), eatEdge: sh(outer), nMid: inner.length, nEdge: outer.length, starved: G.stats.starved, grassShoves: G.grassShoves || 0 });
    } else if (mode === 'trough') {
      GAME.setGate(pen, false); const need = n * 0.85; GAME.fillTroughs(pen, need); T.cougar.chance = 0;   // no predators: just supper
      for (const s of G.sheep) { const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * (pen.R - 2); s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.hunger = rnd(0.5, 0.95); }
      G.clock.hour = 18; d.x = pen.x + 40; d.z = pen.z;
      const ate = new Set(); let maxAt = 0;
      const h0 = new Map(G.sheep.map(s => [s, s.hunger]));
      while (!(G.clock.day === 2 && G.clock.hour >= 5.4)) {
        for (let i = 0; i < 4; i++) { step(0.025); G.coyotes.length = 0; }
        const at = G.sheep.filter(s => s.atTrough); maxAt = Math.max(maxAt, at.length); for (const s of at) ate.add(s);
        if (!out['21h'] && G.clock.day === 1 && G.clock.hour >= 21) stat(out, '21h');
      }
      stat(out, 'dawn');
      Object.assign(out, { pen: { R: +pen.R.toFixed(1), troughs: pen.troughs.length, spots: GAME.troughSpots(pen).length }, foodLeft: +GAME.troughFood(pen).toFixed(1), ate: ate.size + '/' + S().length, maxAt, shoves: G.shoves || 0, starved: G.stats.starved });
    } else {
      d.x = pen.x - 80; d.z = pen.z; G.clock.hour = 7;
      for (const s of G.sheep) { s.x = pen.exitX + rnd(-8, 8); s.z = pen.exitZ + rnd(-8, 8); s.hunger = rnd(0.4, 0.8); }
      GAME.setGate(pen, true);
      while (G.clock.hour < 20) {
        for (let i = 0; i < 4; i++) step(0.025);
        if (!out['12h'] && G.clock.hour >= 12) stat(out, '12h');
        if (!out['16h'] && G.clock.hour >= 16) stat(out, '16h');
      }
      stat(out, '20h');
      Object.assign(out, { starved: G.stats.starved, grassShoves: G.grassShoves || 0 });
    }
    deep(T, keep);
    return out;
  }, [v, mode, n, bare, at]);
  console.log(JSON.stringify(r));
}
if (h.errors.length) console.log('PAGE ERRORS', h.errors.slice(0, 5));
await h.close();
