// Headless test: `node tools/falcon-test.mjs [eat|bark|nest|dog|dogbark|night|odds|gone]`. FALCON.
//   eat    a sheep is taken, carried to the nearest nest and eaten there: stone at the foot of the spire
//   bark   a dog barks under it while it carries a sheep: dropped, lands alive
//   nest   a dog barks at the spire while it sits on the nest: the sheep hops down alive
//   dog    it takes a dog: carried a way, dropped, lands on its feet
//   dogbark  the dog it's after barks: it flies off, no grab
//   night  never comes at night
//   odds   a day in the open with it on: how often it comes, never at night
//   gone   past FALCON CANYON (the snakes, the pass, the sea): never comes, not even back short of it; one circling there
//          gives up; a new journey: back
import { open } from './harness.mjs';
const only = process.argv[2];
const h = await open();
const run = (scen) => h.page.evaluate(async (scen) => {
  const { G, T, step, startGame, resetGame, NESTS, FALCON: F, falconCome, falconPick, living, groundY, pathPoint, seaStart, SEA, flockCenter, sAt } = GAME;
  if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); else resetGame();
  const p = G.players[0]; p.bot = {}; const d = G.dogs[0];
  T.falcon.on = scen === 'night' || scen === 'odds';
  const N = NESTS[1], live = living();
  live.forEach(s => { s.x = N.x + 30 + (Math.random() - 0.5) * 10; s.z = N.z + (Math.random() - 0.5) * 10; s.vx = s.vz = 0; s.pen = null; s.hunger = 0.3; });
  d.x = N.x + 70; d.z = N.z; G.clock.hour = 12; G.clock.day = 2;
  const R = { nests: NESTS.length, start: live.length };
  if (scen === 'gone') {
    T.falcon.on = true; R.nestPast = NESTS.filter(N => N.s >= T.canyon.s1).length;
    const day = (hours) => { G.falconIn = 0; let came = 0, was = F.state; for (let i = 0; i < hours * T.hourSec / 0.025; i++) { if (G.clock.hour > 17) G.clock.hour = 9; step(0.025); if (F.state === 'circle' && was !== 'circle') { came++; const c = flockCenter(); R.cameAt = [+sAt(c.x, c.z).toFixed(0), +sAt(F.target.x, F.target.z).toFixed(0)]; } was = F.state; } return came; };
    const at = (s) => { const q = pathPoint(s, 0), d = G.dogs[0]; living().forEach(o => { o.x = q.x + (Math.random() - 0.5) * 8; o.z = q.z + (Math.random() - 0.5) * 8; o.vx = o.vz = 0; o.pen = null; }); d.x = q.x + 6; d.z = q.z; G.clock.hour = 9; };
    at(T.canyon.s1 + 40); R.pick = !!falconPick(); R.snakes = day(8);
    at(1300); R.pass = day(8);
    at(400); R.back = day(6);   // wandered back: still gone
    falconCome(living().find(o => !o.ram)); for (let i = 0; i < 20; i++) step(0.025);   // circling over them short of the canyon …
    at(1300); let left = false; for (let i = 0; i < 200 && !left; i++) { step(0.025); left = F.state === 'leave'; }   // … then they're up the pass
    R.circling = left; for (let i = 0; i < 400; i++) step(0.025); R.after = F.state;
    resetGame(); at(400); R.fresh = day(8);   // a new journey: it's back
    seaStart({ under: true, leg: 1 }); G.clock.hour = 9; R.sea = day(8); R.seaOn = SEA.on;
    return R;
  }
  if (scen === 'night' || scen === 'odds') {
    G.falconIn = 0; let came = 0, nightCame = 0, was = 'away';
    const hours = scen === 'odds' ? 24 : 6; if (scen === 'night') G.clock.hour = 21;
    for (let i = 0; i < hours * T.hourSec / 0.025; i++) { step(0.025); if (F.state === 'circle' && was !== 'circle') { came++; if (G.clock.hour > T.falcon.to || G.clock.hour < T.falcon.from) nightCame++; } was = F.state; }
    return { ...R, came, nightCame };
  }
  const target = scen === 'dog' || scen === 'dogbark' ? d : live.find(s => !s.ram);
  if (scen === 'dog' || scen === 'dogbark') { d.x = N.x + 30; d.z = N.z; }
  const tx = target.x, tz = target.z;
  falconCome(target);
  let t = 0, grabbed = false, maxH = 0, saved0 = G.stats.saved, lost0 = G.stats.falcon || 0, states = {}, dropAt = null, atNest = false, landed = null;
  while (t < 90) {
    if (scen === 'bark' && F.state === 'carry' && F.prey && F.t > 1) { d.x = F.x + 2; d.z = F.z; p.bot = { bark: true }; }
    else if (scen === 'nest' && F.state === 'nest' && F.t > 2) { d.x = N.x + 5; d.z = N.z; p.bot = { bark: true }; }
    else if (scen === 'dogbark' && (F.state === 'circle' || F.state === 'dive') && F.t > 1) p.bot = { bark: true };
    else p.bot = {};
    step(0.025); t += 0.025; states[F.state] = (states[F.state] || 0) + 1;
    if (F.prey === target || F.dog === target) { grabbed = true; maxH = Math.max(maxH, target.y - groundY(target.x, target.z)); }
    if (F.state === 'nest') atNest = true;
    if (grabbed && !dropAt && F.state === 'leave') dropAt = +t.toFixed(1);
    if (dropAt && !target.air && !target.grabbed) { landed = { dead: !!target.dead, moved: +Math.hypot(target.x - tx, target.z - tz).toFixed(1) }; break; }
    if (target.dead) break;
    if (scen === 'dogbark' && F.state === 'leave') break;
  }
  const g = G.graves.find(g => g.name === target.name);
  return { ...R, grabbed, maxH: +maxH.toFixed(1), atNest, dropAt, landed, dead: !!target.dead, saved: G.stats.saved - saved0, lost: (G.stats.falcon || 0) - lost0,
    graveFromNest: g ? +Math.hypot(g.x - N.x, g.z - N.z).toFixed(1) : null, why: (G.lost.at(-1) || {}).why, states, t: +t.toFixed(1) };
}, scen);
const scens = only ? [only] : ['eat', 'bark', 'nest', 'dog', 'dogbark', 'night', 'odds', 'gone'];
let fail = 0;
for (const sc of scens) {
  const r = await run(sc);
  let ok = r.nests >= 4;
  if (sc === 'eat') ok &&= r.grabbed && r.atNest && r.dead && r.lost === 1 && r.why === 'falcon' && r.graveFromNest < 4 && r.maxH > 4;
  if (sc === 'bark') ok &&= r.grabbed && r.maxH > 2 && !r.atNest && r.landed && !r.landed.dead && r.saved === 1 && r.lost === 0;
  if (sc === 'nest') ok &&= r.grabbed && r.atNest && r.landed && !r.landed.dead && r.saved === 1 && r.lost === 0;
  if (sc === 'dog') ok &&= r.grabbed && r.landed && r.landed.moved > 12 && r.lost === 0;
  if (sc === 'dogbark') ok &&= !r.grabbed && r.states.leave > 0;
  if (sc === 'night') ok &&= r.came === 0;
  if (sc === 'odds') ok &&= r.came >= 1 && r.came <= 5 && r.nightCame === 0;
  if (sc === 'gone') ok &&= r.nestPast === 0 && !r.pick && r.snakes === 0 && r.pass === 0 && r.back === 0 && r.fresh >= 1 && r.circling && r.after === 'away' && r.seaOn && r.sea === 0;
  if (!ok) fail++;
  console.log(ok ? 'ok  ' : 'FAIL', sc, JSON.stringify(r));
}
console.log(fail ? `${fail} failed` : 'all ok', h.errors.slice(0, 5));
await h.close();
process.exit(fail ? 1 : 0);
