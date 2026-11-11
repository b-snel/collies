// Headless checks for the vendors: a stall near the end of every leg and the Trading Post's (a dog on a mat barks to buy
// with wool): 📍 picks a pen found on the way, 🌾 💧 🧂 add a stocked trough / water trough / lick there up to what the pen
// holds (by its size), then batches; the desert past the Promised Land; no Cabo (the end's up the MOUNTAIN PASS). `node tools/vendor-test.mjs`
import { open } from './harness.mjs';
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

// 1. the world: the Trading Post in the desert, no water near it, predators about; the trail climbs on to the yeti's cave (the end)
const r1 = await h.page.evaluate(() => {
  const { CAMPS, PATH_LEN, FINAL, POST, finalPen, postPen, pens, WARES, MARKET, DENS, LAIRS, terrainH, sdfAt, sAt, T } = GAME;
  let wet = 0; for (let a = 0; a < 64; a++) for (const r of [20, 35, 50, 65]) { const x = POST.x + Math.cos(a / 64 * 6.283) * r, z = POST.z + Math.sin(a / 64 * 6.283) * r; if (sdfAt(x, z) > 0 && terrainH(x, z) < -3 + 0.6) wet++; }
  return {
    camps: CAMPS.map(c => c.name), last: CAMPS[CAMPS.length - 1] === FINAL, finals: CAMPS.filter(c => c.final).length, promisedFinal: !!CAMPS[3].final,
    penFinal: finalPen && finalPen.final && finalPen.camp === FINAL, postFinal: !!postPen.final, toEnd: Math.round(PATH_LEN - POST.s), wetNear: wet,
    mats: GAME.ALL_WARES.map(w => ({ id: w.id, st: w.stall.i, sdf: +sdfAt(w.x, w.z).toFixed(1), inPen: pens.some(p => Math.hypot(w.x - p.x, w.z - p.z) < p.R + 1) })),
    legs: CAMPS.slice(1).map((c, i) => GAME.STALLS.filter(st => !st.market && st.s > CAMPS[i].s && st.s < c.s).length),
    river: Math.round(Math.min(...GAME.STALLS.map(st => Math.abs(sAt(st.x, st.z) - GAME.RIVER.s)))),
    gap: Math.round(Math.min(...GAME.STALLS.map(st => Math.min(...DENS.map(d => Math.hypot(d.x - st.x, d.z - st.z)), ...LAIRS.map(l => Math.hypot(l.x - st.x, l.z - st.z)), ...GAME.DIGS.map(d => Math.hypot(d.x - st.x, d.z - st.z)))))),
    wares: GAME.STALLS.map(st => st.wares.map(w => w.id).join(' ')),
    stallFromPen: Math.round(Math.hypot(MARKET.x - POST.x, MARKET.z - POST.z)),
    denNear: Math.round(Math.min(...DENS.map(d => Math.hypot(d.x - POST.x, d.z - POST.z)))), lairNear: Math.round(Math.min(...LAIRS.map(l => Math.hypot(l.x - POST.x, l.z - POST.z)))),
    cougarRange: T.cougar.range + 30, denRange: T.denRange,
  };
});
ok('the yeti\'s cave is the last camp and the only final one; the Trading Post isn\'t', r1.last && r1.finals === 1 && !r1.promisedFinal && r1.penFinal && !r1.postFinal, r1);
ok('the trail climbs on past the Trading Post (the MOUNTAIN PASS)', r1.toEnd > 300, r1);
ok('no water near the Trading Post', r1.wetNear === 0, r1);
ok('every mat on open ground, none in a pen', r1.mats.every(m => m.sdf > 1 && !m.inPen), r1.mats);
ok('one trader on every leg up to the Trading Post, its own past its pen, none up the pass; none by the river, a den, a cougar tree or a dig spot', r1.legs.slice(0, -1).every(n => n === 1) && r1.legs.at(-1) === 0 && r1.river > 40 && r1.gap > 12 && r1.wares.at(-1) === 'pen clippers water food salt venom bandage pills shovel' && r1.wares.slice(0, -1).every(w => w === 'pen water food salt venom bandage pills shovel'), { legs: r1.legs, river: r1.river, gap: r1.gap, wares: r1.wares });
ok('the stall stands by the pen', r1.stallFromPen > 15 && r1.stallFromPen < 45, r1);
ok('a den and a cougar tree near enough to hunt there', r1.denNear < r1.denRange && r1.lairNear < r1.cougarRange, r1);

// set up: a dog, the flock in the Trading Post's pen (every camp found: in ?sim the HUD doesn't mark them)
await h.page.evaluate(() => {
  const { G, startGame, postPen: finalPen, step, CAMPS } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {}; G.clock.hour = 10;
  const H = window.H = {};
  H.pen = (p = finalPen) => { for (const s of G.sheep) { if (s.dead) continue; const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (p.R - 2.5); s.x = p.x + Math.cos(a) * r; s.z = p.z + Math.sin(a) * r; s.vx = s.vz = 0; } };
  H.run = sec => { for (let t = 0; t < sec; t += 0.025) step(0.025); };
  H.calm = () => { for (const c of G.coyotes) GAME.scene.remove(c.models.root); G.coyotes.length = 0; G.packs.length = 0; };
  H.found = (n = CAMPS.length) => { for (const c of CAMPS.slice(0, n)) G.visited.add(c.name); };
  H.reset = () => { GAME.resetGame(); G.clock.hour = 10; H.calm(); H.found(); G.players[0].bot = {}; GAME.setGate(finalPen, false); H.pen(); H.run(0.3); };
  H.ware = (id, st = GAME.MARKET) => st.wares.find(w => w.id === id);
  H.food = (p = finalPen) => p.troughs.reduce((a, tr) => a + tr.food, 0);
  H.reset();
});

// 2. too poor: nothing spent, nothing in the pen, still playing
const r2 = await h.page.evaluate(() => {
  const { G, buyWare, postPen: finalPen, kitN } = GAME; G.wool = 1;
  const food0 = H.food(), salt0 = finalPen.lick.salt, n0 = kitN(finalPen, 'food');
  const k = { food: buyWare(H.ware('food')), salt: buyWare(H.ware('salt')), water: buyWare(H.ware('water')) };
  return { k, wool: G.wool, food: H.food() - food0, salt: finalPen.lick.salt - salt0, troughs: kitN(finalPen, 'food') - n0, mode: G.mode };
});
ok('too little wool: a no for each, nothing spent, nothing delivered', Object.values(r2.k).every(k => k === 'poor') && r2.wool === 1 && r2.food === 0 && r2.salt === 0 && r2.troughs === 0 && r2.mode === 'play', r2);

// 3. 🌾 at the Trading Post: a trough at a time, stocked, till the pen holds its most (bigger pen, more); then batches till there's no room
const r3 = await h.page.evaluate(() => {
  const { G, buyWare, postPen: p, T, kitN, kitMax, pens } = GAME; G.wool = 200; const V = T.vendor, out = { adds: [] };
  out.n0 = kitN(p, 'food'); out.max = kitMax(p, 'food'); out.maxSmall = kitMax(pens[0], 'food');
  let k;
  while ((k = buyWare(H.ware('food'))) === 'add' && out.adds.length < 20) { const tr = p.troughs.at(-1); out.adds.push({ n: kitN(p, 'food'), full: tr.food === tr.cap, wool: G.wool }); }
  out.after = k; out.nAfter = kitN(p, 'food');
  out.woolPerAdd = out.adds.length > 1 ? out.adds[0].wool - out.adds[1].wool : 0;
  const w0 = G.wool; for (const tr of p.troughs) tr.food = 0; const f0 = H.food(); out.batch = buyWare(H.ware('food')); out.batchIn = +(H.food() - f0).toFixed(2); out.batchSpent = w0 - G.wool;
  let n = 0; while ((k = buyWare(H.ware('food'))) === 'buy' && n < 30) n++; out.stop = k;
  out.overCap = p.troughs.some(tr => tr.food > tr.cap + 1e-6); const cap = p.troughs.reduce((a, tr) => a + tr.cap, 0); out.fullK = +(H.food() / cap).toFixed(2);
  const w1 = G.wool; out.fullAgain = buyWare(H.ware('food')); out.spentWhenFull = w1 - G.wool; out.nFinal = kitN(p, 'food');
  out.V = V.food;
  return out;
});
ok('🌾 one more trough a bark, stocked full, `add` 🧶 each', r3.adds.length === r3.max - r3.n0 && r3.adds.every((a, i) => a.n === r3.n0 + i + 1 && a.full) && r3.woolPerAdd === r3.V.add, r3);
ok('🌾 a pen holds what its size allows (the big pen more)', r3.max > r3.n0 && r3.max > r3.maxSmall && r3.nAfter === r3.max, { max: r3.max, small: r3.maxSmall, n0: r3.n0 });
ok('🌾 at the most: a batch for `price` 🧶, then a no when there\'s no room; never over the caps', r3.after === 'buy' && Math.abs(r3.batchIn - r3.V.amt) < 0.01 && r3.batchSpent === r3.V.price && r3.stop === 'full' && r3.fullAgain === 'full' && r3.spentWhenFull === 0 && !r3.overCap && r3.fullK > 0.75 && r3.nFinal === r3.max, r3);

// 4. 💧 and 🧂: one pool per pen; each new one raises the cap and comes stocked; then batches; ✂️ free while Hank has none
const r4 = await h.page.evaluate(() => {
  const { G, buyWare, HANK, T, postPen: p, kitN, kitMax } = GAME, V = T.vendor; G.wool = 200; const out = {};
  for (const id of ['water', 'salt']) {
    const pool = () => id === 'water' ? [p.water.w, p.water.cap] : [p.lick.salt, p.lick.cap], o = out[id] = { n0: kitN(p, id), max: kitMax(p, id), steps: [] };
    if (id === 'water') p.water.w = 0; else p.lick.salt = 0;
    let k; while ((k = buyWare(H.ware(id))) === 'add' && o.steps.length < 10) o.steps.push([kitN(p, id), ...pool().map(v => +v.toFixed(2))]);
    o.after = k; o.pool = pool().map(v => +v.toFixed(2)); let n = 0; while ((k = buyWare(H.ware(id))) === 'buy' && n < 30) n++; o.stop = k; o.end = pool().map(v => +v.toFixed(2));
    const w0 = G.wool; o.again = buyWare(H.ware(id)); o.spent = w0 - G.wool;
  }
  out.cap = { water: T.water.cap, lick: T.salt.lickCap, lump: T.salt.lump };
  const clip = H.ware('clippers');
  HANK.clippers = false; out.clipShown = clip.show(); let w0 = G.wool; out.clip = buyWare(clip); out.clipSpent = w0 - G.wool; out.clippers = !!HANK.clippers; out.clipShownAfter = clip.show();
  const d = G.dogs[0]; d.x = clip.x; d.z = clip.z; w0 = G.wool; out.hiddenBark = GAME.vendorBark(d); out.hiddenSpent = w0 - G.wool;   // a hidden ware's mat sells nothing
  return out;
});
ok('💧 each new water trough: cap +1 trough, comes full; then batches, then a no', r4.water.steps.length === r4.water.max - r4.water.n0 && r4.water.steps.every(([n, w, cap], i) => n === r4.water.n0 + i + 1 && cap === n * r4.cap.water && Math.abs(w - (i + 1) * r4.cap.water) < 0.01) && r4.water.after === 'buy' && r4.water.stop === 'full' && r4.water.again === 'full' && r4.water.spent === 0 && r4.water.end[0] <= r4.water.end[1], r4.water);
ok('🧂 each new lick: cap +1 lick, comes with a lump; then batches, then a no', r4.salt.steps.length === r4.salt.max - r4.salt.n0 && r4.salt.steps.every(([n, salt, cap], i) => cap === n * r4.cap.lick && Math.abs(salt - (i + 1) * r4.cap.lump) < 0.01) && r4.salt.stop === 'full' && r4.salt.spent === 0 && r4.salt.end[0] <= r4.salt.end[1], r4.salt);
ok('✂️ free while Hank has none, then gone; its empty mat sells nothing', r4.clipShown && r4.clip === 'buy' && r4.clipSpent === 0 && r4.clippers && !r4.clipShownAfter && r4.hiddenBark === null && r4.hiddenSpent === 0, r4);

// 5. the real thing: a dog stands on the salt mat and barks
const r5 = await h.page.evaluate(() => {
  const { G, postPen: finalPen, T, step, kitN } = GAME; H.reset(); const d = G.dogs[0], w = H.ware('salt'); G.wool = 10; finalPen.lick.salt = 0;
  d.x = w.x; d.z = w.z; d.vx = d.vz = 0; d.barkCd = 0; H.run(0.2);
  G.players[0].bot = { bark: true }; step(0.025); G.players[0].bot = {}; H.run(0.2);
  const one = { lick: finalPen.lick.salt, licks: kitN(finalPen, 'salt'), wool: G.wool, bought: GAME.VENDOR.bought.salt };
  d.x = w.x + 4; d.barkCd = 0; G.players[0].bot = { bark: true }; step(0.025); G.players[0].bot = {}; H.run(0.2);   // off the mat: just a bark
  return { one, off: { lick: finalPen.lick.salt, wool: G.wool }, lump: T.salt.lump, price: T.vendor.salt.add };
});
ok('a bark on a mat buys it; off the mats a bark is just a bark', r5.one.lick === r5.lump && r5.one.licks === 2 && r5.one.wool === 10 - r5.price && r5.off.wool === r5.one.wool, r5);

// 5b. a trader on the way: 📍 only offers pens found so far, the furthest by default; a bark moves it on (trail order, round again); buys go there
const r5b = await h.page.evaluate(() => {
  const { G, STALLS, pens, buyWare, step, kitN, CAMPS } = GAME; H.reset(); G.visited = new Set([CAMPS[0].name]); H.run(0.05);
  const st = STALLS[0], pin = H.ware('pen', st), out = {};
  out.first = st.sel; G.visited.add(CAMPS[1].name); H.run(0.05); out.auto = st.sel;
  out.cycle = [0, 1, 2].map(() => (buyWare(pin), st.sel)); H.run(0.05); out.kept = st.sel;
  G.visited = new Set([CAMPS[0].name]); H.run(0.05); out.only = [buyWare(pin), st.sel]; G.visited.add(CAMPS[1].name); H.run(0.05); out.stuck = st.sel;   // picked the only one: it stays picked
  G.wool = 50; const p = pens[st.sel], n0 = kitN(p, 'food'), fn0 = kitN(GAME.postPen, 'food');
  out.buy = buyWare(H.ware('food', st)); out.to = [kitN(p, 'food') - n0, kitN(GAME.postPen, 'food') - fn0, pens.indexOf(p)];
  G.visited = new Set([CAMPS[0].name]); H.run(0.05); out.lost = st.sel;   // (a picked pen not found: back to one that is)
  return out;
});
ok('📍 only pens found so far: the first camp to begin with, a bark keeps it there', r5b.first === 0 && r5b.only[0] === 'pen' && r5b.only[1] === 0 && r5b.stuck === 0, r5b);
ok('📍 the furthest found by default; a bark goes to the next found, round again; the pick sticks', r5b.auto === 1 && r5b.cycle.join() === '0,1,0' && r5b.kept === 0, r5b);
ok('a leg trader\'s 🌾 goes to the picked pen, not the Trading Post', r5b.buy === 'add' && r5b.to[0] === 1 && r5b.to[1] === 0 && r5b.to[2] === 0 && r5b.lost === 0, r5b);

// 5c. what fits: every pen's slots inside it, along the fence, clear of the gateway and of each other
const r5c = await h.page.evaluate(() => {
  const { pens, kitMax } = GAME, bad = [];
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  for (const p of pens) {
    const all = [...p.troughSlots.map(u => ['food', u]), ...p.waterSlots.map(u => ['water', u]), ...p.lickSlots.map(u => ['salt', u])];
    const ends = u => { const s = u.box.solid; return [-1, -0.5, 0, 0.5, 1].map(t => [s.x + s.tx * s.hl * t, s.z + s.tz * s.hl * t, s.hw]); };
    for (const [k, u] of all) {
      for (const [x, z] of ends(u)) { if (Math.hypot(x - p.x, z - p.z) > p.R - 0.25) bad.push([p.camp.name, k, 'out']); if (Math.abs(wrap(Math.atan2(z - p.z, x - p.x) - p.gateA)) < p.gapHalf + 0.3) bad.push([p.camp.name, k, 'gate']); }
    }
    const gapOf = (A, B) => {   // the widest gap along any of the two boxes' axes (< 0: they overlap)
      let g = -1e9; const dx = B.x - A.x, dz = B.z - A.z;
      for (const [ax, az] of [[A.tx, A.tz], [-A.tz, A.tx], [B.tx, B.tz], [-B.tz, B.tx]]) {
        const pr = Q => Q.hl * Math.abs(Q.tx * ax + Q.tz * az) + Q.hw * Math.abs(-Q.tz * ax + Q.tx * az);
        g = Math.max(g, Math.abs(dx * ax + dz * az) - pr(A) - pr(B));
      }
      return g;
    };
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const g = gapOf(all[i][1].box.solid, all[j][1].box.solid); if (g < 0.3) bad.push([p.camp.name, all[i][0], all[j][0], +g.toFixed(2)]);
    }
  }
  return { bad: bad.slice(0, 8), max: pens.map(p => ['food', 'water', 'salt'].map(k => kitMax(p, k)).join('/')) };
});
ok('every pen\'s troughs, water troughs and licks fit: inside, clear of the gateway and each other', !r5c.bad.length, r5c);

// 5d. the sheep use the new ones: a pen with only bought ones stocked. Hungry: they eat there; thirsty and short of salt: they drink and lick there
const r5d = await h.page.evaluate(() => {
  const { G, pens, kitSet, setGate, troughSpots, step } = GAME; H.reset();
  const p = pens[1]; for (const k of ['food', 'water', 'salt']) kitSet(p, k, 99); troughSpots(p);
  const nb = p.troughBase; for (const tr of p.troughs) tr.food = 0; for (const tr of p.troughs.slice(nb)) tr.food = tr.cap;
  setGate(p, false); G.clock.hour = 17;
  const flock = (hunger, thirst, salt) => { H.pen(p); for (const s of G.sheep) { s.hunger = hunger; s.thirst = thirst; s.salt = salt; s.state = 'idle'; s.thinkT = 0; } };
  flock(0.9, 0, 1); H.run(20);
  const newFood = p.troughs.slice(nb).reduce((a, tr) => a + tr.cap - tr.food, 0), oldFood = p.troughs.slice(0, nb).reduce((a, tr) => a + tr.food, 0);
  p.water.w = p.water.cap; p.lick.salt = p.lick.cap; flock(0.05, 0.8, 0.4);
  troughSpots(p); const wFrom = p.waterSpots.findIndex(q => Math.hypot(q.x - p.water.x, q.z - p.water.z) > 2.5);
  let drinkNew = 0, lickNew = 0, stuck = 0;
  for (let t = 0; t < 20; t += 0.025) {
    step(0.025);
    drinkNew = Math.max(drinkNew, p.waterBy.filter((o, i) => o && i >= wFrom).length); lickNew = Math.max(lickNew, p.lickBy.filter((o, i) => o && i >= 3).length);
  }
  stuck = G.sheep.filter(s => !s.dead && p.troughs.concat(p.water.at).some(u => Math.abs((s.x - u.x) * u.tx + (s.z - u.z) * u.tz) < u.len / 2 && Math.abs((s.x - u.x) * u.tz - (s.z - u.z) * u.tx) < 0.3)).length;
  return { newFood: +newFood.toFixed(2), oldFood, drinkNew, lickNew, wFrom, spots: [p.feedSpots.length, p.waterSpots.length, p.lickSpots.length], stuck };
});
ok('the flock eats at the new troughs, drinks at the new water troughs, licks the new licks; nobody inside one', r5d.newFood > 1 && r5d.oldFood === 0 && r5d.wFrom > 0 && r5d.drinkNew > 0 && r5d.lickNew > 0 && r5d.stuck === 0, r5d);

// 5e. dogs tip a bucket into a new water trough, salt into a new lick; Hank speaks up at the first trader; a new journey: just what each pen came with
const r5e = await h.page.evaluate(() => {
  const { G, pens, kitSet, kitN, BUCKETS, STALLS, T, navFence, CAMPS } = GAME; H.reset(); const out = {};
  const nav0 = Array.from(navFence).reduce((a, v, i) => a + v * (i % 97 + 1), 0);
  const p = pens[2]; kitSet(p, 'water', 99); kitSet(p, 'salt', 99); p.water.w = 0; p.lick.salt = 0;
  out.navChanged = Array.from(navFence).reduce((a, v, i) => a + v * (i % 97 + 1), 0) !== nav0;
  const d = G.dogs[0], u = p.water.at.at(-1), b = BUCKETS[0]; b.by = d; b.w = T.water.bucket; d.x = u.x + (p.x - u.x) / Math.hypot(p.x - u.x, p.z - u.z) * 1.3; d.z = u.z + (p.z - u.z) / Math.hypot(p.x - u.x, p.z - u.z) * 1.3;
  H.run(0.1);   // (in its mouth: tipped in going up to it)
  out.tipped = +p.water.w.toFixed(2); b.by = null;
  const L = p.lick.at.at(-1); d.salt = 1; d.x = L.x + (p.x - L.x) / Math.hypot(p.x - L.x, p.z - L.z) * 1.2; d.z = L.z + (p.z - L.z) / Math.hypot(p.x - L.x, p.z - L.z) * 1.2; H.run(0.1);
  out.salted = p.lick.salt; out.saltLeft = d.salt;
  const st = STALLS[1]; d.x = st.x + st.fx * 6; d.z = st.z + st.fz * 6; H.run(3);
  out.hank = GAME.HANK.log.slice(-6).map(l => l.said ? l.text : '').filter(Boolean);
  st.pick = 0; GAME.resetGame(); out.kits = pens.map(p => ['food', 'water', 'salt'].map(k => kitN(p, k)).join('/'));
  out.base = pens.map(p => [p.troughBase, 1, 1].join('/')); out.caps = [p.water.cap, p.lick.cap]; out.pick = st.pick; out.met = GAME.VENDOR.met;
  out.navBack = Array.from(navFence).reduce((a, v, i) => a + v * (i % 97 + 1), 0) === nav0;
  out.shown = pens.every(p => p.troughSlots.every((u, i) => u.g.visible === i < p.troughBase) && p.waterSlots.every((u, i) => u.g.visible === !i) && p.lickSlots.every((u, i) => u.g.visible === !i));
  out.want = { bucket: T.water.bucket, lump: T.salt.lump, water: T.water.cap, lick: T.salt.lickCap };
  return out;
});
ok('a bucket tips into a new water trough, salt into a new lick', r5e.tipped === r5e.want.bucket && r5e.salted === r5e.want.lump && !r5e.saltLeft, r5e);
ok('Hank speaks up at the first trader', r5e.hank.some(t => /trader/i.test(t)), r5e.hank);
ok('new ones block the coyotes\' paths too; a new journey: bought ones gone, caps and paths back, picks cleared', r5e.navChanged && r5e.kits.join() === r5e.base.join() && r5e.caps[0] === r5e.want.water && r5e.caps[1] === r5e.want.lick && r5e.pick === -1 && !r5e.met && r5e.navBack && r5e.shown, r5e);

// 6. no Cabo anywhere: the journey's won up the MOUNTAIN PASS (pass-test)
const r6 = await h.page.evaluate(() => ({ cabo: GAME.ALL_WARES.filter(w => w.id === 'cabo').length }));
ok('🏖️ no Cabo for sale', r6.cabo === 0, r6);

// 7. the whole flock penned at the Trading Post, gate shut → the journey goes on; losing them all still ends it
const r7 = await h.page.evaluate(() => {
  const { G, postPen: finalPen, onGateClosed, setGate, killSheep } = GAME; const out = {};
  H.reset(); setGate(finalPen, true); H.run(0.2); H.pen(); H.run(0.5);
  out.inside = G.sheep.filter(s => s.pen === finalPen).length; setGate(finalPen, false); onGateClosed(finalPen); H.run(3); out.mode = G.mode;
  for (const s of G.sheep) if (!s.dead) killSheep(s, 'eaten'); H.run(0.2);
  out.lostMode = G.mode; out.lostTitle = document.getElementById('eTitle').textContent; out.won = document.getElementById('end').classList.contains('won');
  return out;
});
ok('shutting the whole flock in at the Trading Post doesn\'t end the journey', r7.inside > 10 && r7.mode === 'play', r7);
ok('losing the whole flock still ends it', r7.lostMode === 'end' && !/pass/.test(r7.lostTitle) && !r7.won, r7);

// 8. a new journey: the vendor's ready again
const r8 = await h.page.evaluate(() => { GAME.resetGame(); return { mode: GAME.G.mode, hello: GAME.VENDOR.hello }; });
ok('a new journey resets the stall', r8.mode === 'play' && !r8.hello, r8);

ok('no page errors', h.errors.length === 0, h.errors.slice(0, 5));
console.log(fails ? `${fails} FAILED` : 'all ok');
await h.close();
process.exit(fails ? 1 : 0);
