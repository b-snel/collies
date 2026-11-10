// Headless lambing test: `node tools/lamb-sim.mjs [--trials N] [--hunger H] [--trough FOOD] [--set k=v ...]`.
// The player's evening: the flock grazes by the valley camp from 13:00 (hunger 0.5), is penned at 19:30 with the gate
// shut, and the night runs to 6:30. Reports how many are well fed (under T.breedHunger) through the evening, how many
// ewes the rams courted, and the lambs born at dawn.
import { open } from './harness.mjs';
const args = process.argv.slice(2), ti = args.indexOf('--trials'), trials = ti >= 0 ? +args[ti + 1] : 3;
const tr = args.indexOf('--trough'), trough = tr >= 0 ? +args[tr + 1] : 0;
const hi = args.indexOf('--hunger'), hunger0 = hi >= 0 ? +args[hi + 1] : 0.5;   // the flock's hunger at 13:00
const sets = {}; args.forEach((a, i) => { if (a === '--set') { const [k, v] = args[i + 1].split('='); sets[k] = +v; } });
const h = await open({ query: '?sim&debug' });
for (let k = 0; k < trials; k++) {
  const r = await h.page.evaluate(({ trough, sets, hunger0 }) => {
    const { G, T, step, pens, setGate } = GAME; Object.assign(T, sets);
    if (!G.players.length) GAME.startGame({ kind: 'bot', index: 0 });
    GAME.resetGame(); G.players[0].bot = {}; for (const c of G.coyotes) c.gone = true;
    const pen = pens[1], n = Math.cos(pen.camp.gateA), m = Math.sin(pen.camp.gateA);
    G.clock.hour = 13;
    for (const s of G.sheep) { s.x = pen.gx + n * 18 + (Math.random() - 0.5) * 10; s.z = pen.gz + m * 18 + (Math.random() - 0.5) * 10; if (!s.lamb) s.hunger = hunger0; }
    const d = G.dogs[0]; d.x = pen.x - n * 50; d.z = pen.z - m * 50;
    const adults = () => G.sheep.filter(s => !s.dead && !s.lamb), ewes = () => adults().filter(s => !s.ram);
    const fed = () => adults().filter(s => s.hunger < T.breedHunger || s.ready).length;   // as the HUD counts them
    const out = { rams: adults().filter(s => s.ram).length, ewes: ewes().length };
    const run = until => { let guard = 0; while (!(G.clock.hour >= until && G.clock.hour < until + 1) && guard++ < 20000) step(0.05); };
    run(19.5); out.fedAtPenning = `${fed()}/${adults().length}`;
    // pen everyone (as a player would) and shut the gate
    G.sheep.filter(s => !s.dead).forEach((s, i) => { const a = i * 2.4, rr = 1.5 + (i % 4) * 1.6; s.x = pen.x + Math.cos(a) * rr; s.z = pen.z + Math.sin(a) * rr; s.vx = s.vz = 0; });
    setGate(pen, false); GAME.fillTroughs(pen, trough);
    let bred = new Set(), fedLog = {};
    const watch = until => { let guard = 0; while (!(G.clock.hour >= until && G.clock.hour < until + 1) && guard++ < 20000) { step(0.05); for (const s of ewes()) if (s.bred) bred.add(s.id); } };
    watch(20.5); fedLog['20:30'] = fed();
    watch(22); fedLog['22:00'] = fed();
    watch(2); fedLog['02:00'] = fed();
    const lambs0 = G.stats.born;
    watch(6.5);
    out.fedLater = fedLog; out.ewesCourted = bred.size; out.lambsBorn = G.stats.born - lambs0; out.dawnHunger = +(adults().reduce((a, s) => a + s.hunger, 0) / adults().length).toFixed(2);
    return out;
  }, { trough, sets, hunger0 });
  console.log(JSON.stringify(r));
}
if (h.errors.length) console.log('PAGE ERRORS', h.errors.slice(0, 3));
await h.close();
