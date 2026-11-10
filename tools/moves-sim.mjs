// Headless tests for the dog's moves and the physics-y world: `node tools/moves-sim.mjs [name ...]`.
// Pounce/punt distance, carom chains, pouncing a coyote off its prey, grab-drag, fling over a fence into a pen,
// pushing a gate open and shut (latch → gateT 0 → onGateClosed), vaulting a gate, grab-dragging a gate shut,
// the river launcher (pounce-fired, and loaded by driving sheep into its chute), splash-and-swim, shaking a coyote,
// a flung sheep bowling a coyote, lying down, and the final pen's finish.
import { open } from './harness.mjs';
const only = process.argv.slice(2);
const h = await open({ query: '?sim' });
await h.page.evaluate(() => {
  const { G, step, startGame, resetGame, pathPoint } = GAME;
  startGame({ kind: 'bot', index: 0 });
  const H = window.H = {};
  H.p = G.players[0];
  H.d = () => G.dogs[0];
  // screen-space stick input that walks the dog along world direction (dx, dz)
  H.to = (dx, dz, extra = {}) => { const R = GAME.CAM_R, F = GAME.CAM_F, l = Math.hypot(dx, dz) || 1; return Object.assign({ mx: (dx * R.x + dz * R.z) / l, my: -(dx * F.x + dz * F.z) / l }, extra); };
  H.reset = (hour = 10) => {
    resetGame(); G.clock.hour = hour; for (const c of G.coyotes) GAME.scene.remove(c.models.root); G.coyotes.length = 0; G.packs.length = 0; H.p.bot = {};
    for (const k of Object.keys(GAME.MV)) if (typeof GAME.MV[k] === 'number') GAME.MV[k] = 0;
    G.gateClosedN = 0;
  };
  H.place = (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = GAME.groundY(x, z); };
  H.run = (sec, fn) => { let t = 0; for (; t < sec; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return t; };
  H.r = v => Math.round(v * 100) / 100;
  H.river = e => ({ across: H.r(GAME.riverAcross(e.x, e.z)), along: H.r(GAME.riverAlong(e.x, e.z)) });
  H.local = (S, e) => { const dx = e.x - S.x, dz = e.z - S.z; return { p: dx * S.ux + dz * S.uz, q: -dx * S.uz + dz * S.ux }; };
  H.atLocal = (S, p, q) => ({ x: S.x + p * S.ux - q * S.uz, z: S.z + p * S.uz + q * S.ux });
  // follow one flier: first touchdown, peak height, where it finally comes to rest
  H.track = (s, sec = 4) => {
    const x0 = s.x, z0 = s.z; let peak = 0, first = null, landed = null, bounces = 0, lastB = s.air ? s.air.bounces : 0, splashed = false;
    H.run(sec, () => {
      if (s.air) {
        if (s.air.kind === 'swim') splashed = true;
        peak = Math.max(peak, s.air.h - GAME.groundY(s.x, s.z));
        if (s.air.bounces < lastB) { bounces++; lastB = s.air.bounces; if (!first) first = Math.hypot(s.x - x0, s.z - z0); }
      } else if (!landed) { landed = Math.hypot(s.x - x0, s.z - z0); if (!first) first = landed; }
    });
    return { firstTouch: H.r(first || 0), landedAt: H.r(landed || 0), restAt: H.r(Math.hypot(s.x - x0, s.z - z0)), peak: H.r(peak), bounces, splashed, stillFlying: !!s.air, dead: !!s.dead, sdf: H.r(GAME.sdfAt(s.x, s.z)) };
  };
});

const tests = {
  // 1. pounce into a sheep: it's punted ~20+ m and lands safely
  async punt() {
    return h.page.evaluate(() => {
      const { G, pathPoint } = GAME, out = [];
      for (const s0 of [320, 335, 250, 120, 600]) {
        H.reset(); const d = H.d(), P = pathPoint(s0, 0), s = G.sheep[0];
        H.place(d, P.x, P.z); H.place(s, P.x + P.tx * 2.2, P.z + P.tz * 2.2); d.yaw = Math.atan2(P.tx, P.tz);
        H.p.bot = H.to(P.tx, P.tz, { pounce: true }); GAME.step(0.025); H.p.bot = {};
        const r = H.track(s, 4.5); r.at = s0; r.punted = GAME.MV.punts; out.push(r);
      }
      return out;
    });
  },
  // 1b. punting a ram: it lands dazed and only comes back for the dog after a cooldown, not the moment it lands
  async ramPunt() {
    return h.page.evaluate(() => {
      const { G, pathPoint, T } = GAME; H.reset(); G.clock.day = 1;
      const d = H.d(), P = pathPoint(330, 0), s = G.sheep.find(o => o.ram && !o.lamb);
      for (const o of G.sheep) if (o !== s) H.place(o, P.x - P.tx * 40, P.z - P.tz * 40);
      H.place(d, P.x, P.z); H.place(s, P.x + P.tx * 2.2, P.z + P.tz * 2.2); d.yaw = Math.atan2(P.tx, P.tz); s.rs = 'idle'; s.rcd = 99;
      H.p.bot = H.to(P.tx, P.tz, { pounce: true }); GAME.step(0.025); H.p.bot = {};
      const landT = H.run(6, () => !s.air);
      const stateOnLanding = s.rs;
      // the dog trots up next to it and stands there
      const windupAt = H.run(20, () => { H.place(d, s.x - P.tx * 4, s.z - P.tz * 4); return s.rs === 'windup' || s.rs === 'charge'; });
      return { punted: GAME.MV.punts, landT: H.r(landT), stateOnLanding, windupAfterLanding: H.r(windupAt), target: s.rtar === d ? 'dog' : String(s.rtar && s.rtar.id),
        ok: stateOnLanding === 'dazed' && windupAt > T.ramPuntDazed + T.ramGrudgeCd[0] - 0.1 && windupAt < 19 && s.rtar === d };
    });
  },
  // 2. a punted sheep caroms down a line of sheep
  async caroms() {
    return h.page.evaluate(() => {
      const { G, pathPoint, MV } = GAME; H.reset(); const d = H.d(), P = pathPoint(330, 0);
      H.place(d, P.x, P.z); d.yaw = Math.atan2(P.tx, P.tz);
      [2.0, 3.3, 6.0, 8.8, 11.5].forEach((k, i) => H.place(G.sheep[i], P.x + P.tx * k, P.z + P.tz * k));
      H.p.bot = H.to(P.tx, P.tz, { pounce: true }); GAME.step(0.025); H.p.bot = {};
      H.run(5);
      return { caroms: MV.caroms, longestChain: MV.maxChain, allLanded: G.sheep.slice(0, 5).every(s => !s.air && !s.dead) };
    });
  },
  // 3. a pounce into a coyote dragging a sheep knocks it flying and it drops the sheep
  async pounceCoyote() {
    return h.page.evaluate(() => {
      const { G, pathPoint, spawnPack, grabPrey } = GAME; H.reset(21); const d = H.d(), P = pathPoint(330, 0), s = G.sheep[0];
      const pack = spawnPack(1, { howl: false }), c = pack.members[0];
      H.place(d, P.x, P.z); d.yaw = Math.atan2(P.tx, P.tz);
      H.place(c, P.x + P.tx * 4, P.z + P.tz * 4); c.yaw = Math.atan2(P.tx, P.tz); H.place(s, c.x + P.tx * 0.9, c.z + P.tz * 0.9);
      grabPrey(c, s);
      const saved0 = G.stats.saved, c0 = { x: c.x, z: c.z }, courage0 = c.courage;
      H.p.bot = H.to(P.tx, P.tz, { pounce: true }); GAME.step(0.025); H.p.bot = {};
      let hitAt = null, flew = false, peak = 0;
      H.run(2.5, () => { if (c.air) { flew = true; peak = Math.max(peak, c.air.h - GAME.groundY(c.x, c.z)); if (!hitAt) hitAt = { x: c.x, z: c.z }; } });
      return { flew, peak: H.r(peak), knockedBack: H.r(Math.hypot(c.x - (hitAt || c0).x, c.z - (hitAt || c0).z)), preyDropped: !s.grabbed && !c.prey, saved: G.stats.saved - saved0, courage: [H.r(courage0), H.r(c.courage)], state: c.state };
    });
  },
  // 4. grab a sheep and drag it along
  async grabDrag() {
    return h.page.evaluate(() => {
      const { G, pathPoint } = GAME; H.reset(); const d = H.d(), P = pathPoint(330, 0), s = G.sheep[0];
      H.place(d, P.x, P.z); d.yaw = Math.atan2(P.tx, P.tz); H.place(s, P.x + P.tx * 1.3, P.z + P.tz * 1.3);
      H.p.bot = { grab: true }; GAME.step(0.025);
      const grabbed = d.holding === s && s.heldBy === d, s0 = { x: s.x, z: s.z }, st0 = d.stamina;
      // drag it sideways across the trail and back, 4 s
      H.p.bot = H.to(-P.tz, P.tx, { grab: true }); H.run(2);
      H.p.bot = H.to(P.tx, P.tz, { grab: true }); H.run(2);
      const dragged = Math.hypot(s.x - s0.x, s.z - s0.z), stillHeld = d.holding === s, speed = Math.hypot(d.vx, d.vz);
      H.p.bot = { grab: true }; H.run(0.6);   // stop, then let go: a drop, not a fling
      H.p.bot = {}; GAME.step(0.025);
      return { grabbed, dragged: H.r(dragged), stillHeld, dogSpeedHolding: H.r(speed), staminaUsed: H.r(st0 - d.stamina), droppedNotFlung: !s.heldBy && !s.air };
    });
  },
  // 5. fling a held sheep over the fence into a pen: it counts as penned
  async flingIntoPen() {
    return h.page.evaluate(() => {
      const { G, pens, MV } = GAME, out = [];
      for (const ang of [Math.PI, Math.PI * 0.7, Math.PI * 1.35]) {
        H.reset(); const d = H.d(), pen = pens[1], s = G.sheep[0], a = pen.gateA + ang, ux = Math.cos(a), uz = Math.sin(a);
        H.place(d, pen.x + ux * (pen.R + 4), pen.z + uz * (pen.R + 4)); d.yaw = Math.atan2(-ux, -uz);
        H.place(s, d.x - ux * 1.2, d.z - uz * 1.2);
        H.p.bot = { grab: true }; GAME.step(0.025);
        const held = d.holding === s;
        H.p.bot = H.to(-ux, -uz, { grab: true }); H.run(0.3);
        const v = Math.hypot(d.vx, d.vz);
        H.p.bot = H.to(-ux, -uz); GAME.step(0.025); H.p.bot = {};
        const r = H.track(s, 3.5);
        out.push({ held, dogSpeed: H.r(v), flung: MV.flings, penned: s.pen === pen, inside: Math.hypot(s.x - pen.x, s.z - pen.z) < pen.R, label: MV.holeInOne, flight: r });
      }
      return out;
    });
  },
  // 5b. punt a sheep standing outside the fence over it into the pen: HOLE IN ONE
  async holeInOne() {
    return h.page.evaluate(() => {
      const { G, pens, MV } = GAME, out = [];
      for (const ang of [Math.PI, Math.PI * 0.75, Math.PI * 1.3]) {
        H.reset(); const d = H.d(), pen = pens[1], s = G.sheep[0], a = pen.gateA + ang, ux = Math.cos(a), uz = Math.sin(a);
        H.place(d, pen.x + ux * (pen.R + 5), pen.z + uz * (pen.R + 5)); d.yaw = Math.atan2(-ux, -uz);
        H.place(s, pen.x + ux * (pen.R + 3), pen.z + uz * (pen.R + 3));
        H.p.bot = H.to(-ux, -uz, { pounce: true }); GAME.step(0.025); H.p.bot = {};
        H.run(3.5);
        out.push({ penned: s.pen === pen, holeInOne: MV.holeInOne, fromCentre: H.r(Math.hypot(s.x - pen.x, s.z - pen.z)) });
      }
      return out;
    });
  },
  // 5c. a held sheep can't be carried in through an open gateway (you have to fling it)
  async carryThrough() {   // a sheep in the dog's mouth goes in through an open gate and back out, but not through a shut one
    return h.page.evaluate(() => {
      const { G, pens, toggleGate } = GAME; H.reset(); const d = H.d(), pen = pens[1], s = G.sheep[0], nx = Math.cos(pen.gateA), nz = Math.sin(pen.gateA);
      toggleGate(pen); H.run(1.2);
      H.place(d, pen.gx + nx * 4, pen.gz + nz * 4); d.yaw = Math.atan2(-nx, -nz); H.place(s, d.x - nx * 1.2, d.z - nz * 1.2);
      H.p.bot = { grab: true }; GAME.step(0.025);
      H.p.bot = H.to(-nx, -nz, { grab: true }); H.run(1.5);
      const r = { gateT: H.r(pen.gateT), held: d.holding === s, carriedIn: s.pen === pen };
      H.p.bot = H.to(nx, nz, { grab: true }); H.run(2.5);
      r.carriedOut = !s.pen && d.holding === s;
      toggleGate(pen); H.run(1.5);
      H.p.bot = H.to(-nx, -nz, { grab: true }); H.run(2);
      r.shutGate = { gateT: H.r(pen.gateT), held: d.holding === s, sheepInPen: s.pen === pen };
      H.p.bot = {}; GAME.step(0.025);
      return r;
    });
  },
  // 6. push a gate open (from outside it swings in), then push it shut from inside: latch → gateT 0 → onGateClosed
  async gatePush() {
    return h.page.evaluate(() => {
      const { G, pens, MV, gatePsi } = GAME; H.reset(); const d = H.d(), pen = pens[1], nx = Math.cos(pen.gateA), nz = Math.sin(pen.gateA);
      H.place(d, pen.gx + nx * 3, pen.gz + nz * 3);
      let maxT = 0, opened = null;
      H.p.bot = H.to(-nx, -nz); H.run(2.2, t => { maxT = Math.max(maxT, pen.gateT); if (!opened && pen.gateT > 0.9) opened = t; });
      const afterOpen = { gateT: H.r(pen.gateT), phi: H.r(pen.phi), latched: pen.latched, dogInside: Math.hypot(d.x - pen.x, d.z - pen.z) < pen.R };
      H.p.bot = {}; H.run(0.6);
      // stand inside on the far side of the leaf and walk round the hinge so it swings back out through shut
      const ph = pen.phi, a = pen.angClosed + pen.outSign * (ph - 0.4), r = pen.gateLen * 0.6;
      H.place(d, pen.hinge.x + Math.cos(a) * r, pen.hinge.z + Math.sin(a) * r);
      const latches0 = MV.latches, closed0 = G.gateClosedN;
      let shutAt = null;
      H.run(3, t => {
        const psi = gatePsi(pen, d.x, d.z), aa = pen.angClosed + pen.outSign * psi, tx = -Math.sin(aa) * pen.outSign, tz = Math.cos(aa) * pen.outSign;   // round the hinge toward +phi
        H.p.bot = H.to(tx, tz);
        if (pen.latched && !shutAt) { shutAt = t; return true; }
      });
      H.p.bot = {}; H.run(0.5);
      return { maxGateT: H.r(maxT), openedIn: opened && H.r(opened), afterOpen, shutIn: shutAt && H.r(shutAt), latched: pen.latched, gateT: pen.gateT, phi: pen.phi, latchCount: MV.latches - latches0, onGateClosedCalls: G.gateClosedN - closed0 };
    });
  },
  // 6b. pounce into a shut gate: it slams open, shoving (or whacking) the sheep behind it, and none end up outside
  async gateSlam() {
    return h.page.evaluate(() => {
      const { G, pens } = GAME; H.reset(); const d = H.d(), pen = pens[1], nx = Math.cos(pen.gateA), nz = Math.sin(pen.gateA);
      const sh = G.sheep.slice(0, 6);
      sh.forEach((s, i) => { const a = pen.angClosed + pen.outSign * -(0.35 + i * 0.17), r = 1.6 + (i % 3) * 1.1; H.place(s, pen.hinge.x + Math.cos(a) * r, pen.hinge.z + Math.sin(a) * r); });
      H.run(0.1);
      H.place(d, pen.gx + nx * 3.5, pen.gz + nz * 3.5); d.yaw = Math.atan2(-nx, -nz);
      H.p.bot = H.to(-nx, -nz, { pounce: true }); GAME.step(0.025); H.p.bot = {};
      let maxW = 0, whacked = 0, minPhi = 0;
      H.run(2, () => { maxW = Math.max(maxW, Math.abs(pen.w)); minPhi = Math.min(minPhi, pen.phi); for (const s of sh) if (s.air && s.air.kind === 'whack' && !s.counted) { s.counted = true; whacked++; } });
      H.run(2);
      return { slamSpeed: H.r(maxW), swungTo: H.r(minPhi), gateT: H.r(pen.gateT), whacked, sheepStillInPen: sh.filter(s => GAME.penAt(s.x, s.z) === pen).length, of: sh.length, dogOutside: Math.hypot(d.x - pen.x, d.z - pen.z) > pen.R };
    });
  },
  // 7. sprint into a shut gate: vault it, gate stays latched
  async vault() {
    return h.page.evaluate(() => {
      const { pens } = GAME; H.reset(); const d = H.d(), pen = pens[1], nx = Math.cos(pen.gateA), nz = Math.sin(pen.gateA);
      H.place(d, pen.gx + nx * 4, pen.gz + nz * 4);
      let hopped = false;
      H.p.bot = H.to(-nx, -nz, { sprint: true }); H.run(1.2, () => { if (d.hopT > 0) hopped = true; });
      H.p.bot = {}; H.run(0.3);
      return { hopped, dogInside: Math.hypot(d.x - pen.x, d.z - pen.z) < pen.R, stillLatched: pen.latched, gateT: pen.gateT };
    });
  },
  // 8. grab an open gate and drag it shut from outside
  async gateDrag() {
    return h.page.evaluate(() => {
      const { G, pens, MV, toggleGate, gatePsi } = GAME; H.reset(); const d = H.d(), pen = pens[1];
      toggleGate(pen); H.run(1.2);   // swung wide open (outward)
      const openPhi = pen.phi;
      // stand in the wedge between the leaf and the funnel wing, facing the leaf
      const a = pen.angClosed + pen.outSign * (pen.phi + 0.32), r = 3.2;
      H.place(d, pen.hinge.x + Math.cos(a) * r, pen.hinge.z + Math.sin(a) * r);
      const la = pen.angClosed + pen.outSign * pen.phi, lx = pen.hinge.x + Math.cos(la) * r, lz = pen.hinge.z + Math.sin(la) * r;
      d.yaw = Math.atan2(lx - d.x, lz - d.z);
      H.p.bot = { grab: true }; GAME.step(0.025);
      const grabbedGate = d.holding === pen;
      const latches0 = MV.latches; let shutAt = null;
      H.run(4, t => {   // walk round the hinge toward shut, holding on
        const psi = gatePsi(pen, d.x, d.z), aa = pen.angClosed + pen.outSign * psi, tx = Math.sin(aa) * pen.outSign, tz = -Math.cos(aa) * pen.outSign;
        H.p.bot = H.to(tx, tz, { grab: true });
        if (pen.latched && !shutAt) { shutAt = t; return true; }
      });
      H.p.bot = {}; H.run(0.3);
      return { openPhi: H.r(openPhi), grabbedGate, shutIn: shutAt && H.r(shutAt), latched: pen.latched, gateT: pen.gateT, latchCount: MV.latches - latches0, letGo: d.holding === null };
    });
  },
  // 9. the river launcher: sheep on the low end, pounce the high end → they land on the far bank
  async launcher() {
    return h.page.evaluate(() => {
      const { G, LAUNCHERS, MV } = GAME; H.reset(); const d = H.d(), S = LAUNCHERS[0];
      const spots = [[1.2, -0.5], [2.2, 0.5], [3.2, -0.4], [3.6, 0.55]];
      const sh = spots.map(([p, q], i) => { const s = G.sheep[i], w = H.atLocal(S, p, q); H.place(s, w.x, w.z); return s; });
      const start = H.atLocal(S, -7.5, 0); H.place(d, start.x, start.z); d.yaw = Math.atan2(S.ux, S.uz);
      H.p.bot = H.to(S.ux, S.uz, { pounce: true }); GAME.step(0.025); H.p.bot = {};
      let fired = null; H.run(5, t => { if (!fired && MV.launches) fired = t; });
      return { fired: fired !== null, launched: MV.launched, splashes: MV.splashes, sheep: sh.map(s => ({ ...H.river(s), air: !!s.air, dead: !!s.dead, sdf: H.r(GAME.sdfAt(s.x, s.z)) })), farBank: sh.filter(s => GAME.riverAcross(s.x, s.z) > 6 && !s.air && !s.dead).length };
    });
  },
  // 9b. co-op: a second dog standing on the low end gets launched too, and lands on its feet
  async launchDog() {
    return h.page.evaluate(() => {
      const { G, LAUNCHERS, joinPlayer } = GAME; H.reset(); if (G.dogs.length < 2) joinPlayer({ kind: 'bot', index: 1 });
      const d = H.d(), d2 = G.dogs[1], S = LAUNCHERS[0]; G.players[1].bot = {};
      const w2 = H.atLocal(S, 2.5, 0), w = H.atLocal(S, -7, 0); H.place(d2, w2.x, w2.z); H.place(d, w.x, w.z); d.yaw = Math.atan2(S.ux, S.uz);
      H.p.bot = H.to(S.ux, S.uz, { pounce: true }); GAME.step(0.025); H.p.bot = {};
      let flew = false, peak = 0; H.run(4, () => { if (d2.air) { flew = true; peak = Math.max(peak, d2.air.h - GAME.groundY(d2.x, d2.z)); } });
      const r = { flew, peak: H.r(peak), landed: !d2.air, ...H.river(d2) };
      // tidy up: the second dog leaves again
      const p2 = G.players[1]; GAME.scene.remove(d2.models.root); G.dogs.splice(1, 1); G.players.splice(1, 1); p2.dog = null;
      return r;
    });
  },
  // 10. drive a few sheep into the launcher's chute from behind, then pounce the high end
  async launcherDrive() {
    return h.page.evaluate(() => {
      const { G, LAUNCHERS, MV } = GAME; H.reset(); const d = H.d(), S = LAUNCHERS[0];
      const sh = [];
      for (let i = 0; i < 6; i++) { const s = G.sheep[i], w = H.atLocal(S, -8 - (i % 3) * 1.3, ((i / 3 | 0) - 0.5) * 1.6); H.place(s, w.x, w.z); sh.push(s); }
      const start = H.atLocal(S, -15, 0); H.place(d, start.x, start.z);
      const onLoad = () => sh.filter(s => { const l = H.local(S, s); return l.p > -0.3 && l.p < S.L + 0.5 && Math.abs(l.q) < S.W / 2 + 0.45; }).length;
      let best = 0, bestT = 0;
      // walk up behind them along the plank's axis, then hold at the high end
      H.run(9, t => {
        const l = H.local(S, d), wantQ = -l.q * 0.5;
        if (l.p < -5.6) H.p.bot = H.to(S.ux - S.uz * wantQ, S.uz + S.ux * wantQ); else H.p.bot = {};
        const n = onLoad(); if (n > best) { best = n; bestT = t; }
      });
      const loaded = onLoad();
      const pos = H.local(S, d);
      H.p.bot = H.to(S.ux, S.uz, { pounce: true }); GAME.step(0.025); H.p.bot = {};
      H.run(5);
      return { loadedBeforePounce: loaded, bestLoad: best, bestAt: H.r(bestT), dogAt: { p: H.r(pos.p), q: H.r(pos.q) }, launched: MV.launched, landedFarBank: sh.filter(s => GAME.riverAcross(s.x, s.z) > 6 && !s.air).length, splashes: MV.splashes };
    });
  },
  // 11. a sheep that lands in the river splashes and swims back to a bank, alive
  async splash() {
    return h.page.evaluate(() => {
      const { G, RIVER, launchSheep, MV } = GAME, out = [];
      for (const al of [12, -30, 40]) {
        H.reset(); const s = G.sheep[0], x = RIVER.x + RIVER.tx * -9 + RIVER.nx * al, z = RIVER.z + RIVER.tz * -9 + RIVER.nz * al;
        H.place(s, x, z); launchSheep(s, RIVER.tx * 15, RIVER.tz * 15, 3.4, 'punt', null);
        let swimT = 0, swam = false;
        const t = H.run(30, () => { if (s.air && s.air.kind === 'swim') { swam = true; swimT += 0.025; } return swam && !s.air; });
        out.push({ along: al, swam, swimSecs: H.r(swimT), out: !s.air, alive: !s.dead, ...H.river(s), sdf: H.r(GAME.sdfAt(s.x, s.z)), splashes: MV.splashes });
      }
      // and a plain punt off the near bank toward the water
      H.reset(); const d = H.d(), s = G.sheep[0], P = { x: RIVER.x + RIVER.tx * -15 + RIVER.nx * 12, z: RIVER.z + RIVER.tz * -15 + RIVER.nz * 12 };
      H.place(d, P.x, P.z); H.place(s, P.x + RIVER.tx * 2, P.z + RIVER.tz * 2); d.yaw = Math.atan2(RIVER.tx, RIVER.tz);
      H.p.bot = H.to(RIVER.tx, RIVER.tz, { pounce: true }); GAME.step(0.025); H.p.bot = {};
      const r = H.track(s, 20); out.push({ naturalPunt: r, ...H.river(s) });
      return out;
    });
  },
  // 12. grab a coyote that's dragging a sheep, shake it: it drops the sheep, and a couple more shakes send it packing
  async shakeCoyote() {
    return h.page.evaluate(() => {
      const { G, pathPoint, spawnPack, grabPrey } = GAME; H.reset(21); const d = H.d(), P = pathPoint(330, 0), s = G.sheep[0];
      const c = spawnPack(1, { howl: false }).members[0];
      H.place(d, P.x, P.z); d.yaw = Math.atan2(P.tx, P.tz);
      H.place(c, P.x + P.tx * 1.4, P.z + P.tz * 1.4); c.yaw = Math.atan2(P.tx, P.tz); H.place(s, c.x + P.tx * 0.9, c.z + P.tz * 0.9);
      grabPrey(c, s);
      H.p.bot = { grab: true }; GAME.step(0.025);
      const held = d.holding === c, stillHasPrey = !!c.prey;
      H.run(0.3);
      const courage = [H.r(c.courage)];
      H.p.bot = { grab: true, pounce: true }; GAME.step(0.025); H.p.bot = { grab: true }; H.run(0.35);
      const dropped = !s.grabbed; courage.push(H.r(c.courage));
      for (let k = 0; k < 2 && d.holding === c; k++) { H.p.bot = { grab: true, pounce: true }; GAME.step(0.025); H.p.bot = { grab: true }; H.run(0.35); courage.push(H.r(c.courage)); }
      const c0 = { x: c.x, z: c.z }, released = d.holding !== c, flew = !!c.air;
      H.p.bot = {}; H.run(2);
      return { held, preyStillInItsMouthUntilShaken: stillHasPrey, droppedAfterFirstShake: dropped, courage, shakenLoose: released, flew, state: c.state, ranOff: H.r(Math.hypot(c.x - c0.x, c.z - c0.z)), saved: G.stats.saved };
    });
  },
  // 13. a flung sheep bowls over a coyote
  async bowl() {
    return h.page.evaluate(() => {
      const { G, pathPoint, spawnPack, launchSheep, MV } = GAME; H.reset(21); const P = pathPoint(330, 0), s = G.sheep[0];
      const c = spawnPack(1, { howl: false }).members[0];
      H.place(c, P.x + P.tx * 5, P.z + P.tz * 5); H.place(s, P.x, P.z); c.state = 'pack';
      const dx = c.x - s.x, dz = c.z - s.z, l = Math.hypot(dx, dz);
      launchSheep(s, dx / l * 15, dz / l * 15, 4.5, 'fling', null);   // a flat throw that reaches it in ~1/3 s
      let flew = false; const c0 = { x: c.x, z: c.z };
      H.run(2.5, () => { if (c.air) flew = true; });
      return { bowled: MV.bowled, coyoteFlew: flew, knocked: H.r(Math.hypot(c.x - c0.x, c.z - c0.z)), state: c.state };
    });
  },
  // 14. lying down: the dog drops flat and stops
  async lie() {
    return h.page.evaluate(() => {
      const { pathPoint } = GAME; H.reset(); const d = H.d(), P = pathPoint(330, 0);
      H.place(d, P.x, P.z); H.p.bot = H.to(P.tx, P.tz); H.run(1);
      const v0 = Math.hypot(d.vx, d.vz);
      H.p.bot = H.to(P.tx, P.tz, { lie: true }); H.run(0.5);
      const r = { walking: H.r(v0), mode: d.mode, speedLying: H.r(Math.hypot(d.vx, d.vz)) };
      H.p.bot = H.to(P.tx, P.tz, { lie: true, pounce: true }); GAME.step(0.025); r.noPounceWhileLying = d.pounceT <= 0;
      H.p.bot = {}; GAME.step(0.025); r.upAgain = d.mode;
      return r;
    });
  },
  // 15. the final pen: whole flock inside, push the gate shut → the game ends
  async finalPen() {
    return h.page.evaluate(() => {
      const { G, pens, toggleGate } = GAME; H.reset(); const d = H.d(), pen = pens[3];
      toggleGate(pen); H.run(1.2);   // open it
      for (const s of G.sheep) { const a = Math.random() * 6.283, r = Math.random() * (pen.R - 2.5); H.place(s, pen.x + Math.cos(a) * r, pen.z + Math.sin(a) * r); }
      H.run(0.2);
      const nx = Math.cos(pen.gateA), nz = Math.sin(pen.gateA);
      // from the wedge between the open leaf and the wing, walk it shut
      const a = pen.angClosed + pen.outSign * (pen.phi + 0.35), r = pen.gateLen * 0.75;
      H.place(d, pen.hinge.x + Math.cos(a) * r, pen.hinge.z + Math.sin(a) * r);
      const t = H.run(5, () => {
        const psi = GAME.gatePsi(pen, d.x, d.z), aa = pen.angClosed + pen.outSign * psi;
        H.p.bot = H.to(Math.sin(aa) * pen.outSign, -Math.cos(aa) * pen.outSign);
        return G.mode !== 'play';
      });
      return { mode: G.mode, secs: H.r(t), latched: pen.latched, inside: G.sheep.filter(s => s.pen === pen).length, total: G.sheep.length };
    });
  },
};

const results = {};
for (const [name, fn] of Object.entries(tests)) {
  if (only.length && !only.includes(name)) continue;
  try { results[name] = await fn(); } catch (e) { results[name] = { error: String(e) }; }
  console.log(name, JSON.stringify(results[name]));
}
if (h.errors.length) console.log('PAGE ERRORS', h.errors.slice(0, 5));
await h.close();
