// Build step (Cloudflare Workers Builds): copy the site into dist/ and stamp index.html with the commit it was built from,
// so the title screen can say which build you're playing, and write dist/version.json so an open page can spot a newer one.
// Run locally with `node build.js`.
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
// Build tooling and repo docs, not part of the site.
const SKIP = new Set(['dist', 'node_modules', 'tools', 'build.js', 'package.json', 'package-lock.json', 'wrangler.jsonc', 'AGENTS.md', 'CLAUDE.md', 'README.md']);

const git = cmd => { try { return execSync('git ' + cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return ''; } };
const env = process.env;

// Cloudflare hands these over at build time; a local run asks git instead.
const sha = [env.WORKERS_CI_COMMIT_SHA, git('rev-parse HEAD')]
  .map(v => String(v || '').trim().toLowerCase()).find(v => /^[0-9a-f]{7,40}$/.test(v)) || '';   // first one that's a real hash
const message = git('log -1 --format=%B');
const subject = message.split('\n')[0];
// The PR a preview was built for, or on main the PR that was merged: "Merge pull request #7 from ..." or "Title (#7)".
const pr = (subject.match(/^Merge pull request #(\d+)/) || subject.match(/\(#(\d+)\)\s*$/) || [])[1] || '';

const BUILD = {
  sha: /^[0-9a-f]{7,40}$/.test(sha) ? sha : '',
  pr: /^\d+$/.test(pr) ? pr : '',
  // Workers Builds sets WORKERS_CI_BRANCH; main is production, anything else a preview.
  env: env.WORKERS_CI ? (env.WORKERS_CI_BRANCH === 'main' ? 'production' : 'preview') : '',
  at: new Date().toISOString(),
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const name of fs.readdirSync(ROOT)) {
  if (name.startsWith('.') || SKIP.has(name)) continue;
  fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
}

// sw.js: its cache is named for what's in the site, so installed copies drop the old one when anything changes. No hand bump.
const hash = crypto.createHash('sha1');
const walk = dir => fs.readdirSync(dir).sort().forEach(n => {
  const f = path.join(dir, n), rel = path.relative(OUT, f);
  if (fs.statSync(f).isDirectory()) walk(f); else if (rel !== 'sw.js') hash.update(rel + '\0').update(fs.readFileSync(f));
});
walk(OUT);
const sw = path.join(OUT, 'sw.js'), CACHE = /const CACHE = '[^'\n]*';/, cache = 'collies-' + hash.digest('hex').slice(0, 12);
const swSrc = fs.readFileSync(sw, 'utf8');
if (!CACHE.test(swSrc)) throw new Error("build.js: no `const CACHE = '...';` line in sw.js");
fs.writeFileSync(sw, swSrc.replace(CACHE, `const CACHE = '${cache}';`));
console.log('build.js: sw.js cache', cache);

const file = path.join(OUT, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const LINE = /const BUILD=\{[^}\n]*\};/;
if (!LINE.test(html)) {
  console.warn('build.js: no `const BUILD={...};` line in index.html, so the build is not stamped');
} else {
  fs.writeFileSync(file, html.replace(LINE, () => 'const BUILD=' + JSON.stringify(BUILD) + ';'));
  console.log('build.js: stamped', JSON.stringify(BUILD));
}
fs.writeFileSync(path.join(OUT, 'version.json'), JSON.stringify(BUILD));
