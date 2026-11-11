// Headless checks for BONES: dug up (and there for good), bitten, carried crosswise (free), thrown by a tap (further running),
// bouncing and sliding to rest; hits by real physics (the change in speed is J/m: lighter things fly, heavier ones barely move,
// the bone bounces back off heavy ones); reactions (lamb bowled, dog knocked, coyote scared, cougar spooked, Hank stumbles);
// not its own thrower; a pounce kicks a lying one; caught in the air; kept on this device; still there on a new journey.
// node tools/bone-test.mjs
import { open } from './harness.mjs';
let h = await open(), errors = [], fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const setup = async () => { errors.push(...h.errors); await h.close(); h = await open(); return h.page.evaluate(() => {
  const { G, step, startGame, groundY, CAM_R, CAM_F, pathPoint } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.clock.hour = 10;
  const H = window.H = {};
  H.P = pathPoint(330, 6);   // open ground
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.run = (sec, fn) => { for (let t = 0; t < sec - 1e-9; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return sec; };
  H.tap = (p, extra = {}) => { p.bot = { ...extra, grabTap: true }; step(0.025); p.bot = { ...extra }; };
  H.place = (e, x, z, yaw) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); if (yaw !== undefined) e.yaw = yaw; };
  H.away = () => { G.sheep.forEach((o, i) => H.place(o, H.P.x + 80 + (i % 6) * 2, H.P.z + 80 + Math.floor(i / 6) * 2)); GAME.HANK.x = H.P.x - 70; GAME.HANK.z = H.P.z - 70; };
  H.r = v => +(+v).toFixed(2);
  H.rest = b => b.h <= 0 && Math.hypot(b.vx, b.vz) < 0.02 && !b.by;
  return true;
}); };
await setup();

// 1. dug up: a bone pops out and lies by the hole; it stays on a new journey
const r1 = await h.page.evaluate(() => {
  const { G, T, DIGS, BONES, digUp, DOGS, DOG_ITEMS, resetGame } = GAME, d = G.dogs[0], sp = DIGS[3];
  T.dig.treasure = 0; T.dig.bone = 1; if (!DOGS.found.length) DOGS.found.push(DOG_ITEMS[0].id);
  digUp(sp, d); const n = BONES.length, b = BONES[0];
  H.run(3); const out = { n, from: H.r(Math.hypot(b.x - sp.x, b.z - sp.z)), rest: H.rest(b) };
  const x = b.x, z = b.z; resetGame(); H.run(0.2); out.kept = BONES.length === 1 && BONES[0].x === x && BONES[0].z === z;
  return out;
});
ok(`a dug-up bone lies by the hole (${r1.from} m)`, r1.n === 1 && r1.from < 4 && r1.rest, r1);
ok('still there on a new journey', r1.kept, r1);

// 2. bitten, carried crosswise at its mouth, no stamina; one tap: thrown a moment later; running: further
await setup();
const r2 = await h.page.evaluate(() => {
  const { G, BONES, spawnBone, T } = GAME, d = G.dogs[0], p = d.player, out = {};
  H.away(); const b = spawnBone(H.P.x, H.P.z); H.place(d, H.P.x - 1.6, H.P.z, Math.PI / 2); p.bot = {}; H.run(0.1);
  H.tap(p); out.held = d.holding === b && b.by === d && d.holdKind === 'bone';
  d.stamina = 0.6; p.bot = H.inp(1, 0); H.run(1.5); p.bot = {}; H.run(0.6);
  out.atMouth = H.r(Math.hypot(b.x - (d.x + Math.sin(d.yaw) * 0.95), b.z - (d.z + Math.cos(d.yaw) * 0.95))); out.stamina = H.r(d.stamina);
  // standing toss
  H.tap(p); out.notYet = b.by === d; let x0, z0; H.run(0.5, () => { if (!b.by) { x0 = b.x; z0 = b.z; return true; } });
  H.run(3, () => H.rest(b)); out.stand = H.r(Math.hypot(b.x - x0, b.z - z0)); out.restS = H.rest(b);
  // running toss
  const ya = Math.atan2(H.P.tx, H.P.tz); H.place(d, b.x - H.P.tx * 1.6, b.z - H.P.tz * 1.6, ya); H.run(0.4); H.tap(p); out.again = d.holding === b;   // (up the trail: open ground)
  p.bot = H.inp(H.P.tx, H.P.tz, { sprint: true }); H.run(0.8); H.tap(p, H.inp(H.P.tx, H.P.tz, { sprint: true })); H.run(0.5, () => { if (!b.by) { x0 = b.x; z0 = b.z; return true; } }); p.bot = {};
  H.run(4, () => H.rest(b)); out.run = H.r(Math.hypot(b.x - x0, b.z - z0)); out.restR = H.rest(b);
  return out;
});
ok('a tap bites it: carried at its mouth', r2.held && r2.atMouth < 0.2, r2);
ok(`carrying it costs no stamina (0.6 → ${r2.stamina})`, r2.stamina > 0.6, r2);
ok(`one tap throws it (a moment later): standing ${r2.stand} m, running ${r2.run} m, then it lies still`, r2.notYet && r2.stand > 2.5 && r2.stand < 9 && r2.again && r2.run > r2.stand * 1.5 && r2.restS && r2.restR, r2);

// 3. the same throw into each kind of thing: the change in speed is J/m (lighter: more), the bone bounces back off heavy ones
await setup();
const r3 = await h.page.evaluate(() => {
  const { G, T, BONES, spawnBone, boneMass, COUGARS, spawnPack, HANK } = GAME, out = {};
  const coy = spawnPack(1, { howl: false }).members[0];   // (before the flock's moved off: it needs room round it)
  const d = G.dogs[0]; H.away(); H.place(d, H.P.x - 40, H.P.z - 40);
  const ewe = G.sheep.find(s => !s.ram && !s.lamb), ram = G.sheep.find(s => s.ram);
  let lamb = G.sheep.find(s => s.lamb); if (!lamb) { lamb = G.sheep.find(s => !s.ram && s !== ewe); lamb.lamb = true; lamb.r = 0.36; }
  lamb.age = 0;   // (newborn)
  for (const s of G.sheep) s.grow = GAME.ageGrow(s);   // (the size it's drawn at: ?sim doesn't draw)
  const dog2 = GAME.joinPlayer({ kind: 'bot', index: 1 }).dog; dog2.player.bot = {};
  const cat = COUGARS[0];
  const shot = (e, kind, v = 22) => {   // (about a sprinting throw)
    H.place(e, H.P.x, H.P.z); if (kind === 'cougar') { e.state = 'stalk'; e.h = 0; e.y = GAME.groundY(e.x, e.z); }
    const b = spawnBone(H.P.x - 2, H.P.z); b.h = 0.4; b.vx = v; b.vy = 0.5; b.from = null; e.lastBone = null;
    let t = 0; H.run(0.6, () => { t += 0.025; return e.lastBone; });
    const L = e.lastBone, m = boneMass(e, kind), vn = L ? L.vn : v, J = (1 + T.bone.e) * vn / (1 / T.bone.m + 1 / m);   // (vn: how fast it came in, relative to the thing)
    const r = { m: H.r(m), dv: L ? H.r(L.dv) : null, want: H.r(J / m), per: L ? +(L.dv / vn).toFixed(4) : null, vn: H.r(vn), back: H.r(b.vx) };
    GAME.killBone(b); H.place(e, H.P.x - 30 - Math.random() * 20, H.P.z + 30 + Math.random() * 20); return r;
  };
  out.lamb = shot(lamb, 'sheep'); out.lambFlew = !!lamb.air;
  out.coyote = shot(coy, 'coyote'); out.coyState = coy.state;
  out.dog = shot(dog2, 'dog'); out.dogDown = dog2.stunT > 0; dog2.stunT = 0;
  out.ewe = shot(ewe, 'sheep');
  out.ram = shot(ram, 'sheep');
  out.cougar = shot(cat, 'cougar'); out.catState = cat.state; cat.state = 'away';
  out.hank = shot(HANK, 'hank'); out.hankStumble = H.r(HANK.stumble);
  return out;
});
const kinds = ['coyote', 'lamb', 'dog', 'cougar', 'ewe', 'hank', 'ram'];
ok('every throw hits: the change in speed is J/m, J = (1+e)·v/(1/m_bone + 1/m)', kinds.every(k => r3[k].dv !== null && r3[k].vn > 15 && Math.abs(r3[k].dv - r3[k].want) / r3[k].want < 0.03), r3);
const byMass = [...kinds].sort((a, b) => r3[a].m - r3[b].m);
ok(`lighter flies, heavier barely moves (Δv per m/s in: ${byMass.map(k => `${k} ${r3[k].m} kg ${r3[k].per}`).join(', ')})`, byMass.every((k, i) => !i || r3[k].per <= r3[byMass[i - 1]].per + 1e-9) && r3.coyote.dv > 4 * r3.ram.dv, r3);
ok(`it bounces back off heavy things, less off light ones (ram ${r3.ram.back}, lamb ${r3.lamb.back} m/s)`, r3.ram.back < -5 && r3.ram.back < r3.lamb.back, r3);
ok('a lamb bowled over, a dog knocked down, a coyote sent off, a stalking cougar spooked, Hank staggers',
  r3.lambFlew && r3.dogDown && ['flee', 'leave'].includes(r3.coyState) && r3.catState === 'retreat' && r3.hankStumble > 0, r3);

// 4. never its own thrower; a pounce kicks a lying one; a dog catches one in the air; knocked over, it drops it
await setup();
const r4 = await h.page.evaluate(() => {
  const { G, BONES, spawnBone, knockDog } = GAME, d = G.dogs[0], p = d.player, out = {};
  H.away(); const b = spawnBone(H.P.x, H.P.z); H.place(d, H.P.x - 1.6, H.P.z, Math.PI / 2); p.bot = {};
  H.tap(p); H.run(0.5); H.tap(p); d.lastBone = null; H.run(2); out.selfHit = !!d.lastBone;
  // a pounce kicks it
  const x0 = b.x, z0 = b.z; H.place(d, b.x - 2.6, b.z, Math.PI / 2); d.pounceCD = 0; p.bot = H.inp(1, 0, { pounce: true }); GAME.step(0.025); p.bot = {};
  H.run(3, () => H.rest(b) && Math.hypot(b.x - x0, b.z - z0) > 1); out.kicked = H.r(Math.hypot(b.x - x0, b.z - z0));
  // a catch: thrown at its mouth, a tap as it comes
  const c = spawnBone(d.x + Math.sin(d.yaw) * 4, d.z + Math.cos(d.yaw) * 4); c.h = 0.8; c.vx = -Math.sin(d.yaw) * 8; c.vz = -Math.cos(d.yaw) * 8; c.vy = 1; c.from = null;
  H.run(0.4, () => Math.hypot(c.x - d.x, c.z - d.z) < 2.6); H.tap(p); H.run(0.05); out.caught = d.holding === c && c.by === d;
  knockDog(d, 3, 0, 0.5); H.run(0.1); out.dropped = !c.by && !d.holding;
  return out;
});
ok('its own thrower is never hit', !r4.selfHit, r4);
ok(`a pounce kicks a lying bone (${r4.kicked} m)`, r4.kicked > 2, r4);
ok('caught in the air; knocked over, the dog drops it', r4.caught && r4.dropped, r4);

// 5. kept on this device: saved, and back where they were on the next visit
await setup();
const r5 = await h.page.evaluate(() => {
  const { T, BONES, spawnBone, killBone, saveBones, loadBones, BONE_KEY } = GAME;
  T.bone.save = true; spawnBone(H.P.x + 3, H.P.z + 1); spawnBone(H.P.x - 2, H.P.z + 5); saveBones();
  const saved = JSON.parse(localStorage.getItem(BONE_KEY) || '[]').length, at = BONES.map(b => [H.r(b.x), H.r(b.z)]).join();
  for (const b of [...BONES]) killBone(b); loadBones();
  const back = BONES.map(b => [H.r(b.x), H.r(b.z)]).join(), r1 = v => Math.round(v * 10) / 10;
  const near = BONES.every((b, i) => Math.abs(b.x - +at.split(',')[i * 2]) < 0.06 && Math.abs(b.z - +at.split(',')[i * 2 + 1]) < 0.06); localStorage.removeItem(BONE_KEY); T.bone.save = false;
  return { saved, at, back, n: BONES.length, near };
});
ok('kept on this device: saved, and back where they lay', r5.saved === 2 && r5.n === 2 && r5.near, r5);

errors.push(...h.errors);
ok('no page errors', !errors.length, errors);
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
