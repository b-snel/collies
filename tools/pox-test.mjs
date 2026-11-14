// Headless checks for the sheep pox: the flock kept at one place more than T.pox.nights nightfalls running catches it.
// node tools/pox-test.mjs
// Checks: nights counted at nightfall (same place: on; moved on: from 1); the dawn before, Hank's warning and the HUD's; the night after,
//   one falls ill (and one more each night it stays); it spreads to sheep near a sick one, not to a jabbed one or through a fence;
//   untreated it kills ('pox'); the vagabond's 🧪 (n doses) to Hank, who cures the sick (jabbed: never again); the sea's legs are places;
//   kept on a reload; a new journey: none of it
import { open } from './harness.mjs';
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

await h.page.evaluate(() => {
  localStorage.clear();
  const { G, startGame } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {};
  for (const c of G.coyotes) c.gone = true;
  window.H = {
    place(o, x, z) { o.x = x; o.z = z; o.vx = o.vz = 0; o.tx = x; o.tz = z; },
    run(sec, f) { for (let t = 0; t < sec; t += 0.025) { if (f && f(t)) return t; GAME.step(0.025); } return sec; },
    calm() { for (const s of GAME.G.sheep) { s.hunger = 0.1; s.salt = 1; s.thirst = 0; s.stress = 0; s.fear = 0; s.panic = 0; } },
    // the flock in camp i's pen, gate shut
    pen(i) { const { G, pens, living } = GAME, p = pens[i]; let k = 0; for (const s of living()) { const a = k * 2.4, r = 1.5 + (k % 4) * 1.6; H.place(s, p.x + Math.cos(a) * r, p.z + Math.sin(a) * r); s.pen = p; s.wasPen = p; k++; } p.phi = 0; GAME.updateGateGeometry(p); return p; },
    // run the clock over nightfall (the real hook: stepClock)
    night() { GAME.G.clock.hour = GAME.T.nightStart - 0.02; H.calm(); H.run(3, () => GAME.G.clock.hour >= GAME.T.nightStart); H.run(0.1); },
    // on to the morning: Hank up
    dawn() { const { G, HANK } = GAME; G.clock.hour = 6.35; HANK.asleep = false; H.run(1); },
  };
});

// 1. nights at one camp: counted at nightfall; four and nobody's ill
const r1 = await h.page.evaluate(() => {
  const { G, POX, poxPlace, T } = GAME; H.pen(1);
  const at = poxPlace(), ns = [];
  for (let i = 0; i < T.pox.nights; i++) { H.night(); ns.push(POX.n); }
  return { at, ns, sick: G.sheep.filter(s => s.poxRate > 0).length, nights: T.pox.nights };
});
ok(`nights at one camp counted at nightfall (${r1.at}: ${r1.ns.join(' ')})`, r1.at === 'c1' && r1.ns.join() === Array.from({ length: r1.nights }, (_, i) => i + 1).join(), r1);
ok(`${r1.nights} nights: nobody ill yet`, r1.sick === 0, r1);

// 2. the dawn before: Hank's warning, the HUD's
const r2 = await h.page.evaluate(() => {
  const { POX, HANK, poxStay } = GAME; const n0 = HANK.log.length; H.dawn();
  return { warned: POX.warned, said: HANK.log.slice(n0).filter(l => l.said).map(l => l.text), stay: poxStay() };
});
ok(`the dawn before: Hank warns ("${r2.said.find(t => /sick|pox/.test(t)) || ''}")`, r2.warned && r2.said.some(t => /sick|pox/.test(t)), r2);
ok(`…and the HUD (🌙${r2.stay})`, r2.stay === 4, r2);

// 3. one more night there: one falls ill; another night, one more
const r3 = await h.page.evaluate(() => {
  const { G, T, POX, HANK, living } = GAME, k = T.pox.catch; T.pox.catch = 0;   // (no spreading tonight: one case a night)
  H.night();
  const sick1 = living().filter(s => s.poxRate > 0), news = POX.news, ail = sick1[0] ? sick1[0].ail : 0;
  H.night(); T.pox.catch = k;
  const sick2 = living().filter(s => s.poxRate > 0).length;
  const n0 = HANK.log.length; H.dawn();
  return { n: POX.n, sick1: sick1.length, ail, news, sick2, poxed: G.stats.poxed, said: HANK.log.slice(n0).filter(l => l.said).map(l => l.text) };
});
ok(`night ${r3.n - 1} at the same place: one falls ill 🤒 (${r3.news})`, r3.sick1 === 1 && r3.ail === 8 && r3.news, r3);
ok(`another night there: another (${r3.sick2} sick)`, r3.sick2 === 2, r3);
ok(`the morning after: Hank says why ("${r3.said.find(t => /too long/.test(t)) || ''}")`, r3.said.some(t => /too long/.test(t)), r3);

// 4. moved on: the count starts again, nobody new falls ill
const r4 = await h.page.evaluate(() => {
  const { G, POX, living } = GAME; const was = living().filter(s => s.poxRate > 0).length;
  for (const s of living()) s.poxRate > 0 && (s.poxRate = 0, s.pox = 0, s.ail = 0);
  H.pen(2); H.night();
  return { at: POX.at, n: POX.n, sick: living().filter(s => s.poxRate > 0).length, was };
});
ok(`moved on to the next camp: from 1 again (${r4.at}: ${r4.n}), nobody new ill`, r4.at === 'c2' && r4.n === 1 && r4.sick === 0, r4);

// 5. it spreads: to sheep by a sick one; not to a jabbed one, nor through the fence
const r5 = await h.page.evaluate(() => {
  const { G, T, pens, living, poxCatch, updatePox } = GAME, p = pens[2], L = living().filter(s => !s.lamb);
  const c = L[0], near = L.slice(1, 6), vax = L[6], out = L[7];
  for (const s of living()) { H.place(s, p.x + 60, p.z + 60); s.pen = null; }
  const ga = p.gateA + Math.PI, ox = Math.cos(ga), oz = Math.sin(ga), at = (r, t) => [p.x + ox * r - oz * t, p.z + oz * r + ox * t];   // r: out from the middle (toward the back fence), t: along it
  H.place(c, ...at(p.R - 0.7, 0)); c.pen = p; poxCatch(c); c.pox = 0.3;   // by the back fence, inside
  near.forEach((s, i) => { const b = (i - 2) * 0.6; H.place(s, c.x - (ox * Math.cos(b) - oz * Math.sin(b)) * 1.4, c.z - (oz * Math.cos(b) + ox * Math.sin(b)) * 1.4); s.pen = p; });   // round it, inward
  H.place(vax, ...at(p.R - 0.9, 1.1)); vax.pen = p; vax.vax = true;
  H.place(out, ...at(p.R + 0.7, 0)); out.pen = null;   // just outside the fence
  const d = Math.hypot(out.x - c.x, out.z - c.z);
  let hrs = 0; while (near.some(s => !(s.poxRate > 0)) && hrs < 400) { updatePox(T.pox.tick, 4); hrs += 4; }
  return { caught: near.filter(s => s.poxRate > 0).length, hrs, vax: vax.poxRate > 0, out: out.poxRate > 0, d: +d.toFixed(2), r: T.pox.r, rest: living().filter(s => s.poxRate > 0).length };
});
ok(`it spreads to the sheep by a sick one (${r5.caught}/5 in ${r5.hrs} h)`, r5.caught === 5 && r5.hrs > 8, r5);
ok(`not to a jabbed one, nor through the fence (${r5.d} m off)`, !r5.vax && !r5.out && r5.d < r5.r, r5);

// 6. untreated, it kills
const r6 = await h.page.evaluate(() => {
  const { G, T, sheepAilments, sickPep, living } = GAME, s = living().find(o => o.poxRate > 0);
  const hours = Math.round(1 / s.poxRate), p0 = sickPep(s); s.pox = 0.8; const p1 = sickPep(s);
  let h = 0; while (!s.dead && h < 100) { sheepAilments(s, 1); h++; }
  return { hours, range: T.pox.dieHours, dead: s.dead, why: (G.lost.at(-1) || {}).why, stat: G.stats.pox, slow: [+p0.toFixed(2), +p1.toFixed(2)], body: G.graves.some(g => g.name === s.name && !g.stone) };
});
ok(`untreated: slower, dead in ~${r6.hours} h (${r6.range.join('-')}), a body`, r6.dead && r6.why === 'pox' && r6.stat === 1 && r6.hours >= r6.range[0] && r6.hours <= r6.range[1] && r6.slow[1] < r6.slow[0] && r6.body, r6);

// 7. the vagabond's 🧪: doses straight to Hank; he jabs the sick; jabbed, never again
const r7 = await h.page.evaluate(() => {
  const { G, T, MARKET, buyWare, HANK, vetWant, living, poxCatch, updatePox, renderOnce } = GAME, d = G.dogs[0], w = MARKET.wares.find(o => o.id === 'vaccine');
  const want = [...vetWant()];
  const sick = living().filter(s => s.poxRate > 0), n = sick.length;
  G.wool = 40; HANK.meds.vaccine = 0; const kind = buyWare(w, d), spent = 40 - G.wool, one = HANK.meds.vaccine;
  while (HANK.meds.vaccine < n) buyWare(w, d);
  const doses = HANK.meds.vaccine; renderOnce(); const bag = HANK.model.vet.bag.visible;
  G.clock.hour = 9; H.calm();
  const c = GAME.CAMPS[2];
  sick.forEach((s, i) => { H.place(s, c.x + 30 + (i % 3) * 3, c.z + Math.floor(i / 3) * 3); s.pen = null; });   // (the rest well away)
  HANK.x = c.x + 40; HANK.z = c.z; HANK.vx = HANK.vz = 0; HANK.asleep = false; HANK.goal = null; HANK.care = null;
  let t = 0; for (; t < 240 && sick.some(s => s.poxRate > 0); t += 0.025) GAME.step(0.025);
  const cured = sick.filter(s => !(s.poxRate > 0) && s.vax).length;
  // a new case among the jabbed ones: still none of them
  const z = living().find(s => !sick.includes(s) && !s.vax && !(s.poxRate > 0)); poxCatch(z); z.pox = 0.5;
  sick.forEach((s, i) => { H.place(s, c.x + 60 + (i % 3) * 1.2, c.z + Math.floor(i / 3) * 1.2); s.pen = null; }); H.place(z, c.x + 61.2, c.z + 0.6); z.pen = null;
  for (let i = 0; i < 40; i++) updatePox(T.pox.tick, 5);
  return { want, kind, spent, one, doses, bag, n, cured, left: HANK.meds.vaccine, t: +t.toFixed(1), again: sick.some(s => s.poxRate > 0), price: T.vendor.vaccine };
});
ok(`Hank wants 🧪 for the sick (${r7.want.join(' ')})`, r7.want.includes('vaccine'), r7);
ok(`the vagabond's 🧪: ${r7.one} doses straight to Hank (${r7.spent} 🧶)`, r7.kind === 'buy' && r7.one === r7.price.n && r7.spent === r7.price.price && r7.bag, r7);
ok(`Hank jabs the sick (${r7.cured}/${r7.n} in ${r7.t} s, ${r7.left} doses left)`, r7.n > 0 && r7.cured === r7.n && r7.left === r7.doses - r7.n, r7);
ok('jabbed: they never catch it again (a sick one among them for 200 h)', !r7.again, r7);

// 8. at sea: each leg's a place
const r8 = await h.page.evaluate(() => {
  const { SEA, poxPlace } = GAME, was = [SEA.on, SEA.leg];
  SEA.on = true; SEA.leg = 3; const a = poxPlace(); SEA.leg = 4; const b = poxPlace();
  [SEA.on, SEA.leg] = was; return { a, b };
});
ok(`at sea: each leg its own place (${r8.a}, ${r8.b})`, r8.a === 's3' && r8.b === 's4', r8);

// 9. a reload keeps it: the count, the sick
const r9 = await h.page.evaluate(() => {
  const { G, POX, JOURNEY, journeySave, journeyRead, living, poxCatch } = GAME;
  const s = living().find(o => !o.vax); poxCatch(s); POX.at = 'c3'; POX.n = 3;
  JOURNEY.off = false; journeySave(); const j = journeyRead(); JOURNEY.off = true;
  const r = j.parts.flock.find(o => o.id === s.id);
  return { pox: j.parts.pox, rate: r && r.poxRate > 0, vax: j.parts.flock.filter(o => o.vax).length };
});
ok(`a reload keeps the count (${JSON.stringify(r9.pox)}), the sick, the jabbed (${r9.vax})`, r9.pox && r9.pox.at === 'c3' && r9.pox.n === 3 && r9.rate && r9.vax > 0, r9);

// 10. a new journey: none of it
const r10 = await h.page.evaluate(() => {
  const { G, POX, HANK, resetGame } = GAME; HANK.meds.vaccine = 3;
  resetGame();
  return { n: POX.n, at: POX.at, vaccine: HANK.meds.vaccine, sick: G.sheep.filter(s => s.poxRate > 0 || s.vax).length };
});
ok('a new journey: no count, no stock, nobody ill or jabbed', r10.n === 0 && r10.at === null && r10.vaccine === 0 && r10.sick === 0, r10);

ok('no page errors', h.errors.length === 0, h.errors.slice(0, 5));
await h.close();
console.log(fails ? `\n${fails} failed` : '\nall ok');
process.exit(fails ? 1 : 0);
