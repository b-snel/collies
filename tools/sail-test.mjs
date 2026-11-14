// Headless checks for SAILING: points of sail (reach fastest, no-go zone, irons and out of it), tack and gybe (the boom's crash, sheeted in:
// none), heel (the flock as ballast, reefing), stations (Ⓧ held; tiller: steer / hold a course / let go: lashed; sheet, halyard, anchor), what Ⓧ takes, hungry sheep at the troughs, Hank's trim, sheep
// overboard (swims, clings, hauled in from the rail, towed by a swimming dog, drowns), a dog overboard (swims, climbs back), life rings
// (taken, aimed, thrown, the sheep takes hold, hauled in on its line), an island (taken alongside its jetty, its ground, ashore: flowers,
// salt, a chest, the spring; away again), the chase camera (astern, level, lagging her turns), anchoring, and the hazards: orcas (bonk:
// sheep by that rail go over; a bark turns one), reefs, sharks, the storm (gale, a great wave abeam / on the bow), the waterspout, sirens
// (lured to the rail and over; a bark, a dog in the way), the kraken (arms heel her, the flock's weight holds her up, bonk the arms, a sheep
// into its eye; beaten), and the Promised Land (finishes). Cold Harbour: the flock herded down the harbour road and up the gangway, lines in, away;
// alongside the gangway stays wide open (no sprint, pounce or grab swings it into the way; a dog walks aboard from anywhere on the pier).
// The wind (shifts that hold, gusts veer, the swell lags the wind sea; a front: lull, squall, the new wind holds) and the way (islands passed by).
// node tools/sail-test.mjs [polar|irons|tack|gybe|heel|stations|grab|hungry|hank|over|dog|anchor|isle|ring|cam|orca|reef|shark|storm|spout|siren|kraken|arrive|wind|front|skip|start|dock|gang|land]
// Checks: sailing: points of sail, no-go zone, irons and out, tack, gybe (crash, duck, sheeted in), heel (flock as ballast, reef),
//   stations (Ⓧ held; tiller: steer / hold / let go: lashed; sheet, halyard, anchor), what Ⓧ takes (gear before a sheep in the way; a sheep in the
//   water first), hungry sheep at the deck's troughs (a bark, a frightening ride: they eat on), Hank's trim, sheep overboard (swims, clings, hauled in, towed, drowns),
//   dog overboard and back, anchor off a jetty (warped in: saved, mended; deep: drags), an island (sailed in to, its ground, ashore:
//   flowers, salt, chest, spring; away), life rings (taken, aimed, thrown, taken hold of, hauled in), the chase camera (astern, level, lags
//   a turn), orcas (bonk, bark), reefs, sharks, storm (gale, great wave abeam / on the bow), waterspout, sirens (lured, bark, blocked),
//   kraken (arms, ballast, bonks, eye, beaten), Cabo, the wind (goes round in shifts that hold, gusts veer and lulls back, a cross sea:
//   the swell lags), a front (from the new wind's quarter, called, a lull, a squall and rain, the new wind holds; the Storm Key leg's veers it),
//   the way (straight for the Promised Land: the legs come by in turn, no stops, it ends there; alongside out of turn; Hank's helm full and by),
//   the start (lines in, take the tiller, away), Cold Harbour (the top of the road, the
//   mountainside off it, the quay's edge, herded down and aboard, lashed, cast off: the land and a straggler left), a new journey
import { open } from './harness.mjs';
const only = process.argv[2];
let h = await open(), errors = [], fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const want = k => !only || only === k;
// a fresh page, at sea and under way, the weather set by hand; helpers on window.H
const setup = async (opt = {}) => { errors.push(...h.errors); await h.close(); h = await open(); return h.page.evaluate(opt => {
  const { G, T, SEA, WIND, BOAT, step, startGame, seaStart, CAM_R, CAM_F, STATIONS, boatXZ, boatU, boatV, boatHB, onDeck } = GAME;
  startGame({ kind: 'bot', index: 0 }); G.clock.hour = 9;
  const H = window.H = {};
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.stick = (fwd, stb, x = {}) => fwd || stb ? H.inp(BOAT.fx * fwd + BOAT.rx * stb, BOAT.fz * fwd + BOAT.rz * stb, x) : { ...x };   // toward the bow, to starboard
  H.run = (sec, fn) => { for (let t = 0; t < sec - 1e-9; t += 0.025) { if (fn && fn(t) === true) return t; step(0.025); } return sec; };
  H.hold = (p, extra = {}) => { p.bot = { ...extra, grab: true }; step(0.025); step(0.025); };   // Ⓧ held (a station's kept while it is; let go: off it)
  H.g = (x = {}) => ({ ...x, grab: true });
  H.shake = (p, extra = {}) => { p.bot = { ...extra, pounce: true }; step(0.025); p.bot = { ...extra }; };   // Ⓑ with something held
  H.place = (e, u, v) => { const q = boatXZ(u, v); e.x = q.x; e.z = q.z; e.vx = e.vz = 0; e.y = BOAT.y; e.air = null; };
  H.wrap = a => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };
  H.r = (v, n = 2) => +(+v).toFixed(n); H.deg = a => +(a * 57.2958).toFixed(1);
  // wind from `twa` rad off her bow (+ starboard) at w m/s, steady; she's on a heading, sailing
  H.sea = (twa = 1.57, w = 8, o = {}) => {
    seaStart({ under: true, leg: o.leg || 0 }); SEA.lockWx = true; T.sea.wind.gustRate = 0; T.sea.wind.veer = [0, 0]; T.sea.wind.breathe = [0, 0];
    SEA.e = o.e ?? 0; SEA.n = o.n ?? -4000; SEA.hdg = o.hdg ?? 0; WIND.base = WIND.dir = SEA.hdg + twa; WIND.baseSpd = WIND.spd = w; SEA.u = o.u ?? 3; SEA.state = Math.max(0.03, (w - 2.5) / 19) * (o.flat ? 0.1 : 1); if (o.flat) T.sea.wave.max = T.sea.wave.min = 0.02;
  };
  H.steer = hdg => { SEA.helm = Math.max(-1, Math.min(1, H.wrap(hdg - SEA.hdg) * 2.2 - SEA.r * 2.4)); };   // (a hand on the helm, no dog)
  H.flock = (v, u0 = -6, u1 = 6) => G.sheep.filter(s => !s.dead).forEach((s, i, a) => H.place(s, u0 + (u1 - u0) * i / Math.max(1, a.length - 1), v + (i % 2 ? 0.5 : -0.5)));
  H.rail = (u, off, sd = 1) => sd * (boatHB(u) - off);   // v that far in from the rail (sd: starboard 1, port -1)
  H.flockRail = (off, u0 = -6, u1 = 6, sd = 1) => G.sheep.filter(s => !s.dead).forEach((s, i, a) => { const u = u0 + (u1 - u0) * i / Math.max(1, a.length - 1); H.place(s, u, H.rail(u, off + (i % 2 ? -0.5 : 0.5), sd)); });
  H.aboard = () => G.sheep.filter(s => !s.dead && !s.air && onDeck(s.x, s.z)).length;
  H.swimmers = () => G.sheep.filter(s => !s.dead && s.air && s.air.kind === 'swim');
  if (opt.calm) for (const s of G.sheep) { s.hunger = 0.05; s.thirst = 0.02; }
  return true;
}, opt); };

if (want('polar')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { SEA } = GAME, out = {};
    for (const [name, twa] of [['irons', 0.35], ['close', 0.87], ['reach', 1.57], ['broad', 2.36], ['run', 3.05]]) {
      H.sea(twa, 8); let n = 0, u = 0, lee = 0, heel = 0;
      H.run(45, t => { H.steer(0); if (t > 15) { n++; u += SEA.u; lee += Math.atan2(SEA.v, Math.max(0.1, SEA.u)); heel += Math.abs(SEA.heel); } });   // (30 s: the seas make 15 s of it a lottery)
      out[name] = { u: H.r(u / n), lee: H.deg(lee / n), heel: H.deg(heel / n), trim: H.r(SEA.trim), boom: H.deg(Math.abs(SEA.boom)) };
    }
    return out;
  });
  ok(`reach ${r.reach.u} m/s is fastest (close ${r.close.u}, broad ${r.broad.u}, run ${r.run.u})`, r.reach.u > 5 && r.reach.u > r.close.u && r.reach.u > r.run.u && r.close.u > 2.5 && r.run.u > 2.5 && r.broad.u > 4, r);
  ok(`no-go zone: 20° off the wind she stops (${r.irons.u} m/s)`, r.irons.u < 0.5, r);
  ok(`leeway: close-hauled she slides ${-r.close.lee}° (reaching ${-r.reach.lee}°, running ${Math.abs(r.run.lee)}°)`, Math.abs(r.close.lee) > Math.abs(r.reach.lee) && Math.abs(r.close.lee) > 2 && Math.abs(r.run.lee) < 1.5, r);
  ok(`the boom's eased as the wind draws aft (${r.close.boom}° → ${r.reach.boom}° → ${r.run.boom}°), Hank's trim good (${r.reach.trim})`, r.close.boom < r.reach.boom && r.reach.boom < r.run.boom && r.reach.trim > 0.9, r);
  ok(`she heels more on the wind (${r.close.heel}°) than running (${r.run.heel}°)`, r.close.heel > r.run.heel + 3, r);
}

if (want('irons')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { SEA } = GAME, out = {};
    H.sea(0.05, 8, { u: 2 }); H.run(25, () => { SEA.helm = 0; });
    out.stopped = H.r(SEA.u); out.irons = H.r(SEA.irons); out.luff = H.r(SEA.luff);
    H.run(30, () => { SEA.helm = 1; }); out.off = H.deg(Math.abs(SEA.twa)); out.u1 = H.r(SEA.u);   // helm hard over: she backs her jib and her head pays off
    H.run(20, () => { SEA.helm = 0; H.steer(SEA.hdg); }); out.u2 = H.r(SEA.u);
    return out;
  });
  ok(`head to wind she stops and drifts astern (${r.stopped} m/s), sail luffing (${r.luff})`, r.stopped < 0.2 && r.irons > 1 && r.luff > 0.5, r);
  ok(`helm hard over: her head pays off to ${r.off}° and she sails again`, r.off > 40 && r.u1 > 0.5, r);
}

if (want('tack')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { SEA, WIND } = GAME, out = {};
    H.sea(0.95, 8); H.run(25, () => H.steer(0)); out.u0 = H.r(SEA.u); out.boom0 = H.deg(SEA.boom); const g0 = SEA.gybeT;
    const to = WIND.dir + 0.95;   // the other tack: the wind as far on her other bow
    out.t = H.r(H.run(40, () => { H.steer(to); return Math.abs(H.wrap(to - SEA.hdg)) < 0.12 && SEA.u > 1.5; })); out.minU = 9; H.run(15, () => { H.steer(to); });
    out.boom1 = H.deg(SEA.boom); out.u1 = H.r(SEA.u); out.slam = SEA.gybeT !== g0; out.twa = H.deg(SEA.twa);
    return out;
  });
  ok(`tack: through the wind in ${r.t} s, the boom over (${r.boom0}° → ${r.boom1}°) without a crash`, r.t < 30 && Math.sign(r.boom0) !== Math.sign(r.boom1) && !r.slam, r);
  ok(`sailing again on the new tack (${r.u1} m/s)`, r.u1 > 2.5 && r.twa < -35, r);
}

if (want('gybe')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, WIND, STATIONS, BOAT } = GAME, out = {}, d = G.dogs[0];
    // running, wind on the starboard quarter, boom right out to port; turn her stern through it
    H.sea(2.75, 9); H.flock(0); H.place(d, -3, -3); const s0 = G.sheep[0]; H.place(s0, -2, 2.5);
    H.run(18, () => H.steer(0)); out.boom0 = H.deg(SEA.boom); const g0 = SEA.gybeT, to = H.wrap(WIND.dir - 2.75 + 0.02) + 0; const hdgTo = SEA.hdg + (2.75 * 2 - Math.PI * 2 + 6.283 - 5.5 + 0.0);
    let knocked = false, flew = false; const target = H.wrap(WIND.dir + Math.PI - 0.45);   // the wind on the other quarter
    H.run(25, () => { H.steer(target); if (d.stunT > 0) knocked = true; if (G.sheep.some(s => s.air && s.air.how === 'boom')) flew = true; });
    out.boom1 = H.deg(SEA.boom); out.slam = SEA.gybeT !== g0; out.knocked = knocked; out.flew = flew; out.heelV = H.r(SEA.heelV);
    // again, lying down under it; and with the sheet hauled in first: no crash
    H.sea(2.75, 9); H.flock(4.2, 6, 10); H.place(d, -3, -3); d.player.bot = { lie: true };
    H.run(18, () => H.steer(0)); let k2 = false; const g1 = SEA.gybeT; H.run(25, () => { H.steer(target); if (d.stunT > 0) k2 = true; }); out.duck = !k2 && SEA.gybeT !== g1;
    H.sea(2.75, 9); SEA.assist = false; H.run(18, () => { H.steer(0); SEA.sheet = 0.05; }); const g2 = SEA.gybeT; H.run(25, () => { H.steer(target); SEA.sheet = 0.05; }); out.soft = SEA.gybeT === g2; out.boom2 = H.deg(SEA.boom); SEA.assist = true;
    return out;
  });
  ok(`gybe: the boom crashes across (${r.boom0}° → ${r.boom1}°)`, r.slam && Math.sign(r.boom0) !== Math.sign(r.boom1) && Math.abs(r.boom0) > 60, r);
  ok('it swats the dog and a sheep in its way', r.knocked && r.flew, r);
  ok('lying down, it goes over the dog\'s head', r.duck, r);
  ok('sheeted hard in first, it comes over without a crash', r.soft, r);
}

if (want('heel')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA } = GAME, out = {};
    const heel = (v, hoist = 1) => { H.sea(1.57, 11, { flat: true }); SEA.hoist = hoist; let n = 0, a = 0, u = 0; H.run(40, t => { H.steer(0); H.flock(v); if (t > 25) { n++; a += SEA.heel; u += SEA.u; } }); return [H.deg(a / n), H.r(u / n)]; };
    [out.mid, out.uMid] = heel(0); [out.lee, out.uLee] = heel(-5.4); [out.wind, out.uWind] = heel(5.4); [out.reef, out.uReef] = heel(0, 0.55);   // (wind from starboard: she heels to port; port is the lee side)
    return out;
  });
  ok(`wind on the starboard beam heels her to port (${r.mid}°)`, r.mid < -8, r);
  ok(`live ballast: flock to leeward ${r.lee}°, amidships ${r.mid}°, to windward ${r.wind}°`, r.lee < r.mid - 3 && r.wind > r.mid + 3, r);
  ok(`reefed she stands up (${r.reef}°) and gives up some speed (${r.uMid} → ${r.uReef} m/s)`, r.reef > r.mid + 3 && r.uReef < r.uMid, r);
}

if (want('stations')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, STATIONS, BOAT, stationOf } = GAME, out = {}, d = G.dogs[0], p = d.player, [til, sht, hal, anc] = STATIONS;
    H.sea(1.57, 8); H.flock(0, 4, 9);
    const at = st => { d.x = st.sx; d.z = st.sz; d.vx = d.vz = 0; d.yaw = st.yaw; p.bot = {}; H.run(0.1); };
    // the tiller: Ⓧ held bites it; stick to starboard turns her to starboard; let go of the stick: she holds that heading
    at(til); H.hold(p); out.bit = stationOf(d) === til && til.by === d; const h0 = SEA.hdg;
    p.bot = H.stick(0, 1, H.g()); H.run(4); out.turned = H.deg(H.wrap(SEA.hdg - h0)); out.rud = H.r(SEA.rud); out.still = H.r(Math.hypot(d.x - til.sx, d.z - til.sz));
    p.bot = H.g(); H.run(3); const h1 = SEA.hdg; H.run(8); out.held = H.deg(Math.abs(H.wrap(SEA.hdg - h1))); out.course = SEA.course !== null;
    // let go of Ⓧ: off it at once, free to run; the tiller's lashed: she holds her heading still
    p.bot = {}; H.run(0.05); out.letGo = !d.holding && !til.by; out.lashed = SEA.lash; const h2 = SEA.hdg, x0 = d.x, z0 = d.z;
    p.bot = H.stick(1, 0); H.run(1); out.ran = H.r(Math.hypot(d.x - x0, d.z - z0)); p.bot = {}; H.run(9); out.lashHeld = H.deg(Math.abs(H.wrap(SEA.hdg - h2)));
    // taken again: unlashed; let go mid-turn: she settles near where she was heading
    at(til); H.hold(p); out.unlash = !SEA.lash && stationOf(d) === til; p.bot = H.stick(0, -1, H.g()); H.run(2); p.bot = {}; H.run(0.05); const h3 = SEA.hdg; H.run(10); out.settled = H.deg(Math.abs(H.wrap(SEA.hdg - h3)));
    // the sheet: stick aft hauls in, forward eases; while the dog has it Hank leaves it be
    SEA.sheet = 0.6; at(sht); H.hold(p); out.sheetBit = stationOf(d) === sht; p.bot = H.stick(-1, 0, H.g()); H.run(1); out.hauled = H.r(SEA.sheet); p.bot = H.stick(1, 0, H.g()); H.run(1.2); out.eased = H.r(SEA.sheet);
    p.bot = H.g(); const s0 = SEA.sheet; H.run(3); out.mine = Math.abs(SEA.sheet - s0) < 1e-6; p.bot = {}; H.run(0.5);
    // the halyard: stick down reefs, let go: it settles on a reef; up: full sail
    at(hal); H.hold(p); p.bot = H.stick(-1, 0, H.g()); H.run(0.8); p.bot = H.g(); H.run(3); out.reefed = H.r(SEA.hoist); p.bot = H.stick(-1, 0, H.g()); H.run(2.5); out.down = H.r(SEA.hoist); p.bot = H.stick(1, 0, H.g()); H.run(3); out.up = H.r(SEA.hoist); p.bot = {}; H.run(0.5);
    // the anchor: stick down (held a moment) lets it go; stick up, held, weighs it. Just weighed, the stick swung down doesn't drop it again,
    // nor a flick: only once it's been let go, the lock's out, and it's held down
    at(anc); H.hold(p); p.bot = H.stick(-1, 0, H.g()); H.run(0.15); out.flick = SEA.anchor; H.run(0.4); out.dropped = SEA.anchor; p.bot = H.stick(1, 0, H.g()); H.run(1); out.weighing = H.r(SEA.weigh);
    p.bot = H.g(); H.run(0.4); out.kept = H.r(SEA.weigh); p.bot = H.stick(1, 0, H.g()); H.run(3); out.weighed = SEA.anchor;
    p.bot = H.stick(-1, 0, H.g()); H.run(2.5); out.swung = SEA.anchor; p.bot = H.g(); H.run(0.1); p.bot = H.stick(-1, 0, H.g()); H.run(0.6); out.again = SEA.anchor;
    return out;
  });
  ok('Ⓧ held bites the tiller; the dog stands to it', r.bit && r.still < 0.3, r);
  ok(`stick to starboard: she turns to starboard (${r.turned}°)`, r.turned > 15 && r.rud > 0.1, r);
  ok(`stick let go: she holds her heading (wandered ${r.held}°)`, r.course && r.held < 6, r);
  ok(`Ⓧ let go: off the tiller at once (ran ${r.ran} m), lashed: she holds her heading (wandered ${r.lashHeld}°); taken again: unlashed; let go mid-turn: settles (${r.settled}° on)`, r.letGo && r.lashed && r.ran > 2 && r.lashHeld < 6 && r.unlash && r.settled < 25, r);
  ok(`the sheet: stick aft hauls in (0.6 → ${r.hauled}), forward eases (→ ${r.eased}); Hank leaves it to the dog`, r.sheetBit && r.hauled < 0.45 && r.eased > r.hauled + 0.3 && r.mine, r);
  ok(`the halyard: reefed ${r.reefed}, down ${r.down}, up ${r.up}`, r.reefed === 0.55 && r.down === 0 && r.up === 1, r);
  ok(`the anchor: a flick doesn't (${r.flick}), held down let go (${r.dropped}), weighed (${r.weighing} → ${r.kept} let go a moment → ${r.weighed})`, r.flick === 'up' && r.dropped === 'down' && r.weighing > 0.2 && r.kept >= r.weighing && r.weighed === 'up', r);
  ok(`just weighed: the stick swung on down doesn't drop it (${r.swung}); let go, then down: it does (${r.again})`, r.swung === 'up' && r.again === 'down', r);
}

if (want('hank')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { SEA, HANK, onDeck } = GAME, out = {};
    H.sea(1.2, 8); SEA.sheet = 1; H.run(14, () => H.steer(0)); out.trim = H.r(SEA.trim); out.sheet = H.r(SEA.sheet); out.aboard = onDeck(HANK.x, HANK.z);
    SEA.assist = false; H.run(5, () => H.steer(0)); out.ran = H.r(SEA.sheet); out.luff = H.r(SEA.luff); SEA.assist = true;
    return out;
  });
  ok(`Hank trims the sheet when no dog has it (trim ${r.trim})`, r.trim > 0.9 && r.sheet < 0.7 && r.aboard, r);
  ok(`full manual: let go, it runs out and the sail luffs (${r.luff})`, r.ran > 0.98 && r.luff > 0.5, r);
}

if (want('over')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, BOAT, seaOverRail, boatHB, boatU, boatV, onDeck } = GAME, out = {}, d = G.dogs[0], p = d.player;
    H.sea(1.57, 6, { u: 0, flat: true }); SEA.hoist = 0; SEA.u = 0; H.flock(0); p.bot = {};   // lying to, no sail
    const s = G.sheep[0]; H.place(s, -2, H.rail(-2, 1.5)); seaOverRail(s, 1, 3.5, 5, 'test'); const saved0 = G.stats.saved || 0;
    H.run(2.5); out.swim = !!(s.air && s.air.kind === 'swim' && s.air.sea); out.off = H.r(boatV(s.x, s.z) - boatHB(boatU(s.x, s.z)));
    H.run(12); out.cling = !!(s.air && s.air.cling); out.lung = H.r(s.air ? s.air.lung : -1); out.side = H.r(boatV(s.x, s.z) - boatHB(boatU(s.x, s.z)));
    // a dog on deck by the rail there bites: up it comes
    H.place(d, boatU(s.x, s.z), boatHB(boatU(s.x, s.z)) - 0.9); H.run(0.2); H.hold(p); p.bot = {}; H.run(2.5);
    out.back = !s.air && onDeck(s.x, s.z); out.saved = (G.stats.saved || 0) - saved0; out.calm = H.r(s.stress);
    // under way she sails on and leaves it: it drowns
    H.sea(1.57, 8); H.flock(0); const s2 = G.sheep[1], n0 = G.sheep.filter(q => !q.dead).length; H.place(s2, -2, H.rail(-2, 1.5)); seaOverRail(s2, 1, 3.5, 5, 'test'); T.sea.over.float = 12;   // (another may slide over meanwhile: it's s2 we watch)
    H.run(4, () => H.steer(0)); out.astern = H.r(-boatU(s2.x, s2.z)); H.run(26, () => H.steer(0));
    out.gone = s2.dead; out.why = (G.lost.find(l => l.name === s2.name) || {}).why; out.lost = G.lost.map(l => l.why).join(); out.drowned = G.stats.drowned; out.left = G.sheep.filter(q => !q.dead).length - n0;
    return out;
  });
  ok(`over the rail: it's swimming, ${r.off} m off the side`, r.swim && r.off > 0.3, r);
  ok(`she's stopped: it paddles back and clings on (${r.side} m off; ${Math.round(r.lung * 100)}% left)`, r.cling && r.side < 1.2 && r.lung > 0.6, r);
  ok('a dog at the rail bites it: hauled aboard, counted as saved', r.back && r.saved === 1, r);
  ok(`under way it's left ${r.astern} m astern and drowns`, r.astern > 8 && r.gone && r.why === 'drowned' && r.drowned >= 1 && r.left <= -1, r);
}

if (want('dog')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, BOAT, seaOverRail, boatHB, boatU, boatV, onDeck, startJump } = GAME, out = {}, d = G.dogs[0], p = d.player;
    H.sea(1.57, 6, { u: 0, flat: true }); SEA.hoist = 0; SEA.u = 0; H.flock(0, 3, 9);
    // pushing into the rail doesn't take it over; a running jump does
    H.place(d, -4, boatHB(-4) - 3); p.bot = H.stick(0, 1); H.run(2); out.stays = onDeck(d.x, d.z) && !d.air;
    H.place(d, -4, boatHB(-4) - 6); p.bot = H.stick(0, 1, { sprint: true }); H.run(0.35); p.bot = H.stick(0, 1, { sprint: true, jump: true }); H.run(0.05); p.bot = H.stick(0, 1, { sprint: true }); H.run(1.5);
    out.swims = !!(d.air && d.air.swim); out.out = H.r(boatV(d.x, d.z) - boatHB(boatU(d.x, d.z)));
    // a sheep in the water: the swimming dog bites it and tows it back; against the hull they both come up
    const s = G.sheep[0]; H.place(s, -4, H.rail(-4, 1.5)); seaOverRail(s, 1, 6, 5, 'test'); p.bot = {}; H.run(2.5);
    H.run(8, () => { p.bot = H.inp(s.x - d.x, s.z - d.z); return Math.hypot(s.x - d.x, s.z - d.z) < 1.5; }); p.bot = { ...p.bot, grab: true }; H.run(0.1); out.tow = d.tow === s;   // (Ⓧ held: by the scruff)
    out.t = H.r(H.run(14, () => { p.bot = H.stick(0, -1, { grab: true }); return !d.air && onDeck(d.x, d.z); })); H.run(2.5); p.bot = {};
    out.dogBack = !d.air && onDeck(d.x, d.z); out.sheepBack = !s.air && onDeck(s.x, s.z); out.dbg = { air: d.air && (d.air.kind || 'swim'), u: H.r(boatU(d.x, d.z)), v: H.r(boatV(d.x, d.z)), hold: d.holdKind };
    // under way, faster than a dog swims: one over the side falls astern, paddling after her; Hank's line hauls it in
    SEA.hoist = 1; SEA.u = 5; H.place(d, BOAT.stern + 1, 0); seaOverRail(d, 1, 3, 4, 'test'); H.run(1.5);
    let far = 0; out.lineT = H.r(H.run(30, () => { p.bot = H.stick(1, 0); far = Math.max(far, Math.hypot(boatU(d.x, d.z) - BOAT.stern, boatV(d.x, d.z))); return !d.air && onDeck(d.x, d.z); }), 1); p.bot = {};
    out.far = H.r(far, 1); out.lineBack = !d.air && onDeck(d.x, d.z); out.spd = H.r(SEA.u * T.sea.pace);
    return out;
  });
  ok(`she sails away from a dog over the side (${r.spd} m/s): Hank's line hauls it in (${r.lineT} s, ${r.far} m off at most)`, r.lineBack && r.lineT < 15 && r.far < 30, r);
  ok('the rail holds a dog pushing at it; a running jump clears it', r.stays && r.swims && r.out > 0, r);
  ok('it swims to the sheep, bites it, tows it back', r.tow, r);
  ok(`against the hull they scramble up the nets (${r.t} s): both aboard`, r.dogBack && r.sheepBack, r);
}

if (want('grab')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, STATIONS, RINGS, BOAT, seaOverRail, boatU, boatV, boatHB, boatXZ, onDeck, grabPick, stationOf } = GAME, out = {}, d = G.dogs[0], p = d.player, til = STATIONS[0], R = RINGS[1];
    H.sea(1.57, 6, { u: 0, flat: true }); SEA.hoist = 0; SEA.u = 0; H.flock(0, 4, 9); p.bot = {};
    // a sheep at its mouth, the tiller a little further: Ⓧ takes the tiller (the boat's gear first); what it'd take is what it bites
    const fx = Math.sin(til.yaw), fz = Math.cos(til.yaw), s = G.sheep.find(q => !q.lamb && !q.ram);
    d.x = til.sx - fx * 0.8; d.z = til.sz - fz * 0.8; d.yaw = til.yaw; d.vx = d.vz = 0; s.x = d.x + fx * 1.1; s.z = d.z + fz * 1.1; s.vx = s.vz = 0;
    const g0 = grabPick(d); out.pick = g0 && g0.kind; out.sheepD = H.r(Math.hypot(s.x - d.x - fx * 1.1, s.z - d.z - fz * 1.1)); out.tilD = H.r(Math.hypot(til.x - d.x - fx * 1.1, til.z - d.z - fz * 1.1));
    p.bot = { grab: true }; GAME.step(0.025); out.bit = stationOf(d) === til; p.bot = {}; H.run(0.3);
    // a sheep in the water alongside, a few m along the rail from a dog at the ring: hauled in, not the ring
    const w = G.sheep.find(q => q !== s && !q.lamb && !q.ram), wu = T.sea.ring.u + 3.2; H.place(w, wu, H.rail(wu, 1.5)); seaOverRail(w, 1, 3.5, 5, 'test');
    H.run(12); out.cling = !!(w.air && w.air.cling);
    H.place(d, boatU(R.sx, R.sz), boatV(R.sx, R.sz)); d.yaw = Math.atan2(R.hx - d.x, R.hz - d.z); H.run(0.1); out.far = H.r(Math.hypot(w.x - d.x, w.z - d.z));
    const g1 = grabPick(d); out.pick2 = g1 && g1.kind; p.bot = { grab: true }; H.run(0.1); p.bot = {}; H.run(2.5);
    out.hauled = !w.air && onDeck(w.x, w.z); out.racked = R.st === 'rack';
    return out;
  });
  ok(`a sheep at its mouth (${r.sheepD} m), the tiller ${r.tilD} m: Ⓧ takes the tiller (${r.pick}), and that's what it bites`, r.pick === 'station' && r.bit, r);
  ok(`a sheep in the water ${r.far} m off a dog at the life ring: Ⓧ hauls her in (${r.pick2}), the ring stays on its hook`, r.cling && r.pick2 === 'haul' && r.hauled && r.racked, r);
}

if (want('hungry')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, DECK, boatU, boatV, troughSet } = GAME, out = {}, d = G.dogs[0], p = d.player;
    // hungry (or barely peckish), the deck's troughs stocked: they go and feed; a bark by them, then a fright from the ride
    const go = hunger => {
      H.sea(1.57, 6, { u: 0, flat: true }); SEA.hoist = 0; SEA.u = 0; p.bot = {};
      for (const tr of DECK.troughs) tr.food = tr.cap;
      const L = G.sheep.filter(s => !s.dead); L.forEach(s => { s.hunger = hunger; s.thirst = 0; s.stress = 0; s.fear = 0; s.panic = 0; });
      H.flock(0, -4, 4); H.place(d, 15, 0); H.run(20, () => L.forEach(s => { s.hunger = Math.max(s.hunger, hunger); }));
      const at = () => L.filter(s => s.state === 'trough').length, o = { fed: at(), set: H.r(L.reduce((a, s) => a + troughSet(s), 0) / L.length) };
      const tr = DECK.troughs[1]; H.place(d, boatU(tr.x, tr.z) + 1, boatV(tr.x, tr.z) + 3.5);
      p.bot = { bark: true }; GAME.step(0.025); p.bot = {}; H.run(1.5, () => L.forEach(s => { s.hunger = Math.max(s.hunger, hunger); })); o.barked = at();
      H.place(d, 15, 0); H.run(8, () => { SEA.fear = 0.9; L.forEach(s => { s.hunger = Math.max(s.hunger, hunger); }); }); o.ride = at(); o.panic = L.filter(s => s.panic > 0.25).length; SEA.fear = 0;
      return o;
    };
    out.hungry = go(0.8); out.peckish = go(0.15);
    return out;
  });
  ok(`hungry, they feed (${r.hungry.fed} at the troughs); a bark by them: they eat on (${r.hungry.barked})`, r.hungry.fed >= 6 && r.hungry.barked >= r.hungry.fed - 1, r);
  ok(`barely peckish, a bark sends them off (${r.peckish.fed} → ${r.peckish.barked})`, r.peckish.fed >= 4 && r.peckish.barked <= r.peckish.fed / 2, r);
  ok(`a frightening ride: the hungry stay at the troughs (${r.hungry.ride}, ${r.hungry.panic} panicked), the peckish don't (${r.peckish.ride})`, r.hungry.ride >= r.hungry.fed - 2 && r.hungry.panic === 0, r);
}

if (want('anchor')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, WIND, ROUTE, DOCKS, DECK, seaAnchorDrop, seaAnchorUp, seaAtRest } = GAME, out = {}, w = ROUTE[1], D = DOCKS[1];
    // off Seal Skerry's jetty her anchor goes down: Hank takes her lines and she's warped alongside. Saved; a ♥ comes back; the gangway's open
    H.sea(1.57, 8, { leg: 0 }); SEA.hdg = w.crs + 0.5; SEA.e = D.e + Math.sin(w.crs + Math.PI / 2) * 38 - Math.sin(w.crs) * 12; SEA.n = D.n + Math.cos(w.crs + Math.PI / 2) * 38 - Math.cos(w.crs) * 12; SEA.u = 1; SEA.hull = 3; SEA.hoist = 0; SEA.leg = 1;
    seaAnchorDrop(); out.t = H.r(H.run(20, () => SEA.docked), 1); H.run(2);
    out.docked = SEA.docked && SEA.berth === 1; out.off = H.r(Math.hypot(SEA.e - D.e, SEA.n - D.n) + Math.abs(H.wrap(SEA.hdg - D.hdg)), 3); out.spd = H.r(Math.hypot(SEA.u, SEA.v)); out.saved = SEA.saved; out.hull = SEA.hull; out.leg = SEA.leg; out.rest = seaAtRest(); out.cp = SEA.checkpoint && SEA.checkpoint.name;
    out.gang = !DECK.lock && DECK.gateT > 0.9; out.anchor = SEA.anchor; out.aboard = H.aboard();
    // out in deep water it finds no bottom: she drags off down the wind
    H.sea(1.57, 10); SEA.hoist = 0; SEA.u = 0; seaAnchorDrop(); H.run(3); out.deep = !SEA.holding; const e1 = SEA.e, n1 = SEA.n; H.run(30); out.dragged = H.r(Math.hypot(SEA.e - e1, SEA.n - n1)); out.rest2 = seaAtRest();
    return out;
  });
  ok(`her anchor down off the island's jetty: warped alongside in ${r.t} s (${r.off} off her berth, ${r.spd} m/s), the gangway open, the flock aboard (${r.aboard})`, r.docked && r.t < 12 && r.off < 0.01 && r.spd < 0.01 && r.gang && r.anchor === 'up' && r.aboard >= 12, r);
  ok(`alongside: saved (${r.cp}), the hull mended (3 → ${r.hull} ♥), on to the next leg`, r.saved === 1 && r.hull === 5 && r.leg === 2 && r.rest && r.cp === 'Seal Skerry', r);
  ok(`in deep water it only drags (${r.dragged} m in 30 s): no rest`, r.deep && r.dragged > 4 && !r.rest2, r);
}

if (want('isle')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, ROUTE, DOCKS, DECK, ISLES, BUCKETS, PLANTS, BOAT, QUAY, seaStart, seaCastOff, seaDogsAshore, boatXZ, boatU, boatV, onDeck, terrainH, sdfAt, swimSdfAt } = GAME, out = {}, d = G.dogs[0], p = d.player;
    // she sails in to Seal Skerry: near its jetty and slow enough, she's taken alongside
    seaStart({ under: true, leg: 0 }); T.sea.wind.gustRate = 0; T.sea.orca.from = 2; const w = ROUTE[1], D = DOCKS[1];
    SEA.hdg = w.crs; SEA.e = w.e - Math.sin(w.crs) * 120; SEA.n = w.n - Math.cos(w.crs) * 120; SEA.u = 4;
    out.tIn = H.r(H.run(60, () => { if (!SEA.warp && !SEA.docked) H.steer(Math.atan2(w.e - SEA.e, w.n - SEA.n)); return SEA.docked; }), 0);
    const L = ISLES[1], IT = L.items, n = H.aboard(), at = (u, v) => boatXZ(u, v);
    out.moored = SEA.docked && SEA.berth === 1 && !DECK.lock && DECK.gateT > 0.9 && SEA.saved === 1; out.n = n;
    // its ground: a meadow to walk on (over the deck's height by the pier's root: level with it), a crag that's rock, water all round
    const m = at(L.cu, L.cv), root = at(QUAY.pu, QUAY.shore - 2), cr = at(L.gu, L.gv), off = at(L.cu, L.cv - L.r - 12);
    out.ground = { meadow: H.r(terrainH(m.x, m.z) - BOAT.y), root: H.r(terrainH(root.x, root.z) - BOAT.y), walk: sdfAt(m.x, m.z) > 0 && sdfAt(root.x, root.z) > 0, crag: H.r(terrainH(cr.x, cr.z) - BOAT.y, 0), cragRock: swimSdfAt(cr.x, cr.z) < 0, sea: terrainH(off.x, off.z) };
    out.things = { plants: IT.plants.length, shown: IT.plants.every(q => !q.off), salt: IT.salt.length, digs: IT.digs.length };
    // the dog goes ashore: down the gangway, along the pier, onto the beach; the flock stays aboard
    const go = (u, v, sec = 14) => H.run(sec, () => { const q = at(u, v); p.bot = H.inp(q.x - d.x, q.z - d.z); return Math.hypot(q.x - d.x, q.z - d.z) < 0.7; }) < sec;
    H.place(d, -1, 0); out.walked = go(-1, -6) && go(-1, QUAY.shore - 1, 16) && go(L.cu, L.cv + L.r * 0.5, 16); p.bot = {};
    out.ashore = !onDeck(d.x, d.z) && !d.air && seaDogsAshore() === 1; out.flock = H.aboard();
    out.refused = seaCastOff() === false && SEA.docked;   // not without the dog
    // flowers: run over them, and into the deck's trough they go
    const food0 = DECK.troughs.reduce((a, t) => a + t.food, 0); for (const t of DECK.troughs) t.food = Math.min(t.food, t.cap * 0.3);
    const f1 = DECK.troughs.reduce((a, t) => a + t.food, 0), pl = IT.plants[0]; d.x = pl.x; d.z = pl.z; d.y = pl.y; d.vx = d.vz = 0; H.run(0.3); out.greens = H.r(d.greens || 0);
    const tr = DECK.troughs[0]; d.x = tr.x - BOAT.rx * 0 + BOAT.fx * 0; d.z = tr.z; H.place(d, boatU(tr.x, tr.z), boatV(tr.x, tr.z) + 1.1); H.run(0.4); out.tipped = H.r(DECK.troughs.reduce((a, t) => a + t.food, 0) - f1); out.left = H.r(d.greens || 0);
    // salt: a lump off its rock to the deck's lick
    const sr = IT.salt[0]; DECK.lick.salt = 0; d.x = sr.x + 0.5; d.z = sr.z; d.y = sr.y; H.run(0.3); out.lump = d.salt; const lk = DECK.lick.at[0]; H.place(d, boatU(lk.x, lk.z), boatV(lk.x, lk.z) - 0.9); H.run(0.4); out.lick = H.r(DECK.lick.salt);
    // buried treasure: stand on the mound: a chest of wool
    const sp = IT.digs[0], w0 = G.wool || 0; d.x = sp.x; d.z = sp.z; d.y = sp.y; d.vx = d.vz = 0; H.run(T.dig.time + 0.6); out.chest = sp.dug; out.wool = (G.wool || 0) - w0;
    // the spring: the deck's bucket filled there, tipped into her water trough
    const b = BUCKETS.find(q => q.pen === DECK); DECK.water.w = 0; H.place(d, boatU(b.x, b.z) - 0.6, boatV(b.x, b.z)); d.yaw = Math.atan2(b.x - d.x, b.z - d.z); p.bot = { grab: true }; H.run(0.5); out.bucket = b.by === d;
    const S2 = L.spring, q2 = at(S2.u, S2.v); d.x = q2.x; d.z = q2.z; d.y = terrainH(q2.x, q2.z); H.run(2.5); out.filled = H.r(b.w);
    const wt = DECK.water.at[0]; H.place(d, boatU(wt.x, wt.z) + 0, boatV(wt.x, wt.z) - 1.2); H.run(1); out.water = H.r(DECK.water.w); p.bot = {}; H.run(0.3);
    // all aboard: lines in. Its things go with it; she's away on the next leg, and not straight back alongside
    out.cast = seaCastOff() === true && !SEA.docked && DECK.lock; out.gone = IT.plants.every(q => q.off) && IT.digs.every(q => q.off) && sdfAt(m.x, m.z) <= 0; out.leg = SEA.leg;
    H.run(12); out.away = !SEA.docked && !SEA.warp; out.aboard = H.aboard();
    return out;
  });
  ok(`sailing in to the island: taken alongside its jetty in ${r.tIn} s; saved, the gangway open`, r.moored && r.tIn < 50, r);
  ok(`the island's ground to walk on: meadow ${r.ground.meadow} m over the deck, the pier's root level (${r.ground.root}); its crag (${r.ground.crag} m) rock; sea beyond`, r.ground.walk && r.ground.meadow > 0.5 && Math.abs(r.ground.root) < 0.6 && r.ground.crag > 8 && r.ground.cragRock && r.ground.sea === -9, r);
  ok(`on it: ${r.things.plants} flowers, a salt rock, ${r.things.digs} mounds`, r.things.plants >= 8 && r.things.shown && r.things.salt === 1 && r.things.digs === 2, r);
  ok(`the dog goes ashore down the gangway and the pier; the flock stays aboard (${r.flock}); no casting off without it`, r.walked && r.ashore && r.flock === r.n && r.refused, r);
  ok(`flowers picked (${r.greens}) and tipped into the deck's trough (+${r.tipped}); a lump of salt to her lick (${r.lick})`, r.greens > 0 && r.tipped > 0 && r.left < r.greens && r.lump === 1 && r.lick > 0, r);
  ok(`a mound dug up: a chest, +${r.wool} 🧶`, r.chest && r.wool >= 8, r);
  ok(`her bucket filled at the spring (${r.filled}) and tipped into her water trough (${r.water})`, r.bucket && r.filled > 0 && r.water > 0, r);
  ok(`all aboard, lines in: away on leg ${r.leg}, the island's things left behind, nobody lost (${r.aboard})`, r.cast && r.gone && r.leg === 2 && r.away && r.aboard === r.n, r);
}

if (want('ring')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, RINGS, BOAT, seaOverRail, boatU, boatV, boatXZ, onDeck, ringTarget } = GAME, out = {}, d = G.dogs[0], p = d.player, R = RINGS[1];
    // under way, a sheep over the starboard rail: left astern
    H.sea(1.57, 6); T.sea.orca.from = 2; SEA.u = 3; H.flock(0); const s = G.sheep[0], ru = T.sea.ring.u + 0.4; H.place(s, ru, H.rail(ru, 1.3)); seaOverRail(s, 1, 4, 4, 'test'); const saved0 = G.stats.saved || 0;
    H.run(3, () => H.steer(0)); out.swim = !!(s.air && s.air.kind === 'swim'); out.astern = H.r(Math.hypot(s.x - R.hx, s.z - R.hz), 0); out.racked = RINGS.every(q => q.st === 'rack');
    // the ring off its hook (✊ held); facing her, it's aimed at her (led for the way the sea's taking her)
    H.place(d, boatU(R.sx, R.sz), boatV(R.sx, R.sz)); d.yaw = Math.atan2(BOAT.rx, BOAT.rz); p.bot = { grab: true }; H.run(0.3, () => H.steer(0)); out.held = R.st === 'held' && d.holdKind === 'ring';
    H.run(0.8, () => { H.steer(0); p.bot = { ...H.inp(s.x - d.x, s.z - d.z), grab: true }; p.bot.mx *= 0.2; p.bot.my *= 0.2; });
    const A = ringTarget(d); out.aim = A.s === s; out.lead = H.r(Math.hypot(A.x - s.x, A.z - s.z), 1);
    // let go: thrown; it comes down by her, she takes hold; she tires no more, and tows astern on its line
    p.bot = {}; H.run(0.1, () => H.steer(0)); out.thrown = R.st === 'air' && d.holdKind == null; const lung0 = s.air.lung;
    out.tOn = H.r(H.run(10, () => { H.steer(0); return !!(s.air && s.air.ring === R); }), 1); out.on = !!(s.air && s.air.ring === R) && R.sheep === s && R.st === 'water';
    H.run(6, () => H.steer(0)); out.towed = H.r(Math.hypot(s.x - R.hx, s.z - R.hz), 0); out.lung = s.air && s.air.lung >= lung0 - 0.05; out.alive = !s.dead;
    // the line: ✊ at the post, held: it comes in; Ⓑ heaves. In under the rail: up she comes
    H.place(d, boatU(R.sx, R.sz) - 0.4, boatV(R.sx, R.sz)); d.yaw = Math.atan2(R.hx - d.x, R.hz - d.z); p.bot = { grab: true }; H.run(0.3, () => H.steer(0)); out.line = d.holdKind === 'ringRope' && R.haulBy === d;
    const o0 = R.out; H.run(2, () => { H.steer(0); p.bot = { grab: true }; }); out.hand = H.r(o0 - R.out, 1);
    const o1 = R.out; H.run(2, t => { H.steer(0); p.bot = { grab: true, pounce: Math.round(t / 0.025) % 16 === 0 }; }); out.heaved = H.r(o1 - R.out, 1);
    out.tIn = H.r(H.run(40, t => { H.steer(0); p.bot = { grab: true, pounce: Math.round(t / 0.025) % 16 === 0 }; return R.st === 'rack'; }) + 4, 1); p.bot = {}; H.run(2.5, () => H.steer(0));
    out.back = !s.dead && !s.air && onDeck(s.x, s.z); out.saved = (G.stats.saved || 0) - saved0; out.hook = R.st === 'rack' && !R.sheep && d.holdKind == null;
    // thrown at nothing it just goes out ahead of the dog; hauled back in, it's on its hook again. Dropped on deck: straight back
    H.place(d, boatU(R.sx, R.sz), boatV(R.sx, R.sz)); d.yaw = Math.atan2(BOAT.rx, BOAT.rz); p.bot = { grab: true }; H.run(0.3, () => H.steer(0)); p.bot = {}; H.run(2.5, () => H.steer(0)); out.miss = R.st === 'water' && !R.sheep;
    H.place(d, boatU(R.sx, R.sz) - 0.4, boatV(R.sx, R.sz)); d.yaw = Math.atan2(R.hx - d.x, R.hz - d.z); H.run(30, t => { H.steer(0); p.bot = { grab: true, pounce: Math.round(t / 0.025) % 16 === 0 }; return R.st === 'rack'; }); out.rehung = R.st === 'rack'; p.bot = {};
    return out;
  });
  ok(`a sheep over the rail under way: swimming, ${r.astern} m astern in 3 s; a ring on each rail`, r.swim && r.astern > 8 && r.racked, r);
  ok(`✊ takes the ring; facing her it's aimed at her (led ${r.lead} m for the sea)`, r.held && r.aim && r.lead > 0.5, r);
  ok(`let go: thrown; she has hold of it in ${r.tOn} s, tires no more, tows ${r.towed} m astern on its line`, r.thrown && r.on && r.tOn < 8 && r.lung && r.alive && r.towed <= 39, r);
  ok(`✊ on its line: in it comes (${r.hand} m in 2 s), Ⓑ heaves (${r.heaved} m in 2 s)`, r.line && r.hand > 2 && r.heaved > r.hand + 1.5, r);
  ok(`in under the rail in ${r.tIn} s: up she comes, saved; the ring's back on its hook`, r.back && r.saved === 1 && r.hook && r.tIn < 20, r);
  ok('thrown at nothing: out it goes; hauled in, it hangs on its hook again', r.miss && r.rehung, r);
}

if (want('cam')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, SEAC, BOAT, CAM_F, CAM_R, camera, updateCamera, seaStart, seaCastOff, step } = GAME, out = {}, THREE_V = camera.position.constructor;
    const run = (sec, fn) => { for (let t = 0; t < sec; t += 0.025) { if (fn) fn(t); step(0.025); updateCamera(0.025); } };
    // alongside at Cold Harbour it's the land's camera (from above, the way it always looks); cast off, it glides astern of her
    seaStart(); T.sea.wind.gustRate = 0; T.sea.orca.from = 2; run(1); out.k0 = SEAC.k; out.f0 = H.r(CAM_F.x * BOAT.fx + CAM_F.z * BOAT.fz); out.ortho = camera.projectionMatrix.elements[11] === 0;
    seaCastOff(true); run(T.sea.cam.out + 1.5); out.k1 = H.r(SEAC.k); out.persp = camera.projectionMatrix.elements[11] === -1;
    const rel = () => { const dx = camera.position.x - BOAT.x, dz = camera.position.z - BOAT.z; return { back: H.r(-(dx * BOAT.fx + dz * BOAT.fz), 0), side: H.r(dx * BOAT.rx + dz * BOAT.rz, 0), up: H.r(camera.position.y - BOAT.y, 0) }; };
    out.rel = rel(); out.fwd = H.r(CAM_F.x * BOAT.fx + CAM_F.z * BOAT.fz); const e = camera.matrixWorld.elements; out.pitch = H.deg(Math.asin(-(-e[9])));   // (its look: down by this much)
    // she heels hard: the horizon stays level (the camera's on the sea, not on her)
    SEA.lockWx = true; let roll = 0; run(6, () => { SEA.heel = 0.5; SEA.heelV = 0; const m = camera.matrixWorld.elements, rx = new THREE_V(m[0], m[1], m[2]).transformDirection(GAME.seaG.matrix.clone().invert()); roll = Math.max(roll, Math.abs(rx.y)); }); out.roll = H.r(roll, 3);
    // a hard turn: she swings on the screen first, then it comes round after her
    SEA.heel = 0; const h0 = SEA.hdg; SEA.hdg = H.wrap(h0 + 0.7); SEA.r = 0; run(0.2); out.lag = H.r(Math.abs(H.wrap(SEA.hdg - SEAC.yaw))); run(5, () => { SEA.r = 0; SEA.hdg = H.wrap(h0 + 0.7); }); out.settled = H.r(Math.abs(H.wrap(SEA.hdg - SEAC.yaw)), 3); out.fwd2 = H.r(CAM_F.x * BOAT.fx + CAM_F.z * BOAT.fz);
    return out;
  });
  ok(`alongside: the land's camera (k ${r.k0}); cast off: a perspective one ${r.rel.back} m astern, ${r.rel.up} m up, looking ${r.pitch}° down over her bow`, r.k0 === 0 && r.ortho && r.k1 > 0.97 && r.persp && r.rel.back > 20 && r.rel.up > 12 && r.rel.up < 40 && Math.abs(r.rel.side) < 8 && r.fwd > 0.95 && r.pitch > 10 && r.pitch < 40, r);
  ok(`she heels 29°: the horizon stays level (camera roll ${r.roll})`, r.roll < 0.02, r);
  ok(`a hard turn: the camera's ${r.lag} rad behind at first, then astern of her again (${r.settled})`, r.lag > 0.45 && r.settled < 0.08 && r.fwd2 > 0.95, r);
}

if (want('orca')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, HAZ, orcasCome, boatXZ, boatHB, boatU, boatV, onDeck } = GAME, out = {}, d = G.dogs[0], p = d.player;
    const go = bark => {
      H.sea(1.57, 7, { flat: true }); H.flockRail(1.4); H.place(d, 0, 0); p.bot = {}; SEA.leg = 1;
      orcasCome(1); HAZ.orcaT = 1; let hit = false, heel = 0, charged = false, t0 = 0;
      H.run(30, t => { H.steer(0); const o = HAZ.orcas[0]; if (!charged || o && o.st === 'charge') H.flockRail(1.4); if (o && o.st === 'charge') { if (!charged) { charged = true; t0 = t; } if (bark) p.bot = { bark: Math.round(t * 40) % 16 === 0 }; } heel = Math.max(heel, Math.abs(SEA.heelV)); return charged && o && o.st !== 'charge' && t > t0 + 0.5 && (H.run(2.5), true); });
      return { charged, side: HAZ.orcas[0] && HAZ.orcas[0].side, over: H.swimmers().length, heel: H.r(heel), scared: HAZ.orcaScared, left: HAZ.orcaLeft };
    };
    out.hit = go(false); out.barked = go(true);
    // barked off often enough, they go
    H.sea(1.57, 7, { flat: true }); H.flock(0, -3, 3); H.place(d, 0, 0); orcasCome(1); HAZ.orcaScared = 9; HAZ.orcaT = 0.2; H.run(3, () => H.steer(0)); out.gone = !HAZ.orcaOn && HAZ.orcaDone;
    return out;
  });
  ok(`an orca charges the side the flock's on (${r.hit.side > 0 ? 'starboard' : 'port'}) and bonks the hull (roll ${r.hit.heel} rad/s)`, r.hit.charged && r.hit.side === 1 && r.hit.heel > 0.5, r);
  ok(`sheep by that rail go over (${r.hit.over})`, r.hit.over >= 2, r);
  ok(`a bark as it comes turns it: no bonk, nobody over (${r.barked.over})`, r.barked.charged && r.barked.over === 0 && r.barked.scared >= 1 && r.barked.heel < 0.5, r);
  ok('scared off enough, the pod goes', r.gone, r);
}

if (want('reef')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, REEFS, ROUTE } = GAME, out = {}, rf = REEFS[0];
    H.sea(1.57, 8, { leg: 1 }); SEA.e = rf.e; SEA.n = rf.n - rf.r - 60; SEA.hdg = 0; SEA.u = 5; SEA.leg = 2; H.flock(0);
    const t = H.run(25, () => { H.steer(0); return SEA.hull < 5; }); out.t = H.r(t); out.hull = SEA.hull; out.u = H.r(SEA.u); H.run(1.5); out.off = H.r(Math.hypot(SEA.e - rf.e, SEA.n - rf.n) - rf.r);
    out.stress = H.r(Math.max(...G.sheep.map(s => s.stress)));
    // a sandy island: aground, but no harm
    const w = ROUTE[1]; H.sea(1.57, 8, { leg: 0 }); SEA.e = w.ie; SEA.n = w.in - w.r - 40; SEA.hdg = 0; SEA.u = 4; H.run(20, () => { H.steer(0); return SEA.u < 0; }); out.beach = SEA.hull; out.bu = H.r(SEA.u);
    return out;
  });
  ok(`onto a reef: CRUNCH, a ♥ off the hull (${r.hull}), thrown back (${r.u} m/s)`, r.hull === 4 && r.u < 1, r);
  ok('a sandy shore stops her and does no harm', r.beach === 5 && r.bu < 0.5, r);
}

if (want('shark')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, HAZ, seaOverRail } = GAME, out = {}, d = G.dogs[0], p = d.player;
    const go = (leg, bark) => {
      H.sea(1.57, 6, { u: 0, flat: true }); SEA.hoist = 0; SEA.u = 0; SEA.leg = leg; H.flock(0); H.place(d, -2, H.rail(-2, 1)); p.bot = {};
      const s = G.sheep[0]; H.place(s, -2, H.rail(-2, 1.5)); seaOverRail(s, 1, 3.5, 5, 'test'); let came = false;
      H.run(26, t => { if (HAZ.sharks.length) came = true; if (bark && came) p.bot = { bark: Math.round(t * 40) % 20 === 0 }; });
      return { came, dead: s.dead, why: G.lost.map(l => l.why).join(), off: HAZ.sharks.some(k => k.st === 'off') };
    };
    out.leg1 = go(1, false); out.leg2 = go(2, false); out.bark = go(2, true);
    return out;
  });
  ok('on the first leg no shark comes', !r.leg1.came && !r.leg1.dead, r);
  ok('from the Gull Rock leg one comes for a sheep in the water, and takes it', r.leg2.came && r.leg2.dead && r.leg2.why.includes('shark'), r);
  ok('barked at, it sheers off: the sheep lives', r.bark.came && !r.bark.dead, r);
}

if (want('storm')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, WIND, ROUTE, seaRogue, HAZ } = GAME, out = {}, a = ROUTE[2], b = ROUTE[3];
    // a third of the way along the Storm Key leg, the weather left to itself
    GAME.seaStart({ under: true, leg: 2 }); SEA.e = a.e + (b.e - a.e) * 0.3; SEA.n = a.n + (b.n - a.n) * 0.3; SEA.hdg = b.crs; SEA.hoist = 0.55; H.flock(0);
    let flash = 0; H.run(45, () => { H.steer(b.crs); if (SEA.flash > 0.9) flash++; }); out.storm = H.r(SEA.storm); out.wind = H.r(WIND.spd); out.state = H.r(SEA.state); out.rain = H.r(SEA.rain); out.flash = flash;
    out.stress = H.r(G.sheep.reduce((m, s) => m + s.stress, 0) / G.sheep.length);
    // a great wave: abeam it sweeps the deck; on the bow it doesn't (the flock toward the port rail: the lee one, for a sea from starboard)
    const wave = from => { H.sea(1.57, 8); SEA.hoist = 0.55; H.flockRail(3.3, -6, 6, -1); seaRogue(SEA.hdg + from, 3.4, 60); const g = SEA.rogue; let heel = 0, at = -1, pre = [], post = 0;
      H.run(12, t => { H.steer(0); const h = Math.abs(SEA.heel); heel = Math.max(heel, h); if (at < 0 && g.hit) at = t; if (at < 0) pre.push(h); else if (t - at < 2) post = Math.max(post, h); });
      // kick: what the wave itself does, the most she heels in the 2 s after it hits over the 2 s before (a storm swell rolls her anyway)
      return { over: H.swimmers().length, heel: H.deg(heel), kick: H.deg(post - Math.max(0, ...pre.slice(-80))), hit: !SEA.rogue || SEA.rogue.hit }; };
    out.beam = wave(Math.PI / 2); for (let k = 0; k < 2 && !(out.beam.over && out.beam.kick > 6); k++) out.beam = wave(Math.PI / 2);   // (chance: who's swept off, and where in the swell's roll it lands: up to three waves)
    out.bow = wave(0.1);
    return out;
  });
  ok(`the storm: a gale (${r.wind} m/s), a big sea (state ${r.state}), rain, lightning (${r.flash})`, r.storm > 0.9 && r.wind > 16 && r.state > 0.6 && r.rain > 0.8 && r.flash >= 2, r);
  ok(`the flock's frightened (stress ${r.stress})`, r.stress > 0.3, r);
  ok(`a great wave abeam knocks her down (${r.beam.heel}°, +${r.beam.kick}° on her; bow ${r.bow.kick}°) and sweeps sheep off (${r.beam.over})`, r.beam.over >= 1 && r.beam.heel > 18 && r.beam.kick > 6 && r.beam.kick > r.bow.kick + 6, r);
  ok(`taken on the bow, nobody's lost (${r.bow.over}; ${r.bow.heel}°)`, r.bow.over === 0 && r.bow.hit, r);
}

if (want('spout')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, HAZ, ROUTE } = GAME, out = {}, a = ROUTE[2], b = ROUTE[3];
    GAME.seaStart({ under: true, leg: 2 }); SEA.e = lerp2(a.e, b.e, 0.5); SEA.n = lerp2(a.n, b.n, 0.5); SEA.hdg = b.crs; SEA.hoist = 0.55; SEA.storm = 1; H.flock(0);
    function lerp2(x, y, k) { return x + (y - x) * k; }
    H.run(6, () => H.steer(b.crs)); out.spout = !!HAZ.spout; const W = HAZ.spout; let air = 0, yaw = 0;
    if (W) { W.e = SEA.e; W.n = SEA.n; W.cd = 0; } H.run(1.5, () => { air = Math.max(air, G.sheep.filter(s => s.air && s.air.how === 'spout').length); yaw = Math.max(yaw, Math.abs(SEA.r)); });
    out.air = air; out.yaw = H.r(yaw); out.sheet = H.r(SEA.sheet);
    return out;
  });
  ok('a waterspout stalks the storm', r.spout, r);
  ok(`in it: she's spun (${r.yaw} rad/s) and ${r.air} sheep fly`, r.air >= 3 && r.yaw > 0.5, r);
}

if (want('siren')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, HAZ, SIREN_ROCKS, ROUTE, boatV, boatHB, boatU } = GAME, out = {}, d = G.dogs[0], p = d.player, rk = SIREN_ROCKS[0];
    const near = () => { H.sea(1.57, 5, { u: 0, flat: true, leg: 3 }); SEA.hoist = 0; SEA.u = 0; SEA.leg = 4; SEA.hdg = 0; SEA.e = rk.e - 40; SEA.n = rk.n; H.flock(0, -6, 6); H.place(d, 12, 0); p.bot = {}; };   // the rock 40 m off her starboard beam
    // barking breaks the song's hold: nobody goes over. (The barks drive the flock aft; the dog goes after the lured ones, as you would:
    // from amidships the stern's out of a bark's reach)
    near(); H.place(d, 0, 0); let o2 = 0, freed = 0; H.run(30, t => {
      const l = G.sheep.filter(s => s.lure && !s.dead).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z))[0];
      p.bot = { bark: Math.round(t * 40) % 24 === 0, ...(l && Math.hypot(l.x - d.x, l.z - d.z) > 7 ? H.inp(l.x - d.x, l.z - d.z) : {}) }; o2 = Math.max(o2, H.swimmers().length); if (H.swimmers().length && !out.how) out.how = H.swimmers().map(s => [s.air.how, s.ram, s.lamb, H.r(boatU(s.x, s.z)), H.r(s.air.t)]); freed += G.sheep.filter(s => (s.lureCd || 0) > G.time).length ? 1 : 0; }); out.barkOver = o2; out.freed = freed > 0;
    // a dog standing in the way at that rail stops them there
    const walk = dog => { near(); const s = G.sheep.find(q => !q.ram && !q.lamb); H.flock(-3, 6, 10); H.place(s, 0, 2); if (dog) H.place(d, 0, 4.2); p.bot = {}; let far = 0; H.run(1.6, () => { s.lure = 1; far = Math.max(far, boatV(s.x, s.z)); }); return H.r(far); };
    out.free = walk(false); out.far = walk(true); out.blocked = out.far < 2.5 && out.free > out.far + 0.8;
    // left to it: they walk to the rail on the singing side and jump; in the water they swim for the rock and are lost
    near(); let lured = 0, over = 0; H.run(30, () => { lured = Math.max(lured, G.sheep.filter(s => s.lure).length); over = Math.max(over, H.swimmers().length); });
    out.lured = lured; out.over = over; out.side = H.swimmers().every(s => boatV(s.x, s.z) > 0);
    T.sea.over.float = 300; H.run(60); out.taken = G.lost.filter(l => l.why === 'siren').length;
    return out;
  });
  ok(`near their rock the song takes hold of sheep (${r.lured}); they go over the rail on that side (${r.over})`, r.lured >= 3 && r.over >= 2 && r.side, r);
  ok(`left in the water they swim to the singing and are lost (${r.taken})`, r.taken >= 1, r);
  ok(`barking breaks its hold: hardly any go over (${r.barkOver}, not ${r.over})`, r.freed && r.barkOver <= 1 && r.barkOver < r.over - 3, r);
  ok(`a dog in its way stops one (it got to ${r.far} m off the centreline, not ${r.free})`, r.blocked, r);
}

if (want('kraken')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, WIND, KRAKEN, ROUTE, HAZ, krakenEyeAt, boatXZ, boatHB, boatU, boatV, onDeck } = GAME, out = {}, d = G.dogs[0], p = d.player, a = ROUTE[4], b = ROUTE[5], Kk = T.sea.kraken;
    T.sea.kraken.snatch = [999, 999];
    GAME.seaStart({ under: true, leg: 4 }); T.sea.wind.gustRate = 0; SEA.e = a.e + (b.e - a.e) * (Kk.at - 0.03); SEA.n = a.n + (b.n - a.n) * (Kk.at - 0.03); SEA.hdg = b.crs; SEA.u = 3; H.flock(0); H.place(d, 0, 0); p.bot = {};
    H.run(30, () => KRAKEN.on); out.calm = H.r(SEA.calm); out.wind = H.r(WIND.spd); out.on = KRAKEN.on; out.hp = KRAKEN.hp; out.ink = H.r(SEA.ink);
    H.run(1.5); const sd = KRAKEN.side; out.arms = KRAKEN.arms.filter(q => q.kind === 'grip').length;
    // its arms haul that rail down: worse with the flock on the low side than on the high side
    const heel = v => { KRAKEN.phase = 'grip'; KRAKEN.t = 8; SEA.heel = 0; SEA.heelV = 0; let n = 0, s = 0; H.run(14, t => { H.flock(v); KRAKEN.t = Math.min(KRAKEN.t, 20); if (t > 8) { n++; s += SEA.heel * sd; } }); return H.deg(s / n); };
    out.low = heel(sd * 5.4); out.high = heel(-sd * 5.4); out.barks = (() => { const n0 = KRAKEN.arms.length; p.bot = { bark: true }; H.run(0.1); p.bot = {}; H.run(0.5); return KRAKEN.arms.length === n0; })();
    // pounce each arm off the rail; then its eye comes up
    H.flock(-sd * 3, -12, -6); let bonks = 0; for (const s of G.sheep) s.krakCd = 1e9;   // (no ram butting one: the dog's pounces)
    out.left0 = KRAKEN.arms.filter(q => q.kind === 'grip' && q.st !== 'hurt').length;   // (a ram may have butted one off already)
    for (let k = 0; k < 8 && KRAKEN.phase === 'grip'; k++) {
      const arm = KRAKEN.arms.find(q => q.kind === 'grip' && q.st === 'grip'); if (!arm) { H.run(0.5); continue; }
      const q = boatXZ(arm.u, sd * (boatHB(arm.u) - 3.4)); d.x = q.x; d.z = q.z; d.vx = d.vz = 0; d.air = null; d.stunT = 0; d.pounceT = 0; d.pounceCD = 0; p.bot = {}; H.run(0.8);
      const on = () => KRAKEN.arms.filter(q => q.kind === 'grip' && q.st !== 'hurt').length, n0 = on();   // (the pounce may hit the arm beside it)
      p.bot = H.stick(0, sd, { pounce: true }); H.run(0.05); p.bot = H.stick(0, sd); H.run(0.6); p.bot = {}; bonks += n0 - on();
    }
    out.bonks = bonks; H.run(1.2); out.eye = KRAKEN.phase; out.righted = H.deg(Math.abs(SEA.heel));
    // a sheep punted over the rail into its eye: a hit; it bounces back aboard
    const hp0 = KRAKEN.hp, e = krakenEyeAt(), s = G.sheep.find(q => !q.ram && !q.lamb);
    H.place(s, -1, sd * (boatHB(-1) - 2.2)); H.place(d, -1, sd * (boatHB(-1) - 5)); d.pounceCD = 0; p.bot = {}; H.run(0.3);
    p.bot = H.stick(0, sd, { pounce: true }); H.run(0.05); p.bot = {}; H.run(2.5);
    out.hit = hp0 - KRAKEN.hp; out.back = !s.air && onDeck(s.x, s.z) && !s.dead; out.phase = KRAKEN.phase; out.side2 = KRAKEN.side === -sd || KRAKEN.phase === 'sink';
    // and the rest of it
    const wool0 = G.wool || 0; GAME.krakenHurt(d); GAME.krakenHurt(d); H.run(6); out.beaten = KRAKEN.beaten && !KRAKEN.on; out.bounty = (G.wool || 0) - wool0; out.hold = SEA.hold; H.run(25); out.windBack = H.r(WIND.spd); out.inkGone = H.r(SEA.ink);
    return out;
  });
  ok(`the wind dies (${r.wind} m/s), ink wells up, the kraken has her: ${r.arms} arms on a rail, ${r.hp} ♥`, r.on && r.calm > 0.7 && r.wind < 3 && r.arms >= 3 && r.hp === 3, r);
  ok(`it hauls that rail down: ${r.low}° with the flock on the low side, ${r.high}° with them herded to the high side`, r.low > 30 && r.high < r.low - 8, r);
  ok('barks do nothing to it', r.barks, r);
  ok(`a pounce bonks each arm off the rail (${r.bonks}/${r.left0}); she rights; its eye comes up`, r.left0 > 0 && r.bonks >= r.left0 && r.eye === 'eye', r);
  ok('a sheep bonked into its eye: a ♥ off, and the sheep bounces back aboard', r.hit === 1 && r.back, r);
  ok(`beaten: +${r.bounty} 🧶, she's free, the wind fills in again (${r.windBack} m/s)`, r.beaten && r.bounty === 30 && r.hold === null && r.windBack > 5 && r.inkGone < 0.1, r);
}

if (want('arrive')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, ROUTE, KRAKEN, seaOverRail } = GAME, out = {}, w = ROUTE[5];
    H.sea(1.57, 7, { leg: 4 }); KRAKEN.beaten = true; SEA.leg = 5; SEA.hdg = w.crs; SEA.e = w.e - Math.sin(w.crs) * 150; SEA.n = w.n - Math.cos(w.crs) * 150; SEA.lockWx = true; H.flock(0);
    const n0 = G.sheep.filter(s => !s.dead).length; H.place(G.sheep[0], -8, 3.2); seaOverRail(G.sheep[0], 1, 4, 5, 'test');
    const t = H.run(90, () => { H.steer(w.crs); if (Math.hypot(SEA.e - w.e, SEA.n - w.n) < 50) SEA.hoist = 0; return G.mode === 'end'; });
    out.t = H.r(t); out.mode = G.mode; out.line = document.getElementById('eLine').textContent; out.n0 = n0; out.title = document.getElementById('eTitle').textContent;
    return out;
  });
  ok(`into the Promised Land: the journey ends with the sheep still aboard (${r.line}; one was in the water)`, r.mode === 'end' && r.line.includes(String(r.n0 - 1)), r);
}

if (want('wind')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { T, SEA, WIND, SWAVES, seaStart } = GAME, out = {};
    // out on the open sea, the weather left to itself: the wind goes round in shifts that hold; gusts veer, lulls back
    seaStart({ under: true, leg: 0 }); T.sea.orca.from = 2; SEA.e = 0; SEA.n = -4000; SEA.hdg = 0; SEA.hoist = 0;
    const rel = [], tos = new Set(), seen = new Set(), up = [], down = []; let held = 0, n = 0;
    H.run(420, () => {
      H.steer(0); rel.push(H.wrap(WIND.dir - WIND.base)); tos.add(WIND.shiftTo.toFixed(4)); n++; if (Math.abs(WIND.shift - WIND.shiftTo) < 0.05) held++;
      for (const g of WIND.gusts) if (!seen.has(g)) { seen.add(g); (g.k > 0 ? up : down).push(g.veer); }
    });
    const avg = a => a.reduce((m, v) => m + v, 0) / Math.max(1, a.length);
    Object.assign(out, { lo: H.deg(Math.min(...rel)), hi: H.deg(Math.max(...rel)), shifts: tos.size - 1, held: H.r(held / n), gust: H.deg(avg(up)), lull: H.deg(avg(down)), gusts: up.length, lulls: down.length,
      veers: up.every(v => v > 0) && down.every(v => v < 0) });
    // a big shift (60°): the wind sea comes round with it; the swell, from the weather that raised it, lags (a cross sea), then follows
    T.sea.wind.shiftGap = [1e4, 1e4]; WIND.shiftT = 1e4; T.sea.wind.veer = [0, 0];
    const a0 = SWAVES[0].ang, c0 = SWAVES[2].ang; WIND.shiftTo = WIND.shift + 1.05;
    H.run(45, () => H.steer(0)); out.chop = H.deg(Math.abs(H.wrap(SWAVES[2].ang - c0))); out.swell = H.deg(Math.abs(H.wrap(SWAVES[0].ang - a0)));
    H.run(400, () => H.steer(0)); out.swellLate = H.deg(Math.abs(H.wrap(SWAVES[0].ang - a0)));
    return out;
  });
  ok(`left to itself the wind goes round: ${r.shifts} shifts that hold (settled ${Math.round(r.held * 100)}% of the time), ${r.lo}°…${r.hi}° off the leg's own`, r.shifts >= 5 && r.held > 0.5 && r.hi - r.lo > 30 && r.lo < -8 && r.hi > 8 && r.hi - r.lo < 110, r);
  ok(`gusts veer (${r.gust}°, ${r.gusts} of them), lulls back (${r.lull}°, ${r.lulls})`, r.gusts > 3 && r.lulls > 0 && r.veers, r);
  ok(`60° round: the wind sea comes with it (${r.chop}° in 45 s), the swell lags (${r.swell}°): a cross sea; later it follows (${r.swellLate}°)`, r.chop > 30 && r.swell < r.chop / 2 && r.swellLate > 45, r);
}

if (want('front')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { T, SEA, WIND, ROUTE, seaStart, windFront } = GAME, out = {};
    // a front, the new wind 70° round (no other shifts, no gusts: just it). Its line comes down on her from the new wind's quarter; just ahead
    // of it the wind falls light; it reaches her with a squall and a burst of rain, the wind goes round; the new wind holds
    seaStart({ under: true, leg: 0 }); T.sea.orca.from = 2; T.sea.wind.gustRate = 0; T.sea.wind.veer = [0, 0]; T.sea.wind.shiftGap = [1e4, 1e4]; WIND.shiftT = 1e4;
    SEA.e = 0; SEA.n = -4000; SEA.hdg = 0; H.run(5, () => H.steer(0));
    const d0 = WIND.dir, F = windFront(70 / 57.2958, 260);
    out.from = H.deg(Math.abs(H.wrap(Math.atan2(-F.de, -F.dn) - d0 - 70 / 57.2958)));
    let lull = 0, warned = -1, hitT = -1, k = 0, rain = 0;
    out.t = H.r(H.run(90, t => {
      H.steer(0); const x = F.de * SEA.e + F.dn * SEA.n - F.pos;
      if (x > 0 && x < 12) lull = Math.min(lull, WIND.here.k); if (F.warned && warned < 0) warned = x;
      if (F.hit && hitT < 0) hitT = t; if (hitT >= 0) { k = Math.max(k, WIND.here.k); rain = Math.max(rain, SEA.rain); }
      return hitT >= 0 && t - hitT > 12;
    }), 0);
    Object.assign(out, { lull: H.r(lull), warned: Math.round(warned), k: H.r(k), rain: H.r(rain), turned: H.deg(H.wrap(WIND.dir - d0)) });
    H.run(40, () => H.steer(0)); out.held = H.deg(H.wrap(WIND.dir - d0)); out.gone = WIND.front === null;
    // a leg's own: the Storm Key leg's reaches her at the storm's height, and veers the wind
    seaStart({ under: true, leg: 2 }); T.sea.wind.shiftGap = [1e4, 1e4]; WIND.shiftT = 1e4;
    const a = ROUTE[2], b = ROUTE[3]; SEA.e = a.e + (b.e - a.e) * 0.3; SEA.n = a.n + (b.n - a.n) * 0.3; SEA.hdg = b.crs; SEA.hoist = 0.55;
    let d1 = 0; H.run(120, () => { H.steer(b.crs); d1 = WIND.dir; return !!WIND.front && WIND.front.hit; });
    out.storm = { at: H.r(SEA.legK), storm: H.r(SEA.storm) }; H.run(12, () => H.steer(b.crs)); out.storm.veer = H.deg(H.wrap(WIND.dir - d1));
    return out;
  });
  ok(`a front: its line comes from the new wind's quarter (${r.from}° off it), Hank calls it ${r.warned} m off; just ahead of it the wind falls light (${r.lull})`, r.from < 2 && r.warned > 60 && r.lull < -0.25, r);
  ok(`it reaches her (${r.t} s): a squall (+${r.k}), rain (${r.rain}); the wind ${r.turned}° round 12 s on`, r.k > 0.5 && r.rain > 0.2 && r.turned > 55 && r.turned < 85, r);
  ok(`the new wind holds (${r.held}° round 40 s later), the line's gone by`, Math.abs(r.held - 70) < 10 && r.gone, r);
  ok(`the Storm Key leg's front reaches her at the storm's height (${r.storm.at} along, storm ${r.storm.storm}) and veers the wind ${r.storm.veer}°`, r.storm.at > 0.45 && r.storm.at < 0.68 && r.storm.veer > 50 && r.storm.storm > 0.8, r);
}

if (want('skip')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, WIND, ROUTE, DOCKS, KRAKEN, STATIONS, seaStart, seaCastOff, seaLegStep } = GAME, out = {};
    // no island's a stop she must make. Straight from Cold Harbour for the Promised Land: the legs come by as she goes (their weather, their
    // trouble), never one back; she's stopped nowhere
    seaStart({ under: true, leg: 0 }); T.sea.orca.from = 2; KRAKEN.beaten = true; SEA.lockWx = true;
    const A = { e: SEA.e, n: SEA.n }, B = ROUTE[ROUTE.length - 1], legs = [SEA.leg];
    for (let i = 1; i <= 200; i++) { const k = i / 200 * 0.97; SEA.e = A.e + (B.e - A.e) * k; SEA.n = A.n + (B.n - A.n) * k; seaLegStep(); if (SEA.leg !== legs[legs.length - 1]) legs.push(SEA.leg); }
    out.legs = legs.join(); out.up = legs.every((l, i) => !i || l > legs[i - 1]); out.saved = SEA.saved;
    // ...and in by its jetty, slowly: alongside, and that's the journey
    const D = DOCKS[ROUTE.length - 1]; SEA.e = D.e - Math.sin(D.hdg) * 14; SEA.n = D.n - Math.cos(D.hdg) * 14; SEA.hdg = D.hdg; SEA.u = 1; SEA.v = 0; SEA.hoist = 0;
    H.run(20, () => G.mode !== 'play'); out.end = G.mode;
    // alongside an island out of turn: from Seal Skerry, Gull Rock passed by, in by Storm Key's jetty: saved there, on for Siren's Rest
    G.mode = 'play'; seaStart({ leg: 1 }); SEA.lockWx = true; out.cast = seaCastOff(true); out.leg0 = SEA.leg;
    const D3 = DOCKS[3]; SEA.e = D3.e - Math.sin(D3.hdg) * 14; SEA.n = D3.n - Math.cos(D3.hdg) * 14; SEA.hdg = D3.hdg; SEA.u = 1; SEA.v = 0; SEA.hoist = 0;
    H.run(20, () => SEA.docked); Object.assign(out, { docked: SEA.docked, berth: SEA.berth, saved2: SEA.saved, leg: SEA.leg });
    // Hank on the helm out of harbour, the way dead to windward: he sails her full and by, not into irons
    H.sea(0, 8); STATIONS[0].by = null; SEA.pilot = SEA.hdg; SEA.u = 2; H.run(30); out.pilot = { u: H.r(SEA.u), twa: H.deg(Math.abs(SEA.twa)) };
    return out;
  });
  ok(`straight from Cold Harbour for the Promised Land: legs ${r.legs} come by in turn, never one back; no stop made (${r.saved})`, r.up && r.legs.startsWith('1,') && r.legs.endsWith(',3,4,5') && r.saved === 0, r);
  ok(`in by the Promised Land's jetty: the journey's done (${r.end})`, r.end === 'end', r);
  ok(`from Seal Skerry (on for leg ${r.leg0}) in by Storm Key's jetty: alongside (${r.berth}), saved there (${r.saved2}), on for leg ${r.leg}`, r.cast && r.leg0 === 2 && r.docked && r.berth === 3 && r.saved2 === 3 && r.leg === 4, r);
  ok(`Hank on the helm, the way dead to windward: close-hauled (${r.pilot.twa}° off the wind), sailing (${r.pilot.u} m/s), not in irons`, r.pilot.twa > 35 && r.pilot.twa < 60 && r.pilot.u > 1.5, r);
}

if (want('start')) {
  await setup({ calm: true });
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, WIND, ROUTE, STATIONS, LAND, scene, seaStart, stationOf, boatU, boatV, onDeck, DECK, inSea } = GAME, out = {}, d = G.dogs[0], p = d.player, [til, sht, hal, anc] = STATIONS, w = ROUTE[1];
    // (dev: ?sea) alongside at Cold Harbour, everyone aboard, the gangway lashed. One dog: lines in at the bow, run aft, take the tiller, steer for the next island
    seaStart(); T.sea.wind.gustRate = 0; T.sea.orca.from = 2;   // (no orcas this time)
    out.docked = SEA.docked && SEA.berth === 0 && DECK.lock; out.aboard = H.aboard(); out.dogs = G.dogs.every(q => onDeck(q.x, q.z)); out.food = H.r(DECK.troughs.reduce((a, t) => a + t.food, 0)); out.water = H.r(DECK.water.w);
    H.run(4); out.lying = H.r(Math.hypot(SEA.u, SEA.v)); out.sheet0 = H.r(SEA.sheet); out.land0 = LAND.parent === scene;
    const goTo = st => H.run(12, () => { p.bot = H.inp(st.sx - d.x, st.sz - d.z); return Math.hypot(st.sx - d.x, st.sz - d.z) < 0.5; });
    goTo(anc); p.bot = {}; H.run(0.2); H.hold(p); out.onAnchor = stationOf(d) === anc; p.bot = H.stick(1, 0, H.g()); H.run(3.2); out.cast = !SEA.docked && SEA.pilot != null; out.landOff = LAND.parent !== scene && inSea(0, 0); p.bot = {}; H.run(0.5);
    goTo(til); p.bot = {}; H.run(0.2); H.hold(p); out.onTiller = stationOf(d) === til && SEA.pilot === null;
    const d0 = Math.hypot(SEA.e - w.e, SEA.n - w.n);
    H.run(60, t => { const off = H.wrap(Math.atan2(w.e - SEA.e, w.n - SEA.n) - SEA.hdg); p.bot = Math.abs(off) > 0.08 ? H.stick(0, Math.max(-1, Math.min(1, off * 2.5)), H.g()) : H.g(); });
    out.made = H.r(d0 - Math.hypot(SEA.e - w.e, SEA.n - w.n)); out.u = H.r(GAME.seaSpd()); out.trim = H.r(SEA.trim); out.heel = H.deg(SEA.heel); out.aboard2 = H.aboard(); out.hull = SEA.hull;
    return out;
  });
  ok(`she lies alongside at Cold Harbour, everyone aboard (${r.aboard} sheep), the gangway lashed, the troughs stocked (🌾 ${r.food}, 💧 ${r.water}), the sheet let fly`, r.docked && r.aboard >= 12 && r.dogs && r.food > 10 && r.water > 5 && r.lying < 0.01 && r.sheet0 > 0.9 && r.land0, r);
  ok('one dog hauls her lines in at the bow (the land\'s left behind: all the world is sea), runs aft and takes the tiller from Hank', r.onAnchor && r.cast && r.landOff && r.onTiller, r);
  ok(`Hank sheets in and she's away: ${r.made} m made good toward the island in 60 s (${r.u} m/s over the sea), hull whole, nobody lost`, r.made > 380 && r.u > 6 && r.aboard2 === r.aboard && r.hull === 5, r);
}

if (want('gang')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, BOAT, DECK, seaStart, boatXZ, onDeck } = GAME, out = { moved: [], stuck: [] }, d = G.dogs[0], p = d.player;
    seaStart({ dock: true, place: true });
    const at = (u, v, to, x = {}) => { const q = boatXZ(u, v), g = boatXZ(...to); H.place(d, u, v); d.yaw = Math.atan2(g.x - q.x, g.z - q.z); d.holding = null; return () => H.inp(g.x - d.x, g.z - d.z, x); };
    // a sprint across it, a pounce at it, a grab by it, a pounce along the pier: it stays open
    for (const [name, u, v, to, x, t] of [['sprint', 1.5, -16, [-4, -8], { sprint: true }, 2], ['pounce', -2.2, -11, [-4, -11], { pounce: true }, 0.2], ['grab', -2.6, -10, [2, -14], { grab: true }, 1.6], ['pier', -2.6, -14, [-2.6, -4], { pounce: true }, 0.2]]) {
      const go = at(u, v, to, x); H.run(t, () => { p.bot = go(); }); p.bot = {}; H.run(1.5);
      if (DECK.gateT < 0.99) out.moved.push([name, H.r(DECK.gateT)]);
    }
    // aboard from anywhere on the pier and the quay
    for (const [u, v] of [[-3.2, -9], [1.2, -9], [-1, -8.2], [-3.2, -16], [1.3, -16], [6, -10], [12, -9], [-1, -30]]) {
      const go = at(u, v, [-1, 0]), t = H.run(8, () => { p.bot = go(); return onDeck(d.x, d.z, 0.8); }); p.bot = {};
      if (t >= 8) out.stuck.push([u, v]);
    }
    out.open = !DECK.lock && DECK.gateT > 0.99;
    return out;
  });
  ok('alongside the gangway stays wide open: no sprint, pounce or grab swings it into the way; a dog walks aboard from anywhere on the pier and quay', !r.moved.length && !r.stuck.length && r.open, r);
}

if (want('dock')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, BOAT, DOCK, QUAY, DECK, HARB, HANK, ROUTE, STATIONS, LAND, scene, seaStart, seaCastOff, seaAshore, seaLandDepth, stationOf, boatU, boatV, boatXZ, onDeck, onQuay, inSea, sdfAt, harbRoad, launchSheep, living, groundY } = GAME, out = {}, d = G.dogs[0], p = d.player, [til, , , anc] = STATIONS, P = HARB.pts;
    // the top of the harbour road (as through the gap in the summit's east rim): the flock and the dog there, she alongside the quay far below, her gangway open
    seaStart({ dock: true, place: true }); T.sea.wind.gustRate = 0; T.sea.orca.from = 2;
    const n = living().length; out.n = n;
    out.start = SEA.docked && SEA.berth === 0 && QUAY.on && !DECK.lock && DECK.gateT > 0.9 && G.sheep.filter(s => !s.dead && harbRoad(s.x, s.z).d < 0 && !inSea(s.x, s.z)).length === n && H.aboard() === 0 && LAND.parent === scene;
    out.up = H.r(Math.min(...G.sheep.filter(s => !s.dead).map(s => groundY(s.x, s.z))) - BOAT.y, 1); out.far0 = H.r(Math.hypot(d.x - DECK.gx, d.z - DECK.gz), 0);
    H.run(3); out.still = H.r(Math.hypot(SEA.e - DOCK.e, SEA.n - DOCK.n) + Math.abs(SEA.heel) + Math.abs(SEA.pitch) + Math.hypot(SEA.u, SEA.v), 3); out.sheet = H.r(SEA.sheet);
    out.refused = seaCastOff() === false && SEA.docked; out.ashore0 = seaAshore();
    // off the road it's the mountainside: not walkable
    const a = P[2], b = P[3], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, nx = -(b.z - a.z) / Math.hypot(b.x - a.x, b.z - a.z), nz = (b.x - a.x) / Math.hypot(b.x - a.x, b.z - a.z);
    out.off = [sdfAt(mx + nx * 9, mz + nz * 9) < 0, sdfAt(mx - nx * 9, mz - nz * 9) < 0, sdfAt(mx, mz) > 3].join();
    // the dog can't walk off the quay's edge; a sheep bonked into the harbour paddles back and scrambles out
    const d0 = { x: d.x, z: d.z }, q0 = boatXZ(5, QUAY.v0 + 1); d.x = q0.x; d.z = q0.z; p.bot = H.stick(0, -1); H.run(2); out.edge = !d.air && onQuay(d.x, d.z) && boatV(d.x, d.z) < QUAY.v0 + 0.6; p.bot = {};
    const wet = G.sheep.filter(s => !s.dead)[0], w0 = { x: wet.x, z: wet.z }, qe = boatXZ(QUAY.u1 - 3, QUAY.v0 + 1.5); wet.x = qe.x; wet.z = qe.z; wet.vx = wet.vz = 0; launchSheep(wet, -BOAT.rx * 6, -BOAT.rz * 6, 12, 'punt', null);   // (high: a low one bounces back off the edge)
    H.run(2.5); out.swam = !!(wet.air && wet.air.kind === 'swim'); H.run(14); out.out = !wet.dead && !wet.air && (onQuay(wet.x, wet.z) || onDeck(wet.x, wet.z));
    wet.x = w0.x; wet.z = w0.z; wet.pen = null; d.x = d0.x; d.z = d0.z; H.run(0.5);
    // one's still far back down the pass (never brought up to the gap)
    const stray = G.sheep.filter(s => !s.dead)[1], sq = GAME.pathPoint(1230, 0); stray.x = sq.x; stray.z = sq.z; stray.pen = null;
    // herded down the road, along the pier, up the gangway: the dog works whichever's furthest back, from behind it
    const goal = t => { let k = 1; while (k < P.length - 1 && P[k].d < t) k++; const A = P[k - 1], B = P[k], u = Math.min(1, Math.max(0, (t - A.d) / (B.d - A.d))); return { x: A.x + (B.x - A.x) * u, z: A.z + (B.z - A.z) * u }; };
    out.t = H.r(H.run(240, () => {
      const L = G.sheep.filter(s => !s.dead && s !== stray && !onDeck(s.x, s.z, 0.25)); if (!L.length) return true;
      let far = null, fd = -1, g = null;
      for (const s of L) { const sea = inSea(s.x, s.z), rt = harbRoad(s.x, s.z).t, gs = sea ? boatXZ(-1, 0) : goal(rt + 14), q = sea ? Math.hypot(s.x - boatXZ(-1, 0).x, s.z - boatXZ(-1, 0).z) : 1000 - rt; if (q > fd) { fd = q; far = s; g = gs; } }   // (the one furthest back up the road)
      const gl = Math.hypot(far.x - g.x, far.z - g.z) || 1, tx = far.x + (far.x - g.x) / gl * 3.5, tz = far.z + (far.z - g.z) / gl * 3.5, el = Math.hypot(tx - d.x, tz - d.z);
      p.bot = H.inp(tx - d.x, tz - d.z); p.bot.mx *= Math.min(1, el / 3); p.bot.my *= Math.min(1, el / 3);
    }), 0);
    p.bot = {}; out.aboard = H.aboard(); out.ashore = seaAshore(); out.open = !DECK.lock && DECK.gateT > 0.9; out.dead = G.sheep.filter(s => s.dead).length;
    // the dog follows them aboard: Hank swings the gangway shut and lashes it. Hank's come down the road too
    H.run(60, () => { const q = inSea(d.x, d.z) ? boatXZ(-1, boatV(d.x, d.z) > -4 ? 0 : boatV(d.x, d.z) + 4) : goal(harbRoad(d.x, d.z).t + 6); p.bot = H.inp(q.x - d.x, q.z - d.z); return onDeck(d.x, d.z, 0.8); });
    p.bot = {}; H.run(5); out.lashed = DECK.lock && DECK.gateT < 0.05 && SEA.docked && H.aboard() === n - 1;
    H.run(40, () => onDeck(HANK.x, HANK.z)); out.hank = onDeck(HANK.x, HANK.z);
    // to the bow: lines in (stick up), and she's off; the land's left behind (with the one never brought down)
    H.place(d, anc.su, anc.sv); d.yaw = anc.yaw; H.run(0.2); H.hold(p); out.onBow = stationOf(d) === anc; p.bot = H.stick(1, 0, H.g()); H.run(3.2); p.bot = H.g();
    out.cast = !SEA.docked && !QUAY.on && DECK.lock && DECK.gateT < 0.05 && SEA.pilot != null && LAND.parent !== scene; out.left = stray.dead && (G.lost.find(l => l.name === stray.name) || {}).why === 'left'; p.bot = {}; H.run(0.3);
    H.run(30); out.away = H.r(Math.hypot(SEA.e - DOCK.e, SEA.n - DOCK.n), 0); out.u = H.r(GAME.seaSpd()); out.crs = H.deg(H.wrap(SEA.hdg - ROUTE[1].crs)); out.hull = SEA.hull; out.aboard2 = H.aboard(); out.lost = G.lost.length;
    out.clear = H.r(seaLandDepth(SEA.e, SEA.n), 0);
    H.place(d, til.su, til.sv); d.yaw = til.yaw; H.run(0.2); H.hold(p); out.helm = stationOf(d) === til && SEA.pilot === null;
    return out;
  });
  ok(`the top of the harbour road: ${r.n} sheep and the dog ${r.up} m over her deck, ${r.far0} m from the gangway (open); she lies still alongside (${r.still}), sheet let fly`, r.start && r.up > 35 && r.far0 > 100 && r.still < 0.01 && r.sheet > 0.9, r);
  ok('off the road it\'s the mountainside: no way but down it', r.off === 'true,true,true', r);
  ok(`no casting off with ${r.ashore0} sheep ashore`, r.refused && r.ashore0 > 0, r);
  ok('the dog stops at the quay\'s edge; a sheep bonked into the harbour paddles back and scrambles out', r.edge && r.swam && r.out, r);
  ok(`herded down the road, along the pier and up the gangway: all ${r.aboard} aboard in ${r.t} s, none lost on the way; the dog after them, Hank lashes it shut (and he's come down too)`, r.aboard === r.n - 1 && r.ashore === 0 && r.t < 240 && r.open && r.dead === 0 && r.lashed && r.hank, r);
  ok('lines in at the bow: cast off, the gangway shut and lashed, Hank on the helm; the land goes astern, and the one left down the pass with it', r.onBow && r.cast && r.left, r);
  ok(`30 s on she's ${r.away} m off (${r.u} m/s, ${r.crs}° off the fairway), in deep water (${r.clear} m), hull whole, nobody else lost; a dog takes the tiller from Hank`, r.away > 100 && r.u > 4 && Math.abs(r.crs) < 25 && r.clear > 20 && r.hull === 5 && r.aboard2 === r.n - 1 && r.lost === 1 && r.helm, r);
}

if (want('land')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, SEA, pens, DECK, CAMPS, HARB, LAND, scene, BOAT, step, resetGame, groundY, penAt, onDeck, inSea, boatXZ, sdfAt, seaStart } = GAME, out = {};
    seaStart({ under: true }); H.run(2); resetGame();   // (a voyage, then a new journey: back as it was)
    out.on = SEA.on; out.pens = pens.length - CAMPS.length; out.deck = pens[pens.length - 1] === DECK && DECK.deck && DECK.lock; out.gate = DECK.gateT; out.back = LAND.parent === scene && SEA.docked && !inSea(0, 0) && HARB.ice;
    out.flockAtCamp = G.sheep.every(s => !inSea(s.x, s.z)); for (let t = 0; t < 20; t += 0.025) step(0.025);
    out.none = !G.sheep.some(s => inSea(s.x, s.z)) && !G.dogs.some(d => inSea(d.x, d.z)) && !SEA.on; out.kit = [DECK.troughs.length, DECK.water.at.length, DECK.lick.at.length].join();
    const off = boatXZ(0, 30); out.deckY = groundY(DECK.x, DECK.z) - (-3); out.fb = GAME.BOAT.fb; out.sea = groundY(off.x, off.z); out.gap = sdfAt(HARB.gap.x, HARB.gap.z) < 0;
    // the gap shut: a sheep knocked over the rim onto the road scrambles back up into the arena, and nothing wakes
    const P = HARB.pts, s = G.sheep.find(q => !q.dead); s.x = (P[1].x + P[2].x) / 2; s.z = (P[1].z + P[2].z) / 2; s.pen = null; for (let t = 0; t < 4; t += 0.025) step(0.025);
    out.hop = !s.dead && !s.air && Math.hypot(s.x - P[0].x, s.z - P[0].z) < 6 && sdfAt(s.x, s.z) > 1 && !SEA.on;
    return out;
  });
  ok('a new journey: the land back where it was, she alongside at Cold Harbour, her gangway lashed, the gap iced shut; nobody out there', !r.on && r.pens === 1 && r.deck && r.gate === 0 && r.back && r.flockAtCamp && r.none && r.gap, r);
  ok(`the deck: ground ${r.deckY} m over the water, with its troughs (${r.kit}); the sea beyond`, Math.abs(r.deckY - r.fb) < 1e-6 && r.sea === -9 && r.kit === '3,1,1', r);
  ok('the gap still shut: a sheep knocked onto the harbour road hops back up into the arena; she sleeps on', r.hop, r);
}

errors.push(...h.errors); await h.close();
ok('no page errors', errors.length === 0, errors.slice(0, 5));
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
