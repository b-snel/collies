// Vercel's build step: copy the site into dist/ and stamp index.html with the commit it was built from,
// so the title screen and pause menu can say which build you're playing. Run locally with `node build.js`.
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
// Build tooling, not part of the site.
const SKIP = new Set(['dist', 'node_modules', 'build.js', 'package.json', 'package-lock.json', 'vercel.json', 'wrangler.jsonc']);

const git = cmd => { try { return execSync('git ' + cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return ''; } };
const env = process.env;

// Vercel hands these over at build time; a local run asks git instead.
const sha = (env.VERCEL_GIT_COMMIT_SHA || git('rev-parse HEAD')).toLowerCase();
const message = env.VERCEL_GIT_COMMIT_MESSAGE || git('log -1 --format=%B');
const subject = message.split('\n')[0];
// The PR a preview was built for, or on main the PR that was merged: "Merge pull request #7 from ..." or "Title (#7)".
const pr = env.VERCEL_GIT_PULL_REQUEST_ID || (subject.match(/^Merge pull request #(\d+)/) || subject.match(/\(#(\d+)\)\s*$/) || [])[1] || '';

const BUILD = {
  sha: /^[0-9a-f]{7,40}$/.test(sha) ? sha : '',
  pr: /^\d+$/.test(pr) ? pr : '',
  env: /^[a-z]+$/.test(env.VERCEL_ENV || '') ? env.VERCEL_ENV : '',
  at: new Date().toISOString(),
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const name of fs.readdirSync(ROOT)) {
  if (name.startsWith('.') || SKIP.has(name)) continue;
  fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
}

const file = path.join(OUT, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const LINE = /const BUILD=\{[^}\n]*\};/;
if (!LINE.test(html)) {
  console.warn('build.js: no `const BUILD={...};` line in index.html, so the build is not stamped');
} else {
  fs.writeFileSync(file, html.replace(LINE, () => 'const BUILD=' + JSON.stringify(BUILD) + ';'));
  console.log('build.js: stamped', JSON.stringify(BUILD));
}
