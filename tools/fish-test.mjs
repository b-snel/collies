// Headless checks for FISHING (the rod 🎣, the cat bowl 🥣, the minigame): `node tools/fish-test.mjs [buy|cast|nibble|bite|beat|run|leap|land|bowl|move|save|off]`.
//   buy     from the vagabond (row 2): 🎣 paid, at the buying dog's feet; again: ✖ (hidden, nothing paid); 🥣 paid, by the 📍 pen's gate, outside
//           its fence, clear of the gate's swing, on dry ground; room by every camp pen; not at sea; too poor: nothing
//   cast    Ⓑ away from water: no cast; by water: the gauge winds up and swings, Ⓑ again: it flies, floats in the water; let go: the line comes
//           in; let fly at the gauge's top: PERFECT; left winding: it flies anyway
//   nibble  a fish comes and nibbles; Ⓑ on a nibble: spooked (it darts off, the next one later)
//   bite    under it goes: Ⓑ within the window: hooked; late: the bait's gone; none: gone too
//   beat    a fish on (a lake): heaves on its beat reel it in; off the beat a little; mashing barely, piling on tension (it snaps)
//   run     a run: heaving through it snaps the line; dug in (LT): held, line out
//   leap    a leap: taut at its top, it throws the hook; stepping in toward it (slack): kept
//   land    heaved in on the beat: onto the bank, into the pack (d.fish +1, 🐟 stats); the leg's fish one fewer (ECO on); a full pack: back it goes
//   bowl    a dog with fish walks up to the bowl: in they go; full: what fits; bowlTake: one at a time, empty: false
//   move    of an evening, the flock shut in another camp's pen: Hank moves the bowl there; by day, not
//   save    a reload (JOURNEY SAVE): the rod where it lay, the bowl (its pen, its fish), each dog's fish; a new journey: none
//   off     ?sim: off; no Math.random draws stepping it, no meshes made drawing it; the wares' mats made (their own dice)
import { open } from './harness.mjs';
const only = process.argv[2];
let h = null, fails = 0;
const errors = [];
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const want = k => !only || only === k;
const setup = async (on = true) => { if (h) { errors.push(...h.errors); await h.close(); } h = await open(); return h.page.evaluate(on => {
  const { G, T, step, startGame, CAM_R, CAM_F, groundY, ROD, FISH, fishBank } = GAME;
  try { localStorage.clear(); } catch (e) {}
  startGame({ kind: 'bot', index: 0 }); G.clock.hour = 10; T.fish.on = on; for (const c of G.coyotes) c.gone = true;
  const H = window.H = {}, d = G.dogs[0], p = G.players[0]; p.bot = {};
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.run = (sec, fn) => { for (let t = 0; t < sec - 1e-9; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return sec; };
  H.place = (e, x, z, yaw) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); if (yaw !== undefined) e.yaw = yaw; if (e.isDog && e.air) e.air = null; };
  H.far = (x, z) => G.sheep.forEach((o, i) => H.place(o, x + 70 + (i % 6) * 2, z + 70 + Math.floor(i / 6) * 2));
  H.press = (x = {}) => { p.bot = { grab: true, pounce: true, ...x }; step(0.025); p.bot = { grab: true, ...x }; };
  H.hold = (dx, dz, x = {}) => H.inp(dx, dz, { grab: true, ...x });
  // the rod at its nose, bitten
  H.grabRod = () => { const m = 0.95 + T.fish.len * 0.45; p.bot = {}; step(0.025); Object.assign(ROD, { on: true, stow: false, by: null, ph: '', x: d.x + Math.sin(d.yaw) * m, z: d.z + Math.cos(d.yaw) * m, yaw: d.yaw, h: 0, vx: 0, vz: 0, vy: 0, spin: 0 }); p.bot = { grab: true }; step(0.025); return d.holding === ROD; };
  // on a bank (open: a lake, the river, the sea's edge), facing the water, the rod in its jaws
  H.bank = (open = true) => { const b = fishBank(d.x, d.z, open); H.place(d, b.x, b.z, b.yaw); H.far(b.x, b.z); H.grabRod(); return b; };
  H.cast = () => { if (d.holding !== ROD) H.grabRod(); H.press(); H.run(0.5); H.press(); H.run(2.5, () => ROD.ph === 'float'); return ROD.ph; };
  H.bite = () => { FISH.wait = 0; return H.run(25, () => ROD.ph === 'bite'); };
  // its beat: true on the step its tail's next beat falls in (a press then is on it)
  H.beatOn = () => { const sp = T.fish.kinds[ROD.fk]; if (!sp) return false; const bi = Math.floor((G.time + 0.025 - FISH.t0) / sp.T + 1e-6), on = bi !== H._bi; H._bi = bi; return on; };
  // hooked, a 1 kg trout dist m out, no runs or leaps of its own
  H.hook = (dist = 10) => { H.cast(); H.bite(); H.press(); Object.assign(ROD, { fk: 'trout', fw: 1, dist, ten: 0.5 }); Object.assign(FISH, { fs: 1, runAt: 1e9, leapAt: 1e9, act: 'swim', last: '' }); d.stamina = 1; d.exhausted = false; H._bi = -1; return ROD.ph; };
  H.drop = () => { p.bot = {}; step(0.025); };
  return true;
}, on); };

if (want('buy')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, VSTALL, VAG, SEA, buyWare, ROD, BOWL, pens, bowlSpot, wetAt, sdfAt } = GAME, d = G.dogs[0], out = {};
    VAG.mode = 'land'; const p = pens[1]; G.visited.add(p.camp.name); VSTALL.pick = VSTALL.sel = pens.indexOf(p);
    const wr = VSTALL.wares.find(w => w.id === 'rod'), wb = VSTALL.wares.find(w => w.id === 'bowl'); G.wool = 40;
    out.shown = wr.show() && wb.show(); out.row = [wr.row, wb.row]; out.mats = !!(wr.g && wb.g);
    out.buyRod = buyWare(wr, d); out.paidRod = 40 - G.wool; H.run(1.5); out.rodAt = +Math.hypot(ROD.x - d.x, ROD.z - d.z).toFixed(2); out.rodOn = ROD.on && !ROD.by && ROD.h === 0;
    const w1 = G.wool; out.again = buyWare(wr, d); out.againFree = G.wool === w1; out.hidden = !wr.show();
    out.buyBowl = buyWare(wb, d); out.paidBowl = w1 - G.wool; out.bowl = BOWL.on && BOWL.pen === p;
    out.ring = +(Math.hypot(BOWL.x - p.x, BOWL.z - p.z) - p.R).toFixed(2); out.swing = +(Math.hypot(BOWL.x - p.hinge.x, BOWL.z - p.hinge.z) - p.gateLen).toFixed(2);
    out.dry = !wetAt(BOWL.x, BOWL.z) && sdfAt(BOWL.x, BOWL.z) > 1; out.bowlAgain = buyWare(wb, d);
    SEA.on = true; out.sea = wr.show() || wb.show(); SEA.on = false;
    G.wool = 0; ROD.on = false; out.poor = buyWare(wr, d); out.poorNone = !ROD.on;
    out.room = pens.filter(q => !q.deck && !q.final && !q.fold).map(q => !!bowlSpot(q));
    return out;
  });
  ok(`🎣 🥣 on row 2, their mats made`, r.shown && r.row.join() === '2,2' && r.mats, r);
  ok(`🎣 bought (${r.buyRod}): ${r.paidRod} 🧶, at the dog's feet (${r.rodAt} m); again: ${r.again}, nothing paid, hidden`, r.buyRod === 'buy' && r.paidRod === 12 && r.rodOn && r.rodAt < 3 && r.again === 'full' && r.againFree && r.hidden, r);
  ok(`🥣 bought (${r.buyBowl}): ${r.paidBowl} 🧶, by the 📍 pen (${r.ring} m out of its fence, ${r.swing} m clear of the gate's swing, dry); again: ${r.bowlAgain}`, r.buyBowl === 'buy' && r.paidBowl === 6 && r.bowl && r.ring > 0.3 && r.ring < 2.5 && r.swing > 0 && r.dry && r.bowlAgain === 'full', r);
  ok(`room for the bowl by every camp pen (${r.room.map(v => v ? '✔' : '✖').join('')}); not at sea; too poor: ${r.poor}, nothing`, r.room.every(Boolean) && !r.sea && r.poor === 'poor' && r.poorNone, r);
}

if (want('cast')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, ROD, FISH, fishWater, pens, step } = GAME, d = G.dogs[0], p = G.players[0], out = {};
    const pen = pens[0]; H.place(d, pen.exitX + 3, pen.exitZ + 3, 0); H.grabRod(); out.held = d.holding === ROD;
    H.press(); out.dry = ROD.ph === '' && FISH.dryT > 0;
    H.bank(false); H.press(); out.wind = ROD.ph; H.run(0.3); const g1 = ROD.gauge; H.run(0.3); out.swings = Math.abs(ROD.gauge - g1) > 0.1;
    H.press(); out.air = ROD.ph; H.run(2.5, () => ROD.ph === 'float'); out.float = ROD.ph; out.inWater = fishWater(ROD.bx, ROD.bz);
    H.drop(); out.dropped = !ROD.by && ROD.ph === '' && d.holding !== ROD && ROD.on;
    H.grabRod(); H.press(); H.run(3, () => ROD.gauge > 0.95); H.press(); out.perfect = FISH.perfect; H.run(2.5, () => ROD.ph === 'float');
    H.drop(); H.grabRod(); H.press(); H.run(T.fish.cast.auto + 0.1); out.auto = ROD.ph === 'air' || ROD.ph === 'float';
    return out;
  });
  ok('Ⓑ away from water: no cast', r.held && r.dry, r);
  ok(`by water: Ⓑ winds up (${r.wind}), the gauge swings; Ⓑ: it flies (${r.air}), floats in the ${r.inWater}`, r.wind === 'wind' && r.swings && r.air === 'air' && r.float === 'float' && !!r.inWater, r);
  ok('let go: the line comes in, the rod on the ground', r.dropped, r);
  ok(`at the gauge's top: PERFECT; left winding, it flies anyway`, r.perfect && r.auto, r);
}

if (want('nibble')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { T, ROD, FISH } = GAME, out = {};
    H.bank(); H.cast(); FISH.wait = 0; H.run(25, () => ROD.fst === 'nib'); out.nib = ROD.fst; out.kind = ROD.fk;
    H.run(0.1); H.press(); out.spooked = ROD.fst === 'flee' && ROD.ph === 'float' && FISH.last === 'spook';
    H.run(1); out.gone = ROD.fst === ''; out.later = +FISH.wait.toFixed(1); out.spook = T.fish.nib.spook;
    return out;
  });
  ok(`a fish (${r.kind}) comes and nibbles`, r.nib === 'nib', r);
  ok(`Ⓑ on a nibble: spooked, off it darts; the next one ${r.later} s off`, r.spooked && r.gone && r.later > r.spook * 0.9, r);
}

if (want('bite')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { T, ROD, FISH } = GAME, out = {};
    H.bank(); H.cast(); H.bite(); out.bite = ROD.ph; out.dip = ROD.dip; H.press(); out.hooked = ROD.ph === 'fight';
    H.drop(); out.dropLost = FISH.last === 'drop' && ROD.ph === '';
    H.cast(); H.bite(); out.win = +FISH.win.toFixed(2); H.run(FISH.win + 0.06); H.press(); out.late = FISH.last === 'late' && ROD.ph === 'float';
    H.bite(); H.run(T.fish.bite.plunge + 0.1); out.miss = FISH.last === 'miss' && ROD.ph === 'float';
    return out;
  });
  ok(`the bite: under it goes (${r.bite}); Ⓑ in the window: hooked; let go: lost`, r.bite === 'bite' && r.dip === 1 && r.hooked && r.dropLost, r);
  ok(`Ⓑ late (past ${r.win} s): the bait's gone; none at all: gone too`, r.late && r.miss, r);
}

if (want('beat')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, ROD, FISH } = GAME, d = G.dogs[0], p = G.players[0];
    H.bank();
    const trial = mode => {
      H.hook(10); let maxTen = 0, k = 0;
      H.run(3, () => {
        if (ROD.ph !== 'fight') return true; maxTen = Math.max(maxTen, ROD.ten);
        const b = H.beatOn(), half = (G.time + 0.025 - FISH.t0) / GAME.T.fish.kinds[ROD.fk].T % 1;
        p.bot = { grab: true, pounce: mode === 'beat' ? b : mode === 'off' ? Math.abs(half - 0.5) < 0.02 : k++ % 4 === 0 };
      });
      const o = { inn: +(10 - (ROD.ph === 'fight' ? ROD.dist : 10)).toFixed(2), ph: ROD.ph, last: FISH.last, maxTen: +maxTen.toFixed(2), st: +d.stamina.toFixed(2) };
      H.drop(); return o;
    };
    return { beat: trial('beat'), off: trial('off'), mash: trial('mash') };
  });
  ok(`heaves on its beat reel it in (${r.beat.inn} m in 3 s), off the beat less (${r.off.inn} m)`, r.beat.ph === 'fight' && r.beat.inn > 2.5 && r.off.inn < r.beat.inn * 0.6, r);
  ok(`mashing barely gains (${r.mash.inn} m) and piles on tension (${r.mash.maxTen} vs ${r.beat.maxTen}; ${r.mash.last || 'held'})`,
    r.mash.inn < r.beat.inn * 0.5 && r.mash.maxTen > r.beat.maxTen && r.beat.maxTen < 1, r);
}

if (want('run')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, ROD, FISH } = GAME, d = G.dogs[0], p = G.players[0];
    H.bank();
    const run = dig => {
      H.hook(8); Object.assign(FISH, { act: 'run', actT: 0, runT: 2.5 });
      H.run(2.5, () => { if (ROD.ph !== 'fight') return true; p.bot = { grab: true, lie: dig, pounce: !dig && H.beatOn() }; });
      const o = { ph: ROD.ph, last: FISH.last, act: FISH.act, dist: +ROD.dist.toFixed(1), dug: d.dugIn }; H.drop(); return o;
    };
    return { heave: run(false), dig: run(true) };
  });
  ok(`heaving through a run: the line snaps (${r.heave.last})`, r.heave.last === 'snap' && r.heave.ph === '', r);
  ok(`dug in (LT): held through it (${r.dig.ph}), line out (${r.dig.dist} m)`, r.dig.ph === 'fight' && r.dig.dist > 8, r);
}

if (want('leap')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, ROD, FISH } = GAME, d = G.dogs[0], p = G.players[0];
    H.bank();
    const leap = give => {
      H.hook(8); Object.assign(FISH, { act: 'leapW', actT: 0 }); let up = 0;
      H.run(1.8, t => { if (ROD.ph !== 'fight') return true; if (ROD.fst === 'leap') up = Math.max(up, ROD.fy - ROD.bh); p.bot = give && t < 1.15 ? H.hold(ROD.fx - d.x, ROD.fz - d.z) : { grab: true }; });
      const o = { ph: ROD.ph, last: FISH.last, apex: FISH.apex, up: +up.toFixed(2) }; H.drop(); return o;
    };
    return { taut: leap(false), slack: leap(true) };
  });
  ok(`a leap (up ${r.taut.up} m), the line taut at its top: the hook's thrown (${r.taut.last})`, r.taut.last === 'thrown' && r.taut.ph === '' && r.taut.up > 0.5, r);
  ok(`stepping in toward it (slack): kept (${r.slack.ph})`, r.slack.ph === 'fight' && r.slack.apex, r);
}

if (want('land')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, ROD, FISH, ECO, ecoLeg, resetEco } = GAME, d = G.dogs[0], p = G.players[0], out = {};
    T.eco.on = true; resetEco(); T.eco.tick = 1e9; H.bank();
    H.hook(6); Object.assign(ROD, { fk: 'perch', fw: 0.5 }); const li = ecoLeg(ROD.fx, ROD.fz), fish0 = ECO.legs[li] ? ECO.legs[li].fish : 0; out.li = li;
    H.run(30, () => { if (ROD.ph !== 'fight') return true; p.bot = { grab: true, pounce: H.beatOn() }; });
    out.landing = ROD.ph; out.fly = ROD.fst; p.bot = { grab: true }; H.run(4, () => ROD.ph === '');
    out.fish = d.fish; out.stats = G.stats.fish; out.eco = ECO.legs[li] ? +(fish0 - ECO.legs[li].fish).toFixed(3) : null; out.kills = ECO.kills['dog>fish'];
    d.fish = T.fish.carry; H.hook(4); H.run(30, () => { if (ROD.ph !== 'fight') return true; p.bot = { grab: true, pounce: H.beatOn() }; }); p.bot = { grab: true }; H.run(4, () => ROD.ph === '');
    out.full = d.fish; out.kills2 = ECO.kills['dog>fish'];
    return out;
  });
  ok(`heaved in on the beat: onto the bank (${r.landing}, ${r.fly}), into the pack (🐟 ${r.fish}, stats ${r.stats})`, r.landing === 'land' && r.fly === 'fly' && r.fish === 1 && r.stats === 1, r);
  ok(`ECO: the leg's (${r.li}) fish one fewer (${r.eco}), a dog's catch`, r.li >= 0 && r.eco === 1 && r.kills === 1, r);
  ok(`a full pack: back in the water it goes (🐟 ${r.full})`, r.full === 3 && r.kills2 === 1, r);
}

if (want('bowl')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, BOWL, pens, bowlSet, bowlTake } = GAME, d = G.dogs[0], out = {};
    out.set = bowlSet(pens[1]) && BOWL.on && BOWL.pen === pens[1];
    H.place(d, BOWL.x + 5, BOWL.z, 0); d.fish = 2; H.run(0.2); out.far = [BOWL.fish, d.fish];
    H.place(d, BOWL.x + 0.6, BOWL.z, 0); H.run(0.2); out.tip = [BOWL.fish, d.fish];
    out.take = [bowlTake(), BOWL.fish]; bowlTake(); out.empty = bowlTake() === false && BOWL.fish === 0;
    BOWL.fish = BOWL.cap - 1; d.fish = 3; H.run(0.2); out.full = [BOWL.fish, d.fish];
    return out;
  });
  ok(`walked up to the bowl: in they go (🥣 ${r.tip[0]}, 🐟 ${r.tip[1]}); not from afar`, r.set && r.far.join() === '0,2' && r.tip.join() === '2,0', r);
  ok(`bowlTake: one at a time (${r.take}); empty: false`, r.take[0] === true && r.take[1] === 1 && r.empty, r);
  ok(`nearly full: what fits (🥣 ${r.full[0]}, 🐟 ${r.full[1]})`, r.full.join() === '6,2', r);
}

if (want('move')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, BOWL, pens, bowlSet, groundY, setGate } = GAME, out = {};
    bowlSet(pens[1]);
    const shut = (q, hour) => { G.clock.hour = hour; setGate(q, false); q.gateT = 0; G.sheep.filter(s => !s.dead).forEach((s, i) => { const a = i * 2.4, rr = 1.5 + (i % 4) * 1.3; s.x = q.x + Math.cos(a) * rr; s.z = q.z + Math.sin(a) * rr; s.y = groundY(s.x, s.z); s.vx = s.vz = 0; s.hunger = 0.1; }); H.run(1.5); };
    shut(pens[2], 11); out.day = BOWL.pen === pens[1];
    shut(pens[2], 18); out.evening = BOWL.pen === pens[2]; out.near = Math.hypot(BOWL.x - pens[2].x, BOWL.z - pens[2].z) < pens[2].R + 3;
    return out;
  });
  ok('by day the bowl stays; of an evening, the flock shut in another camp\'s pen: Hank moves it there', r.day && r.evening && r.near, r);
}

if (want('save')) {
  await setup();
  const at = await h.page.evaluate(() => {
    const { G, ROD, BOWL, pens, bowlSet } = GAME, d = G.dogs[0];
    bowlSet(pens[1]); BOWL.fish = 3; d.fish = 2;
    Object.assign(ROD, { on: true, by: null, ph: '', x: d.x + 3, z: d.z + 1, yaw: 0.5, h: 0, vx: 0, vz: 0, vy: 0 });
    GAME.JOURNEY.off = false; GAME.journeySave(); return [ROD.x, ROD.z];
  });
  errors.push(...h.errors);
  await h.page.reload(); await h.page.waitForFunction(() => window.GAME, null, { timeout: 60000 });
  const r = await h.page.evaluate(at => {
    const J = GAME.JOURNEY; J.off = false; J.saved = GAME.journeyRead(); GAME.startGame({ kind: 'bot', index: 0 });
    const { G, ROD, BOWL, pens, resetGame } = GAME, out = { resumed: J.resumed, rod: ROD.on && !ROD.by, at: +Math.hypot(ROD.x - at[0], ROD.z - at[1]).toFixed(2), bowl: BOWL.on && BOWL.pen === pens[1], bfish: BOWL.fish, dfish: G.dogs[0].fish };
    resetGame(); out.gone = !ROD.on && !BOWL.on && BOWL.fish === 0 && G.dogs.every(d => !d.fish);
    return out;
  }, at);
  ok(`a reload: the rod where it lay (${r.at} m), the bowl by its pen (🐟 ${r.bfish}), the dog's fish (${r.dfish})`, r.resumed && r.rod && r.at < 0.5 && r.bowl && r.bfish === 3 && r.dfish === 2, r);
  ok('a new journey: no rod, no bowl, no fish', r.gone, r);
}

if (want('off')) {
  await setup(false);
  const r = await h.page.evaluate(() => {
    const { G, T, ROD, BOWL, FD, VSTALL, updateFishing, renderOnce } = GAME, out = { on: T.fish.on };
    let n = 0; const r0 = Math.random; Math.random = () => { n++; return r0(); };
    for (let i = 0; i < 200; i++) updateFishing(0.025, 0.01);
    Math.random = r0; out.draws = n;
    renderOnce(); out.made = FD.on; out.untouched = !ROD.on && !BOWL.on && G.dogs.every(d => !d.fish);
    out.mats = ['rod', 'bowl'].every(id => VSTALL.wares.some(w => w.id === id && w.g));
    return out;
  });
  ok(`?sim: off (${r.on}); stepping it draws no dice (${r.draws}); drawing it makes nothing; its wares' mats made`, r.on === false && r.draws === 0 && !r.made && r.untouched && r.mats, r);
}

errors.push(...(h ? h.errors : []));
ok('no page errors', !errors.length);
if (errors.length) console.log('PAGE ERRORS', errors.slice(0, 3));
if (h) await h.close();
process.exit(fails ? 1 : 0);
