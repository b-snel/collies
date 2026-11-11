// Headless checks for rattlesnakes, wounds, Hank the vet and the fallen: snakes behind desert rocks rattle and strike;
// a bite sickens and slows a sheep and kills it in time; a sheep a predator lets go of is cut (deep: bleeds, shallow:
// festers); the trader's 💉 🩹 💊 🪏 go straight to Hank; Hank treats the sick (over a
// pen fence too); a body lies with its name, rots into a tombstone, or Hank (with a shovel) buries it in the cemetery
// with a few words (none there yet: he builds one first; a full one gets another row). node tools/vet-test.mjs
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
    place(o, x, z) { o.x = x; o.z = z; o.vx = o.vz = 0; },
    run(sec, f) { for (let t = 0; t < sec; t += 0.025) { if (f && f(t)) return t; GAME.step(0.025); } return sec; },
    calm() { for (const s of GAME.G.sheep) { s.hunger = 0.1; s.salt = 1; s.thirst = 0; s.stress = 0; s.fear = 0; s.panic = 0; } },
  };
});

// 1. the snakes: past the Promised Land, in the desert, each behind its own rock (the same every load)
const r1 = await h.page.evaluate(() => {
  const { SNAKES, sAt, trailInfo, biomeW, CAMPS, FINAL, sdfAt } = GAME;
  return { n: SNAKES.length, s: SNAKES.map(n => Math.round(sAt(n.x, n.z))), lat: SNAKES.map(n => +trailInfo(n.x, n.z).lat.toFixed(1)), desert: Math.min(...SNAKES.map(n => biomeW(sAt(n.x, n.z))[0])),
    promised: CAMPS[3].s, final: FINAL.s, rock: Math.max(...SNAKES.map(n => Math.hypot(n.x - n.rock.x, n.z - n.rock.z) - n.rock.cr)), sdf: Math.min(...SNAKES.map(n => sdfAt(n.x, n.z))), x0: SNAKES[0].x };
});
ok(`${r1.n} rattlesnakes, in the desert past the Promised Land (s ${r1.s.join(', ')})`, r1.n >= 4 && r1.s.every(s => s > r1.promised + 60 && s < r1.final) && r1.desert > 0.7, r1);
ok('each tucked in behind its rock, off the trail', r1.rock < 0.5 && r1.sdf > 0 && r1.lat.every(l => Math.abs(l) > 4), r1);
await h.page.reload(); await h.page.waitForFunction(() => window.GAME);
const x0b = await h.page.evaluate(() => GAME.SNAKES[0].x);
ok('the same snakes every load', x0b === r1.x0, [x0b, r1.x0]);
await h.page.evaluate(() => {
  localStorage.clear();
  const { G, startGame } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {};
  for (const c of G.coyotes) c.gone = true;
  window.H = {
    place(o, x, z) { o.x = x; o.z = z; o.vx = o.vz = 0; },
    run(sec, f) { for (let t = 0; t < sec; t += 0.025) { if (f && f(t)) return t; GAME.step(0.025); } return sec; },
    calm() { for (const s of GAME.G.sheep) { s.hunger = 0.1; s.salt = 1; s.thirst = 0; s.stress = 0; s.fear = 0; s.panic = 0; } },
  };
});

// 2. a sheep wanders up: the snake rattles (the sheep shies off), strikes one in reach, slides back behind its rock
const r2 = await h.page.evaluate(() => {
  const { G, SNAKES, T, HANK } = GAME, n = SNAKES[1], d = G.dogs[0];
  G.clock.hour = 10; H.place(d, n.x + 40, n.z + 40); HANK.x = n.x + 30; HANK.z = n.z + 30;
  const S = G.sheep.filter(s => !s.lamb); S.forEach((s, i) => H.place(s, n.x + 30 + i, n.z + 30));
  const s = S[0]; H.place(s, n.x + 3.6, n.z); s.hunger = 0.1;
  const states = []; let bit = null, shy = 0;
  for (let k = 0; k < 400 && !bit; k++) {
    if (n.state === 'rattle' && Math.hypot(s.x - n.x, s.z - n.z) > T.snake.strikeR + 0.2) { s.x = n.x + 1.6; s.z = n.z; s.vx = s.vz = 0; }   // it keeps coming (a dog behind it)
    GAME.step(0.025); if (states.at(-1) !== n.state) states.push(n.state);
    if (n.state === 'rattle') shy = Math.max(shy, s.fear);
    if (s.venomRate > 0) bit = { venom: +s.venom.toFixed(3), rate: s.venomRate };
  }
  H.run(1.5);
  return { states, bit, shy: +shy.toFixed(2), after: n.state, back: n.at > G.time, ail: s.ail, name: s.name, id: s.id };
});
ok(`a sheep close by: it rattles, then strikes (${r2.states.join(' → ')})`, r2.states.includes('rattle') && r2.states.includes('strike') && r2.bit, r2);
ok(`the sheep shies off at the rattle (fear ${r2.shy})`, r2.shy > 0.2, r2);
ok('then it slides back behind its rock, a while before it comes out again', ['back', 'hide'].includes(r2.after) && r2.back, r2);

// 3. bitten: sicker and slower as the venom takes hold, dead in a day or so if nobody treats it
const r3 = await h.page.evaluate(id => {
  const { G, T, sickPep, sheepAilments, AIL } = GAME, s = G.sheep.find(o => o.id === id);
  const dh = T.snake.dieHours[0] / 4, pep = [sickPep(s)]; for (let i = 0; i < 3; i++) { sheepAilments(s, dh); pep.push(+sickPep(s).toFixed(2)); }   // (a quarter of the quickest death each time)
  const hours = Math.round(1 / s.venomRate);
  let h = dh * 3; while (!s.dead && h < 80) { sheepAilments(s, 1); h++; }
  return { pep, hours, diedAt: h, dead: s.dead, why: (G.lost.at(-1) || {}).why, range: T.snake.dieHours, body: G.graves.some(g => g.name === s.name && !g.stone) };
}, r2.id);
ok(`bitten: slower and slower (${r3.pep.join(' → ')})`, r3.pep.every((v, i) => !i || v < r3.pep[i - 1]) && r3.pep.at(-1) < 0.85, r3);
ok(`untreated, the venom kills it after ~${r3.hours} in-game hours (${r3.range.join('-')})`, r3.dead && r3.why === 'snake' && r3.hours >= r3.range[0] * 0.6 && r3.hours <= r3.range[1], r3);
ok('…and it lies where it fell, a body (not a stone yet)', r3.body, r3);

// 4. a bark sends a rattling snake back; a pounce on it too
const r4 = await h.page.evaluate(() => {
  const { G, SNAKES, bark } = GAME, n = SNAKES[2], d = G.dogs[0];
  n.state = 'hide'; n.at = 0; n.k = 0; H.place(d, n.x + 3, n.z);
  H.run(0.6); const st = n.state; d.barkCd = 0; bark(d); H.run(0.2);
  const barked = n.state, held = n.at - G.time;
  n.state = 'hide'; n.at = 0; n.k = 0; H.place(d, n.x + 3.5, n.z + 0.5); H.run(0.6);
  d.pounceT = 0.3; d.pdx = -1; d.pdz = 0; H.place(d, n.x + 1, n.z); GAME.step(0.025);
  return { st, barked, held: +held.toFixed(1), pounced: n.state };
});
ok(`a dog near: it rattles at the dog; a bark sends it back (${r4.st} → ${r4.barked}, ${r4.held}s)`, r4.st === 'rattle' && r4.barked === 'back' && r4.held > 5, r4);
ok('a pounce on it: back it goes', r4.pounced === 'back', r4);

// 5. wounds: a coyote made to drop a sheep quickly leaves a shallow cut (festers); held long, a deep one (bleeds); a cougar: deep
const r5 = await h.page.evaluate(() => {
  const { G, T, woundSheep, sheepAilments, sickPep } = GAME, S = G.sheep.filter(s => !s.dead && !s.lamb && !s.ail);
  const a = S[0], b = S[1], c = S[2];
  a.heldT = 1; a.grabBy = 'coyote'; woundSheep(a);
  b.heldT = 6; b.grabBy = 'coyote'; woundSheep(b);
  c.heldT = 1; c.grabBy = 'cougar'; woundSheep(c);
  const bleedH = Math.round(1 / b.bleedRate), infH = Math.round(1 / a.infectRate);
  const p0 = sickPep(b); sheepAilments(b, 6);
  return { a: [a.ail, +(a.infect || 0).toFixed(2), +(a.bleed || 0).toFixed(2)], b: [b.ail, +(b.bleed || 0).toFixed(2)], c: c.ail, bleedH, infH, W: T.wound, slow: [+p0.toFixed(2), +sickPep(b).toFixed(2)] };
});
ok('quick rescue from a coyote: a shallow cut that festers 🦠', r5.a[0] === 4, r5);
ok('held long by a coyote, or a cougar: a deep one that bleeds 🩸', r5.b[0] === 2 && r5.c === 2, r5);
ok(`bleeding out takes ~${r5.bleedH} h, a festering cut ~${r5.infH} h; a wounded sheep slows`, r5.bleedH >= r5.W.bleedHours[0] && r5.bleedH <= r5.W.bleedHours[1] && r5.infH >= r5.W.infectHours[0] && r5.infH <= r5.W.infectHours[1] && r5.slow[1] < r5.slow[0], r5);

// 6. a real drop: a coyote grabs a sheep, a dog saves it: cut
const r6 = await h.page.evaluate(() => {
  const { G, grabPrey, dropPrey } = GAME, s = G.sheep.find(o => !o.dead && !o.lamb && !o.ail);
  const c = { x: s.x + 1, z: s.z, y: 0, vx: 0, vz: 0, state: 'pack', stateT: 0, prey: null, pack: null, gone: false };
  grabPrey(c, s); H.run(2); dropPrey(c, true); H.run(0.3);
  return { ail: s.ail, held: s.heldT || 0 };
});
ok('a sheep saved from a coyote\'s jaws comes away cut', r6.ail > 0, r6);

// 7. the trader: 💉 🩹 💊 🪏 straight to Hank (🧶 spent); too poor: no; the shovel gone from the mats once bought
const r7 = await h.page.evaluate(() => {
  const { G, MARKET, buyWare, T, HANK, renderOnce } = GAME, d = G.dogs[0], ware = id => MARKET.wares.find(w => w.id === id);
  G.wool = 30; HANK.shovel = false; HANK.meds = { venom: 0, bandage: 0, pills: 0 };
  const out = { kinds: MARKET.wares.filter(w => w.row === 1).map(w => w.id) };
  out.buy = ['venom', 'bandage', 'pills', 'shovel'].map(id => buyWare(ware(id), d)); out.spent = 30 - G.wool;
  renderOnce(); out.meds = { ...HANK.meds }; out.shovel = HANK.shovel; out.back = HANK.model.vet.back.visible; out.hip = HANK.model.vet.bag.visible;
  out.shovelShown = ware('shovel').show();
  G.wool = 0; out.poor = buyWare(ware('venom'), d); out.venom = HANK.meds.venom;
  return out;
});
ok(`second row: ${r7.kinds.join(' ')}; each straight to Hank (${r7.spent} 🧶)`, r7.kinds.join() === 'venom,bandage,pills,shovel' && r7.buy.every(k => k === 'buy') && r7.meds.venom === 1 && r7.meds.bandage === 1 && r7.meds.pills === 1 && r7.shovel && r7.back && r7.hip && r7.spent === 10, r7);
ok('too poor: no; the shovel off the mats once Hank has it', r7.poor === 'poor' && r7.venom === 1 && !r7.shovelShown, r7);

// 8. Hank stocked: he goes to the sick and treats them, the worst first
const r8 = await h.page.evaluate(() => {
  const { G, HANK, T, CAM_R, CAM_F, step, snakeBite, renderOnce, living } = GAME, d = G.dogs[0], P = G.players[0];
  G.clock.hour = 9; H.calm();
  const c = GAME.CAMPS[1], L = living().filter(s => !s.lamb && !s.ail);
  for (const s of living()) H.place(s, c.x + 30 + Math.random() * 6, c.z + Math.random() * 6);
  const sick = L[0]; snakeBite(sick); sick.venom = 0.5;
  HANK.x = c.x + 45; HANK.z = c.z; HANK.vx = HANK.vz = 0; HANK.asleep = false; HANK.goal = null;
  HANK.meds = { venom: 0, bandage: 0, pills: 0 }; HANK.shovel = false;
  GAME.giveHank({ venom: 1, bandage: 1, pills: 0, shovel: 1 });
  P.bot = {}; H.place(d, c.x + 80, c.z + 30); renderOnce();
  const got = { meds: { ...HANK.meds }, shovel: HANK.shovel, back: HANK.model.vet.back.visible, said: HANK.log.slice(-3).map(l => l.text) };
  let treated = null, tending = false, held = 0, sx = 0, sz = 0;
  for (let k = 0; k < 40 * 40 && !treated; k++) {
    step(0.025);
    if (sick.state === 'treat') { if (!tending) { sx = sick.x; sz = sick.z; } tending = true; held = Math.max(held, Math.hypot(sick.x - sx, sick.z - sz)); }
    if (!(sick.venomRate > 0)) treated = { t: +(k * 0.025).toFixed(1), meds: { ...HANK.meds }, venom: +sick.venom.toFixed(2) };
  }
  H.run(1);
  return { got, treated, tending, held: +held.toFixed(3), state: sick.state, said: HANK.log.slice(-2).map(l => l.text), dist: +Math.hypot(HANK.x - sick.x, HANK.z - sick.z).toFixed(1), id: sick.id };
});
ok('giveHank: his stock, the shovel on his back', r8.got.meds.venom === 1 && r8.got.meds.bandage === 1 && r8.got.shovel && r8.got.back, r8);
ok(`he walks to the bitten one and treats it (${r8.treated && r8.treated.t}s): it stands still for him`, r8.treated && r8.tending && r8.held < 0.05 && r8.treated.meds.venom === 0, r8);
ok('treated: it mends; it\'s up and about; Hank says so', r8.state !== 'treat' && r8.said.some(t => /There ye go|mend|Easy now|Hold still/.test(t)), r8);
const r8b = await h.page.evaluate(id => { const s = GAME.G.sheep.find(o => o.id === id), v0 = s.venom; GAME.sheepAilments(s, 6); return { v0: +v0.toFixed(2), v1: +s.venom.toFixed(2), pep: +GAME.sickPep(s).toFixed(2) }; }, r8.id);
ok(`…the venom ebbs (${r8b.v0} → ${r8b.v1})`, r8b.v1 < r8b.v0, r8b);

// 9. a penned patient behind a shut gate: he climbs in to it
const r9 = await h.page.evaluate(() => {
  const { G, HANK, pens, setGate, penAt, woundSheep, living } = GAME, pen = pens[1], ga = pen.camp.gateA;
  G.clock.hour = 15; setGate(pen, false); H.calm();
  living().forEach((s, i) => { const a = i * 2.4, r = 1.5 + (i % 4) * 1.5; H.place(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); });
  const s = living().find(o => !o.lamb && !o.ail); s.heldT = 6; s.grabBy = 'cougar'; woundSheep(s);
  for (const o of living()) if (o !== s) { o.bleedRate = o.infectRate = o.venomRate = 0; o.bleed = o.infect = o.venom = 0; o.ail = 0; }   // (the earlier patients mended)
  HANK.meds.bandage = Math.max(1, HANK.meds.bandage); HANK.x = pen.x - Math.cos(ga) * (pen.R + 8); HANK.z = pen.z - Math.sin(ga) * (pen.R + 8); HANK.goal = null; HANK.asleep = false;
  let climbs = 0, was = false, inPen = false, done = null;
  for (let k = 0; k < 40 * 45 && !done; k++) { GAME.step(0.025); if (HANK.climb && !was) climbs++; was = !!HANK.climb; if (penAt(HANK.x, HANK.z) === pen) inPen = true; if (!(s.bleedRate > 0)) done = +(k * 0.025).toFixed(1); }
  return { climbs, inPen, done, penned: living().filter(o => o.pen === pen).length, of: living().length };
});
ok(`a penned one: over the fence he goes (${r9.climbs} climb) and bandages it (${r9.done}s)`, r9.climbs >= 1 && r9.inPen && r9.done !== null, r9);

// 10. the fallen: a body with its name; it rots into a stone on the spot over the days
const r10 = await h.page.evaluate(() => {
  const { G, T, killSheep, updateRemains, syncRemains, HANK, living } = GAME;
  HANK.shovel = false;
  const s = living().find(o => !o.lamb), x = s.x, z = s.z, name = s.name;
  killSheep(s, 'eaten');
  const g = G.graves.at(-1), body = !g.stone && !!g.body;
  syncRemains(0.1); const r0 = g.rot;
  updateRemains(24 * T.remains.rotDays * 0.6); syncRemains(0.1); const mid = { rot: +g.rot.toFixed(2), bones: g.body && g.body.bones.visible, flies: g.body && g.body.flies.some(f => f.visible) };
  updateRemains(24 * T.remains.rotDays * 0.5);
  return { body, name: g.name === name, r0, mid, stone: g.stone, moved: +Math.hypot(g.x - x, g.z - z).toFixed(2), hat: null };
});
ok('a sheep that dies lies where it fell, named', r10.body && r10.name && r10.moved < 1, r10);
ok(`it rots (bones, flies at ${r10.mid.rot}) and in ${T_rot()} days is a tombstone on the spot`, r10.mid.bones && r10.mid.flies && r10.stone, r10);
function T_rot() { return 1.5; }

// 10b. no cemeteries till Hank builds one; a half-built one shows that much of its fence, gateposts first
const r10b = await h.page.evaluate(() => {
  const { YARDS, syncYard } = GAME, Y = YARDS[2], seen = [];
  for (const y of YARDS) syncYard(y, false);
  const none = YARDS.every(y => y.built === 0 && !y.g.visible);
  for (const b of [0, 0.001, 0.5, 1]) { Y.built = b; syncYard(Y, false); seen.push({ b, vis: Y.g.visible, n: Y.fence[0].drawRange.count, yew: +Y.yew.scale.x.toFixed(2), lawn: +Y.lawn.scale.x.toFixed(2) }); }
  Y.built = 0; syncYard(Y, false);
  const all = Y.fence[0].attributes.position.count, first = Y.marks[0], last = Y.marks.at(-1);
  return { none, seen, all, marks: Y.marks.length, ends: [first.u, +(last.u - Y.len).toFixed(3)], outline: Y.fence[1].drawRange.count === Y.fence[0].drawRange.count };
});
const [s0, s1, s5, s10] = r10b.seen;
ok('no cemetery anywhere at the start', r10b.none, r10b);
ok(`it goes up in order (${r10b.marks} pieces, a gatepost first and last): none → a gatepost → half → all`, !s0.vis && s1.vis && s1.n > 0 && s1.n < s5.n && s5.n < r10b.all && s10.n === r10b.all && r10b.ends[0] === 0 && r10b.ends[1] === 0 && r10b.outline, r10b);
ok('the yew shoots up and the grass spreads as it goes', s1.yew < 0.01 && s10.yew === 1 && s1.lawn < s5.lawn && s10.lawn === 1, r10b);

// 11. with a shovel, by day: Hank carries a body to the nearest cemetery, digs, lays it in under a neat stone, and says a few words.
// None there yet: he sets the body down by the way in and builds one first, round the fence
const r11 = await h.page.evaluate(() => {
  const { G, T, HANK, YARDS, killSheep, living, CAMPS } = GAME;
  for (const g of G.graves) g.stone = g.stone || false;
  G.clock.hour = 9; H.calm(); HANK.shovel = true; HANK.meds = { venom: 0, bandage: 0, pills: 0 }; HANK.care = null;
  const c = CAMPS[1], s = living().find(o => !o.lamb && !o.ail), d = G.dogs[0];
  for (const o of living()) H.place(o, c.x + 40 + Math.random() * 6, c.z + Math.random() * 6);
  H.place(s, c.x + 30, c.z + 8); s.brave = 0.9; s.trait = null; s.bell = false;
  H.place(d, c.x + 60, c.z + 20);
  killSheep(s, 'eaten');
  const g = G.graves.at(-1), Y = YARDS.slice().sort((a, b) => Math.hypot(a.x - g.x, a.z - g.z) - Math.hypot(b.x - g.x, b.z - g.z))[0], n0 = Y.n;
  HANK.x = c.x + 34; HANK.z = c.z + 12; HANK.vx = HANK.vz = 0; HANK.goal = null; HANK.asleep = false;
  const phases = [], built0 = Y.built; let carried = false, dug = false, maxStep = 0, px = HANK.x, pz = HANK.z, buildT = 0, stall = 0, down = 0, mallet = false, back = true, laid = null;
  for (let k = 0; k < 40 * 160 && !g.stone; k++) {
    const b0 = Y.built; GAME.step(0.025); const j = HANK.care;
    maxStep = Math.max(maxStep, Math.hypot(HANK.x - px, HANK.z - pz)); px = HANK.x; pz = HANK.z;
    if (j && j.kind === 'bury' && phases.at(-1) !== j.phase) phases.push(j.phase);
    if (g.by) carried = true; if (HANK.digging) dug = true;
    if (j && j.phase === 'build') {
      buildT += 0.025; if (HANK.building) mallet = true; if (Y.built < b0) back = false; if (!g.by && !laid) laid = +Math.hypot(g.x - Y.x, g.z - Y.z).toFixed(1);
      if (b0 > 0 && Y.built === b0) stall += 0.025;   // started, and he's fallen behind
    }
    if (j && j.phase === 'dig' && Y.built < 1) down++;
  }
  H.run(2);
  const slot = Y.slots[n0];
  return { phases, carried, dug, stone: g.stone, neat: g.neat, inYard: +Math.hypot(g.x - slot.x, g.z - slot.z).toFixed(2), yardN: Y.n - n0, maxStep: +maxStep.toFixed(2), said: HANK.log.slice(-4).map(l => l.text), name: g.name, buried: G.stats.buried,
    built: [built0, Y.built], buildT: +buildT.toFixed(1), stall: +stall.toFixed(2), down, mallet, back, laid, building: HANK.building, len: +Y.len.toFixed(1) };
});
ok(`no cemetery there: he sets the body down by it (${r11.laid} m out) and builds one, round its ${r11.len} m of fence in ${r11.buildT}s`, r11.built[0] === 0 && r11.built[1] === 1 && r11.back && r11.laid > 2 && r11.laid < 6 && r11.buildT > 8 && r11.buildT < 30 && r11.down === 0, r11);
ok(`…mallet in hand, keeping up with the fence as it goes up (held up ${r11.stall}s)`, r11.mallet && !r11.building && r11.stall < 0.5, r11);
ok(`then fetches the body again, carries it in, digs (${r11.phases.join(' → ')})`, r11.phases.join() === 'fetch,carry,build,fetch,carry,dig' && r11.carried && r11.dug, r11);
ok('a neat stone in the cemetery\'s next row slot', r11.stone && r11.neat && r11.inYard < 0.05 && r11.yardN === 1 && r11.buried >= 1, r11);
ok(`his last words name it (${(r11.said.at(-1) || '').slice(0, 60)}…)`, (r11.said.at(-1) || '').includes(r11.name), r11);
ok(`no teleports on the way (max ${r11.maxStep} m a step)`, r11.maxStep < 0.4, r11);

// 11b. a cemetery already there: straight in to dig. Night falls mid-build elsewhere: the body's set down, the fence stays half up; by day he finishes it
const r11b = await h.page.evaluate(() => {
  const { G, HANK, YARDS, killSheep, living, CAMPS } = GAME;
  G.clock.hour = 9; H.calm(); HANK.care = null;
  const near = (x, z) => YARDS.slice().sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
  const c = CAMPS[1], s = living().find(o => !o.lamb && !o.ail); for (const o of living()) H.place(o, c.x + 40, c.z + 4);
  H.place(s, c.x + 30, c.z + 8); killSheep(s, 'eaten'); const g = G.graves.at(-1), Y = near(g.x, g.z);
  HANK.x = c.x + 34; HANK.z = c.z + 12; HANK.goal = null; HANK.asleep = false;
  const ph = []; for (let k = 0; k < 40 * 120 && !g.stone; k++) { GAME.step(0.025); const j = HANK.care; if (j && j.g === g && ph.at(-1) !== j.phase) ph.push(j.phase); }
  const c2 = CAMPS[2], s2 = living().find(o => !o.lamb && !o.ail); for (const o of living()) if (o !== s2) H.place(o, c2.x + 40, c2.z + 4);
  H.place(s2, c2.x + 28, c2.z + 8); killSheep(s2, 'eaten'); const g2 = G.graves.at(-1), Y2 = near(g2.x, g2.z);
  H.place(G.dogs[0], c2.x + 50, c2.z + 20); HANK.x = c2.x + 32; HANK.z = c2.z + 12; HANK.goal = null; HANK.care = null;
  for (let k = 0; k < 40 * 120 && !(Y2.built > 0.4); k++) GAME.step(0.025);
  G.clock.hour = 21; H.run(3);
  const night = { built: Y2.built, building: HANK.building, job: !!HANK.care, down: !g2.by };
  H.run(5); const still = Y2.built;
  G.clock.hour = 9; HANK.asleep = false; for (let k = 0; k < 40 * 160 && !g2.stone; k++) GAME.step(0.025);
  return { ph, same: Y !== Y2, night, still, built: Y2.built, stone: g2.stone, neat: g2.neat };
});
ok(`a cemetery already there: straight in (${r11b.ph.join(' → ')})`, r11b.ph.join() === 'fetch,carry,dig', r11b);
ok(`nightfall mid-build: body down, the fence stays ${Math.round(r11b.night.built * 100)}% up; next day he finishes it and buries the body`, r11b.same && r11b.night.built > 0.3 && r11b.night.built < 1 && !r11b.night.building && !r11b.night.job && r11b.night.down && r11b.still === r11b.night.built && r11b.built === 1 && r11b.stone && r11b.neat, r11b);

// 12. his words fit the sheep: a lamb, the bell ewe, a timid one, a stubborn one differ
const r12 = await h.page.evaluate(() => {
  const { lastWords } = GAME, mk = (look, s, why = 'eaten', name = 'Pip') => lastWords({ name, day: 3, why, look, s });
  return { lamb: mk({ lamb: true }, {}), bell: mk({ bell: true }, {}), timid: mk({}, { brave: 0.1 }), brave: mk({}, { brave: 0.9 }), stubborn: mk({}, { brave: 0.5, trait: 'stubborn' }), snake: mk({}, { brave: 0.5 }, 'snake'), same: mk({}, { brave: 0.1 }) === mk({}, { brave: 0.1 }) };
});
const words = Object.entries(r12).filter(([k]) => k !== 'same').map(([, v]) => v);
ok('lamb / bell / timid / brave / stubborn: each its own words, the same every time', new Set(words).size === words.length && /wee|too/i.test(r12.lamb) && /bell/i.test(r12.bell) && r12.same, r12);

// 13. no shovel at night / without one: he leaves the bodies be
const r13 = await h.page.evaluate(() => {
  const { G, HANK, killSheep, living } = GAME; HANK.care = null;
  const s = living().find(o => !o.lamb); killSheep(s, 'starved'); const g = G.graves.at(-1);
  HANK.shovel = false; G.clock.hour = 10; H.run(3); const none = !(HANK.care && HANK.care.g === g);
  HANK.shovel = true; G.clock.hour = 22; H.run(3); const night = !(HANK.care && HANK.care.g === g);
  return { none, night };
});
ok('no shovel, or after dark: the body stays', r13.none && r13.night, r13);

// 13b. a full cemetery: Hank adds a row at the back (the fence goes round it) and buries the next one there
const r13b = await h.page.evaluate(() => {
  const { G, T, HANK, YARDS, killSheep, living, CAMPS, yardRoom } = GAME;
  for (const g of [...G.graves]) if (!g.stone) { GAME.scene.remove(g.root); G.graves.splice(G.graves.indexOf(g), 1); }
  G.clock.hour = 9; H.calm(); HANK.shovel = true; HANK.care = null;
  const c = CAMPS[1], Y = YARDS.slice().sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0];
  const room = YARDS.map(y => yardRoom(y));
  Y.n = Y.slots.length; const rows0 = Y.rows, n0 = Y.slots.length, g0 = Y.g;
  const s = living().find(o => !o.lamb); for (const o of living()) H.place(o, c.x + 40, c.z + 4);
  H.place(s, c.x + 26, c.z + 6); killSheep(s, 'eaten'); const g = G.graves.at(-1);
  HANK.x = c.x + 30; HANK.z = c.z + 8; HANK.goal = null; HANK.asleep = false;
  for (let k = 0; k < 40 * 120 && !g.stone; k++) GAME.step(0.025);
  const slot = Y.slots[n0];
  return { room, rows: [rows0, Y.rows], slots: [n0, Y.slots.length], rebuilt: Y.g !== g0 && !!Y.g.parent, stone: g.stone, at: slot ? +Math.hypot(g.x - slot.x, g.z - slot.z).toFixed(2) : null, i: Y.i };
});
ok(`a full cemetery grows a row (${r13b.rows.join(' → ')} rows); the next grave goes in it`, r13b.rows[1] === r13b.rows[0] + 1 && r13b.slots[1] === r13b.slots[0] + 3 && r13b.rebuilt && r13b.stone && r13b.at < 0.05, r13b);
ok(`every camp's cemetery has room to grow (${r13b.room.join(' ')})`, r13b.room.every(Boolean), r13b);

// 14. a new journey: his stock, his shovel, the bodies and the cemeteries all start empty
const r14 = await h.page.evaluate(() => {
  const { G, HANK, YARDS, resetGame, SNAKES } = GAME; GAME.giveHank({ venom: 2, shovel: 1 });
  resetGame();
  return { meds: HANK.meds, shovel: HANK.shovel, graves: G.graves.length, yards: YARDS.map(y => y.n).join(''), rows: YARDS.map(y => y.rows).join(''), snakes: SNAKES.every(n => n.state === 'hide'),
    built: YARDS.map(y => y.built).join(''), shown: YARDS.some(y => y.g.visible) };
});
ok('a new journey: no stock, no shovel, no bodies, no cemeteries (back to their size), snakes hidden', !r14.meds.venom && !r14.shovel && r14.graves === 0 && /^0+$/.test(r14.yards) && /^4+$/.test(r14.rows) && /^0+$/.test(r14.built) && !r14.shown && r14.snakes, r14);

ok('no page errors', h.errors.length === 0, h.errors.slice(0, 5));
await h.close();
console.log(fails ? `\n${fails} failed` : '\nall ok');
process.exit(fails ? 1 : 0);
