// Headless checks for the ECOSYSTEM (ECO): `node tools/eco-sim.mjs [persist|cycle|nopred|crash|meso|harvest|game|save] [--chart FILE]`.
// Runs the game's own model (ecoRun on fresh legs, its own dice: seeds 1…n), years of it, and prints what it did.
//   persist  10 runs × 1500 days: every kind lasts on every leg it lives on (none dies out), none past its land's K / 3× its base
//   cycle    mice boom and bust (CV); the coyotes follow them, days later (lagged correlation peaks at +2…25 d); a cycle's length
//   nopred   no predators (and none wandering in): the mice fill the land (≥ 90% K); predators back: down again
//   crash    the mice crash (a plague: × 0.05): the coyotes go hungry within days, dwindle; the mice come back, then the coyotes
//   meso     no coyotes: more stray cats (mesopredator release), the cats' own crowding still holds them
//   harvest  4 of our cats hunting a leg (a cat's take: fewer to find, fewer caught): they compete with the coyotes (fewer coyotes, as
//            many mice or fewer: the leg's mice are robust; the feed the cats guard is by the pen) and the mice hold on
//   game     the game reads it (T.eco.on): tonight's coyotes × the leg's (more when many, fewer when few), the den shrinks in lean
//            times, the falcon's wait ÷, cougars out by numbers; hungry coyotes braver; a kill (preyKill) feeds the leg (a stray cat: one
//            fewer stray; one of ours: not); off: all × 1
//   save     a reload: the same numbers on every leg
//   migrate  MIGRATION and MATING: starving coyotes leave a leg far faster than fed ones, and look further (2+ legs away), toward the leg
//            with food; an emptied leg is filled again from its neighbours; few about: fewer find a mate, more set off to look; the
//            game's reach (dens, groves) grows with hunger
// --chart FILE: an SVG of 300 days (mice, cats, coyotes, falcons on leg 1)
import fs from 'node:fs';
import { open } from './harness.mjs';
const argv = process.argv.slice(2), only = argv.find(a => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--chart'), chart = argv.includes('--chart') ? argv[argv.indexOf('--chart') + 1] : null;
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const want = k => !only || only === k;
const h = await open();
await h.page.evaluate(() => {
  const { ecoLegNew, ecoRun, T, ECO_KINDS } = GAME, mulberry32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const E = window.E = {};
  E.legs = seed => { const R = mulberry32(seed); return { R, legs: T.eco.hab.map(hb => ecoLegNew(hb, R)) }; };
  // run days, a sample each day: [leg][kind] series
  E.run = (L, days, every = 1) => { const out = L.legs.map(() => Object.fromEntries([...ECO_KINDS, 'fedcoy'].map(k => [k, []]))); let next = every;
    ecoRun(L.legs, days, L.R, 1 / 24, (legs, t) => { if (t + 1e-9 < next) return; next += every; legs.forEach((g, i) => { for (const k of ECO_KINDS) out[i][k].push(g[k]); out[i].fedcoy.push(g.fed.coy); }); });
    return out; };
  E.mean = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  E.sd = a => { const m = E.mean(a); return Math.sqrt(E.mean(a.map(v => (v - m) ** 2))); };
  E.r2 = v => Math.round(v * 100) / 100;
  // corr(x[t], y[t + lag])
  E.xc = (x, y, lag) => { const n = x.length - lag, a = x.slice(0, n), b = y.slice(lag, lag + n), ma = E.mean(a), mb = E.mean(b); let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return s / Math.sqrt(sa * sb || 1); };
  E.spark = (a, w = 60) => { const ch = '▁▂▃▄▅▆▇█', lo = Math.min(...a), hi = Math.max(...a), st = a.length / w; let s = ''; for (let i = 0; i < w; i++) { const v = a[Math.floor(i * st)]; s += ch[Math.min(7, Math.floor((v - lo) / (hi - lo + 1e-9) * 8))]; } return s; };
  // with kinds switched off (none, none wandering in), then back as they were
  E.off = (kinds, fn) => { const keep = kinds.map(k => [k, T.eco.pred[k].in, T.eco.hab.map(hb => hb[k])]); try { for (const k of kinds) { T.eco.pred[k].in = 0; } return fn(); } finally { for (const [k, i] of keep) T.eco.pred[k].in = i; } };
  return true;
});

if (want('persist')) {
  const r = await h.page.evaluate(() => {
    const { T } = GAME, out = { worst: {}, over: [] };
    for (let seed = 1; seed <= 10; seed++) {
      const L = E.legs(seed), S = E.run(L, 1500);
      S.forEach((leg, i) => { const hb = T.eco.hab[i];
        for (const k of ['mice', 'ducks', 'fish', 'cats', 'coy', 'cougar', 'falcon']) { if (!hb[k]) continue;
          const lo = Math.min(...leg[k].slice(100)) / hb[k], hi = Math.max(...leg[k]) / hb[k], key = `${k}`;
          out.worst[key] = Math.min(out.worst[key] ?? 9, lo);
          if ((['mice', 'ducks', 'fish'].includes(k) && hi > 1.001) || (!['mice', 'ducks', 'fish'].includes(k) && hi > 3)) out.over.push([seed, i, k, E.r2(hi)]);
        } });
    }
    for (const k in out.worst) out.worst[k] = E.r2(out.worst[k]);
    return out;
  });
  console.log('  the lowest any kind fell (× its K / base), 10 runs × 1500 days:', JSON.stringify(r.worst));
  ok('persist: no kind dies out on any leg it lives on (each ≥ 5% of its K / base at its lowest)', Object.values(r.worst).every(v => v >= 0.05), r.worst);
  ok('persist: prey never past their land\'s K, predators never past 3× base', !r.over.length, r.over.slice(0, 5));
}

if (want('cycle')) {
  const r = await h.page.evaluate(() => {
    const out = { legs: [] };
    for (let seed = 1; seed <= 6; seed++) {
      const S = E.run(E.legs(seed), 900).map(l => Object.fromEntries(Object.entries(l).map(([k, a]) => [k, a.slice(200)])));
      for (const i of [1, 2, 3]) {
        const m = S[i].mice, y = S[i].coy, xc = []; for (let lag = 0; lag <= 40; lag++) xc.push(E.xc(m, y, lag));
        const best = xc.indexOf(Math.max(...xc)), ac = []; for (let lag = 1; lag <= 120; lag++) ac.push(E.xc(m, m, lag));
        let neg = ac.findIndex(v => v < 0), per = -1; if (neg >= 0) { let b = -2; for (let k = neg; k < ac.length; k++) if (ac[k] > b) { b = ac[k]; per = k + 1; } }
        out.legs.push({ seed, leg: i, cvMice: E.r2(E.sd(m) / E.mean(m)), cvCoy: E.r2(E.sd(y) / E.mean(y)), lag: best, xc0: E.r2(xc[0]), xcBest: E.r2(xc[best]), period: per });
      }
    }
    const S1 = E.run(E.legs(3), 400);
    out.spark = { mice: E.spark(S1[1].mice.slice(100)), coy: E.spark(S1[1].coy.slice(100)), cats: E.spark(S1[1].cats.slice(100)) };
    return out;
  });
  console.log('  leg 1, 300 days:\n    mice   ' + r.spark.mice + '\n    coyote ' + r.spark.coy + '\n    cats   ' + r.spark.cats);
  for (const l of r.legs.slice(0, 6)) console.log(`  seed ${l.seed} leg ${l.leg}: mice CV ${l.cvMice}, coyotes CV ${l.cvCoy}, coyotes follow mice by ${l.lag} d (r ${l.xcBest} vs ${l.xc0} same day), a cycle ~${l.period} d`);
  ok('cycle: the mice boom and bust (CV ≥ 0.2 on every leg tried)', r.legs.every(l => l.cvMice >= 0.2), r.legs.map(l => l.cvMice));
  ok('cycle: the coyotes rise and fall too (CV ≥ 0.1)', r.legs.every(l => l.cvCoy >= 0.1), r.legs.map(l => l.cvCoy));
  ok('cycle: the coyotes follow the mice, days later (best lag +2…25 d, mostly)', r.legs.filter(l => l.lag >= 2 && l.lag <= 25 && l.xcBest > l.xc0 + 0.05).length >= r.legs.length * 0.8, r.legs.map(l => [l.lag, l.xcBest, l.xc0]));
  ok('cycle: a cycle runs weeks, not days or years (15…120 d, mostly)', r.legs.filter(l => l.period >= 15 && l.period <= 120).length >= r.legs.length * 0.7, r.legs.map(l => l.period));
}

if (want('nopred')) {
  const r = await h.page.evaluate(() => {
    const { ECO_PRED } = GAME, L = E.legs(4);
    E.run(L, 200);
    const keep = L.legs.map(g => ECO_PRED.map(j => g[j]));
    const S = E.off(ECO_PRED, () => { for (const g of L.legs) for (const j of ECO_PRED) g[j] = 0; return E.run(L, 150); });
    const full = S.map((l, i) => E.r2(E.mean(l.mice.slice(-30)) / GAME.T.eco.hab[i].mice));
    L.legs.forEach((g, i) => ECO_PRED.forEach((j, n) => { g[j] = keep[i][n]; }));
    const B = E.run(L, 120), back = B.map((l, i) => E.r2(E.mean(l.mice.slice(-40)) / GAME.T.eco.hab[i].mice));
    return { full, back };
  });
  console.log(`  no predators: mice at ${r.full.join(' ')} × K; predators back: ${r.back.join(' ')} × K`);
  ok('nopred: with no predators the mice fill the land (≥ 0.9 K on every leg)', r.full.every(v => v >= 0.9), r.full);
  ok('nopred: predators back: the mice down again (≤ 0.75 K where coyotes live)', r.back.slice(0, 4).every(v => v <= 0.75), r.back);
}

if (want('crash')) {
  const r = await h.page.evaluate(() => {
    const L = E.legs(2); E.run(L, 300);
    const g = L.legs[1], before = { mice: g.mice, coy: g.coy, fed: g.fed.coy };
    for (const o of L.legs) o.mice *= 0.05;
    const S = E.run(L, 120)[1];
    const fed5 = S.fedcoy[5], minC = Math.min(...S.coy), tMin = S.coy.indexOf(minC), back = S.mice.findIndex(v => v > before.mice * 0.5), cBack = S.coy.findIndex((v, t) => t > tMin && v > minC * 1.25);
    return { before: { mice: Math.round(before.mice), coy: E.r2(before.coy), fed: E.r2(before.fed) }, fed5: E.r2(fed5), minC: E.r2(minC), tMin, miceBack: back, coyBack: cBack, spark: { mice: E.spark(S.mice, 60), coy: E.spark(S.coy, 60) } };
  });
  console.log(`  leg 1: ${r.before.mice} mice, ${r.before.coy} coyotes (fed ${r.before.fed}); plague → day 5 fed ${r.fed5}; coyotes down to ${r.minC} by day ${r.tMin}; mice back (half) day ${r.miceBack}, coyotes rising again day ${r.coyBack}`);
  console.log('    mice   ' + r.spark.mice + '\n    coyote ' + r.spark.coy);
  ok('crash: the coyotes go hungry within days (fed < 0.85 by day 5)', r.fed5 < 0.85, r);
  ok('crash: then they dwindle (≤ 85% of before)', r.minC <= r.before.coy * 0.85, r);
  ok('crash: the mice come back (half their numbers within 60 days)', r.miceBack >= 0 && r.miceBack <= 60, r);
  ok('crash: the coyotes recover after the mice do', r.coyBack > 0 && r.coyBack >= r.miceBack, r);
}

if (want('meso')) {
  const r = await h.page.evaluate(() => {
    const with_ = E.run(E.legs(5), 800).map(l => E.mean(l.cats.slice(200)));
    const without = E.off(['coy'], () => { const L = E.legs(5); for (const g of L.legs) g.coy = 0; return E.run(L, 800).map(l => E.mean(l.cats.slice(200))); });
    return { with_: with_.map(E.r2), without: without.map(E.r2), cap: GAME.T.eco.hab.map(h => h.cats) };
  });
  console.log(`  stray cats with coyotes ${r.with_.join(' ')}; without ${r.without.join(' ')}`);
  ok('meso: no coyotes, more stray cats (every coyote leg, ≥ 1.15×)', r.with_.slice(0, 4).every((v, i) => r.without[i] >= v * 1.15), r);
  ok('meso: still held by their own crowding (≤ 3× base)', r.without.every((v, i) => v <= r.cap[i] * 3), r);
}

if (want('harvest')) {
  const r = await h.page.evaluate(() => {
    const { ecoStepLeg, ecoMove, T } = GAME;
    const base = E.run(E.legs(6), 700)[1];
    const L = E.legs(6), H = T.eco.hab, out = { mice: [], coy: [] };
    for (let t = 0; t < 700; t += 1 / 24) {   // our cats: 4 more on leg 1, each taking mice as a cat does (Holling II: fewer to find, fewer caught)
      L.legs.forEach((g, i) => ecoStepLeg(g, H[i], 1 / 24, L.R)); ecoMove(L.legs, 1 / 24);
      const C = T.eco.pred.cats, m = L.legs[1].mice; L.legs[1].mice = Math.max(0, m - 4 * C.a.mice * m / (1 + C.a.mice * C.h.mice * m) / 24);
      if (t > 200 && Math.abs(t % 1) < 1 / 48) { out.mice.push(L.legs[1].mice); out.coy.push(L.legs[1].coy); }
    }
    return { mice0: E.r2(E.mean(base.mice.slice(200))), mice1: E.r2(E.mean(out.mice)), coy0: E.r2(E.mean(base.coy.slice(200))), coy1: E.r2(E.mean(out.coy)) };
  });
  console.log(`  leg 1: mice ${r.mice0} → ${r.mice1} with 4 of our cats hunting there; coyotes ${r.coy0} → ${r.coy1}`);
  ok('harvest: our cats compete with the coyotes: the mice no more than before (± 5%)', r.mice1 <= r.mice0 * 1.05, r);
  ok('harvest: and fewer coyotes (less for them to eat)', r.coy1 < r.coy0 * 0.99, r);
  ok('harvest: the mice hold on (≥ 10% of before)', r.mice1 >= r.mice0 * 0.1, r);
}

if (want('game')) {
  const r = await h.page.evaluate(() => {
    const { G, T, step, startGame, ECO, resetEco, ecoK, ecoCoyotes, ecoCougarP, ecoHere, ecoBase, preyKill, makeSheep, wakeDens, flockCenter, ecoHunger } = GAME, out = {};
    out.off = { k: ecoK('coy'), n: ecoCoyotes(3), p: ecoCougarP() };
    startGame({ kind: 'bot', index: 0 });
    T.eco.on = true; resetEco(11);
    const li = ecoHere(), b = ecoBase()[li];
    out.li = li;
    ECO.legs[li].coy = b.coy * 2; out.many = ecoCoyotes(3);
    ECO.legs[li].coy = b.coy * 0.3; out.few = ecoCoyotes(3);
    ECO.legs[li].coy = b.coy; ECO.legs[li].fed.coy = 0.2; out.hungry = ecoHunger('coy');
    // tonight: the den near the flock wakes with as many as the land holds
    ECO.legs[li].coy = b.coy * 0.3; const p1 = wakeDens(Math.min(T.denMax, ecoCoyotes(4))); out.denFew = p1 && p1.den ? p1.den.coyotes.length : -1;
    for (const p of G.packs) GAME.setPhase(p, 'retreat');
    // the falcon's wait, cougars out
    ECO.legs[li].falcon = b.falcon * 1.6; out.falK = ecoK('falcon');
    ECO.legs[1].cougar = ecoBase()[1].cougar * 0.4; out.cougP = ecoCougarP(1);
    // a kill seen: the leg's coyotes fed, its sheep count nothing (not the model's)
    const f0 = ECO.legs[li].fed.coy, s = G.sheep.find(o => !o.ram && !o.dead); preyKill(s, 'eaten'); out.fedUp = ECO.legs[li].fed.coy > f0; out.kills = ECO.kills['coy>sheep'] || ECO.kills['coy>lamb'] || 0;
    // a cat: a stray taken is one fewer of the leg's strays; one of ours feeds them, but was never a stray
    { const g = ECO.legs[li], c0 = g.cats; GAME.ecoMeal({ isCat: true, owned: false, x: s.x, z: s.z }, 'eaten'); out.strayDown = +(c0 - g.cats).toFixed(3);
      const c1 = g.cats; GAME.ecoMeal({ isCat: true, owned: true, x: s.x, z: s.z }, 'eaten'); out.oursDown = +(c1 - g.cats).toFixed(3); }
    // an hour on: every leg stepped
    const m0 = ECO.legs.map(g => g.mice); G.clock.hour = 10; for (let i = 0; i < 40 * 40; i++) step(0.025); out.moved = ECO.legs.filter((g, i) => g.mice !== m0[i]).length;
    T.eco.on = false;
    return out;
  });
  console.log(`  leg ${r.li}: tonight's coyotes (3 by the day's count): many ${r.many}, few ${r.few}; a den in lean times ${r.denFew}; falcon × ${r.falK}; a cougar hunts p ${r.cougP}`);
  ok('game: off (?sim): all × 1', r.off.k === 1 && r.off.n === 3 && r.off.p === 1, r.off);
  ok('game: more coyotes when the land holds many, fewer when few', r.many > 3 && r.few < 3 && r.few >= 1, r);
  ok('game: a den in lean times wakes fewer', r.denFew >= 1 && r.denFew <= 2, r);
  ok('game: hungry coyotes (fed low): ecoHunger up', r.hungry > 0.6, r);
  ok('game: the falcon comes more often when there are more', r.falK > 1.3, r);
  ok('game: few cougars: some nights one just watches', r.cougP < 0.6, r);
  ok('game: a kill in the game feeds the leg\'s coyotes', r.fedUp && r.kills >= 1, r);
  ok('game: a stray cat taken: one fewer stray; one of ours: none fewer', r.strayDown === 1 && r.oursDown === 0, r);
  ok('game: every leg stepped as the hours pass', r.moved === 5, r);
}

if (want('save')) {
  const r = await h.page.evaluate(() => {
    const { T, ECO, resetEco, startGame, JOURNEY, JOURNEY_KEY, journeySave } = GAME;
    localStorage.clear(); JOURNEY.off = false;
    startGame({ kind: 'bot', index: 0 }); T.eco.on = true; resetEco(21);
    const vals = () => ECO.legs.flatMap(g => [g.mice, g.coy, g.cats, g.fed.coy]), snap = vals(), same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 0.006 + Math.abs(v) * 1e-4);
    const saved = journeySave(), part = JSON.parse(localStorage.getItem(JOURNEY_KEY) || '{}').parts?.eco;
    resetEco(99); const moved = !same(vals(), snap);
    JOURNEY.saved = JSON.parse(localStorage.getItem(JOURNEY_KEY)); GAME.journeyResume();
    const after = vals();
    T.eco.on = false; JOURNEY.off = true; localStorage.clear();
    return { saved, part: !!part, moved, same: same(after, snap) };
  });
  ok('save: a reload: the same numbers on every leg', r.saved && r.part && r.moved && r.same, r);
}

if (want('migrate')) {
  const r = await h.page.evaluate(() => {
    const { ecoDisperse, ecoMate, ecoStepLeg, T, ECO_PRED } = GAME, out = {};
    // three days of it from one start: who leaves leg 1, where they go
    const go = prep => { const L = E.legs(7); E.run(L, 200); prep(L.legs); const mv = []; GAME.ecoRun(L.legs, 3, L.R, 1 / 24, null, (j, i, k, n) => { if (j === 'coy' && i === 1) mv.push([k, n]); }); const n0 = L.n0; const tot = mv.reduce((a, [, n]) => a + n, 0); return { tot, far: mv.filter(([k]) => Math.abs(k - 1) >= 2).reduce((a, [, n]) => a + n, 0) / (tot || 1), to0: mv.filter(([k]) => k === 0).reduce((a, [, n]) => a + n, 0), to2: mv.filter(([k]) => k === 2).reduce((a, [, n]) => a + n, 0) }; };
    const H = T.eco.hab;
    out.fed = go(L => { L[1].mice = H[1].mice; L[1].fed.coy = 1.3; L[1].coy = 15; });
    out.starve = go(L => { L[1].mice = H[1].mice * 0.02; L[1].fed.coy = 0.12; L[1].coy = 15; L[0].mice = H[0].mice; L[2].mice = H[2].mice * 0.05; });
    // an emptied leg: filled again from its neighbours
    { const L = E.legs(8); E.run(L, 200); L.legs[2].coy = 0; let inn = 0; const keep = T.eco.pred.coy.in; T.eco.pred.coy.in = 0;
      GAME.ecoRun(L.legs, 20, L.R, 1 / 24, null, (j, i, k, n) => { if (j === 'coy' && k === 2) inn += n; }); T.eco.pred.coy.in = keep;
      out.refill = { n: E.r2(L.legs[2].coy), base: E.r2(GAME.ecoBase()[2].coy), inn: E.r2(inn) }; }
    // lonely: few about (fed well), more of them set off a head
    const lone = n => { const L = E.legs(9); E.run(L, 100); L.legs[1].coy = n; L.legs[1].fed.coy = 1.1; let o = 0; ecoDisperse(L.legs, 1 / 24, (j, i, k, m) => { if (j === 'coy' && i === 1) o += m; }); return o / n; };
    out.lone = { few: lone(0.6), many: lone(15) };
    out.mate = { few: E.r2(ecoMate('coy', 0.5)), base: E.r2(ecoMate('coy', 15)), cougar1: E.r2(ecoMate('cougar', 1)) };
    // the game's reach
    const { ECO, resetEco, ecoReach, ecoHere } = GAME; out.reachOff = ecoReach('coy');
    GAME.startGame({ kind: 'bot', index: 0 }); T.eco.on = true; resetEco(3); const li = ecoHere(); ECO.legs[li].fed.coy = 1.2; out.reachFed = E.r2(ecoReach('coy')); ECO.legs[li].fed.coy = 0; out.reachHungry = E.r2(ecoReach('coy')); T.eco.on = false;
    for (const k of ['fed', 'starve']) for (const x in out[k]) out[k][x] = E.r2(out[k][x]);
    return out;
  });
  console.log(`  leg 1, 3 days: fed ${r.fed.tot} coyotes off (${r.fed.far} of them 2+ legs); starving ${r.starve.tot} off (${r.starve.far} 2+ legs; to the fed desert ${r.starve.to0}, the eaten-out coast ${r.starve.to2})`);
  console.log(`  an emptied leg: ${r.refill.n} coyotes (base ${r.refill.base}) 20 days on, ${r.refill.inn} came in; a mate found: few ${r.mate.few}, many ${r.mate.base}; set off a day a head: few ${r.lone.few.toFixed(3)}, many ${r.lone.many.toFixed(3)}; reach × ${r.reachFed} fed, ${r.reachHungry} starving`);
  ok('migrate: starving coyotes leave far faster than fed ones (≥ 4×)', r.starve.tot >= r.fed.tot * 4, r);
  ok('migrate: the hungry look further (≥ 20% go 2+ legs; fed ≤ 10%)', r.starve.far >= 0.2 && r.fed.far <= 0.1, r);
  ok('migrate: toward food (more to the fed leg than the eaten-out one)', r.starve.to0 >= r.starve.to2 * 1.5, r);
  ok('migrate: an emptied leg is filled again from its neighbours (≥ 25% of base in 20 days)', r.refill.n >= r.refill.base * 0.25 && r.refill.inn > 1, r.refill);
  ok('migrate: few about: fewer find a mate; more set off to look', r.mate.few < 0.3 && r.mate.base > 0.85 && r.lone.few > r.lone.many * 1.5, r);
  ok('migrate: in the game, hungry coyotes come from further (× 1 off and fed, more starving)', r.reachOff === 1 && r.reachFed === 1 && r.reachHungry >= 1.5, r);
}

if (chart) {
  const S = await h.page.evaluate(() => E.run(E.legs(3), 400)[1]);
  const W = 900, H = 260, pad = 30, days = S.mice.length - 100, sl = a => a.slice(100);
  const line = (a, col, k) => { const v = sl(a), hi = Math.max(...v) * 1.05; return `<polyline fill="none" stroke="${col}" stroke-width="2" points="${v.map((y, i) => `${(pad + i / (days - 1) * (W - 2 * pad)).toFixed(1)},${(H - pad - y / hi * (H - 2 * pad)).toFixed(1)}`).join(' ')}"/><text x="${W - pad + 4}" y="${(H - pad - v.at(-1) / hi * (H - 2 * pad)).toFixed(0)}" fill="${col}" font-size="12">${k}</text>`; };
  fs.writeFileSync(chart, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W + 60} ${H}" font-family="sans-serif"><rect width="100%" height="100%" fill="#fbf8f0"/>${line(S.mice, '#8a6a3a', 'mice')}${line(S.coy, '#c0502a', 'coyotes')}${line(S.cats, '#3a7a9a', 'cats')}${line(S.falcon, '#5a5a8a', 'falcons')}<text x="${pad}" y="18" font-size="13">Mountain leg, 300 days (each line scaled to its own peak)</text></svg>`);
  console.log('chart: ' + chart);
}

if (h.errors.length) ok('no page errors', false, h.errors.slice(0, 3));
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
