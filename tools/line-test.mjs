// Online co-op over a bad line: every data channel in both pages goes through a throttle (a slow upload, a long delay each
// way), as a rural / satellite / phone link would.
//   PEERSERVER=host:port node tools/line-test.mjs [--kbps 48] [--ms 250] [--bloat 16000]   (bloat: bytes the line's own queue
//   (a modem's) holds that the browser can't see)
// Checks: the guest gets in over the line, and the grass map comes packed (~30 KB, not 159) with what the host's flock
// grazed; a /turn relay goes to both browsers' links when the site has one; the link is direct (here); 40 sheep driven: the
// guest's ping stays near the line's own (the host skips snapshots the line can't take yet, and slows down as its ping climbs)
// and its flock follows the host's;
// a dropped guest gets back in by itself. Numbers: the same drive with the skipping off (how far behind the guest falls).
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const argv = process.argv.slice(2), arg = (k, d) => argv.includes(k) ? +argv[argv.indexOf(k) + 1] : d;
const KBPS = arg('--kbps', 48), MS = arg('--ms', 250), BLOAT = arg('--bloat', 16000);
const PS = process.env.PEERSERVER ? `&peerserver=${process.env.PEERSERVER}` : '';
const srv = await serve(0), port = srv.address().port;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required', '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessRespectPreflightResults'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const report = { line: { kbps: KBPS, ms: MS, bloat: BLOAT }, checks: {}, numbers: {} };
let failed = 0;
function check(name, ok, info) { report.checks[name] = { ok: !!ok, ...(info !== undefined ? { info } : {}) }; if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${info !== undefined ? '  ' + JSON.stringify(info) : ''}`); }
const r2 = v => Math.round(v * 100) / 100;

// the line: each message waits its turn at KBPS (+60 bytes of headers), then lands MS later; bufferedAmount counts what's still to go
// out, past the BLOAT bytes the modem holds
function LINE({ bps, ms, bloat }) {
  const P = RTCDataChannel.prototype, send0 = P.send, ba = Object.getOwnPropertyDescriptor(P, 'bufferedAmount').get, Q = new WeakMap();
  P.send = function (d) {
    const n = typeof d === 'string' ? d.length : (d.byteLength ?? d.size ?? 0);
    let q = Q.get(this); if (!q) Q.set(this, q = { free: 0, bytes: 0 });
    const now = performance.now(), out = Math.max(now, q.free) + (n + 60) * 1000 / bps;
    q.free = out; q.bytes += n;
    setTimeout(() => { q.bytes -= n; }, out - now);
    setTimeout(() => { if (this.readyState === 'open') send0.call(this, d); }, out - now + ms);
  };
  Object.defineProperty(P, 'bufferedAmount', { configurable: true, get() { const q = Q.get(this); return ba.call(this) + (q ? Math.max(0, q.bytes - bloat) : 0); } });
}
const TURN = 'turn:127.0.0.1:3479';   // (nothing there: only that it's handed over)
async function openPage(query) {
  const ctx = await browser.newContext({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(LINE, { bps: KBPS * 1000 / 8, ms: MS, bloat: BLOAT });
  await ctx.route('**/turn', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ iceServers: [{ urls: [TURN], username: 'u', credential: 'p' }] }) }));
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e.stack || e)));
  await page.goto(`http://localhost:${port}/index.html${query}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.GAME && window.NET, null, { timeout: 120000 });
  await page.evaluate(() => { GAME.renderer.render = () => {}; });   // (SwiftShader would starve the CPU)
  return { ctx, page, errors };
}
const until = (P, fn, arg, ms = 20000) => P.page.waitForFunction(fn, arg, { timeout: ms, polling: 50 });
const startRecorder = P => P.page.evaluate(() => {
  window.__rec = [];
  (function rec() { requestAnimationFrame(rec); window.__rec.push([Date.now(), GAME.G.sheep.map(s => [s.id, s.x, s.z])]); if (window.__rec.length > 3000) window.__rec.shift(); })();
});
const takeRecord = P => P.page.evaluate(() => window.__rec.splice(0));
function flockErr(host, guest) {   // the guest's sheep vs the host's at the same wall-clock instant, m
  const errs = []; let j = 0;
  for (const [t, gs] of guest) {
    while (j + 1 < host.length && host[j + 1][0] <= t) j++;
    if (j + 1 >= host.length || host[j][0] > t) continue;
    const m = new Map(host[j][1].map(r => [r[0], r]));
    for (const [id, x, z] of gs) { const a = m.get(id); if (a) errs.push(Math.hypot(x - a[1], z - a[2])); }
  }
  errs.sort((a, b) => a - b);
  const q = f => r2(errs[Math.min(errs.length - 1, Math.floor(errs.length * f))] || 0);
  return { samples: errs.length, p50: q(0.5), p95: q(0.95) };
}
async function drive(A, B, secs) {   // ping every half second on the guest, the flock on both
  await Promise.all([startRecorder(A), startRecorder(B)]);
  const s0 = await A.page.evaluate(() => ({ ...NET.stats })), pings = [];
  for (let i = 0; i < secs * 2; i++) { await sleep(500); pings.push(await B.page.evaluate(() => Math.round(NET.rtt))); }
  const s1 = await A.page.evaluate(() => ({ ...NET.stats }));
  const [ra, rb] = await Promise.all([takeRecord(A), takeRecord(B)]);
  const tail = pings.slice(pings.length / 2).sort((a, b) => a - b);
  const every = await A.page.evaluate(() => NET.seats[0].every);
  return { pingLast: pings[pings.length - 1], pingMax: Math.max(...pings), pingP50: tail[tail.length >> 1], every, skipped: (s1.skip || 0) - (s0.skip || 0), sentBps: Math.round((s1.bytes - s0.bytes) / secs), flock: flockErr(ra, rb) };
}

try {
  // ---------------------------------------------------------------- host opens a room; its flock grazes a patch bare
  const A = await openPage(`?debug${PS}`);
  await A.page.click('#netOpen');
  await A.page.fill('#netName', 'Hank');
  await A.page.click('#netHostBtn');
  await until(A, () => NET.code, null, 30000);
  const code = await A.page.evaluate(() => NET.code);
  const patch = await A.page.evaluate(() => {
    for (let s = 95; s < 340; s += 5) {
      const c = GAME.pathPoint(s, 0), pts = [];
      for (let x = -6; x <= 6; x += 2) for (let z = -6; z <= 6; z += 2) pts.push([c.x + x, c.z + z]);
      if (pts.every(([x, z]) => GAME.grassAt(x, z) > 0.2 && GAME.sdfAt(x, z) > 1)) { for (const [x, z] of pts) for (let i = 0; i < 40; i++) NET.api.eat(x, z, 1); return pts; }
    }
    return [];
  });

  // ---------------------------------------------------------------- guest joins over the line
  const B = await openPage(`?debug&join=${code}${PS}`);
  await B.page.fill('#netName', 'Dad');
  const t0 = Date.now();
  await B.page.click('#netJoinBtn');
  await until(B, () => NET.inRoom, null, 60000);
  const joinMs = Date.now() - t0;
  await until(B, pts => pts.every(([x, z]) => GAME.grassAt(x, z) < 0.02), patch, 30000).catch(() => {});
  const grassMs = Date.now() - t0;
  const gB = await B.page.evaluate(pts => Math.max(...pts.map(([x, z]) => GAME.grassAt(x, z))), patch);
  const grassBytes = await A.page.evaluate(() => NET.stats.grass);
  check('the guest gets in over the line; the grass map comes packed, with the patch the host grazed', patch.length && gB < 0.02 && grassBytes < 60000,
    { joinMs, grassMs, grassBytes, patchOnGuest: r2(gB) });

  const ice = P => P.page.evaluate(([T, host]) => { const c = host ? NET.seats[0].conn : NET.conn; return { turn: NET.turn, has: c.peerConnection.getConfiguration().iceServers.some(s => [].concat(s.urls).includes(T)) }; }, [TURN, P === A]);
  const [iA, iB] = [await ice(A), await ice(B)];
  await until(B, () => NET.via, null, 5000).catch(() => {});
  const via = await B.page.evaluate(() => NET.via), chip = await A.page.evaluate(() => NET.seats[0].via);
  check("the site's relay (/turn) goes to both ends of the link; the link here is direct", iA.turn && iA.has && iB.turn && iB.has && via === 'direct' && chip === 'direct', { host: iA, guest: iB, via, hostSees: chip });

  // ---------------------------------------------------------------- a journey: 40 sheep driven over the line
  await A.page.evaluate(() => { GAME.startGame({ kind: 'bot', index: 0 }); GAME.G.players[0].bot = {}; GAME.T.falcon.on = GAME.T.bramble.on = false; });
  await until(B, () => NET.slot >= 0 && GAME.G.mode === 'play', null, 30000);
  await A.page.evaluate(() => {
    const { G, pens, toggleGate } = GAME, p = pens[0], d = G.dogs[0];
    for (let i = G.sheep.length; i < 40; i++) { const a = Math.random() * 6.28, r = Math.random() * (p.R - 2); G.sheep.push(GAME.makeSheep(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, { hunger: 0.4 })); }
    if (!p.open) toggleGate(p, d);
    const ux = Math.cos(p.gateA), uz = Math.sin(p.gateA);
    d.x = p.x - ux * 6; d.z = p.z - uz * 6; d.vx = d.vz = 0;
    const R = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }, F = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
    window.__drive = setInterval(() => {   // ~7 m behind the flock: out of the gate, then up the trail
      let cx = 0, cz = 0, n = 0; for (const s of G.sheep) { cx += s.x; cz += s.z; n++; } cx /= n; cz /= n;
      const out = Math.hypot(cx - p.x, cz - p.z) > p.R + 4, pt = GAME.pathPoint(GAME.sAt(cx, cz) + 20, 0);
      let ax = out ? pt.x - cx : ux, az = out ? pt.z - cz : uz; const al = Math.hypot(ax, az) || 1; ax /= al; az /= al;
      const tx = cx - ax * 7, tz = cz - az * 7, ddx = tx - d.x, ddz = tz - d.z, l = Math.hypot(ddx, ddz);
      const wx = l > 1 ? ddx / l : ax * 0.5, wz = l > 1 ? ddz / l : az * 0.5;
      G.players[0].bot = { mx: wx * R.x + wz * R.z, my: -(wx * F.x + wz * F.z), sprint: true };   // (sprinting: they scatter, every sheep on the move)
    }, 150);
  });
  await until(B, () => GAME.G.sheep.length === 40, null, 20000);
  await sleep(3000);
  const on = report.numbers.skipOn = await drive(A, B, 15);
  const bound = 2 * MS + 1500;
  check(`40 sheep driven: the guest's ping stays near the line's own (≤ ${bound} ms) and its flock follows`, on.pingP50 > 0 && on.pingP50 <= bound && on.pingLast <= bound && on.flock.p50 < 3, on);

  // ---------------------------------------------------------------- dropped: back in by itself
  await B.page.evaluate(() => NET.conn.close());
  await until(B, () => NET.dead, null, 8000);
  const t1 = Date.now();
  await until(B, () => NET.inRoom && !NET.dead && NET.conn && NET.conn.open, null, 40000).catch(() => {});
  await sleep(400);   // (the card's redrawn every 120 ms)
  const back = await B.page.evaluate(() => ({ inRoom: NET.inRoom, dead: NET.dead, slot: NET.slot, lost: !document.getElementById('netLost').classList.contains('hidden') }));
  await until(A, () => NET.seats.length === 1 && NET.seats[0].conn && NET.seats[0].conn.open, null, 10000).catch(() => {});
  const seat = await A.page.evaluate(() => ({ seats: NET.seats.length, open: !!(NET.seats[0] && NET.seats[0].conn && NET.seats[0].conn.open), dogs: GAME.G.dogs.length }));
  check('a dropped guest gets back in by itself, to the same dog', back.inRoom && !back.dead && !back.lost && back.slot === 1 && seat.seats === 1 && seat.open && seat.dogs === 2, { ...back, ...seat, backMs: Date.now() - t1 });

  // ---------------------------------------------------------------- for comparison: the same, the skipping off
  await sleep(4000);
  await A.page.evaluate(() => { const L = NET.api.limits; L.was = [L.backlog, L.slowMs]; L.backlog = L.slowMs = 1e12; });
  report.numbers.skipOff = await drive(A, B, 15);
  await A.page.evaluate(() => { const L = NET.api.limits; [L.backlog, L.slowMs] = L.was; clearInterval(window.__drive); });
  console.log('numbers', JSON.stringify(report.numbers));

  const errs = [...A.errors, ...B.errors];
  check('no page errors', !errs.length, errs.slice(0, 3));
} catch (e) {
  console.log('FAIL crashed', e && e.stack || e); failed++;
} finally {
  await browser.close(); srv.close();
}
console.log(JSON.stringify(report, null, 1));
console.log(failed ? `${failed} check(s) FAILED` : 'all checks passed');
process.exit(failed ? 1 : 0);
