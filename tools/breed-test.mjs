// Headless checks for dog breeds and training: `node tools/breed-test.mjs`.
//   breeds   five, ★ adding up the same; ?sim slots default to Headers
//   title    picking on the title (chips, ←/→ eaten so they don't start), saved, P1's dog gets it; a friend's own pick
//   traits   each breed's strengths do something: bark reach, punt, jump, speed, stamina, grit, grip
//   train    doing it levels it (barking at nothing / hopping on the spot doesn't), a level makes it better, cap,
//            a Header learns faster, swapping breed and back keeps it, a new journey starts over
//   barn     breed chips + the ★ / ● card; a chip changes the live dog
//   net      "breed:levels" sets a guest's copy
import { open } from './harness.mjs';
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

// 1. the breeds
const r1 = await h.page.evaluate(() => {
  const { BREEDS, TRAITS, T } = GAME;
  return { n: BREEDS.length, icons: new Set(BREEDS.map(b => b.icon)).size, sums: BREEDS.map(b => TRAITS.reduce((a, t) => a + b[t.id], 0)),
    strong: BREEDS.map(b => TRAITS.filter(t => b[t.id] === 3).length), learn: BREEDS.filter(b => b.learn > 1).map(b => b.id), def: T.breedDef };
});
ok('five breeds, an icon each', r1.n === 5 && r1.icons === 5, r1);
ok('every breed has the same ★ in all (14)', r1.sums.every(n => n === 14), r1.sums);
ok('every breed but the Header is great at two things', r1.strong.filter(n => n === 2).length === 4 && r1.strong[0] === 0, r1.strong);
ok('the Header learns faster', r1.learn.length === 1 && r1.learn[0] === 'header', r1.learn);
ok('?sim: every slot a Header', r1.def.every(b => b === 'header'), r1.def);

// 2. the title pick
const r2 = await h.page.evaluate(() => {
  localStorage.clear(); GAME.loadDogs();
  const { G, dogLook, pickTitleBreed, titleBreedInput, keyEdge, startGame, DOGS_KEY } = GAME, out = {};
  out.before = dogLook(0).breed;
  keyEdge.add('ArrowRight'); titleBreedInput(); out.right = dogLook(0).breed; out.eaten = !keyEdge.has('ArrowRight');
  keyEdge.add('KeyA'); titleBreedInput(); out.left = dogLook(0).breed;
  keyEdge.add('ArrowLeft'); titleBreedInput(); out.wrap = dogLook(0).breed;
  pickTitleBreed('outrunner');
  out.chips = [...document.querySelectorAll('#tBreed [data-tb]')].filter(b => !/^-?1$/.test(b.dataset.tb)).length;
  out.on = (document.querySelector('#tBreed button.on') || {}).dataset?.tb;
  out.stats = document.querySelectorAll('#tBreed .stats > span').length;
  out.saved = (JSON.parse(localStorage.getItem(DOGS_KEY) || 'null') || { looks: [] }).looks[0]?.breed;
  out.mode = G.mode;
  GAME.loadDogs(); out.reloaded = dogLook(0).breed;
  startGame({ kind: 'bot', index: 0 });
  out.dog = G.dogs[0].breed;
  const p = GAME.joinPlayer({ kind: 'bot', index: 1, breed: 'backer' }); out.friend = p.dog.breed;
  const q = GAME.joinPlayer({ kind: 'bot', index: 2 }); out.slotDef = q.dog.breed;
  GAME.dropPlayer(p); GAME.dropPlayer(q);
  return out;
});
ok('→ picks the next breed and is eaten (no start)', r2.before === 'header' && r2.right === 'huntaway' && r2.eaten && r2.mode === 'title', r2);
ok('A / ← go back, and wrap round', r2.left === 'header' && r2.wrap === 'backer', r2);
ok('the title shows 5 chips, the picked one lit, 7 traits + learn', r2.chips === 5 && r2.on === 'outrunner' && r2.stats === 7, r2);
ok('the pick is saved', r2.saved === 'outrunner' && r2.reloaded === 'outrunner', r2);
ok('P1\'s dog is that breed', r2.dog === 'outrunner', r2);
ok('a friend joining with their own pick gets it; without, the slot\'s', r2.friend === 'backer' && r2.slotDef === 'header', r2);

// 3. the traits do something (training off)
const r3 = await h.page.evaluate(() => {
  const { G, T, step, living, setBreed, bark, punt, startJump, hurtDog, dogK, CAM_R, CAM_F } = GAME;
  const p = G.players[0], d = p.dog; p.kind = 'bot'; p.bot = {};
  const live = living(); for (const s of live) { s.pen = null; s.x = d.x + 200; s.z = d.z; }
  G.clock.hour = 10;
  const as = b => { setBreed(p, b); d.vx = d.vz = 0; d.stamina = 1; d.exhausted = false; d.hp = 1; d.ko = false; d.stunT = 0; d.hopT = d.jumpCd = 0; d.pounceT = 0; d.holding = null; d.holdKind = null; };
  const out = {};
  // bark reach: a sheep 12 m off
  const s = live[0], reach = b => { as(b); s.x = d.x + 12; s.z = d.z; s.vx = s.vz = 0; s.panic = 0; s.fear = 0; s.air = null; d.barkCd = 0; bark(d); return +s.panic.toFixed(2); };
  out.bark = { huntaway: reach('huntaway'), header: reach('header'), outrunner: reach('outrunner') };
  // punt: launch speed
  const kick = b => { as(b); s.x = d.x + 1; s.z = d.z; s.air = null; s.vx = s.vz = 0; d.pdx = 1; d.pdz = 0; punt(s, d, 1, 0); const v = Math.hypot(s.vx, s.vz); s.air = null; s.y = 0; return +v.toFixed(1); };
  out.punt = { heeler: kick('heeler'), header: kick('header'), huntaway: kick('huntaway') };
  // jump
  const hop = b => { as(b); startJump(d); const r = [+d.hopH.toFixed(2), +d.hopDur.toFixed(2)]; d.hopT = 0; return r; };
  out.jump = { backer: hop('backer'), header: hop('header'), heeler: hop('heeler') };
  // speed: sprint 1.5 s due x
  const go = { mx: CAM_R.x, my: -CAM_F.x };
  const run = b => { as(b); p.bot = { ...go, sprint: true }; let top = 0; for (let i = 0; i < 60; i++) { step(0.025); top = Math.max(top, Math.hypot(d.vx, d.vz)); } p.bot = {}; d.x -= 15; return +top.toFixed(1); };
  out.speed = { outrunner: run('outrunner'), header: run('header'), heeler: run('heeler') };
  // wind: stamina left after 2 s sprinting
  const wind = b => { as(b); p.bot = { ...go, sprint: true }; for (let i = 0; i < 80; i++) step(0.025); p.bot = {}; const st = d.stamina; d.x -= 25; return +st.toFixed(2); };
  out.wind = { backer: wind('backer'), header: wind('header'), outrunner: wind('outrunner') };
  // grit: a 0.3 hit
  const grit = b => { as(b); hurtDog(d, 0.3); return +d.hp.toFixed(3); };
  out.grit = { heeler: grit('heeler'), header: grit('header'), backer: grit('backer') };
  // grip: hold a ram 1.5 s (stamina it costs) and drag it (top speed)
  const ram = live[1]; ram.ram = true; ram.lamb = false; ram.brave = 0.1;
  const grip = b => {
    as(b); d.yaw = Math.PI / 2; if (d.holding) GAME.releaseHold(d, false);   // (nothing left in its mouth)
    Object.assign(ram, { x: d.x + 1.5, z: d.z, heldBy: null, air: null, vx: 0, vz: 0, state: 'idle', rs: 'idle', rcd: 99, fear: 0, panic: 0, stress: 0, grudge: null });
    p.bot = { grab: true }; step(0.025); const held = d.holdKind; d.holdWob = Math.PI / 2;   // (it tugs sideways: the same for each)
    p.bot = { grab: true, ...go }; const st0 = d.stamina, x0 = d.x;
    for (let i = 0; i < 60; i++) step(0.025);
    const cost = st0 - d.stamina, spd = Math.abs(d.x - x0) / 1.5; GAME.releaseHold(d, false); p.bot = {}; step(0.025); d.x -= 10;   // (set down, not flung)
    return { held, cost: +cost.toFixed(3), spd: +spd.toFixed(2) };
  };
  out.grip = { outrunner: grip('outrunner'), header: grip('header'), backer: grip('backer') };
  return out;
});
ok(`bark reach: a Huntaway's carries 12 m, an Outrunner's doesn't (${JSON.stringify(r3.bark)})`, r3.bark.huntaway > 0.3 && r3.bark.header > 0 && r3.bark.outrunner === 0, r3.bark);
ok(`punt: Heeler > Header > Huntaway (${JSON.stringify(r3.punt)})`, r3.punt.heeler > r3.punt.header && r3.punt.header > r3.punt.huntaway, r3.punt);
ok(`jump: Backer higher and longer than a Header, a Heeler lower (${JSON.stringify(r3.jump)})`, r3.jump.backer[0] > r3.jump.header[0] && r3.jump.backer[1] > r3.jump.header[1] && r3.jump.heeler[0] < r3.jump.header[0], r3.jump);
ok(`speed: Outrunner > Header > Heeler (${JSON.stringify(r3.speed)})`, r3.speed.outrunner > r3.speed.header && r3.speed.header > r3.speed.heeler, r3.speed);
ok(`stamina: Backer has more left than a Header (${JSON.stringify(r3.wind)})`, r3.wind.backer > r3.wind.header && r3.wind.header >= r3.wind.outrunner, r3.wind);
ok(`grit: a Heeler loses less than a Header, a Backer more (${JSON.stringify(r3.grit)})`, r3.grit.heeler > r3.grit.header && r3.grit.header > r3.grit.backer, r3.grit);
ok(`grip: holding a ram, an Outrunner tires less and drags faster than a Backer (${JSON.stringify(r3.grip)})`,
  r3.grip.outrunner.held === 'ram' && r3.grip.backer.held === 'ram' && r3.grip.header.held === 'ram' && r3.grip.outrunner.cost < r3.grip.header.cost && r3.grip.header.cost < r3.grip.backer.cost && r3.grip.outrunner.spd > r3.grip.header.spd && r3.grip.header.spd > r3.grip.backer.spd, r3.grip);

// 4. training
const r4 = await h.page.evaluate(() => {
  const { G, T, step, living, setBreed, bark, startJump, hurtDog, dogK, train, resetGame, dogSet, floats, CAM_R, CAM_F } = GAME;
  T.train.on = true;
  resetGame();
  const p = G.players[0], d = p.dog; p.kind = 'bot'; p.bot = {};
  const live = living(); for (const s of live) { s.pen = null; s.x = d.x + 300; s.z = d.z; }
  const out = {};
  const as = b => { setBreed(p, b); d.vx = d.vz = 0; d.stamina = 1; d.hopT = d.jumpCd = 0; };
  as('huntaway');
  // barking at nothing
  for (let i = 0; i < 30; i++) { d.barkCd = 0; bark(d); }
  out.nothing = d.tr.xp.bark;
  // barking at a sheep: a level after T.train.lv[0]
  const s = live[0]; const k0 = dogK(d, 'bark'); let n = 0;
  while (d.tr.lv.bark < 1 && n < 100) { s.x = d.x + 5; s.z = d.z; s.air = null; d.barkCd = 0; bark(d); n++; }
  out.barks = n; out.lv = d.tr.lv.bark; out.k = [+k0.toFixed(3), +dogK(d, 'bark').toFixed(3)];
  out.float = floats.some(f => /⬆/.test(f.text));
  // a Header learns 1.5×
  as('header'); let m = 0;
  while (d.tr.lv.bark < 1 && m < 100) { s.x = d.x + 5; s.z = d.z; s.air = null; d.barkCd = 0; bark(d); m++; }
  out.headerBarks = m;
  // swapping back: the Huntaway's level is still there; the barn's chip does it too
  as('huntaway'); out.back = d.tr.lv.bark;
  dogSet(0, { breed: 'heeler' }); out.barnSwap = [d.breed, d.tr.lv.bark];
  dogSet(0, { breed: 'huntaway' }); out.barnBack = [d.breed, d.tr.lv.bark];
  // jumps: on the spot teach nothing; on the move, at most one per jumpGap
  const j0 = d.tr.xp.jump;
  for (let i = 0; i < 10; i++) { d.hopT = d.jumpCd = 0; d.vx = d.vz = 0; startJump(d); G.time += 2; }
  out.spotJumps = d.tr.xp.jump - j0;
  const j1 = d.tr.xp.jump;
  for (let i = 0; i < 10; i++) { d.hopT = d.jumpCd = 0; d.vx = T.dogWalk; d.vz = 0; d.mode = 'walk'; startJump(d); G.time += 0.3; }
  out.runJumps = +(d.tr.xp.jump - j1).toFixed(1); out.jumpMax = 2 * T.train.jump;   // 3 s of jumps, one counted per jumpGap (1.5 s)
  d.vx = 0; d.hopT = 0;
  // sprinting earns speed and stamina
  const go = { mx: CAM_R.x, my: -CAM_F.x }; const sp0 = d.tr.xp.speed, w0 = d.tr.xp.wind, x0 = d.x;
  p.bot = { ...go, sprint: true }; for (let i = 0; i < 80; i++) step(0.025); p.bot = {};
  out.sprint = { m: +Math.abs(d.x - x0).toFixed(0), speed: +(d.tr.xp.speed - sp0).toFixed(2), wind: +(d.tr.xp.wind - w0).toFixed(2) };
  // getting hurt earns grit
  const g0 = d.tr.xp.grit; d.hp = 1; hurtDog(d, 0.2); out.grit = +(d.tr.xp.grit - g0).toFixed(2);
  // the cap
  train(d, 'speed', 1e6); out.cap = [d.tr.lv.speed, +dogK(d, 'speed').toFixed(4), +((1 + T.traits.speed.spread * 0) * (1 + T.traits.speed.per * T.train.lv.length)).toFixed(4)];
  // a new journey starts over
  resetGame(); const d2 = G.players[0].dog;
  out.reset = [d2.breed, d2.tr.lv.bark, d2.tr.lv.speed, +dogK(d2, 'bark').toFixed(3)];
  T.train.on = false;
  return out;
});
ok('barking at nothing teaches nothing', r4.nothing === 0, r4);
ok(`barking at sheep: a level after ${r4.barks} barks, the bark reaches further, ⬆ over the dog`, r4.lv === 1 && r4.barks >= 18 && r4.barks <= 22 && r4.k[1] > r4.k[0] && r4.float, r4);
ok(`a Header gets there in ${r4.headerBarks} (1.5× faster)`, r4.headerBarks < r4.barks * 0.75, r4);
ok('swapping breed and back keeps each one\'s training (and the barn\'s chip does it)', r4.back === 1 && r4.barnSwap[0] === 'heeler' && r4.barnSwap[1] === 0 && r4.barnBack[0] === 'huntaway' && r4.barnBack[1] === 1, r4);
ok('jumping on the spot teaches nothing; on the move only so often', r4.spotJumps === 0 && r4.runJumps > 0 && r4.runJumps <= r4.jumpMax, r4);
ok(`sprinting ${r4.sprint.m} m trains speed and stamina`, r4.sprint.speed > 0.5 && r4.sprint.wind > 0.5, r4.sprint);
ok('getting hurt trains grit', r4.grit > 4, r4);
ok('levels stop at the top', r4.cap[0] === 5 && r4.cap[1] === r4.cap[2], r4.cap);
ok('a new journey starts training over', r4.reset[1] === 0 && r4.reset[2] === 0 && r4.reset[3] === 1.18, r4.reset);

// 5. the barn
const r5 = await h.page.evaluate(() => {
  const { G, openBarn, closeBarn, barnTab, dogLook } = GAME, d = G.players[0].dog;
  openBarn(); barnTab('dogs');
  const out = { chips: document.querySelectorAll('#barnBreed button').length, rows: document.querySelectorAll('#barnTrain .pips').length,
    pips: document.querySelectorAll('#barnTrain .pips i').length, on: (document.querySelector('#barnBreed button.on') || {}).dataset?.breed };
  document.querySelector('#barnBreed button[data-breed="backer"]').click();
  out.after = [d.breed, dogLook(0).breed, (document.querySelector('#barnBreed button.on') || {}).dataset?.breed];
  closeBarn();
  return out;
});
ok('the barn\'s Dogs tab: 5 breed chips, the dog\'s lit, 7 traits × 5 pips', r5.chips === 5 && r5.rows === 7 && r5.pips === 35 && r5.on === 'huntaway', r5);
ok('a chip changes the dog out on the trail', r5.after.every(b => b === 'backer'), r5.after);

// 6. online: a guest's copy
const r6 = await h.page.evaluate(() => {
  const { G, netDogBreed, dogK, T } = GAME, d = G.players[0].dog;
  netDogBreed(d, 'heeler:0300002');
  return { breed: d.breed, bonk: d.lv.bonk, grip: d.lv.grip, k: +dogK(d, 'bonk').toFixed(3), want: +((1 + T.traits.bonk.spread) * (1 + 3 * T.traits.bonk.per)).toFixed(3) };
});
ok('"breed:levels" from the host sets a guest\'s dog', r6.breed === 'heeler' && r6.bonk === 3 && r6.grip === 2 && r6.k === r6.want, r6);

ok('no page errors', h.errors.length === 0, h.errors);
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
