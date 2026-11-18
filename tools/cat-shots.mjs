// CAT LOOKS as contact sheets (a look check, not a test): every breed in every coat, kittens, every pose, ours (a collar and a bell),
// mice in every state and a hole, and a game-zoom shot (cats by a dog and the flock).
// node tools/cat-shots.mjs OUTDIR [--sheets coats,walk,faces,heads,kittens,poses,mice,game,norwegian,linus] [--breeds moggy:0,siamese:0 (poses: who)] [--states sit,hiss]
//   [--side rad (poses: the cat turned from facing the camera, 1.1)] [--elev k (the camera's height, 1.2: the game's; lower: more side on)] [--size px (a cell, 200)] [--view m (a close-up's height, 1.0)] [--turn rad (the cat turned from facing the camera, 0.6)] [--scale n (deviceScaleFactor, 1)]
// Writes OUTDIR/cats-coats.png, cats-walk.png, cats-faces.png, cats-heads.png (eyes: front, ¾, profile, a kitten),
//   cats-norwegian.png (+ barn-style), cats-norwegian-side.png, cats-norwegian-game.png, cats-linus.png, cats-kittens.png, cats-poses-<breed>.png, mice.png, cats-game.png; prints any page errors.
import { open } from './harness.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const dir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'cat-shots';
mkdirSync(dir, { recursive: true });
const sheets = (arg('--sheets', 'coats,walk,faces,heads,kittens,poses,mice,game,norwegian,linus')).split(',');
const h = await open({ query: '?debug', width: 1000, height: 800, scale: +arg('--scale', 1) });
await h.page.evaluate(elev => {
  const { G, startGame, renderOnce, CATS, MICE, MOUSE_HOLES, groundY, camera, renderer, scene, CAM_R, THREE, CATL } = GAME;
  GAME.T.fur.auto = false;   // (a slow headless browser mustn't take the fur off)
  startGame({ kind: 'bot', index: 0 }); G.players[0].bot = {};
  for (const c of G.coyotes) c.gone = true;
  CATL.noBlink = true;
  const d = G.dogs[0], spot = { x: d.x + 4, z: d.z + 3 };
  for (const s of G.sheep) { s.x += 80; s.z += 80; }
  renderOnce(1 / 60);
  const CAM = new THREE.Vector3(1, elev, 1).normalize();
  window.SHOT = { spot, CAM };
  // a cell: the camera on (x, y, z), view m tall, from the game's angle (or turned: ang about y), into the sheet at (cx, cy)
  window.CELL = (sheet, cx, cy, size, x, y, z, view, ang = 0, label = '', el = 0) => {
    const v = (el ? new THREE.Vector3(1, el, 1).normalize() : CAM.clone()).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang), cv = renderer.domElement, W = cv.width, H = cv.height, asp = W / H;
    camera.position.set(x + v.x * 300, y + v.y * 300, z + v.z * 300); camera.lookAt(x, y, z);
    camera.top = view / 2; camera.bottom = -view / 2; camera.left = -view / 2 * asp; camera.right = view / 2 * asp; camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const s = Math.min(W, H), c = sheet.getContext('2d');
    c.drawImage(cv, (W - s) / 2, (H - s) / 2, s, s, cx, cy, size, size);
    if (label) { c.font = '13px sans-serif'; c.fillStyle = '#000a'; c.fillText(label, cx + 5, cy + 15); c.fillStyle = '#fff'; c.fillText(label, cx + 4, cy + 14); }
  };
  window.SHEET = (cols, rows, size) => { const s = document.createElement('canvas'); s.width = cols * size; s.height = rows * size; const c = s.getContext('2d'); c.fillStyle = '#e9e2d0'; c.fillRect(0, 0, s.width, s.height); return s; };
  // one cat alone at the spot, in a state, settled into its pose
  window.CAT = (o, frames = 40) => {
    CATS.length = 0; MICE.length = 0; MOUSE_HOLES.length = 0;
    const c = Object.assign({ isCat: true, id: 7, breed: 'moggy', coat: 0, x: spot.x, z: spot.z, yaw: Math.atan2(CAM.x, CAM.z), vx: 0, vz: 0, scale: 1, age: 400, state: 'sit', stateT: 0,
      spd: 0, look: 0, lookUp: 0, tail: 0.55, puff: 0, crouch: 0, owned: false, trust: 0, hunger: 0, heldBy: null, grabbed: null, mouse: null, dead: false, gone: false }, o);
    c.y = c.y ?? groundY(c.x, c.z);
    if (c.spd) { c.vx = Math.sin(c.yaw) * c.spd; c.vz = Math.cos(c.yaw) * c.spd; }
    CATS.push(c);
    for (let i = 0; i < frames; i++) { GAME.syncCats(1 / 30); GAME.syncMice(1 / 30); }
    return c;
  };
}, +arg('--elev', 1.2));
const save = async (name, js, args) => {
  const png = await h.page.evaluate(js, args);
  writeFileSync(`${dir}/${name}.png`, Buffer.from(png.split(',')[1], 'base64')); console.log('wrote', `${dir}/${name}.png`);
};
const size = +arg('--size', 200), view = +arg('--view', 1.0), turn = +arg('--turn', 0.6);
// every breed, every coat: sitting (3/4 front) / walking (side on)
for (const [name, st] of [['coats', 'sit'], ['walk', 'walk'], ['faces', 'sit']]) {
  if (!sheets.includes(name)) continue;
  await save('cats-' + name, ({ name, size, view, turn, st }) => {
    const { CAT_BREEDS, catSize } = GAME, ids = Object.keys(CAT_BREEDS), cols = Math.max(...ids.map(b => CAT_BREEDS[b].coats.length));
    const sheet = SHEET(cols, ids.length, size);
    ids.forEach((b, r) => CAT_BREEDS[b].coats.forEach((C, i) => {
      const c = CAT({ breed: b, coat: i, state: st, spd: st === 'walk' ? 0.8 : 0, yaw: Math.atan2(SHOT.CAM.x, SHOT.CAM.z) + (st === 'walk' ? Math.PI / 2 : name === 'faces' ? 0.25 : turn), owned: i === 0, tail: st === 'walk' ? 0.8 : 0.55 });
      const k = catSize(c), f = name === 'faces' ? GAME.catMouth(c) : null;
      if (f) CELL(sheet, i * size, r * size, size, f.x, f.y + 0.06 * k, f.z, 0.42 * k, 0, `${b} ${C.n}`);
      else CELL(sheet, i * size, r * size, size, c.x, c.y + 0.28 * k, c.z, view * k / 1.25, 0, `${b} ${C.n}`);
    }));
    return sheet.toDataURL('image/png');
  }, { name, size, view, turn, st });
}
// heads, every breed: front on, ¾ (the game's angle), profile, a kitten front on (the eyes: set in, level, apart)
if (sheets.includes('heads')) await save('cats-heads', ({ size }) => {
  const { CAT_BREEDS, catSize, catMouth } = GAME, ids = Object.keys(CAT_BREEDS), cy = Math.atan2(SHOT.CAM.x, SHOT.CAM.z), sheet = SHEET(4, ids.length, size);
  ids.forEach((b, r) => [['front', 0, 1, 0.3], ['3/4', 0.55, 1, 0], ['profile', Math.PI / 2, 1, 0.25], ['kitten', 0, 0.55, 0.3]].forEach(([lab, turn, sc, el], i) => {
    const c = CAT({ breed: b, coat: b === 'moggy' ? 1 : 0, state: 'sit', yaw: cy + turn, scale: sc }), k = catSize(c), f = catMouth(c);
    CELL(sheet, i * size, r * size, size, f.x, f.y + 0.06 * k, f.z, 0.36 * k * (sc < 1 ? 1.25 : 1), 0, `${b} ${lab}`, el);
  }));
  return sheet.toDataURL('image/png');
}, { size });
// the Norwegian: its coats sitting and walking (¾), kittens, faces; side on (its plume, britches, a stride or two); at game zoom
if (sheets.includes('norwegian')) {
  await save('cats-norwegian', ({ size }) => {   // (its one coat, posed as in its photo: sat, looking up a little)
    const { catSize, catMouth } = GAME, cy = Math.atan2(SHOT.CAM.x, SHOT.CAM.z), sheet = SHEET(4, 3, size);
    [['barn', { state: 'sit', yaw: cy }, 'body', 0.18], ['barn face', { state: 'sit', yaw: cy }, 'face', 0.18], ['barn 3/4', { state: 'sit', yaw: cy + 0.6 }, 'body', 0.18], ['barn side', { state: 'sit', yaw: cy + Math.PI / 2 }, 'body', 0.18],
      ['face', { state: 'sit', lookUp: 0.25, yaw: cy }, 'face', 0.5], ['face 3/4', { state: 'sit', lookUp: 0.2, yaw: cy + 0.5 }, 'face', 0.5], ['sat', { state: 'sit', lookUp: 0.25, yaw: cy + 0.15 }, 'body', 1.4],
      ['sat 3/4', { state: 'sit', lookUp: 0.2, yaw: cy + 0.6, owned: true }, 'body', 0], ['side', { state: 'idle', yaw: cy + Math.PI / 2, tail: 0.6 }, 'body', 0.4], ['walk', { state: 'walk', spd: 0.8, tail: 0.7, yaw: cy + Math.PI / 2 }, 'body', 0.4],
      ['walk 3/4', { state: 'walk', spd: 0.8, tail: 0.75, yaw: cy + 1.1 }, 'body', 0], ['kitten', { state: 'sit', scale: 0.55, lookUp: 0.2, yaw: cy + 0.5, tail: 0.8 }, 'body', 0]].forEach(([lab, o, kind, el], i) => {
      const c = CAT({ breed: 'norwegian', coat: 0, ...o }), k = catSize(c), cx = (i % 4) * size, cy2 = Math.floor(i / 4) * size;
      if (kind === 'face') { const f = catMouth(c); CELL(sheet, cx, cy2, size, f.x, f.y + 0.06 * k, f.z, 0.46 * k, 0, lab, el); }
      else CELL(sheet, cx, cy2, size, c.x, c.y + 0.3 * k, c.z, 1.05 * k * (o.scale ? 1.4 : 1), 0, lab, el);
    });
    return sheet.toDataURL('image/png');
  }, { size });
  await save('cats-norwegian-side', ({ size }) => {
    const { catSize } = GAME, cy = Math.atan2(SHOT.CAM.x, SHOT.CAM.z), sheet = SHEET(4, 2, size), side = cy + Math.PI / 2;
    [['stand', { state: 'sit', yaw: side, tail: 0.6 }, 40, 0], ['walk', { state: 'walk', spd: 0.8, tail: 0.7, yaw: side }, 40], ['walk +', { state: 'walk', spd: 0.8, tail: 0.7, yaw: side }, 46],
      ['trot', { state: 'trot', spd: 2, tail: 0.5, yaw: side }, 40], ['tail up', { state: 'walk', spd: 0.5, tail: 1, yaw: side }, 40], ['from behind', { state: 'walk', spd: 0.6, tail: 0.55, yaw: cy + Math.PI - 0.5 }, 40],
      ['loaf', { state: 'loaf', yaw: side }, 40], ['kitten', { state: 'walk', spd: 0.5, scale: 0.55, tail: 0.8, yaw: side }, 40]].forEach(([lab, o, fr], i) => {
      if (lab === 'stand') o.state = 'idle';
      const c = CAT({ breed: 'norwegian', coat: i % 4, ...o }, fr), k = catSize(c);
      CELL(sheet, (i % 4) * size, Math.floor(i / 4) * size, size, c.x, c.y + 0.26 * k, c.z, 1.15 * k * (o.scale ? 1.3 : 1), 0, lab, 0.4);
    });
    return sheet.toDataURL('image/png');
  }, { size });
  await save('cats-norwegian-game', () => {
    const { G, CATS, MICE, MOUSE_HOLES, groundY, renderer } = GAME, d = G.dogs[0];
    CATS.length = 0; MICE.length = 0; MOUSE_HOLES.length = 0;
    [['sit', 0], ['walk', 1], ['loaf', 2], ['walk', 3], ['sit', 1]].forEach(([st, co], i) => { const a = i / 5 * Math.PI * 2 + 0.4, x = d.x + Math.cos(a) * 2.6, z = d.z + Math.sin(a) * 2.6;
      CATS.push({ isCat: true, id: 70 + i, breed: 'norwegian', coat: co, x, z, y: groundY(x, z), yaw: a + 1.2, vx: 0, vz: 0, scale: i === 4 ? 0.55 : 1, state: st, spd: st === 'walk' ? 0.8 : 0, tail: 0.7, owned: i < 2 }); });
    CATS.push({ isCat: true, id: 79, breed: 'moggy', coat: 1, x: d.x - 1.5, z: d.z + 1.2, y: groundY(d.x - 1.5, d.z + 1.2), yaw: 2, state: 'sit', tail: 0.6 });
    for (let i = 0; i < 30; i++) GAME.renderOnce(1 / 30);
    const cv = renderer.domElement, s = document.createElement('canvas'), W = cv.width, H = cv.height; s.width = W * 1.5; s.height = H;
    const c = s.getContext('2d'); c.drawImage(cv, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(cv, W * 0.415, H * 0.35, W * 0.17, H * 0.3, W, 0, W * 0.5, H * 0.88);
    return s.toDataURL('image/png');
  });
}
// Linus (the moggy's orange tabby): close up, sat, walking his ringed tail up, at game zoom
if (sheets.includes('linus')) await save('cats-linus', ({ size }) => {
  const { catSize, catMouth, G, CATS, groundY } = GAME, cy = Math.atan2(SHOT.CAM.x, SHOT.CAM.z), sheet = SHEET(4, 2, size), L = { breed: 'moggy', coat: 1 };
  [['face', { state: 'sit', yaw: cy, lookUp: 0.2 }, 'face', 0.3], ['face 3/4', { state: 'sit', yaw: cy + 0.55 }, 'face', 0], ['sat', { state: 'sit', yaw: cy + 0.3, tail: 0.6 }, 'body', 0],
    ['walk, tail up', { state: 'walk', spd: 0.8, tail: 1, yaw: cy + Math.PI / 2 }, 'body', 0.4], ['walk 3/4', { state: 'walk', spd: 0.8, tail: 1, yaw: cy + 1.1 }, 'body', 0],
    ['from behind', { state: 'walk', spd: 0.6, tail: 1, yaw: cy + Math.PI - 0.4 }, 'body', 0], ['meow', { state: 'meow', yaw: cy + 0.4, tail: 1 }, 'body', 0]].forEach(([lab, o, kind, el], i) => {
    const c = CAT({ ...L, ...o }), k = catSize(c), cx = (i % 4) * size, cy2 = Math.floor(i / 4) * size;
    if (kind === 'face') { const f = catMouth(c); CELL(sheet, cx, cy2, size, f.x, f.y + 0.06 * k, f.z, 0.42 * k, 0, lab, el); }
    else CELL(sheet, cx, cy2, size, c.x, c.y + 0.3 * k, c.z, 1.2 * k, 0, lab, el);
  });
  CATS.length = 0; const d = G.dogs[0];   // at game zoom: Linus walking, tail up, by the dog
  CATS.push({ isCat: true, id: 7, breed: 'moggy', coat: 1, x: d.x + 1.6, z: d.z + 0.6, y: groundY(d.x + 1.6, d.z + 0.6), yaw: cy + 1.4, state: 'walk', spd: 0.8, vx: 0, vz: 0, tail: 1, owned: true },
    { isCat: true, id: 8, breed: 'moggy', coat: 1, x: d.x - 1.2, z: d.z + 1.4, y: groundY(d.x - 1.2, d.z + 1.4), yaw: cy + 0.3, state: 'sit', tail: 0.7 });
  for (let i = 0; i < 30; i++) GAME.syncCats(1 / 30);
  CELL(sheet, 3 * size, size, size, d.x, groundY(d.x, d.z) + 0.3, d.z, 6, 0, 'game zoom (×2.5)');
  return sheet.toDataURL('image/png');
}, { size });
// kittens: each breed at 0.55, 0.75, 1
if (sheets.includes('kittens')) await save('cats-kittens', ({ size, view, turn }) => {
  const { CAT_BREEDS } = GAME, ids = Object.keys(CAT_BREEDS), sc = [0.55, 0.75, 1], sheet = SHEET(sc.length * 2, ids.length, size);
  ids.forEach((b, r) => sc.forEach((s, i) => ['sit', 'walk'].forEach((st, j) => {
    const c = CAT({ breed: b, coat: 0, scale: s, state: st, spd: st === 'walk' ? 0.6 : 0, yaw: Math.atan2(SHOT.CAM.x, SHOT.CAM.z) + (st === 'walk' ? 1.2 : turn), tail: 0.7 });
    CELL(sheet, (i * 2 + j) * size, r * size, size, c.x, c.y + 0.3, c.z, view * 1.1, 0, `${b} ×${s}`);
  })));
  return sheet.toDataURL('image/png');
}, { size, view, turn });
// every pose, one breed a sheet
if (sheets.includes('poses')) for (const who of arg('--breeds', 'moggy:0,siamese:0,maine:1,persian:2').split(',')) {
  const [b, ci] = who.split(':');
  await save('cats-poses-' + b, ({ b, ci, size, view, turn, side, states }) => {
    const { catSize, groundY, CATS, MICE, CATM } = GAME, wrap = 7, sheet = SHEET(wrap, Math.ceil(states.length / wrap), size);
    states.forEach((st, i) => {
      const o = { breed: b, coat: +ci || 0, state: st, owned: true, yaw: Math.atan2(SHOT.CAM.x, SHOT.CAM.z) + side };
      if (/walk|trot|run|flee|stalk|rub/.test(st)) { o.spd = { walk: 0.8, trot: 1.8, run: 4.5, flee: 5, stalk: 0.35, rub: 0.4 }[st]; o.yaw = Math.atan2(SHOT.CAM.x, SHOT.CAM.z) + Math.PI / 2; }
      if (/stalk|freeze|wiggle/.test(st)) { o.crouch = 1; o.tail = 0.2; }
      if (st === 'flee') { o.puff = 0.5; o.tail = 0.2; }
      if (st === 'hiss') { o.puff = 1; o.yaw = Math.atan2(SHOT.CAM.x, SHOT.CAM.z) + side - 1.1; }
      if (st === 'rub' || st === 'meow') o.tail = 1;
      if (st === 'pounce') o.y = groundY(SHOT.spot.x, SHOT.spot.z) + 0.35;
      if (st === 'perch' || st === 'climb') o.y = groundY(SHOT.spot.x, SHOT.spot.z) + 0.3;
      if (st === 'held' || st === 'taken') { o.y = groundY(SHOT.spot.x, SHOT.spot.z) + 0.35; o.heldBy = { cw: { r: 0, p: 0 } }; }
      if (st === 'dead') o.dead = true;
      const c = CAT(o, st === 'pounce' ? 2 : 40);
      if (/pin|play|bite|eat/.test(st)) {   // its mouse, in front
        const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), k = catSize(c), m = { isMouse: true, id: 3, x: c.x + fx * 0.36 * k, z: c.z + fz * 0.36 * k, yaw: c.yaw + 1, state: st === 'eat' || st === 'bite' ? 'dead' : 'caught', coat: 0, scale: 1, spd: 0, dead: st === 'eat' };
        m.y = groundY(m.x, m.z); MICE.push(m); c.mouse = m; GAME.syncMice(1 / 30);
      }
      const k = catSize(c); CELL(sheet, (i % wrap) * size, Math.floor(i / wrap) * size, size, c.x, c.y + (st === 'held' || st === 'taken' ? 0.2 : 0.26) * k, c.z, view * k / 1.25 * 1.15, 0, st);
    });
    return sheet.toDataURL('image/png');
  }, { b, ci, size, view, turn, side: +arg('--side', 1.1), states: arg('--states', 'sit,loaf,sleep,groom,stretch,walk,trot,run,flee,stalk,freeze,wiggle,pounce,pin,play,bite,eat,drink,hiss,swipe,rub,meow,climb,perch,held,taken,dead').split(',') });
}
// mice: every state, each coat; a hole; one in a cat's mouth
if (sheets.includes('mice')) await save('mice', ({ size }) => {
  const { MICE, MOUSE_HOLES, CATS, groundY } = GAME, states = ['run', 'walk', 'sit', 'nibble', 'groom', 'caught', 'air', 'dead'], sheet = SHEET(states.length, 4, size);
  for (let co = 0; co < 3; co++) states.forEach((st, i) => {
    CATS.length = 0; MICE.length = 0; MOUSE_HOLES.length = 0;
    const x = SHOT.spot.x, z = SHOT.spot.z, m = { isMouse: true, id: i + co * 10, x, z, y: groundY(x, z) + (st === 'air' ? 0.12 : 0), yaw: Math.atan2(SHOT.CAM.x, SHOT.CAM.z) + Math.PI / 2, state: st, coat: co, scale: 1, spd: st === 'run' ? 2 : st === 'walk' ? 0.4 : 0, vx: 0, vz: 0, dead: st === 'dead' };
    if (st === 'run' || st === 'walk') { m.vx = Math.sin(m.yaw) * m.spd; m.vz = Math.cos(m.yaw) * m.spd; }
    MICE.push(m); GAME.syncCats(1 / 30); GAME.syncMice(1 / 30);
    CELL(sheet, i * size, co * size, size, x, m.y + 0.04, z, 0.32, 0, `${st} ${co}`);
  });
  CATS.length = 0; MICE.length = 0; const x = SHOT.spot.x, z = SHOT.spot.z;
  MOUSE_HOLES.push({ x, z, yaw: 0.3 }); MICE.push({ isMouse: true, id: 40, x: x + 0.2, z: z + 0.2, yaw: 2.4, state: 'sit', coat: 2, scale: 1, spd: 0 });
  GAME.syncMice(1 / 30); CELL(sheet, 0, 3 * size, size, x, groundY(x, z), z, 0.5, 0, 'hole');
  CELL(sheet, size, 3 * size, size, x, groundY(x, z), z, 2.5, 0, 'hole ×5');
  const c = CAT({ breed: 'moggy', coat: 1, state: 'walk', spd: 0.6, yaw: Math.atan2(SHOT.CAM.x, SHOT.CAM.z) + 1.0, tail: 0.8 });
  const m = { isMouse: true, id: 41, x: c.x, z: c.z, y: c.y + 0.3, yaw: c.yaw + Math.PI / 2, state: 'caught', coat: 0, scale: 1, spd: 0, heldBy: c }; MICE.push(m); c.mouse = m;
  for (let i = 0; i < 3; i++) { GAME.syncCats(1 / 30); GAME.syncMice(1 / 30); }
  CELL(sheet, 2 * size, 3 * size, size, c.x, c.y + 0.3, c.z, 1.0, 0, 'carried');
  return sheet.toDataURL('image/png');
}, { size });
// at game zoom: cats round a dog, the flock by
if (sheets.includes('game')) await save('cats-game', () => {
  const { G, CATS, MICE, MOUSE_HOLES, cam, groundY, renderer, catSize, T } = GAME, d = G.dogs[0];
  CATS.length = 0; MICE.length = 0; MOUSE_HOLES.length = 0;
  for (const s of G.sheep) { s.x -= 80; s.z -= 80; }
  const bs = Object.keys(GAME.CAT_BREEDS), sts = ['sit', 'walk', 'loaf', 'stalk', 'hiss', 'sleep', 'groom'];
  bs.forEach((b, i) => { const a = i / bs.length * Math.PI * 2, x = d.x + Math.cos(a) * 3, z = d.z + Math.sin(a) * 3;
    CATS.push({ isCat: true, id: 20 + i, breed: b, coat: i % 2, x, z, y: groundY(x, z), yaw: a + 1, vx: 0, vz: 0, scale: i === 6 ? 0.6 : 1, state: sts[i], spd: sts[i] === 'walk' ? 0.8 : 0, tail: 0.6, puff: sts[i] === 'hiss' ? 1 : 0, crouch: sts[i] === 'stalk' ? 1 : 0, owned: i < 3 }); });
  for (let i = 0; i < 6; i++) { const x = d.x + 1.5 + i * 0.4, z = d.z - 2 - (i % 2) * 0.5; MICE.push({ isMouse: true, id: 60 + i, x, z, y: groundY(x, z), yaw: i, state: ['run', 'sit', 'nibble', 'walk', 'groom', 'run'][i], coat: i % 3, scale: 1, spd: i % 5 ? 0 : 2 }); }
  MOUSE_HOLES.push({ x: d.x + 1, z: d.z - 3, yaw: 0 });
  for (let i = 0; i < 30; i++) GAME.renderOnce(1 / 30);
  const cv = renderer.domElement, s = document.createElement('canvas'), W = cv.width, H = cv.height; s.width = W * 1.5; s.height = H;   // the shot, and its middle ×3 beside it
  const c = s.getContext('2d'); c.drawImage(cv, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(cv, W * 0.415, H * 0.35, W * 0.17, H * 0.3, W, 0, W * 0.5, H * 0.88);
  return s.toDataURL('image/png');
});
if (h.errors.length) console.log(h.errors.slice(0, 8).join('\n'));
await h.close();
