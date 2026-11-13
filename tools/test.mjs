// Test runner: `node tools/test.mjs [name[:arg,…] …] [--all] [--base REF] [-j N] [--shard I/N] [--list] [--why] [--timeout S]`.
//   no names   the tests for what's changed since REF (default: where this branch left origin/main), uncommitted and new files too
//   names      those (`bramble`, `pass:yeti` → `pass-test.mjs yeti`)       --all  every one
//   --merge [C] after merging main: only what the merge C (default HEAD) resolved, its lines unlike both parents (`git diff --cc`)
//   --list     each test and what it checks                                  --why  what would run and why, nothing run
//   -j N       N at once (default: cores)      --shard I/N  part I of N (CI)      --timeout S  per test (default 1200)
// Online ones (net, sea-net, hybrid) only with PEERSERVER=host:port. Seeded: SEED=n another Math.random (harness.mjs).
// Each a line: ok (its checks passed), FAIL (a FAIL line or "ok":false, or it crashed), ran (no checks: numbers; read them). Logs: --logs DIR.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOOLS = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(TOOLS, '..');
const TESTS = fs.readdirSync(TOOLS).filter(f => /-(test|sim)\.mjs$/.test(f)).map(f => f.slice(0, -4)).sort();
const NET = new Set(['net-test', 'sea-net-test', 'hybrid-test']);
const src = Object.fromEntries(TESTS.map(t => [t, fs.readFileSync(path.join(TOOLS, t + '.mjs'), 'utf8')]));

// index.html's sections (a `// ====` banner, then `// TITLE …`) → tests. '*': all. Not here: CORE, and a note to add it.
const CORE = 'flock-sim moves-sim morning-sim straggler-sim gateway-sim rush-test night-sim cluster-sim';
const SECTIONS = {
  PAGE: 'dawn-test map-test role-test hank-test input-test',   // the HTML and CSS above TUNING
  TUNING: '',   // by key: tests that read T.<key>
  'MATH / NOISE': '*', 'WORLD GENERATION': '*', TERRAIN: '*', SCENERY: '*',   // (the world moves)
  'GAME STATE': CORE, 'GAME FLOW': CORE, 'MAIN LOOP': CORE,   // (every feature adds a line here: by name too)
  AUDIO: 'amb-test hank-test', AMBIENCE: 'amb-test', INPUT: 'input-test dawn-test rope-test moves-sim',
  'RENDERER, CAMERA, LIGHTS, CEL-SHADING MATERIALS': 'role-test nads-test map-test',
  FENCES: CORE + ' pen-trap-test path-test', 'CREATURE MODELS': 'role-test nads-test',
  SHEEP: CORE + ' graze-sim crowd-sim lamb-sim breed-sim age-sim poop-test forage-sim water-test pen-trap-test bonk-test bramble-test',
  DOGS: CORE + ' role-test idle-test maul-test team-test swim-test input-test',
  'DOG MOVES & PHYSICS': 'moves-sim rush-test bone-test rope-test bonk-test bramble-test team-test maul-test vendor-test',
  FORAGE: 'forage-sim crowd-sim role-test vendor-test', WATER: 'water-test swim-test', 'DIG SPOTS': 'dig-test shear-test bone-test',
  BRAMBLES: 'bramble-test', 'BONK SPOTS': 'bonk-test mud-test', 'MUDDY DOGS': 'mud-test', RATTLESNAKES: 'vet-test', ROPES: 'rope-test', BONES: 'bone-test idle-test vendor-test',
  NAVIGATION: CORE + ' path-test den-test burrow-test',
  COYOTES: 'night-sim den-test den-defend-test burrow-test pen-trap-test team-test maul-test path-test moves-sim',
  COUGARS: 'cougar-sim maul-test team-test', FALCON: 'falcon-test canyon-test team-test', 'MOUNTAIN PASS': 'pass-test',
  'REMAINS & TOMBSTONES': 'vet-test water-test', 'CLOCK, EVENTS, DAY/NIGHT LIGHTING': CORE + ' lamb-sim breed-sim age-sim',
  CAMERA: 'map-test amb-test', 'SYNC VISUALS': 'role-test nads-test idle-test', 'RAM NADS': 'nads-test', 'CARRY SWING': 'moves-sim water-test',
  HAIR: 'role-test', HUD: 'dawn-test map-test hank-test input-test vendor-test', MAP: 'map-test',
  HANK: 'hank-test vet-test shear-test swim-test path-test pass-test rope-test', VET: 'vet-test', 'FLOCK LOOKS': 'hank-test role-test',
  'DOG WARDROBE': 'dig-test role-test', "HANK'S BARN": 'hank-test role-test', 'DAWN REPORT': 'dawn-test water-test lamb-sim',
  'FLOCK SAVE': 'hank-test age-sim shear-test', VAGABOND: 'vendor-test vet-test map-test', LLAMAS: 'llama-test rope-test', SAILING: 'sail-test vendor-test swim-test amb-test',
  'ONLINE CO-OP': 'net-test sea-net-test hybrid-test role-test', 'DEV MENU': '',   // (window.GAME's exports: by name only)
};
// other files → tests ('*': all); a test's own file runs it; anything else: none
const FILES = [[/^tools\/(harness|serve)\.mjs$/, '*'], [/^vendor\//, '*'], [/^audio\//, 'amb-test hank-test']];
// seconds each took, 4 at a time (for --shard; a new one: 40)
const SECS = { 'age-sim': 12, 'amb-test': 103, 'bone-test': 78, 'bonk-test': 26, 'bramble-test': 20, 'breed-sim': 50, 'burrow-test': 22, 'canyon-test': 37,
  'cluster-sim': 39, 'cougar-sim': 43, 'crowd-sim': 28, 'dawn-test': 96, 'den-defend-test': 18, 'den-test': 16, 'dig-test': 26, 'falcon-test': 62,
  'flock-sim': 81, 'forage-sim': 53, 'gateway-sim': 20, 'graze-sim': 17, 'hank-test': 83, 'idle-test': 139, 'input-test': 248, 'lamb-sim': 26,
  'map-test': 107, 'maul-test': 28, 'moves-sim': 65, 'mud-test': 30, 'morning-sim': 58, 'nads-test': 36, 'night-sim': 20, 'pass-test': 37, 'path-test': 36,
  'pen-trap-test': 32, 'poop-test': 26, 'role-test': 38, 'rope-test': 247, 'rush-test': 19, 'sail-test': 313, 'shear-test': 60, 'straggler-sim': 27,
  'swim-test': 27, 'team-test': 22, 'vendor-test': 48, 'vet-test': 40, 'llama-test': 110, 'water-test': 23, 'net-test': 120, 'sea-net-test': 120, 'hybrid-test': 90 };

const argv = process.argv.slice(2), flag = k => argv.includes(k), opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const OPTS = new Set(['--base', '-j', '--shard', '--timeout', '--logs']), names = argv.filter((a, i) => !a.startsWith('-') && !OPTS.has(argv[i - 1]));
const head = t => (src[t].match(/^\/\/ (.*)/) || [, ''])[1].replace(/^Headless (test|checks?)( for)?:? ?/i, '');
const sh = (...a) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 }); } catch (e) { return null; } };
const commit = c => c && !c.startsWith('-') && sh('rev-parse', '--verify', '-q', c + '^{commit}')?.trim();
const MERGE = flag('--merge') && (commit(opt('--merge')) ? names.splice(names.indexOf(opt('--merge')), 1)[0] : 'HEAD');   // (--merge then a test's name: a test)
const words = s => s.split(/\s+/).filter(Boolean);

if (flag('--list')) { for (const t of TESTS) console.log(`${t.padEnd(16)} ${head(t)}` + src[t].match(/^(?:\/\/.*\n)*/)[0].split('\n').slice(1, -1).map(l => '\n' + ' '.repeat(17) + l.replace(/^\/\/ ?/, '')).join('')); process.exit(0); }   // its whole header

// ---- what to run: name → { args, why: Set }
const pick = new Map(), add = (t, why, args = []) => { if (!src[t]) return; const p = pick.get(t) || { args, why: new Set() }; p.why.add(why); pick.set(t, p); };
const addAll = (list, why) => (list === '*' ? TESTS : words(list)).forEach(t => add(t, why));
if (flag('--all')) TESTS.forEach(t => add(t, 'all'));
for (const n of names) {
  const [nm, a] = n.split(':'), t = TESTS.find(x => x === nm) || TESTS.find(x => x === nm + '-test' || x === nm + '-sim') || TESTS.filter(x => x.startsWith(nm)).length === 1 && TESTS.find(x => x.startsWith(nm));
  if (!t) { console.error(`no test "${nm}" (node tools/test.mjs --list)`); process.exit(2); }
  add(t, 'asked', a ? a.split(',') : []);
}
if (MERGE) merged(MERGE);
else if (!names.length && !flag('--all')) changed();

// a -U0 diff (or a merge's --cc one) → file → lines of the result in its hunks
function hunks(diff) {
  const files = new Map(); let f = null;
  for (const l of diff.split('\n')) {
    let m;
    if ((m = l.match(/^\+\+\+ (?:b\/(.*)|\/dev\/null)/))) { f = m[1] || null; if (f && !files.has(f)) files.set(f, []); }
    else if ((m = l.match(/^diff --(?:git .*? b\/|cc |combined )(.*)$/))) { f = m[1]; if (f && !files.has(f)) files.set(f, []); }
    else if (f && (m = l.match(/^@@+ (?:-\d+(?:,\d+)? )+\+(\d+)(?:,(\d+))? @@/))) { const c = +m[1], d = m[2] === undefined ? 1 : +m[2]; for (let i = 0; i < Math.max(d, 1); i++) files.get(f).push(Math.max(1, c + i)); }
  }
  return files;
}
function changed() {
  const base = opt('--base') || ['origin/main', 'main'].map(r => sh('merge-base', 'HEAD', r)).find(Boolean)?.trim();
  if (!base) { console.error('no base to diff against (git fetch origin main, or --base REF)'); process.exit(2); }
  const files = hunks(sh('diff', '-U0', '--no-color', '--no-ext-diff', base) || '');
  for (const u of (sh('ls-files', '--others', '--exclude-standard') || '').split('\n').filter(Boolean)) files.set(u, []);
  console.log(`changed since ${base.slice(0, 9)}: ${[...files.keys()].join(', ') || 'nothing'}`);
  mapFiles(files);
}
// a merge: only hunks where the result is unlike every parent (what was resolved by hand, or an evil merge)
function merged(c) {
  const sha = commit(c), ps = sha && words(sh('rev-list', '--parents', '-n', '1', sha) || '').slice(1);
  if (!ps || ps.length < 2) { console.error(`${c} isn't a merge commit (--merge [COMMIT])`); process.exit(2); }
  const files = hunks(sh('diff-tree', '--cc', '-U0', '--no-color', '--no-ext-diff', sha) || '');
  console.log(`merge ${sha.slice(0, 9)}: resolved ${[...files].map(([f, l]) => `${f} (${l.length})`).join(', ') || 'nothing: clean'}`);
  mapFiles(files, sh('show', sha + ':index.html'));
}
function mapFiles(files, html) {
  for (const [file, lines] of files) {
    const own = file.match(/^tools\/(.*-(?:test|sim))\.mjs$/);
    if (own) { add(own[1], file); continue; }
    if (file === 'index.html') { indexHtml(lines, html); continue; }
    for (const [re, list] of FILES) if (re.test(file)) addAll(list, file);
  }
}
function indexHtml(lines, html) {
  const L = (html || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')).split('\n'), secAt = [], seen = new Set(), def = /^(?:async\s+)?function\*?\s+(\w+)|^(?:const|let|var)\s+(\w+)/;
  let sec = 'PAGE';
  for (let i = 0; i < L.length; i++) {
    const t = /^\/\/ ={20,}/.test(L[i]) && (L[i + 1] || '').match(/^\/\/ ((\b[A-Z][A-Z'&/]*)([ ,/&-]+[A-Z][A-Z'&/]*)*)/);
    if (t) sec = t[1].trim();
    secAt[i + 1] = sec;
  }
  const keyAt = n => { for (let i = n - 1; i >= 0; i--) { const m = L[i].match(/^ {2}(\w+): /); if (m) return m[1]; if (/^const T = \{/.test(L[i])) return null; } return null; };
  const nameAt = n => { for (let i = n - 1; i >= 0; i--) { const m = L[i].match(def); if (m) return m[1] || m[2]; } return null; };
  for (const n of lines) {
    const s = secAt[n] || 'PAGE';
    if (!seen.has('s:' + s)) {
      seen.add('s:' + s);
      if (!(s in SECTIONS)) { console.log(`  (section "${s}" isn't in SECTIONS in tools/test.mjs: core tests for now; add it)`); addAll(CORE, `index.html ${s}`); }
      else addAll(SECTIONS[s], `index.html ${s}`);
    }
    if (s === 'TUNING') { const k = keyAt(n); if (k && !seen.has('k:' + k)) { seen.add('k:' + k); const re = new RegExp(`\\bT_?\\.${k}\\b`); TESTS.filter(t => re.test(src[t])).forEach(t => add(t, `T.${k}`)); } continue; }
    if (s === 'DEV MENU' || s === 'PAGE') continue;
    const nm = nameAt(n);
    if (nm && nm.length > 3 && !/^[A-Z0-9_]+$/.test(nm) && !seen.has('n:' + nm)) { seen.add('n:' + nm); const re = new RegExp(`\\b${nm}\\b`), hit = TESTS.filter(t => re.test(src[t])); if (hit.length <= TESTS.length / 4) hit.forEach(t => add(t, nm)); }   // (resetGame, step…: everyone's)
  }
}

// ---- online ones need a server of our own; shard; run
let todo = [...pick.keys()];
const skip = todo.filter(t => NET.has(t) && !process.env.PEERSERVER); todo = todo.filter(t => !skip.includes(t));
const sh_ = opt('--shard');
if (sh_) {
  const [i, n] = sh_.split('/').map(Number), bins = Array.from({ length: n }, () => ({ s: 0, t: [] }));
  for (const t of [...todo].sort((a, b) => (SECS[b] || 40) - (SECS[a] || 40) || a.localeCompare(b))) { const b = bins.reduce((m, x) => x.s < m.s ? x : m); b.s += SECS[t] || 40; b.t.push(t); }
  todo = bins[i - 1].t;
}
todo.sort((a, b) => (SECS[b] || 40) - (SECS[a] || 40));   // longest first
if (flag('--why') || !todo.length) {
  for (const t of todo) console.log(`${t.padEnd(16)} ${[...pick.get(t).why].slice(0, 6).join(', ')}`);
  if (skip.length) console.log(`skipped (no PEERSERVER): ${skip.join(' ')}`);
  if (!todo.length) console.log(MERGE ? 'nothing to re-run (push: CI runs them all)' : 'nothing to run');
  process.exit(0);
}

const N = +(opt('-j') || os.cpus().length), LIMIT = +(opt('--timeout') || 1200) * 1000;
const LOGS = opt('--logs') || path.join(os.tmpdir(), 'collies-tests'); fs.mkdirSync(LOGS, { recursive: true });
console.log(`${todo.length} test${todo.length > 1 ? 's' : ''}, ${Math.min(N, todo.length)} at a time${skip.length ? ` (skipped, no PEERSERVER: ${skip.join(' ')})` : ''}; logs in ${LOGS}`);
const t0 = Date.now(), res = [];
const one = t => new Promise(done => {
  const args = pick.get(t).args, log = path.join(LOGS, t + '.log'), out = [], s = Date.now();
  const p = spawn(process.execPath, [path.join(TOOLS, t + '.mjs'), ...args], { cwd: ROOT, env: process.env });
  p.stdout.on('data', b => out.push(b)); p.stderr.on('data', b => out.push(b));
  const kill = setTimeout(() => { out.push(Buffer.from(`\n(timed out after ${LIMIT / 1000} s)\n`)); p.kill('SIGKILL'); }, LIMIT);
  p.on('close', code => {
    clearTimeout(kill);
    const text = Buffer.concat(out).toString(), fails = text.split('\n').filter(l => /^FAIL\b|"ok":false/.test(l)), oks = (text.match(/^(ok|PASS)\b|"ok":true/gm) || []).length;   // (ok / PASS lines, or {"ok":…})
    fs.writeFileSync(log, text);
    const st = code !== 0 || fails.length ? 'FAIL' : oks ? 'ok' : 'ran', secs = Math.round((Date.now() - s) / 1000);
    const name = t + (args.length ? ' ' + args.join(' ') : '');
    console.log(`${st.padEnd(4)} ${name.padEnd(22)} ${String(secs).padStart(4)} s  ${st === 'ran' ? 'no checks' : `${oks} ok${fails.length ? `, ${fails.length} failed` : ''}`}${code && !fails.length ? `, exit ${code}` : ''}`);
    if (st === 'FAIL') { for (const l of (fails.length ? fails : text.trim().split('\n').slice(-6)).slice(0, 8)) console.log('       ' + l.slice(0, 220)); console.log(`       → ${log}`); }
    res.push({ t, st, secs }); done();
  });
});
const queue = todo.filter(t => !NET.has(t)), alone = todo.filter(t => NET.has(t));   // online ones: real time, so one at a time, after
await Promise.all(Array.from({ length: Math.min(N, queue.length) }, async () => { while (queue.length) await one(queue.shift()); }));
for (const t of alone) await one(t);
const bad = res.filter(r => r.st === 'FAIL');
console.log(`${bad.length ? 'FAILED' : 'passed'}: ${res.filter(r => r.st === 'ok').length} ok, ${res.filter(r => r.st === 'ran').length} ran, ${bad.length} failed in ${Math.round((Date.now() - t0) / 1000)} s${bad.length ? ' (' + bad.map(r => r.t).join(' ') + ')' : ''}`);
process.exit(bad.length ? 1 : 0);
