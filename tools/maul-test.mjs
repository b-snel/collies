// Headless test: `node tools/maul-test.mjs`. Dog health: cougar maulings, mashing free, coyote nips, barks wearing off.
//   maul     a dog walks up to a stalking cougar: it leaps on it and takes about half its health, then leaves
//   mash     the same, mashing pounce: free fast, little lost
//   partner  a second dog pounces the cougar off
//   ko       a dog on low health is mauled: knocked out, then up again; heals over time
//   nip      a coyote wise to barking nips a dog standing by it
//   bonk     a fleeing cougar gets pounced: bonked, then runs faster (still slower than a sprinting dog)
//   chase    a dog chases a bonked cougar home: bonked again and again till it's up its tree
//   barks    barks spook a cougar T.barkWise times, then it comes for the dog
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
    const sp = () => { k.x = kx; k.z = kz; k.vx = k.vz = 0; k.state = 'retreat'; k.t = 0; k.y = GAME.groundY(k.x, k.z); let m = 0; for (let i = 0; i < 60 && k.state === 'retreat'; i++) { step(0.025); m = Math.max(m, Math.hypot(k.vx, k.vz)); } return m; };
    const v0 = sp(); const b0 = k.bonks || 0;
    for (let n = 0; n < 2; n++) {   // pounce it from behind, twice
      k.x = kx; k.z = kz; k.state = 'retreat'; k.t = 0; step(0.025);
      if (k.state !== 'retreat') { k.state = 'retreat'; k.t = 0; k.y = GAME.groundY(k.x, k.z); }
      d.x = k.x + ux * 1.5; d.z = k.z + uz * 1.5; d.vx = d.vz = 0; d.pounceCD = 0; d.stunT = 0; d.air = null;
      p.bot = toward(d, k.x, k.z, { pounce: true }); step(0.025); p.bot = {};
      for (let i = 0; i < 20; i++) step(0.025);
    }
    Object.assign(out, { bonks: (k.bonks || 0) - b0, v0: +v0.toFixed(2), v1: +sp().toFixed(2), sprint: T.dogSprint });
    return out;
  }
  if (scen === 'chase') {   // 35 m out, running home; the dog right behind it sprints and pounces whenever it's close
    stalking(); const L2 = k.lair;
    k.x = L2.bx + ux * 35; k.z = L2.bz + uz * 35; k.vx = k.vz = 0; k.state = 'retreat'; k.t = 0; k.bonks = 0; k.dazeT = 0; k.y = GAME.groundY(k.x, k.z); k.h = 0;
    d.x = k.x + ux * 3; d.z = k.z + uz * 3; d.vx = d.vz = 0; d.stamina = 1; d.stunT = 0; d.air = null;
    let t = 0, home = null;
    while (t < 20) {
      const dd = Math.hypot(k.x - d.x, k.z - d.z);
      p.bot = k.state === 'retreat' ? toward(d, k.x, k.z, { sprint: true, pounce: dd < 5 && d.pounceCD <= 0 }) : {};
      step(0.025); t += 0.025;
      if (k.state !== 'retreat') { home = k.state; break; }
    }
    Object.assign(out, { bonks: k.bonks, home, t: +t.toFixed(1), fromTree: +Math.hypot(k.x - L2.bx, k.z - L2.bz).toFixed(1) });
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
    p.bot = {}; let tt = 0; while (tt < 10 && d.ko) { step(0.025); tt += 0.025; }
    out.upAfter = +tt.toFixed(1); out.hpUp = +d.hp.toFixed(3);
    GAME.resetCougars(); G.clock.hour = 12;   // (no more cats or coyotes: just healing)
    p.bot = { lie: true }; for (let i = 0; i < 1200; i++) step(0.025);
    out.hp30s = +d.hp.toFixed(3);
  }
  return out;
}, scen);
let fail = 0;
for (const sc of ['maul', 'mash', 'ko', 'nip', 'barks', 'bonk', 'chase', 'partner']) {   // (partner last: its second dog stays)
  const r = await run(sc);
  let ok = true;
  if (sc === 'maul') ok = r.mauled && r.lost > 0.45 && r.lost < 0.55 && !r.ko && r.cougar !== 'maul';
  if (sc === 'mash') ok = r.mauled && r.lost < 0.3 && r.maulSecs < 2.5;
  if (sc === 'partner') ok = r.mauled && r.lost < 0.5 && r.cougar !== 'maul';
  if (sc === 'ko') ok = r.mauled && r.ko && r.upAfter > 3 && r.hpUp >= 0.25 && r.hp30s > r.hpUp + 0.2;
  if (sc === 'nip') ok = r.lost > 0.05 && r.lost < 0.1;
  if (sc === 'bonk') ok = r.bonks === 2 && r.v1 > r.v0 * 1.05 && r.v1 < r.sprint * 0.9;
  if (sc === 'chase') ok = r.bonks >= 3 && r.home === 'up';
  if (sc === 'barks') ok = r.states.slice(0, -1).every(s => s === 'retreat' || s === 'up') && ['leapDog', 'maul'].includes(r.states.at(-1));
  if (!ok) fail++;
  console.log(ok ? 'ok  ' : 'FAIL', JSON.stringify(r));
}
console.log(fail ? `${fail} failed` : 'all ok', h.errors.slice(0, 5));
await h.close();
process.exit(fail ? 1 : 0);
