// Headless checks for dog roles and training, and breeds (looks only): `node tools/role-test.mjs`.
//   roles    five, ★ adding up the same; ?sim slots default to Headers
//   title    picking on the title (chips, ←/→ eaten so they don't start), saved, P1's dog gets it; a friend's own pick
//   traits   each role's strengths do something: bark reach, punt, jump, speed, stamina, grit, grip
//   train    doing it levels it (barking at nothing / hopping on the spot doesn't), a level makes it better, cap,
//            a Header learns faster, swapping role and back keeps it, a new journey starts over
//   barn     role chips + the ★ / ● card; a chip changes the live dog
//   net      "role:levels" sets a guest's copy
//   looks    breeds (the herding dogs + the ten most popular): every one builds in every hat and bit of kit, feet on the ground, near the
//            collie's size, a coat each its own; a breed changes nothing a dog does; old saves (role as `breed`) come back right; the barn's ‹ ›
//   barn     opens on the Dogs: cards with portraits; the breed picker (a grid, filters)
//   fur      shells over every long coat part (one mesh each; short coats sleek), none on eyes, nose or collar; outline out in the fur; a slow machine drops them
//   hair     long hair, cords and floppy ears swing (none on a smooth coat): still, it keeps its shape; shaken, it swings and settles; upside down, it falls
//   pack     the DOG PACK on every breed: outside its body and fur, off the ground, clear of its head and legs; pockets fill in turn, salt on top, emptied: off
// Checks: barn opens on the Dogs (cards, portraits, pick); roles: ★ totals, title pick (←/→ eaten, saved), a friend's pick, every trait's
//   effect; training: xp sources, levels, cap, Header 1.5×, role swap keeps it, reset; barn card; net `rol`; breeds: all build in every coat
//   + item, size, looks only, old saves, barn ‹ ›, net look; the pack on every breed (clear of body, ground, head, legs), pockets in turn;
//   hair: keeps its shape, swings and settles, falls upside down; fur: shells on every coat part, none on eyes/collar, 2 programs, lite
import { open } from './harness.mjs';
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

// 1. the roles
const r1 = await h.page.evaluate(() => {
  const { ROLES, TRAITS, T } = GAME;
  return { n: ROLES.length, icons: new Set(ROLES.map(b => b.icon)).size, sums: ROLES.map(b => TRAITS.reduce((a, t) => a + b[t.id], 0)),
    strong: ROLES.map(b => TRAITS.filter(t => b[t.id] === 3).length), learn: ROLES.filter(b => b.learn > 1).map(b => b.id), def: T.roleDef };
});
ok('five roles, an icon each', r1.n === 5 && r1.icons === 5, r1);
ok('every role has the same ★ in all (14)', r1.sums.every(n => n === 14), r1.sums);
ok('every role but the Header is great at two things', r1.strong.filter(n => n === 2).length === 4 && r1.strong[0] === 0, r1.strong);
ok('the Header learns faster', r1.learn.length === 1 && r1.learn[0] === 'header', r1.learn);
ok('?sim: every slot a Header', r1.def.every(b => b === 'header'), r1.def);

// 2. the title pick
const r2 = await h.page.evaluate(() => {
  localStorage.clear(); GAME.loadDogs();
  const { G, dogLook, pickTitleRole, titleRoleInput, keyEdge, startGame, DOGS_KEY } = GAME, out = {};
  out.before = dogLook(0).role;
  keyEdge.add('ArrowRight'); titleRoleInput(); out.right = dogLook(0).role; out.eaten = !keyEdge.has('ArrowRight');
  keyEdge.add('KeyA'); titleRoleInput(); out.left = dogLook(0).role;
  keyEdge.add('ArrowLeft'); titleRoleInput(); out.wrap = dogLook(0).role;
  pickTitleRole('outrunner');
  out.chips = [...document.querySelectorAll('#tRole [data-tb]')].filter(b => !/^-?1$/.test(b.dataset.tb)).length;
  out.on = (document.querySelector('#tRole button.on') || {}).dataset?.tb;
  out.stats = document.querySelectorAll('#tRole .stats > span').length;
  out.saved = (JSON.parse(localStorage.getItem(DOGS_KEY) || 'null') || { looks: [] }).looks[0]?.role;
  out.mode = G.mode;
  GAME.loadDogs(); out.reloaded = dogLook(0).role;
  startGame({ kind: 'bot', index: 0 });
  out.dog = G.dogs[0].role;
  const p = GAME.joinPlayer({ kind: 'bot', index: 1, role: 'backer' }); out.friend = p.dog.role;
  const q = GAME.joinPlayer({ kind: 'bot', index: 2 }); out.slotDef = q.dog.role;
  GAME.dropPlayer(p); GAME.dropPlayer(q);
  return out;
});
ok('→ picks the next role and is eaten (no start)', r2.before === 'header' && r2.right === 'huntaway' && r2.eaten && r2.mode === 'title', r2);
ok('A / ← go back, and wrap round', r2.left === 'header' && r2.wrap === 'backer', r2);
ok('the title shows 5 chips, the picked one lit, 7 traits + learn', r2.chips === 5 && r2.on === 'outrunner' && r2.stats === 7, r2);
ok('the pick is saved', r2.saved === 'outrunner' && r2.reloaded === 'outrunner', r2);
ok('P1\'s dog is that role', r2.dog === 'outrunner', r2);
ok('a friend joining with their own pick gets it; without, the slot\'s', r2.friend === 'backer' && r2.slotDef === 'header', r2);

// 3. the traits do something (training off)
const r3 = await h.page.evaluate(() => {
  const { G, T, step, living, setRole, bark, punt, startJump, hurtDog, dogK, CAM_R, CAM_F } = GAME;
  const p = G.players[0], d = p.dog; p.kind = 'bot'; p.bot = {};
  const live = living(); for (const s of live) { s.pen = null; s.x = d.x + 200; s.z = d.z; }
  G.clock.hour = 10;
  const as = b => { setRole(p, b); d.vx = d.vz = 0; d.stamina = 1; d.exhausted = false; d.hp = 1; d.ko = false; d.stunT = 0; d.hopT = d.jumpCd = 0; d.pounceT = 0; d.holding = null; d.holdKind = null; };
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
  const { G, T, step, living, setRole, bark, startJump, hurtDog, dogK, train, resetGame, dogSet, floats, CAM_R, CAM_F } = GAME;
  T.train.on = true;
  resetGame();
  const p = G.players[0], d = p.dog; p.kind = 'bot'; p.bot = {};
  const live = living(); for (const s of live) { s.pen = null; s.x = d.x + 300; s.z = d.z; }
  const out = {};
  const as = b => { setRole(p, b); d.vx = d.vz = 0; d.stamina = 1; d.hopT = d.jumpCd = 0; };
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
  dogSet(0, { role: 'heeler' }); out.barnSwap = [d.role, d.tr.lv.bark];
  dogSet(0, { role: 'huntaway' }); out.barnBack = [d.role, d.tr.lv.bark];
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
  out.reset = [d2.role, d2.tr.lv.bark, d2.tr.lv.speed, +dogK(d2, 'bark').toFixed(3)];
  T.train.on = false;
  return out;
});
ok('barking at nothing teaches nothing', r4.nothing === 0, r4);
ok(`barking at sheep: a level after ${r4.barks} barks, the bark reaches further, ⬆ over the dog`, r4.lv === 1 && r4.barks >= 18 && r4.barks <= 22 && r4.k[1] > r4.k[0] && r4.float, r4);
ok(`a Header gets there in ${r4.headerBarks} (1.5× faster)`, r4.headerBarks < r4.barks * 0.75, r4);
ok('swapping role and back keeps each one\'s training (and the barn\'s chip does it)', r4.back === 1 && r4.barnSwap[0] === 'heeler' && r4.barnSwap[1] === 0 && r4.barnBack[0] === 'huntaway' && r4.barnBack[1] === 1, r4);
ok('jumping on the spot teaches nothing; on the move only so often', r4.spotJumps === 0 && r4.runJumps > 0 && r4.runJumps <= r4.jumpMax, r4);
ok(`sprinting ${r4.sprint.m} m trains speed and stamina`, r4.sprint.speed > 0.5 && r4.sprint.wind > 0.5, r4.sprint);
ok('getting hurt trains grit', r4.grit > 4, r4);
ok('levels stop at the top', r4.cap[0] === 5 && r4.cap[1] === r4.cap[2], r4.cap);
ok('a new journey starts training over', r4.reset[1] === 0 && r4.reset[2] === 0 && r4.reset[3] === 1.18, r4.reset);

// 5. the barn
const r5 = await h.page.evaluate(() => {
  const { G, openBarn, closeBarn, barnTab, dogLook } = GAME, d = G.players[0].dog;
  openBarn(); barnTab('dogs');
  const out = { chips: document.querySelectorAll('#barnRole button').length, rows: document.querySelectorAll('#barnTrain .pips').length,
    pips: document.querySelectorAll('#barnTrain .pips i').length, on: (document.querySelector('#barnRole button.on') || {}).dataset?.role };
  document.querySelector('#barnRole button[data-role="backer"]').click();
  out.after = [d.role, dogLook(0).role, (document.querySelector('#barnRole button.on') || {}).dataset?.role];
  closeBarn();
  return out;
});
ok('the barn\'s Dogs tab: 5 role chips, the dog\'s lit, 7 traits × 5 pips', r5.chips === 5 && r5.rows === 7 && r5.pips === 35 && r5.on === 'huntaway', r5);
ok('a chip changes the dog out on the trail', r5.after.every(b => b === 'backer'), r5.after);

// 6. online: a guest's copy
const r6 = await h.page.evaluate(() => {
  const { G, netDogRole, dogK, T } = GAME, d = G.players[0].dog;
  netDogRole(d, 'heeler:0300002');
  return { role: d.role, bonk: d.lv.bonk, grip: d.lv.grip, k: +dogK(d, 'bonk').toFixed(3), want: +((1 + T.traits.bonk.spread) * (1 + 3 * T.traits.bonk.per)).toFixed(3) };
});
ok('"role:levels" from the host sets a guest\'s dog', r6.role === 'heeler' && r6.bonk === 3 && r6.grip === 2 && r6.k === r6.want, r6);

// 7. breeds: looks only
const r7 = await h.page.evaluate(() => {
  const { G, DOG_BREEDS, DOG_ITEMS, dogShape, dogGear, buildDog, dogLook, dogSet, dogK, boneMass, DOGS, DOGS_KEY, T } = GAME, out = {};
  out.n = DOG_BREEDS.length; out.herd = DOG_BREEDS.filter(b => b.herd).length; out.top = DOG_BREEDS.filter(b => b.top).map(b => b.id);
  out.first = DOG_BREEDS[0].id;
  out.dupCoat = DOG_BREEDS.filter(b => new Set(b.coats.map(c => c.b)).size !== b.coats.length).map(b => b.id);
  out.bad = []; out.feet = []; out.size = [];
  const add = () => {};
  for (const B of DOG_BREEDS) {
    const S = dogShape(B);
    if (Math.abs(S.hipY - S.lg - 0.01) > 1e-6) out.feet.push(B.id);   // legs hang from the hips to the ground
    const h = (S.head[1] + 0.2 * S.hk) * 1.3, len = (S.torso.s[2] * 2) * 1.3;
    const hc = (0.82 + 0.2) * 1.3, lc = 0.55 * 2 * 1.3;   // the collie's
    if (h < 0.6 * hc || h > 1.12 * hc || len < 0.85 * lc || len > 1.3 * lc || S.mouthZ * S.hk < 0.15 || S.mouthZ * S.hk > 0.5) out.size.push([B.id, +h.toFixed(2), +len.toFixed(2)]);
    for (const c of B.coats) for (const it of [{ id: 'none' }, ...DOG_ITEMS]) {
      try { buildDog({ breed: B.id, coat: c.b, collar: '#e8473f', hat: it.kind === 'hat' ? it.id : 'none', acc: it.kind === 'acc' ? [it.id] : [] }, add); if (it.id !== 'none' && !dogGear(it.id, B)) out.bad.push(B.id + ':' + it.id); }
      catch (e) { out.bad.push(B.id + ':' + c.n + ':' + it.id + ' ' + e.message); }
    }
  }
  localStorage.clear(); GAME.loadDogs(); GAME.resetGame && GAME.resetGame();
  const p = G.players[0], d = p.dog, k0 = ['bark', 'bonk', 'jump', 'speed', 'wind', 'grit', 'grip'].map(t => dogK(d, t)).join(), m0 = boneMass(d, 'dog');
  dogSet(0, { breed: 'dachshund' }); out.look = [dogLook(0).breed, d.models.breed, dogLook(0).coat];
  out.same = ['bark', 'bonk', 'jump', 'speed', 'wind', 'grit', 'grip'].map(t => dogK(d, t)).join() === k0 && boneMass(d, 'dog') === m0 && d.role === p.role;
  dogSet(0, { coat: '#123456' }); out.coatKept = dogLook(0).coat === out.look[2];   // not one of its coats: stays
  dogSet(0, { breed: 'border' }); out.coatBack = DOG_BREEDS[0].coats.some(c => c.b === dogLook(0).coat);
  GAME.saveDogs(); localStorage.setItem(DOGS_KEY, JSON.stringify({ v: 1, found: [], looks: [{ coat: '#6b3a22', collar: '#3d8ef0', breed: 'heeler' }] })); GAME.loadDogs();
  out.old = [dogLook(0).role, dogLook(0).breed, dogLook(0).coat];
  GAME.openBarn(); GAME.barnTab('dogs');
  const nm = () => document.getElementById('barnBreedName').textContent;
  out.barn0 = nm(); document.querySelector('#barnBreed [data-dbr="1"]').click(); out.barn1 = [nm(), dogLook(0).breed, document.querySelectorAll('#barnCoat .swatch').length];
  document.querySelector('#barnBreed [data-dbr="-1"]').click(); document.querySelector('#barnBreed [data-dbr="-1"]').click(); out.barnWrap = dogLook(0).breed;
  GAME.closeBarn();
  const lk = JSON.stringify({ ...dogLook(0), breed: 'poodle', coat: '#232226' }); GAME.netDogLook(d, lk); out.net = [d.models.breed, d.netLook && d.netLook.coat];   // ONLINE: the host's look for it
  return out;
});
ok(`${r7.n} breeds: ${r7.herd} herding (the Border Collie first) and the ten most popular`, r7.n >= 45 && r7.herd >= 36 && r7.first === 'border'
  && ['frenchie', 'lab', 'golden', 'gsd', 'dachshund', 'poodle', 'beagle', 'rottweiler', 'gsp', 'bulldog'].every(id => r7.top.includes(id)) && r7.top.length === 10, r7);
ok('every breed builds in every coat, hat and bit of kit', r7.bad.length === 0, r7.bad.slice(0, 8));
ok('feet on the ground, near the collie\'s size, a mouth where its head is', r7.feet.length === 0 && r7.size.length === 0, { feet: r7.feet, size: r7.size });
ok('each coat its own in a breed', r7.dupCoat.length === 0, r7.dupCoat);
ok('a breed is only looks: the dog\'s model changes, nothing it does (stats, weight, role)', r7.look[0] === 'dachshund' && r7.look[1] === 'dachshund' && r7.same, r7);
ok('a coat it can\'t have isn\'t put on; a breed change keeps a coat it can have', r7.coatKept && r7.coatBack, r7);
ok('an old save (role saved as `breed`): that role, a Border Collie, its coat', r7.old[0] === 'heeler' && r7.old[1] === 'border' && r7.old[2] === '#6b3a22', r7.old);
ok('online: the host\'s look (a breed and coat) rebuilds a guest\'s dog', r7.net[0] === 'poodle' && r7.net[1] === '#232226', r7.net);
ok('the barn: ‹ › steps the breed, the coats are that breed\'s, it wraps', r7.barn0 === 'Border Collie' && r7.barn1[0] === 'Rough Collie' && r7.barn1[1] === 'rough' && r7.barn1[2] === 3 && r7.barnWrap === 'bulldog', r7);

// 8. HAIR: drawing only
const r8 = await h.page.evaluate(() => {
  const { BARN, openBarn, barnTab, dogSet, hairStep, DOG_BREEDS } = GAME, out = {};
  openBarn(); barnTab('dogs');
  const ang = P => 2 * Math.acos(Math.min(1, Math.abs(P.g.quaternion.w))) * 57.3, max = M => Math.max(0, ...M.hair.map(ang));
  out.none = []; out.some = [];
  for (const B of DOG_BREEDS) { dogSet(0, { breed: B.id }); (BARN.dogM.hair.length ? out.some : out.none).push(B.id); }
  for (const b of ['puli', 'oes', 'beagle', 'golden']) {
    dogSet(0, { breed: b }); const M = BARN.dogM, root = M.root, o = out[b] = {};
    for (let f = 0; f < 120; f++) hairStep(M, 1 / 60, -9); o.still = +max(M).toFixed(1);
    for (let f = 0; f < 30; f++) { root.position.x = 0.2 * Math.sin(f / 60 * 16); hairStep(M, 1 / 60, -9); } o.shaken = +max(M).toFixed(1);
    root.position.x = 0; for (let f = 0; f < 150; f++) hairStep(M, 1 / 60, -9); o.settled = +max(M).toFixed(1);
    root.rotation.z = Math.PI; root.position.y = 2; for (let f = 0; f < 120; f++) hairStep(M, 1 / 60, -9);
    const P = M.hair.find(p => p.kind !== 'fringe');
    o.flipDown = P.tip.y < P.pw.y - 0.5 * P.L * 1.3; o.nan = M.hair.some(p => !isFinite(p.tip.x + p.tip.y + p.tip.z));
    root.rotation.z = 0; root.position.set(0, 0.02, 0);
  }
  GAME.closeBarn();
  return out;
});
ok(`hair on ${r8.some.length} breeds (long coats, floppy ears; a smooth prick-eared coat: none)`, r8.some.length >= 15 && ['puli', 'bergamasco', 'oes', 'bearded', 'briard', 'beagle', 'dachshund', 'lab', 'golden', 'rough', 'poodle'].filter(b => b !== 'lab').every(b => r8.some.includes(b)) && r8.none.includes('malinois') && r8.none.includes('frenchie'), r8);
ok('hair: still, it keeps its shape; shaken, it swings; then settles', ['puli', 'oes', 'beagle', 'golden'].every(b => r8[b].still < 20 && r8[b].shaken > r8[b].still + 25 && r8[b].settled < r8[b].still + 6), ['puli', 'oes', 'beagle', 'golden'].map(b => [b, r8[b]]));
ok('hair: upside down, it hangs down (and never blows up)', ['puli', 'oes', 'beagle', 'golden'].every(b => r8[b].flipDown && !r8[b].nan), ['puli', 'oes', 'beagle', 'golden'].map(b => [b, r8[b]]));

// 9. FUR: drawing only
const r9 = await h.page.evaluate(() => {
  const { BARN, openBarn, barnTab, dogSet, DOG_BREEDS, FUR_MATS, T } = GAME, out = { bad: [] };
  openBarn(); barnTab('dogs');
  const shells = o => { let n = 0; o.traverse(c => { if (c.material && c.material.defines && c.material.defines.FUR_SHELL) n++; }); return n; };
  for (const B of DOG_BREEDS) {
    dogSet(0, { breed: B.id, acc: [] }); const M = BARN.dogM;
    const body = M.body.children.find(c => c.isMesh), head = M.head.children.filter(c => c.isMesh);
    const n = B.fur === 'short' ? 0 : 1;   // a short coat: smooth (no shells, a clean outline)
    const ok = shells(body) === n && head.some(m => shells(m) === n) && head.some(m => m.isMesh && shells(m) === 0 && !(m.material.defines || {}).FUR_SHELL)
      && M.legs.every(g => shells(g) === n) && shells(M.tail) === n && shells(M.neck) === 0;
    if (!ok) out.bad.push(B.id);
    const ink = body.children.find(c => c.material && c.material.uniforms && c.material.uniforms.uFurOut); if (!ink !== !n) out.bad.push(B.id + ':ink');
    if (!n && body.material !== FUR_MATS.get('sleek')) out.bad.push(B.id + ':sleek');
  }
  out.total = (() => { dogSet(0, { breed: 'bearded' }); return shells(BARN.dogM.root); })();
  out.mats = [...FUR_MATS.values()].filter(m => m.defines && m.defines.FUR_SHELL).length;
  out.programs = new Set([...FUR_MATS.values()].map(m => m.customProgramCacheKey())).size;
  const was = T.fur.lite; GAME.furLite && GAME.furLite(); out.lite = [...FUR_MATS.values()].filter(m => m.defines && m.defines.FUR_SHELL).every(m => !m.visible) && FUR_MATS.get('coat').visible;
  T.fur.lite = was; for (const m of FUR_MATS.values()) m.visible = true;
  GAME.closeBarn();
  return out;
});
ok('fur: every long coat (body, head, legs, tail) has one shell mesh each, its eyes, nose and collar none, its outline out in the fur; a short coat sleek, none', r9.bad.length === 0, r9.bad);
ok(`fur: ${r9.mats} coat lengths, 2 programs (no recompiles)`, r9.programs === 2 && r9.mats >= 4, r9);
ok('fur: a slow machine drops the shells, keeps the coat', r9.lite, r9);

// 10. the barn opens on the Dogs: a card each (a portrait), a click picks one; a sheep asked for opens the flock
const r10 = await h.page.evaluate(() => {
  const { G, BARN, openBarn, closeBarn, barnRender, THUMB } = GAME, out = {};
  openBarn(); out.tab = BARN.tab; out.cards = document.querySelectorAll('#barnList .dogCard').length; out.first = document.querySelector('.barnTabs button').dataset.tab;
  for (let i = 0; i < 8; i++) barnRender(1 / 60);
  out.pics = [...document.querySelectorAll('#barnList .dogCard img')].filter(i => (i.getAttribute('src') || '').startsWith('data:image/png')).length;
  document.querySelector('.dogCard[data-dog="2"]').click(); out.dog = BARN.dog; out.on = document.querySelector('.dogCard.on').dataset.dog;
  out.sparks = document.querySelectorAll('.dogCard .spark').length; closeBarn();
  openBarn(G.sheep.find(s => !s.dead)); out.sheepTab = BARN.tab; closeBarn();
  return out;
});
ok('the barn opens on the Dogs (its tab first), a card each with its portrait; a click picks one (sparks); a sheep: the flock', r10.tab === 'dogs' && r10.first === 'dogs' && r10.cards === 4 && r10.pics === 4
  && r10.dog === 2 && r10.on === '2' && r10.sparks > 0 && r10.sheepTab === 'sheep', r10);

// 11. the breed picker: every breed in a grid, the dog's own lit; filters (group, coat, size); a click, the arrows; Esc: back
const r11 = await h.page.evaluate(() => {
  const { BARN, openBarn, closeBarn, dogLook, dogSet, DOG_BREEDS } = GAME, out = {}, lit = () => [...document.querySelectorAll('#bpGrid .bpItem.on')].map(b => b.dataset.breed);
  const key = code => document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  dogSet(0, { breed: 'border' }); openBarn(); GAME.barnPickDog(0); document.getElementById('barnBreedOpen').click();
  out.open = BARN.pick && !!document.querySelector('#breedPick #bpView canvas'); out.tiles = document.querySelectorAll('#bpGrid .bpItem').length; out.lit0 = lit();
  document.querySelector('[data-bf="c:smooth"]').click(); out.smooth = [...document.querySelectorAll('#bpGrid .bpItem')].map(b => b.dataset.breed);
  document.querySelector('[data-bf="s:s"]').click(); out.smallSmooth = [...document.querySelectorAll('#bpGrid .bpItem')].map(b => b.dataset.breed);
  document.querySelector('[data-bf="all"]').click(); out.all = document.querySelectorAll('#bpGrid .bpItem').length;
  document.querySelector('.bpItem[data-breed="kelpie"]').click(); out.picked = dogLook(0).breed; out.lit1 = lit();
  key('ArrowRight'); out.right = dogLook(0).breed;
  key('Escape'); out.closed = !BARN.pick && !document.getElementById('breedPick') && !!document.querySelector('#barnViewWrap canvas') && BARN.open;
  closeBarn(); dogSet(0, { breed: 'border' });
  return out;
});
const order = r11.smooth && r11.smooth.join();
ok('the breed picker: all 48 in a grid (the dog\'s own lit); coat and size filters; a click picks one (lit); → the next; Esc: back to the barn', r11.open && r11.tiles === 48 && r11.lit0.join() === 'border'
  && r11.smooth.length === 17 && r11.smooth.includes('smooth') && !r11.smooth.includes('border') && r11.smallSmooth.length > 0 && r11.smallSmooth.every(b => r11.smooth.includes(b)) && r11.smallSmooth.includes('frenchie') && !r11.smallSmooth.includes('lab')
  && r11.all === 48 && r11.picked === 'kelpie' && r11.lit1.join() === 'kelpie' && r11.right === 'nzhuntaway' && r11.closed, { ...r11, smooth: order });

// 12. DOG PACK: every breed wears it (outside its body, off the ground, clear of its head and legs); pockets fill in turn; emptied: off
const r12 = await h.page.evaluate(() => {
  const { DOG_BREEDS, dogShape, dogPackBuild, dogPackSync, packHull, THREE } = GAME, out = { bad: [] };
  const grp = () => new THREE.Group(), mesh = geo => new THREE.Mesh(geo);
  for (const B of DOG_BREEDS) {
    const S = dogShape(B), meshes = [], M = { look: { breed: B.id, collar: '#3d8ef0' }, body: grp() };
    const pk = dogPackBuild(M, (par, geo) => { const m = mesh(geo); par.add(m); meshes.push(m); return m; });
    dogPackSync(pk, 1, true, 0, true); M.body.updateMatrixWorld(true);
    const H = packHull(S), legs = [[0.12, 0.27], [-0.12, 0.27], [0.12, -0.3], [-0.12, -0.3]].map(([x, z]) => [x * S.F, z * S.Ln]);
    let inside = 0, minY = 9, head = 0, leg = 0, n = 0; const hr = 0.22 * S.hk;
    for (const m of meshes) {
      if (m.parent === pk.salt || pk.slots.some(sl => sl.g === m.parent)) continue;   // (what's in the pockets)
      const a = m.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        const w = m.localToWorld(new THREE.Vector3(a.getX(i), a.getY(i), a.getZ(i))); n++;
        for (const e of H) if (((w.x - e.c[0]) / e.s[0]) ** 2 + ((w.y - e.c[1]) / e.s[1]) ** 2 + ((w.z - e.c[2]) / e.s[2]) ** 2 < 0.97) { inside++; break; }
        minY = Math.min(minY, w.y); if (((w.x - S.head[0]) / (hr * B.sw)) ** 2 + ((w.y - S.head[1]) / (hr * B.sh)) ** 2 + ((w.z - S.head[2]) / hr) ** 2 < 1) head++;   // (its skull, a bit over)
        if (w.y < S.hipY - 0.02) for (const [lx, lz] of legs) if (Math.hypot(w.x - lx, w.z - lz) < S.legR + 0.005) leg++;
      }
    }
    const r = { inside, minY: +minY.toFixed(3), head, leg };
    if (inside || minY < 0.005 || head || leg) out.bad.push([B.id, r]);
    out.n = (out.n || 0) + 1;
  }
  const M = { look: { breed: 'border', collar: '#e8473f' }, body: grp() }, pk = dogPackBuild(M, (par, geo) => { const m = mesh(geo); par.add(m); return m; });
  const fill = k => { dogPackSync(pk, k, false, 0, true); return pk.slots.map(sl => sl.g.visible ? 1 : 0).join(''); };
  out.fill = [0.2, 0.3, 0.55, 0.8, 1].map(fill); dogPackSync(pk, 0, true, 0, true); out.salt = [pk.root.visible, pk.salt.visible, pk.slots.some(sl => sl.g.visible)];
  dogPackSync(pk, 0, false, 0, true); out.off = pk.root.visible;
  for (let i = 0; i < 60; i++) dogPackSync(pk, 0.5, false, 1 / 60); out.pop = +pk.s.toFixed(2);
  for (let i = 0; i < 90; i++) dogPackSync(pk, 0, false, 1 / 60); out.gone = pk.root.visible;
  return out;
});
ok(`the pack on all ${r12.n} breeds: outside its body and fur, off the ground (a corgi's belly strap too), clear of its head and legs`, r12.n === 48 && r12.bad.length === 0, r12.bad.slice(0, 6));
ok('the pack: pockets fill in turn (bags, then pockets), salt on top, empty: none; it pops on, comes off', r12.fill.join() === '1000,1100,1110,1111,1111' && r12.salt.join() === 'true,true,false' && r12.off === false
  && Math.abs(r12.pop - 1) < 0.05 && r12.gone === false, r12);

ok('no page errors', h.errors.length === 0, h.errors);
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
