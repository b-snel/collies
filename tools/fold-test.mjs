// Headless checks for RAM FOLDS (hurdles from the vagabond): `node tools/fold-test.mjs`.
// Checks: room for one by every camp pen (none by the yeti's cave, the boat); bought (🚧, 📍 a found pen): 🧶 paid, a little pen beside
//   it on open ground, its gate shut and facing the way the camp's does, the way in clear; one a camp (again: ✖, nothing paid); not at sea;
//   it's a pen: a ram in it is penned there, the night's fast-forward counts it; the ram in the fold (shut), the ewes in the camp's pen:
//   no ewe courted, no "no lambs" nag; a ewe in with him: courted; a reload (JOURNEY SAVE): the fold back, its gate; a new journey: gone
import { open } from './harness.mjs';
let h = await open(), fails = 0;
const errors = [];
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const r = await h.page.evaluate(() => {
  const { G, T, pens, VSTALL, VAG, SEA, buyWare, foldSpot, foldCan, FOLDS, penAt, insidePen, step, groundY, setGate, sdfAt } = GAME, out = {};
  try { localStorage.clear(); } catch (e) {}
  GAME.startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {}; G.clock.hour = 10; for (const c of G.coyotes) c.gone = true;
  const put = (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); };
  out.room = pens.filter(p => !p.deck && !p.final).map(p => !!foldSpot(p)); out.noneFinal = !foldCan(pens.find(p => p.final)) && !foldCan(GAME.DECK);
  // bought at the vagabond, for the 📍 pen
  const p = pens[1]; G.visited.add(p.camp.name); VSTALL.pick = VSTALL.sel = pens.indexOf(p); VAG.mode = 'land';
  const w = VSTALL.wares.find(o => o.id === 'fold'), n0 = pens.length; G.wool = 40;
  out.buy = buyWare(w); const f = FOLDS[0];
  out.f = f ? { paid: 40 - G.wool === T.vendor.fold.price, inPens: pens.length === n0 + 1 && pens.includes(f), by: Math.round(Math.hypot(f.x - p.x, f.z - p.z) - p.R - f.R), shut: f.latched && f.gateT === 0,
    facing: Math.abs(Math.atan2(Math.sin(f.gateA - p.gateA), Math.cos(f.gateA - p.gateA))) < 0.01, wayIn: sdfAt(f.exitX, f.exitZ) > 1 && !penAt(f.exitX, f.exitZ), parent: f.parent === p } : null;
  const wool1 = G.wool; out.again = buyWare(w); out.againFree = G.wool === wool1;
  SEA.on = true; out.sea = w.show(); SEA.on = false;
  // a pen like any other: the rams in it (shut), the ewes in the camp's (shut)
  const rams = G.sheep.filter(s => !s.dead && s.ram), ewes = G.sheep.filter(s => !s.dead && !s.ram && !s.lamb), lambs = G.sheep.filter(s => !s.dead && s.lamb);
  rams.forEach((s, i) => { put(s, f.x + (i - 0.5) * 1.4, f.z); s.hunger = 0.1; });
  ewes.concat(lambs).forEach((s, i) => { const a = i * 2.4, rr = 1.5 + (i % 4) * 1.4; put(s, p.x + Math.cos(a) * rr, p.z + Math.sin(a) * rr); s.hunger = 0.1; });
  setGate(p, false); setGate(f, false); p.gateT = f.gateT = 0;
  step(0.025); out.penned = rams.every(s => s.pen === f) && ewes.every(s => s.pen === p);
  G.clock.hour = 17; let bred = 0; for (let t = 0; t < 40; t += 0.025) { step(0.025); }
  bred = ewes.filter(s => s.bred).length; out.bred = bred;
  G.clock.hour = 22; step(0.025); out.ff = G.ff;
  // a ewe in with him: courted
  const e = ewes[0]; put(e, f.x, f.z + 1.2); e.hunger = 0.1; G.clock.hour = 17.5;
  for (let t = 0; t < 30 && !e.bred; t += 0.025) step(0.025); out.inWith = e.bred && e.pen === f;
  setGate(f, true); out.saveOpen = !f.latched;
  GAME.JOURNEY.off = false; GAME.journeySave();
  return out;
});
ok(`room for a fold by every camp pen (${r.room.map(v => v ? '✔' : '✖').join('')}); none by the yeti's cave or the boat`, r.room.every(Boolean) && r.noneFinal, r);
ok(`bought (${r.buy}): 🧶 paid, a pen beside the 📍 one (${r.f && r.f.by} m off its fence), gate shut, facing its way, the way in clear`, r.buy === 'buy' && r.f && r.f.paid && r.f.inPens && r.f.by >= 0 && r.f.by <= 2 && r.f.shut && r.f.facing && r.f.wayIn && r.f.parent, r);
ok(`one a camp (again: ${r.again}, nothing paid); not at sea`, r.again === 'full' && r.againFree && !r.sea, r);
ok(`a pen like any other: the rams penned in it; the night's fast-forward counts it (${r.ff})`, r.penned && r.ff, r);
ok(`the rams in the fold, the ewes in the camp's pen: no ewe courted (${r.bred})`, r.bred === 0, r);
ok('a ewe in with him: courted', r.inWith, r);
// a reload: the fold back, its gate open
errors.push(...h.errors);
await h.page.reload(); await h.page.waitForFunction(() => window.GAME, null, { timeout: 60000 });
const r2 = await h.page.evaluate(() => {
  const J = GAME.JOURNEY; J.off = false; J.saved = GAME.journeyRead(); GAME.startGame({ kind: 'bot', index: 0 });
  const { FOLDS, pens, resetGame } = GAME, f = FOLDS[0], out = { resumed: J.resumed, n: FOLDS.length, by: f && f.parent === pens[1], open: f && !f.latched, inPens: f && pens.includes(f) };
  resetGame(); out.newJourney = FOLDS.length === 0 && !pens.some(p => p.fold);
  return out;
});
ok(`a reload: the fold back by its pen, its gate as it was`, r2.resumed && r2.n === 1 && r2.by && r2.open && r2.inPens, r2);
ok('a new journey: gone', r2.newJourney, r2);
errors.push(...h.errors);
ok('no page errors', !errors.length);
if (errors.length) console.log('PAGE ERRORS', errors.slice(0, 3));
await h.close();
process.exit(fails ? 1 : 0);
