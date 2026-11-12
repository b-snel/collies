// Headless test: `node tools/pass-test.mjs [layout|cold|fire|hank|blizzard|ice|crev|goat|yeti|rock|side|burn|finish]`. MOUNTAIN PASS.
//   layout    past the Trading Post (no longer the end, no Cabo) the trail climbs: the floor rises, walls close in; fire camps level;
//             ice, cracks; a way up to the yeti's cave (iced shut); the hidden side trail to its ledge by the rock wall; nothing else up there
//   cold      in the pass a shorn sheep gets colder than a full fleece, snow on it colder still; out of the pass it thaws; frozen too long: dead
//   fire      Hank lights the fire camp the flock's at; the coldest take the places round it and warm up
//   hank      the fire before anything: lit before a patient's seen to; no burials up here; the next fire up, not one left behind;
//             asleep by one burning low: up to stoke it
//   blizzard  a blizzard piles snow on them; running shakes it off; a fire melts it
//   ice       onto the ice: a sheep, a dog, Hank slide downhill and stop; a calm sheep goes round
//   crev      a sheep in a crack: grabbed out; a dog alone: mashing pounce climbs out; with a friend: mashing won't, the friend grabs it out
//   goat      a goat comes down, bonks a sheep down the mountain (it rolls on); a bark sends one home; a pounce bonks one
//   yeti      he wakes at the top; snowballs roll, grow and bowl a dog over; too close: a headbutt; burning sheep bonked into him ×3: beaten
//   rock      three sheep flung into the rock wall up the side trail: it falls on him (an arm sticks out), his cave thaws
//   side      the side trail is a road (≥5 m across all the way, no way onto its ledge but up it); a dog walking behind 5 sheep (the
//             rest left below) drives them off the floor, up it and onto the ledge
//   burn      a sheep carried into a fire: alight, too hot to hold, runs mad, rolls it out, singed
//   finish    the yeti beaten: the ice goes from the gap in the east rim; the cave's a pen; through the gap and onto the harbour road: Cold Harbour wakes, nobody moved (SAILING)
import { open } from './harness.mjs';
const only = process.argv[2];
const h = await open();
let fail = 0;
const ok = (name, cond, info) => { if (!cond) fail++; console.log(cond ? 'ok  ' : 'FAIL', name, cond ? '' : JSON.stringify(info)); };
const ev = (f, a) => h.page.evaluate(f, a);
// a fresh journey; the flock and the dog dropped at s along the trail, by day; goats, blizzards and the yeti off unless asked
await ev(() => {
  window.T_ = GAME.T;
  window.setup = (s, o = {}) => {
    const { G, T, startGame, resetGame, pathPoint, living, PASS, GOATS, HANK } = GAME;
    if (G.mode === 'title') startGame({ kind: 'bot', index: 0 }); else resetGame();
    while (G.players.length > 1) GAME.dropPlayer(G.players[G.players.length - 1]);
    G.players[0].bot = {}; T.falcon.on = false; T.cast.on = false;
    PASS.goatNext = o.goats ? 0.5 : 1e9; PASS.blizz.next = o.blizz ? 0 : 1e9;
    if (!o.yeti) GAME.YETI.state = 'dead', GAME.YETI.beaten = false;
    const p = pathPoint(s, o.lat ?? 0), L = living();
    L.forEach((sh, i) => { sh.x = p.x + (i % 4) * 1.5 - 2.2; sh.z = p.z + Math.floor(i / 4) * 1.5 - 2.2; sh.vx = sh.vz = 0; sh.pen = null; sh.hunger = 0.2; sh.thirst = 0.1; sh.cold = 0; sh.snow = 0; });
    const d = G.dogs[0], q = pathPoint(o.dogS ?? s - 10, o.dogLat ?? 0); d.x = q.x; d.z = q.z; d.vx = d.vz = 0;
    const hq = pathPoint(o.hankS ?? s - 14, 3); HANK.x = hq.x; HANK.z = hq.z; HANK.goal = null;
    G.clock.hour = o.hour ?? 10; G.clock.day = 2;
    return L.length;
  };
  window.run = (sec, until) => { const { step } = GAME; for (let t = 0; t < sec; t += 0.025) { step(0.025); if (until && until()) return t; } return -1; };
  // screen-space stick toward world direction (dx, dz)
  window.toward = (dx, dz, extra = {}) => { const { CAM_R, CAM_F } = GAME, l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; return { mx: dx * CAM_R.x + dz * CAM_R.z, my: -(dx * CAM_F.x + dz * CAM_F.z), ...extra }; };
});

if (!only || only === 'layout') {
  const r = await ev(() => {
    const { T, PASS, ICES, CREVS, SIDE, POST, FINAL, CAMPS, pens, MARKET, liftAt, sdfAt, pathPoint, findPath, terrainH, sAt, passK, PATH_LEN, DENS, NESTS, PLANTS, SALT_ROCKS, BRAMBLES, DIGS, SNAKES, GROVES, APPLE_TREES, GOATS, YETI, ROCK } = GAME;
    const P = T.pass, inP = list => list.filter(o => passK(sAt(o.x, o.z)) > 0.3).length;
    const free = s => { let f = 0; for (let l = -40; l <= 40; l += 0.5) { const p = pathPoint(s, l); if (sdfAt(p.x, p.z) > 0) f += 0.5; } return f; };
    const fp = PASS.fires.map(f => { let mx = 0; for (let a = 0; a < 6.3; a += 0.5) mx = Math.max(mx, Math.abs(terrainH(f.x + Math.cos(a) * 4, f.z + Math.sin(a) * 4) - terrainH(f.x, f.z))); return { lvl: +mx.toFixed(2), sdf: +sdfAt(f.x, f.z).toFixed(1) }; });
    const cave = pens.find(p => p.final), post = pens.find(p => p.camp.post), a = { x: post.exitX, z: post.exitZ };
    const path = findPath(a.x, a.z, cave.exitX, cave.exitZ, 400000), sp = SIDE.pts[0], side = findPath(pathPoint(SIDE.s0 - 8, 0).x, pathPoint(SIDE.s0 - 8, 0).z, SIDE.ledge.x, SIDE.ledge.z, 100000);
    return { post: POST.s, fin: FINAL.s, len: PATH_LEN, postFinal: !!post.final, caveFinal: !!cave.final, frozen: !!cave.frozen, market: MARKET.s > POST.s && MARKET.wares.every(w => w.id !== 'cabo'),
      lift: [P.s0, 1250, 1350, P.top, FINAL.s].map(s => +liftAt(s).toFixed(1)), freeLow: free(1100), freePass: Math.max(...[1220, 1320, 1420].map(free)), fires: fp,
      ices: ICES.length, crevs: CREVS.length, goats: GOATS.length, path: !!(path && path.length), side: !!(side && side.length), ledge: +sdfAt(SIDE.ledge.x, SIDE.ledge.z).toFixed(1),
      wall: Math.max(...[8, 12, 16].map(o => { const p = pathPoint(1300, -(P.hwW + o)); return terrainH(p.x, p.z) - liftAt(1300); })),
      rock: ROCK.state, yeti: YETI.state, inPass: { dens: inP(DENS), nests: inP(NESTS), plants: inP(PLANTS), salt: inP(SALT_ROCKS), brambles: inP(BRAMBLES), digs: inP(DIGS), snakes: inP(SNAKES), apples: inP(APPLE_TREES), groves: GROVES.filter(g => passK(g.s) > 0.3).length } };
  });
  ok(`the Trading Post (${r.post}) is a camp, not the end; its market sells no Cabo`, !r.postFinal && r.market, r);
  ok(`the yeti's cave (${r.fin.toFixed(0)}) is the end: its pen iced shut`, r.caveFinal && r.frozen, r);
  ok(`the floor climbs ${r.lift.join(' → ')} m`, r.lift[0] < 1 && r.lift[1] > 8 && r.lift[2] > r.lift[1] && r.lift[3] > 38 && Math.abs(r.lift[4] - r.lift[3]) < 1, r);
  ok(`the pass is narrower (${r.freePass} m) than the desert below (${r.freeLow} m); walls up the west side (${r.wall.toFixed(1)} m)`, r.freePass < r.freeLow && r.freePass < 34 && r.wall > 10, r);
  ok(`${r.fires.length} fire camps, level and clear`, r.fires.length === 3 && r.fires.every(f => f.lvl < 0.6 && f.sdf > 2), r.fires);
  ok(`${r.ices} ice patches, ${r.crevs} cracks, ${r.goats} goats`, r.ices >= 8 && r.crevs >= 5 && r.goats >= 9, r);
  ok('a way from the Trading Post up to the cave; the hidden side trail up to its ledge', r.path && r.side && r.ledge > 1, r);
  ok('the rock wall stands, the yeti sleeps', r.rock === 'stand' && r.yeti === 'sleep', r);
  ok('nothing else up there (dens, nests, plants, salt, brambles, digs, snakes, apples, groves)', Object.values(r.inPass).every(v => v === 0), r.inPass);
}

if (!only || only === 'cold') {
  const r = await ev(() => {
    const { G, T, living, step, killSheep } = GAME;
    setup(1300, { hour: 23 });
    const L = living().filter(s => !s.lamb), a = L[0], b = L[1], c = L[2];
    a.wool = 1; b.wool = 0.05; c.wool = 0.05; c.snow = 1;
    for (const s of [a, b, c]) s.cold = 0;
    run(15);
    const out = { full: +a.cold.toFixed(3), shorn: +b.cold.toFixed(3), snowy: +c.cold.toFixed(3) };
    setup(1050, { hour: 12 }); const d = living()[0]; d.cold = 0.8; run(20); out.thaw = +d.cold.toFixed(2);
    setup(1300, { hour: 23 }); const e = living().filter(s => !s.lamb)[0]; e.wool = 0; e.cold = 1; e.freeze = 0; e.freezeMax = 0.5; const lost = G.stats.cold || 0; run(20, () => e.dead); out.frozen = e.dead && (G.stats.cold || 0) === lost + 1;
    return out;
  });
  ok(`a night in the pass: full fleece ${r.full} < shorn ${r.shorn} < shorn and snowed on ${r.snowy}`, r.full < r.shorn && r.shorn < r.snowy && r.full < 0.2, r);
  ok(`below the pass it thaws (0.8 → ${r.thaw})`, r.thaw < 0.8, r);
  ok('frozen stiff too long: dead of it', r.frozen, r);
}

if (!only || only === 'fire') {
  const r = await ev(() => {
    const { G, PASS, HANK, living, heatAt } = GAME;
    const f = PASS.fires[0]; setup(f.s, { hour: 11, hankS: f.s - 6 });
    const L = living(); L.forEach(s => { s.cold = 0.05; }); const cold = L.filter(s => !s.lamb).slice(0, 3); cold.forEach(s => { s.cold = 0.85; });
    const t = run(30, () => f.fuel > 0);
    const lit = f.fuel > 0, by = Math.hypot(HANK.x - f.x, HANK.z - f.z), near = new Set(), burnt = new Set();
    run(12, () => { for (const s of cold) if (Math.hypot(s.x - f.x, s.z - f.z) < 3.6) near.add(s); for (const s of L) if (s.burn > 0) burnt.add(s); });
    const warm = near.size, colder = Math.max(...cold.map(s => s.cold));
    return { lit, t: +t.toFixed(1), by: +by.toFixed(1), warm, colder: +colder.toFixed(2), heat: +heatAt(f.x + 2.3, f.z).toFixed(2), burnt: burnt.size };
  });
  ok(`Hank lights the camp's fire (${r.t} s, ${r.by} m off it)`, r.lit && r.by < 3.5, r);
  ok(`the cold ones go in close and warm up (${r.warm}/3, worst now ${r.colder}); nobody's jostled into the flames`, r.warm >= 2 && r.colder < 0.6 && r.heat > 0.8 && !r.burnt, r);
}

if (!only || only === 'hank') {
  const r = await ev(() => {
    const { G, T, PASS, HANK, living, killSheep, pathPoint, passFireGoal } = GAME;
    const f = PASS.fires[0]; setup(f.s, { hour: 11, hankS: f.s - 8 });
    HANK.shovel = true; HANK.meds = { venom: 0, bandage: 2, pills: 0 };
    const L = living(), sick = L.find(s => !s.lamb); sick.bleedRate = 1 / 20; sick.bleed = 0.1;
    const dead = L.find(s => s !== sick && !s.lamb); killSheep(dead, 'cold'); const g = G.graves.at(-1);
    let litT = -1, curedT = -1, buried = false, firstJob = null;
    for (let t = 0; t < 40 && curedT < 0; t += 0.025) {
      GAME.step(0.025);
      if (litT < 0 && f.fuel > 0) litT = t;
      if (curedT < 0 && !(sick.bleedRate > 0)) curedT = t;
      if (!firstJob && (HANK.care || f.fuel > 0)) firstJob = f.fuel > 0 ? 'fire' : HANK.care.kind;
      if (HANK.care && HANK.care.kind === 'bury') buried = true;
    }
    run(20, () => { if (HANK.care && HANK.care.kind === 'bury') buried = true; });
    // past it, the next one 70+ m up: nothing (not back to the one behind); nearer: the next one
    const at = s => { const p = pathPoint(s, 0); for (const o of living()) { o.x = p.x + Math.random() * 3; o.z = p.z + Math.random() * 3; } G.time += 0.001; return passFireGoal(); };
    f.fuel = 1; const behind = at(f.s + 40), ahead = at(f.s + 60);
    // a night by it: asleep; it burns low: he's up and stokes it
    setup(f.s, { hour: 21, hankS: f.s - 4 }); f.fuel = 6;
    const slept = run(40, () => HANK.asleep) >= 0; f.fuel = 1.2;
    const woke = run(10, () => !HANK.asleep) >= 0, stoked = run(10, () => f.fuel > 5) >= 0;
    return { litT: +litT.toFixed(1), curedT: +curedT.toFixed(1), firstJob, buried, grave: !g.stone && !g.by, behind: behind && behind.fire.i, ahead: ahead && ahead.fire.i, aheadLight: ahead && ahead.light, slept, woke, stoked };
  });
  ok(`the fire first (lit ${r.litT} s), then the patient (${r.curedT} s)`, r.firstJob === 'fire' && r.litT >= 0 && r.curedT > r.litT, r);
  ok('no burials while the flock is up the pass', !r.buried && r.grave, r);
  ok('not back to a fire the flock has left; on to the next one up', r.behind === null && r.ahead === 1 && r.aheadLight, r);
  ok('asleep by the fire; it burns low: up to stoke it', r.slept && r.woke && r.stoked, r);
}

if (!only || only === 'blizzard') {
  const r = await ev(() => {
    const { G, PASS, living, pathPoint } = GAME;
    setup(1320, { blizz: true, hour: 11 });
    run(2); const on = PASS.blizz.on; let k = 0;
    run(40, () => { k = Math.max(k, PASS.blizz.k); }); const L = living(), snow = L.reduce((a, s) => a + (s.snow || 0), 0) / L.length;
    const s = L[0]; s.snow = 1; const sn0 = s.snow;
    for (let t = 0; t < 2; t += 0.025) { s.state = 'flee'; s.fear = 1; s.fdx = 0; s.fdz = 1; GAME.step(0.025); }
    const shed = s.snow;
    PASS.blizz.on = false; PASS.blizz.next = 1e9; const f = PASS.fires[1], q = L[1]; f.fuel = 5; q.snow = 1; q.x = f.x + 2.2; q.z = f.z; run(4); 
    return { on, k: +k.toFixed(2), snow: +snow.toFixed(2), shed: +shed.toFixed(2), melt: +q.snow.toFixed(2) };
  });
  ok(`a blizzard comes (k ${r.k}) and piles snow on the flock (${r.snow})`, r.on && r.k > 0.5 && r.snow > 0.25, r);
  ok(`a running sheep shakes it off (1 → ${r.shed}); a fire melts it (1 → ${r.melt})`, r.shed < 0.85 && r.melt < 0.6, r);
}

if (!only || only === 'ice') {
  const r = await ev(() => {
    const { G, ICES, HANK, living, sAt, iceK, startSlide } = GAME;
    const m = ICES.slice().sort((a, b) => b.r - a.r)[0]; setup(m.s, { hour: 11, hankS: m.s - 30 });
    const s = living()[0], s0 = sAt(m.x, m.z); s.x = m.x; s.z = m.z; s.vx = 3; s.vz = 0; s.state = 'flee'; s.fear = 1;
    let slid = false, minS = 1e9; for (let t = 0; t < 8; t += 0.025) { GAME.step(0.025); if (s.state === 'slide') slid = true; minS = Math.min(minS, sAt(s.x, s.z)); if (slid && !s.slide) break; }
    const sheep = { slid, down: +(s0 - minS).toFixed(1), stopped: !s.slide };
    const d = G.dogs[0]; d.x = m.x - Math.cos(0) * 0; d.z = m.z; d.vx = 8; d.vz = 0; d.slipCd = 0; let dslid = false;
    G.players[0].bot = { mx: 1 }; for (let t = 0; t < 6; t += 0.025) { GAME.step(0.025); G.players[0].bot = {}; if (d.slide) dslid = true; if (dslid && !d.slide) break; }
    HANK.x = m.x; HANK.z = m.z; HANK.vx = 2; HANK.slipCd = 0; startSlide(HANK, 'ice'); let hslid = !!HANK.slide; run(8, () => !HANK.slide);
    // a calm sheep walking past keeps off it
    const c = living()[3]; const p = GAME.pathPoint(m.s - 12, 0); c.x = m.x + (m.x > p.x ? -1 : 1) * (m.r + 1.5); c.z = m.z; c.state = 'wander'; c.tx = m.x + (m.x - c.x); c.tz = m.z; c.fear = 0; c.panic = 0; c.stress = 0; c.slipCd = 0;
    let onIce = 0; for (let t = 0; t < 6; t += 0.025) { if (c.state === 'idle') { c.state = 'wander'; } GAME.step(0.025); if (iceK(c.x, c.z) > 0.6) onIce++; }
    return { sheep, dog: { slid: dslid, stopped: !d.slide }, hank: { slid: hslid, stopped: !HANK.slide }, calmOnIce: onIce };
  });
  ok(`a running sheep onto the ice slides ${r.sheep.down} m downhill, then stops`, r.sheep.slid && r.sheep.down > 1 && r.sheep.stopped, r.sheep);
  ok('a dog slides too, and stops', r.dog.slid && r.dog.stopped, r.dog);
  ok('Hank slides (windmilling), and stops', r.hank.slid && r.hank.stopped, r.hank);
  ok(`a calm sheep goes round it (${r.calmOnIce} steps on it)`, r.calmOnIce < 20, r);
}

if (!only || only === 'crev') {
  const r = await ev(() => {
    const { G, CREVS, living, crevFall, joinPlayer, startPounce } = GAME;
    const c = CREVS[2]; setup(c.s, { hour: 11, dogS: c.s - 8 });
    const s = living()[0]; s.x = c.x + 0.3 * c.ax; s.z = c.z + 0.3 * c.az; s.vx = s.vz = 0; s.state = 'flee'; s.fear = 1; GAME.step(0.025);
    const sIn = s.state === 'crev' && !!s.crev;
    run(1); const stuck = s.state === 'crev';
    const d = G.dogs[0], nx = -c.az, nz = c.ax; d.x = s.x + nx * 1.9; d.z = s.z + nz * 1.9; d.yaw = Math.atan2(-nx, -nz); d.vx = d.vz = 0;
    G.players[0].bot = { grab: true }; GAME.step(0.025); run(0.3);
    const grabbed = s.heldBy === d && !s.crev;
    G.players[0].bot = toward(nx, nz, { grab: true }); run(1); G.players[0].bot = {}; GAME.step(0.025); run(1);
    const out = !s.crev && !s.heldBy;
    // a dog alone: mash pounce
    d.x = c.x; d.z = c.z; crevFall(d, c); const dIn = !!d.crev; let presses = 0;
    for (let i = 0; i < 30 && d.crev; i++) { G.players[0].bot = { pounce: true }; GAME.step(0.025); presses++; G.players[0].bot = {}; GAME.step(0.025); }
    const climbed = !d.crev;
    // with a friend: mashing doesn't, the friend grabs it out
    const p2 = joinPlayer({ kind: 'bot', index: 1 }), o = p2.dog; p2.bot = {}; o.x = c.x + nx * 6; o.z = c.z + nz * 6;
    d.x = c.x; d.z = c.z; d.vx = d.vz = 0; crevFall(d, c);
    for (let i = 0; i < 30; i++) { G.players[0].bot = { pounce: true }; GAME.step(0.025); G.players[0].bot = {}; GAME.step(0.025); }
    const mashNo = !!d.crev;
    o.x = d.x + nx * 1.9; o.z = d.z + nz * 1.9; o.yaw = Math.atan2(-nx, -nz); o.vx = o.vz = 0;
    p2.bot = { grab: true }; GAME.step(0.025); run(0.2);
    const pulled = !d.crev && d.heldBy === o;
    GAME.dropPlayer(p2);
    return { sIn, stuck, grabbed, out, dIn, climbed, presses, mashNo, pulled };
  });
  ok('a sheep falls in a crack and stays there', r.sIn && r.stuck, r);
  ok('a dog grabs it out, carries it off and sets it down', r.grabbed && r.out, r);
  ok(`a dog on its own mashes pounce and climbs out (${r.presses} presses)`, r.dIn && r.climbed && r.presses > 3, r);
  ok('with a friend: mashing won\'t get it out; the friend grabs it out', r.mashNo && r.pulled, r);
}

if (!only || only === 'goat') {
  const r = await ev(() => {
    const { G, GOATS, living, goatGo, sAt, pathPoint, bark, HANK } = GAME;
    const g = GOATS[4]; const s0 = sAt(g.home.x, g.home.z); setup(s0, { hour: 11, dogS: s0 - 20 });
    const s = living().filter(o => !o.ram)[0], before = sAt(s.x, s.z);
    goatGo(g, s); let flew = false, rolled = false, minS = 1e9;
    for (let t = 0; t < 10; t += 0.025) { GAME.step(0.025); if (s.air && s.air.kind === 'tumble') flew = true; if (s.state === 'roll') rolled = true; minS = Math.min(minS, sAt(s.x, s.z)); if (g.state === 'perch' && t > 2) break; }
    const out = { flew, rolled, down: +(before - minS).toFixed(1), home: g.state === 'perch' || g.state === 'up', alive: !s.dead };
    // a bark sends one home
    const g2 = GOATS[5], s2 = living()[3]; goatGo(g2, s2); run(1.2, () => g2.state === 'windup');
    const d = G.dogs[0]; d.x = g2.x + 3; d.z = g2.z; d.barkCd = 0; bark(d); out.barked = g2.state === 'up';
    // a pounce bonks one
    const g3 = GOATS[6], s3 = living()[5]; goatGo(g3, s3); run(1.2, () => g3.state === 'windup');
    d.x = g3.x - 1.2; d.z = g3.z; d.vx = d.vz = 0; d.pounceCD = 0; G.players[0].bot = toward(1, 0, { pounce: true }); GAME.step(0.025); G.players[0].bot = {};
    run(0.4); out.pounced = g3.state === 'flown' || g3.state === 'dazed' || g3.state === 'skid' || g3.state === 'up';
    // Hank: knocked flying, rolls, back on his feet
    const g4 = GOATS[7], s4 = sAt(g4.home.x, g4.home.z); setup(s4, { hour: 11, dogS: s4 - 12, hankS: s4 }); goatGo(g4, HANK); let hFlew = false; run(9, () => { if (HANK.air) hFlew = true; return hFlew && !HANK.air && !HANK.slide; });
    out.hank = hFlew && !HANK.air && !HANK.slide;
    return out;
  });
  ok(`a goat bonks a sheep: it flies, rolls on ${r.down} m down the mountain, alive; the goat goes home`, r.flew && r.rolled && r.down > 2 && r.alive && r.home, r);
  ok('a bark sends one back up', r.barked, r);
  ok('a pounce bonks one', r.pounced, r);
  ok('a goat bonks Hank: he flies, rolls, gets up', r.hank, r);
}

if (!only || only === 'yeti' || only === 'finish') {
  const r = await ev(() => {
    const { G, T, YETI, SIDE, SNOWBALLS, living, pathPoint, snowballRoll, punt, ignite, finalPen, sAt } = GAME;
    setup(T.pass.arena - 30, { yeti: true, hour: 11, dogS: T.pass.arena + 4 });
    run(1); const woke = YETI.state !== 'sleep' && YETI.on;
    // a snowball grows as it rolls and bowls a dog over
    const clear = l => { for (let k = 0; k <= 20; k++) { const q = pathPoint(T.pass.arena - 12 - k, l); if (GAME.crevAt(q.x, q.z, 3) || GAME.sdfAt(q.x, q.z) < 3) return false; } return true; };
    const lane = [0, 3, -3, 6, -6, 9].find(clear) ?? 0;   // (a lane clear of cracks)
    const d = G.dogs[0], down = pathPoint(T.pass.arena - 30, lane); d.x = down.x; d.z = down.z; d.vx = d.vz = 0;
    const st = pathPoint(T.pass.arena - 12, lane), dx = d.x - st.x, dz = d.z - st.z, dl = Math.hypot(dx, dz);
    YETI.next = 1e9; SNOWBALLS.length = 0; const b = snowballRoll(st.x, st.z, dx / dl * 8, dz / dl * 8), r0 = b.r; let rMax = r0, hit = false;
    for (let t = 0; t < 6; t += 0.025) { GAME.step(0.025); if (SNOWBALLS.includes(b)) rMax = Math.max(rMax, b.r); if (d.air && d.air.kind === 'tumble') hit = true; if (hit && !SNOWBALLS.includes(b)) break; }
    // too close: a headbutt
    run(3, () => !d.air && !d.slide); d.x = YETI.x + 3; d.z = YETI.z; d.vx = d.vz = 0; YETI.buttCd = 0; YETI.state = 'idle'; YETI.hurtT = 0; let butted = false;
    for (let t = 0; t < 3; t += 0.025) { d.x = d.air || d.slide ? d.x : YETI.x + 3; d.z = d.air || d.slide ? d.z : YETI.z; GAME.step(0.025); if (d.air) { butted = true; break; } }
    run(3, () => !d.air && !d.slide);
    // three burning sheep bonked into him
    const hits = []; YETI.next = 1e9; YETI.buttCd = 1e9;
    for (let k = 0; k < 3 && !YETI.beaten; k++) {
      const s = living().filter(o => !o.ram)[k]; s.x = YETI.x - 7; s.z = YETI.z; s.vx = s.vz = 0; ignite(s); YETI.hurtT = 0;
      d.x = s.x - 1; d.z = s.z; d.pdx = 1; d.pdz = 0; d.pounceT = 0.2; punt(s, d, 1, 0);
      for (let t = 0; t < 3 && s.air; t += 0.025) GAME.step(0.025);
      hits.push(YETI.hp); run(0.5);
    }
    return { woke, r0, rMax: +rMax.toFixed(2), hit, butted, hits, beaten: YETI.beaten, how: YETI.how, thawed: !finalPen.frozen, wool: G.wool };
  });
  ok('the yeti wakes when the dog reaches the top', r.woke, r);
  ok(`a snowball grows as it rolls (${r.r0} → ${r.rMax} m) and bowls a dog over`, r.rMax > r.r0 * 1.5 && r.hit, r);
  ok('too close: he headbutts it flying', r.butted, r);
  ok(`burning sheep bonked into him: hp ${r.hits.join(' → ')}, beaten by fire; his cave thaws`, r.beaten && r.how === 'fire' && r.hits.join() === '2,1,0' && r.thawed && r.wool >= 20, r);
}

if (!only || only === 'finish') {
  const r = await ev(() => {
    const { G, T, SEA, HARB, DECK, BOAT, living, finalPen, sdfAt, inSea, harbRoad, harbIce, resetPass, CAM_R, CAM_F } = GAME, out = {};
    // (after 'yeti': he's beaten) the ice has gone from the gap in the east rim too. His cave's just a pen now: shut on the flock, nothing ends
    const p = finalPen, L = living(), g = HARB.gap, P = HARB.pts, d = G.dogs[0];
    out.open = !HARB.ice && sdfAt(g.x, g.z) > 1.5 && !p.frozen;
    L.forEach((s, i) => { s.x = p.x + Math.cos(i) * 3; s.z = p.z + Math.sin(i) * 3; s.vx = s.vz = 0; s.air = null; s.slide = null; s.crev = null; s.burn = 0; s.state = 'idle'; });
    GAME.step(0.025); out.inn = L.filter(s => s.pen === p).length; p.phi = 0; GAME.updateGateGeometry(p); run(T.pass.finish + 1.5);
    out.penned = { mode: G.mode, sea: SEA.on, live: living().length };
    // the dog goes out through the gap and onto the road: the harbour wakes (she's alongside, her gangway open) and nobody's been moved
    d.x = P[0].x; d.z = P[0].z; d.vx = d.vz = 0; d.air = null; const at0 = L.map(s => [s.x, s.z]), y0 = GAME.groundY(d.x, d.z);
    const tw = run(8, () => { const dx = P[1].x + (P[2].x - P[1].x) * 0.2 - d.x, dz = P[1].z + (P[2].z - P[1].z) * 0.2 - d.z, l = Math.hypot(dx, dz) || 1; d.player.bot = { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l }; return SEA.on; });
    d.player.bot = {};
    out.woke = SEA.on && SEA.docked && !DECK.lock && DECK.gateT > 0.9; out.tw = +(+tw).toFixed(1); out.mode = G.mode;
    out.moved = +Math.max(...L.map((s, i) => Math.hypot(s.x - at0[i][0], s.z - at0[i][1]))).toFixed(2); out.dogOn = harbRoad(d.x, d.z).d < 0 && !inSea(d.x, d.z); out.dy = +(GAME.groundY(d.x, d.z) - y0).toFixed(1);
    out.road = +(P[5].d - P[1].d).toFixed(0); out.drop = +(P[1].y - P[5].y).toFixed(1); out.endY = +(P[5].y - BOAT.y).toFixed(2);
    out.walk = P.slice(0, 6).every(q => sdfAt(q.x, q.z) > 2);   // the road's walkable all the way to the pier's root
    // a new journey: the ice is back in the gap
    resetPass(); out.iced = HARB.ice && sdfAt(g.x, g.z) < 0;
    return out;
  });
  ok(`the yeti beaten: the ice is out of the gap in the east rim; his cave's a pen (${r.inn} shut in: nothing ends, nobody's moved)`, r.open && r.inn >= 12 && r.penned.mode === 'play' && !r.penned.sea && r.penned.live === r.inn, r);
  ok(`out through the gap onto the road (${r.road} m, ${r.drop} m down to the pier, walkable all the way): Cold Harbour wakes in ${r.tw} s, her gangway open, and nobody's been moved (${r.moved} m)`, r.woke && r.mode === 'play' && r.moved < 6 && r.dogOn && Math.abs(r.dy) < 2.5 && r.road > 150 && r.drop > 40 && Math.abs(r.endY) < 0.01 && r.walk, r);
  ok('a new journey: iced shut again', r.iced, r);
}

if (!only || only === 'rock') {
  const r = await ev(() => {
    const { G, T, YETI, ROCK, SIDE, living, punt, finalPen, sAt } = GAME;
    setup(T.pass.arena - 30, { yeti: true, hour: 11, dogS: T.pass.arena + 4 });
    run(1); YETI.next = 1e9; YETI.buttCd = 1e9;
    const d = G.dogs[0], R = ROCK, L = SIDE.ledge, ux = R.x - L.x, uz = R.z - L.z, ul = Math.hypot(ux, uz), cracks = [];
    for (let k = 0; k < 3; k++) {
      const s = living().filter(o => !o.ram)[k]; s.x = R.x - ux / ul * (R.r + 2.4); s.z = R.z - uz / ul * (R.r + 2.4); s.vx = s.vz = 0; s.pen = null;
      d.x = s.x - ux / ul; d.z = s.z - uz / ul; d.pdx = ux / ul; d.pdz = uz / ul; d.pounceT = 0.2; punt(s, d, ux / ul, uz / ul);
      for (let t = 0; t < 2 && s.air; t += 0.025) GAME.step(0.025);
      cracks.push(R.cracks); run(0.7);
    }
    run(3);
    return { cracks, state: R.state, yeti: YETI.state, how: YETI.how, beaten: YETI.beaten, thawed: !finalPen.frozen };
  });
  ok(`three sheep into the rock wall: cracks ${r.cracks.join(' → ')}, it falls on him (${r.yeti})`, r.cracks.join() === '1,2,3' && r.state === 'down' && r.yeti === 'crushed' && r.how === 'rock', r);
  ok('his cave thaws', r.beaten && r.thawed, r);
}

if (!only || only === 'side') {
  const r = await ev(() => {
    const { G, SIDE, living, findPath, sdfAt, sideD, step, CAM_R, CAM_F, pathPoint, trailInfo } = GAME;
    // across it every 2 m: free width (cells walkable, on it)
    let narrow = 1e9; for (let i = 6; i < SIDE.pts.length - 6; i += 4) { const a = SIDE.pts[i - 2], b = SIDE.pts[i + 2], l = Math.hypot(b.x - a.x, b.z - a.z), wx = (b.z - a.z) / l, wz = -(b.x - a.x) / l, p = SIDE.pts[i]; let f = 0; for (let o = -8; o <= 8; o += 0.25) if (sdfAt(p.x + wx * o, p.z + wz * o) > 0 && sideD(p.x + wx * o, p.z + wz * o) < SIDE.hw) f += 0.25; narrow = Math.min(narrow, f); }
    const H = SIDE.home, L = SIDE.ledge, hp = findPath(H.x, H.z, L.x, L.z, 400000); let way = 0, px = H.x, pz = H.z; for (const q of hp) { way += Math.hypot(q.x - px, q.z - pz); px = q.x; pz = q.z; }
    setup(SIDE.s0 - 40, { lat: 4, hour: 9, dogS: SIDE.s0 - 26 });
    const go = living().filter(s => !s.lamb).slice(0, 5), st = pathPoint(SIDE.s0 - 26, trailInfo(SIDE.pts[0].x, SIDE.pts[0].z).lat), fp = findPath(st.x, st.z, L.x, L.z, 200000), route = [st];
    for (const q of fp) { const a = route[route.length - 1], n = Math.max(1, Math.ceil(Math.hypot(q.x - a.x, q.z - a.z) / 0.5)); for (let k = 1; k <= n; k++) route.push({ x: a.x + (q.x - a.x) * k / n, z: a.z + (q.z - a.z) * k / n }); }
    const near = (x, z) => { let b = 0, bd = 1e9; route.forEach((q, i) => { const d = Math.hypot(q.x - x, q.z - z); if (d < bd) { bd = d; b = i; } }); return b; }, at = i => route[Math.max(0, Math.min(route.length - 1, i))];
    go.forEach((s, i) => { const q = route[16 + (i % 3) * 3]; s.x = q.x + (i % 2 ? 1.5 : -1.5); s.z = q.z + (i > 2 ? 1.5 : -1.5); });
    const d = G.dogs[0], P = G.players[0]; d.x = route[2].x; d.z = route[2].z;
    let t = 0, on = 0;
    for (; t < 90 && on < 3; t += 0.025) {   // (like flock-sim's driver: behind the flock's middle, walking at the road ~8 m on; in front or beside: round it)
      const n = go.length, kx = go.reduce((a, s) => a + s.x, 0) / n, kz = go.reduce((a, s) => a + s.z, 0) / n, sp = Math.max(...go.map(s => Math.hypot(s.x - kx, s.z - kz))), g = at(near(kx, kz) + 16);
      let gx = g.x - kx, gz = g.z - kz; const gl = Math.hypot(gx, gz) || 1; gx /= gl; gz /= gl;
      const rx = d.x - kx, rz = d.z - kz, along = rx * gx + rz * gz, lat = rx * -gz + rz * gx, W = sideD(kx, kz) < SIDE.hw + 1 ? 2.4 : Math.max(8, sp + 5);
      const tg = along > -Math.max(2.5, sp * 0.8) ? { x: kx - gx * (Math.min(sp, 8) + 3) - gz * (lat >= 0 ? 1 : -1) * W, z: kz - gz * (Math.min(sp, 8) + 3) + gx * (lat >= 0 ? 1 : -1) * W } : { x: kx - gx * (sp + 3), z: kz - gz * (sp + 3) };
      const dx = tg.x - d.x, dz = tg.z - d.z, l = Math.hypot(dx, dz), m = Math.min(1, l / 2.5);
      P.bot = l < 0.4 ? {} : { mx: (dx * CAM_R.x + dz * CAM_R.z) / l * m, my: -(dx * CAM_F.x + dz * CAM_F.z) / l * m };
      step(0.025); on = go.filter(s => !s.dead && Math.hypot(s.x - L.x, s.z - L.z) < L.r + 0.5).length;
    }
    return { narrow, way: +way.toFixed(0), crow: +Math.hypot(H.x - L.x, H.z - L.z).toFixed(0), on, t: +t.toFixed(1) };
  });
  ok(`the side trail: ≥${r.narrow} m across all the way; the ledge only up it (${r.way} m round from his spot, ${r.crow} m as the crow flies)`, r.narrow >= 5 && r.way > r.crow * 3, r);
  ok(`a dog drives 5 sheep up it: ${r.on} on the ledge in ${r.t} s`, r.on >= 3 && r.t < 60, r);
}

if (!only || only === 'burn') {
  const r = await ev(() => {
    const { G, PASS, living, tryGrab } = GAME;
    const f = PASS.fires[1]; setup(f.s, { hour: 11 }); f.fuel = 6;
    const s = living().filter(o => !o.ram)[0], d = G.dogs[0]; s.wool = 1; const w0 = s.wool;
    s.x = f.x + 3; s.z = f.z; d.x = f.x + 4.6; d.z = f.z; d.yaw = -Math.PI / 2; d.vx = d.vz = 0;
    G.players[0].bot = { grab: true }; GAME.step(0.025); const held = s.heldBy === d;
    G.players[0].bot = toward(-1, 0, { creep: true, grab: true }); let lit = false, dropped = false;
    for (let t = 0; t < 4; t += 0.025) { GAME.step(0.025); if (s.burn > 0) lit = true; if (lit && !s.heldBy) { dropped = true; break; } }
    G.players[0].bot = {};
    let ran = 0, rolled = false; const x0 = s.x, z0 = s.z;
    for (let t = 0; t < 12; t += 0.025) { GAME.step(0.025); if (s.state === 'burn') ran = Math.max(ran, Math.hypot(s.x - x0, s.z - z0)); if (s.state === 'roll') rolled = true; if (rolled && !(s.burn > 0)) break; }
    return { held, lit, dropped, ran: +ran.toFixed(1), rolled, out: !(s.burn > 0), singed: s.wool < 0.1 && w0 > 0.5, alive: !s.dead, soot: s.soot > 0.5 };
  });
  ok('a sheep carried into a fire catches; too hot to hold (dropped)', r.held && r.lit && r.dropped, r);
  ok(`it runs mad (${r.ran} m), then rolls it out: singed, alive`, r.ran > 3 && r.rolled && r.out && r.singed && r.alive && r.soot, r);
}

console.log(h.errors.length ? `errors: ${h.errors.slice(0, 5).join(' | ')}` : 'no page errors');
console.log(fail ? `${fail} FAILED` : 'all passed');
await h.close();
process.exit(fail || h.errors.length ? 1 : 0);
