// Headless checks for Hank (voice rules, clips, herding commands), Hank's barn, the dressed-up flock and the saved flock:
// `node tools/hank-test.mjs`. Prints PASS/FAIL per check.
import { open } from './harness.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') + '/';
const results = []; const ok = (name, cond, info) => { results.push([cond ? 'PASS' : 'FAIL', name, info === undefined ? '' : JSON.stringify(info)]); };

// 1. every voice / whistle id the code references exists as a file
{
  const src = fs.readFileSync(ROOT + 'index.html', 'utf8');
  const ids = new Set();
  for (const m of src.matchAll(/hank\('([a-z_]+)'/g)) ids.add(m[1]);
  for (const m of src.matchAll(/hank\(pick\(\[([^\]]+)\]/g)) for (const q of m[1].matchAll(/'([a-z_]+)'/g)) ids.add(q[1]);
  const block = src.slice(src.indexOf('const HANK_LINES = {'), src.indexOf('};', src.indexOf('const HANK_LINES = {')));
  for (const m of block.matchAll(/^\s*([a-z_]+):|,\s*([a-z_]+):/gm)) ids.add(m[1] || m[2]);
  for (const m of src.matchAll(/(?:cmd|txt) = '([a-z_]+)'/g)) ids.add(m[1]);
  const missing = [...ids].filter(id => !fs.existsSync(ROOT + 'audio/voice/' + id + '.mp3'));
  const wl = src.match(/const WHISTLES = \[([^\]]+)\]/)[1].match(/'([a-z_]+)'/g).map(s => s.slice(1, -1));
  const wmissing = wl.filter(id => !fs.existsSync(ROOT + 'audio/whistle/' + id + '.mp3'));
  ok('every referenced voice id has audio/voice/<id>.mp3', missing.length === 0, { ids: ids.size, missing });
  ok('every whistle id has audio/whistle/<id>.mp3', wmissing.length === 0, { whistles: wl, wmissing });
}

let h = await open({ query: '?sim&debug' });
await h.page.evaluate(() => { localStorage.clear(); });
await h.page.reload(); await h.page.waitForFunction(() => window.GAME);
// count stopped sources so we can see a new line cut the old one off
await h.page.evaluate(() => { window.__stops = 0; const st = AudioBufferSourceNode.prototype.stop; AudioBufferSourceNode.prototype.stop = function (...a) { window.__stops++; return st.apply(this, a); }; });
const r1 = await h.page.evaluate(async () => {
  const { G, Sound, HANK, step, startGame, hank } = GAME;
  Sound.init(); await new Promise(r => setTimeout(r, 50));
  const titleSaid = hank('good_dog', null, { force: true });   // rule 1: never on the title
  startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {};
  for (let i = 0; i < 40; i++) step(0.05);                        // the delayed "Over here now!"
  await new Promise(r => setTimeout(r, 5000));                    // clips load (prefetch)
  return { ctx: Sound.ctx && Sound.ctx.state, titleSaid, played: HANK.played.slice(), log: HANK.log.slice(), loaded: Object.keys(HANK.buf).length, missing: Object.keys(HANK.missing) };
});
ok('AudioContext running headless', r1.ctx === 'running', r1.ctx);
ok('no line on the title screen', r1.titleSaid === false);
ok('game start: "Over here now!" said and its clip played', r1.played.some(p => p.id === 'over_here' && p.src === 'audio/voice/over_here.mp3'), r1.played);
ok('clips loaded by prefetch, none missing', r1.loaded >= 30 && r1.missing.length === 0, { loaded: r1.loaded, missing: r1.missing });

// 2. the anti-chatter rules
const r2 = await h.page.evaluate(async () => {
  const { G, HANK, step, hank, T } = GAME; const out = {};
  const adv = s => { for (let i = 0; i < Math.round(s / 0.05); i++) step(0.05); };
  adv(T.hankRepeat + 1);   // clear any start-up lines out of the repeat window
  const stops0 = window.__stops;
  out.a = hank('good_dog', null, { force: true });               // said
  await new Promise(r => setTimeout(r, 200));
  out.aPlayed = HANK.played.at(-1);
  out.b = hank('thats_it');                                        // unforced within the gap -> dropped
  out.c = hank('good_dog', null, { force: true });               // same line twice in a row -> dropped even when forced
  out.d = hank('in_ye_go', null, { force: true });                // a different forced line -> said, cuts good_dog off
  await new Promise(r => setTimeout(r, 200));
  out.cut = window.__stops > stops0;
  out.e = hank('good_dog', null, { force: true });               // said 0 s ago (not last) -> dropped (repeat window)
  adv(T.hankGap + 0.5);
  out.f = hank('thats_it');                                        // unforced after the gap -> said
  adv(T.hankRepeat - T.hankGap + 0.5);
  out.g = hank('good_dog', null, { force: true });               // past the repeat window -> said
  out.log = HANK.log.slice(-7).map(l => `${l.id}:${l.said ? 'said' : l.why}`);
  // subtitle only (no clip) still shows in the bubble
  adv(16); out.h = hank(null, 'A wee lamb! Keep it close!', { force: true }); out.bubble = document.querySelector('#hankBubble span').textContent;
  return out;
});
ok('forced line said + its clip played', r2.a === true && r2.aPlayed && r2.aPlayed.id === 'good_dog', r2.aPlayed);
ok('unforced line within the gap dropped', r2.b === false);
ok('same line twice in a row dropped (even forced)', r2.c === false);
ok('another forced line said and cuts the old clip off', r2.d === true && r2.cut === true);
ok('a line said inside the repeat window dropped (even forced)', r2.e === false);
ok('unforced line after the gap said', r2.f === true);
ok('a line again after the repeat window said', r2.g === true, r2.log);
ok('subtitle-only line shows in the bubble', r2.h === true && r2.bubble === 'A wee lamb! Keep it close!', r2.bubble);

// 3. herding commands: dog circling the flock clockwise / anticlockwise -> come bye / away to me, with the whistle first
const r3 = await h.page.evaluate(async () => {
  const { G, HANK, step, flockCenter, pens } = GAME;
  for (const p of pens) { p.open = false; }
  const fc0 = flockCenter(); const d = G.dogs[0]; const out = {};
  // move the flock out of the pen onto open ground for the test
  const P = GAME.pathPoint(120, 0); for (const s of G.sheep) { s.x = P.x + (Math.random() - .5) * 6; s.z = P.z + (Math.random() - .5) * 6; s.pen = null; }
  for (let i = 0; i < 20; i++) step(0.05);
  // drive the dog round the flock with real stick input (screen space), keeping it on a 12 m circle
  const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
  const run = (dir) => { let a = 0; const fc0 = flockCenter(); d.x = fc0.x + 12; d.z = fc0.z;
    for (let i = 0; i < 60; i++) { const fc = flockCenter(); a = Math.atan2(d.z - fc.z, d.x - fc.x); const tx = -Math.sin(a) * dir, tz = Math.cos(a) * dir;
      G.players[0].bot = { mx: tx * R.x + tz * R.z, my: -(tx * F.x + tz * F.z) }; HANK.cmdT = -99; HANK.cmdTry = -99; HANK.lastSay = -99; HANK.lastStarve = G.time; step(0.05);
      const b = Math.atan2(d.z - fc.z, d.x - fc.x); d.x = fc.x + Math.cos(b) * 12; d.z = fc.z + Math.sin(b) * 12; } G.players[0].bot = {}; };
  HANK.lastSay = -99; HANK.said = {}; HANK.lastKey = null; HANK.cmd = ''; G.hints.dig = true;   // (no other lines crowding the commands out: dig spots)
  run(1); out.cw = HANK.log.slice(-3).map(l => `${l.id}:${l.said ? 'said' : l.why}`);
  await new Promise(r => setTimeout(r, 400));
  out.cwPlayed = HANK.played.slice(-2).map(p => p.kind + ':' + p.id);
  HANK.lastSay = -99; HANK.said = {}; HANK.lastKey = null; HANK.cmd = '';
  run(-1); out.ccw = HANK.log.slice(-3).map(l => `${l.id}:${l.said ? 'said' : l.why}`);
  return out;
});
ok('dog circling clockwise (angle increasing) -> "Come bye!"', r3.cw.some(x => x === 'come_bye:said'), r3.cw);
ok('whistle plays before the words', r3.cwPlayed.join() === 'whistle:come_bye,voice:come_bye', r3.cwPlayed);
ok('dog circling anticlockwise -> "Away to me!"', r3.ccw.some(x => x === 'away_to_me:said'), r3.ccw);

// 4. the barn: open, rename + hat + wool + accessory, close; it shows on the sheep in the world
const r4 = await h.page.evaluate(() => {
  const { G, BARN, openBarn, closeBarn, barnSet, syncSheep, syncSheepDressUp, DRESS, SI, describeSheep } = GAME;
  const out = {};
  const s = G.sheep[2];
  out.opened = openBarn(s); out.domShown = !document.getElementById('barn').classList.contains('hidden');
  out.sel = BARN.sel === s;
  barnSet(s, { name: 'Dolly', hat: 'straw', wool: '#f3d0dc', hatColor: '#2f8a4a', acc: ['scarf', 'shades'] });
  out.listShowsName = document.getElementById('barnList').textContent.includes('Dolly');
  // the rename via the input box, as a player would
  const nm = document.getElementById('barnName'); nm.value = 'Dolly'; nm.dispatchEvent(new Event('input'));
  closeBarn(); out.closed = !BARN.open && document.getElementById('barn').classList.contains('hidden');
  syncSheep(); syncSheepDressUp(0.016);
  const idx = G.sheep.filter(o => !o.dead).indexOf(s);
  const straw = DRESS.item.straw, scarf = DRESS.item.scarf, shades = DRESS.item.shades;
  out.strawCount = straw.map(p => p.m.count); out.scarfCount = scarf.map(p => p.m.count); out.shadesCount = shades.map(p => p.m.count);
  return out;
});
const r4b = await h.page.evaluate(() => {
  const { G, DRESS, SI, describeSheep, syncSheep, syncSheepDressUp } = GAME; const out = {};
  syncSheep(); syncSheepDressUp(0.016);
  const s = G.sheep.find(o => o.name === 'Dolly'), idx = G.sheep.filter(o => !o.dead).indexOf(s);
  const straw = DRESS.item.straw.find(p => !p.tint), band = DRESS.item.straw.find(p => p.tint);
  out.strawVisible = straw.m.visible && straw.m.count === 1;
  out.hatOnHead = straw.m.instanceMatrix.array.slice(0, 16).every((v, i) => Math.abs(v - s.headM.elements[i]) < 1e-5);
  out.bandColour = [...band.m.instanceColor.array.slice(0, 3)].map(v => +v.toFixed(3));
  out.scarf = DRESS.item.scarf[0].m.count; out.shades = DRESS.item.shades[0].m.count;
  out.bodyColour = [...SI.body.m.instanceColor.array.slice(idx * 3, idx * 3 + 3)].map(v => +v.toFixed(3));
  out.headColour = [...SI.head.m.instanceColor.array.slice(idx * 3, idx * 3 + 3)].map(v => +v.toFixed(3));
  out.otherBody = [...SI.body.m.instanceColor.array.slice(0, 3)].map(v => +v.toFixed(3));
  out.desc = describeSheep(s);
  out.saved = JSON.parse(localStorage.getItem(GAME.FLOCK_KEY) || 'null');
  out.savedDolly = out.saved && out.saved.flock.find(r => r.name === 'Dolly');
  out.saved = !!out.saved;
  return out;
});
ok('barn opened and closed', r4.opened === true && r4.domShown && r4.sel && r4.closed, r4);
ok('barn list shows the new name', r4.listShowsName);
ok('hat on the instanced flock at the sheep head transform', r4b.strawVisible && r4b.hatOnHead, r4b);
ok('hat band takes the hat colour (green #2f8a4a in linear)', Math.abs(r4b.bandColour[1] - 0.252) < 0.02, r4b.bandColour);
ok('scarf and sunglasses drawn', r4b.scarf === 1 && r4b.shades === 1);
ok('pink wool on the body instance (vs a cream one)', r4b.bodyColour[0] > 0.85 && r4b.bodyColour[1] < 0.7 && r4b.otherBody[1] > 0.9, { pink: r4b.bodyColour, other: r4b.otherBody });
ok('dyed head tuft', r4b.headColour[1] < 0.9, r4b.headColour);
ok('describeSheep describes the look', r4b.desc === 'ewe, straw hat, green scarf, sunglasses, pink fleece', r4b.desc);
ok('closing the barn saved the flock', r4b.saved && r4b.savedDolly && r4b.savedDolly.look.hat === 'straw', r4b.savedDolly);

// 5. paint: strokes land in the atlas tile; the instance attribute points at it
const r5 = await h.page.evaluate(() => {
  const { G, barnSet, syncSheep, syncSheepDressUp, PAINT } = GAME;
  const s = G.sheep.find(o => o.name === 'Dolly');
  barnSet(s, { paint: [{ c: '#3a86ff', s: 0.12, p: [0.2, 0.5, 0.8, 0.5] }, { c: '#e63946', s: 0.08, p: [0.5, 0.8] }] });
  syncSheep(); syncSheepDressUp(0.016);
  const idx = G.sheep.filter(o => !o.dead).indexOf(s), a = PAINT.attr.array;
  const t = s._tile, x = (t % PAINT.cols) * PAINT.tw, y = Math.floor(t / PAINT.cols) * PAINT.th;
  const px = PAINT.cx.getImageData(x + PAINT.tw / 2, y + PAINT.th / 2, 1, 1).data;
  const blank = PAINT.cx.getImageData(x + 3, y + 3, 1, 1).data;
  return { tile: t, on: a[idx * 3 + 2], u0: a[idx * 3], v0: a[idx * 3 + 1], mid: [...px], blank: [...blank], others: [...a.slice(0, 3)] };
});
ok('painted sheep gets an atlas tile with its strokes', r5.tile >= 0 && r5.on === 1 && r5.mid[2] > 200 && r5.mid[3] === 255 && r5.blank[3] === 0, r5);

// 6. a sheep dragged off and lost: loss toast says who and what she wore, tombstone hat, memorial
const r6 = await h.page.evaluate(async () => {
  const { G, killSheep, FLOCK } = GAME;
  const s = G.sheep.find(o => o.name === 'Dolly');
  killSheep(s, 'eaten');
  const toasts = [...document.querySelectorAll('#toasts .toast')].map(e => e.textContent);
  const grave = G.graves.at(-1); let hat = null; grave.root.traverse(o => { if (o.userData && o.userData.hat) hat = o.userData.hat; });
  return { toast: toasts.at(-1), graveName: grave.name, hat, mem: FLOCK.memorial[0], saved: JSON.parse(localStorage.getItem(GAME.FLOCK_KEY)).memorial[0] };
});
ok('loss toast names her and what she wore', r6.toast === 'The coyotes got Dolly — in her straw hat, green scarf, sunglasses, pink fleece and painted fleece', r6.toast);
ok('tombstone has her name and her hat on it', r6.graveName === 'Dolly' && r6.hat === 'straw', r6);
ok('fondly remembered (and saved)', r6.mem && r6.mem.name === 'Dolly' && r6.saved && r6.saved.name === 'Dolly', r6.mem);
await h.close();

// 7. persistence across a reload: dress a sheep, save, reload -> it's in the new starting flock
h = await open({ query: '?sim&debug' });
const r7a = await h.page.evaluate(() => {
  localStorage.clear(); const { G, barnSet, saveFlock } = GAME;
  const s = G.sheep[0]; barnSet(s, { name: 'Biscuit Jr', hat: 'tophat', hatColor: '#8e44ad', wool: '#cfe0f2', acc: ['bowtie'], paint: [{ c: '#f6d743', s: 0.06, p: [0.5, 0.5] }] });
  G.sheep[5].name = 'Sir Puddington'; G.sheep[5].renamed = true;
  return { saved: saveFlock(), names: G.sheep.map(o => o.name) };
});
await h.page.reload(); await h.page.waitForFunction(() => window.GAME);
const r7 = await h.page.evaluate(() => {
  const { G } = GAME; const b = G.sheep.find(o => o.name === 'Biscuit Jr');
  return { names: G.sheep.map(o => o.name), look: b && b.look, first: G.sheep[0].name, lambs: G.sheep.filter(o => o.lamb).map(o => o.name), unique: new Set(G.sheep.map(o => o.name)).size === G.sheep.length, n: G.sheep.length };
});
ok('dressed sheep survives a reload as part of the starting flock', r7.look && r7.look.hat === 'tophat' && r7.look.hatColor === '#8e44ad' && r7.look.wool === '#cfe0f2' && r7.look.acc.join() === 'bowtie' && r7.look.paint.length === 1, r7.look);
ok('customised sheep come first; names unique; 14 sheep', r7.first === 'Biscuit Jr' && r7.names.includes('Sir Puddington') && r7.unique && r7.n === 14, r7);
// corrupt save -> no crash, fresh flock
await h.page.evaluate(() => localStorage.setItem(GAME.FLOCK_KEY, '{"v":1,"flock":[{"name":"<b>x</b>","look":{"hat":"bogus","wool":"red","paint":[{"p":"no"}]}}, 7, null]}'));
await h.page.reload(); await h.page.waitForFunction(() => window.GAME);
const r7c = await h.page.evaluate(() => ({ s0: GAME.G.sheep[0].name, look: GAME.G.sheep[0].look }));
ok('a junk save is cleaned, not fatal', r7c.look && r7c.look.hat === 'none' && r7c.look.wool === null && r7c.look.paint.length === 0, r7c);
await h.page.evaluate(() => localStorage.setItem(GAME.FLOCK_KEY, 'not json{'));
await h.page.reload(); await h.page.waitForFunction(() => window.GAME);
ok('an unreadable save starts a new flock', (await h.page.evaluate(() => GAME.G.sheep.length)) === 14);
// fresh flock
const r7d = await h.page.evaluate(() => { const { G, barnSet, saveFlock, freshFlock } = GAME; barnSet(G.sheep[0], { name: 'Keepme', hat: 'crown' }); saveFlock(); freshFlock(); return { gone: !G.sheep.some(s => s.name === 'Keepme'), store: localStorage.getItem(GAME.FLOCK_KEY), hats: G.sheep.filter(s => s.look.hat !== 'none').length }; });
ok('"Start a fresh flock" forgets the saved flock', r7d.gone && r7d.store === null && r7d.hats === 0, r7d);
// Hank only calls out coyotes and cougars he can see
const r8 = await h.page.evaluate(() => {
  const { G, HANK, step, startGame, spawnPack, COUGARS, grabPrey, living } = GAME;
  if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {};
  const k = COUGARS[0], L = k.lair, ux = Math.sin(L.yaw), uz = Math.cos(L.yaw);
  const hx = L.x + ux * 25, hz = L.z + uz * 25;   // Hank stands out in the open, 25 m from the cougar's tree
  const run = (n, at) => { for (let i = 0; i < n; i++) { HANK.x = at[0]; HANK.z = at[1]; HANK.vx = HANK.vz = 0; step(0.05); } };
  const said = (pred) => HANK.log.filter(e => e.said && pred(e)).length;
  const far = [hx + 200, hz + 200];
  const land = (r, dz = 0) => { for (let k = 0; k < 48; k++) { const a = k * 0.131 * (k % 2 ? 1 : -1), x = hx + Math.cos(a) * r, z = hz + dz + Math.sin(a) * r; if (GAME.sdfAt(x, z) > 3) return [x, z]; } return [hx + r, hz + dz]; };   // (on land: east of here's water now, open to coyotes)
  G.clock.hour = 21; G.clock.day = 2; HANK.log.length = 0; HANK.lastSay = -99;
  for (const s of living()) { s.x = hx + 4 + Math.random() * 4; s.z = hz + Math.random() * 4; s.pen = null; }
  // a pack out of his sight, then in it
  const p = spawnPack(2, { howl: false }), [px70, pz70] = land(70, 10); for (const c of p.members) { c.x = px70; c.z = pz70; }
  run(10, [hx, hz]); const packUnseen = said(e => e.id === 'here_they_come' || e.id === 'more_of_them');
  for (const c of p.members) { c.x = hx + 9; c.z = hz + 2; c.gx = c.x; c.gz = c.z; } run(10, [hx, hz]);
  const packSeen = said(e => e.id === 'here_they_come');
  // a coyote grabs a sheep far from him: nothing; once he can see it: "Get 'im!"
  const c = p.members[0], s = living().find(o => !o.ram), [px80, pz80] = land(80); c.x = px80; c.z = pz80; s.x = c.x + 1; s.z = c.z; grabPrey(c, s);
  run(10, [hx, hz]); const grabUnseen = said(e => e.id === 'get_im');
  run(10, [c.x - 8, c.z]); const grabSeen = said(e => e.id === 'get_im');
  GAME.dropPrey(c, false);
  // the cougar's eyes up its tree: not from 200 m off, yes from 25 m
  k.state = 'perch'; GAME.cougarHunt(k, 99);
  run(6, far); const eyesFar = said(e => /tree/.test(e.text || '') && /ougar/.test(e.text || ''));
  run(30, [hx, hz]); const eyesNear = said(e => /tree/.test(e.text || '') && /ougar/.test(e.text || ''));
  return { packUnseen, packSeen, grabUnseen, grabSeen, eyesFar, eyesNear };
});
ok('Hank calls out a pack only once he can see it', r8.packUnseen === 0 && r8.packSeen === 1, r8);
ok('…a coyote with a sheep only once he can see it', r8.grabUnseen === 0 && r8.grabSeen === 1, r8);
ok('…and a cougar\'s eyes up its tree only from near enough', r8.eyesFar === 0 && r8.eyesNear === 1, r8);
// Hank beds down by the campfire at night, and a coyote or cougar near him wakes him, shouting
const r9 = await h.page.evaluate(() => {
  const { G, HANK, T, step, pens, living, spawnPack, COUGARS } = GAME;
  const run = s => { for (let i = 0; i < Math.round(s / 0.05); i++) step(0.05); };
  const p = pens[0]; G.clock.day = 3; G.clock.hour = 21; HANK.asleep = false; HANK.upT = -99;
  for (const c of [...G.coyotes]) { c.state = 'leave'; c.x = c.z = 1e4; }
  for (const k of COUGARS) if (k.state !== 'perch' && k.state !== 'away') { k.state = 'away'; }
  for (const s of living()) { s.pen = p; s.x = p.x + (Math.random() - 0.5) * 4; s.z = p.z + (Math.random() - 0.5) * 4; }
  const g = (HANK.goal = null, GAME.step(0.05), HANK.goal); HANK.x = g.x; HANK.z = g.z;
  let slept = false; for (let i = 0; i < 400 && !slept; i++) { G.clock.hour = 21; run(0.05); slept = HANK.asleep; }
  const quiet = GAME.hank('good_dog', null, { force: true });
  HANK.log.length = 0;
  const pk = spawnPack(2, { howl: false }); for (const c of pk.members) { c.x = HANK.x + 8; c.z = HANK.z + 1; c.gx = c.x; c.gz = c.z; }
  for (let i = 0; i < 20; i++) { G.clock.hour = 21; run(0.05); }
  const yelled = HANK.log.filter(e => e.said && (e.id === 'here_they_come' || e.id === 'more_of_them')).length;
  return { slept, quiet, woke: !HANK.asleep, yelled };
});
ok('Hank beds down at the campfire at night, quiet asleep', r9.slept && r9.quiet === false, r9);
ok('…a coyote near him wakes him, shouting', r9.woke && r9.yelled === 1, r9);
ok('no page errors', h.errors.length === 0, h.errors.slice(0, 5));
await h.close();

for (const [a, b, c] of results) console.log(a, b, c ? c.slice(0, 400) : '');
console.log(results.filter(r => r[0] === 'PASS').length + '/' + results.length + ' passed');
