// Journey save: a reload carries on where you were; it never undoes anything. node tools/save-test.mjs
// Checks: land (day, hour, wool, Hank's kit, training, the map, a pen's gate and kit, every sheep: name, look, ailments, spot), a death
//   saved at once (a reload can't bring it back), coyotes on the hunt come back, at sea (alongside the last island, the hold),
//   an old / mangled save (unknown fields, a broken part, a spot in a rock) still loads, a new journey and the end forget it
import { open } from './harness.mjs';
const h = await open();
const page = h.page;
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };
const run = (sec = 1) => page.evaluate(sec => { for (let t = 0; t < sec; t += 0.025) GAME.step(0.025); }, sec);
// a reload: the page again, the save read as the title would, the first dog in
async function reload() {
  await page.reload(); await page.waitForFunction(() => window.GAME, null, { timeout: 60000 });
  return page.evaluate(() => { const J = GAME.JOURNEY; J.off = false; J.saved = GAME.journeyRead(); const had = !!J.saved; GAME.startGame({ kind: 'bot', index: 0 }); GAME.G.players[0].bot = {}; return { had, resumed: J.resumed }; });
}
const state = () => page.evaluate(() => {
  const { G, HANK, SEA, MAP, pens, living, sAt, flockCenter } = GAME, fc = flockCenter();
  return { day: G.clock.day, hour: +G.clock.hour.toFixed(2), wool: G.wool, n: living().length, names: living().map(s => s.name).sort().join(), at: Math.round(sAt(fc.x, fc.z)),
    first: (() => { const s = living().find(s => s.name === 'Saveme'); return s && { x: +s.x.toFixed(1), z: +s.z.toFixed(1), venom: +s.venom.toFixed(3), hat: s.look && s.look.hat, hunger: +s.hunger.toFixed(2) }; })(),
    shovel: HANK.shovel, pills: HANK.meds.pills, clippers: HANK.clippers, map: MAP.rv.reduce((a, v) => a + (v > 0.5), 0), sea: SEA.on, saved: SEA.saved, food: SEA.stores && +SEA.stores.food.toFixed(1),
    gate: !pens[2].latched, kit: pens[2].troughs.length, xp: JSON.stringify(G.train), stats: JSON.stringify(G.stats), coyotes: G.coyotes.filter(c => !c.gone && !['sleep', 'leave', 'dead'].includes(c.state)).length };
});

// 1. on land: somewhere on the trail, day 3, things bought and done
await page.evaluate(() => {
  localStorage.clear();
  const { G, HANK, pens, kitSet, setGate, devJump, living, giveHankClippers } = GAME;
  GAME.JOURNEY.off = false;
  GAME.startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {};
  for (const c of G.coyotes) c.gone = true;
  devJump(640, { url: false });
  G.clock.day = 3; G.clock.hour = 10.5; G.wool = 42; HANK.shovel = true; HANK.meds.pills = 2; giveHankClippers();
  kitSet(pens[2], 'food', pens[2].troughs.length + 1); setGate(pens[2], true);
  const s = living()[3]; s.name = 'Saveme'; s.renamed = true; s.venom = 0.4; s.look = { ...(s.look || {}), hat: 'beanie', hatColor: '#ff0000', acc: [], paint: [] }; s.hunger = 0.61;
  G.dogs[0].tr.xp.speed = 5; G.stats.saved = 2;
});
await run(1);
await page.evaluate(() => GAME.journeySave());
const a = await state();
let r = await reload(), b = await state();
ok('a save: the title has it, the first dog carries on', r.had && r.resumed, r);
ok('day, hour, wool, Hank\'s kit, training, the tally', b.day === 3 && Math.abs(b.hour - a.hour) < 0.05 && b.wool === 42 && b.shovel && b.pills === 2 && b.clippers && b.xp === a.xp && b.stats === a.stats, { a, b });
ok('the flock: same sheep, where it was', b.names === a.names && Math.abs(b.at - a.at) < 3, { a: a.at, b: b.at, n: [a.n, b.n] });
ok('a sheep: its spot, look, venom, hunger', b.first && Math.hypot(b.first.x - a.first.x, b.first.z - a.first.z) < 0.2 && b.first.hat === 'beanie' && Math.abs(b.first.venom - a.first.venom) < 0.002 && b.first.hunger === a.first.hunger, { a: a.first, b: b.first });
ok('the map, a pen\'s gate and kit', Math.abs(b.map - a.map) < a.map * 0.05 + 10 && b.gate && b.kit === a.kit, { a, b });
const e1 = await page.evaluate(() => { const L = GAME.G.sheep.filter(s => !s.dead); GAME.step(0.025); return L.every(s => Number.isFinite(s.x + s.z) && !s.dead); });
ok('it plays on', e1, e1);

// 2. a death: saved at once (no undo)
await page.evaluate(() => { const L = GAME.living(); GAME.killSheep(L[L.length - 1], 'eaten'); });
const nDead = (await state()).n;
await reload();
ok('a sheep lost: still lost after a reload', (await state()).n === nDead, nDead);

// 3. coyotes on the hunt: still coming
await page.evaluate(() => { GAME.G.clock.hour = 22; GAME.spawnCoyotes(3); GAME.journeySave(); });
await reload();
const c3 = (await state()).coyotes;
ok('coyotes hunting: back after a reload', c3 >= 3, c3);

// 4. an old / mangled save: unknown fields, a broken part, a sheep in a rock
await page.evaluate(() => {
  const j = JSON.parse(localStorage.getItem(GAME.JOURNEY_KEY));
  j.parts.flock[0].someOldField = 'x'; j.parts.flock[0].hunger = 'oops'; j.parts.flock[1].at = [0, 0, 5]; j.parts.pens = 'garbage'; j.parts.gone = { a: 1 };
  localStorage.setItem(GAME.JOURNEY_KEY, JSON.stringify(j));
});
h.errors.length = 0;
r = await reload();
const m = await page.evaluate(() => { const L = GAME.living(), fc = GAME.flockCenter(); GAME.step(0.025); return { n: L.length, far: Math.max(...L.map(s => Math.hypot(s.x - fc.x, s.z - fc.z))), hunger: L.every(s => typeof s.hunger === 'number') }; });
ok('a mangled save still loads (a bad spot: by the flock)', r.resumed && m.hunger && m.far < 60 && !h.errors.length, { m, e: h.errors.slice(0, 3) });

// 5. at sea: alongside the last island reached, the hold as it was
await page.evaluate(() => { GAME.seaStart({ leg: 2 }); GAME.SEA.stores.food = 3.5; GAME.journeySave(); });
await reload();
const s5 = await state();
ok('at sea: alongside island 2, the hold', s5.sea && s5.saved === 2 && s5.food === 3.5, s5);

// 6. a new journey / the end: forgotten
await page.evaluate(() => GAME.resetGame());
ok('a new journey: no save', !(await page.evaluate(() => localStorage.getItem(GAME.JOURNEY_KEY))));
await page.evaluate(() => { GAME.journeySave(); GAME.finishGame(5); });
ok('the end: no save', !(await page.evaluate(() => localStorage.getItem(GAME.JOURNEY_KEY))));

ok('no errors', !h.errors.length, h.errors.slice(0, 3));
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
