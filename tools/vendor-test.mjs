// Headless checks for the vagabond (VAG), the one trader: his pitches (1–2 a land leg, a new seed each journey, the last at the Trading
// Post, none up the pass); the bark (Ⓐ / Space) by him lays his wares out (not a bark); a dog on a mat barks to buy with wool: 📍 picks
// a pen found on the way, 🌾 💧 🧂 add a stocked trough / water trough / lick there up to what the pen holds (by its size), then batches;
// his mood: bonks, nags (barks), grabs are grievances (the first three warn, then prices go up), fetch / a tug / an apple work them off,
// then a discount; grabbed he screams; annoyed past bearing he's off for a day; he walks on, skips ahead, sleeps; no Cabo. At sea: his
// Laser (out in Cold Harbour's bay, sailing by her, beached on the islands, asleep by it, gone after Gull Rock).
// `node tools/vendor-test.mjs`
// Checks: the vagabond: pitches (1–2 a leg, seeded, the last at the Trading Post, none up the pass), stalls gone; the trade press (pad
//   bark, keyboard Space), packing up; 📍 pen pick, troughs added to the max then batches, fit (a sheep's width apart, flush to the fence, a
//   dog walks out), sheep use them, reset; too poor, full pen; nags (not herding, not from afar), bonks (worse each time), 3 warnings then
//   prices up (capped); fetch, apple, tug: grievances off then a discount (capped); grabbed (screams, dragged, dusts off); leaves for a day,
//   back ahead; walks on, skips ahead off screen, sleeps, woken; new journey; no Cabo, the Trading Post doesn't end it; at sea: Cold
//   Harbour: out in the bay (nothing on the quay, out of reach), cast off, sails by her (clear, heeled, boom to leeward, out of reach),
//   beached ahead of her, trades on the island (🌾 to the deck), asleep by his boat, Gull Rock: bye, gone
import { open } from './harness.mjs';
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

// 1. the world: the Trading Post in the desert, no water near it, predators about; the trail climbs on to the yeti's cave (the end).
// His pitches: every land leg up to the Trading Post, its last at the Trading Post; none up the pass, in Falcon Canyon, by the river; mats fit
const r1 = await h.page.evaluate(() => {
  const { CAMPS, PATH_LEN, FINAL, POST, finalPen, postPen, pens, DENS, LAIRS, terrainH, sdfAt, sAt, T, VAG, vagPlan, vagLayout, STALLS, RIVER, canyonK, OBSTACLES, ALL_WARES } = GAME;
  let wet = 0; for (let a = 0; a < 64; a++) for (const r of [20, 35, 50, 65]) { const x = POST.x + Math.cos(a / 64 * 6.283) * r, z = POST.z + Math.sin(a / 64 * 6.283) * r; if (sdfAt(x, z) > 0 && terrainH(x, z) < -3 + 0.6) wet++; }
  const P = vagPlan(12345), P2 = vagPlan(12345), P3 = vagPlan(777), legs = CAMPS.slice(1).map((c, i) => P.filter(p => p.s > CAMPS[i].s && p.s < c.s).length);
  const mats = []; for (const p of P) { GAME.vagPlaceMats(p.lay); for (const w of ALL_WARES) mats.push({ s: Math.round(p.s), id: w.id, sdf: +sdfAt(w.x, w.z).toFixed(1), inPen: pens.some(q => Math.hypot(w.x - q.x, w.z - q.z) < q.R + 1) }); }
  return {
    camps: CAMPS.map(c => c.name), last: CAMPS[CAMPS.length - 1] === FINAL, finals: CAMPS.filter(c => c.final).length, promisedFinal: !!CAMPS[3].final,
    penFinal: finalPen && finalPen.final && finalPen.camp === FINAL, postFinal: !!postPen.final, toEnd: Math.round(PATH_LEN - POST.s), wetNear: wet,
    legs, n: P.length, same: JSON.stringify(P) === JSON.stringify(P2), other: JSON.stringify(P) !== JSON.stringify(P3),
    lastAtPost: P.at(-1).old && Math.abs(P.at(-1).s - STALLS.at(-1).s) < 1 && P.at(-1).s < POST.s, pastPost: P.filter(p => p.s > POST.s).length,
    river: Math.round(Math.min(...P.filter(p => !p.old).map(p => Math.abs(p.s - RIVER.s)))), canyon: P.filter(p => canyonK(p.s) > 0).length,
    badMats: mats.filter(m => m.sdf <= 1 || m.inPen).slice(0, 6),
    stallsGone: OBSTACLES.every(o => !o.stall) && STALLS.every(m => sdfAt(m.x + m.rx * -1 + m.fx * 0.2, m.z + m.rz * -1 + m.fz * 0.2) > 2),   // (their counters: rocks to world gen only)
    denNear: Math.round(Math.min(...DENS.map(d => Math.hypot(d.x - POST.x, d.z - POST.z)))), lairNear: Math.round(Math.min(...LAIRS.map(l => Math.hypot(l.x - POST.x, l.z - POST.z)))),
    cougarRange: T.cougar.range + 30, denRange: T.denRange, off: VAG.st,
  };
});
ok('the yeti\'s cave is the last camp and the only final one; the Trading Post isn\'t', r1.last && r1.finals === 1 && !r1.promisedFinal && r1.penFinal && !r1.postFinal, r1);
ok('the trail climbs on past the Trading Post (the MOUNTAIN PASS)', r1.toEnd > 300, r1);
ok('no water near the Trading Post', r1.wetNear === 0, r1);
ok('his pitches: 1–2 on every leg up to the Trading Post (it the last, where its stall stood), none up the pass, in the canyon, by the river', r1.legs.slice(0, -1).every(n => n >= 1 && n <= 2) && r1.legs.at(-1) === 0 && r1.lastAtPost && !r1.pastPost && !r1.canyon && r1.river > 40, r1);
ok('his pitches: seeded (same seed, same pitches; another seed, others)', r1.same && r1.other, r1);
ok('every mat at every pitch on open ground, none in a pen', !r1.badMats.length, r1.badMats);
ok('no stalls: where they stood is open ground', r1.stallsGone, r1);
ok('a den and a cougar tree near enough to hunt at the Trading Post', r1.denNear < r1.denRange && r1.lairNear < r1.cougarRange, r1);
ok('off in ?sim till a test turns him on', r1.off === 'off', r1);

// set up: him on, a dog, the flock in the Trading Post's pen (every camp found: in ?sim the HUD doesn't mark them)
await h.page.evaluate(() => {
  const { G, startGame, postPen: finalPen, step, CAMPS, T, groundY } = GAME;
  T.vag.on = true; startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {}; G.clock.hour = 10;
  const H = window.H = {}, d = G.dogs[0], p = G.players[0], V = GAME.VAG;
  H.pen = (q = finalPen) => { for (const s of G.sheep) { if (s.dead) continue; const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (q.R - 2.5); s.x = q.x + Math.cos(a) * r; s.z = q.z + Math.sin(a) * r; s.vx = s.vz = 0; } };
  H.run = sec => { for (let t = 0; t < sec; t += 0.025) step(0.025); };
  H.calm = () => { for (const c of G.coyotes) GAME.scene.remove(c.models.root); G.coyotes.length = 0; G.packs.length = 0; };
  H.found = (n = CAMPS.length) => { for (const c of CAMPS.slice(0, n)) G.visited.add(c.name); };
  H.reset = () => { GAME.resetGame(); G.clock.hour = 10; H.calm(); H.found(); p.bot = {}; GAME.setGate(finalPen, false); H.pen(); H.run(0.3); };
  H.ware = id => GAME.MARKET.wares.find(w => w.id === id);
  H.food = (q = finalPen) => q.troughs.reduce((a, tr) => a + tr.food, 0);
  H.place = (e, x, z, yaw) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); if (yaw !== undefined) e.yaw = yaw; if (e.isDog) { e.air = null; e.stunT = e.hopT = 0; } };
  H.by = (r = 2.2, a = V.yaw) => H.place(d, V.x + Math.sin(a) * r, V.z + Math.cos(a) * r, a + Math.PI);   // a dog r m off him (a: which side)
  H.press = (k, x = {}) => { p.bot = { [k]: true, ...x }; step(0.025); p.bot = {}; };
  H.at = i => { GAME.vagDevTo(i); V.griev = V.good = 0; V.annoy = 0; V.goodAt = -99; G.clock.hour = 10; for (const b of [...GAME.BONES]) if (b.stick) GAME.killBone(b); H.run(0.3); };   // him at pitch i, in a good mood (no sticks about: a pounce can kick one to him)
  H.reset();
});

// 2. the trade press: by him a bark (Ⓐ, Space, 📣) lays his wares out (no bark); a jump's a jump; away from him, a bark's a bark
const r2 = await h.page.evaluate(() => {
  const { G, VAG, vagPress } = GAME, d = G.dogs[0], out = {};
  H.at(1); H.by(6); d.barkCd = 0; let b0 = G.barks || 0; H.press('bark'); out.far = { out: VAG.out, barked: (G.barks || 0) - b0 };
  H.run(1); H.by(2.2); d.barkCd = 0; b0 = G.barks || 0; H.press('bark'); out.near = { out: VAG.out, barked: (G.barks || 0) - b0, lay: !!VAG.lay };
  VAG.out = false; const k = d.player.kind; d.player.kind = 'kb'; out.kbBark = vagPress(d, { bark: true }); VAG.out = false; out.kbJump = vagPress(d, { jump: true }); d.player.kind = k;
  H.run(1.5); out.mats = GAME.ALL_WARES.every(w => Math.hypot(w.x - VAG.x, w.z - VAG.z) < 16);
  H.place(d, VAG.x + 40, VAG.z); H.run(GAME.T.vag.packT + 1); out.packed = !VAG.out;
  return out;
});
ok('a bark away from him is a bark; by him it lays his wares out (no bark)', !r2.far.out && r2.far.barked === 1 && r2.near.out && r2.near.barked === 0 && r2.near.lay && r2.mats, r2);
ok('keyboard: Space (bark) trades, F (jump) doesn\'t', r2.kbBark && !r2.kbJump, r2);
ok('packed up once nobody\'s by them a while', r2.packed, r2);

// 3. too poor: nothing spent, nothing in the pen, still playing
const r3 = await h.page.evaluate(() => {
  const { G, buyWare, postPen: finalPen, kitN } = GAME; H.reset(); G.wool = 1;
  const food0 = H.food(), salt0 = finalPen.lick.salt, n0 = kitN(finalPen, 'food'); GAME.pickPen(GAME.MARKET); while (GAME.pens[GAME.MARKET.sel] !== finalPen) GAME.pickPen(GAME.MARKET);
  const k = { food: buyWare(H.ware('food')), salt: buyWare(H.ware('salt')), water: buyWare(H.ware('water')) };
  return { k, wool: G.wool, food: H.food() - food0, salt: finalPen.lick.salt - salt0, troughs: kitN(finalPen, 'food') - n0, mode: G.mode };
});
ok('too little wool: a no for each, nothing spent, nothing delivered', Object.values(r3.k).every(k => k === 'poor') && r3.wool === 1 && r3.food === 0 && r3.salt === 0 && r3.troughs === 0 && r3.mode === 'play', r3);

// 4. 🌾 to the Trading Post: a trough at a time, stocked, till the pen holds its most (bigger pen, more); then batches till there's no room
const r4 = await h.page.evaluate(() => {
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
ok('🌾 one more trough a bark, stocked full, `add` 🧶 each', r4.adds.length === r4.max - r4.n0 && r4.adds.every((a, i) => a.n === r4.n0 + i + 1 && a.full) && r4.woolPerAdd === r4.V.add, r4);
ok('🌾 a pen holds what its size allows (the big pen more)', r4.max > r4.n0 && r4.max > r4.maxSmall && r4.nAfter === r4.max, { max: r4.max, small: r4.maxSmall, n0: r4.n0 });
ok('🌾 at the most: a batch for `price` 🧶, then a no when there\'s no room; never over the caps', r4.after === 'buy' && Math.abs(r4.batchIn - r4.V.amt) < 0.01 && r4.batchSpent === r4.V.price && r4.stop === 'full' && r4.fullAgain === 'full' && r4.spentWhenFull === 0 && !r4.overCap && r4.fullK > 0.75 && r4.nFinal === r4.max, r4);

// 5. 💧 and 🧂: one pool per pen; each new one raises the cap and comes stocked; then batches; ✂️ free while Hank has none
const r5 = await h.page.evaluate(() => {
  const { G, buyWare, HANK, T, postPen: p, kitN, kitMax, VAG } = GAME; G.wool = 200; const out = {};
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
  VAG.out = true; const d = G.dogs[0]; d.x = clip.x; d.z = clip.z; w0 = G.wool; out.hiddenBark = GAME.vendorBark(d); out.hiddenSpent = w0 - G.wool; VAG.out = false;   // a hidden ware's mat sells nothing
  return out;
});
ok('💧 each new water trough: cap +1 trough, comes full; then batches, then a no', r5.water.steps.length === r5.water.max - r5.water.n0 && r5.water.steps.every(([n, w, cap], i) => n === r5.water.n0 + i + 1 && cap === n * r5.cap.water && Math.abs(w - (i + 1) * r5.cap.water) < 0.01) && r5.water.after === 'buy' && r5.water.stop === 'full' && r5.water.again === 'full' && r5.water.spent === 0 && r5.water.end[0] <= r5.water.end[1], r5.water);
ok('🧂 each new lick: cap +1 lick, comes with a lump; then batches, then a no', r5.salt.steps.length === r5.salt.max - r5.salt.n0 && r5.salt.steps.every(([n, salt, cap], i) => cap === n * r5.cap.lick && Math.abs(salt - (i + 1) * r5.cap.lump) < 0.01) && r5.salt.stop === 'full' && r5.salt.spent === 0 && r5.salt.end[0] <= r5.salt.end[1], r5.salt);
ok('✂️ free while Hank has none, then gone; its empty mat sells nothing', r5.clipShown && r5.clip === 'buy' && r5.clipSpent === 0 && r5.clippers && !r5.clipShownAfter && r5.hiddenBark === null && r5.hiddenSpent === 0, r5);

// 6. the real thing: his wares out, a dog stands on the salt mat and barks; packed up, the same spot sells nothing
const r6 = await h.page.evaluate(() => {
  const { G, T, step, kitN, pens, VAG } = GAME; H.reset(); H.at(1); const d = G.dogs[0], p = G.players[0];
  H.by(2.2); H.press('bark'); H.run(1.5);
  const pen = pens[GAME.MARKET.sel], w = H.ware('salt'); G.wool = 10; pen.lick.salt = 0; const licks0 = kitN(pen, 'salt');
  H.place(d, w.x, w.z); d.barkCd = 0; H.run(0.2); H.press('bark'); H.run(0.2);
  const one = { lick: +pen.lick.salt.toFixed(2), licks: kitN(pen, 'salt') - licks0, wool: G.wool, bought: GAME.VENDOR.bought.salt, nag: VAG.nags };
  VAG.out = false; d.barkCd = 0; H.press('bark'); H.run(0.2);   // (packed: just a bark)
  return { one, packed: { wool: G.wool }, lump: T.salt.lump, price: T.vendor.salt.add };
});
ok('his wares out: a bark on a mat buys it (not a nag); packed, it\'s just a bark', Math.abs(r6.one.lick - r6.lump) < 0.1 && r6.one.licks === 1 && r6.one.wool === 10 - r6.price && r6.one.nag === 0 && r6.packed.wool === r6.one.wool, r6);

// 6b. 📍 only offers pens found so far, the furthest by default; a bark moves it on (trail order, round again); buys go there
const r6b = await h.page.evaluate(() => {
  const { G, pens, buyWare, kitN, CAMPS, MARKET: st } = GAME; H.reset(); G.visited = new Set([CAMPS[0].name]); H.run(0.05);
  const pin = H.ware('pen'), out = {};
  out.first = st.sel; G.visited.add(CAMPS[1].name); H.run(0.05); out.auto = st.sel;
  out.cycle = [0, 1, 2].map(() => (buyWare(pin), st.sel)); H.run(0.05); out.kept = st.sel;
  G.visited = new Set([CAMPS[0].name]); H.run(0.05); out.only = [buyWare(pin), st.sel]; G.visited.add(CAMPS[1].name); H.run(0.05); out.stuck = st.sel;   // picked the only one: it stays picked
  G.wool = 50; const p = pens[st.sel], n0 = kitN(p, 'food'), fn0 = kitN(GAME.postPen, 'food');
  out.buy = buyWare(H.ware('food')); out.to = [kitN(p, 'food') - n0, kitN(GAME.postPen, 'food') - fn0, pens.indexOf(p)];
  G.visited = new Set([CAMPS[0].name]); H.run(0.05); out.lost = st.sel;   // (a picked pen not found: back to one that is)
  return out;
});
ok('📍 only pens found so far: the first camp to begin with, a bark keeps it there', r6b.first === 0 && r6b.only[0] === 'pen' && r6b.only[1] === 0 && r6b.stuck === 0, r6b);
ok('📍 the furthest found by default; a bark goes to the next found, round again; the pick sticks', r6b.auto === 1 && r6b.cycle.join() === '0,1,0' && r6b.kept === 0, r6b);
ok('🌾 goes to the picked pen, not the Trading Post', r6b.buy === 'add' && r6b.to[0] === 1 && r6b.to[1] === 0 && r6b.to[2] === 0 && r6b.lost === 0, r6b);

// 6c. what fits: every pen's slots inside it, along the fence, clear of the gateway and of each other: a sheep walks between
// any two, nothing fits behind one
const r6c = await h.page.evaluate(() => {
  const { pens, kitMax, T } = GAME, bad = []; let minGap = 1e9;
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const segD = (x, z, s) => { const dx = s.bx - s.ax, dz = s.bz - s.az, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - s.ax - dx * t, z - s.az - dz * t); };
  for (const p of pens) {
    const all = [...p.troughSlots.map(u => ['food', u]), ...p.waterSlots.map(u => ['water', u]), ...p.lickSlots.map(u => ['salt', u])];
    const ends = u => { const s = u.box.solid; return [-1, -0.5, 0, 0.5, 1].map(t => [s.x + s.tx * s.hl * t, s.z + s.tz * s.hl * t, s.hw]); };
    for (const [k, u] of all) {
      for (const [x, z] of ends(u)) { if (Math.hypot(x - p.x, z - p.z) > p.R - 0.25) bad.push([p.camp.name, k, 'out']); if (Math.abs(wrap(Math.atan2(z - p.z, x - p.x) - p.gateA)) < p.gapHalf + 0.3) bad.push([p.camp.name, k, 'gate']); }
      if (k === 'salt') continue;   // (a lick's narrower than a dog: nothing's pocketed behind it)
      const s = u.box.solid; for (const t of [-1, 0, 1]) { const x = s.x + s.tx * s.hl * t - s.nx * s.hw, z = s.z + s.tz * s.hl * t - s.nz * s.hw, f = Math.min(...p.segs.map(sg => segD(x, z, sg))); if (f > T.dogR - 0.05) bad.push([p.camp.name, k, 'behind', +f.toFixed(2)]); }
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
      const g = gapOf(all[i][1].box.solid, all[j][1].box.solid), need = 2 * T.sheepR + 0.1; minGap = Math.min(minGap, g);
      if (g < need) bad.push([p.camp.name, all[i][0], all[j][0], +g.toFixed(2)]);
    }
  }
  return { bad: bad.slice(0, 8), minGap: +minGap.toFixed(2), max: pens.map(p => ['food', 'water', 'salt'].map(k => kitMax(p, k)).join('/')) };
});
ok('every pen\'s troughs, water troughs and licks fit: inside, clear of the gateway, a sheep\'s width apart, flush to the fence', !r6c.bad.length, r6c);

// 6c2. a dog dropped behind or between any of them (every slot shown) walks out into the pen
const r6c2 = await h.page.evaluate(() => {
  const { G, pens, kitSet, step, groundY, CAM_R, CAM_F, VAG } = GAME; H.reset(); GAME.vagHide();
  const d = G.dogs[0], pl = G.players[0], out = { tries: 0, stuck: [] };
  for (const s of G.sheep) { s.x += 3000; s.z += 3000; } GAME.HANK.x += 3000;
  const inp = (dx, dz) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l }; };
  for (const p of pens) {
    if (p.deck || p.final) continue;
    for (const k of ['food', 'water', 'salt']) kitSet(p, k, 99);
    const all = [...p.troughSlots, ...p.waterSlots, ...p.lickSlots].map(u => ({ s: u.box.solid, a: Math.atan2(u.z - p.z, u.x - p.x) })).sort((A, B) => A.a - B.a), at = [];
    all.forEach((A, i) => {
      const S = A.s, B = all[(i + 1) % all.length]; at.push(['behind', S.x - S.nx * (S.hw + 0.2), S.z - S.nz * (S.hw + 0.2)]);
      const da = ((B.a - A.a) % 6.2832 + 6.2832) % 6.2832; if (da > 1.2) return;
      for (const r of [p.R - 0.45, Math.hypot(S.x - p.x, S.z - p.z)]) at.push(['between', p.x + Math.cos(A.a + da / 2) * r, p.z + Math.sin(A.a + da / 2) * r]);
    });
    for (const [kind, x, z] of at) {
      out.tries++; d.x = x; d.z = z; d.vx = d.vz = 0; d.y = groundY(x, z); d.stunT = 0; d.hopT = 0;
      let t = 0; for (; t < 3; t += 0.025) { pl.bot = inp(p.x - d.x, p.z - d.z); step(0.025); if (Math.hypot(d.x - p.x, d.z - p.z) < p.R - 2.5) break; }
      if (t >= 3) out.stuck.push([p.camp.name, kind, +Math.hypot(x - p.x, z - p.z).toFixed(2)]);
    }
    for (const k of ['food', 'water', 'salt']) kitSet(p, k, 0);
  }
  pl.bot = {}; out.stuck = out.stuck.slice(0, 6); return out;
});
ok('a dog behind or between the troughs, water troughs and licks walks out', r6c2.tries > 100 && !r6c2.stuck.length, r6c2);

// 6d. the sheep use the new ones: a pen with only bought ones stocked. Hungry: they eat there; thirsty and short of salt: they drink and lick there
const r6d = await h.page.evaluate(() => {
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
ok('the flock eats at the new troughs, drinks at the new water troughs, licks the new licks; nobody inside one', r6d.newFood > 1 && r6d.oldFood === 0 && r6d.wFrom > 0 && r6d.drinkNew > 0 && r6d.lickNew > 0 && r6d.stuck === 0, r6d);

// 6e. dogs tip a bucket into a new water trough, salt into a new lick; Hank speaks up on meeting him; a new journey: just what each pen came with
const r6e = await h.page.evaluate(() => {
  const { G, pens, kitSet, kitN, BUCKETS, T, navFence, VAG } = GAME; H.reset(); const out = {};
  const nav0 = Array.from(navFence).reduce((a, v, i) => a + v * (i % 97 + 1), 0);
  const p = pens[2]; kitSet(p, 'water', 99); kitSet(p, 'salt', 99); p.water.w = 0; p.lick.salt = 0;
  out.navChanged = Array.from(navFence).reduce((a, v, i) => a + v * (i % 97 + 1), 0) !== nav0;
  const d = G.dogs[0], u = p.water.at.at(-1), b = BUCKETS[0]; b.by = d; b.w = T.water.bucket; d.x = u.x + (p.x - u.x) / Math.hypot(p.x - u.x, p.z - u.z) * 1.3; d.z = u.z + (p.z - u.z) / Math.hypot(p.x - u.x, p.z - u.z) * 1.3;
  G.players[0].bot = { grab: true }; H.run(0.1);   // (in its mouth, Ⓧ held: tipped in going up to it)
  out.tipped = +p.water.w.toFixed(2); b.by = null; G.players[0].bot = {};
  const L = p.lick.at.at(-1); d.salt = 1; d.x = L.x + (p.x - L.x) / Math.hypot(p.x - L.x, p.z - L.z) * 1.2; d.z = L.z + (p.z - L.z) / Math.hypot(p.x - L.x, p.z - L.z) * 1.2; H.run(0.1);
  out.salted = p.lick.salt; out.saltLeft = d.salt;
  H.at(1); H.by(8); H.run(3);
  out.hank = GAME.HANK.log.slice(-6).map(l => l.said ? l.text : '').filter(Boolean);
  GAME.MARKET.pick = 0; GAME.resetGame(); out.kits = pens.map(p => ['food', 'water', 'salt'].map(k => kitN(p, k)).join('/'));
  out.base = pens.map(p => [p.troughBase, 1, 1].join('/')); out.caps = [p.water.cap, p.lick.cap]; out.pick = GAME.MARKET.pick; out.met = GAME.VENDOR.met;
  out.navBack = Array.from(navFence).reduce((a, v, i) => a + v * (i % 97 + 1), 0) === nav0;
  out.shown = pens.every(p => p.troughSlots.every((u, i) => u.g.visible === i < p.troughBase) && p.waterSlots.every((u, i) => u.g.visible === !i) && p.lickSlots.every((u, i) => u.g.visible === !i));
  out.want = { bucket: T.water.bucket, lump: T.salt.lump, water: T.water.cap, lick: T.salt.lickCap };
  return out;
});
ok('a bucket tips into a new water trough, salt into a new lick', r6e.tipped === r6e.want.bucket && r6e.salted === r6e.want.lump && !r6e.saltLeft, r6e);
ok('Hank speaks up on meeting the vagabond', r6e.hank.some(t => /vagabond/i.test(t)), r6e.hank);
ok('new ones block the coyotes\' paths too; a new journey: bought ones gone, caps and paths back, picks cleared', r6e.navChanged && r6e.kits.join() === r6e.base.join() && r6e.caps[0] === r6e.want.water && r6e.caps[1] === r6e.want.lick && r6e.pick === -1 && !r6e.met && r6e.navBack && r6e.shown, r6e);

// 7. his mood. Barks by him (not buying): every third in a few s a nag, worse each time. Bonks: worse each time. The first three grievances
// only warn; from the fourth prices go up (to a cap)
const r7 = await h.page.evaluate(() => {
  const { G, VAG, T, step, wareDeal } = GAME; H.reset(); H.at(1); const d = G.dogs[0], p = G.players[0], out = { nags: [], bonks: [] };
  const price = () => wareDeal(H.ware('venom')).price, base = T.vendor.venom.price, L0 = T.vag.leave; T.vag.leave = 1e9;   // (he doesn't walk off mid-test)
  H.by(3.5, VAG.yaw + Math.PI);   // (within barkR, nothing else in the bark's reach)
  for (let i = 0; i < 6; i++) { d.barkCd = 0; H.press('bark'); H.run(0.6); if (i % 3 === 2) out.nags.push([VAG.line, VAG.griev, price()]); }
  for (let i = 0; i < 4; i++) {
    H.run(1.5); H.by(2.2, VAG.yaw + Math.PI); d.pounceCD = 0; d.yaw = Math.atan2(VAG.x - d.x, VAG.z - d.z);
    p.bot = { pounce: true }; step(0.025); p.bot = {}; H.run(0.3); out.bonks.push([VAG.line, VAG.griev, price()]);
  }
  VAG.griev = 50; out.cap = price(); out.base = base; out.max = Math.round(base * (1 + T.vag.mood.upMax)); T.vag.leave = L0;
  return out;
});
ok('three barks by him: "Could you shut that dog up?"; again: worse', /shut that dog up/i.test(r7.nags[0][0]) && r7.nags[1][0] !== r7.nags[0][0] && /PLEASE/.test(r7.nags[1][0]), r7.nags);
ok('bonked: a line each, worse each time', r7.bonks.every(b => b[0]) && new Set(r7.bonks.map(b => b[0])).size === 4, r7.bonks);
ok('the first three grievances only warn ("prices go up"); the fourth on: prices up, capped', /prices go up/i.test(r7.nags[0][0]) && r7.nags.concat(r7.bonks).every(([, g, pr]) => g <= 3 ? pr === r7.base : pr > r7.base) && r7.bonks.at(-1)[2] > r7.bonks.at(-2)[2] && r7.cap === r7.max, r7);

// 7b. herding isn't nagging: barks by him with a loose sheep in the bark's reach, or from further off than barkR: no nag
const r7b = await h.page.evaluate(() => {
  const { G, VAG, T } = GAME; H.reset(); H.at(1); const d = G.dogs[0], out = {}, L0 = T.vag.leave; T.vag.leave = 1e9;
  H.by(3.5, VAG.yaw + Math.PI); const s = G.sheep.find(s => !s.dead);
  let n0 = VAG.nags; for (let i = 0; i < 6; i++) { d.barkCd = 0; H.place(s, d.x + 2.5, d.z + 1); s.pen = null; H.press('bark'); H.run(0.6); } out.herding = VAG.nags - n0;
  H.pen(); H.by(T.vag.barkR + 2, VAG.yaw + Math.PI); n0 = VAG.nags; for (let i = 0; i < 6; i++) { d.barkCd = 0; H.press('bark'); H.run(0.6); } out.far = VAG.nags - n0;
  T.vag.leave = L0; return out;
});
ok('barking at loose sheep by him, or from further than barkR, isn\'t a nag', r7b.herding === 0 && r7b.far === 0, r7b);

// 8. good deeds: a stick let go by him (he catches it and throws it: fetch), an apple held out to him, a tug of war: grievances off
// first, then a discount (capped); fetch again too soon counts once
const r8 = await h.page.evaluate(() => {
  const { G, VAG, T, step, spawnBone, APPLES, ROPES, HANK, wareDeal, vagRate } = GAME; H.reset(); H.at(1); const d = G.dogs[0], p = G.players[0], out = {};
  VAG.griev = 5; out.r0 = vagRate();
  const fetch = () => {
    VAG.goodAt = -99; const b = spawnBone(VAG.x + 3, VAG.z, 0, 0, 0, { stick: true }); H.place(d, VAG.x + 3.95, VAG.z, -Math.PI / 2); d.grabLock = false;
    p.bot = { grab: true }; step(0.025); const had = d.holding === b; H.run(0.2); p.bot = {}; step(0.025);
    let caught = false; for (let t = 0; t < 4; t += 0.1) { H.run(0.1); caught ||= VAG.bone === b; }
    return { had, caught, away: +Math.hypot(b.x - VAG.x, b.z - VAG.z).toFixed(1), griev: VAG.griev, good: VAG.good, line: VAG.line };
  };
  out.f1 = fetch(); out.r1 = vagRate();
  const a = APPLES[0]; Object.assign(a, { st: 1, dog: null, h: 0, vx: 0, vz: 0, vy: 0, x: VAG.x + 3, z: VAG.z });
  VAG.goodAt = -99; H.place(d, VAG.x + 3.95, VAG.z, -Math.PI / 2); d.grabLock = false; p.bot = { grab: true }; step(0.025); out.apple = { had: d.holding === a };
  H.place(d, VAG.x + 2.4, VAG.z, -Math.PI / 2); for (let i = 0; i < 20 && a.st === 1; i++) { p.bot = { grab: true }; H.run(0.1); } p.bot = {}; step(0.025);
  Object.assign(out.apple, { eaten: a.st === 2, griev: VAG.griev, good: VAG.good, line: VAG.line });
  // a tug: a rope's end brought to him
  const R = ROPES[1]; GAME.resetRope(R); HANK.x += 500; GAME.vagAt(R.x[0] - 3, R.z[0] + 1); VAG.st = 'pitch'; VAG.ropeAgain = 0; H.place(d, R.x[0] - 1, R.z[0], Math.PI / 2); d.grabLock = false;
  p.bot = { grab: true }; step(0.025); out.tug = { bit: d.holding === R }; let started = false;
  for (let t = 0; t < 12 && !(started && !R.tug); t += 0.25) { p.bot = { grab: true, mx: started ? -1 : 0 }; H.run(0.25); started ||= !!R.tug && VAG.rope === R; }
  p.bot = {}; step(0.025); Object.assign(out.tug, { started, over: !R.tug, griev: VAG.griev, good: VAG.good });
  VAG.griev = 0; VAG.good = 99; out.capped = +vagRate().toFixed(2); out.downMax = T.vag.mood.downMax; VAG.good = 2; out.price2 = wareDeal(H.ware('food')).price;
  return out;
});
ok('fetch: a stick let go by him, he catches it and throws it on', r8.f1.had && r8.f1.caught && r8.f1.away > 3, r8.f1);
ok('an apple held out to him: he eats it', r8.apple.had && r8.apple.eaten, r8.apple);
ok('a tug of war with him: he takes the far end, it\'s played out', r8.tug.bit && r8.tug.started && r8.tug.over, r8.tug);
ok('good deeds work grievances off first, then a discount (capped)', r8.r0 > 1 && r8.f1.griev === 4 && r8.apple.griev === 3 && r8.tug.griev === 2 && r8.capped === +(1 - r8.downMax).toFixed(2), r8);

// 9. grabbed by the coat: dragged a little, screaming; let go: dusts himself off, annoyed (a grievance)
const r9 = await h.page.evaluate(() => {
  const { G, VAG, step } = GAME; H.reset(); H.at(1); const d = G.dogs[0], p = G.players[0], out = { lines: [] };
  H.by(1.6); d.yaw = Math.atan2(VAG.x - d.x, VAG.z - d.z); d.grabLock = false; const x0 = VAG.x, z0 = VAG.z;
  p.bot = { grab: true }; step(0.025); out.held = VAG.heldBy === d && d.holdKind === 'vag';
  for (let i = 0; i < 6; i++) { p.bot = { grab: true, mx: 1 }; H.run(0.5); out.lines.push(VAG.line); }
  out.dragged = +Math.hypot(VAG.x - x0, VAG.z - z0).toFixed(1); p.bot = {}; step(0.025); H.run(0.2);
  Object.assign(out, { free: !VAG.heldBy && !d.holding, after: VAG.line, griev: VAG.griev, annoy: +VAG.annoy.toFixed(1) });
  return out;
});
// (how far: his flailing is a random walk (holdStep's holdWob) that pulls against the dog, or with it: ~6 m to ~13 m in the 3 s)
ok('grabbed: "Ack! Get this mutt off me!", frantic, dragged a little', r9.held && /Ack! Get this mutt off me!/.test(r9.lines[0]) && new Set(r9.lines).size > 1 && r9.dragged > 0.5 && r9.dragged < 14, r9);
ok('let go: he dusts himself off, annoyed; a grievance', r9.free && r9.after && !/Ack/.test(r9.after) && r9.griev === 1 && r9.annoy > 2, r9);

// 10. annoyed past bearing: a spiteful line, his wares packed, off out of sight; gone a day; back at a pitch ahead of the flock, annoyance gone
const r10 = await h.page.evaluate(() => {
  const { G, VAG, T, pathPoint, updateCamera, renderOnce } = GAME; H.reset(); H.at(1); const d = G.dogs[0], out = {};
  H.by(2.2); H.press('bark'); H.run(0.5); out.out0 = VAG.out;
  VAG.annoy = T.vag.leave + 1; H.run(0.1); out.leave = { st: VAG.st, out: VAG.out, line: VAG.line };
  for (let i = 0; i < 60 && VAG.st === 'leave'; i++) H.run(1);
  out.gone = { st: VAG.st, mode: VAG.mode, h: +(VAG.backAt - GAME.absHour()).toFixed(1) };
  const s1 = VAG.pitches[1].s, q = pathPoint(s1 - 90, 0); H.place(d, q.x, q.z); updateCamera(0, true); renderOnce();
  for (const sh of G.sheep) { const p = pathPoint(s1 - 30 + Math.random() * 6, (Math.random() - 0.5) * 8); sh.x = p.x; sh.z = p.z; sh.vx = sh.vz = 0; sh.pen = null; }   // (the flock short of his second pitch)
  H.run(1); out.still = VAG.st; G.clock.day += 1; H.run(0.5);
  const fc = GAME.flockCenter(); out.back = { st: VAG.st, mode: VAG.mode, annoy: VAG.annoy, ahead: VAG.pitches[VAG.pi].s > GAME.sAt(fc.x, fc.z) };
  return out;
});
ok('annoyed past bearing: a spiteful line, his wares packed, off', r10.out0 && r10.leave.st === 'leave' && !r10.leave.out && r10.leave.line, r10);
ok('out of sight: gone for a day', r10.gone.st === 'away' && r10.gone.mode === 'away' && Math.abs(r10.gone.h - 24) < 2 && r10.still === 'away', r10);
ok('back a day later at a pitch ahead of the flock, his annoyance gone', r10.back.st === 'pitch' && r10.back.mode === 'land' && r10.back.annoy === 0 && r10.back.ahead, r10);

// 11. on his way: the flock well past his pitch, he packs up and walks on along the trail (on screen); off screen and behind: he's
// just there. By night he sleeps; a trade press wakes him (grumbling) and he trades; morning: up
const r11 = await h.page.evaluate(() => {
  const { G, VAG, T, pathPoint, sAt, updateCamera, renderOnce } = GAME; H.reset(); const d = G.dogs[0], out = {};
  const mv = s => { for (const sh of G.sheep) { const q = pathPoint(s + Math.random() * 6, (Math.random() - 0.5) * 8); sh.x = q.x; sh.z = q.z; sh.vx = sh.vz = 0; sh.pen = null; } };
  mv(VAG.pitches[0].s - 20); H.at(0); H.place(d, VAG.x + 16, VAG.z + 3); updateCamera(0, true); renderOnce();   // (the flock short of his first pitch, him in view)
  const P0 = VAG.pitches[0], P1 = VAG.pitches[1], x0 = VAG.x, z0 = VAG.z, R0 = T.vag.stayR; mv(P0.s + T.vag.past + 4); T.vag.stayR = 8;   // (the dog watching him: not "by him")
  for (let i = 0; i < 8; i++) { H.place(d, VAG.x + 16, VAG.z + 3); updateCamera(0, true); renderOnce(); mv(P0.s + T.vag.past + 4); H.run(3); }   // (watched: no skipping)
  out.walk = { st: VAG.st, pi: VAG.pi, on: +Math.hypot(VAG.x - x0, VAG.z - z0).toFixed(1), toward: sAt(VAG.x, VAG.z) > sAt(x0, z0) + 10, s: [+sAt(x0, z0).toFixed(0), +sAt(VAG.x, VAG.z).toFixed(0), +P1.s.toFixed(0)] };   // (on along the trail: it winds) T.vag.stayR = R0;
  mv(P1.s + 60); const q = pathPoint(Math.max(10, P0.s - 80), 0); H.place(d, q.x, q.z); updateCamera(0, true); renderOnce(); H.run(0.5);   // (looking well back down the trail)
  out.skip = { st: VAG.st, pi: VAG.pi, at: +Math.hypot(VAG.x - VAG.pitches[VAG.pi].x, VAG.z - VAG.pitches[VAG.pi].z).toFixed(1), ahead: VAG.pitches[VAG.pi].s > P1.s };
  H.at(1); H.place(d, VAG.x + 30, VAG.z); G.clock.hour = 21.5; VAG.wakeT = -99; H.run(1.5); out.night = VAG.st;
  H.by(2.2); H.press('bark'); out.woken = { st: VAG.st, out: VAG.out, line: VAG.line };
  H.place(d, VAG.x + 30, VAG.z); H.run(T.vag.packT + 25); out.again = VAG.st;
  G.clock.hour = 6.5; H.run(0.5); out.morning = VAG.st;
  return out;
});
ok('the flock well past: he packs up and walks on along the trail', r11.walk.st === 'walk' && r11.walk.pi === 1 && r11.walk.on > 10 && r11.walk.toward, r11.walk);
ok('behind and off screen: he\'s at a pitch ahead of the flock', r11.skip.st === 'pitch' && r11.skip.at < 1 && r11.skip.ahead, r11.skip);
ok('by night he sleeps; a trade press wakes him, grumbling, and he trades; packed, back to sleep; morning: up', r11.night === 'sleep' && r11.woken.st === 'pitch' && r11.woken.out && r11.woken.line && r11.again === 'sleep' && r11.morning === 'pitch', r11);

// 12. no Cabo anywhere: the journey's won up the MOUNTAIN PASS (pass-test)
const r12 = await h.page.evaluate(() => ({ cabo: GAME.ALL_WARES.filter(w => w.id === 'cabo').length }));
ok('🏖️ no Cabo for sale', r12.cabo === 0, r12);

// 13. the whole flock penned at the Trading Post, gate shut → the journey goes on; losing them all still ends it
const r13 = await h.page.evaluate(() => {
  const { G, postPen: finalPen, onGateClosed, setGate, killSheep } = GAME; const out = {};
  H.reset(); setGate(finalPen, true); H.run(0.2); H.pen(); H.run(0.5);
  out.inside = G.sheep.filter(s => s.pen === finalPen).length; setGate(finalPen, false); onGateClosed(finalPen); H.run(3); out.mode = G.mode;
  for (const s of G.sheep) if (!s.dead) killSheep(s, 'eaten'); H.run(0.2);
  out.lostMode = G.mode; out.lostTitle = document.getElementById('eTitle').textContent; out.won = document.getElementById('end').classList.contains('won');
  return out;
});
ok('shutting the whole flock in at the Trading Post doesn\'t end the journey', r13.inside > 10 && r13.mode === 'play', r13);
ok('losing the whole flock still ends it', r13.lostMode === 'end' && !/pass/.test(r13.lostTitle) && !r13.won, r13);

// 14. a new journey: a new seed, at his first pitch, packed, in a good mood; his sticks laid again
const r14 = await h.page.evaluate(() => {
  const { VAG, BONES, T } = GAME; const seed = VAG.seed; VAG.griev = 5; VAG.annoy = 9; VAG.out = true;
  GAME.resetGame(); return { mode: GAME.G.mode, hello: GAME.VENDOR.hello, seed: VAG.seed !== seed, pi: VAG.pi, st: VAG.st, out: VAG.out, griev: VAG.griev, annoy: VAG.annoy, sticks: BONES.filter(b => b.stick).length, want: VAG.pitches.length * T.vag.sticks };
});
ok('a new journey: a new seed, at his first pitch, packed, no grudges; sticks by his pitches', r14.mode === 'play' && !r14.hello && r14.seed && r14.pi === 0 && r14.st === 'pitch' && !r14.out && !r14.griev && !r14.annoy && r14.sticks > 0 && r14.sticks <= r14.want, r14);

// 15. SAILING: Cold Harbour: out in the bay in his Laser, round and round clear of her, out of reach (nothing on the quay). Cast off: he
// sails by her (out of reach, clear of her, heeled and the boom out to leeward); near the next island he makes for its beach ahead of her
// and pulls up; alongside, ashore he trades (mats on the island; 🌾 to the deck); by night asleep by his boat, a trade press wakes him. His last island (Gull Rock): cast
// off, a parting word, over the horizon, gone; gone the rest of the voyage; a new journey: back on the land
const r15 = await h.page.evaluate(() => {
  const { G, VAG, T, SEA, seaStart, seaCastOff, vagPress, vagFrame, vagReach, boatXZ, boatU, boatV, BOAT, DECK, kitN, ALL_WARES, vendorBark, seaDist, ROUTE, ISLES, onQuay } = GAME;
  const out = {}, d = G.dogs[0], run = H.run, aboard = () => { const p = boatXZ(-6, 0); H.place(d, p.x, p.z); run(0.3); }, press = () => vagPress(d, { bark: true });
  H.reset(); G.wool = 200; seaStart({ leg: 0 }); run(0.2); GAME.renderOnce();
  const hb = VAG.sea.b; out.harb = { mode: VAG.mode, ph: VAG.sea.ph, frame: vagFrame(), reach: vagReach(), sail: hb.on && hb.beach === 0, quay: onQuay(VAG.x, VAG.z) };
  let bMin = 1e9, bMax = 0, moved = 0, e0 = hb.e, n0b = hb.n; for (let i = 0; i < 60; i++) { run(0.5); const dd = seaDist(hb.e, hb.n); bMin = Math.min(bMin, dd); bMax = Math.max(bMax, dd); moved = Math.max(moved, Math.hypot(hb.e - e0, hb.n - n0b)); }
  out.bay = { ph: VAG.sea.ph, min: Math.round(bMin), max: Math.round(bMax), moved: Math.round(moved) };
  aboard(); out.trade = press(); out.mats = VAG.out;
  seaCastOff(true); run(0.2); out.cast = { ph: VAG.sea.ph, out: VAG.out, line: VAG.line };
  run(8); const b = VAG.sea.b; out.sail = { ph: VAG.sea.ph, frame: vagFrame(), reach: vagReach(), press: press() };
  let minD = 1e9, n = 0, lee = 0;
  for (let i = 0; i < 40; i++) { run(0.5); minD = Math.min(minD, seaDist(b.e, b.n)); if (VAG.sea.ph === 'sail' && Math.abs(b.heel) > 0.1) { n++; if (Math.sign(b.heel) === -b.ws && Math.sign(b.boom) === -b.ws) lee++; } }
  out.by = { minD: Math.round(minD), n, lee, far: Math.round(seaDist(b.e, b.n)) };
  const w1 = ROUTE[1]; SEA.e = w1.e - Math.sin(w1.crs) * 260; SEA.n = w1.n - Math.cos(w1.crs) * 260; SEA.hdg = SEA.pilot = w1.crs; SEA.u = 4;   // (260 m short of Seal Skerry)
  let first = null; for (let i = 0; i < 90 && !(SEA.docked && VAG.sea.ph === 'ashore'); i++) { run(1); if (!first && VAG.sea.ph === 'ashore') first = { docked: SEA.docked, i: VAG.sea.i }; }
  out.isle = { first, docked: SEA.docked, berth: SEA.berth, ph: VAG.sea.ph, i: VAG.sea.i, reach: vagReach(), beach: VAG.sea.b.beach, sand: ISLES[1].sdf(boatU(VAG.x, VAG.z), boatV(VAG.x, VAG.z)) };
  H.by(2.2); out.isleTrade = press(); run(1.5); out.isleMats = VAG.out && ALL_WARES.every(w => ISLES[1].sdf(boatU(w.x, w.z), boatV(w.x, w.z)) > 1);
  const w = ALL_WARES.find(w => w.id === 'food'), n0 = kitN(DECK, 'food'); H.place(d, w.x, w.z); out.buy = [vendorBark(d), kitN(DECK, 'food') - n0];
  H.place(d, BOAT.x, BOAT.z); run(T.vag.packT + 2); G.clock.hour = 22; run(20);
  out.night = { st: VAG.st, byBoat: Math.hypot(VAG.x - VAG.sea.sites[1].lx, VAG.z - VAG.sea.sites[1].lz) < 4 }; H.by(2.2); out.woken = press() && VAG.st === 'pitch' && VAG.out;
  G.clock.hour = 10; seaStart({ leg: 2 }); run(0.5); out.last = { ph: VAG.sea.ph, i: VAG.sea.i, reach: vagReach() };
  aboard(); seaCastOff(true); run(0.3); out.bye = VAG.line;
  for (let i = 0; i < 150 && VAG.st !== 'off'; i++) run(1);
  out.gone = VAG.st;
  for (const [leg, under] of [[2, true], [3, false], [3, true], [4, true]]) { seaStart({ leg, under }); run(0.3); GAME.renderOnce(); out['g' + leg + (under ? 'u' : '')] = VAG.st; }   // (drawn too: gone, no site to stand on)
  GAME.resetGame(); run(0.1); out.reset = { mode: VAG.mode, sea: VAG.sea, st: VAG.st };
  return out;
});
ok(`Cold Harbour: out in the bay in his Laser (${r15.bay.min}–${r15.bay.max} m off her, ${r15.bay.moved} m about), not on the quay, out of reach: no trade`, r15.harb.mode === 'sea' && r15.harb.ph === 'bay' && r15.harb.frame === 'boat' && !r15.harb.reach && r15.harb.sail && !r15.harb.quay && r15.bay.ph === 'bay' && r15.bay.min > 12 && r15.bay.max < 40 && r15.bay.moved > 8 && !r15.trade && !r15.mats, r15);
ok('cast off: he sails by her, out of reach', r15.cast.ph === 'sail' && !r15.cast.out && r15.cast.line && r15.sail.ph === 'sail' && r15.sail.frame === 'boat' && !r15.sail.reach && !r15.sail.press, r15);
ok('under way: clear of her, in sight; heeled and the boom out to leeward', r15.by.minD > 15 && r15.by.far < 120 && r15.by.n > 10 && r15.by.lee === r15.by.n, r15.by);
ok('the next island: his Laser pulled up its beach before she\'s alongside; ashore with the dogs, he trades on the island; 🌾 goes to the deck', r15.isle.first && !r15.isle.first.docked && r15.isle.first.i === 1 && r15.isle.docked && r15.isle.berth === 1 && r15.isle.ph === 'ashore' && r15.isle.reach && r15.isle.beach === 1 && r15.isle.sand > 0 && r15.isleTrade && r15.isleMats && r15.buy[0] === 'add' && r15.buy[1] === 1, { ...r15.isle, buy: r15.buy });
ok('by night: asleep by his boat; a trade press wakes him and he trades', r15.night.st === 'sleep' && r15.night.byBoat && r15.woken, r15.night);
ok('his last island: cast off, a parting word, over the horizon, gone; gone the rest of the voyage; a new journey: on the land', r15.last.i === 2 && r15.last.reach && /back|home|out there/i.test(r15.bye) && r15.gone === 'off' && r15.g2u === 'off' && r15.g3 === 'off' && r15.g3u === 'off' && r15.g4u === 'off' && r15.reset.mode === 'land' && r15.reset.sea === null && r15.reset.st === 'pitch', r15);

ok('no page errors', h.errors.length === 0, h.errors.slice(0, 5));
console.log(fails ? `${fails} FAILED` : 'all ok');
await h.close();
process.exit(fails ? 1 : 0);
