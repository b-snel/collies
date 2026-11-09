// Graze test: `node tools/graze-sim.mjs '[{}, {"foodValue":0.08}]'`. A hungry flock (hunger 0.7) is left alone on lush
// valley grass; prints its mean hunger over 90 s (9 in-game hours), when 3/4 of it is under 0.5, and the share of time spent eating.
// Each JSON object overrides T numbers for one run.
import { open } from './harness.mjs';
const variants = JSON.parse(process.argv[2] || '[{}]');
const h = await open({ query: '?sim&debug' });
for (const v of variants) {
  const r = await h.page.evaluate((v) => {
    const { G, T, step, pathPoint } = GAME;
    Object.assign(T, v);
    GAME.startGame({ kind: 'bot', index: 0 }); GAME.resetGame(); G.players[0].bot = {};
    const p = pathPoint(330, -8);   // valley, upstream of the river
    for (const s of G.sheep) { s.x = p.x + (Math.random() - .5) * 8; s.z = p.z + (Math.random() - .5) * 8; s.hunger = s.lamb ? 0.3 : 0.7; }
    const d = G.dogs[0]; d.x = p.x + 60; d.z = p.z; G.clock.hour = 8;
    const adults = () => G.sheep.filter(s => !s.dead && !s.lamb);
    const out = { v }; let t = 0, eat = 0, n = 0;
    const marks = [10, 20, 30, 45, 60, 90];
    while (t < 90.01) {
      for (let i = 0; i < 4; i++) step(0.025); t += 0.1;
      const a = adults(); eat += a.filter(s => s.eating).length; n += a.length;
      const m = marks.find(m => Math.abs(m - t) < 0.05);
      if (m) out[m + 's'] = +(a.reduce((x, s) => x + s.hunger, 0) / a.length).toFixed(2);
      if (out.below05 === undefined && a.filter(s => s.hunger < 0.5).length >= a.length * 0.75) out.below05 = +t.toFixed(0);
    }
    out.eatingShare = +(eat / n).toFixed(2);
    return out;
  }, v);
  console.log(JSON.stringify(r));
}
await h.close();
