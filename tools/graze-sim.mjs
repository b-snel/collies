// Graze test: `node tools/graze-sim.mjs ['[{}, {"foodValue":0.08}]'] [--moveon | --trough FOOD] [--trials N]`. Each JSON object overrides T numbers for one run.
//  fill (default): a hungry flock (hunger 0.7) is left alone on lush valley grass; prints its mean hunger over 90 s
//    (9 in-game hours at hourSec 10), when 3/4 of it is under 0.5 and when it's under 0.3 ("well fed"), the share of time
//    spent eating, and how the grazers space out: the share of grazing sheep with a neighbour closer than 1.2 m
//    (touching: bodies overlap), the share of grazing pairs that close, and the median nearest-neighbour distance.
//  --moveon: the flock (hunger 0.55) stands in the middle of a 16 m disc grazed bare, lush grass all round. Does it drift
//    on as a group to better grass? Prints how far the centroid has moved, how spread it is (p90 distance from the
//    centroid), how many are eating or have good grass within 2.5 m ("fed"), and how aligned the moving sheep's headings are (1 = all one way).
//  --trough FOOD: a hungry flock shut in the valley pen at 18:30 with FOOD units in its trough (0 = none): how many feed
//    at once, how many wait, whether the feeders crowd, hunger and well-fed ewes at 21:00 and dawn, lambs born.
import { open } from './harness.mjs';
const args = process.argv.slice(2), moveon = args.includes('--moveon');
const tri = args.indexOf('--trough'), trough = tri >= 0 ? +(args[tri + 1] || 0) : null;
const ti = args.indexOf('--trials'), trials = ti >= 0 ? +args[ti + 1] : 1;
const variants = JSON.parse(args.find(a => a.startsWith('[')) || '[{}]');
const h = await open({ query: '?sim&debug' });
for (const v of variants) for (let k = 0; k < trials; k++) {
  const r = await h.page.evaluate(([v, moveon, trough]) => {
    const { G, T, step, pathPoint, grassAt, sdfAt } = GAME, GR = GAME.grass;
    const keep = {}; for (const key in v) keep[key] = T[key];
    Object.assign(T, v);
    GAME.startGame({ kind: 'bot', index: 0 }); GAME.resetGame(); G.players[0].bot = {};
    const p = pathPoint(330, -8);   // valley, upstream of the river
    const d = G.dogs[0]; d.x = p.x + 60; d.z = p.z; G.clock.hour = 8;
    const adults = () => G.sheep.filter(s => !s.dead && !s.lamb);
    const live = () => G.sheep.filter(s => !s.dead && !s.grabbed && !s.pen);
    const head = s => grassAt(s.x + Math.sin(s.yaw) * 0.6, s.z + Math.cos(s.yaw) * 0.6);
    // spacing among grazing sheep
    let touch = 0, tn = 0, closeP = 0, pairs = 0; const nns = [];
    const spacing = () => {
      const gz = live().filter(s => s.state === 'graze');
      for (const a of gz) {
        let nn = 1e9; for (const b of live()) if (b !== a) nn = Math.min(nn, Math.hypot(a.x - b.x, a.z - b.z));
        if (nn < 1e9) { nns.push(nn); tn++; if (nn < 1.2) touch++; }
      }
      for (let i = 0; i < gz.length; i++) for (let j = i + 1; j < gz.length; j++) { pairs++; if (Math.hypot(gz[i].x - gz[j].x, gz[i].z - gz[j].z) < 1.2) closeP++; }
    };
    const out = { v };
    if (trough !== null) {
      // a hungry flock shut in the valley pen at 18:30, with (or without) a trough of feed: who eats, how they queue, lambs at dawn
      const pen = GAME.pens[1]; GAME.setGate(pen, false); if (pen.trough) pen.trough.food = trough || 0; else if (trough) pen.trough = { food: trough, cap: 12 };   // the pen's real trough
      for (const s of G.sheep) { const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * (pen.R - 2); s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.hunger = s.lamb ? 0.3 : 0.35 + Math.random() * 0.3; }
      G.clock.hour = 18.5; d.x = pen.x + 30;
      const food0 = trough || 0; let maxAt = 0, maxWait = 0, close = 0, samples = 0, hunger21 = null, wellFed21 = null;
      const ewes = () => G.sheep.filter(s => !s.dead && !s.lamb && !s.ram);
      while (!(G.clock.day === 2 && G.clock.hour >= 6.2)) {
        for (let i = 0; i < 4; i++) step(0.025);
        const at = G.sheep.filter(s => s.atTrough); maxAt = Math.max(maxAt, at.length); maxWait = Math.max(maxWait, G.sheep.filter(s => s.state === 'wait').length);
        for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) { samples++; if (Math.hypot(at[i].x - at[j].x, at[i].z - at[j].z) < 0.85) close++; }
        if (hunger21 === null && G.clock.hour >= 21 && G.clock.hour < 22) { hunger21 = +(adults().reduce((x, s) => x + s.hunger, 0) / adults().length).toFixed(2); wellFed21 = ewes().filter(s => s.hunger < T.breedHunger).length + '/' + ewes().length; }
      }
      Object.assign(out, { trough: food0, foodLeft: pen.trough ? +pen.trough.food.toFixed(2) : 0, maxAtTrough: maxAt, maxWaiting: maxWait, troughPairsTouching: samples ? +(close / samples).toFixed(3) : 0,
        hunger21h: hunger21, ewesWellFed21h: wellFed21, hungerDawn: +(adults().reduce((x, s) => x + s.hunger, 0) / adults().length).toFixed(2), lambsBorn: G.stats.born });
      pen.trough = undefined; Object.assign(T, keep); return out;
    }
    if (!moveon) {
      for (const s of G.sheep) { s.x = p.x + (Math.random() - .5) * 8; s.z = p.z + (Math.random() - .5) * 8; s.hunger = s.lamb ? 0.3 : 0.7; }
      let t = 0, eat = 0, n = 0;
      const marks = [10, 20, 30, 45, 60, 90];
      while (t < 90.01) {
        for (let i = 0; i < 4; i++) step(0.025); t += 0.1;
        const a = adults(); eat += a.filter(s => s.eating).length; n += a.length;
        const m = marks.find(m => Math.abs(m - t) < 0.05);
        if (m) out[m + 's'] = +(a.reduce((x, s) => x + s.hunger, 0) / a.length).toFixed(2);
        if (out.below05 === undefined && a.filter(s => s.hunger < 0.5).length >= a.length * 0.75) out.below05 = +t.toFixed(0);
        if (out.below03 === undefined && a.filter(s => s.hunger < 0.3).length >= a.length * 0.75) out.below03 = +t.toFixed(0);
        if (Math.abs(t % 1) < 0.05 && t > 5) spacing();
      }
      out.eatingShare = +(eat / n).toFixed(2);
    } else {
      // a 16 m disc grazed bare round the flock
      const R = 16;
      for (let b = 0; b < GR.VZ; b++) for (let a = 0; a < GR.VX; a++) {
        const x = GR.GMINX + a * GR.VS, z = GR.GMINZ + b * GR.VS; if (Math.hypot(x - p.x, z - p.z) < R) GR.gAmt[b * GR.VX + a] = 0.02;
      }
      GR.uploadGrass();
      for (const s of G.sheep) { s.x = p.x + (Math.random() - .5) * 8; s.z = p.z + (Math.random() - .5) * 8; s.hunger = s.lamb ? 0.3 : 0.55; s.state = 'graze'; }
      G.clock.hour = 9;
      let t = 0; const al = [];
      const cen = () => { const L = live(); let x = 0, z = 0; for (const s of L) { x += s.x; z += s.z; } return { x: x / L.length, z: z / L.length, L }; };
      while (t < 60.01) {
        for (let i = 0; i < 4; i++) step(0.025); t += 0.1;
        if (Math.abs(t % 1) < 0.05) {
          const c = cen(); let mx = 0, mz = 0, mn = 0;
          for (const s of c.L) { const sp = Math.hypot(s.vx, s.vz); if (sp > 0.3) { mx += s.vx / sp; mz += s.vz / sp; mn++; } }
          if (mn >= 4) al.push(Math.hypot(mx, mz) / mn);
          spacing();
        }
        for (const m of [10, 20, 30, 45, 60]) if (Math.abs(m - t) < 0.05) {
          const c = cen(), ds = c.L.map(s => Math.hypot(s.x - c.x, s.z - c.z)).sort((a, b) => a - b);
          out[m + 's'] = { moved: +Math.hypot(c.x - p.x, c.z - p.z).toFixed(1), p90: +ds[Math.floor(ds.length * 0.9)].toFixed(1), fed: c.L.filter(s => s.eating || [0, 1, 2, 3, 4, 5].some(q => grassAt(s.x + Math.cos(q) * 2.5, s.z + Math.sin(q) * 2.5) > 0.35)).length + '/' + c.L.length };
        }
      }
      out.headingsAligned = +(al.reduce((a, b) => a + b, 0) / Math.max(1, al.length)).toFixed(2);
      out.hungerEnd = +(adults().reduce((x, s) => x + s.hunger, 0) / adults().length).toFixed(2);
    }
    nns.sort((a, b) => a - b);
    out.touching = +(touch / Math.max(1, tn)).toFixed(2); out.closePairs = +(closeP / Math.max(1, pairs)).toFixed(3); out.nnMedian = +(nns[nns.length >> 1] || 0).toFixed(2);
    Object.assign(T, keep);
    return out;
  }, [v, moveon, trough]);
  console.log(JSON.stringify(r));
}
await h.close();
