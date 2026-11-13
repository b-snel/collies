// AMBIENCE: each leg's sound. Puts the camera there (by day, by night), checks ambMix finds it, renders AMB offline (an
// OfflineAudioContext stepped at 20 Hz, seeded) and checks it: levels (no clipping, not too quiet or loud), no hum (little
// under 100 Hz), stereo (not one tone in the middle of your head), and which calls and beds play where. Then a live smoke run.
// node tools/amb-test.mjs [name…] [--secs S] [--wav DIR] [--tone F]   (--wav: each as a .wav, at the game's level; with ffmpeg a tour .mp3 too.
// --tone: a quiet steady F Hz added to each place: should fail, the checks' own check)
import { open } from './harness.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const argv = process.argv.slice(2), opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const secs = +(opt('--secs') || 16), wavDir = opt('--wav'), tone = +(opt('--tone') || 0), only = argv.filter((a, i) => !a.startsWith('--') && !(i && argv[i - 1].startsWith('--')));
// where: s / lat on the trail, or at: a spot; hour; want: ambMix at least this; calls / beds: each 'a|b' needs one; none: never
const PLACES = [
  { name: 'desert-dawn', s: 110, hour: 6.3, want: { desert: 0.8 }, calls: ['dove|wren|quail|trill'], none: ['cricket', 'frog', 'wave', 'gull'] },
  { name: 'desert-night', s: 110, hour: 23, want: { desert: 0.8 }, calls: ['cricket'], none: ['dove', 'wren', 'quail', 'wave', 'frog'] },
  { name: 'valley-river', s: 385, lat: -10, hour: 9, want: { valley: 0.8, river: 0.6 }, beds: ['river', 'wind'], calls: ['robin|warbler|chick|trill|peck'], none: ['cricket', 'dove', 'gull'] },
  { name: 'valley-night', s: 300, hour: 1, want: { valley: 0.8 }, calls: ['cricket'], none: ['robin', 'warbler', 'chick', 'gull'] },
  { name: 'oceanside', s: 545, lat: 8, hour: 11, want: { shore: 0.8, surf: 0.5 }, beds: ['surf'], calls: ['wave', 'gull'], none: ['cricket', 'frog'] },
  { name: 'oceanside-night', s: 560, lat: 8, hour: 22.5, want: { shore: 0.8, surf: 0.5 }, calls: ['wave', 'cricket'] },
  { name: 'meadow-brook', s: 728, lat: 4, hour: 10, want: { meadow: 0.8, brook: 0.5 }, beds: ['brook'], calls: ['lark|sky|warbler|chick'], none: ['cricket', 'gull', 'dove'] },
  { name: 'meadow-night', s: 790, lat: 16, hour: 0.5, want: { meadow: 0.8, lake: 0.2 }, calls: ['cricket', 'frog'], none: ['lark', 'warbler'] },
  { name: 'canyon', s: 932, hour: 12, want: { canyon: 0.8 }, beds: ['moan'], calls: ['cry|pebble|cwren'], none: ['gull', 'frog'] },
  { name: 'snakes-noon', s: 985, hour: 13, want: { desert: 0.8, hot: 0.8 }, calls: ['cicada'], none: ['frog', 'gull'] },
  { name: 'trading-post', at: 'market', hour: 15.5, want: { chime: 0.6, desert: 0.8 }, calls: ['chime'], none: ['gull', 'frog'] },
  { name: 'pass', s: 1300, hour: 11, want: { pass: 0.95 }, beds: ['wind'], none: ['cricket', 'frog', 'dove', 'warbler', 'gull', 'cicada'] },
  { name: 'pass-fire-night', at: 'fire', hour: 2, want: { pass: 0.9, fire: 0.5 }, beds: ['fire'], none: ['cricket', 'frog', 'owl', 'poorwill'] },
  { name: 'blizzard', s: 1300, hour: 13, blizz: 1, want: { blizz: 0.9 }, beds: ['wind'], none: ['cricket', 'raven'] },
  { name: 'cold-harbour', at: 'harbour', hour: 10, want: { harb: 0.8 }, calls: ['lap', 'tink|creak|bell'], none: ['cricket', 'dove', 'cicada'] },
  { name: 'at-sea', sea: { leg: 1, under: true }, hour: 11, want: { sea: 1 }, calls: ['creak'], none: ['cricket', 'dove', 'wave', 'robin'] },
  { name: 'island', sea: { leg: 2 }, hour: 9, want: { isle: 1 }, calls: ['wave', 'gull'], none: ['cricket'] },
];
const h = await open({ query: '?sim&debug' });
const todo = PLACES.filter(p => !only.length || only.some(o => p.name.includes(o)));
const rows = [], fails = [];
for (const P of todo) {
  const r = await h.page.evaluate(async ({ P, secs, wav, tone }) => {
    const { G, T, cam, pathPoint, AMB, ambMix, updateLighting, PASS, MARKET } = GAME;
    if (G.mode !== 'play') { GAME.startGame({ kind: 'bot', index: 0 }); GAME.resetGame(); }
    if (P.sea) GAME.seaStart(P.sea);
    G.clock.hour = P.hour; PASS.blizz.k = P.blizz || 0;
    if (P.sea) { const S = GAME.SEA; cam.x = GAME.BOAT.x; cam.z = GAME.BOAT.z; S.heelV = 0.12; S.pitchV = 0.08; if (!S.docked) { S.aw = 9; S.u = 4; } }
    else if (P.at === 'market') { cam.x = MARKET.x + 4; cam.z = MARKET.z + 4; }
    else if (P.at === 'fire') { const f = PASS.fires.find(f => f.s > 1300) || PASS.fires[PASS.fires.length - 1]; f.fuel = 5; cam.x = f.x + 3; cam.z = f.z + 2; }
    else if (P.at === 'harbour') { const q = GAME.HARB.pts[4]; cam.x = q.x; cam.z = q.z; }
    else { const p = pathPoint(P.s, P.lat || 0); cam.x = p.x; cam.z = p.z; }
    updateLighting(0.016);
    const m = JSON.parse(JSON.stringify(ambMix(10)));
    // seeded, so each run sounds (and checks) the same
    let seed = 1234567; for (const c of P.name) seed = Math.imul(seed ^ c.charCodeAt(0), 2654435761) >>> 0;
    const rnd0 = Math.random; Math.random = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const sr = 44100, off = new OfflineAudioContext(2, Math.round(sr * secs), sr), tick = 0.05;
    AMB.attach(off, off.destination, true); AMB.vol = 1; AMB.mute = false;
    AMB.update(m, tick); const beds = new Set(AMB.beds());
    if (tone) { const o = off.createOscillator(), g = off.createGain(); o.frequency.value = tone; g.gain.value = 0.004; o.connect(g); g.connect(off.destination); o.start(); }
    for (let k = 1; k * tick < secs - 0.06; k++) off.suspend(k * tick).then(() => { AMB.update(m, tick); if (P.sea) GAME.seaAmbience(tick); for (const b of AMB.beds()) beds.add(b); off.resume(); });
    const t0 = performance.now(), buf = await off.startRendering(), ms = performance.now() - t0;
    Math.random = rnd0;
    const L = buf.getChannelData(0), Rr = buf.getChannelData(1), n = buf.length, i0 = Math.floor(sr * 3), a = 1 - Math.exp(-2 * Math.PI * 100 / sr);
    let ss = 0, lf = 0, pk = 0, y1 = 0, y2 = 0, nan = 0, lr = 0, ll = 0, rr = 0; const win = [], W = sr / 2; let ws = 0, wn = 0;
    for (let i = 0; i < n; i++) {
      const l = L[i], r = Rr[i], v = (l + r) / 2; if (!Number.isFinite(v)) { nan++; continue; }
      y1 += (v - y1) * a; y2 += (y1 - y2) * a;
      if (i < i0) continue;
      ss += v * v; lf += y2 * y2; pk = Math.max(pk, Math.abs(l), Math.abs(r)); lr += l * r; ll += l * l; rr += r * r;
      ws += v * v; if (++wn >= W) { win.push(10 * Math.log10(ws / wn + 1e-12)); ws = 0; wn = 0; }
    }
    const db = x => 20 * Math.log10(x + 1e-12), N = n - i0, mean = win.reduce((s, x) => s + x, 0) / win.length;
    const out = { m, n: { ...AMB.n }, beds: [...beds], ms: Math.round(ms), nan, rms: db(Math.sqrt(ss / N)), peak: db(pk), lf: db(Math.sqrt(lf / N)), corr: lr / Math.sqrt(ll * rr + 1e-12),
      swing: Math.sqrt(win.reduce((s, x) => s + (x - mean) ** 2, 0) / win.length) };
    // steady tones (a hum, a drone, a whine): 4096-point frames; a bin standing 12 dB over its neighbours in most of them
    const F = 4096, K = F / 2, re = new Float64Array(F), im = new Float64Array(F), cnt = new Float32Array(K), dbs = new Float64Array(K), pre = new Float64Array(K + 1); let frames = 0;
    const fft = () => {
      for (let i = 1, j = 0; i < F; i++) { let bit = F >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
      for (let len = 2; len <= F; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a), hl = len / 2;
        for (let i = 0; i < F; i += len) { let cr = 1, ci = 0; for (let k = 0; k < hl; k++) { const p = i + k, q = p + hl, vr = re[q] * cr - im[q] * ci, vi = re[q] * ci + im[q] * cr; re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
    };
    for (let s0 = i0; s0 + F <= n; s0 += F) {
      for (let i = 0; i < F; i++) { re[i] = (L[s0 + i] + Rr[s0 + i]) / 2 * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / F)); im[i] = 0; }
      fft(); let mx = -400; for (let k = 0; k < K; k++) { dbs[k] = 10 * Math.log10(re[k] * re[k] + im[k] * im[k] + 1e-20); mx = Math.max(mx, dbs[k]); pre[k + 1] = pre[k] + dbs[k]; }
      for (let k = 8; k < 760; k++) { const w = Math.max(6, Math.floor(k * 0.15)), x = Math.max(2, Math.floor(k * 0.02)), a0 = Math.max(0, k - w), lo = (pre[k - x] - pre[a0]) / (k - x - a0), hi = (pre[k + w + 1] - pre[k + x + 1]) / (w - x); if (dbs[k] - Math.max(lo, hi) > 12 && dbs[k] > mx - 45) cnt[k]++; }   // (above both sides: not a filter's skirt)
      frames++;
    }
    let tk = 8; for (let k = 8; k < 760; k++) if (cnt[k] > cnt[tk]) tk = k;
    out.tone = { f: Math.round(tk * sr / F), p: frames ? cnt[tk] / frames : 0 };
    if (wav) {   // 16-bit stereo at the game's level (its master: 0.6)
      const dv = new DataView(new ArrayBuffer(44 + n * 4)), w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 4, true);
      for (let i = 0, o = 44; i < n; i++) for (const d of [L, Rr]) { dv.setInt16(o, Math.max(-1, Math.min(1, d[i] * 0.6)) * 32767, true); o += 2; }
      const u8 = new Uint8Array(dv.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      out.wav = btoa(s);
    }
    if (P.sea) GAME.resetGame();
    return out;
  }, { P, secs, wav: !!wavDir, tone });
  const bad = [], has = k => k.split('|').some(x => (r.n[x] || 0) > 0);
  if (r.nan) bad.push(`${r.nan} NaN`);
  for (const [k, v] of Object.entries(P.want || {})) if (!(r.m[k] >= v)) bad.push(`mix ${k} ${(+r.m[k]).toFixed(2)} (want ≥ ${v})`);
  for (const c of P.calls || []) if (!has(c)) bad.push(`no ${c}`);
  for (const c of P.none || []) if (has(c)) bad.push(`${c} ×${r.n[c]}`);
  for (const b of P.beds || []) if (!r.beds.includes(b)) bad.push(`no ${b} bed`);
  if (r.peak > -6) bad.push(`peak ${r.peak.toFixed(1)} dBFS`);
  if (r.rms < -56 || r.rms > -22) bad.push(`rms ${r.rms.toFixed(1)} dBFS`);
  if (r.lf > r.rms - 18) bad.push(`hum: under 100 Hz ${r.lf.toFixed(1)} vs ${r.rms.toFixed(1)} dBFS`);
  if (r.corr > 0.9) bad.push(`mono (corr ${r.corr.toFixed(2)})`);
  if (r.tone.p > 0.5) bad.push(`steady tone ${r.tone.f} Hz (${Math.round(r.tone.p * 100)}% of the time)`);
  const calls = Object.entries(r.n).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}${v > 1 ? '×' + v : ''}`).join(' ');
  rows.push(`${P.name.padEnd(16)} rms ${r.rms.toFixed(1).padStart(6)}  peak ${r.peak.toFixed(1).padStart(6)}  <100Hz ${r.lf.toFixed(1).padStart(6)}  corr ${r.corr.toFixed(2)}  swing ${r.swing.toFixed(1).padStart(4)} dB  tone ${String(r.tone.f).padStart(5)} Hz ${String(Math.round(r.tone.p * 100)).padStart(2)}%  ${String(r.ms).padStart(5)} ms  ${bad.length ? '✖ ' + bad.join(', ') : '✔'}\n${''.padEnd(16)} beds: ${r.beds.join(' ') || '-'} · calls: ${calls || '-'}`);
  console.log(rows[rows.length - 1]);
  if (bad.length) fails.push(P.name);
  if (wavDir) { fs.mkdirSync(wavDir, { recursive: true }); fs.writeFileSync(path.join(wavDir, `${String(PLACES.indexOf(P)).padStart(2, '0')}-${P.name}.wav`), Buffer.from(r.wav, 'base64')); }
}
// each call on its own (a few of each, in the middle, at its usual distance): how loud, so they sit together
const CALLS = ['warbler', 'robin', 'chick', 'trill', 'peck', 'lark', 'sky', 'dove', 'quail', 'wren', 'cwren', 'gull', 'raven', 'cricket', 'peep', 'krek', 'bull', 'owl', 'poorwill',
  'cicada', 'bee', 'hopper', 'chime', 'creak', 'tink', 'bell', 'lap', 'ice', 'slide', 'pebble', 'cry'];
if (!only.length || only.includes('calls')) {
  const solo = await h.page.evaluate(async CALLS => {
    const { AMB } = GAME, res = {}, mix = { ...GAME.AMB_MIX }; for (const k in mix) if (typeof mix[k] === 'number') mix[k] = 0; mix.hour = 12; mix.isleKind = '';
    for (const k of CALLS) {
      const sr = 44100, secs = 12, off = new OfflineAudioContext(2, sr * secs, sr), tick = 0.05;
      AMB.attach(off, off.destination, true); AMB.update(mix, tick);
      for (let i = 1; i * tick < secs - 0.06; i++) off.suspend(i * tick).then(() => { AMB.update(mix, tick); if (i === 20 || i === 80 || i === 140) AMB.call(k); off.resume(); });
      const b = await off.startRendering(), L = b.getChannelData(0), R = b.getChannelData(1); let pk = 0, ss = 0, nOn = 0;
      for (let i = sr; i < b.length; i++) { const v = Math.max(Math.abs(L[i]), Math.abs(R[i])); pk = Math.max(pk, v); if (v > 1e-4) { ss += (L[i] * L[i] + R[i] * R[i]) / 2; nOn++; } }
      res[k] = { peak: 20 * Math.log10(pk + 1e-12), rms: 10 * Math.log10(ss / Math.max(1, nOn) + 1e-12) };
    }
    return res;
  }, CALLS);
  const loud = Object.entries(solo).filter(([, v]) => v.peak > -14 || v.peak < -40);
  console.log('calls (peak / rms while sounding, dBFS):\n' + Object.entries(solo).map(([k, v]) => `  ${k.padEnd(9)} ${v.peak.toFixed(1).padStart(6)} ${v.rms.toFixed(1).padStart(6)}`).join('\n'));
  if (loud.length) { console.log('✖ too loud / quiet:', loud.map(([k]) => k).join(' ')); fails.push('calls'); }
}
// live: the real loop, the real AudioContext: it attaches, plays, and nothing throws
const live = await open({ query: '?debug' });
await live.page.mouse.click(5, 5);
await live.page.waitForTimeout(4000);
const L = await live.page.evaluate(() => ({ on: GAME.AMB.on, beds: GAME.AMB.beds(), ctx: GAME.Sound.ctx && GAME.Sound.ctx.state, mix: GAME.AMB_MIX.desert }));
console.log('live', JSON.stringify(L));
if (!L.on || !L.beds.length || L.ctx !== 'running') fails.push('live');
const errs = [...h.errors, ...live.errors];
if (errs.length) { console.log(errs.join('\n')); fails.push('errors'); }
await live.close(); await h.close();
if (wavDir && !only.length) {   // one tour: every place, crossfaded
  const files = fs.readdirSync(wavDir).filter(f => f.endsWith('.wav')).sort().map(f => path.join(wavDir, f));
  try {
    const parts = []; let prev = '[0:a]';
    for (let i = 1; i < files.length; i++) { parts.push(`${prev}[${i}:a]acrossfade=d=2[x${i}]`); prev = `[x${i}]`; }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap(f => ['-i', f]), '-filter_complex', parts.join(';'), '-map', prev, '-b:a', '192k', path.join(wavDir, 'tour.mp3')]);
    console.log('tour', path.join(wavDir, 'tour.mp3'));
  } catch (e) { console.log('(no tour: ffmpeg)', String(e.message).slice(0, 200)); }
}
console.log(fails.length ? `FAIL ${fails.join(', ')}` : 'PASS');
process.exit(fails.length ? 1 : 0);
