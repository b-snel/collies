// Headless den test: `node tools/den-test.mjs`. Coyotes can be bonked again and again (also running home), and never vanish.
import { open } from './harness.mjs';
const h = await open({ query: '?sim&debug' });
const r = await h.page.evaluate(() => {
  const { G, step, CAMPS, pathPoint } = GAME;
  GAME.startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {};
  const tick = n => { for (let i = 0; i < n; i++) step(0.025); };
  const p = pathPoint(CAMPS[1].s - 30, 0);
  for (const s of G.sheep) { s.x = p.x + (Math.random() - .5) * 10; s.z = p.z + (Math.random() - .5) * 10; }
  const d = G.dogs[0]; d.x = p.x + 8; d.z = p.z; G.clock.hour = 20.45; tick(200);
  const c = G.coyotes.find(c => c.state !== 'sleep');
  const log = [];
  for (let k = 0; k < 8; k++) {
    if (c.air) tick(80);
    const st = c.state, cour = +c.courage.toFixed(2);
    d.x = c.x - 1.5; d.z = c.z; d.vx = d.vz = 0; d.pounceCd = 0; d.stunT = 0; d.pounceT = 0; d.holding = null;
    // aim straight at it: world dir (1,0) -> screen-space input
    const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
    G.players[0].bot = { mx: R.x, my: -F.x, pounce: true }; tick(1); G.players[0].bot = { mx: R.x, my: -F.x }; tick(6); G.players[0].bot = {};
    log.push({ before: st, courage: cour, airAfter: !!c.air, tumble: +c.tumble.toFixed(2) });
    tick(40);
  }
  return { log, finalState: c.state, gone: !!c.gone };
});
console.log(JSON.stringify(r)); console.log(h.errors.slice(0, 5));
let fails = 0; const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) fails++; };
const L = r.log, home = L.filter(b => b.before === 'leave' || b.before === 'flee');
ok(`bonked ${L.filter(b => b.airAfter).length}/${L.length} times, each one flies`, L.length === 8 && L.every(b => b.airAfter));
ok(`running home too (${home.length} of them)`, home.length >= 3 && home.every(b => b.airAfter));
ok(`its heart goes (${L[0].courage} → ${L.at(-1).courage}), it heads home (${r.finalState})`, L.at(-1).courage < L[0].courage - 1 && ['leave', 'flee', 'sleep'].includes(r.finalState));
ok('never vanishes', !r.gone);
ok('no page errors', !h.errors.length);
await h.close();
process.exit(fails ? 1 : 0);
