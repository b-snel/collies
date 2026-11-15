// Headless checks for SELLING sheep to the vagabond: `node tools/sell-test.mjs`.
// Checks: what he pays goes with the sheep: a prime ewe in full fleece beats a lamb, an old one, a shorn one, a sick one, a starving one,
//   an inbred one; a ram beats a ewe, the champion beats them all; a grumpy vagabond pays less; ★ 1–5 follow. On the 🐑 mat: nothing on
//   it: no sale; the first bark, his price (✔?), the second: sold (🧶 in, the sheep gone, not lost: no eulogy, no remains; its record
//   'sold', 🧶 in its tree); carried on in the dog's jaws: the same; one bark, a wait past `confirm`, a bark: asked again, not sold
import { open } from './harness.mjs';
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const r = await h.page.evaluate(() => {
  const { G, T, startGame, makeSheep, step, VSTALL, VAG, buyWare, kinRec, kinTreeHTML, groundY, kinBorn, living } = GAME, out = {};
  startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {}; G.clock.hour = 10;
  const w = VSTALL.wares.find(o => o.id === 'sell'), d = G.dogs[0], put = (e, x, z) => { e.x = x; e.z = z; e.vx = e.vz = 0; e.y = groundY(x, z); };
  VAG.griev = 0; VAG.good = 0;
  // what each is worth
  const mk = o => { const s = makeSheep(w.x + 30, w.z + 30, { age: 14, ...o }); s.wool = 1; s.hunger = 0.1; s.scale = 1.08; s.brave = 0.5; return s; };
  const ewe = mk({}), lamb = mk({ lamb: true }), old = mk({ age: 50 }), shorn = mk({}), sick = mk({}), starving = mk({}), ram = mk({ ram: true }), champ = mk({ ram: true });
  old.life = 54; shorn.wool = 0.1; sick.venom = 0.5; starving.hunger = 1; champ.champ = true; ram.scale = champ.scale = T.ramScale;
  const mum = mk({}), sire = mk({ ram: true }); for (const s of [mum, sire]) GAME.kinFounder(s);
  const inbred = makeSheep(w.x + 30, w.z + 30, { lamb: true, mother: mum }); kinBorn(inbred, mum, sire.lid); const dau = inbred; dau.lamb = false; dau.age = 14; dau.wool = 1; dau.hunger = 0.1; dau.scale = 1.08;
  const inb2 = makeSheep(w.x + 30, w.z + 30, { lamb: true, mother: dau }); kinBorn(inb2, dau, sire.lid); inb2.lamb = false; inb2.age = 14; inb2.wool = 1; inb2.hunger = 0.1; inb2.scale = 1.08; inb2.inF = inb2.inF || 0;
  const P = s => GAME.sheepPrice(s);
  out.prices = { ewe: P(ewe), lamb: P(lamb), old: P(old), shorn: P(shorn), sick: P(sick), starving: P(starving), inbred: P(inb2), ram: P(ram), champ: P(champ) };
  out.stars = { lamb: GAME.sheepStars(lamb), ewe: GAME.sheepStars(ewe), champ: GAME.sheepStars(champ) };
  VAG.griev = 10; out.grumpy = P(ewe); VAG.griev = 0;
  // on the mat: nothing; ask; sold
  for (const s of G.sheep) put(s, w.x + 40, w.z + 40);
  put(d, w.x, w.z);
  out.none = buyWare(w, d);
  const s = living().find(o => !o.lamb && !o.ram); s.name = 'Sellme'; put(s, w.x + 0.3, w.z); const wool0 = G.wool = 3, price = P(s), n0 = living().length, lost0 = G.lost.length;
  out.ask = buyWare(w, d); out.sold = buyWare(w, d); step(0.025);
  out.after = { wool: G.wool - wool0 === price, gone: !living().includes(s) && living().length === n0 - 1, lost: G.lost.length === lost0, remains: !G.graves.some(g => g.name === 'Sellme'), rec: kinRec(s.lid) && kinRec(s.lid).x, stat: G.stats.sold };
  const el = document.createElement('div'); el.innerHTML = kinTreeHTML(s.lid); out.tree = el.querySelector('.kinNode.g0').title.includes('sold');
  // carried on in its jaws
  const c = living().find(o => !o.lamb && !o.ram); put(c, w.x + 2, w.z); put(d, w.x + 3, w.z); d.holding = c; c.heldBy = d; d.holdKind = 'sheep'; put(d, w.x, w.z); c.x = d.x + 0.6; c.z = d.z;
  out.carry = [buyWare(w, d), buyWare(w, d)]; step(0.025); out.carryGone = !living().includes(c) && d.holding !== c;
  // too slow: asked again
  const q = living().find(o => !o.lamb && !o.ram); put(q, w.x + 0.3, w.z); d.holding = null;
  out.slow = [buyWare(w, d), (() => { G.time += T.vendor.sell.confirm + 1; return buyWare(w, d); })()]; out.slowKept = living().includes(q);
  return out;
});
const p = r.prices;
ok(`the better the sheep, the more: ewe ${p.ewe} > lamb ${p.lamb}, old ${p.old}, shorn ${p.shorn}, sick ${p.sick}, starving ${p.starving}, inbred ${p.inbred}`,
  [p.lamb, p.old, p.shorn, p.sick, p.starving, p.inbred].every(v => v < p.ewe && v >= 1), p);
ok(`a ram (${p.ram}) beats a ewe; the champion (${p.champ}) beats them all; grumpy, he pays less (${r.grumpy})`, p.ram > p.ewe && p.champ > p.ram * 2 && r.grumpy < p.ewe, r);
ok(`★: lamb ${r.stars.lamb}, ewe ${r.stars.ewe}, champion ${r.stars.champ}`, r.stars.lamb < r.stars.ewe && r.stars.ewe <= r.stars.champ && r.stars.champ === 5 && r.stars.lamb >= 1, r.stars);
ok(`nothing on the mat: no sale (${r.none}); a bark: his price (${r.ask}); again: sold (${r.sold})`, r.none === 'none' && r.ask === 'ask' && r.sold === 'sold', r);
ok(`sold: 🧶 in, gone from the flock, not lost (no eulogy, no remains), its record 'sold', 🧶 in its tree`, r.after.wool && r.after.gone && r.after.lost && r.after.remains && r.after.rec === 'sold' && r.after.stat === 1 && r.tree, r.after);
ok(`carried on in the dog's jaws: the same (${r.carry.join(', ')})`, r.carry[0] === 'ask' && r.carry[1] === 'sold' && r.carryGone, r);
ok(`too slow on the second bark: asked again, not sold (${r.slow.join(', ')})`, r.slow[0] === 'ask' && r.slow[1] === 'ask' && r.slowKept, r);
ok('no page errors', !h.errors.length);
if (h.errors.length) console.log('PAGE ERRORS', h.errors.slice(0, 3));
await h.close();
process.exit(fails ? 1 : 0);
