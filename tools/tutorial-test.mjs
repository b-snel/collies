// Headless test: `node tools/tutorial-test.mjs` (TUTORIAL). A bot plays the practice evening through, each step by doing it: the stray
// (pushes the gate open, herds one ewe home, pushes it shut), the bunch (sprint, lie down, creep, five home), trouble (pounces a cast
// ewe over, grabs her, flings her in over the fence), night (barks at the coyote, pounces it off). Meanwhile the sun waits, nothing's hinted or
// saved, nobody's hurt. Then day 1 starts as ever with the same flock, and what was learnt isn't hinted again. Also: left alone
// nothing moves on; skipped (⏩) it's the plain journey; a saved journey is carried on with; off by itself under ?sim.
import { open } from './harness.mjs';
const h = await open({ query: '?sim' });
const r = await h.page.evaluate(() => {
  const { G, T, step, pens, TUT, TUT_L } = GAME, R = GAME.CAM_R, F = GAME.CAM_F, p = pens[0], nx = Math.cos(p.gateA), nz = Math.sin(p.gateA);
  const P = () => G.players[0], D = () => G.dogs[0], r1 = v => Math.round(v * 10) / 10;
  const res = { auto: TUT.want };
  GAME.JOURNEY.off = false;   // (as in a browser: so we see the practice isn't saved)
  try { localStorage.removeItem(GAME.TUT_KEY); localStorage.removeItem(GAME.JOURNEY_KEY); } catch (e) {}
  const to = (dx, dz, extra = {}) => { const l = Math.hypot(dx, dz) || 1; return Object.assign({ mx: (dx * R.x + dz * R.z) / l, my: -(dx * F.x + dz * F.z) / l }, extra); };
  const goTo = (x, z, { stop = 0.5, extra = {} } = {}) => { const d = D(), dx = x - d.x, dz = z - d.z, l = Math.hypot(dx, dz); if (l < stop) { P().bot = { ...extra }; return true; } const k = Math.min(1, l / 1.5); const b = to(dx, dz, extra); b.mx *= k; b.my *= k; P().bot = b; return false; };
  const mid = L => { let x = 0, z = 0; for (const s of L) { x += s.x / L.length; z += s.z / L.length; } return { x, z }; };
  // get behind them on the gate's far side, walk at the gate
  const herd = (L, extra = {}) => {
    const d = D(), c = mid(L); let gx = p.gx - c.x, gz = p.gz - c.z; const gl = Math.hypot(gx, gz) || 1; gx /= gl; gz /= gl;
    const rx = d.x - c.x, rz = d.z - c.z, along = rx * gx + rz * gz, lat = rx * -gz + rz * gx, spread = Math.max(...L.map(s => Math.hypot(s.x - c.x, s.z - c.z)));
    if (along > -2.5) { const side = lat >= 0 ? 1 : -1, w = 9 + spread; goTo(c.x - gz * side * w - gx * 3, c.z + gx * side * w - gz * 3, { extra }); }
    else goTo(c.x - gx * (4 + spread * 0.5), c.z - gz * (4 + spread * 0.5), { extra });
  };
  // walk in at the gate from outside: it swings in
  let openPh = 0;
  const openGate = () => {
    const d = D(), out = (d.x - p.gx) * nx + (d.z - p.gz) * nz, lat = Math.abs(-(d.x - p.gx) * nz + (d.z - p.gz) * nx);
    if (!openPh) { if (out > 2 && lat < 0.8) openPh = 1; else goTo(p.gx + nx * 4, p.gz + nz * 4, { stop: 0.5 }); }
    if (openPh) { P().bot = to(-nx, -nz); if (out < -3 || lat > 2.5) openPh = 0; }
  };
  // round behind the leaf, then round the hinge till it clacks
  let shutPh = 0, flingPh = 0;
  const shutGate = () => {
    const d = D(), sg = Math.sign(p.phi) || -1, a = p.angClosed + p.outSign * (p.phi + sg * 0.45), rr = p.gateLen * 0.65, sx = p.hinge.x + Math.cos(a) * rr, sz = p.hinge.z + Math.sin(a) * rr;
    if (!shutPh) { if (goTo(sx, sz, { stop: 0.5 })) shutPh = 1; return; }
    const psi = GAME.gatePsi(p, d.x, d.z), aa = p.angClosed + p.outSign * psi, k = -sg;   // round the hinge, toward shut
    P().bot = to(-Math.sin(aa) * p.outSign * k, Math.cos(aa) * p.outSign * k);
    if (Math.hypot(d.x - sx, d.z - sz) > 4 && Math.abs(psi - p.phi) > 1) shutPh = 0;
  };
  const HINTED = ['start', 'gate-opened', 'herd', 'modes', 'bark', 'pounce', 'grab', 'lie', 'travel', 'gates', 'cast', 'night', 'coyote-wise', 'train'];   // what these lessons would set off in a journey
  const log = [], seen = { hour: new Set(), hints: 0, hintQ: 0, saved: 0, minHp: 1, dead: 0, dens: 0, marks: 0 };
  let pressed = 0, t = 0;
  const bot = U => {
    const d = D(), L = U.L, S = U.S, key = L * 10 + S;
    if (U.ph === 'won' || U.ph === 'out') { P().bot = {}; shutPh = 0; return; }
    const out = GAME.tutOut();
    const shut = () => { if (out.length) { shutPh = 0; if (p.gateT < 0.6) openGate(); else herd(out); } else shutGate(); };
    if (key === 0) openGate();
    else if (key === 1) { if (p.gateT < 0.6) openGate(); else herd([U.ewe]); }
    else if (key === 2 || key === 14 || key === 23) shut();
    else if (key === 10) { const c = mid(U.bunch); goTo(c.x, c.z, { stop: 12, extra: { sprint: true } }); if (Math.hypot(d.x - c.x, d.z - c.z) < 12) P().bot = to(nx, nz, { sprint: true }); }
    else if (key === 11) { const c = mid(U.bunch); if (Math.hypot(d.x - c.x, d.z - c.z) > 18) goTo(c.x, c.z, { stop: 14 }); else P().bot = { lie: true }; }
    else if (key === 12) herd(U.bunch, { creep: true });
    else if (key === 13) { const o = U.bunch.filter(s => s.pen !== p); if (p.gateT < 0.6) openGate(); else herd(o.length ? o : U.bunch); }
    else if (key === 20) { const s = U.ewe, dd = Math.hypot(s.x - d.x, s.z - d.z); if (dd > 5) goTo(s.x, s.z, { stop: 4 }); else { P().bot = to(s.x - d.x, s.z - d.z, { pounce: G.time - pressed > 1 }); if (P().bot.pounce) pressed = G.time; } }
    else if (key === 21) { const s = U.ewe; if (d.holding === s) P().bot = { grab: true }; else if (Math.hypot(s.x - d.x, s.z - d.z) > 1.2) goTo(s.x, s.z, { stop: 1 }); else P().bot = { grab: true }; }
    else if (key === 22) {   // a run at the fence, let go: she flies in
      const s = U.ewe, dc = Math.hypot(d.x - p.x, d.z - p.z), ux = (d.x - p.x) / dc, uz = (d.z - p.z) / dc;
      if (d.holding !== s) { flingPh = 0; if (s.air) P().bot = {}; else if (Math.hypot(s.x - d.x, s.z - d.z) > 1.2) goTo(s.x, s.z, { stop: 1 }); else P().bot = { grab: true }; }
      else if (!flingPh) { if (dc > p.R + 9 || goTo(p.x + ux * (p.R + 10), p.z + uz * (p.R + 10), { stop: 1, extra: { grab: true } })) flingPh = 1; }
      else P().bot = to(-ux, -uz, dc < p.R + 3.4 && Math.hypot(d.vx, d.vz) > 3 ? {} : { grab: true });
    }
    else if (key === 30) { const c = U.coy, dd = Math.hypot(c.x - d.x, c.z - d.z); goTo(c.x, c.z, { stop: 3, extra: { sprint: dd > 12 } }); if (dd < 8 && G.time - pressed > 0.8) { P().bot.bark = true; pressed = G.time; } }
    else if (key === 31) { const c = U.coy, dd = Math.hypot(c.x - d.x, c.z - d.z); goTo(c.x + c.vx * 0.2, c.z + c.vz * 0.2, { stop: 1, extra: { sprint: dd > 9 } }); if (dd < 5.5 && G.time - pressed > 0.9) { P().bot = to(c.x + c.vx * 0.15 - d.x, c.z + c.vz * 0.15 - d.z, { pounce: true }); pressed = G.time; } }
  };
  const watch = () => {
    seen.hour.add(r1(G.clock.hour)); seen.hints = Math.max(seen.hints, HINTED.filter(k => G.hints[k]).length); seen.dens = Math.max(seen.dens, G.dens.length);
    if (GAME.JOURNEY.saved) seen.saved++;
    for (const d of G.dogs) seen.minHp = Math.min(seen.minHp, d.hp);
    seen.dead = Math.max(seen.dead, G.sheep.filter(s => s.dead).length);
  };

  // ---- 1) off by itself under ?sim: the plain journey ----
  GAME.startGame({ kind: 'bot', index: 0 });
  res.simPlain = !G.tut && G.clock.hour === T.startHour && G.dens.length > 0;

  // ---- 2) left alone: the sun waits, the lesson waits ----
  GAME.tutWant(true); GAME.resetGame(); res.resetPlain = !G.tut;   // (a reset is a journey, never a practice)
  GAME.tutStart();
  const names = G.sheep.map(s => s.name).join(), n0 = G.sheep.length, j0 = GAME.FLOCK.journeys;
  res.start = { on: !!G.tut, hour: G.clock.hour, L: G.tut.L, S: G.tut.S, dens: G.dens.length, coyotes: G.coyotes.length, eweOut: r1(Math.hypot(G.tut.ewe.x - p.gx, G.tut.ewe.z - p.gz)), latched: p.latched };
  P().bot = {}; for (let i = 0; i < 1200; i++) step(0.025);
  res.idle = { hour: G.clock.hour, L: G.tut.L, S: G.tut.S, penned: G.sheep.filter(s => s.pen === p).length, hunger: r1(Math.max(...G.sheep.map(s => s.hunger))), ff: G.ff };

  // ---- 3) skipped: day 1 as ever, the same flock, every hint still to come ----
  GAME.tutEnd(true);
  res.skip = { on: !!G.tut, hour: G.clock.hour, day: G.clock.day, same: G.sheep.map(s => s.name).join() === names, dens: G.dens.length, hints: Object.keys(G.hints).length, seen: !!localStorage.getItem(GAME.TUT_KEY), want: TUT.want,
    penned: G.sheep.filter(s => GAME.penAt(s.x, s.z) === p).length, latched: p.latched };

  // ---- 4) played through ----
  GAME.tutWant(true); GAME.tutStart();
  const names2 = G.sheep.map(s => s.name).join(); let last = -1, t0 = 0, stuck = null;
  while (G.tut && t < 600) {
    const U = G.tut, key = U.L * 10 + U.S;
    if (U.ph !== 'won' && U.ph !== 'out' && key !== last) { if (last >= 0) log.push([last, r1(t - t0)]); last = key; t0 = t; }
    if (t - t0 > 150) { stuck = { key, ph: U.ph, dog: [r1(D().x), r1(D().z)], out: GAME.tutOut().length, gateT: r1(p.gateT), phi: r1(p.phi), latched: p.latched }; break; }
    bot(U); step(0.025); t += 0.025; if (G.tut) watch();
    if (U.ph === 'play' && !(Math.round(t / 0.025) % 40)) { const st = TUT_L[U.L].steps[U.S]; if (st && st.at && [].concat(st.at(U) || []).length) seen.marks++; }
  }
  if (last >= 0) log.push([last, r1(t - t0)]);
  P().bot = {};
  res.play = { secs: r1(t), log, stuck, hours: [...seen.hour], hints: seen.hints, saved: seen.saved, minHp: r1(seen.minHp), dead: seen.dead, dens: seen.dens, marks: seen.marks };
  res.after = { on: !!G.tut, hour: G.clock.hour, day: G.clock.day, n: G.sheep.filter(s => !s.dead).length, n0, same: G.sheep.map(s => s.name).join() === names2, dens: G.dens.length, coyotesUp: G.coyotes.filter(c => c.state !== 'sleep').length,
    hints: Object.keys(G.hints).sort().join(), journeys: GAME.FLOCK.journeys - j0, mode: G.mode, latched: p.latched, penned: G.sheep.filter(s => GAME.penAt(s.x, s.z) === p).length, stats: G.stats.saved + G.stats.eaten, want: TUT.want };
  // the journey's on: the clock runs, it's saved
  for (let i = 0; i < 200; i++) step(0.025);
  res.journey = { hour: G.clock.hour > T.startHour, saves: GAME.journeySave() };

  // ---- 5) a journey already saved: the practice, then on with it ----
  G.clock.day = 3; G.clock.hour = 11; GAME.journeySave();
  const keep = GAME.JOURNEY.saved && GAME.JOURNEY.saved.day;
  GAME.tutWant(true); GAME.tutStart();
  for (let i = 0; i < 80; i++) step(0.025);
  const mid5 = { on: !!G.tut, hour: G.clock.hour, savedDay: GAME.JOURNEY.saved && GAME.JOURNEY.saved.day };
  GAME.tutEnd(true);
  res.resume = { keep, mid: mid5, day: G.clock.day, hour: r1(G.clock.hour), on: !!G.tut, stored: !!localStorage.getItem(GAME.JOURNEY_KEY) };
  try { localStorage.removeItem(GAME.TUT_KEY); localStorage.removeItem(GAME.JOURNEY_KEY); } catch (e) {}
  return res;
});
console.log(JSON.stringify(r, null, 1)); console.log(h.errors.slice(0, 3));
let fails = 0; const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) fails++; };
const { start: S, idle: I, skip: K, play: Pl, after: A, resume: Z } = r, steps = Pl.log.map(l => l[0]).join();
ok('off by itself under ?sim: the plain journey; a reset is never a practice', !r.auto && r.simPlain && r.resetPlain);
ok(`it starts: lesson 1 at ${S.hour}:00, one ewe ${S.eweOut} m out, the gate latched, no dens`, S.on && S.L === 0 && S.S === 0 && S.eweOut > 25 && S.latched && !S.dens && !S.coyotes);
ok(`left alone 30 s: the sun waits (${I.hour}), the lesson waits, the flock keeps to the pen (${I.penned}), nobody's hungry`, I.hour === S.hour && I.L === 0 && I.S === 0 && I.penned >= 13 && I.hunger < 0.2 && !I.ff);
ok(`skipped: day 1, 07:00, the same flock penned, dens back, every hint to come, not offered again`, !K.on && K.hour === 7 && K.day === 1 && K.same && K.dens > 0 && !K.hints && K.seen && !K.want && K.penned === 14 && K.latched);
ok(`played through in ${Pl.secs} s, every step by doing it (${steps})`, !Pl.stuck && !A.on && steps === '0,1,2,10,11,12,13,14,20,21,22,23,30,31');
ok(`each lesson its own hour (${Pl.hours.join(', ')}), the clock never running`, Pl.hours.length === 4 && Pl.hours.join() === '13.5,15.5,17.8,21');
ok(`meanwhile: no hints (${Pl.hints}), nothing saved (${Pl.saved}), no dens, nobody dead, no dog badly hurt (${Pl.minHp}), a marker up`, !Pl.hints && !Pl.saved && !Pl.dens && !Pl.dead && Pl.minHp >= 0.5 && Pl.marks > 20);
ok(`then day 1 as ever: 07:00, the same ${A.n} sheep penned behind the latched gate, dens asleep, a clean tally, one journey`, A.hour === 7 && A.day === 1 && A.n === A.n0 && A.same && A.penned === A.n && A.latched && A.dens > 0 && !A.coyotesUp && !A.stats && A.journeys === 1 && A.mode === 'play' && !A.want);
ok(`what was learnt isn't hinted again (${A.hints})`, A.hints === 'bark,gates,grab,herd,lie,modes,pounce,start');
ok('the journey runs and saves', r.journey.hour && r.journey.saves);
ok(`a saved journey (day ${Z.keep}): untouched by the practice, carried on with after (day ${Z.day}, ${Z.hour}:00)`, Z.keep === 3 && Z.mid.on && Z.mid.hour === 13.5 && Z.mid.savedDay === 3 && !Z.on && Z.day === 3 && Z.hour === 11 && Z.stored);
ok('no page errors', !h.errors.length);
await h.close();
process.exit(fails ? 1 : 0);
