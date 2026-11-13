// Headless test: `node tools/pass-test.mjs [layout|cold|fire|camp|hank|blizzard|torch|melt|ice|crev|goat|yeti|cave|nag|rock|entry|side|burn|finish]`. MOUNTAIN PASS.
//   layout    past the Trading Post (no longer the end, no Cabo) the trail climbs: the floor rises, walls close in; fire camps level;
//             ice, cracks; a way up to the yeti's cave (iced shut); the hidden side trail to its ledge by the rock wall (shut by its door
//             till that's down); nothing else up there
//   cold      in the pass a shorn sheep gets colder than a full fleece, snow on it colder still; out of the pass it thaws; frozen too long: dead
//   fire      Hank lights the fire camp the flock's at; the coldest take the places round it and warm up
//   camp      round each fire camp nothing stands between the fire and the ground near it (no corner to get stuck in; the ice cave's: inside it); warm a long way out;
//             the base camp at the foot of the climb: Hank lights it as the flock comes up
//   torch     a dog grabs a camp's stick, dips it in the lit fire: alight; carried up into the snow it melts it: grass under it, eaten;
//             lying lit on the ice: the ice melts, no slide; a lit one lights a cold camp's fire; it burns out; off the mountain: home again
//   melt      a lit fire melts its camp; melted snow snows over slowly, in a blizzard fast (the grass buried again); a new journey: all snow
//   hank      the fire before anything: lit before a patient's seen to; no burials up here; the next fire up, not one left behind;
//             asleep by one burning low: up to stoke it
//   blizzard  a blizzard piles snow on them; running shakes it off; a fire melts it
//   ice       onto the ice: a sheep, a dog, Hank slide downhill and stop; a calm sheep goes round
//   crev      a sheep in a crack: grabbed out; a dog alone: mashing pounce climbs out; with a friend: mashing won't, the friend grabs it out
//   goat      a goat comes down, bonks a sheep down the mountain (it rolls on); a bark sends one home; a pounce bonks one
//   yeti      he wakes at the top; snowballs roll, grow and bowl a dog over; too close: a headbutt; burning sheep bonked into him ×3: beaten
//   cave      the top fire's in the ice cave by him, its mouth his way: walled but the mouth, warm places round the fire, Hank lights it and
//             keeps in it while he's up; a snowball at a sheep in it smashes on it; his butt can't reach in (him at the end of his leash);
//             a burning sheep punted from its mouth hits him
//   nag       Hank, while you're not getting it: a line in, then on a timer, snarkier each time; a pounce off him, a cold sheep at him: a
//             line on it (not within the cooldown); tops out; a hit: a cheer, back a few tiers; beaten: no more; a new journey: from the top
//   rock      three sheep flung into the rock wall up the side trail: it falls on him (an arm sticks out), his cave thaws; its heap's a
//             way over the rim: from the hidden ledge to his spot, walked over (up on its stones)
//   entry     the door in the side trail's mouth: in the way (no way up to the ledge); a dog's pounce: a wobble, a bounce, never a fall;
//             two sheep flung into it: down, up the road; the way's open, walked over its heap; a new journey: up again
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
    const path = findPath(a.x, a.z, cave.exitX, cave.exitZ, 400000), sp = SIDE.pts[0], L = SIDE.ledge, reach = () => { const q = findPath(pathPoint(SIDE.s0 - 8, 0).x, pathPoint(SIDE.s0 - 8, 0).z, L.x, L.z, 400000); return !!(q && q.length) && Math.hypot(q.at(-1).x - L.x, q.at(-1).z - L.z) < 1.5; };
    const shut = !reach(); GAME.DOOR.state = 'down'; GAME.doorStamp(false); const open = reach(), side = open && shut; GAME.resetPass();
    return { post: POST.s, fin: FINAL.s, len: PATH_LEN, postFinal: !!post.final, caveFinal: !!cave.final, frozen: !!cave.frozen, market: MARKET.s < POST.s && MARKET.wares.every(w => w.id !== 'cabo'),
      lift: [P.s0, 1250, 1350, P.top, FINAL.s].map(s => +liftAt(s).toFixed(1)), freeLow: free(1100), freePass: Math.max(...[1220, 1320, 1420].map(free)), fires: fp,
      ices: ICES.length, crevs: CREVS.length, goats: GOATS.length, path: !!(path && path.length), side, shut, open, ledge: +sdfAt(SIDE.ledge.x, SIDE.ledge.z).toFixed(1),
      wall: Math.max(...[8, 12, 16].map(o => { const p = pathPoint(1300, -(P.hwW + o)); return terrainH(p.x, p.z) - liftAt(1300); })),
      rock: ROCK.state, yeti: YETI.state, inPass: { dens: inP(DENS), nests: inP(NESTS), plants: inP(PLANTS), salt: inP(SALT_ROCKS), brambles: inP(BRAMBLES), digs: inP(DIGS), snakes: inP(SNAKES), apples: inP(APPLE_TREES), groves: GROVES.filter(g => passK(g.s) > 0.3).length } };
  });
  ok(`the Trading Post (${r.post}) is a camp, not the end; its market sells no Cabo`, !r.postFinal && r.market, r);
  ok(`the yeti's cave (${r.fin.toFixed(0)}) is the end: its pen iced shut`, r.caveFinal && r.frozen, r);
  ok(`the floor climbs ${r.lift.join(' → ')} m`, r.lift[0] < 1 && r.lift[1] > 8 && r.lift[2] > r.lift[1] && r.lift[3] > 38 && Math.abs(r.lift[4] - r.lift[3]) < 1, r);
  ok(`the pass is narrower (${r.freePass} m) than the desert below (${r.freeLow} m); walls up the west side (${r.wall.toFixed(1)} m)`, r.freePass < r.freeLow && r.freePass < 34 && r.wall > 10, r);
  ok(`${r.fires.length} fire camps (one the base camp), level and clear`, r.fires.length === 4 && r.fires.every(f => f.lvl < 0.6 && f.sdf > 2), r.fires);
  ok(`${r.ices} ice patches, ${r.crevs} cracks, ${r.goats} goats`, r.ices >= 8 && r.crevs >= 5 && r.goats >= 9, r);
  ok('a way from the Trading Post up to the cave; the hidden side trail up to its ledge (once its door\'s down)', r.path && r.side && r.ledge > 1, r);
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

if (!only || only === 'camp') {
  const r = await ev(() => {
    const { PASS, sdfAt, heatAt, HANK, G, living, pathPoint } = GAME;
    // every free spot within 10 m of each fire: can a sheep walk straight in to it? (nothing in the way: no corner behind a wall or a tower)
    const camps = PASS.fires.map(f => {
      let n = 0, seen = 0;
      for (let dx = -10; dx <= 10; dx++) for (let dz = -10; dz <= 10; dz++) {
        const d = Math.hypot(dx, dz); if (d > (f.cave ? GAME.CAVE.r : 10) || d < 2 || sdfAt(f.x + dx, f.z + dz) < 0.5) continue; n++;   // (THE ICE CAVE: inside it)
        let clear = true; for (let u = 0.1; u < 1; u += 0.05) if (sdfAt(f.x + dx * u, f.z + dz * u) < 0.3) { clear = false; break; }
        if (clear) seen++;
      }
      f.fuel = 5; const heat = +heatAt(f.x + 8, f.z).toFixed(2); f.fuel = 0;
      return { s: f.s, base: !!f.base, seen: +(seen / n).toFixed(3), heat };
    });
    // the base camp: the flock coming up the last of the desert, Hank goes and lights it
    const b = PASS.fires.find(f => f.base); setup(b.s - 24, { hour: 10, hankS: b.s - 34 });
    const t = run(40, () => b.fuel > 0);
    return { camps, base: { s: b.s, snow: GAME.T.pass.snow, lit: b.fuel > 0, t: +t.toFixed(1) } };
  });
  ok(`round every camp nothing in the way of the fire: ${r.camps.map(c => c.seen).join(', ')} of the ground near it sees it`, r.camps.every(c => c.seen > 0.96), r.camps);
  ok(`warm a long way out (8 m: ${r.camps.map(c => c.heat).join(', ')})`, r.camps.every(c => c.heat > 0.3), r.camps);
  ok(`the base camp at the foot of the climb (${r.base.s}): Hank lights it as the flock comes up (${r.base.t} s)`, r.base.lit && r.base.s < r.base.snow, r.base);
}

if (!only || only === 'torch') {
  const r = await ev(() => {
    const { G, T, PASS, TORCHES, ICES, HANK, living, pathPoint, grassAt, grassCapAt, meltAt, iceK, torchTip, resetPass, MELT, MELTV } = GAME, out = {};
    const b = PASS.fires.find(f => f.base), t = TORCHES[b.i];
    setup(b.s - 6, { hour: 10, hankS: b.s - 4 }); b.fuel = 6; const d = G.dogs[0], P = G.players[0];
    out.home = +Math.hypot(t.x - b.x, t.z - b.z).toFixed(1); out.unlit = !(t.lit > 0);
    // grab it, walk it into the fire
    d.x = t.x - Math.cos(t.yaw) * 1.5; d.z = t.z + Math.sin(t.yaw) * 1.5; d.yaw = Math.atan2(t.x - d.x, t.z - d.z); d.vx = d.vz = 0;
    P.bot = { grab: true }; GAME.step(0.025); run(0.2); out.held = t.by === d;
    out.litT = +run(6, () => { P.bot = toward(b.x - d.x, b.z - d.z, { grab: true, creep: true }); return t.lit > 0; }).toFixed(1);
    // up the trail into the snow with it: the snow melts where it goes, the grass under it shows (and grows no thinner than it was)
    const q = pathPoint(b.s + 30, 3), cap0 = grassCapAt(q.x, q.z), g0 = grassAt(q.x, q.z);
    run(8, () => { P.bot = toward(q.x - d.x, q.z - d.z, { grab: true }); return Math.hypot(q.x - d.x, q.z - d.z) < 1; });
    run(0.5, () => { P.bot = { grab: true }; return false; });
    out.melt = +meltAt(q.x, q.z).toFixed(2); out.cap = [+cap0.toFixed(2), +grassCapAt(q.x, q.z).toFixed(2)]; out.grass = [+g0.toFixed(2), +grassAt(q.x, q.z).toFixed(2)];
    // a hungry sheep put by it eats there
    const far = pathPoint(b.s - 10, -6); d.x = far.x; d.z = far.z; d.vx = d.vz = 0;   // (the dog well off)
    const s = living().filter(o => !o.ram && !o.lamb)[0]; s.x = q.x; s.z = q.z; s.vx = s.vz = 0; s.hunger = 0.9; s.state = 'idle'; s.pen = null; s.fear = s.stress = 0;
    P.bot = { grab: true }; const ga = grassAt(q.x, q.z); run(10); out.eaten = +(ga - grassAt(q.x, q.z)).toFixed(2); out.hunger = +s.hunger.toFixed(2);
    // dropped lit on the ice: it melts, and a running sheep crosses it without a slide
    P.bot = {}; GAME.step(0.025); const m = ICES.slice().sort((a, c) => a.s - c.s)[0];
    t.x = m.x; t.z = m.z; t.h = 0; t.vx = t.vz = 0; t.lit = 3; const ik0 = iceK(m.x, m.z); run(3); out.ice = [+ik0.toFixed(2), +iceK(m.x, m.z).toFixed(2)];
    const r = living()[2]; r.x = m.x - 0.6; r.z = m.z; r.vx = 4; r.vz = 0; r.state = 'flee'; r.fear = 1; r.fdx = 1; r.fdz = 0; r.slipCd = 0; let slid = false;
    for (let k = 0; k < 0.3; k += 0.025) { GAME.step(0.025); if (r.slide) slid = true; } out.slid = slid;
    // a lit one into a camp's cold fire: it's lit
    const f0 = PASS.fires[0]; f0.fuel = 0; t.x = f0.x + 0.4; t.z = f0.z; t.lit = 2; GAME.step(0.025); out.lights = f0.fuel > 0;
    // it burns out
    t.lit = 0.01; t.x = f0.x + 6; t.z = f0.z; f0.fuel = 0; run(1); out.out = !(t.lit > 0);
    // carried off the mountain: back to its camp
    const low = pathPoint(T.pass.s0 - 60, 0); t.x = low.x; t.z = low.z; GAME.step(0.025); out.homeAgain = Math.hypot(t.x - t.home.x, t.z - t.home.z) < 0.1 && !t.by;
    // a new journey: all snow again, every stick home, unlit
    resetPass(); out.reset = MELTV.every(v => MELT[v] === 0) && TORCHES.every(o => !o.by && !(o.lit > 0) && o.x === o.home.x);
    return out;
  });
  ok(`a stick lies by the base camp's fire (${r.home} m), unlit; a dog grabs it`, r.unlit && r.home < 4 && r.held, r);
  ok(`dipped in the fire: alight (${r.litT} s)`, r.litT >= 0, r);
  ok(`carried up into the snow it melts it (${r.melt}): grass under it (cap ${r.cap.join(' → ')}, grass ${r.grass.join(' → ')})`, r.melt > 0.9 && r.cap[1] > r.cap[0] + 0.25 && r.grass[1] > r.grass[0] + 0.2, r);
  ok(`a hungry sheep eats there (${r.eaten} gone, hunger ${r.hunger})`, r.eaten > 0.05 && r.hunger < 0.9, r);
  ok(`lying lit on the ice it melts it (${r.ice.join(' → ')}): a running sheep crosses without a slide`, r.ice[0] > 0.9 && r.ice[1] < 0.1 && !r.slid, r);
  ok('a lit one lights a camp\'s cold fire; it burns out; carried off the mountain it\'s back at its camp; a new journey: all snow, sticks home', r.lights && r.out && r.homeAgain && r.reset, r);
}

if (!only || only === 'melt') {
  const r = await ev(() => {
    const { G, PASS, pathPoint, meltAt, meltDisc, grassCapAt, grassAt, MELT, MELTV } = GAME, out = {};
    const f = PASS.fires[1]; setup(f.s + 20, { hour: 10, hankS: f.s + 10 }); f.fuel = 8;
    run(26); out.camp = +meltAt(f.x + 3, f.z + 1).toFixed(2); f.fuel = 0;
    // melted snow up the trail: slowly it snows over again (a few hours); a blizzard buries it fast, the grass with it
    const q = [...Array(40).keys()].map(k => pathPoint(f.s + 30 + k, 4 + (k % 3))).find(p => GAME.iceK(p.x, p.z) === 0 && !GAME.crevAt(p.x, p.z, 4) && GAME.sdfAt(p.x, p.z) > 3);
    meltDisc(q.x, q.z, 3, 2, 1); const cap1 = grassCapAt(q.x, q.z);
    run(13); out.slow = +meltAt(q.x, q.z).toFixed(2);
    PASS.blizz.next = 0; run(60, () => meltAt(q.x, q.z) < 0.05); out.blizz = +meltAt(q.x, q.z).toFixed(2); out.cap = [+cap1.toFixed(2), +grassCapAt(q.x, q.z).toFixed(2)]; out.grass = +grassAt(q.x, q.z).toFixed(2);
    return out;
  });
  ok(`a lit fire melts its camp (${r.camp})`, r.camp > 0.5, r);
  ok(`melted snow snows over slowly (an hour: 1 → ${r.slow}); a blizzard buries it (→ ${r.blizz}), the grass too (cap ${r.cap.join(' → ')})`, r.slow > 0.85 && r.slow < 1 && r.blizz < 0.06 && r.cap[1] < r.cap[0] - 0.25 && r.grass <= r.cap[1] + 0.01, r);
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

if (!only || only === 'cave') {
  const r = await ev(() => {
    const { G, T, PASS, CAVE, YETI, SIDE, SNOWBALLS, HANK, living, snowballRoll, punt, ignite, caveD, inCave, sdfAt, fireSpots, findPath, pathPoint } = GAME, out = {};
    const f = PASS.fires.find(o => o.top), H = SIDE.home, C = CAVE, da = a => Math.abs(Math.atan2(Math.sin(a - C.a), Math.cos(a - C.a)));
    out.inCave = !!f.cave && caveD(f.x, f.z) < 0.01 && Math.abs(C.ax * (H.x - C.x) + C.az * (H.z - C.z) - Math.hypot(H.x - C.x, H.z - C.z)) < 0.01;
    out.mouth = +Math.hypot(C.x + C.ax * C.r - H.x, C.z + C.az * C.r - H.z).toFixed(1);   // his spot to its mouth
    // walled all round but its mouth; warm places round the fire; a way in from the trail through the mouth
    let wall = 0, wn = 0, gap = 0, gn = 0; for (let a = 0; a < 6.28; a += 0.05) { const x = C.x + Math.cos(a) * (C.r + C.th * 0.55), z = C.z + Math.sin(a) * (C.r + C.th * 0.55); if (da(a) > C.mouth + 0.12) { wn++; if (sdfAt(x, z) < 0) wall++; } else if (da(a) < C.mouth - 0.3) { gn++; if (sdfAt(x, z) > 0.4) gap++; } }
    out.walled = +(wall / wn).toFixed(2); out.open = +(gap / gn).toFixed(2); out.spots = fireSpots(f).length;
    const st = pathPoint(f.s - 14, 2), fp = findPath(st.x, st.z, f.x + C.ax * 1.5, f.z + C.az * 1.5, 100000); out.way = !!fp && Math.hypot(fp.at(-1).x - f.x, fp.at(-1).z - f.z) < 2.5;
    const tc = GAME.TORCHES[f.i]; out.stick = inCave(tc.x, tc.z) && caveD(tc.x, tc.z) > 1.5;   // its stick: in it, by the fire
    // the flock comes up: Hank lights it, and keeps in it while he's up; its stick dipped in it: alight
    setup(f.s - 26, { hour: 11, hankS: f.s - 32 }); out.litT = +run(40, () => f.fuel > 0).toFixed(1); out.hankIn = inCave(HANK.x, HANK.z, 0.5);   // (lit from in it)
    tc.x = f.x + 0.5; tc.z = f.z; tc.h = 0; GAME.step(0.025); out.torch = tc.lit > 0; GAME.torchHome(tc);
    YETI.state = 'sleep'; YETI.beaten = false; const d = G.dogs[0], q = pathPoint(T.pass.arena + 6, 4); d.x = q.x; d.z = q.z; run(1); YETI.next = 1e9; YETI.buttCd = 1e9;
    HANK.x = f.x - C.ax * 8; HANK.z = f.z - C.az * 8; HANK.goal = null; out.shelterT = +run(25, () => inCave(HANK.x, HANK.z, 0.5)).toFixed(1); run(1); out.shelter = YETI.on && inCave(HANK.x, HANK.z, 0.5);   // (from right behind it: round to its mouth)
    if (!out.shelter) out.dbg = { on: YETI.on, st: YETI.state, hk: [+(HANK.x - f.x).toFixed(1), +(HANK.z - f.z).toFixed(1)], goal: HANK.goal && [+(HANK.goal.x - f.x).toFixed(1), +(HANK.goal.z - f.z).toFixed(1), !!HANK.goal.fire], care: HANK.care && HANK.care.kind, asleep: HANK.asleep, air: !!HANK.air, slide: !!HANK.slide, mode: G.mode, h: G.clock.hour };
    // a snowball at a sheep in it: smashed on it, the sheep's fine
    const L = living().filter(o => !o.ram && !o.lamb), s = L[0]; s.x = f.x + C.ax * 2.2 - C.az * 1.2; s.z = f.z + C.az * 2.2 + C.ax * 1.2; s.vx = s.vz = 0; s.state = 'idle'; s.pen = null;
    const bx = YETI.x + C.ax * -2.6, bz = YETI.z + C.az * -2.6, bl = Math.hypot(s.x - bx, s.z - bz); SNOWBALLS.length = 0;
    const sx = s.x, sz = s.z, b = snowballRoll(bx, bz, (s.x - bx) / bl * T.yeti.roll, (s.z - bz) / bl * T.yeti.roll); let hit = false, at = null;
    for (let t = 0; t < 6 && SNOWBALLS.includes(b); t += 0.025) { const px = b.x, pz = b.z; if (!s.air) { s.x = sx; s.z = sz; s.vx = s.vz = 0; } GAME.step(0.025); if (!SNOWBALLS.includes(b)) at = caveD(px, pz); if (b.hit.has(s)) hit = true; }
    out.ball = { hit, at: at && +at.toFixed(1) };
    // his butt can't reach in: him at the end of his leash toward it, a dog just inside its mouth
    YETI.buttCd = 0; YETI.state = 'idle'; YETI.hurtT = 0; let butted = false;
    living().forEach((o, i) => { if (o.air || o.burn > 0) return; o.x = C.x - C.ax * 3 + (i % 4 - 1.5) * 0.9; o.z = C.z - C.az * 3 + (Math.floor(i / 4) - 1.5) * 0.9; o.vx = o.vz = 0; });   // (the flock at the back of it)
    for (let t = 0; t < 4; t += 0.025) { YETI.x = H.x - C.ax * T.yeti.leash; YETI.z = H.z - C.az * T.yeti.leash; d.x = C.x + C.ax * (C.r - 0.6); d.z = C.z + C.az * (C.r - 0.6); d.vx = d.vz = 0; GAME.step(0.025); if ((YETI.state === 'windup' || YETI.state === 'butt') && YETI.target === d || d.air) butted = true; }
    out.butted = butted;
    // a burning sheep punted from its mouth (the fire's side): it hits him
    YETI.x = H.x; YETI.z = H.z; YETI.state = 'idle'; YETI.buttCd = 1e9; YETI.next = 1e9; YETI.hurtT = 0; const hp0 = YETI.hp, k = L[1];
    k.x = C.x + C.ax * (C.r - 1.2); k.z = C.z + C.az * (C.r - 1.2); k.vx = k.vz = 0; k.pen = null; ignite(k);
    const ux = YETI.x - k.x, uz = YETI.z - k.z, ul = Math.hypot(ux, uz); d.x = k.x - ux / ul; d.z = k.z - uz / ul; d.pdx = ux / ul; d.pdz = uz / ul; d.pounceT = 0.2; d.air = null; punt(k, d, ux / ul, uz / ul);
    for (let t = 0; t < 3 && k.air; t += 0.025) GAME.step(0.025);
    out.punt = { from: +ul.toFixed(1), hp: [hp0, YETI.hp] };
    return out;
  });
  ok(`the top fire's in the ice cave, its mouth toward him (${r.mouth} m off his spot: past his reach, in a punt's)`, r.inCave && r.mouth > 11.5 && r.mouth < 17, r);
  ok(`walled all round (${r.walled}) but its mouth (${r.open} open); ${r.spots} warm places round the fire; a way in; its stick in it, lit in its fire`, r.walled > 0.95 && r.open > 0.9 && r.spots >= 16 && r.way && r.stick && r.torch, r);
  ok(`Hank lights it as the flock comes up (${r.litT} s), and keeps in it while he's up (from behind it: in in ${r.shelterT} s)`, r.litT >= 0 && r.hankIn && r.shelter, r);
  ok(`a snowball at a sheep in it smashes on it (${r.ball.at} m from its middle): the sheep's fine`, !r.ball.hit && r.ball.at !== null && r.ball.at < 9.5, r.ball);
  ok('his butt can\'t reach in (him at the end of his leash)', !r.butted, r);
  ok(`a burning sheep punted from its mouth (${r.punt.from} m) hits him: hp ${r.punt.hp.join(' → ')}`, r.punt.hp[1] === r.punt.hp[0] - 1, r.punt);
}

if (!only || only === 'nag') {
  const r = await ev(() => {
    const { G, T, PASS, CAVE, YETI, HANK, YETI_NAGS, living, ignite, punt, yetiStruck, yetiBeaten, resetPass, pathPoint } = GAME, out = {}, K = T.yeti.nag;
    const f = PASS.fires.find(o => o.top);
    setup(T.pass.arena - 8, { yeti: true, hour: 11, dogS: T.pass.arena + 4 }); f.fuel = 9; const d = G.dogs[0];
    run(1); YETI.next = 1e9; YETI.buttCd = 1e9; HANK.x = CAVE.x; HANK.z = CAVE.z;
    const all = Object.entries(YETI_NAGS).flatMap(([k, L]) => L.map((t, i) => [t, k, i])), said = () => HANK.log.filter(l => l.said && all.some(a => a[0] === l.text)).map(l => { const a = all.find(a => a[0] === l.text); return [a[1], a[2], +l.t.toFixed(0)]; });
    const t0 = G.time; HANK.log.length = 0;
    run(K.first + 1); out.first = said();
    run(K.every + 1); out.second = said();
    // a pounce off him (not within the cooldown, then after it)
    const pounce = () => { d.x = YETI.x - 2; d.z = YETI.z; d.vx = d.vz = 0; d.air = null; d.stunT = 0; d.pounceCD = 0; G.players[0].bot = toward(1, 0, { pounce: true }); GAME.step(0.025); G.players[0].bot = {}; run(0.4); };
    pounce(); out.soon = said().length;
    run(K.cd + 0.5); pounce(); run(0.6); out.pounce = said().at(-1);
    // a cold sheep thrown at him
    run(K.cd + 0.5); const s = living().filter(o => !o.ram)[0]; s.x = YETI.x - 7; s.z = YETI.z; s.vx = s.vz = 0; s.burn = 0; d.x = s.x - 1; d.z = s.z; d.pdx = 1; d.pdz = 0; d.pounceT = 0.2; punt(s, d, 1, 0);
    for (let t = 0; t < 3 && s.air; t += 0.025) GAME.step(0.025); run(1); out.cold = said().at(-1);
    // it tops out
    YETI.nag.tier = 40; YETI.nag.cd = 0; YETI.nag.t = 1e3; run(0.5); out.top = YETI.nag.tier;
    // a hit: a cheer, back a few tiers
    const k = living().filter(o => !o.ram)[1]; k.x = YETI.x - 7; k.z = YETI.z; k.vx = k.vz = 0; ignite(k); YETI.hurtT = 0; d.x = k.x - 1; d.z = k.z; d.pdx = 1; d.pdz = 0; d.pounceT = 0.2; punt(k, d, 1, 0);
    for (let t = 0; t < 3 && k.air; t += 0.025) GAME.step(0.025); run(1.5); out.hit = { hp: YETI.hp, tier: YETI.nag.tier, cheer: HANK.log.some(l => l.said && /felt that|Roast him|That's the way/.test(l.text)) };
    // beaten: no more
    yetiBeaten('fire'); HANK.log.length = 0; run(K.every * 1.5); out.after = said().length;
    resetPass(); out.reset = YETI.nag.tier === 0 && YETI.nag.n === 0;
    out.K = { tiers: K.tiers, back: K.back };
    return out;
  });
  ok(`a line in (${JSON.stringify(r.first)}), then on a timer, snarkier (${JSON.stringify(r.second.at(-1))})`, r.first.length === 1 && r.first[0][0] === 'time' && r.first[0][1] === 0 && r.second.length === 2 && r.second[1][1] === 1, r);
  ok(`a pounce off him: not within the cooldown (${r.soon}), then a line on it (${JSON.stringify(r.pounce)})`, r.soon === 2 && r.pounce && r.pounce[0] === 'pounce' && r.pounce[1] === 2, r);
  ok(`a cold sheep at him: a line on it (${JSON.stringify(r.cold)})`, r.cold && r.cold[0] === 'cold' && r.cold[1] === 3, r);
  ok(`it tops out at ${r.top + 1} tiers; a hit: a cheer, back to tier ${r.hit.tier}`, r.top === r.K.tiers - 1 && r.hit.hp === 2 && r.hit.cheer && r.hit.tier === r.top - r.K.back, r);
  ok(`beaten: no more (${r.after}); a new journey: from the top`, r.after === 0 && r.reset, r);
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
    // its heap: a way over the rim from the hidden ledge to his spot, short; up on its stones, walked along it
    const H = SIDE.home, fp = GAME.findPath(L.x, L.z, H.x, H.z, 200000); let way = 0, px = L.x, pz = L.z; for (const q of fp || []) { way += Math.hypot(q.x - px, q.z - pz); px = q.x; pz = q.z; }
    const mid = { x: R.x + Math.sin(R.dir) * R.len * 0.4, z: R.z + Math.cos(R.dir) * R.len * 0.4 }, bump = GAME.groundY(mid.x, mid.z) - GAME.terrainH(mid.x, mid.z);
    d.x = L.x; d.z = L.z; d.vx = d.vz = 0; d.air = null; d.slide = null; const P = G.players[0];
    const t = run(20, () => { P.bot = toward(H.x - d.x, H.z - d.z); return Math.hypot(H.x - d.x, H.z - d.z) < 2.5; }); P.bot = {};
    return { cracks, state: R.state, yeti: YETI.state, how: YETI.how, beaten: YETI.beaten, thawed: !finalPen.frozen, way: +way.toFixed(0), crow: +Math.hypot(H.x - L.x, H.z - L.z).toFixed(0), bump: +bump.toFixed(2), t: +t.toFixed(1) };
  });
  ok(`three sheep into the rock wall: cracks ${r.cracks.join(' → ')}, it falls on him (${r.yeti})`, r.cracks.join() === '1,2,3' && r.state === 'down' && r.yeti === 'crushed' && r.how === 'rock', r);
  ok('his cave thaws', r.beaten && r.thawed, r);
  ok(`its heap's a way over the rim: the hidden ledge to his spot ${r.way} m (${r.crow} as the crow flies), up on its stones (${r.bump} m), a dog walks it in ${r.t} s`, r.way > 0 && r.way < r.crow * 1.5 && r.bump > 0.4 && r.t >= 0, r);
}

if (!only || only === 'entry') {
  const r = await ev(() => {
    const { G, T, DOOR, SIDE, living, punt, findPath, pathPoint, sdfAt, groundY, terrainH, resetPass, CAM_R, CAM_F } = GAME, out = {};
    setup(SIDE.s0 - 6, { lat: -6, hour: 10, dogS: SIDE.s0 - 2, dogLat: -8 });
    const L = SIDE.ledge, R = DOOR, fx = Math.sin(R.yaw), fz = Math.cos(R.yaw), reach = () => { const st = pathPoint(SIDE.s0 - 8, 0), q = findPath(st.x, st.z, L.x, L.z, 400000); return !!(q && q.length) && Math.hypot(q.at(-1).x - L.x, q.at(-1).z - L.z) < 1.5; };
    out.stand = R.state; out.shut = !reach() && sdfAt(R.x, R.z) < 0;
    const hq = pathPoint(SIDE.s0 + 2, 2); GAME.HANK.x = hq.x; GAME.HANK.z = hq.z; GAME.HANK.goal = null; run(2); out.seen = GAME.HANK.log.some(l => l.said && /wall/.test(l.text));
    // a dog's pounce: it wobbles, the dog bounces back; it never falls
    const d = G.dogs[0], P = G.players[0]; let wob = 0, back = false;
    for (let k = 0; k < 4; k++) {
      d.x = R.x - fx * 2.2; d.z = R.z - fz * 2.2; d.vx = d.vz = 0; d.air = null; d.stunT = 0; d.pounceCD = 0; d.yaw = R.yaw;
      P.bot = toward(fx, fz, { pounce: true }); GAME.step(0.025); P.bot = {};
      for (let t = 0; t < 0.6; t += 0.025) { GAME.step(0.025); GAME.syncPass(0.025); wob = Math.max(wob, R.wob || 0); if ((d.x - R.x) * fx + (d.z - R.z) * fz < -2.4) back = true; }
    }
    out.pounce = { wob: +wob.toFixed(2), back, state: R.state, cracks: R.cracks };
    // two sheep flung into it: down, up the road
    const cr = [];
    for (let k = 0; k < T.yeti.door.cracks; k++) {
      const s = living().filter(o => !o.ram)[k]; s.x = R.x - fx * 3.4; s.z = R.z - fz * 3.4; s.vx = s.vz = 0; s.pen = null; s.air = null;
      d.x = s.x - fx; d.z = s.z - fz; d.pdx = fx; d.pdz = fz; d.pounceT = 0.2; punt(s, d, fx, fz);
      for (let t = 0; t < 2 && s.air; t += 0.025) GAME.step(0.025);
      cr.push(R.cracks); run(0.7);
    }
    run(2.5); out.cracks = cr; out.state = R.state;
    // the way's open: a dog walks up the road, over its heap, past where it stood
    out.open = reach(); const mid = { x: R.x + fx * R.len * 0.4, z: R.z + fz * R.len * 0.4 }; out.bump = +(groundY(mid.x, mid.z) - terrainH(mid.x, mid.z)).toFixed(2);
    d.x = R.x - fx * 5; d.z = R.z - fz * 5; d.vx = d.vz = 0; d.air = null; d.slide = null; const g = { x: R.x + fx * (R.len + 3), z: R.z + fz * (R.len + 3) };
    out.t = +run(15, () => { P.bot = toward(g.x - d.x, g.z - d.z); return Math.hypot(g.x - d.x, g.z - d.z) < 2; }).toFixed(1); P.bot = {};
    resetPass(); out.again = R.state === 'stand' && !reach() && sdfAt(R.x, R.z) < 0 && !GAME.HEAP2.on;
    return out;
  });
  ok('the door stands in the side trail\'s mouth: no way up to the ledge; Hank wonders at it', r.stand === 'stand' && r.shut && r.seen, r);
  ok(`a dog's pounce: it wobbles (${r.pounce.wob}), the dog bounces back; never falls (×4: ${r.pounce.state}, ${r.pounce.cracks} cracks)`, r.pounce.wob > 0.5 && r.pounce.back && r.pounce.state === 'stand' && r.pounce.cracks === 0, r.pounce);
  ok(`sheep flung into it: cracks ${r.cracks.join(' → ')}, it falls (${r.state})`, r.cracks.join() === '1,2' && r.state === 'down', r);
  ok(`the way's open: up to the ledge; a dog walks over its heap (${r.bump} m) in ${r.t} s`, r.open && r.bump > 0.3 && r.t >= 0, r);
  ok('a new journey: it stands again, in the way', r.again, r);
}

if (!only || only === 'side') {
  const r = await ev(() => {
    const { G, SIDE, living, findPath, sdfAt, sideD, step, CAM_R, CAM_F, pathPoint, trailInfo } = GAME;
    GAME.resetPass();   // (the rock wall up again: after 'rock' its heap's a way over the rim)
    const down = () => { GAME.wallFall(GAME.DOOR); GAME.DOOR.t = 99; GAME.updateWall(GAME.DOOR, 0.01); }; down();   // (its door down: 'entry')
    // across it every 2 m: free width (cells walkable, on it)
    let narrow = 1e9; for (let i = 6; i < SIDE.pts.length - 6; i += 4) { const a = SIDE.pts[i - 2], b = SIDE.pts[i + 2], l = Math.hypot(b.x - a.x, b.z - a.z), wx = (b.z - a.z) / l, wz = -(b.x - a.x) / l, p = SIDE.pts[i]; let f = 0; for (let o = -8; o <= 8; o += 0.25) if (sdfAt(p.x + wx * o, p.z + wz * o) > 0 && sideD(p.x + wx * o, p.z + wz * o) < SIDE.hw) f += 0.25; narrow = Math.min(narrow, f); }
    const H = SIDE.home, L = SIDE.ledge, hp = findPath(H.x, H.z, L.x, L.z, 400000); let way = 0, px = H.x, pz = H.z; for (const q of hp) { way += Math.hypot(q.x - px, q.z - pz); px = q.x; pz = q.z; }
    setup(SIDE.s0 - 40, { lat: 4, hour: 9, dogS: SIDE.s0 - 26 }); down();
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
