// Headless checks for pen water: `node tools/water-test.mjs`. Prints ok/FAIL per check, exits 1 on a failure.
// Every pen has a water trough and a bucket; a bot dog holding grab picks a bucket up (one each), fills it at the river and
// by swimming, and tips it in from outside the fence; letting go of grab sets it down; penned thirsty sheep
// drink till quenched, three at a time, shoving (a ram barges lambs off); parched sheep slow, then die of thirst
// (tombstone, stats, eulogy); fillWater / drinkWater; swimming sheep drink; the thirsty-flock warning.
import { open } from './harness.mjs';
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${info === undefined ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const h = await open({ query: '?sim' });
await h.page.evaluate(() => {
  const { G, step, startGame, resetGame } = GAME;
  startGame({ kind: 'bot', index: 0 });
  const H = window.H = {};
  H.p = G.players[0]; H.d = () => G.dogs[0];
  H.to = (dx, dz, extra = {}) => { const R = GAME.CAM_R, F = GAME.CAM_F, l = Math.hypot(dx, dz) || 1; return Object.assign({ mx: (dx * R.x + dz * R.z) / l, my: -(dx * F.x + dz * F.z) / l }, H.g ? { grab: true } : {}, extra); };
  H.idle = () => { H.p.bot = H.g ? { grab: true } : {}; };   // H.g: grab held (carrying a bucket)
  H.reset = (hour = 10) => { resetGame(); G.clock.hour = hour; for (const c of G.coyotes) GAME.scene.remove(c.models.root); G.coyotes.length = 0; G.packs.length = 0; for (const c of G.coyotes) c.gone = true; H.p.bot = {}; H.g = false; };
  H.place = (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = GAME.groundY(x, z); };
  H.run = (sec, fn) => { let t = 0; for (; t < sec; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return t; };
  H.r = v => Math.round(v * 100) / 100;
  H.walkTo = (x, z, sec = 30, r = 0.8, extra = {}) => { const d = H.d(); const t = H.run(sec, () => { const dx = x - d.x, dz = z - d.z; if (Math.hypot(dx, dz) < r) return true; H.p.bot = H.to(dx, dz, extra); }); H.idle(); return t; };
  H.penSheep = (pen, n) => { const S = G.sheep.slice(0, n ?? G.sheep.length); for (const s of S) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (pen.R - 2.5); H.place(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); } return S; };
  H.atRiver = (al, ac) => { const R = GAME.RIVER; return { x: R.x + R.nx * al + R.tx * ac, z: R.z + R.nz * al + R.tz * ac }; };
  H.outside = (p, o, r) => { const a = Math.atan2(o.z - p.z, o.x - p.x); return { x: p.x + Math.cos(a) * (p.R + r), z: p.z + Math.sin(a) * (p.R + r) }; };
  H.avg = (L, f) => L.length ? H.r(L.reduce((a, s) => a + f(s), 0) / L.length) : 0;
});

// 1. every pen: a water trough at the back, room outside it, a bucket on open ground beside it; the first camp's starts full
const r1 = await h.page.evaluate(() => {
  const { pens, BUCKETS, T, sdfAt, troughSpots } = GAME; H.reset();
  return pens.map((p, i) => {
    const b = BUCKETS[i], o = H.outside(p, p.water, 0.6); troughSpots(p);
    return { camp: p.camp.name, w: p.water.w, cap: p.water.cap, spots: p.waterSpots.length, roomOutside: H.r(sdfAt(o.x, o.z)), bucket: b && b.pen === p ? H.r(sdfAt(b.x, b.z)) : null, bucketFromTrough: b ? H.r(Math.hypot(b.x - p.water.x, b.z - p.water.z)) : null };
  });
});
ok(`a water trough in every pen (${r1.length})`, r1.every(c => c.cap === 12 && c.spots >= 3), r1.map(c => c.spots));
ok('open ground outside each trough', r1.every(c => c.roomOutside > 0.6), r1.map(c => c.roomOutside));
ok('a bucket on open ground by each', r1.every(c => c.bucket > 1 && c.bucketFromTrough < 4), r1.map(c => [c.bucket, c.bucketFromTrough]));
ok('first camp full, the rest empty', r1[0].w === r1[0].cap && r1.slice(1).every(c => c.w === 0), r1.map(c => c.w));

// 2. running over it does nothing; holding grab picks it up (one per dog), fill at the river bank, tip in over the fence
const r2 = await h.page.evaluate(() => {
  const { G, T, pens, BUCKETS, WATER, bucketOf } = GAME; H.reset(11); const d = H.d(), pen = pens[1], b = BUCKETS[1], out = {};
  H.place(d, b.x + 6, b.z); H.walkTo(b.x, b.z, 10, 0.3); H.run(0.1); out.notWithoutGrab = !bucketOf(d);
  H.g = true; H.idle(); H.run(0.2);
  out.picked = bucketOf(d) === b;
  const b2 = BUCKETS[2], x2 = b2.x, z2 = b2.z; H.place(b2, d.x + 0.5, d.z); H.run(0.2); out.secondLeft = !b2.by && bucketOf(d) === b; H.place(b2, x2, z2);
  // to the river (100 m up the trail), straight at the water
  const bank = H.atRiver(-15, -12), into = H.atRiver(-15, 0);
  out.toRiver = H.r(H.walkTo(bank.x, bank.z, 40, 1.5));
  out.fillSecs = H.r(H.run(6, () => { if (b.w >= T.water.bucket - 0.01) return true; H.p.bot = H.to(into.x - d.x, into.z - d.z); }));
  H.idle(); out.full = b.w; out.dry = !d.air;
  // back to the pen, up to the fence behind its water trough
  const o3 = H.outside(pen, pen.water, 3), o0 = H.outside(pen, pen.water, 0.45);
  out.back = H.r(H.walkTo(o3.x, o3.z, 40, 1));
  H.walkTo(o0.x, o0.z, 8, 0.3); H.run(0.2);
  out.trough = H.r(pen.water.w); out.keptEmpty = bucketOf(d) === b && b.w === 0; out.tips = WATER.tips;
  return out;
});
ok('running over a bucket without grab leaves it; holding grab picks it up', r2.notWithoutGrab && r2.picked, r2);
ok('one bucket per dog', r2.secondLeft, r2);
ok(`wading in at the river bank fills it (${r2.fillSecs} s)`, r2.full === 6 && r2.fillSecs < 3 && r2.dry, r2);
ok('going up to the water trough from outside tips it in', r2.trough === 6 && r2.tips === 1, r2);
ok('empty: still in its mouth for the next trip', r2.keptEmpty, r2);

// 3. swimming fills it too; tipping from inside the pen; barking and pouncing with it; no grabbing a sheep (mouth full)
const r3 = await h.page.evaluate(() => {
  const { G, T, pens, BUCKETS, bucketOf, RIVER } = GAME; H.reset(11); const d = H.d(), b = BUCKETS[1], out = {};
  H.g = true; H.idle(); b.by = d; b.w = 0;
  const mid = H.atRiver(-20, 0); H.place(d, mid.x, mid.z); d.air = { swim: true, kind: 'swim', t: 0, h: -3, vy: 0, spin: 0 };
  H.run(0.2); out.swimFull = b.w; out.swimming = !!(d.air && d.air.swim);
  H.run(20, () => !d.air);
  const pen = pens[2]; H.place(d, pen.x, pen.z); const w0 = pen.water.w;
  H.walkTo(pen.water.x + (pen.x - pen.water.x) * 0.2, pen.water.z + (pen.z - pen.water.z) * 0.2, 10, 0.4); H.run(0.2);
  out.inside = H.r(pen.water.w - w0); out.carrying = !!bucketOf(d);
  b.by = d; b.w = 3; H.place(d, pen.exitX + 6, pen.exitZ + 6);
  H.p.bot = { bark: true, grab: true }; H.run(0.1); H.p.bot = { pounce: true, mx: 1, grab: true }; H.run(0.5); H.idle();
  out.afterMoves = bucketOf(d) === b && b.w === 3;
  const s = G.sheep.find(o => !o.ram && !o.lamb); H.place(s, d.x + Math.sin(d.yaw) * 1.2, d.z + Math.cos(d.yaw) * 1.2);
  H.run(0.5); out.grabbed = d.holding === s;
  out.afterGrab = bucketOf(d) === b && b.w === 3;
  // the sea by Oceanside: from the camp straight to the nearest water
  const c = GAME.CAMPS[2]; let sea = null, sd = 1e9;
  for (let lat = 0; lat < 100; lat++) for (let ds = -60; ds <= 60; ds += 3) { const q = GAME.pathPoint(c.s + ds, lat); if (GAME.wetAt(q.x, q.z)) { const dd = Math.hypot(q.x - c.x, q.z - c.z); if (dd < sd) { sd = dd; sea = q; } } }
  b.w = 0; H.place(d, c.x + Math.cos(c.gateA) * (c.R + 5), c.z + Math.sin(c.gateA) * (c.R + 5));
  out.seaSecs = H.r(H.run(30, () => { if (b.w > 0) return true; H.p.bot = H.to(sea.x - d.x, sea.z - d.z); })); H.idle(); out.sea = b.w; out.seaFromCamp = Math.round(sd);
  return out;
});
ok('swimming fills it', r3.swimFull === 6, r3);
ok(`so does the sea by Oceanside Camp (${r3.seaFromCamp} m off)`, r3.sea === 6 && r3.seaSecs < 10, r3);
ok('tipping from inside the pen', r3.inside === 6, r3);
// 3a. the later legs: the shore is past the trail's edge; a dog against it still fills
const r3a = await h.page.evaluate(() => {
  const { swimSdfAt, T, inRiver, pathPoint, PATH_LEN, dogAtWater } = GAME; const bins = {};
  for (let s = 0; s < PATH_LEN; s += 2) for (let lat = -130; lat <= 130; lat += 0.5) {
    const q = pathPoint(s, lat); if (inRiver(q.x, q.z) || swimSdfAt(q.x, q.z) < T.dogR + 0.05) continue;
    if (dogAtWater({ x: q.x, z: q.z, yaw: 0 })) { const b = Math.floor(s / 100); bins[b] = (bins[b] || 0) + 1; }
  }
  return bins;
});
ok('shore reachable on the later legs (700-900 m)', r3a[7] > 10 && r3a[8] > 10, r3a);
ok('barking and pouncing with a bucket; no grabbing a sheep with it', r3.afterMoves && !r3.grabbed && r3.afterGrab, r3);

// 3b. let go of grab: set down where it stands, water and all; hold grab on it again: back in its mouth, water still in
const r3b = await h.page.evaluate(() => {
  const { BUCKETS, bucketOf } = GAME; H.reset(); const d = H.d(), b = BUCKETS[1], out = {};
  H.place(d, b.x, b.z); H.g = true; H.idle(); H.run(0.3); out.picked = bucketOf(d) === b; b.w = 3;
  H.run(1); out.heldKept = bucketOf(d) === b;
  H.g = false; H.idle(); H.run(0.1); out.dropped = !b.by && b.w === 3 && Math.hypot(b.x - d.x, b.z - d.z) < 0.5;
  H.run(1); out.stillDown = !b.by;
  H.g = true; H.idle(); H.run(0.2); out.repicked = bucketOf(d) === b && b.w === 3;
  return out;
});
ok('let go of grab: set down (water kept); hold grab on it: picked up again', r3b.picked && r3b.heldKept && r3b.dropped && r3b.stillDown && r3b.repicked, r3b);

// 3c. a lying bucket: running into it shoves it along (not picked up without grab); a pounce sends it flying, spilling
const r3c = await h.page.evaluate(() => {
  const { BUCKETS, bucketOf } = GAME; H.reset(); const d = H.d(), b = BUCKETS[1], out = {};
  b.w = 4; const x0 = b.x, z0 = b.z;
  H.place(d, b.x - 6, b.z); H.walkTo(b.x + 4, b.z, 4, 0.4, { sprint: true }); H.run(1);
  out.pushed = H.r(Math.hypot(b.x - x0, b.z - z0)); out.notPicked = !bucketOf(d);
  const x1 = b.x, z1 = b.z, w1 = b.w; H.place(d, b.x - 3, b.z); d.yaw = Math.atan2(b.x - d.x, b.z - d.z);
  let maxH = 0; H.p.bot = H.to(1, 0, { pounce: true }); H.run(0.1); H.p.bot = {}; H.run(3, () => { maxH = Math.max(maxH, b.h || 0); });
  out.flew = H.r(Math.hypot(b.x - x1, b.z - z1)); out.maxH = H.r(maxH); out.spilt = b.w < w1; out.landed = b.h === 0;
  H.g = true; H.walkTo(b.x, b.z, 10, 0.3); H.run(0.3); out.pickable = bucketOf(d) === b;
  return out;
});
ok('running into a bucket shoves it; a pounce sends it flying (spilling); then it can be picked up', r3c.pushed > 1.5 && r3c.notPicked && r3c.flew > 5 && r3c.maxH > 0.8 && r3c.spilt && r3c.landed && r3c.pickable, r3c);

// 4. penned, thirsty, water in the trough: they drink till quenched, three at a time, the rest waiting and shoving
const r4 = await h.page.evaluate(() => {
  const { G, T, pens } = GAME; H.reset(14); const pen = pens[1]; GAME.setGate(pen, false);
  H.penSheep(pen); for (const s of G.sheep) { s.thirst = 0.8; s.hunger = 0.1; s.salt = 1; } pen.water.w = pen.water.cap; H.place(H.d(), pen.exitX + 8, pen.exitZ + 8);
  const sh0 = G.shoves || 0; let maxAt = 0, maxWait = 0;
  const secs = H.run(120, () => { const L = G.sheep.filter(s => !s.dead); maxAt = Math.max(maxAt, L.filter(s => s.atWater).length); maxWait = Math.max(maxWait, L.filter(s => s.state === 'wait').length); return L.every(s => s.thirst <= T.water.want); });
  const L = G.sheep.filter(s => !s.dead);
  return { secs: H.r(secs), hours: H.r(secs / T.hourSec), thirst: H.avg(L, s => s.thirst), quenched: L.filter(s => s.thirst <= T.water.want).length + '/' + L.length, left: H.r(pen.water.w), maxDrinkingAtOnce: maxAt, maxWaiting: maxWait, shoves: (G.shoves || 0) - sh0 };
});
ok(`penned sheep drink till quenched (${r4.secs} s)`, r4.quenched.split('/')[0] === r4.quenched.split('/')[1] && r4.left < 12 && r4.left > 0, r4);
ok('a few at a time, the rest waiting and shoving', r4.maxDrinkingAtOnce === 3 && r4.maxWaiting >= 3 && r4.shoves > 0, r4);

// 5. trough mayhem: lambs at every place, a thirsty ram barges one off
const r5 = await h.page.evaluate(() => {
  const { G, T, pens, makeSheep, troughSpots } = GAME; H.reset(14); const pen = pens[1]; GAME.setGate(pen, false); troughSpots(pen);
  for (const s of G.sheep) H.place(s, pen.exitX + 30, pen.exitZ + 30);
  const lambs = pen.waterSpots.map(q => { const l = makeSheep(q.x, q.z, { lamb: true, hunger: 0.1 }); l.thirst = 0.95; l.salt = 1; G.sheep.push(l); return l; });
  pen.water.w = pen.water.cap;
  H.run(4, () => { for (const l of lambs) l.thirst = Math.max(l.thirst, 0.9); pen.water.w = pen.water.cap; }); const full = lambs.filter(l => l.state === 'drink').length;
  const ram = G.sheep.find(s => s.ram); H.place(ram, pen.x, pen.z); ram.hunger = 0.1; ram.salt = 1;
  const sh0 = G.shoves || 0; ram.thirst = 0.9; let at = -1;
  const states = [];
  H.run(20, t => { if (ram.state === 'drink' && ram.atWater) { at = t; return true; } for (const l of lambs) l.thirst = Math.max(l.thirst, 0.9); pen.water.w = pen.water.cap; if (states.at(-1) !== ram.state) states.push(ram.state); });
  return { lambsDrinking: full, ramDrinkingAfter: H.r(at), shoves: (G.shoves || 0) - sh0, lambsLeft: lambs.filter(l => l.state === 'drink').length, ram: states.join(' ') };
});
ok('a thirsty ram barges a lamb off the water trough', r5.lambsDrinking === 3 && r5.ramDrinkingAfter >= 0 && r5.shoves >= 1 && r5.lambsLeft < 3, r5);

// 6. thirst: days to parched, the slowdown, and dying of it (tombstone, stats, the dawn report)
const r6 = await h.page.evaluate(() => {
  const { G, T, pens, thirstPep, CAMPS } = GAME; H.reset(10); const out = {}, ch = T.cougar.chance; T.cougar.chance = 0;
  out.daysToParched = T.water.start.map(v => H.r((1 - v) / T.water.perDay));
  const s = G.sheep[2]; out.speed = [0, 0.7, 0.85, 1].map(v => { s.thirst = v; return H.r(thirstPep(s)); });
  for (const p of pens) p.water.w = 0;
  const c = CAMPS[1]; for (const o of G.sheep) { H.place(o, c.x + 30 + Math.random() * 6, c.z + Math.random() * 6); o.thirst = 1; o.hunger = 0; o.salt = 1; }
  const n0 = G.sheep.length; let first = null;
  for (let k = 0; k < 3 * 24 * 10 / 0.5 && G.clock.day < 5 && G.sheep.length; k++) {
    for (const o of G.sheep) if (!o.dead) { o.hunger = 0; o.salt = 1; }
    for (let i = 0; i < 20; i++) GAME.step(0.025);
    if (first === null && G.stats.thirst) first = H.r((G.clock.day - 1) * 24 + G.clock.hour - 10);
  }
  T.cougar.chance = ch;
  out.firstDeathAfterHours = first; out.deathHours = T.water.deathHours; out.died = G.stats.thirst + '/' + n0; out.other = G.lost.filter(m => m.why !== 'thirst').map(m => m.why); out.left = G.sheep.length;
  out.graves = G.graves.filter(g => g.why === 'thirst').length; out.lost = G.lost.filter(m => m.why === 'thirst').length;
  const m = G.lost.find(x => x.why === 'thirst'); out.eulogy = m ? GAME.eulogy(m) : null;
  out.dawn = G.dawnReport && G.dawnReport.dead.filter(x => x.why === 'thirst').length;
  out.memorial = GAME.FLOCK.memorial.filter(x => x.why === 'thirst').length;
  return out;
});
ok(`a few days to parched from the start (${r6.daysToParched.join('-')})`, r6.daysToParched[0] >= 3 && r6.daysToParched[1] <= 4, r6);
ok('parched sheep slow down', r6.speed[0] === 1 && r6.speed[1] === 1 && r6.speed[2] < 1 && r6.speed[3] === 0.75, r6.speed);
ok(`parched too long: they die of thirst (first after ${r6.firstDeathAfterHours} h)`, r6.firstDeathAfterHours >= r6.deathHours[0] && r6.firstDeathAfterHours <= r6.deathHours[1] + 1 && r6.left === 0 && +r6.died.split('/')[0] + r6.other.length === +r6.died.split('/')[1] && r6.other.every(w => w === 'eaten'), r6);
ok('…each with a named tombstone, a eulogy and a dawn report line', r6.graves > 0 && r6.graves === r6.lost && /trough ran dry|cool water/.test(r6.eulogy || '') && r6.dawn > 0 && r6.memorial > 0, r6);

// 7. the hooks: fillWater (capped) and drinkWater; swimming sheep drink; the thirsty-flock warning
const r7 = await h.page.evaluate(() => {
  const { G, T, pens, fillWater, drinkWater, WATER, HANK } = GAME; H.reset(10); const p = pens[2], out = {};
  p.water.w = 0; out.fill5 = fillWater(p, 5); out.fillMore = fillWater(p, 100); out.level = p.water.w; out.fillFull = fillWater(p, 1); out.bad = fillWater(p, -2) + fillWater(null, 3);
  out.drink2 = drinkWater(p, 2); out.drinkAll = drinkWater(p, 100); out.empty = p.water.w;
  const s = G.sheep.find(o => !o.ram), mid = H.atRiver(-20, 0); H.place(s, mid.x, mid.z); s.thirst = 0.8; s.air = { kind: 'swim', t: 0, h: -3, vy: 0, spin: 0 };
  H.run(2); out.swimThirst = H.r(s.thirst);
  // a thirsty flock out on the grass, no water where they are: warned once a day
  H.reset(10); for (const p2 of pens) p2.water.w = 0; for (const o of G.sheep) o.thirst = 0.7;
  H.run(1); out.warned = WATER.warnDay === G.clock.day && WATER.hankSaid; const said = WATER.hankSaid;
  out.hud = document.getElementById('hWater').textContent;
  return out;
});
ok('fillWater adds, capped, and returns what went in', r7.fill5 === 5 && r7.fillMore === 7 && r7.level === 12 && r7.fillFull === 0 && r7.bad === 0, r7);
ok('drinkWater takes what there is', r7.drink2 === 2 && r7.drinkAll === 10 && r7.empty === 0, r7);
ok('a swimming sheep drinks', r7.swimThirst < 0.8, r7);
ok('a thirsty flock: warned (Hank too)', r7.warned, r7);

ok('no page errors', h.errors.length === 0, h.errors.slice(0, 5));
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
