// Headless checks for HUD messages: one on screen at a time. Toasts queue (no repeats, ≤4), each shorter while more wait;
// a toast up hides the hint and its clock waits; touch (phone) layout too, where both sit at the top.
// node tools/toast-test.mjs [--shots DIR]
import { open } from './harness.mjs';
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const h = await open({ query: '?sim&touch', width: 844, height: 390 });
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

const r = await h.page.evaluate(() => {
  const { G, startGame, renderOnce, toast, hint } = GAME;
  startGame({ kind: 'touch', index: 0 }); renderOnce(0.1);
  const box = document.getElementById('toasts'), hel = document.getElementById('hint');
  const shown = () => [...box.children].filter(e => getComputedStyle(e).display !== 'none' && !e.gone).map(e => e.textContent);
  const hintUp = () => hel.classList.contains('show') && !hel.classList.contains('wait');
  const run = (s, dt = 0.1) => { const seen = []; for (let t = 0; t < s; t += dt) { renderOnce(dt); seen.push(shown().length + (hintUp() ? 1 : 0)); } return seen; };
  G.hints.night = false; hint('night'); run(1);
  const hintFirst = hintUp();
  toast('A'); toast('B'); toast('B'); toast('C');
  const queued = [...box.children].map(e => e.textContent);
  const most = Math.max(...run(1));
  const hidden = !hintUp(), first = shown();
  const all = run(8);
  const back = hintUp();
  for (const m of ['1', '2', '3', '4', '5', '6']) toast(m);
  return { hintFirst, queued, most, hidden, first, max: Math.max(most, ...all), back, left: box.children.length, empty: all.at(-1) };
});
ok('a hint shows', r.hintFirst, r);
ok('toasts queue, no repeats', r.queued.join() === 'A,B,C', r);
ok('one message on screen at a time', r.most === 1 && r.max === 1, r);
ok('a toast up: the hint steps aside', r.hidden && r.first.join() === 'A', r);
ok('toasts done: the hint is back', r.back, r);
ok('≤4 waiting', r.left <= 4, r);
if (shots) { await h.page.evaluate(() => GAME.renderOnce(0.1)); await h.page.screenshot({ path: `${shots}/toast.png` }); }
ok('no page errors', !h.errors.length, h.errors);
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
