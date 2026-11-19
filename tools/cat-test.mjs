// Headless checks for MICE & CATS: `node tools/cat-test.mjs [holes|mice|raid|hunt|hunger|adopt|shy|grab|flee|prey|falcon|kittens|range|camps|save|barn|stars|sim]`.
//   holes    mouse holes round every camp's pen and in the grass along the trail: none in the water, a pen, the canyon; every screen the same
//   mice     out by their holes near the flock: many by night, few by day; a dog comes: down their holes; out of range: gone
//   raid     RAID: mice by the flock's pen at night eat its stored food; ours in the pen cuts it hard, a llama doesn't (in sight, and by the hour)
//   hunt     THE HUNT: a cat sees a mouse, stalks (freezes while it's up), wiggles, pounces, pins, bites, eats it (forced odds): the mouse is
//            gone, its hunger down, ECO's mice one fewer; the odds: busy and unaware better, alert or a kitten worse, hungry better
//   hunger   rises by the hour; a fish lowers it; starving: ours gone (a toast, the tally), a stray gone without a word
//   adopt    THE BOWL: a stray waits while a dog's by the bowl, comes when it lies still a way off; fed on 3 days: ours (a name, the tally,
//            ECO: a stray fewer); fed once: it follows the flock to the next camp
//   shy      a stray runs from a dog coming at it; cornered: a hiss, then a swipe; a bark: off, trust down; ours: unafraid
//   grab     ✊ a cat: limp (held); let go: on its feet, a stray off and warier; flung: lands on its feet
//   flee     a coyote near: into a shut pen (safe: the coyote won't take it there); a cougar: up a fence post (safe)
//   prey     a coyote takes a stray (no alert) and ours (a toast, the tally); a cougar takes one up its tree; the falcon takes one by day
//   falcon   DUCKS: the falcon picks a duck on land by day, carries it to its nest, eats it (no alert); a bark under it: dropped, it flaps down
//   kittens  KITTENS: a tom and a queen of ours, well fed, by the pen: she's expecting within a few nights; a litter of 2–4 trailing her
//   range    the hungrier a stray, the further it hunts (and smells the bowl)
//   camps    strays made by a camp the flock comes to (by ECO's count), loafing in a hideout by day; gone when it's far (not a follower)
//   save     a reload (JOURNEY SAVE): ours (breed, coat, sex, name, hunger, her kittens), a follower (fed days), tonight's loss
//   barn     HANK'S BARN: ours in its 🐱 tab (a stray isn't), opened on one asked for; renamed, a collar's colour (the model rebuilt in it),
//            the mice it's caught on its card; kept on a reload
//   stars    CAT_STARS: Gandy (a grey and white Norwegian tom) by the mountains' camp, Linus (an orange tabby tom) by the ocean's, once a journey;
//            adopted: still Gandy / Linus; another of ours in his coat takes the name only while it's free
//   sim      off in ?sim: no holes, mice or cats; with none about, every hook (coyote, bark, grab, falcon, cougar) draws no Math.random
import { open } from './harness.mjs';
const only = process.argv[2];
let h = null, fails = 0;
const errors = [];
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const want = k => !only || only === k;
const show = r => { if (process.env.V) console.log(JSON.stringify(r)); };   // V=1: the numbers
const setup = async (o = {}) => { if (h) { errors.push(...h.errors); await h.close(); } h = await open(); return h.page.evaluate(o => {
  const { G, T, step, startGame, CAM_R, CAM_F, groundY, pathPoint, pens, MC, ECO, resetEco, resetMiceCats, mouseHoles, ecoLeg } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.clock.hour = 10; G.clock.day = 3;
  T.cat.on = true; T.mouse.on = true; T.cat.share = o.share ?? 0; resetMiceCats(); mouseHoles(); MC.seen = true;
  T.eco.on = true; resetEco(5); for (const [i, g] of ECO.legs.entries()) g.mice = T.eco.hab[i].mice;   // (ECO on, the mice at the land's K: ecoD 1)
  const H = window.H = {};
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.d = () => G.dogs[0];
  H.place = (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); };
  H.run = (sec, fn) => { const d = H.d(); for (let t = 0; t < sec - 1e-9; t += 0.025) { if (fn) { const b = fn(t); if (b === true) return t; d.player.bot = b || { mx: 0, my: 0 }; } step(0.025); } d.player.bot = { mx: 0, my: 0 }; return sec; };
  H.P = pathPoint(170, 8); H.P0 = pens[0]; H.li = ecoLeg(H.P.x, H.P.z);
  H.far = (x = H.P.x + 90, z = H.P.z + 90) => { for (const s of G.sheep) { H.place(s, x + (Math.random() - 0.5) * 6, z + (Math.random() - 0.5) * 6); s.pen = null; } H.place(GAME.HANK, H.P.x + 60, H.P.z - 60); };
  H.hole = (x, z) => { const h = { x, z, yaw: 0, camp: -1, live: true }; GAME.MOUSE_HOLES.push(h); return h; };
  H.mouse = (x, z, st = 'nibble') => { const h = H.hole(x + 3, z + 3), m = GAME.mouseMake(h, { x, z, state: st }); m.act = 999; m.y = groundY(x, z); return m; };
  H.r = v => +(+v).toFixed(3);
  H.far(); H.place(H.d(), H.P.x - 40, H.P.z); step(0.025);   // (a step: the shared stores see every pen)
  return true;
}, o); };

if (want('holes')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { MOUSE_HOLES, CAMPS, pens, wetAt, penAt, canyonK, sAt, inSea } = GAME, out = {};
    out.n = MOUSE_HOLES.length;
    out.camps = CAMPS.map((c, i) => c.final ? -1 : MOUSE_HOLES.filter(h => h.camp === i).length);
    out.field = MOUSE_HOLES.filter(h => h.camp < 0).length;
    out.bad = MOUSE_HOLES.filter(h => wetAt(h.x, h.z) || penAt(h.x, h.z) || canyonK(sAt(h.x, h.z)) > 0 || inSea(h.x, h.z)).length;
    out.near = MOUSE_HOLES.filter(h => h.camp >= 0).every(h => { const p = pens[h.camp]; const d = Math.hypot(h.x - p.x, h.z - p.z); return d > p.R && d < p.R + 16; });
    const a = MOUSE_HOLES.map(h => h.x.toFixed(2) + ',' + h.z.toFixed(2)).join(' ');
    MOUSE_HOLES.length = 0; GAME.mouseHoles(); out.same = MOUSE_HOLES.map(h => h.x.toFixed(2) + ',' + h.z.toFixed(2)).join(' ') === a;
    return out;
  });
  show(r);
  ok('holes: round every camp\'s pen (just outside it), more along the trail', r.camps.every(n => n === -1 || n >= 4) && r.field >= 20 && r.near, r);
  ok('holes: none in the water, a pen, the canyon, at sea', r.bad === 0, r);
  ok('holes: own rng: the same every time (every screen)', r.same, r);
}

if (want('mice')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, MICE, MC, T } = GAME, d = H.d(), out = {};
    const at = (hour, sec) => { let n = 0, k = 0; H.run(sec, () => { G.clock.hour = hour; if ((k++ % 40) === 0) n = Math.max(n, MICE.filter(m => m.state !== 'hide').length); }); return n; };
    H.place(d, H.P0.x + 30, H.P0.z + 30); for (const s of G.sheep) { H.place(s, H.P0.x + 20 + Math.random() * 4, H.P0.z + 20); }
    out.night = at(22, 30); out.want = MC.want;
    out.day = (() => { G.clock.hour = 12; H.run(20, () => { G.clock.hour = 12; }); return MICE.filter(m => m.state !== 'hide').length; })();
    // a dog right on them: down their holes
    G.clock.hour = 22; H.run(20, () => { G.clock.hour = 22; });
    const m = MICE.find(m => m.state !== 'hide' && !m.run); out.had = !!m;
    if (m) { const h0 = m.hole; H.place(d, m.x + 1.5, m.z); H.run(4, () => { G.clock.hour = 22; }); out.fled = m.state === 'hide' || !!m.run || m.gone || Math.hypot(m.x - h0.x, m.z - h0.z) < 0.3; }
    // the flock and the dogs far off: gone
    H.place(d, H.P.x + 400, H.P.z); H.far(H.P.x + 400, H.P.z); H.run(8, () => { G.clock.hour = 22; });
    out.away = MICE.filter(m => Math.hypot(m.x - H.P0.x, m.z - H.P0.z) < 60).length;
    return out;
  });
  show(r);
  ok('mice: many out by night near the flock, few by day', r.night >= 5 && r.day <= 3 && r.night > r.day, r);
  ok('mice: a dog right on one: off down its hole', r.had && r.fled, r);
  ok('mice: the flock and dogs gone far: none left there', r.away === 0, r);
}

if (want('raid')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, MC, MICE, CATS, catMake, fillTroughs, troughFood, raidStep, raidGuard, mcLook, setGate, makeLlama, LLAMAS, llamaRemove, resetMiceCats, mouseHoles } = GAME, d = H.d(), P = H.P0, out = {};
    // in sight: the flock by the pen (not in it), the troughs full, a night of it
    const night = (setupFn, hours = 4) => {
      for (const c of [...CATS]) GAME.catRemove(c); for (const m of [...MICE]) GAME.mouseRemove(m); for (const L of [...LLAMAS]) llamaRemove(L);
      setGate(P, false); for (const s of G.sheep) { H.place(s, P.x + 26 + Math.random() * 4, P.z + 26 + Math.random() * 4); s.pen = null; s.hunger = 0; }
      H.place(d, P.x + 22, P.z + 12); fillTroughs(P, 18); setupFn();   // (a dog lying by: the mice round the pen stay out)
      G.clock.hour = 21; H.run(3, () => { G.clock.hour = 21; return { lie: true }; }); const f0 = troughFood(P), n0 = MC.night;
      let k = 0; H.run(hours * T.hourSec, () => { G.clock.hour = 21 + (k++) * 0.025 / T.hourSec; if (G.clock.hour > 4.5 && G.clock.hour < 20) G.clock.hour = 4.5; return { lie: true }; });
      return { lost: H.r(f0 - troughFood(P)), tally: H.r(MC.night - n0), ff: G.ff };
    };
    const two = f => { const a = night(f), b = night(f); return { lost: H.r(a.lost + b.lost), tally: H.r(a.tally + b.tally), ff: a.ff || b.ff }; };   // (two nights each: less luck in it)
    out.none = two(() => {});
    out.cat = two(() => { const c = catMake({ x: P.x, z: P.z, owned: true, name: 'Tam', hunger: 0.25, age: 30 }); c.trust = 1; });
    out.llama = two(() => { makeLlama({ x: P.x + 2, z: P.z, sex: 'f', age: 5, tame: 2 }); });
    // out of sight / fast-forwarding: by the hour, × (1 − guard)
    for (const c of [...CATS]) GAME.catRemove(c); for (const L of [...LLAMAS]) llamaRemove(L); for (const m of [...MICE]) GAME.mouseRemove(m);
    for (const s of G.sheep) { H.place(s, P.x + (Math.random() - 0.5) * 6, P.z + (Math.random() - 0.5) * 6); s.pen = P; } mcLook(); G.clock.hour = 23; G.ff = true; MC.live = [];
    const hours = (n) => { fillTroughs(P, 18); const f0 = troughFood(P); for (let i = 0; i < n * 10; i++) { G.ff = true; raidStep(0.1); } return H.r(f0 - troughFood(P)); };
    out.ff = { raid: MC.raid === P, none: hours(6) };
    const c = catMake({ x: P.x, z: P.z, owned: true, name: 'Tam', hunger: 0.25, age: 30 }); c.state = 'loaf'; out.ff.guard = H.r(raidGuard(P)); out.ff.cat = hours(6); GAME.catRemove(c);
    makeLlama({ x: P.x + 1, z: P.z, sex: 'f', age: 5, tame: 2 }); out.ff.llama = hours(6);
    out.ff.want = H.r(T.mouse.raid * GAME.ecoD('mice', GAME.ecoLeg(P.x, P.z)) * 6);
    G.ff = false;
    return out;
  });
  show(r);
  ok('raid: mice at the flock\'s pen by night eat its stored food (counted)', r.none.lost > 0.6 && Math.abs(r.none.lost - r.none.tally) < 0.05, r);
  ok('raid: ours in the pen cuts it hard', r.cat.lost < r.none.lost * 0.5, r);
  ok('raid: a llama doesn\'t', r.llama.lost > r.none.lost * 0.6, r);
  ok('raid: out of sight, by the hour: as the leg has (ecoD), a cat ×(1 − guard), a llama nothing', r.ff.raid && Math.abs(r.ff.none - r.ff.want) < 0.05 && r.ff.cat < r.ff.none * 0.25 && Math.abs(r.ff.llama - r.ff.none) < 0.01, r);
}

if (want('hunt')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, MC, MICE, CATS, ECO, catMake, catOdds, ecoLeg } = GAME, d = H.d(), out = {};
    T.mouse.n = [1, 1, 1]; T.mouse.max = 1; const ears = T.mouse.ears; T.mouse.ears = 0;   // (just the one out; deaf: the whole hunt, whatever the dice)
    G.clock.hour = 21.5; H.place(d, H.P.x - 30, H.P.z);
    for (const o of [...MICE]) GAME.mouseRemove(o);   // (else one over the cap: it, or ours, sent home at random)
    const m = H.mouse(H.P.x + 5, H.P.z);
    const c = catMake({ x: H.P.x - 3, z: H.P.z, hunger: 0.5, age: 30, camp: -1 }); c.huntCd = 0; c.yaw = Math.PI / 2;
    MC.force = 1; const k0 = ECO.kills['cats>mouse'] || 0, kills0 = MC.kills, h0 = c.hunger, seen = [];
    let froze = false;
    H.run(60, () => { G.clock.hour = 21.5; if (seen.at(-1) !== c.state) seen.push(c.state); if (c.state === 'freeze' && m.state === 'sit') froze = true; return !MICE.includes(m) && c.state !== 'eat' ? true : null; });
    out.states = seen.join(' '); out.gone = !MICE.includes(m); out.hunger = [H.r(h0), H.r(c.hunger)]; out.eco = (ECO.kills['cats>mouse'] || 0) - k0; out.kills = MC.kills - kills0; out.froze = froze;
    MC.force = null; T.mouse.ears = ears;
    const O = (st, alert = 0, kit = false, hunger = 0) => { const cc = { kit, hunger }, mm = { state: st, alert, run: null }; return catOdds(cc, mm); };
    out.odds = { busy: H.r(O('nibble')), alert: H.r(O('sit', 1)), kit: H.r(O('nibble', 0, true)), hungry: H.r(O('nibble', 0, false, 1)), base: H.r(O('walk')) };
    return out;
  });
  show(r); const has = s => r.states.split(' ').includes(s);
  ok('hunt: it stalks, wiggles, pounces, pins, bites and eats', ['stalk', 'wiggle', 'pounce', 'pin', 'bite', 'eat'].every(has), r);
  ok('hunt: the mouse is gone, the cat\'s hunger down a mouse\'s worth', r.gone && r.hunger[0] - r.hunger[1] > 0.15, r);
  ok('hunt: ECO: the leg\'s mice one fewer (ecoEat)', r.kills === 1 && r.eco === 1, r);
  ok('hunt: the odds: nibbling and unaware best, up and looking worse, a kitten worse, hungry tries harder', r.odds.busy > r.odds.base && r.odds.alert < r.odds.base && r.odds.kit < r.odds.busy && r.odds.hungry > r.odds.busy && r.odds.base > 0.25 && r.odds.base < 0.45, r);
}

if (want('hunger')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, CATS, BOWL, catMake, catHunger, catKilled } = GAME, d = H.d(), out = {}, box = document.getElementById('toasts');
    const c = catMake({ x: H.P.x, z: H.P.z, owned: true, name: 'Tam', hunger: 0.2, age: 30 }); c.trust = 1;
    catHunger(c, 10); out.rise = H.r(c.hunger - 0.2);
    // a fish in the bowl: to it, eaten
    c.hunger = 0.7; Object.assign(BOWL, { on: true, x: H.P.x + 6, z: H.P.z + 2, fish: 2 }); G.clock.hour = 12;
    const f0 = BOWL.fish; let ate = false; H.run(30, () => { G.clock.hour = 12; ate = ate || c.state === 'eat'; return BOWL.fish < f0 ? true : null; });
    out.fish = { ate, took: f0 - BOWL.fish, hunger: H.r(c.hunger) };
    BOWL.on = false;
    // starving: ours gone (a toast, the tally); a stray: not a word
    for (const el of [...box.children]) el.remove();
    c.hunger = 1; c.starve = 0; catHunger(c, T.cat.starveH + 1); out.ours = { gone: !CATS.includes(c), lost: G.stats.catsLost, toasts: box.children.length };
    const s = catMake({ x: H.P.x, z: H.P.z, hunger: 1, age: 30 }); for (const el of [...box.children]) el.remove(); catHunger(s, T.cat.starveH + 1);
    out.stray = { gone: !CATS.includes(s), lost: G.stats.catsLost, toasts: box.children.length };
    return out;
  });
  show(r);
  ok('hunger: rises by the hour', Math.abs(r.rise - 0.3) < 0.02, r);
  ok('hunger: a fish from the bowl lowers it', r.fish.ate && r.fish.took === 1 && r.fish.hunger < 0.35, r);
  ok('hunger: starving, ours is gone (a toast, the tally); a stray without a word', r.ours.gone && r.ours.lost === 1 && r.ours.toasts > 0 && r.stray.gone && r.stray.lost === 1 && r.stray.toasts === 0, r);
}

if (want('adopt')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, CATS, BOWL, ECO, catMake, ecoLeg, CAMPS, pens } = GAME, d = H.d(), out = {};
    const P = pens[0], bx = P.exitX + 3, bz = P.exitZ + 3, li = ecoLeg(bx, bz);
    Object.assign(BOWL, { on: true, x: bx, z: bz, fish: 6, pen: P });
    const c = catMake({ x: bx + 14, z: bz + 6, hunger: 0.6, age: 30, camp: 0, hx: bx + 16, hz: bz + 8 });
    G.clock.hour = 18.6;
    // a dog standing by the bowl: it waits, out of reach
    H.place(d, bx + 2, bz); H.run(12, () => { G.clock.hour = 18.6; return { mx: 0, my: 0 }; });
    out.waited = { fish: BOWL.fish, d: H.r(Math.hypot(c.x - bx, c.z - bz)) };
    // lying still a way off: it comes
    H.place(d, bx - 6, bz); let came = false; H.run(25, () => { G.clock.hour = 18.6; came = came || (c.state === 'eat' && Math.hypot(c.x - bx, c.z - bz) < 0.8); return BOWL.fish < 6 ? true : { mx: 0, my: 0, lie: true }; });
    out.day1 = { came, fish: BOWL.fish, fed: c.fed, trust: H.r(c.trust) };
    const cats0 = ECO.legs[li].cats;
    for (const day of [4, 5]) {
      G.clock.day = day; c.hunger = 0.6; const f = BOWL.fish;
      H.run(30, () => { G.clock.hour = 18.6; return BOWL.fish < f ? true : { mx: 0, my: 0, lie: true }; });
    }
    out.ours = { owned: c.owned, name: c.name, fed: c.fed, stat: G.stats.cats, eco: H.r(cats0 - ECO.legs[li].cats) };
    return out;
  });
  show(r);
  ok('adopt: a dog by the bowl: the stray waits, out of reach', r.waited.fish === 6 && r.waited.d > 5, r);
  ok('adopt: the dog lying still a way off: it comes and eats (a day fed)', r.day1.came && r.day1.fish === 5 && r.day1.fed === 1, r);
  ok('adopt: fed on 3 days: ours (a name, the tally; ECO: a stray fewer)', r.ours.owned && !!r.ours.name && r.ours.stat === 1 && r.ours.eco > 0.9, r);
}

if (want('shy')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, catMake } = GAME, d = H.d(), out = {};
    G.clock.hour = 12;
    const c = catMake({ x: H.P.x, z: H.P.z, hunger: 0.2, age: 30, camp: -1 }); H.run(1, () => { G.clock.hour = 12; });
    // a dog walking at it: off it runs
    H.place(d, H.P.x - 14, H.P.z); let ran = 0; const x0 = c.x;
    H.run(3, () => { G.clock.hour = 12; if (c.state === 'flee') ran++; return H.inp(c.x - d.x, c.z - d.z); });
    out.run = { ran, moved: H.r(Math.hypot(c.x - x0, c.z - H.P.z)) };
    // cornered (right on it): a hiss, then a swipe
    H.run(2, () => { G.clock.hour = 12; return { mx: 0, my: 0 }; });
    H.place(c, H.P.x, H.P.z); c.fleeT = 0; c.run = null; c.state = 'sit'; H.place(d, H.P.x - 1.3, H.P.z); d.vx = 6;
    let hiss = false, swipe = false; H.run(2, () => { G.clock.hour = 12; hiss = hiss || c.state === 'hiss'; swipe = swipe || c.state === 'swipe'; return swipe ? true : H.inp(c.x - d.x, c.z - d.z, { creep: true }); });
    out.corner = { hiss, swipe, stun: d.stunT > 0 || swipe };
    // a bark: off, trust down
    H.run(4, () => { G.clock.hour = 12; return { mx: 0, my: 0 }; });
    c.trust = 0.5; H.place(c, H.P.x, H.P.z); c.fleeT = 0; c.run = null; c.state = 'sit'; H.place(d, H.P.x - 7, H.P.z);
    H.run(0.1, () => ({ mx: 0, my: 0, lie: true })); let fled = false; H.run(1, (t) => { G.clock.hour = 12; fled = fled || c.state === 'flee'; return t < 0.05 ? { bark: true, lie: true } : { mx: 0, my: 0, lie: true }; });
    out.bark = { fled, trust: H.r(c.trust) };
    // ours: a dog walking up: it stays
    const o = catMake({ x: H.P.x + 30, z: H.P.z, hunger: 0.1, age: 30, owned: true, name: 'Tam' }); o.trust = 1; H.place(d, o.x - 10, o.z); let oursRan = 0;
    H.run(1.5, () => { G.clock.hour = 12; if (o.state === 'flee') oursRan++; return H.inp(o.x - d.x, o.z - d.z, { creep: true }); });
    out.ours = oursRan;
    return out;
  });
  show(r);
  ok('shy: a dog walking at a stray: off it runs', r.run.ran > 10 && r.run.moved > 4, r);
  ok('shy: cornered: a hiss, then a swipe', r.corner.hiss && r.corner.swipe, r);
  ok('shy: a bark: off, trust down', r.bark.fled && r.bark.trust < 0.5, r);
  ok('shy: ours: unafraid', r.ours === 0, r);
}

if (want('grab')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, catMake, tryGrab, releaseHold } = GAME, d = H.d(), out = {};
    G.clock.hour = 12;
    const c = catMake({ x: H.P.x, z: H.P.z, hunger: 0.2, age: 30, camp: -1 }); c.trust = 0.5;
    H.place(d, c.x - 1.1, c.z); d.yaw = Math.PI / 2; const got = tryGrab(d);
    H.run(1, () => { G.clock.hour = 12; return { grab: true }; });
    out.held = { got, by: c.heldBy === d, st: c.state, kind: d.holdKind };
    releaseHold(d, false); H.run(0.5, () => { G.clock.hour = 12; });
    out.drop = { st: c.state, h: H.r(c.h), trust: H.r(c.trust), off: c.fleeT > 0 || c.state === 'flee' };
    // flung: lands on its feet
    H.run(3, () => { G.clock.hour = 12; }); c.fleeT = 0; H.place(d, c.x - 1.1, c.z); d.yaw = Math.PI / 2; tryGrab(d);
    d.vx = 9; let air = false; releaseHold(d, true); H.run(3, () => { G.clock.hour = 12; air = air || !!c.air; return c.air ? null : (air ? true : null); });
    out.fling = { air, landed: !c.air && c.h < 0.05, st: c.state };
    return out;
  });
  show(r);
  ok('grab: ✊ by the scruff: held, limp', r.held.got && r.held.by && r.held.st === 'held' && r.held.kind === 'cat', r);
  ok('grab: let go: on its feet; a stray off and warier', r.drop.h < 0.05 && r.drop.off && r.drop.trust < 0.5, r);
  ok('grab: flung: it flies and lands on its feet', r.fling.air && r.fling.landed, r);
}

if (want('flee')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, CATS, catMake, catPrey, spawnPack, setGate, pens, COUGARS } = GAME, d = H.d(), out = {};
    const P = pens[0]; setGate(P, false); H.far(); H.place(d, P.x + 70, P.z + 70);
    G.clock.hour = 22; const c = catMake({ x: P.x + P.R + 6, z: P.z, hunger: 0.2, age: 30, camp: -1, owned: true, name: 'Tam' });
    const p = spawnPack(1, { howl: false }), k = p.members[0]; H.place(k, P.x + P.R + 18, P.z);
    let inPen = false, safe = false; H.run(15, () => { G.clock.hour = 22; inPen = inPen || (GAME.penAt(c.x, c.z) === P); safe = safe || (GAME.penAt(c.x, c.z) === P && !catPrey(c, 'coy') && !!c.ref && c.ref.kind === 'safe'); });
    out.coyote = { inPen, safe, alive: CATS.includes(c) && !c.grabbed };
    for (const o of G.coyotes) { o.gone = true; o.state = 'leave'; } H.run(0.2);
    // a cougar: up a post
    GAME.catRemove(c); const c2 = catMake({ x: P.x + P.R + 4, z: P.z + 3, hunger: 0.2, age: 30, camp: -1 });
    const K = COUGARS[0]; K.state = 'stalk'; K.target = c2; K.huntT = 0; K.t = 0; H.place(K, c2.x + 12, c2.z); K.h = 0;
    let perch = false; H.run(10, () => { G.clock.hour = 22; perch = perch || c2.state === 'perch'; if (K.state === 'stalk') K.target = c2; });
    out.cougar = { perch, safe: !catPrey(c2, 'cougar') || !CATS.includes(c2), y: H.r(c2.h), alive: CATS.includes(c2) && !c2.grabbed };
    K.state = 'away'; K.target = null;
    return out;
  });
  show(r);
  ok('flee: a coyote: into a shut pen; safe there', r.coyote.inPen && r.coyote.safe && r.coyote.alive, r);
  ok('flee: a cougar: up a fence post; safe there', r.cougar.perch && r.cougar.alive && r.cougar.y > 1, r);
}

if (want('prey')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, CATS, catMake, spawnPack, COUGARS, FALCON, falconCome, cougarHunt } = GAME, d = H.d(), out = {}, box = document.getElementById('toasts');
    const clear = () => { for (const el of [...box.children]) el.remove(); };
    const coy = (owned) => {
      for (const o of G.coyotes) { o.gone = true; o.state = 'leave'; } H.run(0.2, () => { G.clock.hour = 22; }); clear();
      const c = catMake({ x: H.P.x, z: H.P.z, hunger: 0.2, age: 30, camp: -1, owned, name: owned ? 'Tam' : '' }); if (owned) c.trust = 1;
      const p = spawnPack(1, { howl: false }), k = p.members[0]; H.place(k, c.x + 2.5, c.z); T.cat.prey.cd = 0;
      let took = false, toasts = 0; H.run(25, () => { G.clock.hour = 22; took = took || c.grabbed === k; toasts = Math.max(toasts, box.children.length); return !CATS.includes(c) ? true : null; });
      return { took, gone: !CATS.includes(c), toasts };
    };
    G.clock.hour = 22; H.place(d, H.P.x - 70, H.P.z);
    out.stray = coy(false); out.stray.lost = G.stats.catsLost;
    out.ours = coy(true); out.ours.lost = G.stats.catsLost;
    for (const o of G.coyotes) { o.gone = true; o.state = 'leave'; } H.run(0.2, () => { G.clock.hour = 22; }); clear();
    // a cougar: up its tree with it
    const K = COUGARS[0], L = K.lair, ux = Math.sin(L.yaw), uz = Math.cos(L.yaw);
    H.place(d, L.x - ux * 70, L.z - uz * 70); H.far(L.x + ux * 160, L.z + uz * 160);
    const c = catMake({ x: L.x + ux * 14, z: L.z + uz * 14, hunger: 0.2, age: 30, camp: -1 }); c.state = 'sleep'; c.poseT = 999;
    K.state = 'stalk'; K.target = c; K.hunts = true; K.huntT = 0; K.t = 0; H.place(K, c.x + 5, c.z); K.h = 0;
    let up = false; H.run(60, () => { G.clock.hour = 22; up = up || (K.prey === c && K.state === 'climb'); return !CATS.includes(c) ? true : null; });
    out.cougar = { up, gone: !CATS.includes(c), st: K.state };
    // the falcon by day: a cat in the open
    K.state = 'away'; K.prey = K.target = null; T.falcon.on = true; G.clock.hour = 12; G.clock.day = 3;
    const f = catMake({ x: H.P.x, z: H.P.z, hunger: 0.2, age: 2, camp: -1 }); H.place(d, H.P.x - 40, H.P.z); H.far();
    falconCome(f); let carried = false; H.run(90, () => { G.clock.hour = 12; carried = carried || FALCON.prey === f; return !CATS.includes(f) ? true : null; });
    out.falcon = { carried, gone: !CATS.includes(f), st: FALCON.state };
    T.falcon.on = false;
    return out;
  });
  show(r);
  ok('prey: a coyote takes a stray: no alert', r.stray.took && r.stray.gone && r.stray.toasts === 0 && r.stray.lost === 0, r);
  ok('prey: a coyote takes ours: a toast, the tally', r.ours.took && r.ours.gone && r.ours.toasts > 0 && r.ours.lost === 1, r);
  ok('prey: a cougar takes one up its tree', r.cougar.up && r.cougar.gone, r);
  ok('prey: the falcon takes a kitten in the open by day', r.falcon.carried && r.falcon.gone, r);
}

if (want('falcon')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, HERD, HERDS, FALCON, falconCome, falconPick, herdGroup, herdMake, herdDropGroup } = GAME, d = H.d(), out = {}, box = document.getElementById('toasts');
    for (const g of [...HERD.groups]) herdDropGroup(g);
    T.duck.on = true; T.falcon.on = true; G.clock.hour = 12; G.clock.day = 3;
    const bunch = () => { const g = herdGroup('duck', H.P.x, H.P.z, { found: true }); for (let i = 0; i < 4; i++) herdMake('duck', H.P.x + (i % 2) * 0.6, H.P.z + Math.floor(i / 2) * 0.6, { grp: g, age: 5 }); GAME.updateHerds(0, 0); return g; };
    const g = bunch(); H.place(d, H.P.x - 40, H.P.z); H.far(H.P.x + 300, H.P.z + 300);
    let picks = 0; for (let i = 0; i < 40; i++) { const t = falconPick(); if (t && t.isHerd) picks++; } out.picks = picks;
    const e = g.list[0], died = HERD.died.prey; falconCome(e); for (const el of [...box.children]) el.remove();
    let carried = false, toasts = 0; H.run(90, () => { G.clock.hour = 12; carried = carried || FALCON.prey === e; toasts = Math.max(toasts, box.children.length); return HERD.died.prey > died ? true : null; });
    out.eat = { carried, eaten: HERD.died.prey - died, gone: !HERDS.includes(e), toasts };
    // a bark under it: dropped, it flaps down, alive
    H.run(1, () => { G.clock.hour = 12; });
    const e2 = g.list.find(o => !o.gone && !o.fly && !o.air) || bunch().list[0]; falconCome(e2);
    let held = false; H.run(40, () => { G.clock.hour = 12; if (FALCON.prey === e2 && FALCON.state === 'carry') { held = true; return true; } });
    let dropped = false; if (held) { H.place(d, FALCON.x, FALCON.z); H.run(4, (t) => { G.clock.hour = 12; dropped = dropped || (FALCON.prey !== e2 && HERDS.includes(e2)); return t < 0.05 ? { bark: true } : null; }); }
    out.bark = { held, dropped, alive: HERDS.includes(e2), saved: G.stats.saved };
    T.falcon.on = false;
    return out;
  });
  show(r);
  ok('falcon: picks a duck on land by day (ahead of a sheep: a fair share)', r.picks >= 10, r);
  ok('falcon: takes it to its nest and eats it; no alert', r.eat.carried && r.eat.eaten === 1 && r.eat.gone && r.eat.toasts === 0, r);
  ok('falcon: a bark under it: dropped, alive (no "saved")', r.bark.held && r.bark.dropped && r.bark.alive && r.bark.saved === 0, r);
}

if (want('kittens')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, CATS, catMake, catNightfall, mcLook, setGate, pens } = GAME, d = H.d(), out = {};
    const P = pens[0]; setGate(P, false); for (const s of G.sheep) { H.place(s, P.x + (Math.random() - 0.5) * 6, P.z + (Math.random() - 0.5) * 6); s.pen = P; }
    H.place(d, P.x + 20, P.z + 20); mcLook();
    const tom = catMake({ x: P.x + 1, z: P.z, male: true, owned: true, name: 'Tam', hunger: 0.1, age: 30, breed: 'moggy' });
    const q = catMake({ x: P.x - 1, z: P.z, male: false, owned: true, name: 'Bonnie', hunger: 0.1, age: 30, breed: 'siamese' }); tom.trust = q.trust = 1;
    let nights = 0; while (!q.preg && nights < 8) { nights++; catNightfall(); }
    out.preg = { nights, preg: H.r(q.preg), sire: q.sire && q.sire.breed };
    // a few days on: her litter
    G.clock.hour = 10; q.preg = 1e-7; H.run(0.2, () => { G.clock.hour = 10; });
    const kits = CATS.filter(c => c.mum === q);
    out.litter = { n: kits.length, owned: kits.every(c => c.owned && c.name), small: kits.every(c => c.kit && c.scale < 0.7), breeds: [...new Set(kits.map(c => c.breed))].join() };
    // she walks off: they trail her in a line
    q.hunger = tom.hunger = 0.1; for (const c of kits) c.hunger = 0.1;
    for (const s of G.sheep) { H.place(s, P.x + 40 + (Math.random() - 0.5) * 6, P.z + 30 + (Math.random() - 0.5) * 6); s.pen = null; } H.place(d, P.x + 45, P.z + 40); mcLook();
    let maxD = 0, moved = 0; const q0 = { x: q.x, z: q.z };
    H.run(20, (t) => { G.clock.hour = 10; if (t > 8) for (const c of kits) maxD = Math.max(maxD, Math.hypot(c.x - q.x, c.z - q.z)); });
    moved = Math.hypot(q.x - q0.x, q.z - q0.z);
    out.trail = { moved: H.r(moved), maxD: H.r(maxD), stats: G.stats.cats };
    // grown: on their own, still ours
    for (const c of kits) c.age = T.cat.grow + 0.01; H.run(0.5, () => { G.clock.hour = 10; });
    out.grown = kits.every(c => !c.kit && !c.mum && c.owned);
    return out;
  });
  show(r);
  ok('kittens: a well-fed pair of ours by the pen: she\'s expecting within a few nights', r.preg.nights <= 6 && r.preg.preg >= 2 && r.preg.sire === 'moggy', r);
  ok('kittens: a litter of 2–4 by her: ours, named, small', r.litter.n >= 2 && r.litter.n <= 4 && r.litter.owned && r.litter.small, r);
  ok('kittens: they trail her as she goes', r.trail.moved > 15 && r.trail.maxD < 4, r);
  ok('kittens: grown: on their own, still ours', r.grown, r);
}

if (want('range')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, catMake, catArea, catBowlR } = GAME, out = {};
    const c = catMake({ x: H.P0.x + 14, z: H.P0.z, camp: 0, hunger: 0.1, age: 30 });
    out.fed = { r: H.r(catArea(c).r), smell: H.r(catBowlR(c)) };
    c.hunger = 0.9; out.hungry = { r: H.r(catArea(c).r), smell: H.r(catBowlR(c)) };
    // night: how far from its camp it goes hunting, fed vs hungry
    const far = (hunger) => { G.clock.hour = 22; c.hunger = hunger; H.place(c, H.P0.x + 14, H.P0.z); c.goal = null; c.hunt = null; let m = 0; H.run(120, () => { G.clock.hour = 22; c.hunger = hunger; if (c.goal) m = Math.max(m, Math.hypot(c.goal.x - H.P0.x, c.goal.z - H.P0.z)); return { mx: 0, my: 0, lie: true }; }); return H.r(m); };
    H.place(H.d(), H.P0.x - H.P0.R - 6, H.P0.z); out.went = { fed: far(0.1), hungry: far(0.95) };
    return out;
  });
  show(r);
  ok('range: a hungry stray hunts further and smells the bowl from further', r.hungry.r > r.fed.r * 1.5 && r.hungry.smell > r.fed.smell, r);
  ok('range: and goes further from its camp', r.went.hungry > r.went.fed, r);
}

if (want('camps')) {
  await setup({ share: 0.6 });
  const r = await h.page.evaluate(() => {
    const { G, T, CATS, CAMPS, pens, ecoN, ecoLeg } = GAME, d = H.d(), out = {};
    const P = pens[1], cp = CAMPS[1];
    for (const s of G.sheep) H.place(s, P.x + 30, P.z + 10); H.place(d, P.x + 35, P.z + 10); G.clock.hour = 12;
    H.run(30, () => { G.clock.hour = 12; });
    const L = CATS.filter(c => c.camp === 1 && !GAME.CAT_STARS.some(S => S.name === c.name));   // (CAT_STARS: Gandy's by this camp too: his own test)
    out.n = L.length; out.want = Math.min(T.cat.max, Math.round(ecoN('cats', ecoLeg(cp.x, cp.z)) * T.cat.share));
    out.hide = L.every(c => Math.hypot(c.x - c.hx, c.z - c.hz) < 3.5 && !GAME.penAt(c.x, c.z));
    out.rest = L.filter(c => ['sleep', 'loaf', 'groom', 'sit', 'stretch'].includes(c.state) || (c.kit && c.mum) || !!c.hunt).length; out.kits = L.filter(c => c.kit).length; out.st = L.map(c => c.state + (c.hunt ? ":h" : "") + ":" + c.hunger.toFixed(2)).join();   // (a kitten: by its mum)
    out.moggy = L.filter(c => c.breed === 'moggy').length;
    L[0] && (L[0].fed = 1);   // a follower stays
    for (const s of G.sheep) H.place(s, P.x + 400, P.z); H.place(d, P.x + 400, P.z + 5); H.run(2, () => { G.clock.hour = 12; });
    out.left = CATS.filter(c => c.camp === 1 && !(c.fed >= 1)).length; out.follower = CATS.filter(c => c.fed >= 1).length;
    return out;
  });
  show(r);
  ok('camps: strays by a camp the flock comes to, as many as ECO says (≤ max)', r.n === r.want && r.n >= 1, r);
  ok('camps: by day in their hideouts (not a pen), resting (or after a mouse right by it)', r.hide && r.rest === r.n, r);
  ok('camps: the flock gone far: gone (a follower stays)', r.left === 0 && r.follower === (r.n ? 1 : 0), r);
}

if (want('barn')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, CATS, catMake, openBarn, closeBarn, BARN, barnCats, catEdit, JOURNEY, journeySave, journeyRead, journeyResume, resetMiceCats } = GAME, out = {};
    const a = catMake({ x: H.P.x, z: H.P.z, owned: true, name: 'Tam', breed: 'norwegian', coat: 0, male: false, age: 20 }), b = catMake({ x: H.P.x + 2, z: H.P.z, owned: true, name: 'Kip', breed: 'siamese', coat: 1, male: true, age: 9 });
    const st = catMake({ x: H.P.x + 6, z: H.P.z, camp: 0 }); a.caught = 4;
    out.listed = barnCats().map(c => c.name).sort().join(',');
    out.open = openBarn(b) !== false; out.tab = BARN.tab; out.sel = BARN.ct && BARN.ct.name;
    const rows = [...document.querySelectorAll('#barnList [data-cat]')].map(e => e.textContent); out.rows = rows.length; out.stray = rows.some(t => t.includes(st.name || '¤'));
    catEdit(a, { name: 'Mittens' }); catEdit(a, { collar: '#3fbf5a' }); catEdit(a, { collar: '#123456' });   // (not one of the collars: ignored)
    out.name = a.name; out.collar = a.collar; GAME.barnPickCat(a);
    out.info = document.getElementById('barnInfo').textContent; out.model = !!(BARN.catM && BARN.model);
    catEdit(st, { name: 'Nope' }); out.strayName = st.name !== 'Nope';
    closeBarn();
    JOURNEY.off = false; journeySave(); resetMiceCats(); JOURNEY.saved = journeyRead(); journeyResume();
    const a2 = CATS.find(c => c.name === 'Mittens'); out.kept = !!a2 && a2.collar === '#3fbf5a' && a2.caught === 4;
    return out;
  });
  show(r);
  ok('barn: ours in the 🐱 tab (not a stray), opened on the one asked for', r.listed === 'Kip,Tam' && r.open && r.tab === 'cats' && r.sel === 'Kip' && r.rows === 2 && !r.stray, r);
  ok('barn: renamed, a collar (only the collars), on the turntable; its card (breed, mice caught)', r.name === 'Mittens' && r.collar === '#3fbf5a' && r.model && /Norwegian Forest Cat/.test(r.info) && /🐭 4/.test(r.info) && r.strayName, r);
  ok('barn: kept on a reload (name, collar, mice caught)', r.kept, r);
}

if (want('stars')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { CATS, CAMPS, MC, catStrays, catAdopt, catMake, catNameNew } = GAME, out = {};
    catStrays(1); catStrays(2); catStrays(1);   // (twice: only once a journey)
    const g = CATS.filter(c => c.name === 'Gandy'), l = CATS.filter(c => c.name === 'Linus');
    out.gandy = g.map(c => [c.breed, c.coat, c.male, c.camp]); out.linus = l.map(c => [c.breed, c.coat, c.male, c.camp]);
    if (g[0]) { catAdopt(g[0]); out.gName = g[0].name; out.gOurs = g[0].owned; }
    const o = catMake({ x: H.P.x, z: H.P.z, breed: 'moggy', coat: 1 }); out.free = catNameNew(o);   // (Linus still a stray: not free)
    if (l[0]) GAME.catRemove(l[0]); out.freed = catNameNew(o);
    return out;
  });
  show(r);
  ok('stars: Gandy (a Norwegian tom, grey and white) by the mountains\' camp, Linus (an orange tabby tom) by the ocean\'s, once each', JSON.stringify(r.gandy) === '[["norwegian",0,true,1]]' && JSON.stringify(r.linus) === '[["moggy",1,true,2]]', r);
  ok('stars: adopted, still Gandy; another orange tabby takes Linus only when it\'s free', r.gName === 'Gandy' && r.gOurs && r.free !== 'Linus' && r.freed === 'Linus', r);
}

if (want('save')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, CATS, MC, JOURNEY, journeySave, journeyRead, journeyResume, catMake, resetMiceCats } = GAME, out = {};
    const a = catMake({ x: H.P.x, z: H.P.z, owned: true, name: 'Tam', breed: 'bengal', coat: 1, male: false, hunger: 0.42, age: 33 }); a.preg = 1.5; a.sire = { breed: 'moggy', coat: 2 };
    const k = catMake({ x: H.P.x + 1, z: H.P.z, owned: true, name: 'Wee', breed: 'moggy', coat: 3, age: 1.5, mum: a });
    const f = catMake({ x: H.P.x + 4, z: H.P.z, breed: 'persian', coat: 2, hunger: 0.3, age: 20, camp: 0, fed: 2, fedDay: 3 }); f.trust = 0.6;
    const s = catMake({ x: H.P.x + 6, z: H.P.z, camp: 0 });   // (a stray that doesn't follow: not kept)
    MC.night = 1.25;
    const who = () => CATS.map(c => [c.name, c.breed, c.coat, c.male ? 1 : 0, c.owned ? 1 : 0, +c.hunger.toFixed(3), +c.age.toFixed(1), +c.fed.toFixed(1), c.mum ? c.mum.name : '', +(c.preg || 0).toFixed(1)].join('|')).sort();
    const was = who().filter(x => !x.startsWith('|moggy') || true);
    JOURNEY.off = false; journeySave(); resetMiceCats(); JOURNEY.saved = journeyRead(); journeyResume();
    out.was = was; out.now = who(); out.night = MC.night; out.n = CATS.length;
    return out;
  });
  const keep = r.was.filter(x => !(x.split('|')[0] === '' && x.split('|')[7] === '0'));
  ok('save: ours (breed, coat, sex, name, hunger, age, expecting), her kitten, a follower (fed days) come back; not a passing stray', r.n === 3 && JSON.stringify(r.now) === JSON.stringify(keep), r);
  ok('save: tonight\'s loss to the mice', Math.abs(r.night - 1.25) < 0.01, r);
}

if (want('sim')) {
  if (h) { errors.push(...h.errors); await h.close(); } h = await open();
  const r = await h.page.evaluate(() => {
    const { G, T, step, startGame, MOUSE_HOLES, MICE, CATS, updateMiceCats, coyoteCat, catBark, catGrip, falconPick, cougarTarget, COUGARS, spawnPack, falconSnackW, HERDS } = GAME, out = {};
    startGame({ kind: 'bot', index: 0 }); G.clock.hour = 21;
    out.on = [T.mouse.on, T.cat.on]; out.holes = MOUSE_HOLES.length;
    for (let i = 0; i < 200; i++) step(0.025);
    out.n = [MICE.length, CATS.length];
    const p = spawnPack(1, { howl: false }), k = p.members[0], d = G.dogs[0];
    const R = Math.random; let drew = 0; Math.random = () => { drew++; return R(); };
    try { updateMiceCats(0.025, 0.01); k.state = 'pack'; coyoteCat(k, 0.025); catBark(d); catGrip(d, d.x, d.z, 2); for (const e of [...CATS, ...HERDS]) falconSnackW(e); cougarTarget(COUGARS[0]); }
    finally { Math.random = R; }
    out.drew = drew;
    return out;
  });
  show(r);
  ok('sim: off in ?sim: no holes, no mice, no cats', !r.on[0] && !r.on[1] && r.holes === 0 && r.n[0] === 0 && r.n[1] === 0, r);
  ok('sim: none about: the hooks draw no Math.random', r.drew === 0, r);
}

if (h) { errors.push(...h.errors); await h.close(); }
ok('no page errors', errors.length === 0, errors.slice(0, 3));
process.exit(fails ? 1 : 0);
