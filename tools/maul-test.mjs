// Headless test: `node tools/maul-test.mjs`. Dog health: cougar maulings, mashing free, coyote nips, barks wearing off.
//   maul     a dog walks up to a stalking cougar: it leaps on it and takes about half its health, then leaves
//   mash     the same, mashing pounce: free fast, little lost
//   partner  a second dog pounces the cougar off
//   ko       a dog on low health is mauled: knocked out till Hank comes and brings it round (a partner nosing it doesn't); heals over time
//   nip      a coyote wise to barking nips a dog standing by it
//   bonk     a fleeing cougar gets pounced, from the trail side then the tree side: each time it flies off the way the dog hit it
//            (not toward its tree), lands dazed, then limps home slower (a dog catches it)
//   chase    a dog chases a bonked cougar home: bonked flying again and again till it's up a tree
//   barks    barks spook a cougar T.barkWise times, then it comes for the dog
//   grab     a dog grabs a cougar: held (and the sheep it was dragging saved), sooner or later it scratches (hp lost) and is off;
//            grabbed again and shaken all the while: never scratches, tossed flying
//   knock    a sheep punted up into a cougar on its limb: knocked out of the tree, flying, lands dazed
import { open } from './harness.mjs';
const h = await open();
const run = scen => h.page.evaluate(async scen => {
  const { G, T, step, startGame, resetGame, COUGARS, cougarHunt, living, joinPlayer, bark, spawnPack } = GAME;
  if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); else resetGame();
  const p = G.players[0]; p.bot = {};
  const k = COUGARS[0], L = k.lair, d = G.dogs[0];
  const ux = Math.sin(L.yaw), uz = Math.cos(L.yaw);
  G.clock.hour = 21; G.clock.day = 2;
  const live = living(); live.forEach((s, i) => { s.lamb = i < 2; s.ram = false; s.x = L.x + ux * 22 + (Math.random() - 0.5) * 6; s.z = L.z + uz * 22 + (Math.random() - 0.5) * 6; s.hunger = 0.3; s.vx = s.vz = 0; s.pen = null; });
  const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
  const toward = (o, x, z, extra = {}) => { const dx = x - o.x, dz = z - o.z, l = Math.hypot(dx, dz) || 1; return { mx: (dx * R.x + dz * R.z) / l, my: -(dx * F.x + dz * F.z) / l, ...extra }; };
  const stalking = () => { d.x = L.x + ux * 60; d.z = L.z + uz * 60; cougarHunt(k, 0); for (let i = 0; i < 400 && k.state !== 'stalk'; i++) step(0.025); };
  const out = { scen };
  if (scen === 'nip') {
    const pk = spawnPack(1, { howl: false }), c = pk.members[0];
    c.x = d.x + 1.2; c.z = d.z; c.state = 'pack'; c.bold = true; c.gx = d.x; c.gz = d.z; c.spd = 4;
    const hp0 = d.hp; let t = 0;
    while (t < 3 && d.hp >= hp0) { c.gx = d.x; c.gz = d.z; step(0.025); t += 0.025; }
    Object.assign(out, { hp: +d.hp.toFixed(3), lost: +(hp0 - d.hp).toFixed(3), t: +t.toFixed(2), coyote: c.state });
    return out;
  }
  if (scen === 'barks') {
    stalking();
    const res = [];
    for (let i = 0; i < T.barkWise + 1; i++) {
      if (!['stalk'].includes(k.state)) { k.state = 'stalk'; k.t = 0; k.target = null; k.y = GAME.groundY(k.x, k.z); }
      d.x = k.x + 6; d.z = k.z; d.vx = d.vz = 0;   // in the face-off ring, out of maul range
      d.barkCd = 0; bark(d); res.push(k.state);
    }
    Object.assign(out, { states: res });
    return out;
  }
  if (scen === 'bonk') {
    stalking(); k.state = 'retreat'; k.t = 0; k.target = null;
    const L2 = k.lair, kx = L2.bx + ux * 25, kz = L2.bz + uz * 25;
    const put = () => { k.x = kx; k.z = kz; k.vx = k.vz = 0; k.state = 'retreat'; k.t = 0; k.dazeT = 0; k.air = null; k.h = 0; k.y = GAME.groundY(k.x, k.z); };
    const sp = () => { put(); let m = 0; for (let i = 0; i < 60 && k.state === 'retreat'; i++) { step(0.025); m = Math.max(m, Math.hypot(k.vx, k.vz)); } return m; };
    const v0 = sp(); const b0 = k.bonks || 0, flights = [];
    for (const side of [1, -1]) {   // pounce it from the trail side (into its tree), then from the tree side (away from it)
      put(); d.x = k.x + ux * 1.5 * side; d.z = k.z + uz * 1.5 * side; d.vx = d.vz = 0; d.pounceCD = 0; d.stunT = 0; d.air = null;
      p.bot = toward(d, k.x, k.z, { pounce: true }); step(0.025); p.bot = {};
      let top = 0, t = 0, flew = false; while (t < 3 && (k.state === 'fly' || t < 0.05)) { flew ||= k.state === 'fly'; top = Math.max(top, k.h); step(0.025); t += 0.025; }
      const fx = k.x - kx, fz = k.z - kz, far = Math.hypot(fx, fz) || 1;
      flights.push({ flew, top: +top.toFixed(2), far: +far.toFixed(1), way: +(-(fx * ux + fz * uz) * side / far).toFixed(2), landed: k.state, dazed: k.dazeT > 0 });
    }
    Object.assign(out, { bonks: (k.bonks || 0) - b0, flights, v0: +v0.toFixed(2), v1: +sp().toFixed(2), walk: T.dogWalk });
    return out;
  }
  if (scen === 'grab') {
    stalking();
    const face = () => { k.state = 'retreat'; k.t = 0; k.dazeT = 0; k.air = null; k.h = 0; k.vx = k.vz = 0; k.y = GAME.groundY(k.x, k.z);
      d.x = k.x + ux * 1.6; d.z = k.z + uz * 1.6; d.vx = d.vz = 0; d.yaw = Math.atan2(-ux, -uz); d.stunT = 0; d.air = null; d.stamina = 1; d.hp = 1; d.ko = false; d.grabLock = false; };
    // dragging a sheep: grabbed, the sheep's saved; then held, no shaking, till it scratches
    const s = living().find(o => !o.lamb && !o.ram); face(); GAME.cougarGrab(k, s); d.x = k.x + ux * 1.6; d.z = k.z + uz * 1.6;
    const saved0 = G.stats.saved; p.bot = { grab: true }; step(0.025);
    const held = d.holding === k && k.state === 'held', saved = G.stats.saved - saved0, free = !s.grabbed;
    let t = 0; while (t < 20 && d.holding === k) { step(0.025); t += 0.025; }
    const scratch = { t: +t.toFixed(2), lost: +(1 - d.hp).toFixed(3), let: d.holding !== k, st: k.state };
    p.bot = {}; for (let i = 0; i < 40; i++) step(0.025);
    // again, shaking it all the while
    face(); p.bot = { grab: true }; step(0.025); const held2 = d.holding === k;
    let t2 = 0, hp2 = d.hp, tossed = false; d.shakes = 0;
    while (t2 < 8 && d.holding === k) { p.bot = { grab: true, shake: Math.floor(t2 / 0.025) % 4 === 0 }; step(0.025); t2 += 0.025; if (p.inp) p.inp.shake = false; if (k.state === 'fly') tossed = true; }
    p.bot = {};
    Object.assign(out, { held, saved, free, scratch, held2, tossed, shakeLost: +(hp2 - d.hp).toFixed(3), t2: +t2.toFixed(2) });
    return out;
  }
  if (scen === 'knock') {   // perched; a sheep 7 m out toward the trail, the dog behind it, pounce toward the tree
    k.state = 'away'; GAME.perchGrove(k.grove); const L2 = k.lair, vx = Math.sin(L2.yaw), vz = Math.cos(L2.yaw);
    const s = living().find(o => !o.lamb && !o.ram); s.x = L2.px + vx * 7; s.z = L2.pz + vz * 7; s.vx = s.vz = 0; s.pen = null; s.air = null; s.y = GAME.groundY(s.x, s.z);
    d.x = s.x + vx * 1.5; d.z = s.z + vz * 1.5; d.vx = d.vz = 0; d.pounceCD = 0; d.stunT = 0; d.air = null;
    const b0 = k.bonks || 0, st0 = k.state;
    p.bot = toward(d, s.x, s.z, { pounce: true }); step(0.025); p.bot = {}; if (p.inp) p.inp.pounce = false;
    let t = 0, flew = false, top = 0; while (t < 4 && k.state !== 'retreat') { step(0.025); t += 0.025; if (k.state === 'fly') flew = true; if (s.air) top = Math.max(top, s.air.h - GAME.groundY(s.x, s.z)); }
    Object.assign(out, { st0, flew, landed: k.state, dazed: k.dazeT > 0, bonks: (k.bonks || 0) - b0, sheepTop: +top.toFixed(2), t: +t.toFixed(2) });
    return out;
  }
  if (scen === 'chase') {   // 60 m out, running home; the dog right behind it sprints and pounces whenever it's close
    stalking(); const L2 = k.lair;
    k.x = L2.bx + ux * 60; k.z = L2.bz + uz * 60; k.vx = k.vz = 0; k.state = 'retreat'; k.t = 0; k.bonks = 0; k.dazeT = 0; k.y = GAME.groundY(k.x, k.z); k.h = 0;
    d.x = k.x + ux * 3; d.z = k.z + uz * 3; d.vx = d.vz = 0; d.stamina = 1; d.stunT = 0; d.air = null;
    let t = 0, home = null, flights = 0, last = k.state;
    while (t < 40) {
      const dd = Math.hypot(k.x - d.x, k.z - d.z);
      const behind = (k.lair.bx - k.x) * (k.x - d.x) + (k.lair.bz - k.z) * (k.z - d.z) > 0;   // (its tree's ahead of it: knocked on home, not back out)
      p.bot = k.state === 'retreat' || k.state === 'fly' ? toward(d, k.x, k.z, { sprint: true, pounce: k.state === 'retreat' && behind && dd < 5 && d.pounceCD <= 0 }) : {};
      step(0.025); t += 0.025; if (p.inp) p.inp.pounce = false;   // (a bot's pounce stays pressed otherwise)
      if (k.state === 'fly' && last !== 'fly') flights++; last = k.state;
      if (k.state !== 'retreat' && k.state !== 'fly') { home = k.state; break; }
    }
    Object.assign(out, { bonks: k.bonks, flights, home, t: +t.toFixed(1), fromTree: +Math.hypot(k.x - k.lair.bx, k.z - k.lair.bz).toFixed(1) });
    return out;
  }
  if (scen === 'ko') d.hp = 0.2;
  stalking();
  out.stalk = k.state === 'stalk';
  { const ax = k.x - L.x, az = k.z - L.z, al = Math.hypot(ax, az) || 1; d.x = k.x + ax / al * 10; d.z = k.z + az / al * 10; }   // 10 m off, between it and the flock
  let t = 0, mauled = false, maxT = 0, freeAt = null, ko = false, hp0 = d.hp, minHp = d.hp;
  let d2 = null; if (scen === 'partner') { joinPlayer({ kind: 'bot', index: 1 }); d2 = G.dogs[1]; G.players[1].bot = {}; d2.x = d.x + 12; d2.z = d.z; }
  while (t < 20) {
    if (!mauled) p.bot = toward(d, k.x, k.z);
    else if (scen === 'mash') p.bot = { pounce: Math.floor(t / 0.025) % 2 === 0 };
    else p.bot = {};
    if (d2) { const near = Math.hypot(k.x - d2.x, k.z - d2.z) < 5; G.players[1].bot = mauled ? toward(d2, k.x, k.z, { sprint: true, pounce: near }) : {}; }
    step(0.025); t += 0.025;
    if (d.maul) { if (!mauled) maxT = t; mauled = true; }
    minHp = Math.min(minHp, d.hp); if (d.ko) ko = true;
    if (mauled && !d.maul && freeAt === null) freeAt = t;
    if (freeAt !== null && t - freeAt > 1) break;
  }
  Object.assign(out, { mauled, maulSecs: freeAt !== null ? +(freeAt - maxT).toFixed(2) : null, lost: +(hp0 - minHp).toFixed(3), hp: +d.hp.toFixed(3), ko, cougar: k.state });
  if (scen === 'ko') {
    const r0 = G.stats.rescued || 0; let hd = 99;
    p.bot = {}; let tt = 0; while (tt < 90 && d.ko) { hd = Math.hypot(GAME.HANK.x - d.x, GAME.HANK.z - d.z); step(0.025); tt += 0.025; }
    out.upAfter = +tt.toFixed(1); out.hpUp = +d.hp.toFixed(3); out.byHank = (G.stats.rescued || 0) === r0 + 1; out.hankD = +hd.toFixed(2);
    GAME.resetCougars(); G.clock.hour = 12;   // (no more cats or coyotes: just healing)
    p.bot = { lie: true }; for (let i = 0; i < 1200; i++) step(0.025);
    out.hp30s = +d.hp.toFixed(3);
  }
  return out;
}, scen);
let fail = 0;
for (const sc of ['maul', 'mash', 'ko', 'nip', 'barks', 'bonk', 'chase', 'grab', 'knock', 'partner']) {   // (partner last: its second dog stays)
  const r = await run(sc);
  let ok = true;
  if (sc === 'maul') ok = r.mauled && r.lost > 0.45 && r.lost < 0.55 && !r.ko && r.cougar !== 'maul';
  if (sc === 'mash') ok = r.mauled && r.lost < 0.3 && r.maulSecs < 2.5;
  if (sc === 'partner') ok = r.mauled && r.lost < 0.5 && r.cougar !== 'maul';
  if (sc === 'ko') ok = r.mauled && r.ko && r.upAfter > 3 && r.byHank && r.hankD < 2.5 && r.hpUp >= 0.25 && r.hp30s > r.hpUp + 0.2;
  if (sc === 'nip') ok = r.lost > 0.05 && r.lost < 0.1;
  if (sc === 'bonk') ok = r.bonks === 2 && r.flights.every(f => f.flew && f.top > 1.2 && f.far > 6 && f.way > 0.7 && f.landed === 'retreat' && f.dazed) && r.v1 < r.v0 * 0.85 && r.v1 < r.walk * 0.9;
  if (sc === 'chase') ok = r.bonks >= 3 && r.flights === r.bonks && r.home === 'up';
  if (sc === 'grab') ok = r.held && r.saved === 1 && r.free && r.scratch.let && r.scratch.lost > 0.05 && r.scratch.lost < 0.1 && r.scratch.st === 'retreat' && r.held2 && r.tossed && r.shakeLost === 0;
  if (sc === 'knock') ok = r.st0 === 'perch' && r.flew && r.landed === 'retreat' && r.dazed && r.bonks === 1;
  if (sc === 'barks') ok = r.states.slice(0, -1).every(s => s === 'retreat' || s === 'up') && ['leapDog', 'maul'].includes(r.states.at(-1));
  if (!ok) fail++;
  console.log(ok ? 'ok  ' : 'FAIL', JSON.stringify(r));
}
console.log(fail ? `${fail} failed` : 'all ok', h.errors.slice(0, 5));
await h.close();
process.exit(fail ? 1 : 0);
