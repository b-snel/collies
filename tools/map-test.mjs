// Headless checks for the map: the dogs uncover the land round them (and nothing else), the picture is parchment till then,
// the minimap sits bottom left (over the controls bar; touch: under the flock panel), a trader's pen is pinned on it, M / a click / R3 toggle the big map, edge arrows keep clear of the minimap, the
// host's fog for a late friend round-trips, a new journey is parchment again, and what it costs.
// node tools/map-test.mjs [--shots DIR]
import { open } from './harness.mjs';
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const h = await open({ query: '?sim' });
let fails = 0;
const ok = (name, cond, info) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  ' + JSON.stringify(info)}`); if (!cond) fails++; };

// 1. a new journey: only round the corral is uncovered
const r1 = await h.page.evaluate(() => {
  const { G, startGame, renderOnce, MAP, mapSeen, pathPoint, CAMPS, T } = GAME;
  startGame({ kind: 'kb', index: 0 }); renderOnce(0.25);
  const d = G.dogs[0], far = pathPoint(500, 0), side = pathPoint(80, 0);
  return { dog: mapSeen(d.x, d.z), corral: mapSeen(CAMPS[0].x, CAMPS[0].z), far: mapSeen(far.x, far.z), justOut: mapSeen(d.x + T.map.r + 2, d.z),
    frac: MAP.rv.reduce((a, v) => a + (v > 0.5), 0) / MAP.rv.length };
});
ok('round the dog is uncovered', r1.dog && r1.corral, r1);
ok('further off is still parchment', !r1.far && !r1.justOut && r1.frac < 0.02, r1);

// 2. walking up the trail uncovers it; off to the side (past r) stays parchment
const r2 = await h.page.evaluate(() => {
  const { G, renderOnce, mapSeen, pathPoint, T } = GAME, d = G.dogs[0];
  for (let s = 60; s <= 260; s += 6) { const p = pathPoint(s, 0); d.x = p.x; d.z = p.z; renderOnce(T.map.every); }
  const along = [100, 150, 200, 250].map(s => { const p = pathPoint(s, 0); return mapSeen(p.x, p.z); });
  const off = pathPoint(160, T.map.r + 8), ahead = pathPoint(330, 0);
  return { along, off: mapSeen(off.x, off.z), ahead: mapSeen(ahead.x, ahead.z) };
});
ok('the trail walked is uncovered', r2.along.every(Boolean), r2);
ok('past r to the side and ahead are not', !r2.off && !r2.ahead, r2);

// 3. the picture: see-through (parchment) where nobody's been, land where they have
const r3 = await h.page.evaluate(() => {
  const { MAP, mapCell, pathPoint, mapCompose } = GAME; mapCompose(0, 1e9);
  const px = (x, z) => { const k = mapCell(x, z), W = MAP.layer.width; return MAP.lx.getImageData(k % W, Math.floor(k / W), 1, 1).data[3]; };
  const a = pathPoint(150, 0), b = pathPoint(600, 0); return { seen: px(a.x, a.z), unseen: px(b.x, b.z) };
});
ok('land drawn where uncovered, parchment elsewhere', r3.seen === 255 && r3.unseen === 0, r3);

// 4. the minimap: bottom left, over the controls bar while it's up; touch: under the flock panel; drawn
const r4 = await h.page.evaluate(() => {
  const { MAP, renderOnce, T } = GAME, bar = document.getElementById('ctlBar'), place = () => {
    renderOnce(T.map.every); const f = document.getElementById('flock').getBoundingClientRect(), m = MAP.el.getBoundingClientRect(), cb = bar.getBoundingClientRect();
    return { left: Math.abs(m.left - f.left) < 2, gap: Math.round(innerHeight - m.bottom), underFlock: m.top >= f.bottom && m.top - f.bottom < 20, clear: !cb.width || cb.left > m.right || m.bottom <= cb.top, w: m.width };
  };
  bar.innerHTML = '<span>' + 'Ⓐ bark '.repeat(40) + '</span>'; bar.classList.add('show'); const withBar = place();
  bar.classList.remove('show'); const noBar = place();
  document.body.classList.add('touch'); const touch = place(); document.body.classList.remove('touch'); place();
  const c = MAP.el.getContext('2d'), mid = c.getImageData(MAP.el.width / 2, MAP.el.height / 2, 1, 1).data[3];
  return { withBar, noBar, touch, op: getComputedStyle(MAP.el).opacity, mid };
});
ok('minimap sits bottom left', r4.noBar.left && r4.noBar.gap === 14 && r4.noBar.w > 100, r4);
ok('over the controls bar while it\'s up', r4.withBar.left && r4.withBar.clear && r4.withBar.gap > 14, r4);
ok('touch: under the flock panel (the stick\'s bottom left)', r4.touch.left && r4.touch.underFlock, r4);
ok('and is drawn', r4.mid === 255 && r4.op === '1', r4);

// 4b. at a trader: its pen pinned on the minimap (📍; the Trading Post's stall: no 🏪 of its own on the map)
const r4b = await h.page.evaluate(() => {
  const { G, MAP, MARKET: st, pens, postPen, renderOnce } = GAME, d = G.dogs[0], x0 = st.x, z0 = st.z;
  const cx = MAP.el.getContext('2d'), orig = cx.drawImage; let n = 0;
  cx.drawImage = function (...a) { n++; return orig.apply(this, a); };
  const draws = () => { n = 0; MAP.redraw = true; renderOnce(1 / 60); return n; };
  const away = draws(); st.x = d.x; st.z = d.z; const at = draws(); st.x = x0; st.z = z0; const after = draws(); cx.drawImage = orig;
  return { away, at, after, pen: !!(pens[st.sel] || postPen) };
});
ok('at a trader, its pen gets a 📍 on the minimap', r4b.pen && r4b.at === r4b.away + 1 && r4b.after === r4b.away, r4b);

// 5. M, a click and the big map
const big = () => h.page.evaluate(() => { const r = GAME.MAP.el.getBoundingClientRect(); return { big: GAME.MAP.big, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
await h.page.keyboard.press('KeyM');
await h.page.evaluate(() => { GAME.renderOnce(0.25); GAME.endInputFrame(); GAME.renderOnce(0.25); });
const b1 = await big();
ok('M opens the big map, in the middle', b1.big && b1.w > 400 && Math.abs(b1.cx - 640) < 3 && Math.abs(b1.cy - 360) < 3, b1);
await h.page.mouse.click(b1.cx, b1.cy);
await h.page.evaluate(() => { GAME.renderOnce(0.25); });
const b2 = await big();
ok('a click on it closes it', !b2.big && b2.w < 200, b2);
await h.page.mouse.click(b2.cx, b2.cy);
await h.page.evaluate(() => { GAME.renderOnce(0.25); });
ok('a click on the minimap opens it', (await big()).big);
if (shots) await h.page.screenshot({ path: `${shots}/map-big.png` });
await h.page.evaluate(() => { GAME.mapToggle(false); GAME.renderOnce(0.25); });
if (shots) await h.page.screenshot({ path: `${shots}/map-mini.png` });

// 6. an edge arrow that would sit under the minimap slides back along its ray, just clear of it
const r6 = await h.page.evaluate(() => {
  const { MAP, mapDodge } = GAME, r = MAP.rect, cx = 640, cy = 360, x = 30, y = (r.t + r.b) / 2, [ax, ay] = mapDodge(x, y, cx, cy);
  const cross = (x - cx) * (ay - cy) - (y - cy) * (ax - cx);
  return { ax, ay, r, out: ax > r.r || ax < r.l || ay > r.b || ay < r.t, onRay: Math.abs(cross) < 1e-3 * Math.hypot(x - cx, y - cy) ** 2, away: mapDodge(900, 50, cx, cy) };
});
ok('edge arrows keep clear of the minimap', r6.out && r6.onRay && r6.away[0] === 900 && r6.away[1] === 50, r6);

// 7. ONLINE: the host's fog round-trips (a late friend sees what's been uncovered)
const r7 = await h.page.evaluate(() => {
  const { MAP, mapFogOut, mapFogIn } = GAME, VX = MAP.layer.width, VZ = MAP.layer.height;
  const coarse = () => { let n = 0; for (let j = 0; j < VZ; j += 2) for (let i = 0; i < VX; i += 2) n += MAP.rv[j * VX + i] > 0.5; return n; };
  MAP.fogS = ''; const s = mapFogOut(), n0 = coarse(), saved = MAP.rv.slice();
  MAP.rv.fill(0); mapFogIn(s); const n1 = coarse();
  let missing = 0; for (let k = 0; k < saved.length; k++) if (saved[k] > 0.5 && !(MAP.rv[k] > 0.5)) missing++;
  MAP.rv.set(saved);
  return { bytes: s.length, n0, n1, missing, junk: (() => { try { mapFogIn('zz.!!.' + 'z'.repeat(50)); return true; } catch (e) { return String(e); } })() };
});
ok(`fog round-trips (${r7.bytes} chars)`, r7.n0 > 0 && r7.n1 === r7.n0 && r7.bytes < 6000, r7);
ok('junk fog is harmless', r7.junk === true, r7);

// 8. a new journey: parchment again
const r8 = await h.page.evaluate(() => {
  const { G, resetGame, renderOnce, MAP, mapSeen, pathPoint, finishGame } = GAME;
  finishGame(0); resetGame(); renderOnce(0.25);
  const p = pathPoint(200, 0), d = G.dogs[0];
  return { walked: mapSeen(p.x, p.z), dog: mapSeen(d.x, d.z), big: MAP.big };
});
ok('a new journey is parchment again (but round the dogs)', !r8.walked && r8.dog && !r8.big, r8);

// 9. what it costs
const r9 = await h.page.evaluate(() => {
  const { MAP, mapCompose, mapReveal, updateMap, mapToggle } = GAME, t = () => performance.now();
  let a = t(); for (let i = 0; i < 10; i++) mapCompose(0, 1e9); const full = (t() - a) / 10;
  a = t(); for (let i = 0; i < 50; i++) { MAP.t = 0; updateMap(0.016); } const tick = (t() - a) / 50;
  a = t(); for (let i = 0; i < 50; i++) { MAP.redraw = true; updateMap(0.001); } const draw = (t() - a) / 50;
  mapToggle(true); updateMap(0.016); a = t(); for (let i = 0; i < 20; i++) { MAP.redraw = true; updateMap(0.001); } const bigDraw = (t() - a) / 20; mapToggle(false);
  return { full: +full.toFixed(2), tick: +tick.toFixed(2), draw: +draw.toFixed(2), bigDraw: +bigDraw.toFixed(2) };
});
console.log(`     ms: whole picture ${r9.full}, a tick (uncover + redo near view) ${r9.tick}, a draw ${r9.draw}, a big-map draw ${r9.bigDraw} (T.map.hz a second)`);
ok('cheap enough', r9.tick < 8 && r9.draw < 4, r9);

ok('no page errors', h.errors.length === 0, h.errors);
await h.close();
process.exit(fails ? 1 : 0);
