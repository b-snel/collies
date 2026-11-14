// Headless checks for LINEAGE (KIN) and new blood: `node tools/kin-test.mjs [lines|court|save|tree|barn|dawn|vag|wild|catch|cast|reset]`.
//   lines  every sheep a record; founders no parents; the first lambs, their mums' and a ram's. F: ram × daughter and full sibs 1/4, half
//          sibs 1/8, strangers 0. Born inbred: shorter lived, less brave, smaller, less hardy, slower fleece; a close pair, fewer lambs
//   court  a ram courting his daughter in a shut pen: 🧬, Hank's word; her lambs at dawn: his and hers, F 1/4
//   save   a new journey (FLOCK SAVE): the same sheep, the same lines (a dead forebear's record kept); a reload (JOURNEY SAVE): the same
//   tree   the tree: forebears (sire left, dam right), one twice ringed, unknown ones '?', lambs below
//   barn   🌳 in the barn: the picked sheep's tree; a node: its tree, ↶ back; ♥ who a ram could breed with, kin flagged; dots in the list
//   dawn   a new lamb's 🌳 on the dawn card: its tree over it; Esc: back
//   vag    the vagabond's ram: on land, for 🧶, one a pitch, not at sea; new blood (🎒), on the next dawn card
//   wild   wild rams: 1–2 a journey on land legs, well off the trail, the castaway on an island (off in ?sim); a dog walking at one: off,
//          creeping: it stays
//   catch  a dog with a rope creeps up: a tug; just holding: he wins, bolts, wary; heaving on the beat: broken, led; to the flock: a sheep,
//          new blood (🌿), his name and fleece
//   cast   alongside his island: on it; a dog by him: he follows; the dog aboard: he hops on, one of the flock (🏖); under way: not there
//   reset  a new journey: new wild rams, the family kept
import { open } from './harness.mjs';
const only = process.argv[2];
let h = await open(), fails = 0;
const errors = [];
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const want = k => !only || only === k;
const setup = async (query) => { errors.push(...h.errors); await h.close(); h = await open(query ? { query } : undefined); return h.page.evaluate(() => {
  const { G, T, step, startGame, groundY, CAM_R, CAM_F, pathPoint, HANK, makeSheep, kinBorn } = GAME;
  try { localStorage.clear(); } catch (e) {}
  startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {}; G.clock.hour = 10;
  for (const c of G.coyotes) c.gone = true;
  const H = window.H = {};
  H.inp = (dx, dz, x = {}) => { const l = Math.hypot(dx, dz) || 1; return { mx: (dx * CAM_R.x + dz * CAM_R.z) / l, my: -(dx * CAM_F.x + dz * CAM_F.z) / l, ...x }; };
  H.run = (sec, fn) => { for (let t = 0; t < sec - 1e-9; t += 0.025) { if (fn && fn(t)) return t; step(0.025); } return sec; };
  H.place = (e, x, z, yaw) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); if (yaw !== undefined) e.yaw = yaw; };
  H.at = (s = 170, lat = 0) => pathPoint(s, lat);
  H.r = v => +(+v).toFixed(3);
  H.far = (x, z) => { G.sheep.forEach((o, i) => { H.place(o, x + 60 + (i % 6) * 2, z + 60 + Math.floor(i / 6) * 2); o.pen = null; }); H.place(HANK, x + 70, z + 50); };
  H.flock = (x, z) => G.sheep.forEach((o, i) => { if (o.dead) return; const a = i * 2.4, r = 1.2 + 0.5 * Math.sqrt(i); H.place(o, x + Math.cos(a) * r, z + Math.sin(a) * r); o.pen = null; o.hunger = 0.2; });
  H.onBeat = (d, R) => { const U = R.tug, bi = U ? Math.floor((G.time - U.t0) / T.rope.tug.beat.T + 1e-6) : -1, on = !!U && bi >= 0 && bi !== d._bi; d._bi = bi; return on; };
  H.line = (R, x0, z0, dx, dz) => { for (let k = 0; k < R.n; k++) { const x = x0 + dx * k * T.rope.seg, z = z0 + dz * k * T.rope.seg; R.x[k] = R.px[k] = x; R.z[k] = R.pz[k] = z; R.y[k] = R.py[k] = groundY(x, z) + T.rope.r; R.gy[k] = groundY(x, z); } GAME.ropeSim(R, 0.025); };
  // a lamb of mum's by sire, grown (a ewe, or a ram)
  H.kid = (mum, sire, name, ram = false) => { const l = makeSheep(mum.x + 1, mum.z, { lamb: true, mother: mum }); l.name = name; kinBorn(l, mum, sire ? sire.lid : 0); G.sheep.push(l); l.lamb = false; l.age = 4; if (ram) l.ram = true; return l; };
  return true;
}); };

if (want('lines')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, KIN, kinRec, kinF, kinPair, kinFert, makeSheep, kinBorn } = GAME, out = {};
    const live = G.sheep.filter(s => !s.dead);
    out.all = live.every(s => s.lid > 0 && kinRec(s.lid)); out.recs = KIN.recs.size;
    const adults = live.filter(s => !s.lamb), lambs = live.filter(s => s.lamb), rams = adults.filter(s => s.ram);
    out.founders = adults.every(s => !kinRec(s.lid).m && !kinRec(s.lid).f);
    out.lambs = lambs.every(l => kinRec(l.lid).m === l.mother.lid && rams.some(r => r.lid === kinRec(l.lid).f));
    const ram = rams[0], [e1, e2] = adults.filter(s => !s.ram), ram2 = rams[1];
    const d = H.kid(e1, ram, 'Dot'), sib = H.kid(e1, ram, 'Sib'), half = H.kid(e2, ram, 'Half'), other = H.kid(e2, ram2, 'Other');
    out.F = { ramXdaughter: kinPair(ram, d), fullSibs: kinPair(d, sib), halfSibs: kinPair(d, half), strangers: kinPair(e1, e2), cousinsNot: kinPair(d, other) };
    // born inbred: the same lamb, born of strangers and born of ram × daughter
    const base = makeSheep(d.x, d.z, { lamb: true, mother: d }), keep = { life: base.life, brave: base.brave, scale: base.scale, starveMax: base.starveMax, parchMax: base.parchMax, saltMax: base.saltMax };
    const F = kinBorn(base, d, ram.lid), K = T.kin;
    out.born = { F, life: [keep.life, base.life], brave: [H.r(keep.brave), H.r(base.brave)], scale: [H.r(keep.scale), H.r(base.scale)], starve: H.r(base.starveMax / keep.starveMax) };
    out.costs = Math.abs(base.life - Math.max(T.adultDays, Math.round(keep.life * (1 - K.life * F)))) < 1 && base.brave < keep.brave && base.scale < keep.scale && Math.abs(base.starveMax / keep.starveMax - (1 - K.hardy * F)) < 1e-6 && base.inF === F;
    d.sireLid = ram.lid; out.fert = H.r(kinFert(d)); e1.sireLid = ram.lid; out.fertOut = H.r(kinFert(e1));
    // slower fleece
    G.sheep.push(base); base.lamb = false; const a = G.sheep.find(s => s.lamb === false && !s.ram && s.inF === 0 && s !== base);
    for (const s of [a, base]) { s.wool = 0.2; s.state = 'idle'; }
    H.run(3600 / 13 / 3);   // (a few game hours)
    out.wool = { out: H.r(a.wool - 0.2), in: H.r(base.wool - 0.2) };
    return out;
  });
  ok(`every sheep a record (${r.recs}); founders no parents; the first lambs: their mum's and a ram's`, r.all && r.founders && r.lambs, r);
  ok(`F: ram × daughter ${r.F.ramXdaughter}, full sibs ${r.F.fullSibs}, half sibs ${r.F.halfSibs}, strangers ${r.F.strangers}`, r.F.ramXdaughter === 0.25 && r.F.fullSibs === 0.25 && r.F.halfSibs === 0.125 && r.F.strangers === 0 && r.F.cousinsNot === 0, r.F);
  ok(`born inbred (F ${r.born.F}): life ${r.born.life.join(' → ')}, brave ${r.born.brave.join(' → ')}, size ${r.born.scale.join(' → ')}, hardiness ×${r.born.starve}`, r.costs && r.born.F === 0.25, r.born);
  ok(`a close pair, fewer lambs (lamb chance ×${r.fert}; strangers ×${r.fertOut})`, Math.abs(r.fert - 0.7) < 1e-6 && r.fertOut === 1, r);
  ok(`slower fleece, inbred (${r.wool.in} vs ${r.wool.out})`, r.wool.in > 0 && r.wool.in < r.wool.out * 0.8, r.wool);
}

if (want('court')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, KIN, kinRec, pens, setGate, HANK, lambsAtDawn } = GAME, out = {}, pen = pens[0];
    const ram = G.sheep.find(s => s.ram), mum = G.sheep.find(s => !s.ram && !s.lamb), dau = H.kid(mum, ram, 'Dot');
    for (const s of G.sheep) if (s !== ram && s !== dau) { H.place(s, pen.x + 80, pen.z + 80); s.pen = null; }
    H.place(ram, pen.x + 1, pen.z); H.place(dau, pen.x - 1, pen.z); for (const s of [ram, dau]) { s.hunger = 0.1; s.pen = pen; }
    H.place(HANK, pen.x + 3, pen.z + 3); setGate(pen, false); pen.gateT = 0; G.clock.hour = 17;
    const said = []; const hk = GAME.hank; window._said = said;
    H.run(30, () => dau.bred); out.bred = dau.bred; out.sire = dau.sireLid === ram.lid; out.kin = H.r(ram.courtKin || 0); out.said = !!KIN.said.court;
    T.lambChance = 5; G.clock.hour = 5.9; const n0 = G.sheep.length; lambsAtDawn();
    const l = G.sheep.slice(n0).find(s => s.lamb); out.lamb = l ? { m: kinRec(l.lid).m === dau.lid, f: kinRec(l.lid).f === ram.lid, F: l.inF } : null;
    return out;
  });
  ok(`a ram courting his daughter: 🧬 (${r.kin}), Hank's word; bred, his`, r.bred && r.sire && r.kin === 0.25 && r.said, r);
  ok(`her lamb at dawn: hers and his, F ${r.lamb && r.lamb.F}`, r.lamb && r.lamb.m && r.lamb.f && r.lamb.F === 0.25, r);
}

if (want('save')) {
  await setup();
  let r = await h.page.evaluate(() => {
    const { G, KIN, kinRec, saveFlock, resetGame, killSheep, living } = GAME, out = {};
    const ram = G.sheep.find(s => s.ram), mum = G.sheep.find(s => !s.ram && !s.lamb), dau = H.kid(mum, ram, 'Dot'), g = H.kid(dau, ram, 'Gran');
    g.renamed = true; out.g = { lid: g.lid, F: g.inF }; out.mumLid = mum.lid;
    killSheep(mum, 'old');   // a forebear, gone
    saveFlock(); out.before = KIN.recs.size;
    resetGame(); G.players[0].bot = {};
    const g2 = living().find(s => s.name === 'Gran');
    out.after = g2 ? { lid: g2.lid, F: g2.inF, mum: kinRec(g2.lid) && kinRec(g2.lid).m, gone: kinRec(out.mumLid) ? kinRec(out.mumLid).x : null } : null;
    out.allTagged = living().every(s => kinRec(s.lid));
    GAME.JOURNEY.off = false; GAME.journeySave();
    out.recs = KIN.recs.size;
    return out;
  });
  ok(`a new journey: the same sheep, the same line (F ${r.after && r.after.F}); a dead forebear's record kept (${r.after && r.after.gone})`,
    r.after && r.after.lid === r.g.lid && r.after.F === r.g.F && r.after.mum > 0 && r.after.gone === 'old' && r.allTagged, r);
  const before = r;
  await h.page.reload(); await h.page.waitForFunction(() => window.GAME, null, { timeout: 60000 });
  r = await h.page.evaluate(() => { const J = GAME.JOURNEY; J.off = false; J.saved = GAME.journeyRead(); GAME.startGame({ kind: 'bot', index: 0 });
    const g = GAME.living().find(s => s.name === 'Gran'); return { resumed: J.resumed, recs: GAME.KIN.recs.size, g: g && { lid: g.lid, F: g.inF }, tagged: GAME.living().every(s => GAME.kinRec(s.lid)) }; });
  ok(`a reload: the same records (${r.recs}), the same line`, r.resumed && r.recs === before.recs && r.g && r.g.lid === before.after.lid && r.g.F === before.after.F && r.tagged, r);
}

if (want('tree') || want('barn') || want('dawn')) {
  await setup();
  // a line: the ram sires Dot; Dot × the ram: Pip; Clover × the ram: Rocky (a ram); Pip × Rocky: Wee Tam (the ram twice up her tree)
  await h.page.evaluate(() => {
    const { G } = GAME, ram = G.sheep.find(s => s.ram), ewes = G.sheep.filter(s => !s.ram && !s.lamb);
    const dot = H.kid(ewes[0], ram, 'Dot'), clo = H.kid(ewes[1], ram, 'Clover'), pip = H.kid(dot, ram, 'Pip'), rocky = H.kid(clo, ram, 'Rocky', true), tam = H.kid(pip, rocky, 'Wee Tam');
    for (let i = 0; i < 3; i++) H.kid(pip, ram, 'Kid' + i);
    window.LN = { ram: ram.lid, pip: pip.lid, rocky: rocky.lid, tam: tam.lid, tamF: tam.inF, ramName: ram.name };
  });
  if (want('tree')) {
    const r = await h.page.evaluate(() => {
      const el = document.createElement('div'); el.innerHTML = GAME.kinTreeHTML(LN.tam); const q = s => [...el.querySelectorAll(s)];
      const node = id => q(`.kinNode[data-kin="${id}"]`);
      return { root: q('.kinNode.g0').length === 1 && q('.kinNode.g0')[0].dataset.kin === String(LN.tam), sire: node(LN.rocky)[0]?.classList.contains('g1'), dam: node(LN.pip)[0]?.classList.contains('g1'),
        sireLeft: parseFloat(node(LN.rocky)[0]?.style.left) < parseFloat(node(LN.pip)[0]?.style.left), ramTwice: node(LN.ram).length, ringed: node(LN.ram).every(n => n.classList.contains('dup')), arcs: q('.dupL').length,
        unk: q('.kinNode.unk').length, F: el.querySelector('.kinF .pc')?.textContent, kids: (() => { el.innerHTML = GAME.kinTreeHTML(LN.pip); return el.querySelectorAll('.kinNode.kid').length; })() };
    });
    ok(`the tree: root, sire left (Rocky), dam right (Pip); the ram twice (${r.ramTwice}), ringed, a dotted line between; '?' for unknown (${r.unk}); 🧬 ${r.F}`,
      r.root && r.sire && r.dam && r.sireLeft && r.ramTwice >= 2 && r.ringed && r.arcs >= 1 && r.unk >= 2 && r.F === '28%', r);
    ok(`lambs below (Pip's: ${r.kids})`, r.kids === 4, r);
  }
  if (want('barn')) {
    const r = await h.page.evaluate(() => {
      const { G, BARN, openBarn, barnTab, closeBarn } = GAME, tam = G.sheep.find(s => s.lid === LN.tam), out = {};
      openBarn(tam); barnTab('kin');
      const box = () => document.querySelector('#barnKin .kinTree');
      out.tab = BARN.tab === 'kin' && !!box() && box().dataset.root === String(LN.tam);
      out.dots = document.querySelectorAll('#barnList .kinDot').length;
      document.querySelector(`#barnKin .kinNode[data-kin="${LN.rocky}"]`).click();
      out.went = box().dataset.root === String(LN.rocky) && BARN.sel && BARN.sel.lid === LN.rocky && !!document.querySelector('#barnKin [data-kinback]');
      out.mates = [...document.querySelectorAll('#barnKin .kinMate')].map(b => b.textContent);
      document.querySelector('#barnKin [data-kinback]').click(); out.back = box().dataset.root === String(LN.tam);
      // a ram's ♥: his daughter's flagged
      const ram = G.sheep.find(s => s.lid === LN.ram); GAME.barnSelect(ram);
      out.ramMates = [...document.querySelectorAll('#barnKin .kinMate')].map(b => ({ n: b.textContent, warn: !!b.querySelector('small') }));
      closeBarn(); return out;
    });
    const dot = r.ramMates.find(m => m.n.startsWith('Dot'));
    ok(`🌳 in the barn: the picked sheep's tree; its list: inbred dots (${r.dots}); a node: its tree, ↶ back`, r.tab && r.dots >= 3 && r.went && r.back, r);
    ok(`♥ a ram's mates (${r.ramMates.length}): his daughter flagged`, r.ramMates.length >= 4 && dot && dot.warn && r.ramMates.some(m => !m.warn), r);
  }
  if (want('dawn')) {
    const r = await h.page.evaluate(() => {
      const { G, DAWN, openDawn, closeDawn } = GAME, tam = G.sheep.find(s => s.lid === LN.tam), out = {};
      openDawn([tam], []); DAWN.t0 = -1e9;
      const row = document.querySelector('#dawn .dawnRow'); out.tag = !!row.querySelector('.kinTag');
      row.querySelector('[data-tree]').click(); const pop = () => document.querySelector('#dawn .kinPop');
      out.pop = !!pop() && pop().querySelector('.kinTree').dataset.root === String(LN.tam);
      pop().querySelector(`.kinNode[data-kin="${LN.pip}"]`).click(); out.went = pop().querySelector('.kinTree').dataset.root === String(LN.pip);
      dispatchEvent(new KeyboardEvent('keydown', { code: 'Backspace' })); out.back = pop().querySelector('.kinTree').dataset.root === String(LN.tam);
      dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' })); out.shut = !pop() && DAWN.open;
      closeDawn(); return out;
    });
    ok(`a new lamb on the dawn card: 🧬, 🌳 → its tree over it; a node: its tree; Backspace back; Esc: the card`, r.tag && r.pop && r.went && r.back && r.shut, r);
  }
}

if (want('vag')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, VAG, VSTALL, buyWare, kinRec, vagRamStock, SEA, KIN } = GAME, out = {}, w = VSTALL.wares.find(o => o.id === 'ram');
    VAG.mode = 'land'; VAG.pi = 0; VAG.ramAt = -1; out.shown = vagRamStock();
    G.wool = 5; out.poor = buyWare(w);
    G.wool = 40; const n0 = G.sheep.length; out.buy = buyWare(w); const s = G.sheep[n0];
    out.ram = s ? { ram: s.ram, src: kinRec(s.lid).s, near: Math.hypot(s.x - w.x, s.z - w.z) < 1, paid: 40 - G.wool === T.vendor.ram.price } : null;
    G.wool = 40; out.again = buyWare(w); out.stockAfter = vagRamStock(); VAG.pi = 1; out.nextPitch = vagRamStock();
    out.newcomer = KIN.newcomers.includes(s);
    SEA.on = true; out.sea = vagRamStock(); SEA.on = false;
    return out;
  });
  ok(`the vagabond's ram: shown on land; no 🧶: no (${r.poor}); bought (${r.buy}): a ram by the mat, new blood (${r.ram && r.ram.src}), paid`, r.shown && r.poor === 'poor' && r.buy === 'buy' && r.ram && r.ram.ram && r.ram.src === 'vag' && r.ram.near && r.ram.paid, r);
  ok(`one a pitch (again: ${r.again}); the next pitch: another; never at sea; on the next dawn card`, r.again === 'full' && !r.stockAfter && r.nextPitch && !r.sea && r.newcomer, r);
}

if (want('wild') || want('reset')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { T, WILDS, WILD, wildReset, sAt, CAMPS, canyonK, passK, inSea, sdfAt } = GAME, out = { simOff: WILDS.length === 0 && !T.wild.on, seeds: [] };
    T.wild.on = true;
    for (const seed of [1, 7, 42, 1234, 99999, 31337, 5, 2024]) {
      wildReset(seed);
      const land = WILDS.filter(W => W.kind === 'wild'), legs = land.map(W => CAMPS.findIndex((c, i) => sAt(W.x, W.z) > c.s && sAt(W.x, W.z) < (CAMPS[i + 1] || { s: 1e9 }).s));
      out.seeds.push({ n: land.length, legs: legs.join(''), cast: WILDS.filter(W => W.kind === 'isle').length, isle: WILD.isle,
        lat: Math.round(Math.min(...land.map(W => Math.abs(GAME.trailInfo(W.x, W.z).lat)))), bad: land.filter(W => canyonK(sAt(W.x, W.z)) > 0 || passK(sAt(W.x, W.z)) > 0 || inSea(W.x, W.z) || sdfAt(W.x, W.z) < 1).length });
    }
    return out;
  });
  if (want('wild')) {
    ok('off in ?sim (none)', r.simOff, r);
    ok(`1–2 a journey (${r.seeds.map(q => q.n).join(' ')}), legs ${r.seeds.map(q => q.legs).join(' ')}, ≥ ${Math.min(...r.seeds.map(q => q.lat))} m off the trail; a castaway on island ${r.seeds.map(q => q.isle).join('')}`,
      r.seeds.every(q => q.n >= 1 && q.n <= 2 && !q.legs.includes('0') && !q.legs.includes('-') && q.lat >= 10 && q.bad === 0 && q.cast === 1 && q.isle >= 1 && q.isle <= 4), r);
    const s = await h.page.evaluate(() => {
      const { G, T, WILDS, makeWild } = GAME, p = H.at(200, 0), d = G.dogs[0], out = {};
      for (const W of [...WILDS]) GAME.wildRemove(W); H.far(p.x, p.z);
      const W = makeWild({ x: p.x + 8, z: p.z, yaw: 0 });
      H.place(d, p.x - 6, p.z, Math.PI / 2); d.player.bot = H.inp(1, 0); H.run(2, () => W.state === 'flee'); out.walk = W.state;
      d.player.bot = {}; H.run(6); const W2 = makeWild({ x: p.x + 40, z: p.z + 2, yaw: 0 }); H.place(d, p.x + 33, p.z + 2, Math.PI / 2);
      let fled = false; H.run(6, () => { d.player.bot = H.inp(W2.x - d.x, W2.z - d.z, { creep: true }); fled = fled || W2.state === 'flee'; return Math.hypot(d.x - W2.x, d.z - W2.z) < 3; });
      d.player.bot = {}; H.run(0.5); out.creep = { state: fled ? 'flee' : W2.state, d: H.r(Math.hypot(W2.x - d.x, W2.z - d.z)) };
      return out;
    });
    ok(`a dog walking at him: off (${s.walk}); creeping up: he stays (${s.creep.state}, ${s.creep.d} m)`, s.walk === 'flee' && s.creep.state !== 'flee' && s.creep.d < 4, s);
  }
}

if (want('catch')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, WILDS, makeWild, ROPES, kinRec, living } = GAME, out = {};
    T.wild.on = true;
    const roped = () => { const R = ROPES[0], d = G.dogs[0], p = H.at(170, 0); H.far(p.x, p.z); H.line(R, p.x - 6, p.z, 1, 0); H.place(d, R.x[4] - 1.05, R.z[4], Math.PI / 2); d.player.bot = { grab: true }; GAME.step(0.025); GAME.step(0.025);
      R.tugCd = 0; const W = makeWild({ x: d.x + 2.2, z: d.z, yaw: Math.PI / 2 }); return { R, d, W }; };
    let { R, d, W } = roped(); const p0 = d.player;
    H.run(1, () => !!R.tug); out.tug = !!R.tug && R.wild === W && W.state === 'tug';
    H.run(25, () => !R.tug); out.lose = { state: W.state, wary: W.waryH > 0, off: !W.rope && !R.wild };
    p0.bot = {}; H.run(0.3); for (const o of [...WILDS]) GAME.wildRemove(o);
    ({ R, d, W } = roped());
    H.run(1, () => !!R.tug);
    const end = H.run(30, () => { if (!R.tug) return true; const U = R.tug, sd = d.tugSide || -1; d.stamina = Math.max(d.stamina, 0.5); p0.bot = H.inp(sd * U.ux, sd * U.uz, { grab: true, pounce: H.onBeat(d, R) }); });
    p0.bot = { grab: true }; H.run(0.2); out.win = { secs: H.r(end), state: W.state, held: d.holding === R && R.wild === W };
    if (W.state !== 'led') return out;
    const fp = H.at(230, 0); H.flock(fp.x, fp.z); const name = W.name, n0 = living().length;
    const t = H.run(60, () => { p0.bot = H.inp(fp.x - d.x, fp.z - d.z, { grab: true }); return !WILDS.includes(W); });
    p0.bot = {}; H.run(0.1);
    const s = living().find(o => o.name === name);
    out.join = { secs: H.r(t), n: living().length - n0, ram: s && s.ram, src: s && kinRec(s.lid).s, wool: s && s.look && s.look.wool === T.wild.wool, off: !R.wild };
    return out;
  });
  ok(`a dog with a rope creeps up: a tug; just holding: he wins, bolts, wary (${r.lose && r.lose.state})`, r.tug && r.lose.state === 'flee' && r.lose.wary && r.lose.off, r);
  ok(`heaving on the beat: broken (${r.win && r.win.secs} s), led`, r.win && r.win.state === 'led' && r.win.held, r);
  ok(`led to the flock (${r.join && r.join.secs} s): one of them, a ram, new blood (${r.join && r.join.src}), his fleece`, r.join && r.join.n === 1 && r.join.ram && r.join.src === 'wild' && r.join.wool && r.join.off, r);
}

if (want('cast')) {
  await setup();
  const r = await h.page.evaluate(() => {
    const { G, T, WILDS, WILD, wildReset, seaStart, seaGround, onDeck, kinRec, living, DECK } = GAME, out = {};
    T.wild.on = true; wildReset(42); const W = WILDS.find(o => o.kind === 'isle');
    seaStart({ leg: WILD.isle }); H.run(0.5);
    out.on = !W.off && seaGround(W.x, W.z) > 0.3 && !onDeck(W.x, W.z, -1);
    const d = G.dogs[0]; H.place(d, W.x + 3, W.z, -Math.PI / 2); H.run(0.5); out.follow = W.state === 'follow' && W.dog === d;
    // the dog walks back aboard, the way it came: up the beach to the pier, along it, the quay, the gangway
    const name = W.name, n0 = living().length, Q = GAME.QUAY, B = GAME.boatXZ, way = [B(Q.pu, Q.shore - 4), B(Q.pu, Q.v0 + 2), B(Q.gu, Q.v1 - 1), B(Q.gu, Q.gv + 3), B(-6, 0)]; let k = 0;
    const t = H.run(120, () => { const q = way[k], dx = q.x - d.x, dz = q.z - d.z; if (Math.hypot(dx, dz) < 1.2 && k < way.length - 1) k++;
      d.player.bot = Math.hypot(dx, dz) > 0.8 || W.state === 'follow' && Math.hypot(W.x - d.x, W.z - d.z) > 4 ? (Math.hypot(W.x - d.x, W.z - d.z) > 5 ? {} : H.inp(dx, dz, { creep: true })) : {};
      return !WILDS.includes(W); });
    d.player.bot = {}; out.way = k;
    const s = living().find(o => o.name === name);
    out.join = { secs: H.r(t), n: living().length - n0, src: s && kinRec(s.lid).s, aboard: s && onDeck(s.x, s.z) };
    wildReset(42); const W2 = WILDS.find(o => o.kind === 'isle'); seaStart({ leg: WILD.isle, under: true }); H.run(0.5); out.under = W2.off;
    return out;
  });
  ok(`alongside his island: the castaway's on it; a dog by him: he follows`, r.on && r.follow, r);
  ok(`the dog aboard: he hops on (${r.join.secs} s), one of the flock, new blood (${r.join.src})`, r.join.n === 1 && r.join.src === 'isle' && r.join.aboard, r);
  ok('under way: not there', r.under, r);
}

if (want('reset')) {
  const r = await h.page.evaluate(() => {
    const { G, T, WILDS, WILD, KIN, resetGame, saveFlock } = GAME, out = {};
    T.wild.on = true; GAME.wildReset(7); const s0 = WILD.seed, recs = KIN.recs.size; saveFlock();
    resetGame(); G.players[0].bot = {};
    out.newSeed = WILD.seed !== s0; out.n = WILDS.filter(W => W.kind === 'wild').length; out.kept = KIN.recs.size >= recs - 2 && KIN.recs.size > 0;
    return out;
  });
  ok(`a new journey: new wild rams (${r.n}), the family kept`, r.newSeed && r.n >= 1 && r.kept, r);
}

errors.push(...h.errors);
ok('no page errors', !errors.length);
if (errors.length) console.log('PAGE ERRORS', errors.slice(0, 3));
await h.close();
process.exit(fails ? 1 : 0);
