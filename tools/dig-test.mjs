// Headless checks for the dig spots and the dog wardrobe: where the spots are, a dog digging one up, what it finds,
// the find going on the dog and into the saved wardrobe, the barn's Dogs tab, and a new journey putting the spots back.
// node tools/dig-test.mjs [--shots DIR]
import { open } from './harness.mjs';
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const h = await open();
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

// 1. the spots: spread down the whole trail, on dry open ground off the worn path
const r1 = await h.page.evaluate(() => {
  const { DIGS, sAt, sdfAt, PATH_LEN, CAMPS } = GAME;
  const s = DIGS.map(d => sAt(d.x, d.z));
  return { n: DIGS.length, first: Math.min(...s), last: Math.max(...s), len: PATH_LEN, minSdf: Math.min(...DIGS.map(d => sdfAt(d.x, d.z))),
    nearCamp: DIGS.filter(d => CAMPS.some(c => Math.hypot(d.x - c.x, d.z - c.z) < c.R + 5)).length };
});
ok(`${r1.n} dig spots along the trail`, r1.n >= r1.len / 90 && r1.n <= r1.len / 40, r1);   // about one every T.dig.every m
ok('they run from the start to the end', r1.first < 100 && r1.last > r1.len - 150, r1);
ok('none in a rock or a camp', r1.minSdf > 2 && r1.nearCamp === 0, r1);

// 2. a dog digs one up: the first find of all is always treasure, and it goes on the dog
const r2 = await h.page.evaluate(() => {
  localStorage.clear(); GAME.loadDogs();
  const { G, DIGS, DOGS, step, startGame, dogLook } = GAME; const out = {};
  startGame({ kind: 'kb', index: 0 }); const d = G.dogs[0], sp = DIGS[0];
  const key0 = d.models.lookKey;
  // walking straight over it at full trot doesn't dig
  d.x = sp.x - 3; d.z = sp.z; G.players[0].inp = null;
  G.players[0].bot = { mx: 0, my: 0 }; G.players[0].kind = 'bot';
  const dir = { x: 1, z: 0 }, CAM_R = GAME.CAM_R, CAM_F = GAME.CAM_F;
  G.players[0].bot = { mx: dir.x * CAM_R.x + dir.z * CAM_R.z, my: -(dir.x * CAM_F.x + dir.z * CAM_F.z), sprint: true };
  for (let i = 0; i < 40; i++) step(0.025);
  out.trotOver = { dug: sp.dug, prog: +sp.prog.toFixed(2), past: +(d.x - sp.x).toFixed(1) };
  // standing on it does
  G.players[0].bot = { mx: 0, my: 0 }; d.x = sp.x + 0.3; d.z = sp.z; d.vx = d.vz = 0;
  let t = 0; while (!sp.dug && t < 5) { step(0.025); t += 0.025; }
  out.dug = sp.dug; out.secs = +t.toFixed(2); out.found = DOGS.found.slice();
  out.wearing = dogLook(0); out.restyled = d.models.lookKey !== key0;
  out.saved = JSON.parse(localStorage.getItem(GAME.DOGS_KEY) || 'null');
  return out;
});
ok('trotting straight over a spot doesn\'t dig it', !r2.trotOver.dug && r2.trotOver.past > 1, r2.trotOver);
ok(`standing on it digs it up (${r2.secs}s)`, r2.dug && r2.secs > 1 && r2.secs < 2.5, r2);
ok('the first find is treasure', r2.found.length === 1, r2.found);
ok('it goes straight on the dog that found it', (r2.wearing.hat === r2.found[0] || r2.wearing.acc.includes(r2.found[0])) && r2.restyled, r2.wearing);
ok('the find is saved', r2.saved && r2.saved.found.includes(r2.found[0]), r2.saved);

// 3. dig them all: treasure until everything's found, junk after; nothing found twice
const r3 = await h.page.evaluate(() => {
  const { G, DIGS, DOGS, DOG_ITEMS, step, resetDigs } = GAME, d = G.dogs[0]; const out = { journeys: 0 };
  while (DOGS.found.length < DOG_ITEMS.length && out.journeys < 8) {
    resetDigs(); out.journeys++;
    for (const sp of DIGS) { d.x = sp.x; d.z = sp.z; d.vx = d.vz = 0; let t = 0; while (!sp.dug && t < 4) { step(0.025); t += 0.025; } }
  }
  out.found = DOGS.found.length; out.unique = new Set(DOGS.found).size; out.all = DOG_ITEMS.length;
  return out;
});
ok(`everything found in ${r3.journeys} journeys' digging`, r3.found === r3.all && r3.unique === r3.all && r3.journeys >= 2, r3);

// 4. the barn's Dogs tab: found things to put on, the dog in the world wears them, closing saves
const r4 = await h.page.evaluate(() => {
  const { G, BARN, openBarn, closeBarn, barnTab, dogSet, dogLook, DOGS_KEY } = GAME; const out = {};
  G.players[0].kind = 'kb'; G.players[0].bot = null;
  out.opened = openBarn(); out.tab = barnTab('dogs');
  out.locks = document.querySelectorAll('#barnWard .ico.lock').length;
  out.paintHidden = document.getElementById('barnTools').hidden;
  dogSet(0, { coat: '#d8c7a2', collar: '#8e44ad', hat: 'tophat', acc: ['bell', 'shades'], name: 'Moss' });
  out.list = document.getElementById('barnList').textContent;
  out.hatOn = document.querySelector('#barnDogHat button.on').dataset.dhat;
  out.model = BARN.model && BARN.model.children.length > 0;
  closeBarn();
  const d = G.dogs[0]; out.key = JSON.parse(d.models.lookKey); out.name = d.player.name;
  out.saved = JSON.parse(localStorage.getItem(DOGS_KEY)).looks[0];
  return out;
});
ok('barn opens on the Dogs tab', r4.opened && r4.tab && r4.paintHidden, r4);
ok('nothing locked once everything is found', r4.locks === 0, r4);
ok('the Dogs tab shows the choice', r4.hatOn === 'tophat' && r4.list.includes('Moss') && r4.model, r4);
ok('the dog in the world wears it', r4.key.hat === 'tophat' && r4.key.coat === '#d8c7a2' && r4.key.acc.join() === 'shades,bell' && r4.name === 'Moss', r4.key);
ok('closing the barn saves the dogs', r4.saved.hat === 'tophat' && r4.saved.name === 'Moss', r4.saved);
if (shots) {
  await h.page.evaluate(() => { const { G, DIGS, cam, updateCamera, renderOnce } = GAME, d = G.dogs[0], sp = GAME.DIGS[3]; d.x = sp.x + 2.5; d.z = sp.z + 1; GAME.resetDigs(); updateCamera(0, true); renderOnce(); });
  await h.page.screenshot({ path: `${shots}/dig-world.png` });
}

// 5. locked things can't be put on; a new journey puts the spots back; a fresh wardrobe starts with nothing found
const r5 = await h.page.evaluate(() => {
  const { DOGS, dogSet, dogLook, loadDogs, resetGame, DIGS, G } = GAME; const out = {};
  localStorage.clear(); loadDogs(); dogSet(1, { hat: 'crown', acc: ['bell'] });
  out.locked = dogLook(1).hat === 'none' && dogLook(1).acc.length === 0;
  G.mode = 'end'; resetGame(); out.back = DIGS.every(d => !d.dug && d.prog === 0);
  return out;
});
ok('things not found yet can\'t be worn', r5.locked, r5);
ok('a new journey puts every mound back', r5.back, r5);

ok('no page errors', h.errors.length === 0, h.errors.slice(0, 5));
await h.close();
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);
