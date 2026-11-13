// Headless checks for BRAMBLES: where the patches are, a bolting sheep snagged, held fast, a grab pulls
// it out, a pounce bonks it just clear; calm sheep walk round. node tools/bramble-test.mjs
import { open } from './harness.mjs';
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

// 1. placement
const r1 = await h.page.evaluate(() => {
  const { BRAMBLES, sAt, sdfAt, PATH_LEN, CAMPS, trailInfo } = GAME, s = BRAMBLES.map(b => sAt(b.x, b.z));
  return { n: BRAMBLES.length, first: Math.min(...s), last: Math.max(...s), len: PATH_LEN, pass: GAME.T.pass.s0, minSdf: Math.min(...BRAMBLES.map(b => sdfAt(b.x, b.z))),
    onTrail: BRAMBLES.filter(b => Math.abs(trailInfo(b.x, b.z).lat) < 5).length, nearCamp: BRAMBLES.filter(b => CAMPS.some(c => Math.hypot(b.x - c.x, b.z - c.z) < c.R + 16)).length };
});
ok(`${r1.n} bramble bushes`, r1.n >= 40, r1);
ok('spread down the trail to the foot of the pass (none in the snow)', r1.first < 150 && r1.last > r1.pass - 250 && r1.last < r1.pass, r1);
ok('none on the trail, in rock or in a camp', r1.onTrail === 0 && r1.minSdf > 2 && r1.nearCamp === 0, r1);

// 2. snag, held, grab pulls it out, pounce pops it just clear
const r2 = await h.page.evaluate(() => {
  const { G, T, BRAMBLES, step, startGame, groundY, CAM_R, CAM_F } = GAME; const out = {};
  startGame({ kind: 'bot', index: 0 }); T.bramble.on = true; G.clock.hour = 10;
  const p = G.players[0], d = G.dogs[0], b = BRAMBLES[Math.floor(BRAMBLES.length / 2)];
  const inp = (dx, dz, x = {}) => ({ mx: dx * CAM_R.x + dz * CAM_R.z, my: -(dx * CAM_F.x + dz * CAM_F.z), ...x });
  const place = (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); };
  const run = (sec, fn) => { for (let t = 0; t < sec; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return sec; };
  G.sheep.forEach((o, i) => place(o, b.x + 60 + (i % 6) * 2, b.z + 60 + Math.floor(i / 6) * 2));
  const s = G.sheep.find(o => !o.ram && !o.lamb); place(s, b.x - 4, b.z); place(d, b.x + 40, b.z + 40); p.bot = {};
  s.breakT = 2; s.bdx = 1; s.bdz = 0;   // bolting straight at the bush
  T.bramble.snagRun = 60;
  const t = run(2, () => !!s.snag); out.snagged = !!s.snag; out.secs = +t.toFixed(2); T.bramble.snagRun = 2.2;
  const x0 = s.x, z0 = s.z; run(10); out.drift = +Math.hypot(s.x - x0, s.z - z0).toFixed(2); out.still = !!s.snag; out.stress = +s.stress.toFixed(2);
  // a grab pulls it out
  place(d, s.x - 1.6, s.z); d.yaw = Math.PI / 2; p.bot = inp(0, 0, { grab: true }); run(0.5); out.held = d.holding === s; out.grabFreed = !s.snag; p.bot = {}; run(0.3);
  // snagged again, a pounce pops it just clear of the bush
  place(s, x0, z0); s.snag = b; s.snagX = x0; s.snagZ = z0; s.stress = 0.5; run(0.5);
  place(d, s.x - 2.2, s.z); d.yaw = Math.PI / 2; d.pounceCD = 0;
  p.bot = inp(1, 0, { pounce: true }); step(0.025); p.bot = {};
  out.freed = !s.snag; run(4); out.flew = +Math.hypot(s.x - x0, s.z - z0).toFixed(1); out.clear = Math.hypot(s.x - b.x, s.z - b.z) - b.r; out.alive = !s.dead; out.calm = s.stress < 0.5;
  out.stats = { snags: G.stats.snags, unsnags: G.stats.unsnags };
  return out;
});
ok(`a bolting sheep is snagged (${r2.secs}s)`, r2.snagged, r2);
ok('held fast for 10 s', r2.still && r2.drift < 0.5, r2);
ok('it gets stressed', r2.stress > 0.3, r2);
ok('a grab pulls it out', r2.held && r2.grabFreed, r2);
ok(`a pounce pops it just clear (${r2.flew} m)`, r2.freed && r2.clear > 0 && r2.flew < 7 && r2.alive && r2.calm, r2);

// 3. calm walkers go round: a dog creeps a few sheep past a patch; few snag
const r3 = await h.page.evaluate(() => {
  const { G, T, BRAMBLES, step, groundY, resetGame } = GAME; resetGame(); T.bramble.on = true; G.clock.hour = 10;
  const p = G.players[0], d = G.dogs[0]; p.bot = {}; let snags = 0, walked = 0;
  const place = (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); };
  for (let k = 0; k < 12; k++) {
    const b = BRAMBLES[(k * 7) % BRAMBLES.length];
    G.sheep.forEach((o, i) => place(o, b.x + 200 + i * 2, b.z + 200));
    const s = G.sheep.find(o => !o.ram && !o.lamb && !o.dead); place(s, b.x - 5, b.z + (k % 3 - 1) * 0.4); s.snag = null; s.stress = 0; s.panic = 0; s.fear = 0;
    place(d, b.x + 200, b.z - 200);
    s.state = 'move'; s.tx = b.x + 6; s.tz = b.z; s.gx = b.x + 6; s.gz = b.z;
    for (let t = 0; t < 4; t += 0.025) { s.vx = Math.max(s.vx, 0); step(0.025); if (s.snag) { snags++; break; } }
    walked++;
  }
  return { snags, walked };
});
ok(`calm sheep near a patch rarely snag (${r3.snags}/${r3.walked})`, r3.snags <= 4, r3);

console.log(fails ? `${fails} FAILED` : 'all ok');
await h.close();
process.exit(fails ? 1 : 0);
