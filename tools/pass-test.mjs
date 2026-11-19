// Headless test: `node tools/pass-test.mjs [layout|cold|fire|camp|hank|blizzard|torch|melt|path|ice|crev|crevyeet|yeti|cave|fires|fight|nag|rock|entry|side|gate|burn|finish|uphill]`. MOUNTAIN PASS.
//   layout    past the Trading Post (no longer the end, no Cabo) the trail climbs: the floor rises, walls close in; fire camps level;
//             ice, cracks; a way up to the yeti's cave (iced shut); the hidden side trail to its ledge by the rock wall (shut by its door
//             till that's down); nothing else up there
//   cold      in the pass a shorn sheep gets colder than a full fleece, snow on it colder still; out of the pass it thaws; frozen too long: dead
//   fire      Hank lights the fire camp the flock's at; the coldest take the places round it and warm up
//   camp      round each fire camp nothing stands between the fire and the ground near it (no corner to get stuck in; the ice cave's: inside it); warm a long way out;
//             the base camp at the foot of the climb: lit from the start (no Hank), still lit a day on
//   torch     a dog grabs a camp's stick, dips it in the lit fire: alight; carried up into the snow it melts it: grass under it, eaten;
//             lying lit on the ice: the ice melts, no slide; a lit one lights a cold camp's fire; it burns out; off the mountain: home again
//   melt      a lit fire melts its camp; melted snow snows over slowly, in a blizzard fast (the grass buried again); a new journey: all snow
//   path      (seeded) a path melted up the snow, veering off to one side: the flock keeps to it, left alone and driven (was: up the middle, in
//             the snow); the grass alone (path off) much less
//   hank      the fire before anything: lit before a patient's seen to; no burials up here; the next fire up, not one left behind;
//             asleep by one burning low: up to stoke it
//   blizzard  only for hanging about: the dog idle by day, idle h on (Hank warns first); on the move, or by night: none; it piles snow on
//             them; running shakes it off; a fire melts it
//   ice       onto the ice: a sheep, a dog, Hank slide downhill and stop; a calm sheep goes round
//   crev      a sheep in a crack: grabbed out; a dog mashes pounce out (alone or not), each press costs stamina, none left: stuck till
//             rested; a friend can grab it out
//   crevyeet  a sheep in a crack: a pounce yeets it out across it; the dog stops on the lip (last: off the others' dice)
//   yeti      he wakes at the top; snowballs roll, grow and bowl a dog over; too close: a headbutt; burning sheep bonked into him ×3: beaten
//   cave      the ice cave: set into the east rim across from the hidden side trail's door, far from him; walled but its mouth, level,
//             places for 50 and more, its stick in it, no ice or crack from it up to him; the flock comes up cold: Hank lights its hearth,
//             every one goes in and warms (warm all through); nobody catches in the hearth; by night the flock comes in on its own, Hank
//             asleep in it; the yeti up, the flock in his arena: back down into it on its own, to stay; Hank lights his campfire and goes
//             back; a dog walks in among them: they keep to it; a snowball at a sheep in its mouth smashes on it; a burning sheep and a
//             lit torch against its ice: it holds; fifty sheep, cold: every one in it at once
//   fires     every campfire up there's real: a lit torch lights it, it lights a torch, it's warm, its stick by it, a sheep in it catches
//             (not in the hearth); no pen's for-show fire; the yeti's campfire: in the open, past his reach, a punt from him; a sheep
//             carried into it catches, bonked at him from by it: a hit; his pen's campfire: Hank lights it once he's beaten
//   fight     (seeded) the whole fight, a dog on its own (a bot): sheep fetched from the cave, lit in his campfire, bonked into him ×3:
//             beaten, nobody lost
//   nag       Hank, while you're not getting it: a line in, then on a timer, snarkier each time; a pounce off him, a cold sheep at him: a
//             line on it (not within the cooldown); tops out; a hit: a cheer, back a few tiers; not over a line that matters, nor right
//             after another nag (the gate's); beaten: no more; a new journey: from the top
//   rock      three sheep flung into the rock wall up the side trail: it falls on him (an arm sticks out), his cave thaws; its heap's a
//             way over the rim: from the hidden ledge to his spot, walked over (up on its stones)
//   entry     the door in the side trail's mouth: in the way (no way up to the ledge); a dog's pounce: a wobble, a bounce, never a fall;
//             two sheep flung into it: down, up the road; the way's open, walked over its heap; a new journey: up again
//   side      the side trail is a road (≥5 m across all the way, no way onto its ledge but up it); a dog walking behind 5 sheep (the
//             rest left below) drives them off the floor, up it and onto the ledge
//   gate      the ice gate past the base camp: wall to wall; a dog sprinting up it and a driven sheep thrown back down; Hank: "Grab the
//             torch…", then nags, further and further apart; the flock up past it, no lane: Hank waits by the base camp's fire; its torch lit,
//             carried up: a lane (his lines), Hank and a sheep up it, a blizzard doesn't shut it; a dev jump melts it; a new journey: iced
//   burn      a sheep carried into a fire: alight, too hot to hold, runs mad, rolls it out, singed; alight it melts the snow and the gate's ice
//   uphill    (UP, seeded, on vs off) left alone the flock goes up to a lit camp 30 m up, not onto the ice or into a crack; 30 m past
//             the base camp it goes on up (3 goes, every one; it used to go back down: the middle one of 3); a dog walking up behind drives it faster, ≤1 back past it (3 goes of 4);
//             pressed from either side it veers up; cold, 15 m past a lit fire, it doesn't go back down to it (the ice gate melted for
//             these); the ice gate up, no lane: it waits at its foot (was: back down), none onto the ice; a lane through: up it, on up
//   finish    the yeti beaten: the ice goes from the gap in the east rim; the cave's a pen; through the gap and onto the harbour road: Cold Harbour wakes, nobody moved (SAILING)
// Checks: the pass: climb, walls, camps, ice, cracks, side trail, nothing else up there; cold by fleece and snow, thaw, frozen death; Hank
//   lights a fire, the coldest warm by it; no corner by any fire, warm far out, the base camp lit from the start; a torch lit in a
//   fire melts the snow (grass, eaten) and the ice (no slide), lights a cold fire, burns out, goes home; a fire melts its camp, snow back
//   slowly / in a blizzard; a melted path: the flock keeps to it; the fire before a patient, no burials up there, the next fire not the last,
//   up at night to stoke it; a blizzard only for hanging about (Hank warns), snow, shaken off, melted; ice slides (sheep, dog, Hank), calm ones go round; cracks (sheep grabbed out, a dog mashes out alone or not,
//   stamina a press, none: stuck till rested; a friend grabs it out); yeti wakes, snowballs grow,
//   headbutt, 3 burning sheep; the ice cave (in the east rim across from the side trail's door, walled but its mouth, level, ≥ 55 places,
//   the floor clear up to him; the hearth lit by Hank, the flock in and warm, warm all through, nobody catches in it; in by night, Hank
//   asleep in it; from his arena back into it on its own, staying; Hank lights his campfire, goes back; a dog among them: none out; a
//   snowball smashes on it; its ice holds); every campfire real (torch lights it, it lights a torch, warm, burns but the hearth; no
//   for-show fire), the yeti's campfire in the open past his reach in a punt's, a sheep lit in it and bonked: a hit, his pen's lit by
//   Hank once he's beaten; the whole fight by a bot (beaten, nobody lost); nags (a line in, on a timer, on a
//   pounce / a cold sheep, cooldown, tops out, a hit: back, not over a line that matters or right after the gate's, beaten: none, reset);
//   the rock wall falls on him; the door (in the way, a pounce wobbles it, 2 sheep: down, the way open, up again); side trail ≥5 m wide,
//   ledge only up it, 5 sheep driven up; the ice gate: wall to wall, a dog / a driven sheep thrown back down it, Hank's "grab the torch"
//   then nags ≥ `nag` s apart, he waits at the base camp, a lit torch carried up melts a lane (his lines), then Hank and a sheep up it, no
//   blizzard shuts it, a dev jump melts it, reset, a friend's ice from the host's; burning sheep (melt the snow, the gate's ice); the yeti
//   beaten: the gap's ice gone, his cave a pen, through the gap Cold Harbour wakes (nobody moved), iced again; the fallen rock's heap a way
//   from the ledge; uphill (seeded, UP on vs off): left alone up to a lit camp 30 m up and past the base camp up (was: back down), none onto
//   the ice or into a crack, a dog walking behind drives it faster (≤1 back past it, 3 goes of 4), from the side it veers up, the cold not
//   back to a fire behind; the ice gate up: it waits at its foot, none onto it; a lane through: up it
import { open } from './harness.mjs';
const only = process.argv[2];
const h = await open();
let fail = 0;
const ok = (name, cond, info) => { if (!cond) fail++; console.log(cond ? 'ok  ' : 'FAIL', name, cond ? '' : JSON.stringify(info)); };
const ev = (f, a) => h.page.evaluate(f, a);
// a fresh journey; the flock and the dog dropped at s along the trail, by day; blizzards and the yeti off unless asked
await ev(() => {
  window.T_ = GAME.T;
  window.setup = (s, o = {}) => {
    const { G, T, startGame, resetGame, pathPoint, living, PASS, HANK } = GAME;
    if (G.mode === 'title') startGame({ kind: 'bot', index: 0 }); else resetGame();
    while (G.players.length > 1) GAME.dropPlayer(G.players[G.players.length - 1]);
    G.players[0].bot = {}; T.falcon.on = false; T.cast.on = false;
    PASS.blizz.next = o.blizz ? 0 : 1e9;
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
    const { T, PASS, ICES, CREVS, SIDE, POST, FINAL, CAMPS, pens, MARKET, liftAt, sdfAt, pathPoint, findPath, terrainH, sAt, passK, PATH_LEN, DENS, NESTS, PLANTS, SALT_ROCKS, BRAMBLES, DIGS, SNAKES, GROVES, APPLE_TREES, YETI, ROCK } = GAME;
    const P = T.pass, inP = list => list.filter(o => passK(sAt(o.x, o.z)) > 0.3).length;
    const free = s => { let f = 0; for (let l = -40; l <= 40; l += 0.5) { const p = pathPoint(s, l); if (sdfAt(p.x, p.z) > 0) f += 0.5; } return f; };
    const fp = PASS.fires.map(f => { let mx = 0; for (let a = 0; a < 6.3; a += 0.5) mx = Math.max(mx, Math.abs(terrainH(f.x + Math.cos(a) * 4, f.z + Math.sin(a) * 4) - terrainH(f.x, f.z))); return { lvl: +mx.toFixed(2), sdf: +sdfAt(f.x, f.z).toFixed(1), kind: f.hearth ? 'hearth' : f.pen ? 'pen' : f.top ? 'yeti' : f.base ? 'base' : 'camp' }; });
    const cave = pens.find(p => p.final), post = pens.find(p => p.camp.post), a = { x: post.exitX, z: post.exitZ };
    const path = findPath(a.x, a.z, cave.exitX, cave.exitZ, 400000), sp = SIDE.pts[0], L = SIDE.ledge, reach = () => { const q = findPath(pathPoint(SIDE.s0 - 8, 0).x, pathPoint(SIDE.s0 - 8, 0).z, L.x, L.z, 400000); return !!(q && q.length) && Math.hypot(q.at(-1).x - L.x, q.at(-1).z - L.z) < 1.5; };
    const shut = !reach(); GAME.DOOR.state = 'down'; GAME.doorStamp(false); const open = reach(), side = open && shut; GAME.resetPass();
    return { post: POST.s, fin: FINAL.s, len: PATH_LEN, postFinal: !!post.final, caveFinal: !!cave.final, frozen: !!cave.frozen, market: MARKET.s < POST.s && MARKET.wares.every(w => w.id !== 'cabo'),
      lift: [P.s0, 1250, 1350, P.top, FINAL.s].map(s => +liftAt(s).toFixed(1)), freeLow: free(1100), freePass: Math.max(...[1220, 1320, 1420].map(free)), fires: fp,
      ices: ICES.length, crevs: CREVS.length, goats: GAME.GOATS ? GAME.GOATS.length : 0, path: !!(path && path.length), side, shut, open, ledge: +sdfAt(SIDE.ledge.x, SIDE.ledge.z).toFixed(1),
      wall: Math.max(...[8, 12, 16].map(o => { const p = pathPoint(1300, -(P.hwW + o)); return terrainH(p.x, p.z) - liftAt(1300); })),
      rock: ROCK.state, yeti: YETI.state, inPass: { dens: inP(DENS), nests: inP(NESTS), plants: inP(PLANTS), salt: inP(SALT_ROCKS), brambles: inP(BRAMBLES), digs: inP(DIGS), snakes: inP(SNAKES), apples: inP(APPLE_TREES), groves: GROVES.filter(g => passK(g.s) > 0.3).length } };
  });
  ok(`the Trading Post (${r.post}) is a camp, not the end; its market sells no Cabo`, !r.postFinal && r.market, r);
  ok(`the yeti's cave (${r.fin.toFixed(0)}) is the end: its pen iced shut`, r.caveFinal && r.frozen, r);
  ok(`the floor climbs ${r.lift.join(' → ')} m`, r.lift[0] < 1 && r.lift[1] > 8 && r.lift[2] > r.lift[1] && r.lift[3] > 38 && Math.abs(r.lift[4] - r.lift[3]) < 1, r);
  ok(`the pass is narrower (${r.freePass} m) than the desert below (${r.freeLow} m); walls up the west side (${r.wall.toFixed(1)} m)`, r.freePass < r.freeLow && r.freePass < 34 && r.wall > 10, r);
  ok(`${r.fires.length} fires (${r.fires.map(f => f.kind).join(', ')}): the camps and the yeti's campfire level and clear, the hearth kerbed in its cave, his pen's by the pen`,
    r.fires.map(f => f.kind).sort().join() === 'base,camp,camp,hearth,pen,yeti' && r.fires.every(f => f.kind === 'hearth' ? f.sdf < 0 && f.lvl < 0.3 : f.kind === 'pen' ? f.sdf > 2 : f.lvl < 0.6 && f.sdf > 2), r.fires);
  ok(`${r.ices} ice patches, ${r.crevs} cracks; no goats`, r.ices >= 8 && r.crevs >= 5 && !r.goats, r);
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
    setup(985, { hour: 12 }); const d = living()[0]; d.cold = 0.8; run(20); out.thaw = +d.cold.toFixed(2);
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
        const d = Math.hypot(dx, dz); if (d > (f.cave ? GAME.CAVE.r : 10) || d < (f.hearth ? 2.4 : 2) || sdfAt(f.x + dx, f.z + dz) < 0.5) continue; n++;   // (THE ICE CAVE: inside it)
        let clear = true; for (let u = 0.1; u < 1; u += 0.05) if (!(f.hearth && d * u < 1.9) && sdfAt(f.x + dx * u, f.z + dz * u) < 0.3) { clear = false; break; }   // (its hearth: from its kerb)
        if (clear) seen++;
      }
      const f0 = f.fuel; f.fuel = 5; const heat = +heatAt(f.x + 8, f.z).toFixed(2); f.fuel = f0;
      return { s: f.s, base: !!f.base, seen: +(seen / n).toFixed(3), heat };
    });
    // the base camp: lit from the start of the journey, Hank nowhere near it; still burning a day on (and a reload: as ever)
    const b = PASS.fires.find(f => f.base); setup(b.s - 24, { hour: 10, hankS: b.s - 120 });
    const lit0 = b.fuel, hankD = Math.hypot(HANK.x - b.x, HANK.z - b.z), f1 = PASS.fires.find(f => !f.base && !f.top && !f.pen && !f.cave);
    run(2); f1.fuel = GAME.T.pass.burn; GAME.updatePass(0.025, GAME.T.pass.burn + 1); const lit1 = b.fuel, other = f1.fuel;   // (hours on: a camp's burnt out, not this one)
    return { camps, base: { s: b.s, snow: GAME.T.pass.snow, lit0: +lit0.toFixed(1), hankD: +hankD.toFixed(0), lit1: +lit1.toFixed(1), other, full: GAME.T.pass.burn } };
  });
  ok(`round every camp nothing in the way of the fire: ${r.camps.map(c => c.seen).join(', ')} of the ground near it sees it`, r.camps.every(c => c.seen > 0.96), r.camps);
  ok(`warm a long way out (8 m: ${r.camps.map(c => c.heat).join(', ')})`, r.camps.every(c => c.heat > 0.3), r.camps);
  ok(`the base camp at the foot of the climb (${r.base.s}): lit from the start (${r.base.lit0} h of fuel, Hank ${r.base.hankD} m off)`, r.base.lit0 >= r.base.full - 0.01 && r.base.hankD > 60 && r.base.s < r.base.snow, r.base);
  ok(`...and never out (${r.base.full + 1} h on: ${r.base.lit1} h; a camp's: ${r.base.other})`, r.base.lit1 >= r.base.full - 0.01 && r.base.other === 0, r.base);
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
    t.x = m.x - Math.sin(t.yaw) * T.torch.len * 0.3; t.z = m.z - Math.cos(t.yaw) * T.torch.len * 0.3; t.h = 0; t.vx = t.vz = 0; t.lit = 3; const ik0 = iceK(m.x, m.z); run(3); out.ice = [+ik0.toFixed(2), +iceK(m.x, m.z).toFixed(2)];   // (what it melts round: its tip end, on the patch's middle)
    const r = living()[2]; r.x = m.x - 0.6; r.z = m.z; r.vx = 4; r.vz = 0; r.slide = r.air = r.crev = null; r.pen = null; r.state = 'flee'; r.fear = 1; r.fdx = 1; r.fdz = 0; r.slipCd = 0; let slid = false;
    for (let k = 0; k < 0.3; k += 0.025) { r.vz = 0; r.z = m.z; GAME.step(0.025); if (r.slide) slid = true; } out.slid = slid;   // (straight across it, not off its edge)
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

if (!only || only === 'path') {
  const r = await ev(() => {
    const { G, T, PASS, ICES, CREVS, pathPoint, sAt, living, trailInfo, meltDisc, meltAt } = GAME;
    // a path melted up the snow from the flock (as a dog with a lit torch leaves one), veering off to one side (side × 8 m over 25 m), on
    // up past where it's measured. mode none: no path; grass: melted, but T.melt.path off (only the grass under it); on: as tuned.
    // Seeded (Math.random; G.time fixed): every mode sees the same dice. No ice or cracks. on: the share of sheep (in the band 8…62 m up)
    // within 2.5 m of its line, snow: the share in the snow
    const rand = Math.random, seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const ice = ICES.slice(), crev = CREVS.slice(), keep = T.melt.path.on; let nT = 0;
    const trial = (mode, s0, side, drive, secs) => {
      Math.random = seeded(7); G.time = 2e6 + ++nT * 1e4; ICES.length = CREVS.length = 0;
      setup(s0, { hour: 10, dogS: drive ? s0 - 12 : s0 - 60, hankS: s0 - 20 }); for (const f of PASS.fires) if (!f.base) f.fuel = 0;
      for (const o of living()) o.wool = 1;
      T.melt.path.on = mode === 'on'; const lat = s => side * 8 * Math.min(1, Math.max(0, (s - s0 - 4) / 25));
      if (mode !== 'none') for (let s = s0 - 4; s < s0 + 70; s += 0.7) { const m = pathPoint(s, lat(s)); meltDisc(m.x, m.z, 2.8, 1.4, 1); }
      const d = G.dogs[0], c0 = living().reduce((a, o) => a + sAt(o.x, o.z), 0) / living().length; let n = 0, on = 0, snow = 0;
      for (let t = 0; t < secs; t += 0.025) {
        if (drive) { const q = pathPoint(s0 - 10 + t * 1.2, 0), l = Math.hypot(q.x - d.x, q.z - d.z); G.players[0].bot = l > 0.6 ? toward(q.x - d.x, q.z - d.z, l < 3 ? { creep: true } : {}) : {}; }
        GAME.step(0.025);
        if (Math.round(t / 0.025) % 20 === 0) for (const o of living()) { const ti = trailInfo(o.x, o.z); if (ti.s < s0 + 8 || ti.s > s0 + 62) continue; n++; if (Math.abs(ti.lat - lat(ti.s)) < 2.5) on++; if (meltAt(o.x, o.z) < 0.3) snow++; }
      }
      G.players[0].bot = {}; const ds = living().reduce((a, o) => a + sAt(o.x, o.z), 0) / living().length - c0;
      return { on: +(on / Math.max(1, n)).toFixed(2), snow: +(snow / Math.max(1, n)).toFixed(2), ds: +ds.toFixed(1) };
    };
    const out = {};
    for (const [k, s0, side, drive, secs] of [['idle', 1290, 1, false, 70], ['driven', 1395, -1, true, 60]]) { out[k] = {}; for (const mode of ['none', 'grass', 'on']) out[k][mode] = trial(mode, s0, side, drive, secs); }
    ICES.push(...ice); CREVS.push(...crev); Math.random = rand; T.melt.path.on = keep;
    return out;
  });
  const f = o => `${o.on} on it, ${o.snow} in the snow`;
  ok(`left alone, a path veering off up the snow: the flock keeps to it (${f(r.idle.on)}; no path: ${f(r.idle.none)}; the grass alone: ${f(r.idle.grass)}), on up ${r.idle.on.ds} m`,
    r.idle.on.on >= 0.8 && r.idle.on.snow <= 0.15 && r.idle.on.on > r.idle.none.on + 0.3 && r.idle.on.on > r.idle.grass.on + 0.15 && r.idle.on.ds > 30, r.idle);
  ok(`driven up: the same (${f(r.driven.on)}; no path: ${f(r.driven.none)}; the grass alone: ${f(r.driven.grass)}), on up ${r.driven.on.ds} m`,
    r.driven.on.on >= 0.6 && r.driven.on.snow <= 0.35 && r.driven.on.on > r.driven.none.on + 0.3 && r.driven.on.on > r.driven.grass.on + 0.3 && r.driven.on.ds > 30, r.driven);
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
    const { G, T, PASS, living, pathPoint } = GAME, B = T.blizz, out = {};
    // hanging about: the dog idle by day; Hank warns, then idle h on it comes. On the move: none. By night: none
    const go = (hour, move) => {
      setup(1320, { hour }); PASS.blizz.next = B.idle; PASS.blizz.at.clear(); const d = G.dogs[0], P = G.players[0], ends = [pathPoint(1295, 0), pathPoint(1345, 0)]; let e = 0, h = 0, warnH = -1, t0 = G.clock.hour;
      run(B.idle * 18 * 2, () => { if (move) { const q = ends[e]; if (Math.hypot(q.x - d.x, q.z - d.z) < 2) e ^= 1; P.bot = toward(q.x - d.x, q.z - d.z); }
        h = (G.clock.hour - t0 + 24) % 24; if (warnH < 0 && PASS.said.blizzWarn) warnH = h; return PASS.blizz.on || h > B.idle * 1.3; });
      P.bot = {}; return { on: PASS.blizz.on, h: +h.toFixed(1), warnH: +warnH.toFixed(1) };
    };
    out.idle = go(9, false); out.move = go(9, true); out.night = go(21, false);
    setup(1320, { blizz: true, hour: 11 });
    run(2); const on = PASS.blizz.on; let k = 0;
    run(40, () => { k = Math.max(k, PASS.blizz.k); }); const L = living(), snow = L.reduce((a, s) => a + (s.snow || 0), 0) / L.length;
    const s = L[0], p = pathPoint(1320, 0), { ICES, CREVS } = GAME, ice = ICES.splice(0), crev = CREVS.splice(0); s.snow = 1; s.x = p.x; s.z = p.z;   // (the flock's drifted on up: back on clear floor, no ice or cracks to stop it)
    for (let t = 0; t < 2; t += 0.025) { s.state = 'flee'; s.fear = 1; s.fdx = p.tx; s.fdz = p.tz; GAME.step(0.025); }   // (up, away from the dog)
    const shed = s.snow; ICES.push(...ice); CREVS.push(...crev);
    PASS.blizz.on = false; PASS.blizz.next = 1e9; const f = PASS.fires[1], q = L[1]; f.fuel = 5; q.snow = 1; q.x = f.x + 2.2; q.z = f.z; run(4); 
    return { ...out, idleH: B.idle, warn: B.warn, on, k: +k.toFixed(2), snow: +snow.toFixed(2), shed: +shed.toFixed(2), melt: +q.snow.toFixed(2) };
  });
  ok(`the dog hanging about by day: Hank warns (${r.idle.warnH} h), a blizzard (${r.idle.h} h in)`, r.idle.on && r.idle.h >= r.idleH - 0.1 && r.idle.h < r.idleH + 0.5 && r.idle.warnH >= r.idleH - r.warn - 0.1 && r.idle.warnH < r.idle.h, r.idle);
  ok(`on the move (${r.move.h} h), or by night (${r.night.h} h): none`, !r.move.on && r.move.h > r.idleH * 1.2 && !r.night.on && r.night.h > r.idleH, r);
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
    // a dog alone: mash pounce, each press costs stamina
    const mash = n => { let k = 0; for (let i = 0; i < n && d.crev; i++) { G.players[0].bot = { pounce: true }; GAME.step(0.025); k++; G.players[0].bot = {}; GAME.step(0.025); } return k; };
    const fall = () => { d.x = c.x; d.z = c.z; d.vx = d.vz = 0; crevFall(d, c); };
    d.stamina = 1; d.exhausted = false; fall(); const dIn = !!d.crev;
    const presses = mash(30), climbed = !d.crev, spent = +(1 - d.stamina).toFixed(3);
    // no stamina: mashing does nothing (the bar flashes); rested, out
    fall(); d.stamina = 0; d.exhausted = true; const t0 = G.time; mash(14);
    const tired = { in: !!d.crev, esc: d.crevEsc, flash: d.crevTiredAt >= t0, st: +d.stamina.toFixed(2) };
    run(3); const rested = { st: +d.stamina.toFixed(2), ex: d.exhausted }; mash(30); const restOut = !d.crev;
    // with a friend about: mashing still gets it out; the friend can grab it out too
    const p2 = joinPlayer({ kind: 'bot', index: 1 }), o = p2.dog; p2.bot = {}; o.x = c.x + nx * 6; o.z = c.z + nz * 6;
    d.stamina = 1; d.exhausted = false; fall(); const teamPresses = mash(30), teamMash = !d.crev;
    fall();
    o.x = d.x + nx * 1.9; o.z = d.z + nz * 1.9; o.yaw = Math.atan2(-nx, -nz); o.vx = o.vz = 0;
    p2.bot = { grab: true }; GAME.step(0.025); run(0.2);
    const pulled = !d.crev && d.heldBy === o;
    GAME.dropPlayer(p2);
    return { sIn, stuck, grabbed, out, dIn, climbed, presses, spent, cost: GAME.T.crev.cost, tired, rested, restOut, teamPresses, teamMash, pulled };
  });
  ok('a sheep falls in a crack and stays there', r.sIn && r.stuck, r);
  ok('a dog grabs it out, carries it off and sets it down', r.grabbed && r.out, r);
  ok(`a dog on its own mashes pounce and climbs out (${r.presses} presses)`, r.dIn && r.climbed && r.presses > 3, r);
  ok(`each mash costs stamina (${r.spent} for ${r.presses})`, r.spent >= r.presses * r.cost * 0.9 && r.spent < 0.6, r);
  ok(`no stamina: mashing does nothing, the bar flashes; rested (${r.rested.st}), out`, r.tired.in && r.tired.esc === 0 && r.tired.flash && r.tired.st > 0.1 && !r.rested.ex && r.restOut, r);
  ok(`with a friend about it still mashes out (${r.teamPresses} presses); the friend can grab it out`, r.teamMash && r.pulled, r);
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
    const { G, T, PASS, CAVE, YETI, SIDE, SNOWBALLS, HANK, ICES, CREVS, living, snowballRoll, ignite, caveD, inCave, sdfAt, fireSpots, findPath, pathPoint, trailInfo, terrainH, heatAt, sAt } = GAME, out = {};
    const f = PASS.fires.find(o => o.cave), top = PASS.fires.find(o => o.top), H = SIDE.home, C = CAVE, da = a => Math.abs(Math.atan2(Math.sin(a - C.a), Math.cos(a - C.a)));
    // where: set into the east rim, across from the hidden side trail's mouth, far out of his sight; its hearth in its middle; its floor level
    const door = SIDE.door, mid = pathPoint(C.s, 0);
    out.where = { hearth: !!f.hearth && PASS.hearth === f && caveD(f.x, f.z) < 0.01, east: +trailInfo(C.x, C.z).oE.toFixed(1), across: +Math.abs(C.s - sAt(door.x, door.z)).toFixed(1), fromHim: +Math.hypot(C.x - H.x, C.z - H.z).toFixed(1),
      mouth: +((mid.x - C.x) * C.ax + (mid.z - C.z) * C.az).toFixed(1) };   // (its mouth: toward the floor's middle)
    let lv = 0; for (let a = 0; a < 6.28; a += 0.3) for (let rr = 2; rr < C.r - 0.6; rr += 1.4) lv = Math.max(lv, Math.abs(terrainH(C.x + Math.cos(a) * rr, C.z + Math.sin(a) * rr) - terrainH(C.x + C.ax * 3, C.z + C.az * 3))); out.level = +lv.toFixed(2);
    // walled all round but its mouth; places for the whole flock (50 and more, none on another, all on its floor); a way in from the trail; its stick in it
    const walled = () => { let w = 0, n = 0; for (let a = 0; a < 6.28; a += 0.05) if (da(a) > C.mouth + 0.12) { n++; if (sdfAt(C.x + Math.cos(a) * (C.r + C.th * 0.55), C.z + Math.sin(a) * (C.r + C.th * 0.55)) < 0) w++; } return +(w / n).toFixed(2); };
    let gap = 0, gn = 0; for (let a = 0; a < 6.28; a += 0.05) if (da(a) < C.mouth - 0.3) { gn++; if (sdfAt(C.x + Math.cos(a) * (C.r + C.th * 0.55), C.z + Math.sin(a) * (C.r + C.th * 0.55)) > 0.4) gap++; }
    out.walled = walled(); out.open = +(gap / gn).toFixed(2);
    const sp = fireSpots(f); out.spots = sp.length; out.apart = +Math.min(...sp.map((a, i) => Math.min(9, ...sp.slice(i + 1).map(b => Math.hypot(a.x - b.x, a.z - b.z))))).toFixed(2); out.spotsOK = sp.every(q => sdfAt(q.x, q.z) > 0.7 && inCave(q.x, q.z));
    const st = pathPoint(C.s - 14, 2), fp = findPath(st.x, st.z, C.x + C.ax * 3, C.z + C.az * 3, 100000); out.way = !!fp && Math.hypot(fp.at(-1).x - C.x, fp.at(-1).z - C.z) < 4.5;
    const tc = GAME.TORCHES[f.i]; out.stick = inCave(tc.x, tc.z) && caveD(tc.x, tc.z) > 3;
    out.clear = ICES.every(m => m.s < C.s - 9) && CREVS.every(c => c.s < C.s - 9);   // from it up to him: no ice, no crack
    // the flock comes up cold: Hank lights its hearth, every one goes in and warms up (warm all through); its stick dipped in it: alight
    setup(C.s - 26, { hour: 11, hankS: C.s - 32 }); living().forEach(s => { s.cold = 0.5; });
    out.litT = +run(50, () => f.fuel > 0).toFixed(1); out.hankIn = inCave(HANK.x, HANK.z, 0.5);
    out.inT = +run(45, () => living().every(s => inCave(s.x, s.z))).toFixed(1); run(10);
    out.cold = +Math.max(...living().map(s => s.cold)).toFixed(2); out.heat = [3, 6, 7.4].map(rr => +heatAt(C.x - C.ax * rr, C.z - C.az * rr).toFixed(2));
    tc.x = f.x + 0.9; tc.z = f.z; tc.h = 0; GAME.step(0.025); out.torch = tc.lit > 0; GAME.torchHome(tc);
    // a sheep carried right up to its hearth: nobody catches in it
    { const s = living().filter(o => !o.ram && !o.lamb)[0], d = G.dogs[0]; s.x = f.x + C.ax * 3.2; s.z = f.z + C.az * 3.2; s.vx = s.vz = 0; d.x = f.x + C.ax * 4.8; d.z = f.z + C.az * 4.8; d.yaw = Math.atan2(-C.ax, -C.az); d.vx = d.vz = 0;
      G.players[0].bot = { grab: true }; GAME.step(0.025); const held = s.heldBy === d; G.players[0].bot = toward(-C.ax, -C.az, { creep: true, grab: true }); let lit = false, near = 9;
      for (let t = 0; t < 3; t += 0.025) { GAME.step(0.025); if (s.burn > 0) lit = true; near = Math.min(near, Math.hypot(s.x - f.x, s.z - f.z)); } G.players[0].bot = {}; run(0.5); out.hearth = { held, lit, near: +near.toFixed(1) }; }
    // by night: the flock, left outside it (warm), comes in on its own; Hank asleep in it
    setup(C.s - 14, { hour: 21, hankS: C.s - 6 }); f.fuel = 18; living().forEach(s => { s.cold = 0; });
    out.nightIn = +run(60, () => { G.clock.hour = 22; return living().every(s => inCave(s.x, s.z)); }).toFixed(1);
    out.night = run(60, () => { G.clock.hour = 23; return HANK.asleep && inCave(HANK.x, HANK.z); }) >= 0;
    // the yeti up, the flock in his arena: back down into the cave on its own, to stay; Hank lights his campfire, then keeps in the cave
    setup(T.pass.arena + 8, { hour: 10, hankS: C.s, yeti: true, dogS: T.pass.arena + 14 }); f.fuel = 18;
    out.backT = +run(45, () => living().every(s => inCave(s.x, s.z))).toFixed(1); out.woke = YETI.on;
    out.campT = +run(60, () => top.fuel > 0).toFixed(1); out.hankBack = +run(60, () => inCave(HANK.x, HANK.z, 0.5)).toFixed(1);
    run(8); out.stay = living().filter(s => inCave(s.x, s.z)).length + '/' + living().length;
    // a dog walks in among them: they keep to it (none out)
    const d = G.dogs[0]; YETI.next = 1e9; SNOWBALLS.length = 0; run(2, () => !d.air && !d.slide); d.x = C.mx; d.z = C.mz; d.vx = d.vz = 0; d.air = null; d.slide = null; G.players[0].bot = toward(-C.ax, -C.az); let outN = 0;
    for (let t = 0; t < 2.4; t += 0.025) { GAME.step(0.025); outN = Math.max(outN, living().filter(s => !inCave(s.x, s.z, 0.6)).length); } G.players[0].bot = {}; out.calm = outN;
    // a snowball down the floor at a sheep just inside its mouth: smashed on it, the sheep's fine
    const L = living().filter(o => !o.ram && !o.lamb), s = L[0]; s.x = C.x + C.ax * (C.r - 2.4); s.z = C.z + C.az * (C.r - 2.4); s.vx = s.vz = 0;
    const bp = pathPoint(C.s + 24, 1), bl = Math.hypot(s.x - bp.x, s.z - bp.z), sx = s.x, sz = s.z, b = snowballRoll(bp.x, bp.z, (s.x - bp.x) / bl * T.yeti.roll, (s.z - bp.z) / bl * T.yeti.roll); let hit = false, at = null;
    for (let t = 0; t < 8 && SNOWBALLS.includes(b); t += 0.025) { const px = b.x, pz = b.z; if (!s.air) { s.x = sx; s.z = sz; s.vx = s.vz = 0; } GAME.step(0.025); if (!SNOWBALLS.includes(b)) at = caveD(px, pz); if (b.hit.has(s)) hit = true; }
    out.ball = { hit, at: at && +at.toFixed(1) };
    // a burning sheep against its ice a while (and a lit torch by it): it holds (still walled, its shell up)
    const w = L[2], ia = C.a + Math.PI * 0.8, wx = C.x + Math.cos(ia) * (C.r - 0.7), wz = C.z + Math.sin(ia) * (C.r - 0.7); w.pen = null; ignite(w); tc.x = wx + Math.cos(ia) * 0.3; tc.z = wz + Math.sin(ia) * 0.3; tc.lit = 5;
    for (let t = 0; t < 8; t += 0.025) { w.x = wx; w.z = wz; w.vx = w.vz = 0; w.air = null; w.burn = Math.max(w.burn, 2); GAME.step(0.025); }
    out.holds = { walled: walled(), shell: !!C.shell && !!C.shell.parent && C.shell.visible }; w.burn = 0; GAME.torchHome(tc);
    // fifty of them, cold, its hearth lit: every one in it at once
    setup(C.s - 22, { hour: 10, hankS: C.s - 6 }); while (living().length < 50) G.sheep.push(GAME.makeSheep(0, 0, { age: 12 }));
    { const p = pathPoint(C.s - 22, 0); living().forEach((sh, i) => { sh.x = p.x + (i % 7) * 1.4 - 4.2; sh.z = p.z + Math.floor(i / 7) * 1.4 - 4; sh.vx = sh.vz = 0; sh.pen = null; sh.hunger = 0.2; sh.thirst = 0.1; sh.cold = 0.5; sh.snow = 0; }); }
    f.fuel = 18; out.fifty = { n: living().length, t: +run(60, () => living().every(q => inCave(q.x, q.z))).toFixed(1) };
    return out;
  });
  const w = r.where;
  ok(`the ice cave's set into the east rim (${w.east} m past the floor's edge), across from the hidden side trail's door (${w.across} m up from it), its mouth onto the floor, ${w.fromHim} m from him; its hearth in the middle; its floor level (${r.level} m)`,
    w.hearth && w.east > 4 && w.across < 8 && w.mouth > 10 && w.fromHim > 60 && r.level < 0.25, r);
  ok(`walled all round (${r.walled}) but its mouth (${r.open} open); ${r.spots} places for the flock (≥ ${r.apart} m apart); a way in; its stick in it, lit in its hearth; no ice or crack from it up to him`,
    r.walled > 0.95 && r.open > 0.9 && r.spots >= 55 && r.apart > 1.15 && r.spotsOK && r.way && r.stick && r.torch && r.clear, r);
  ok(`the flock comes up cold: Hank lights the hearth (${r.litT} s, from in it), every one's in (${r.inT} s) and warm (${r.cold}); warm all through (${r.heat.join(', ')})`,
    r.litT >= 0 && r.hankIn && r.inT >= 0 && r.cold < 0.3 && r.heat.every(v => v > 0.95), r);
  ok(`a sheep carried right up to its hearth (${r.hearth.near} m): nobody catches in it`, r.hearth.held && !r.hearth.lit && r.hearth.near < 2.6, r.hearth);
  ok(`by night the flock comes in on its own (${r.nightIn} s); Hank asleep in it`, r.nightIn >= 0 && r.night, r);
  ok(`the yeti up, the flock in his arena: back down into the cave on its own (${r.backT} s), there to stay (${r.stay}); Hank lights his campfire (${r.campT} s) and goes back to the cave (${r.hankBack} s)`,
    r.woke && r.backT >= 0 && r.campT >= 0 && r.hankBack >= 0 && +r.stay.split('/')[0] >= +r.stay.split('/')[1] - 1, r);
  ok(`a dog walks in among them: they keep to it (${r.calm} out)`, r.calm === 0, r);
  ok(`a snowball down the floor at a sheep in its mouth smashes on it (${r.ball.at} m from its middle): the sheep's fine`, !r.ball.hit && r.ball.at !== null && r.ball.at < 12, r.ball);
  ok(`a burning sheep and a lit torch against its ice: it holds (walled ${r.holds.walled}, shell up)`, r.holds.walled >= r.walled && r.holds.shell, r.holds);
  ok(`${r.fifty.n} sheep, cold: every one in it at once (${r.fifty.t} s)`, r.fifty.n >= 50 && r.fifty.t >= 0, r.fifty);
}

if (!only || only === 'fires') {
  const r = await ev(() => {
    const { G, T, PASS, YETI, SIDE, HANK, TORCHES, living, pathPoint, heatAt, sdfAt, finalPen, pens, passK, sAt, punt, ignite } = GAME, out = {};
    const top = PASS.fires.find(o => o.top), pf = PASS.fires.find(o => o.pen), H = SIDE.home, K = T.yeti;
    // every campfire up here's a fire of the pass's: a lit torch lights it, it lights a cold torch, it's warm; a sheep in it catches (but the hearth: kerbed)
    setup(1300, { hour: 11 });
    out.fires = PASS.fires.map(f => {
      const t = TORCHES[f.i], o = { s: Math.round(f.s), kind: f.hearth ? 'hearth' : f.pen ? 'pen' : f.top ? 'yeti' : f.base ? 'base' : 'camp', stick: +Math.hypot(t.home.x - f.x, t.home.z - f.z).toFixed(1) };
      f.fuel = 0; t.x = f.x + 0.9; t.z = f.z; t.h = 0; t.by = null; t.lit = 2; GAME.step(0.025); o.lights = f.fuel > 0;   // a lit torch to it
      t.lit = 0; GAME.step(0.025); o.dips = t.lit > 0; GAME.torchHome(t);   // a cold one in it
      o.heat = +heatAt(f.x + 2.2, f.z).toFixed(2);
      const s = living().filter(q => !q.ram && !q.lamb)[0]; Object.assign(s, { x: f.x + 0.6, z: f.z, vx: 0, vz: 0, burn: 0, state: 'idle', pen: null, air: null }); o.burns = GAME.fireCheck(s) && s.burn > 0; s.burn = 0; s.state = 'idle'; s.slide = null;   // (as one carried or flung into it)
      f.fuel = 0; return o;
    });
    out.decor = pens.filter(p => !p.deck && passK(sAt(p.x, p.z)) > 0.5).map(p => !!(p.fireG && p.fireG.visible));   // a pen up here: no campfire of its own that's only for show
    // the yeti's campfire: out in the open in the middle of the floor, past his reach, a punt from him
    out.camp = { d: +Math.hypot(top.x - H.x, top.z - H.z).toFixed(1), reach: K.leash * 0.5 * Math.SQRT2 + K.buttR, clear: +sdfAt(top.x, top.z).toFixed(1), lat: +GAME.trailInfo(top.x, top.z).lat.toFixed(1) };
    // a sheep carried into it catches (too hot to hold); bonked at him from by it: a hit
    setup(top.s - 12, { hour: 11, yeti: true, dogS: top.s - 6 }); top.fuel = 8; run(1); YETI.next = 1e9; YETI.buttCd = 1e9;
    const d = G.dogs[0], s = living().filter(o => !o.ram && !o.lamb)[0], ux = (top.x - H.x) / out.camp.d, uz = (top.z - H.z) / out.camp.d;   // (from him out to it)
    s.scale = 1; s.x = top.x + uz * 3; s.z = top.z - ux * 3; s.vx = s.vz = 0; d.x = top.x + uz * 4.6; d.z = top.z - ux * 4.6; d.yaw = Math.atan2(-uz, ux); d.vx = d.vz = 0;   // (in from its side: clear of its stick)
    G.players[0].bot = { grab: true }; GAME.step(0.025); const held = s.heldBy === d; G.players[0].bot = toward(-uz, ux, { grab: true }); let lit = false, dropped = false;
    for (let t = 0; t < 4; t += 0.025) { GAME.step(0.025); if (s.burn > 0) lit = true; if (lit && !s.heldBy) { dropped = true; break; } } G.players[0].bot = {};
    const hp0 = YETI.hp; YETI.x = H.x; YETI.z = H.z; YETI.state = 'idle'; YETI.hurtT = 0; s.x = top.x - ux * 1.2; s.z = top.z - uz * 1.2; s.vx = s.vz = 0; s.air = null; s.slide = null; s.burn = Math.max(s.burn, 5);
    const from = Math.hypot(s.x - H.x, s.z - H.z); d.x = s.x + ux; d.z = s.z + uz; d.pdx = -ux; d.pdz = -uz; d.pounceT = 0.2; d.air = null; punt(s, d, -ux, -uz);
    for (let t = 0; t < 3 && s.air; t += 0.025) GAME.step(0.025);
    out.lit = { held, lit, dropped, from: +from.toFixed(1), hp: [hp0, YETI.hp] };
    // his pen's campfire: Hank leaves it while he's up; him beaten, the flock by it: Hank lights it
    setup(pf.s - 8, { hour: 11, yeti: true, hankS: pf.s - 14, dogS: pf.s - 8 }); PASS.fires.forEach(f => { f.fuel = f.pen ? 0 : 9; }); YETI.next = 1e9; YETI.buttCd = 1e9; run(6); out.penUp = pf.fuel > 0;
    GAME.yetiBeaten('fire'); out.penT = +run(60, () => pf.fuel > 0).toFixed(1);
    return out;
  });
  ok(`every campfire up here's real (${r.fires.map(f => f.kind).join(', ')}): a lit torch lights it, it lights a torch, it's warm, its stick by it; a sheep in it catches (not in the hearth)`,
    r.fires.length === 6 && r.fires.every(f => f.lights && f.dips && f.heat > 0.8 && f.stick < 8 && f.burns === (f.kind !== 'hearth')) && r.decor.every(v => !v), r);
  ok(`the yeti's campfire: in the open (${r.camp.clear} m clear, ${r.camp.lat} m off the floor's middle), ${r.camp.d} m from his spot: past his reach (${r.camp.reach.toFixed(1)} m), a punt from him`,
    r.camp.clear > 6 && Math.abs(r.camp.lat) < 4 && r.camp.d > r.camp.reach + 2.5 && r.camp.d < 14.5, r.camp);
  ok(`a sheep carried into it catches, too hot to hold; bonked at him from by it (${r.lit.from} m): hp ${r.lit.hp.join(' → ')}`, r.lit.held && r.lit.lit && r.lit.dropped && r.lit.hp[1] === r.lit.hp[0] - 1, r.lit);
  ok(`his pen's campfire: left alone while he's up; him beaten, the flock by it: Hank lights it (${r.penT} s)`, !r.penUp && r.penT >= 0, r);
}

if (!only || only === 'fight') {
  // the whole fight, a dog on its own (a bot: A* round what's in the way, hops the snowballs it sees coming): the flock in the cave, both fires lit;
  // a sheep fetched from the cave, carried up to his campfire, alight, bonked into him; three times
  const r = await ev(() => {
    const { G, T, PASS, CAVE, YETI, SNOWBALLS, living, inCave, fireSpots, findPath } = GAME, C = CAVE, out = { log: [] };
    const f = PASS.hearth, top = PASS.fires.find(o => o.top);
    setup(C.s, { hour: 9, hankS: C.s, yeti: true, dogS: C.s }); f.fuel = 20; top.fuel = 10;
    const sp = fireSpots(f), n0 = living().length; living().forEach((s, i) => { s.x = sp[i].x; s.z = sp[i].z; s.cold = 0; });
    const D = G.dogs[0]; D.x = C.mx; D.z = C.mz;
    let t = 0, phase = 'fetch', tgt = null, t0 = 0, hp = T.yeti.hp, tries = 0, bowled = 0, wasAir = false, pth = null, pthT = -1, pthTo = null;
    const step = bot => { G.players[0].bot = bot; GAME.step(0.025); t += 0.025; if (D.air && !wasAir) bowled++; wasAir = !!D.air; };
    const go = (x, z, extra = {}) => {
      if (t - pthT > 0.3 || !pthTo || Math.hypot(pthTo[0] - x, pthTo[1] - z) > 1.5) { pthT = t; pthTo = [x, z]; const p = findPath(D.x, D.z, x, z, 20000); pth = p && p.length > 2 ? p : null; }
      if (pth) { let i = 1; while (i < pth.length - 1 && Math.hypot(pth[i].x - D.x, pth[i].z - D.z) < 1.4) i++; if (Math.hypot(x - D.x, z - D.z) > 2.5) { x = pth[i].x; z = pth[i].z; } }
      const b = SNOWBALLS.find(b => Math.hypot(b.x - D.x, b.z - D.z) < b.r + 2.6 && (D.x - b.x) * b.vx + (D.z - b.z) * b.vz > 0);
      return toward(x - D.x, z - D.z, { ...extra, jump: !!b });
    };
    while (t < 320 && !YETI.beaten && G.mode === 'play') {
      if (phase === 'fetch') {
        // one from the cave, nearest its mouth; none there (dropped on the way, wandered off): the nearest stray
        const free = s => !s.ram && !s.lamb && !(s.burn > 0) && !(s.soot > 0.5) && !s.air, near = (x, z) => (a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z);
        if (!tgt || tgt.dead || !free(tgt) || !inCave(tgt.x, tgt.z)) tgt = living().filter(s => free(s) && inCave(s.x, s.z)).sort(near(C.mx, C.mz))[0] || living().filter(free).sort(near(D.x, D.z))[0];
        if (!tgt) { step(go(C.mx, C.mz, { sprint: D.stamina > 0.3 })); continue; }
        const dd = Math.hypot(tgt.x - D.x, tgt.z - D.z);
        if (inCave(tgt.x, tgt.z) && !inCave(D.x, D.z, 3) && Math.hypot(D.x - C.mx, D.z - C.mz) > 3) { step(go(C.mx, C.mz, { sprint: D.stamina > 0.3 })); continue; }   // (in it: to its mouth first)
        if (dd > 1.6) step(go(tgt.x, tgt.z, { sprint: dd > 6 && D.stamina > 0.3 })); else { step({ grab: true }); if (tgt.heldBy === D) { phase = 'carry'; t0 = t; } }
      } else if (phase === 'carry') {
        if (tgt.heldBy !== D) { if (tgt.burn > 0) { phase = 'punt'; tries++; out.log.push(['lit', +t.toFixed(1), +(t - t0).toFixed(1)]); t0 = t; } else { phase = 'fetch'; out.log.push(['lost', +t.toFixed(1)]); for (let k = 0; k < 4; k++) step({}); tgt = null; } continue; }
        const wp = inCave(D.x, D.z, 1.2) ? [C.mx, C.mz] : [top.x, top.z];
        step(go(wp[0], wp[1], { grab: true, sprint: D.stamina > 0.6 && !inCave(D.x, D.z, 2) }));
      } else {
        if (!(tgt.burn > 0) || tgt.dead) { phase = 'fetch'; out.log.push([YETI.hp < hp ? 'HIT' : 'miss', +t.toFixed(1), +(t - t0).toFixed(1)]); hp = YETI.hp; tgt = null; continue; }
        if (tgt.air) { step({}); continue; }
        const ux = YETI.x - tgt.x, uz = YETI.z - tgt.z, ul = Math.hypot(ux, uz), ex = tgt.x - D.x, ez = tgt.z - D.z, el = Math.hypot(ex, ez), al = (ex * ux + ez * uz) / (el * ul || 1);
        if (el < 2.6 && al > 0.93 && ul < 15) step(toward(ex, ez, { pounce: true })); else step(go(tgt.x - ux / ul * 1.6, tgt.z - uz / ul * 1.6, { sprint: D.stamina > 0.15 }));
      }
    }
    G.players[0].bot = {}; out.t = +t.toFixed(1); out.beaten = YETI.beaten; out.tries = tries; out.bowled = bowled; out.carry = out.log.filter(l => l[0] === 'lit').map(l => l[2]);
    run(25); out.home = living().filter(s => inCave(s.x, s.z) || sAt_(s) > T.pass.arena).length; out.n = living().length; out.n0 = n0;
    function sAt_(s) { return GAME.sAt(s.x, s.z); }
    return out;
  });
  ok(`the whole fight, a dog on its own: sheep fetched from the cave, lit in his campfire (carried ${r.carry.join(', ')} s), bonked into him: beaten in ${r.t} s (${r.tries} lit, bowled ${r.bowled}×); nobody lost (${r.n}/${r.n0})`,
    r.beaten && r.t < 320 && Math.max(...r.carry) < 20 && r.n === r.n0, r);
}

if (!only || only === 'nag') {
  const r = await ev(() => {
    const { G, T, PASS, CAVE, YETI, HANK, YETI_NAGS, living, ignite, punt, yetiStruck, yetiBeaten, resetPass, pathPoint } = GAME, out = {}, K = T.yeti.nag;
    const f = PASS.fires.find(o => o.top);
    setup(T.pass.arena - 8, { yeti: true, hour: 11, dogS: T.pass.arena + 4 }); f.fuel = 9; const d = G.dogs[0];
    run(1); YETI.next = 1e9; YETI.buttCd = 1e9; HANK.x = CAVE.x + CAVE.ax * 3; HANK.z = CAVE.z + CAVE.az * 3;   // (Hank in the cave, far below: he hears him)
    const all = Object.entries(YETI_NAGS).flatMap(([k, L]) => L.map((t, i) => [t, k, i])), said = () => HANK.log.filter(l => l.said && all.some(a => a[0] === l.text)).map(l => { const a = all.find(a => a[0] === l.text); return [a[1], a[2], +l.t.toFixed(0)]; });
    const t0 = G.time; HANK.log.length = 0;
    run(K.first + 1); out.first = said();
    run(K.every * Math.min(K.growMax, 1 + K.grow) + 1); out.second = said();   // (each further apart)
    // a pounce off him (not within the cooldown, then after it)
    const pounce = () => { d.x = YETI.x - 2; d.z = YETI.z; d.vx = d.vz = 0; d.air = null; d.stunT = 0; d.pounceCD = 0; G.players[0].bot = toward(1, 0, { pounce: true }); GAME.step(0.025); G.players[0].bot = {}; run(0.4); };
    pounce(); out.soon = said().length;
    run(YETI.nag.cd + 0.5); pounce(); run(4); out.pounce = said().at(-1);   // (a line that matters on the go: after it)
    // a cold sheep thrown at him
    run(YETI.nag.cd + 0.5); const s = living().filter(o => !o.ram)[0]; s.x = YETI.x - 7; s.z = YETI.z; s.vx = s.vz = 0; s.burn = 0; d.x = s.x - 1; d.z = s.z; d.pdx = 1; d.pdz = 0; d.pounceT = 0.2; punt(s, d, 1, 0);
    for (let t = 0; t < 3 && s.air; t += 0.025) GAME.step(0.025); run(4); out.cold = said().at(-1);
    // it tops out
    G.clock.hour = 11;   // (midday again: no "night's comin'" over the rest)
    YETI.nag.tier = 40; YETI.nag.cd = 0; YETI.nag.t = 1e3; run(12, () => YETI.nag.tier !== 40); out.top = YETI.nag.tier;   // (once he's done with the last, and whatever else he's on about)
    // a hit: a cheer, back a few tiers
    const k = living().filter(o => !o.ram)[1]; k.x = YETI.x - 7; k.z = YETI.z; k.vx = k.vz = 0; ignite(k); YETI.hurtT = 0; d.x = k.x - 1; d.z = k.z; d.pdx = 1; d.pdz = 0; d.pounceT = 0.2; punt(k, d, 1, 0);
    for (let t = 0; t < 3 && k.air; t += 0.025) GAME.step(0.025); run(1.5); out.hit = { hp: YETI.hp, tier: YETI.nag.tier, cheer: HANK.log.some(l => l.said && /felt that|Roast him|That's the way/.test(l.text)) };
    // a line that matters on (forced, long): the timer's nag waits till it's off the screen; another nag (the gate's) just said: hankNagGap after it
    const first = () => HANK.log.find(l => l.said && all.some(a => a[0] === l.text)), long = "Steady now. This one matters, and it's a long one, so hush a wee while.";
    run(K.cd + 0.5); HANK.log.length = 0; GAME.hank(null, long, { force: true }); let t1 = G.time; YETI.nag.cd = 0; YETI.nag.t = 1e3; run(T.hankNagGap + 5);
    out.over = first() ? +(first().t - t1).toFixed(1) : -1; out.len = +(1.6 + long.length * 0.055).toFixed(1);
    run(K.cd + 0.5); HANK.log.length = 0; HANK.nagAt = t1 = G.time; YETI.nag.cd = 0; YETI.nag.t = 1e3; run(T.hankNagGap + 3);
    out.gap = first() ? +(first().t - t1).toFixed(1) : -1; out.G = T.hankNagGap;
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
  ok(`not over a line that matters (on ${r.len} s): after it (${r.over} s); after another nag (the gate's): ${r.G} s on (${r.gap} s)`, r.over >= r.len - 0.05 && r.over < r.len + 1 && r.gap >= r.G - 0.05 && r.gap < r.G + 1, r);
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

if (!only || only === 'gate') {
  const r = await ev(() => {
    const { G, T, PASS, HANK, GATE, GATE_NAGS, TORCHES, living, pathPoint, sAt, sdfAt, iceK, findPath, devJump, resetPass } = GAME, I = T.iceGate, out = { s0: I.s0, s1: I.s1, nag: I.nag };
    const b = PASS.fires.find(f => f.base), up = pathPoint(I.s0, 0), ux = up.tx, uz = up.tz;
    // wall to wall: every walkable spot across the band is ice; still a way round on the map (A*: only the ice in the way); no lane
    let walk = 0, iced = 0; for (let s = I.s0 + 2; s <= I.s1 - 2; s += 1) for (let l = -30; l <= 30; l += 0.5) { const p = pathPoint(s, l); if (sdfAt(p.x, p.z) > 0.3) { walk++; if (iceK(p.x, p.z) > 0.6) iced++; } }
    const a = pathPoint(I.s0 - 6, 0), z = pathPoint(I.s1 + 6, 0), fp = findPath(a.x, a.z, z.x, z.z, 100000);
    setup(I.s0 - 12, { hour: 10, dogS: I.s0 - 4, hankS: b.s - 4 }); GAME.step(0.025);
    out.band = { walk, iced, path: !!(fp && fp.length), open: GATE.open };
    // a dog sprints up onto it: thrown back down it, again and again; Hank: the torch, then (not before nag s) the nags
    const d = G.dogs[0], P = G.players[0], said = () => HANK.log.filter(l => l.said).map(l => ({ t: l.t, text: l.text }));
    let slips = 0, maxS = 0, was = false;
    for (let t = 0; t < 34; t += 0.025) {
      P.bot = toward(ux, uz, { sprint: t % 4 < 3 }); GAME.step(0.025); const s = sAt(d.x, d.z); maxS = Math.max(maxS, s);
      if (d.slide && !was) slips++; was = !!d.slide;
      if (!d.slide && s > I.s0 + 3) { maxS = 1e9; break; }
    }
    P.bot = {}; run(2);
    const lines = said(), intro = lines.find(l => /Grab the torch/.test(l.text)), nags = lines.filter(l => GATE_NAGS.includes(l.text));
    out.dog = { slips, maxS: +maxS.toFixed(1), below: sAt(d.x, d.z) < I.s0 + 0.5, intro: intro && intro.t, nags: nags.map(l => [l.t, l.text.slice(0, 18)]), said: PASS.said.gate };
    // a driven sheep up onto it: back down it too
    const sh = living().filter(o => !o.ram && !o.lamb)[0], q = pathPoint(I.s0 - 1.5, 2); Object.assign(sh, { x: q.x, z: q.z, vx: ux * 4, vz: uz * 4, state: 'flee', fear: 1, fdx: ux, fdz: uz, alert: 2, slipCd: 0 });
    const lo = pathPoint(I.s0 - 16, 0); living().forEach((o, i) => { if (o !== sh) { o.x = lo.x + (i % 4) * 1.5 - 2.2; o.z = lo.z + Math.floor(i / 4) * 1.5 - 2.2; o.vx = o.vz = 0; o.slide = null; } });   // (the rest out of its way: they wait at the foot)
    d.x = q.x - ux * 3.5; d.z = q.z - uz * 3.5; d.vx = d.vz = 0; d.slide = null; d.air = null;   // (the dog behind it: driven up, wherever the dog's sprints left it)
    let sSlid = false, sMax = 0; for (let t = 0; t < 5; t += 0.025) { if (!sh.slide && t < 1.5) { sh.state = 'flee'; sh.fear = 1; sh.fdx = ux; sh.fdz = uz; } GAME.step(0.025); if (sh.slide && !sSlid) { const o = pathPoint(I.s0 - 14, 8); d.x = o.x; d.z = o.z; d.vx = d.vz = 0; } if (sh.slide) sSlid = true; sMax = Math.max(sMax, sAt(sh.x, sh.z)); }   // (it's on: the dog off out of its way)
    out.sheep = { slid: sSlid, maxS: +sMax.toFixed(1), below: sAt(sh.x, sh.z) < I.s0 + 0.5 };
    // the flock put well up past it, no lane: Hank waits at the base camp (never on the ice)
    const top = pathPoint(PASS.fires[0].s - 12, 0); living().forEach((o, i) => { o.x = top.x + (i % 4) * 1.5; o.z = top.z + Math.floor(i / 4) * 1.5; o.vx = o.vz = 0; o.state = 'idle'; o.slide = null; });
    const hq = pathPoint(b.s - 6, 3); HANK.x = hq.x; HANK.z = hq.z; HANK.goal = null; let hMax = 0, hSlid = false, atWait = 0;
    for (let t = 0; t < 14; t += 0.025) { GAME.step(0.025); hMax = Math.max(hMax, sAt(HANK.x, HANK.z)); if (HANK.slide) hSlid = true; if (Math.hypot(HANK.x - GATE.wait.x, HANK.z - GATE.wait.z) < 2.5) atWait += 0.025; }
    out.hank = { atWait: +atWait.toFixed(1), maxS: +hMax.toFixed(1), slid: hSlid, fire: +Math.hypot(HANK.x - b.x, HANK.z - b.z).toFixed(1) };
    // the base camp's torch: lit in its fire, carried up across the ice: a lane; Hank's line; nobody slides up it
    b.fuel = 6; const t0 = TORCHES[b.i]; d.x = t0.x - 1.2; d.z = t0.z; d.vx = d.vz = 0; d.slide = null; d.yaw = Math.PI / 2; P.bot = { grab: true }; GAME.step(0.025); run(0.2);
    out.held = t0.by === d;
    run(6, () => { P.bot = toward(b.x - d.x, b.z - d.z, { grab: true, creep: true }); return t0.lit > 0; });
    out.lit = t0.lit > 0;
    const lane = [pathPoint(I.s0 - 4, 0), pathPoint(I.s1 + 4, 0)]; let dSlid = false, at0 = false;
    run(10, () => { at0 ||= Math.hypot(lane[0].x - d.x, lane[0].z - d.z) < 1.5; const g = at0 ? lane[1] : lane[0]; P.bot = toward(g.x - d.x, g.z - d.z, { grab: true }); if (d.slide) dSlid = true; return sAt(d.x, d.z) > I.s1 + 3; });
    P.bot = { grab: true }; run(0.6);
    out.lane = { open: GATE.open, n: GATE.path && GATE.path.length, dSlid, top: sAt(d.x, d.z) > I.s1 + 2, gateLit: !!PASS.said.gateLit, gateOpen: !!PASS.said.gateOpen };
    if (!GATE.open) return out;
    // Hank goes up it now; a driven sheep goes up it; it doesn't snow over (a blizzard)
    const f0 = PASS.fires[0], hi = pathPoint(f0.s - 12, 0); living().forEach((o, i) => { o.x = hi.x + (i % 4) * 1.5; o.z = hi.z + Math.floor(i / 4) * 1.5; o.vx = o.vz = 0; o.state = 'idle'; o.slide = null; });   // (the flock well up: where he's going's up past it)
    let hUp = run(40, () => sAt(HANK.x, HANK.z) > I.s1 + 1.5); out.hankUp = +hUp.toFixed(1);
    if (hUp < 0) out.hankWas = { s: +sAt(HANK.x, HANK.z).toFixed(1), goal: HANK.goal && { x: +HANK.goal.x.toFixed(1), z: +HANK.goal.z.toFixed(1), s: +sAt(HANK.goal.x, HANK.goal.z).toFixed(1), fire: !!HANK.goal.fire, care: !!HANK.care, wait: !!HANK.goal.gateWait }, asleep: HANK.asleep, hour: GAME.G.clock.hour, fc: +sAt(GAME.flockCenter().x, GAME.flockCenter().z).toFixed(1) };
    const L0 = GATE.path[0], L1 = GATE.path[GATE.path.length - 1], s2 = living().filter(o => !o.ram && !o.lamb)[1], dl = Math.hypot(L1.x - L0.x, L1.z - L0.z), lx = (L1.x - L0.x) / dl, lz = (L1.z - L0.z) / dl;
    Object.assign(s2, { x: L0.x, z: L0.z, vx: 0, vz: 0, slide: null, state: 'flee', fear: 1, fdx: lx, fdz: lz, alert: 2 }); let s2Slid = false;
    run(6, () => { if (!s2.slide && sAt(s2.x, s2.z) < I.s1) { s2.state = 'flee'; s2.fear = 1; const g = GATE.path.reduce((a, p) => Math.hypot(p.x - s2.x, p.z - s2.z) < Math.hypot(a.x - s2.x, a.z - s2.z) ? p : a), i = GATE.path.indexOf(g), n = GATE.path[Math.min(GATE.path.length - 1, i + 1)], nx = n.x - s2.x, nz = n.z - s2.z, nl = Math.hypot(nx, nz) || 1; s2.fdx = nx / nl; s2.fdz = nz / nl; } if (s2.slide) s2Slid = true; return sAt(s2.x, s2.z) > I.s1 + 1; });
    out.sheepUp = { s: +sAt(s2.x, s2.z).toFixed(1), slid: s2Slid };
    PASS.blizz.next = 0; run(25); PASS.blizz.on = false; PASS.blizz.next = 1e9; GAME.updateIceGate(1); out.blizzOpen = GATE.open;
    // a dev jump onto it: melted through; back below it: iced again; a new journey: iced
    // online: a friend's ice from the host's melt (a late friend: the lane; a new journey: none)
    const mk = GAME.gateMask(); GAME.resetMelt(); GAME.gateScan(); out.mask = { n: mk.length, shut: !GATE.open }; GAME.gateMaskSet(mk); GAME.gateScan(); out.mask.back = GATE.open;
    GAME.gateMaskSet('0'.repeat(mk.length)); GAME.gateScan(); out.mask.iced = !GATE.open && !/[1-9a-f]/.test(GAME.gateMask());
    P.bot = {}; GAME.step(0.025);
    devJump(I.s0 + 10); out.devAll = GATE.all && GATE.open && living().every(o => sAt(o.x, o.z) > I.s0 - 30);
    devJump(b.s); out.devBack = !GATE.all && !GATE.open && iceK(pathPoint((I.s0 + I.s1) / 2, 0).x, pathPoint((I.s0 + I.s1) / 2, 0).z) > 0.9;
    resetPass(); const m = pathPoint((I.s0 + I.s1) / 2, 0); out.reset = !GATE.open && !GATE.all && iceK(m.x, m.z) > 0.9 && !PASS.said.gate;
    return out;
  });
  ok(`the ice gate: wall to wall (${r.band.iced}/${r.band.walk} spots across it iced), no lane; nothing else in the way`, r.band.iced === r.band.walk && r.band.walk > 200 && r.band.path && !r.band.open, r.band);
  ok(`a dog sprinting up it: thrown back down ${r.dog.slips}× (got to ${r.dog.maxS}), ends below it`, r.dog.slips >= 3 && r.dog.maxS < r.s1 && r.dog.below, r.dog);
  ok(`Hank: "Grab the torch…" (${r.dog.intro} s); nags after slips, ${r.dog.nags.length} in 34 s, further and further apart: ${r.dog.nags.map(n => n[0]).join(', ')}`, r.dog.intro >= 0 && r.dog.nags.length >= 1 && r.dog.nags.length <= 3 && /^Are ye sure/.test(r.dog.nags[0][1]) && r.dog.nags.every((n, i) => n[0] - (i ? r.dog.nags[i - 1][0] : r.dog.intro) >= r.nag * (1 + 0.3 * i) - 0.1), r.dog);
  ok(`a driven sheep up it: back down (got to ${r.sheep.maxS})`, r.sheep.slid && r.sheep.below, r.sheep);
  ok(`the flock well up past it, no lane: Hank waits at the base camp (${r.hank.atWait} s by its fire), never on the ice`, r.hank.atWait > 6 && r.hank.fire < 8 && r.hank.maxS < r.s0 && !r.hank.slid, r.hank);
  ok(`the base camp's torch, lit, carried up across it: a lane (${r.lane.n} pts), no slip; Hank's lines (lit near the ice, the lane's through)`, r.held && r.lit && r.lane.open && !r.lane.dSlid && r.lane.top && r.lane.gateLit && r.lane.gateOpen, r);
  ok(`up it now: Hank (${r.hankUp} s), a driven sheep (${r.sheepUp?.s}, no slide); a blizzard doesn't shut it`, r.hankUp >= 0 && r.sheepUp?.s > 0 && !r.sheepUp.slid && r.blizzOpen, r);
  ok('a dev jump onto it: melted through; back below: iced again; a new journey: iced', r.devAll && r.devBack && r.reset, r);
  ok(`online: a friend's ice from the host's (${r.mask?.n} hex digits): the lane, or none`, r.mask && r.mask.shut && r.mask.back && r.mask.iced, r.mask);
}

if (!only || only === 'burn') {
  const r = await ev(() => {
    const { G, PASS, ICES, CREVS, living, tryGrab } = GAME, ice = ICES.slice(), crev = CREVS.slice(); ICES.length = CREVS.length = 0;   // (no ice or crack for it to run mad onto)
    const f = PASS.fires[1]; setup(f.s, { hour: 11 }); f.fuel = 6;
    const s = living().filter(o => !o.ram)[0], d = G.dogs[0]; s.wool = 1; const w0 = s.wool;
    s.x = f.x + 3; s.z = f.z; d.x = f.x + 4.6; d.z = f.z; d.yaw = -Math.PI / 2; d.vx = d.vz = 0;
    G.players[0].bot = { grab: true }; GAME.step(0.025); const held = s.heldBy === d;
    G.players[0].bot = toward(-1, 0, { creep: true, grab: true }); let lit = false, dropped = false;
    for (let t = 0; t < 4; t += 0.025) { GAME.step(0.025); if (s.burn > 0) lit = true; if (lit && !s.heldBy) { dropped = true; break; } }
    G.players[0].bot = {};
    let ran = 0, rolled = false; const x0 = s.x, z0 = s.z;
    for (let t = 0; t < 12; t += 0.025) { GAME.step(0.025); if (s.state === 'burn') ran = Math.max(ran, Math.hypot(s.x - x0, s.z - z0)); if (s.state === 'roll') rolled = true; if (rolled && !(s.burn > 0)) break; }
    const res = { held, lit, dropped, ran: +ran.toFixed(1), rolled, out: !(s.burn > 0), singed: s.wool < 0.1 && w0 > 0.5, alive: !s.dead, soot: s.soot > 0.5 }; ICES.push(...ice); CREVS.push(...crev);
    // alight, it melts the snow where it runs (well away from any fire), and the ice gate's ice
    const { pathPoint, meltAt, sAt, ignite, resetMelt, GATE, gateIce, T } = GAME; resetMelt();
    const q = pathPoint(1320, 3), o = living().filter(x => !x.ram)[1]; Object.assign(o, { x: q.x, z: q.z, vx: 0, vz: 0, burn: 0, state: 'idle', pen: null }); ignite(o);
    const trail = []; for (let t = 0; t < 4; t += 0.025) { GAME.step(0.025); if (t > 0.5 && Math.round(t / 0.025) % 20 === 0 && PASS.fires.every(f => Math.hypot(f.x - o.x, f.z - o.z) > 9)) trail.push([o.x, o.z]); }
    res.melted = trail.filter(([x, z]) => meltAt(x, z) > 0.5).length + '/' + trail.length;
    const g = pathPoint((T.iceGate.s0 + T.iceGate.s1) / 2, 0), o2 = living().filter(x => !x.ram)[2]; Object.assign(o2, { x: g.x, z: g.z, vx: 0, vz: 0, burn: 0, state: 'idle', pen: null, slide: null });
    const ik0 = gateIce(g.x, g.z); ignite(o2); for (let t = 0; t < 0.5; t += 0.025) GAME.step(0.025); res.gate = [+ik0.toFixed(2), +gateIce(g.x, g.z).toFixed(2)];
    return res;
  });
  ok('a sheep carried into a fire catches; too hot to hold (dropped)', r.held && r.lit && r.dropped, r);
  ok(`it runs mad (${r.ran} m), then rolls it out: singed, alive`, r.ran > 3 && r.rolled && r.out && r.singed && r.alive && r.soot, r);
  ok(`alight it melts the snow where it runs (${r.melted} spots) and the gate's ice (${r.gate.join(' → ')})`, +r.melted.split('/')[0] >= 3 && +r.melted.split('/')[0] >= +r.melted.split('/')[1] - 1 && r.gate[0] > 0.9 && r.gate[1] < 0.2, r);
}

if (!only || only === 'uphill') {
  const r = await ev(() => {
    const { G, T, PASS, ICES, CREVS, GATE, pathPoint, sAt, living, step, iceK, crevAt, gateIce, gateMelt, gateScan, meltDisc } = GAME, U = T.pass.up;
    const fc = () => { const L = living(); let x = 0, z = 0, s = 0; for (const o of L) { x += o.x; z += o.z; s += sAt(o.x, o.z); } return { x: x / L.length, z: z / L.length, s: s / L.length }; };
    const clearAt = (s0) => [0, 3, -3, 6, -6, 9, -9].find(l => { const p = pathPoint(s0, l); for (let i = 0; i < 16; i++) { const x = p.x + (i % 4) * 1.5 - 2.2, z = p.z + Math.floor(i / 4) * 1.5 - 2.2; if (iceK(x, z) > 0 || iceK(x + 2, z) > 0 || iceK(x - 2, z) > 0 || iceK(x, z + 2) > 0 || iceK(x, z - 2) > 0 || crevAt(x, z, 2)) return false; } return true; }) ?? 0;
    // the flock at s0 (clear of the ice), fires lit; idle / a dog sweeping up behind it at a walk / a dog crossing it from one side;
    // up: UP on or off (off: as it was). Δs: how far up the trail it got (low: its lowest; back: sheep that got back past the dog).
    // Seeded (seed: Math.random; G.time fixed), so on and off see the same dice. The ice gate melted through (all of it), but with shut: it's up, no lane;
    // lane: a lane melted up it (lat 0)
    const rand = Math.random, seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let nT = 0;   // (each trial at its own fixed clock: G.time steers them too, and runs on from whatever ran before)
    const trial = (up, s0, o) => {
      Math.random = seeded(o.seed ?? 7); G.time = 1e6 + ++nT * 1e4;
      U.on = up; const ice = ICES.slice(), crev = CREVS.slice(); if (o.clear) { ICES.length = 0; CREVS.length = 0; }
      setup(s0, { hour: 10, lat: o.clear ? 0 : clearAt(s0), dogS: s0 - (o.sweep ? 12 : 60), hankS: s0 - 20 }); if (!o.shut && !o.lane) gateMelt(true);   // (the sweep: from just behind it)
      if (o.lane) { const I = T.iceGate; for (let s = I.s0 - 2; s <= I.s1 + 2; s += 0.5) { const m = pathPoint(s, 0); meltDisc(m.x, m.z, 2.2, 1.5, 1); } gateScan(); }
      for (const f of PASS.fires) f.fuel = 0; for (const i of o.lit) PASS.fires[i].fuel = 9;
      for (const s of living()) { s.wool = 1; s.cold = o.cold || 0; }
      const d = G.dogs[0], c0 = fc(), p0 = pathPoint(c0.s, 0), f = o.fire != null ? PASS.fires[o.fire] : null; let low = 0, back = 0, slid = 0, fell = 0, warmBehind = 0, near = 1e9, gate = 0;
      if (o.side) { const p = pathPoint(c0.s, o.side * 13); d.x = p.x; d.z = p.z; }
      for (let t = 0; t < o.t; t += 0.025) {
        if (o.sweep) { const p = pathPoint(c0.s - 10 + t * 1.2, 0), l = Math.hypot(p.x - d.x, p.z - d.z); G.players[0].bot = l > 0.6 ? toward(p.x - d.x, p.z - d.z, l < 3 ? { creep: true } : {}) : {}; }
        else if (o.side) G.players[0].bot = t < 5 ? toward(-p0.nx * o.side, -p0.nz * o.side) : { lie: true };
        step(0.025);
        const c = fc(), ds = sAt(d.x, d.z); low = Math.min(low, c.s - c0.s); if (f) near = Math.min(near, Math.hypot(c.x - f.x, c.z - f.z));
        for (const s of living()) {
          if (o.sweep && !s.wasBack && sAt(s.x, s.z) < ds - 2) { s.wasBack = true; back++; }
          if (s.slide && s.slide.kind === 'ice' && !s.slid) { s.slid = true; slid++; } if (!s.slide) s.slid = false;
          if (s.crev && !s.fell) { s.fell = true; fell++; }
          if ((o.shut || o.lane) && !s.onGate && gateIce(s.x, s.z) > 0.5) { s.onGate = true; gate++; }
          if (o.behind != null && s.state === 'warm' && s.fire === PASS.fires[o.behind] && !s.wb) { s.wb = true; warmBehind++; }
        }
      }
      G.players[0].bot = {}; ICES.length = 0; ICES.push(...ice); CREVS.length = 0; CREVS.push(...crev); U.on = true; Math.random = rand;
      for (const s of living()) s.wasBack = s.slid = s.fell = s.wb = s.onGate = false;
      const c = fc(), rear = Math.min(...living().map(o => sAt(o.x, o.z))) - c0.s, top = Math.max(...living().map(o => sAt(o.x, o.z))), past = living().filter(o => sAt(o.x, o.z) > T.iceGate.s1 + 1).length;
      return { ds: +(c.s - c0.s).toFixed(1), rear: +rear.toFixed(1), low: +low.toFixed(1), back, slid, fell, warm: warmBehind, near: f ? +near.toFixed(1) : null, gate, top: +top.toFixed(1), past, n: living().length, shut: o.shut ? !GATE.open : o.lane ? GATE.open : undefined };
    };
    const F = PASS.fires, base = F.find(f => f.base), out = { s0g: T.iceGate.s0 };
    for (const up of [false, true]) {
      const k = up ? 'on' : 'off';
      out[k] = {
        mid: trial(up, F[0].s - 30, { t: 100, lit: [0, base.i], fire: 0 }),             // a lit camp 30 m up (the base camp lit, 67 m down; ice and a crack between)
        foot: trial(up, base.s + 30, { t: 90, lit: [base.i] }),                         // 30 m past the base camp, lit (its melted camp and the snow line below)
        sweep: [1, 2, 3, 4].map(seed => trial(up, base.s + 30, { t: 30, lit: [base.i], sweep: true, seed })).map(o => ({ ds: o.ds, rear: o.rear, back: o.back })),   // ...a dog walking up behind it (4 goes)
        sideE: trial(up, F[1].s - 30, { t: 12, lit: [1], side: 1, clear: true }),       // a dog crossing it from the east
        sideW: trial(up, F[1].s - 30, { t: 12, lit: [1], side: -1, clear: true }),      // ...from the west
        cold: trial(up, F[0].s + 15, { t: 40, lit: [0], cold: 0.5, behind: 0 }),        // cold, 15 m past a lit fire (the next one far up)
        gate: [1, 2, 3].map(seed => trial(up, T.iceGate.s0 - 6, { t: 100, lit: [base.i], shut: true, seed })),   // the ice gate up, no lane: at its foot (3 goes)
        lane: [1, 2].map(seed => trial(up, T.iceGate.s0 - 6, { t: 120, lit: [base.i], lane: true, seed })),   // ...a lane melted through: up it (2 goes)
      };
    }
    // ...past the base camp, two goes more each (last: nothing above is nudged): as it was, an idle flock there drifts off a long way, down as a rule, now and then up
    for (const k of ['off', 'on']) out[k].foot2 = [1, 2].map(seed => trial(k === 'on', base.s + 30, { t: 90, lit: [base.i], seed }));
    return out;
  });
  const { on, off } = r, s = o => `${o.ds} m (low ${o.low})`, avg = a => a.reduce((t, o) => t + o.ds / a.length, 0);
  const g = on.gate, gs = a => a.map(o => `${o.ds} (low ${o.low}, ${o.gate} on it)`).join(', ');
  ok(`idle, a lit camp 30 m up: up to it (${on.mid.near} m off it), ${s(on.mid)} (was ${off.mid.near} m, ${s(off.mid)}); none onto the ice or into the crack (${on.mid.slid}, ${on.mid.fell})`, on.mid.ds > 15 && on.mid.low > -3 && on.mid.near < 10 && !on.mid.slid && !on.mid.fell, r);
  // (3 goes each: every one on up with UP on; as it was: the middle one of them well short of that. One go alone: what ran before nudges it, seeded or not)
  const ft = o => [o.foot, ...o.foot2], mid3 = a => a.map(o => o.ds).sort((x, y) => x - y)[1];
  ok(`idle past the base camp: on up ${ft(on).map(s).join(', ')} (was ${ft(off).map(s).join(', ')}: back down)`, ft(on).every(o => o.ds > 20 && o.low > -3 && !o.slid && !o.fell) && mid3(ft(on)) > mid3(ft(off)) + 20, r);
  // (the 4 goes: medians, and ≤1 back in 3 of them: a run's earlier scenarios still nudge a go now and then, seeded or not)
  const med = (a, k) => { const v = a.map(o => o[k]).sort((x, y) => x - y); return +((v[1] + v[2]) / 2).toFixed(1); }, sw = o => `${med(o, 'ds')} m, the last one ${med(o, 'rear')} m, ${o.map(g => g.back).join('/')} back past it`;
  ok(`a dog walking up behind it drives it faster: ${sw(on.sweep)} (was ${sw(off.sweep)})`, med(on.sweep, 'ds') > med(off.sweep, 'ds') && med(on.sweep, 'rear') > med(off.sweep, 'rear') && on.sweep.filter(g => g.back <= 1).length >= 3, r);
  ok(`pressed from the side it veers up: from the east ${on.sideE.ds} m, the west ${on.sideW.ds} m (was ${off.sideE.ds}, ${off.sideW.ds})`, on.sideE.ds > 5 && on.sideW.ds > 5 && on.sideE.low > -2 && on.sideW.low > -2, r);
  ok(`cold, 15 m past a lit fire: not back down to it (${s(on.cold)}, ${on.cold.warm} by it; was ${s(off.cold)}, ${off.cold.warm})`, on.cold.warm <= 2 && on.cold.low > -3, r);
  const ln = on.lane, ls = a => a.map(o => `${o.past}/${o.n} past (${o.ds} m, ${o.slid} slips)`).join(', ');
  ok(`a lane through it: up it, on up (${ls(ln)}; was ${ls(off.lane)})`, ln.every(o => o.shut && o.past >= o.n - 2 && o.slid <= 3 && o.low > -10) && avg(ln) > avg(off.lane) + 40, r.on.lane);
  ok(`the ice gate up, no lane: the flock waits at its foot (${avg(g).toFixed(1)} m), none onto the ice: ${gs(g)} (was ${avg(off.gate).toFixed(1)} m: ${gs(off.gate)})`, g.every(o => o.shut && o.gate === 0 && o.low > -25 && o.top < r.s0g + 1.2) && avg(g) > -12 && avg(g) > avg(off.gate) + 15, r.on.gate);
}

if (!only || only === 'crevyeet') {
  const r = await ev(() => {
    const { G, CREVS, living, crevFall, crevAt } = GAME;
    const c = CREVS[2]; setup(c.s, { hour: 11, dogS: c.s - 8 });
    const s = living()[0], d = G.dogs[0], nx = -c.az, nz = c.ax; s.x = c.x; s.z = c.z; s.vx = s.vz = 0; crevFall(s, c); const sIn = !!s.crev;
    d.x = s.x + nx * 2.4; d.z = s.z + nz * 2.4; d.yaw = Math.atan2(-nx, -nz); d.vx = d.vz = 0; d.pounceCD = 0;
    G.players[0].bot = toward(-nx, -nz, { pounce: true }); GAME.step(0.025); G.players[0].bot = {}; run(0.3);
    const kind = s.air && s.air.kind; run(3);
    return { sIn, kind, out: !s.crev && !s.air && !crevAt(s.x, s.z), side: +((s.x - c.x) * nx + (s.z - c.z) * nz).toFixed(1), hw: c.hw, dogIn: !!d.crev };
  });
  ok(`a pounce yeets a sheep out of its crack, across it (${r.side} m), the dog on the lip`, r.sIn && r.kind === 'yeet' && r.out && r.side < -r.hw && !r.dogIn, r);
}

console.log(h.errors.length ? `errors: ${h.errors.slice(0, 5).join(' | ')}` : 'no page errors');
console.log(fail ? `${fail} FAILED` : 'all passed');
await h.close();
process.exit(fail || h.errors.length ? 1 : 0);
