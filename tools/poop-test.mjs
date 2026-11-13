// POOP: scared sheep drop pellets now and then; calm ones don't; pellets settle on the ground and go
import { open } from './harness.mjs';
const h = await open({ query: '?sim&debug' });
const r = await h.page.evaluate(() => {
  const { G, T, step, POOP, syncPoop, groundY } = GAME;
  GAME.startGame({ kind: 'bot', index: 0 }); GAME.resetGame(); G.players[0].bot = {}; G.clock.hour = 9;
  for (const c of G.coyotes) c.gone = true;
  const live = () => G.sheep.filter(s => !s.dead);
  const run = (sec, scared) => { for (let i = 0; i < sec * 30; i++) { if (scared) for (const s of live()) { s.stress = 1; s.panic = 1; } step(1 / 30); } };
  POOP.length = 0; run(60, false); const calm = POOP.length;
  run(60, true); const scared = POOP.length, sheep = live().length;
  for (let i = 0; i < 60; i++) syncPoop(1 / 30);
  const off = POOP.reduce((m, p) => Math.max(m, Math.abs(p.y - p.sz * 0.8 - groundY(p.x, p.z))), 0);
  for (let i = 0; i < T.poop.life * 10 + 10; i++) syncPoop(0.1);
  return { calm, scared, sheep, off, left: POOP.length };
});
console.log(r);
const ok = r.calm === 0 && r.scared >= 10 && r.off < 0.02 && r.left === 0 && !h.errors.length;
if (h.errors.length) console.log(h.errors.join('\n'));
console.log(ok ? 'PASS' : 'FAIL'); await h.close(); process.exit(ok ? 0 : 1);
