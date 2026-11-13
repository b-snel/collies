// Every dog breed in every bit of kit, on the barn's turntable, as one contact sheet (a look check, not a test).
// node tools/dog-shots.mjs OUT.png [--breeds a,b:1 (b in its 2nd coat)] [--items 'hat,acc|hat'] [--angles a,b] [--size px] [--wrap n (one look: n breeds a row)]
import { open } from './harness.mjs';
import { writeFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const out = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'dogs.png';
const h = await open({ query: '?debug', width: +arg('--w', 900), height: +arg('--h', 700), scale: +arg('--scale', 1) });
const png = await h.page.evaluate(async ({ breeds, items, angles, size, wrapN }) => {
  const { DOGS, DOG_ITEMS, BARN, openBarn, barnTab, barnRender, dogSet, G } = GAME;
  GAME.T.fur.auto = false;   // (a slow headless browser mustn't take the fur off)
  DOGS.found = DOG_ITEMS.map(i => i.id);
  G.mode = 'title'; openBarn(); barnTab('dogs');
  const B = GAME.DOG_BREEDS || [{ id: null }];
  const bl = breeds ? breeds.split(',') : B.map(b => b.id);
  const looks = items ? items.split('|').map(s => s.split(',')) : [['none'], ['none', 'bandana'], ['none', 'bowtie'], ['none', 'bell'], ['none', 'shades'], ['none', 'flower'], ...DOG_ITEMS.filter(i => i.kind === 'hat').map(i => [i.id])];
  const angs = (angles || '-0.7').split(',').map(Number);
  const per = looks.length * angs.length, wrap = per === 1 ? wrapN : 1;   // one look: the breeds in a grid, wrapN across
  const cols = per * wrap, rows = Math.ceil(bl.length / wrap), sheet = document.createElement('canvas'); sheet.width = cols * size; sheet.height = rows * size;
  const cx = sheet.getContext('2d'); cx.fillStyle = '#e9e2d0'; cx.fillRect(0, 0, sheet.width, sheet.height); cx.font = '14px sans-serif'; cx.fillStyle = '#222';
  const cv = BARN.r.domElement;
  for (let i = 0; i < bl.length; i++) {
    const r = Math.floor(i / wrap); let c = (i % wrap) * per;
    for (const lk of looks) {
      const [hat, ...acc] = lk;
      const [bid, ci] = String(bl[i] || '').split(':'), B = GAME.dogBreed(bid);   // 'id:n': its nth coat
      dogSet(0, { breed: bid || undefined, hat, acc }); if (ci !== undefined) dogSet(0, { coat: B.coats[+ci % B.coats.length].b });
      for (const a of angs) {
        BARN.rot = a; BARN.drag = {}; barnRender(0);
        const bm = await createImageBitmap(cv);
        const s = Math.min(bm.width, bm.height), sx = (bm.width - s) / 2;
        cx.drawImage(bm, sx, (bm.height - s) / 2, s, s, c * size, r * size, size, size); c++;
      }
    }
    cx.fillText(bl[i] || '', (i % wrap) * per * size + 4, r * size + 16);
  }
  BARN.drag = null;
  return sheet.toDataURL('image/png');
}, { breeds: arg('--breeds'), items: arg('--items'), angles: arg('--angles'), size: +arg('--size', 160), wrapN: +arg('--wrap', 8) });
writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'));
if (h.errors.length) console.log(h.errors.slice(0, 5).join('\n'));
console.log('wrote', out);
await h.close();
