// Headless checks for the end of the trail: the desert past the Promised Land, the Trading Post and its vendor
// (a dog on a mat barks to buy with wool), and Cabo, the win. `node tools/vendor-test.mjs`
import { open } from './harness.mjs';
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

// 1. the world: the trail ends in the desert at the Trading Post, no water near it, predators about
const r1 = await h.page.evaluate(() => {
  const { CAMPS, PATH_LEN, FINAL, finalPen, pens, WARES, MARKET, DENS, LAIRS, terrainH, sdfAt, sAt, T } = GAME;
  let wet = 0; for (let a = 0; a < 64; a++) for (const r of [20, 35, 50, 65]) { const x = FINAL.x + Math.cos(a / 64 * 6.283) * r, z = FINAL.z + Math.sin(a / 64 * 6.283) * r; if (sdfAt(x, z) > 0 && terrainH(x, z) < -3 + 0.6) wet++; }
  return {
    camps: CAMPS.map(c => c.name), last: CAMPS[CAMPS.length - 1] === FINAL, finals: CAMPS.filter(c => c.final).length, promisedFinal: !!CAMPS[3].final,
    penFinal: finalPen && finalPen.final && finalPen.camp === FINAL, toEnd: Math.round(PATH_LEN - FINAL.s), wetNear: wet,
    mats: WARES.map(w => ({ id: w.id, sdf: +sdfAt(w.x, w.z).toFixed(1), inPen: pens.some(p => Math.hypot(w.x - p.x, w.z - p.z) < p.R + 1) })),
    stallFromPen: Math.round(Math.hypot(MARKET.x - FINAL.x, MARKET.z - FINAL.z)),
    denNear: Math.round(Math.min(...DENS.map(d => Math.hypot(d.x - FINAL.x, d.z - FINAL.z)))), lairNear: Math.round(Math.min(...LAIRS.map(l => Math.hypot(l.x - FINAL.x, l.z - FINAL.z)))),
    cougarRange: T.cougar.range + 30, denRange: T.denRange,
  };
});
ok('the Trading Post is the last camp and the only final one', r1.last && r1.finals === 1 && !r1.promisedFinal && r1.penFinal, r1);
ok('the trail runs on past the Trading Post a little, like the old end', r1.toEnd > 50 && r1.toEnd < 100, r1);
ok('no water near the Trading Post', r1.wetNear === 0, r1);
ok('every mat on open ground, none in a pen', r1.mats.every(m => m.sdf > 1 && !m.inPen), r1.mats);
ok('the stall stands by the pen', r1.stallFromPen > 15 && r1.stallFromPen < 45, r1);
ok('a den and a cougar tree near enough to hunt there', r1.denNear < r1.denRange && r1.lairNear < r1.cougarRange, r1);

// set up: a dog, the flock in the Trading Post's pen
await h.page.evaluate(() => {
  const { G, startGame, finalPen, step } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {}; G.clock.hour = 10;
  const H = window.H = {};
  H.pen = () => { const p = finalPen; for (const s of G.sheep) { if (s.dead) continue; const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (p.R - 2.5); s.x = p.x + Math.cos(a) * r; s.z = p.z + Math.sin(a) * r; s.vx = s.vz = 0; } };
  H.run = sec => { for (let t = 0; t < sec; t += 0.025) step(0.025); };
  H.calm = () => { for (const c of G.coyotes) GAME.scene.remove(c.models.root); G.coyotes.length = 0; G.packs.length = 0; };
  H.reset = () => { GAME.resetGame(); G.clock.hour = 10; H.calm(); G.players[0].bot = {}; GAME.setGate(finalPen, false); H.pen(); H.run(0.3); };
  H.ware = id => GAME.WARES.find(w => w.id === id);
  H.food = () => finalPen.troughs.reduce((a, tr) => a + tr.food, 0);
  H.reset();
});

// 2. too poor: nothing spent, nothing in the pen, still playing
const r2 = await h.page.evaluate(() => {
  const { G, buyWare, finalPen, T } = GAME; G.wool = 1;
  const food0 = H.food(), salt0 = finalPen.lick.salt;
  const k = { food: buyWare(H.ware('food')), salt: buyWare(H.ware('salt')), cabo: buyWare(H.ware('cabo')) };
  return { k, wool: G.wool, food: H.food() - food0, salt: finalPen.lick.salt - salt0, mode: G.mode, prices: { food: T.vendor.food.price, salt: T.vendor.salt.price } };
});
ok('too little wool: a no for each, nothing spent, nothing delivered', r2.k.food === 'poor' && r2.k.salt === 'poor' && r2.k.cabo === 'poor' && r2.wool === 1 && r2.food === 0 && r2.salt === 0 && r2.mode === 'play', r2);

// 3. food and salt: spend wool, fill the final pen, till there's no room
const r3 = await h.page.evaluate(() => {
  const { G, buyWare, finalPen, T } = GAME; G.wool = 100; const V = T.vendor, out = {};
  const f0 = H.food(); out.food = buyWare(H.ware('food')); out.foodIn = +(H.food() - f0).toFixed(2); out.woolAfterFood = G.wool;
  const s0 = finalPen.lick.salt; out.salt = buyWare(H.ware('salt')); out.saltIn = +(finalPen.lick.salt - s0).toFixed(2); out.woolAfterSalt = G.wool;
  let n = 0, k = ''; while ((k = buyWare(H.ware('food'))) === 'buy' && n < 20) n++; out.foodBuys = n; out.foodStop = k;
  const cap = finalPen.troughs.reduce((a, tr) => a + tr.cap, 0); out.foodFull = +(H.food() / cap).toFixed(2); out.overCap = finalPen.troughs.some(tr => tr.food > tr.cap + 1e-6);
  const w0 = G.wool; out.fullAgain = buyWare(H.ware('food')); out.woolSpentWhenFull = w0 - G.wool;
  n = 0; while ((k = buyWare(H.ware('salt'))) === 'buy' && n < 20) n++; out.saltStop = k; out.lick = [finalPen.lick.salt, finalPen.lick.cap];
  out.V = { food: V.food, salt: V.salt };
  return out;
});
ok('🌾 food: wool spent, a batch in the final pen\'s troughs', r3.food === 'buy' && Math.abs(r3.foodIn - r3.V.food.amt) < 0.01 && r3.woolAfterFood === 100 - r3.V.food.price, r3);
ok('🧂 salt: wool spent, a batch in the final pen\'s lick', r3.salt === 'buy' && Math.abs(r3.saltIn - r3.V.salt.amt) < 0.01 && r3.woolAfterSalt === r3.woolAfterFood - r3.V.salt.price, r3);
ok('a full pen: a no, nothing spent, never over the troughs\' and lick\'s caps', r3.foodStop === 'full' && r3.fullAgain === 'full' && r3.woolSpentWhenFull === 0 && !r3.overCap && r3.foodFull > 0.75 && r3.saltStop === 'full' && r3.lick[0] <= r3.lick[1], r3);

// 4. 💧 water into the final pen's trough (fillWater), till it's full; ✂️ free while Hank has none
const r4 = await h.page.evaluate(() => {
  const { G, buyWare, HANK, T, finalPen } = GAME, V = T.vendor, W = finalPen.water; G.wool = 50; W.w = 0; const out = {};
  const water = H.ware('water'), clip = H.ware('clippers');
  let w0 = G.wool; out.water = buyWare(water); out.waterSpent = w0 - G.wool; out.waterIn = W.w;
  W.w = W.cap - V.water.amt * V.room + 0.1; w0 = G.wool; out.full = buyWare(water); out.fullSpent = w0 - G.wool;
  HANK.clippers = false; out.clipShown = clip.show(); w0 = G.wool; out.clip = buyWare(clip); out.clipSpent = w0 - G.wool; out.clippers = !!HANK.clippers; out.clipShownAfter = clip.show();
  const d = G.dogs[0]; d.x = clip.x; d.z = clip.z; w0 = G.wool; out.hiddenBark = GAME.vendorBark(d); out.hiddenSpent = w0 - G.wool;   // a hidden ware's mat sells nothing
  out.V = { amt: V.water.amt, price: V.water.price };
  return out;
});
ok('💧 water: wool spent, a batch in the final pen\'s water trough', r4.water === 'buy' && r4.waterSpent === r4.V.price && Math.abs(r4.waterIn - r4.V.amt) < 0.01, r4);
ok('💧 water: no room → no sale', r4.full === 'full' && r4.fullSpent === 0, r4);
ok('✂️ free while Hank has none, then gone; its empty mat sells nothing', r4.clipShown && r4.clip === 'buy' && r4.clipSpent === 0 && r4.clippers && !r4.clipShownAfter && r4.hiddenBark === null && r4.hiddenSpent === 0, r4);
ok('✂️ clippers: free, only while Hank has none (else no mat)', r4.clipShown ? r4.clip === 'buy' && r4.clippers && !r4.clipShownAfter : true, r4);
ok('a hidden ware\'s mat sells nothing', r4.hiddenBark === undefined || r4.hiddenBark === null, r4);

// 5. the real thing: a dog stands on the salt mat and barks
const r5 = await h.page.evaluate(() => {
  const { G, finalPen, T, step } = GAME; const d = G.dogs[0], w = H.ware('salt'); G.wool = 10; finalPen.lick.salt = 0;
  d.x = w.x; d.z = w.z; d.vx = d.vz = 0; d.barkCd = 0; H.run(0.2);
  G.players[0].bot = { bark: true }; step(0.025); G.players[0].bot = {}; H.run(0.2);
  const one = { lick: finalPen.lick.salt, wool: G.wool, bought: GAME.VENDOR.bought.salt };
  d.x = w.x + 4; d.barkCd = 0; G.players[0].bot = { bark: true }; step(0.025); G.players[0].bot = {}; H.run(0.2);   // off the mat: just a bark
  return { one, off: { lick: finalPen.lick.salt, wool: G.wool }, amt: T.vendor.salt.amt, price: T.vendor.salt.price };
});
ok('a bark on a mat buys it; off the mats a bark is just a bark', r5.one.lick === r5.amt && r5.one.wool === 10 - r5.price && r5.off.wool === r5.one.wool, r5);

// 6. Cabo: nobody penned → no; bark once to ask, again (in time) to go; the penned sheep go and the journey ends
const r6 = await h.page.evaluate(() => {
  const { G, buyWare, finalPen, T, pathPoint, caboSheep } = GAME; const V = T.vendor, cabo = H.ware('cabo'), out = {};
  H.reset(); G.wool = 200;
  const away = pathPoint(GAME.FINAL.s - 60, 0);
  for (const s of G.sheep) { s.x = away.x + Math.random() * 4; s.z = away.z + Math.random() * 4; } H.run(0.3);
  out.none = buyWare(cabo); out.woolNone = G.wool; out.modeNone = G.mode;
  H.pen(); H.run(0.5); const live = G.sheep.filter(s => !s.dead);
  live.slice(0, 3).forEach((s, i) => { s.x = away.x + i; s.z = away.z; }); H.run(0.5);   // three stay out
  const n = caboSheep().length; out.n = n; out.price = GAME.warePrice(cabo); out.want = V.cabo.base + V.cabo.per * n;
  out.first = buyWare(cabo); out.modeAfterFirst = G.mode; out.woolAfterFirst = G.wool;
  H.run(V.confirm + 0.5); out.late = buyWare(cabo); out.modeLate = G.mode;   // too slow: it asks again
  out.go = buyWare(cabo); out.mode = G.mode; out.woolSpent = 200 - G.wool;
  out.title = document.getElementById('eTitle').textContent; out.line = document.getElementById('eLine').textContent; out.stars = document.getElementById('eStars').textContent;
  out.cabo = document.getElementById('end').classList.contains('cabo');
  H.run(4); out.hank = GAME.HANK.log.slice(-4).map(l => l.said ? l.text : '').filter(Boolean);
  return out;
});
ok('🏖️ nobody penned there: a no, nothing spent', r6.none === 'none' && r6.woolNone === 200 && r6.modeNone === 'play', r6);
ok('🏖️ price: base + per sheep penned there', r6.n === 11 && r6.price === r6.want, r6);
ok('🏖️ the first bark asks; too slow, it asks again', r6.first === 'arm' && r6.modeAfterFirst === 'play' && r6.woolAfterFirst === 200 && r6.late === 'arm' && r6.modeLate === 'play', r6);
ok('🏖️ the second bark: wool spent, the penned sheep go, the journey ends', r6.go === 'buy' && r6.mode === 'end' && r6.woolSpent === r6.want && r6.cabo && /Cabo/.test(r6.title) && r6.line.includes(String(r6.n)), r6);
ok('🏖️ Hank: That\'ll do, and Cabo', r6.hank.some(t => /That'll do/.test(t)) && r6.hank.some(t => /Cabo/.test(t)), r6.hank);

// 7. the old finish is gone: the whole flock penned at the Trading Post, gate shut → the journey goes on; losing them all still ends it
const r7 = await h.page.evaluate(() => {
  const { G, finalPen, onGateClosed, setGate, killSheep } = GAME; const out = {};
  H.reset(); setGate(finalPen, true); H.run(0.2); H.pen(); H.run(0.5);
  out.inside = G.sheep.filter(s => s.pen === finalPen).length; setGate(finalPen, false); onGateClosed(finalPen); H.run(3); out.mode = G.mode;
  for (const s of G.sheep) if (!s.dead) killSheep(s, 'eaten'); H.run(0.2);
  out.lostMode = G.mode; out.lostTitle = document.getElementById('eTitle').textContent; out.cabo = document.getElementById('end').classList.contains('cabo');
  return out;
});
ok('shutting the whole flock in at the Trading Post doesn\'t end the journey', r7.inside > 10 && r7.mode === 'play', r7);
ok('losing the whole flock still ends it', r7.lostMode === 'end' && !/Cabo/.test(r7.lostTitle) && !r7.cabo, r7);

// 8. a new journey: the vendor's ready again
const r8 = await h.page.evaluate(() => { GAME.resetGame(); return { mode: GAME.G.mode, armed: GAME.WARES.some(w => w.armT > GAME.G.time), hello: GAME.VENDOR.hello }; });
ok('a new journey resets the stall', r8.mode === 'play' && !r8.armed && !r8.hello, r8);

ok('no page errors', h.errors.length === 0, h.errors.slice(0, 5));
console.log(fails ? `${fails} FAILED` : 'all ok');
await h.close();
process.exit(fails ? 1 : 0);
