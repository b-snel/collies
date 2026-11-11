// Headless test: `node tools/team-test.mjs [rules|coyote|pack|cougar|maul|falcon]`. TEAM BARK.
//   rules   together (within win, near) → a team bark; too late, too far, hoarse (cd) → none; after cd → again
//   coyote  a lone coyote wise to barks: a solo bark doesn't move it, a team bark sends it off (not bold); hint shown
//   pack    four dogs bark one after another: 2, 3, 4 → three team barks, the pack breaks
//   cougar  a cougar dragging a sheep: a solo bark does nothing, a team bark drops it (saved)
//   maul    a cougar on a dog: two partners bark together, it lets go
//   falcon  a falcon carrying a sheep out of solo bark reach: a team bark drops it
import { open } from './harness.mjs';
const only = process.argv[2];
const h = await open();
const run = scen => h.page.evaluate(async scen => {
  const { G, T, step, startGame, resetGame, joinPlayer, bark, spawnPack, living, COUGARS, cougarHunt, cougarGrab, startMaul, FALCON: F, falconCome, NESTS } = GAME;
  if (G.mode !== 'play') startGame({ kind: 'bot', index: 0 }); else resetGame();
  while (G.dogs.length < 4) joinPlayer({ kind: 'bot', index: G.dogs.length });
  for (const p of G.players) p.bot = {};
  for (const d of G.dogs) { d.barkAgo = d.teamAgo = 99; d.maul = null; d.mauled = false; d.ko = false; d.hp = 1; }   // rested, not hoarse from the last scenario
  const [A, B, C, D] = G.dogs, run = t => { for (let i = 0; i < Math.round(t / 0.025); i++) step(0.025); };
  const put = (d, x, z) => { d.x = x; d.z = z; d.vx = d.vz = 0; d.stunT = 0; };
  const spare = () => { put(C, A.x + 1.5, A.z + 1.5); put(D, B.x + 1.5, B.z + 1.5); };   // quiet dogs by the barkers (the co-op leash keeps everyone on one screen)
  const tb = () => G.teamBarks || 0;
  G.clock.hour = 21; G.clock.day = 2;
  const out = { scen };
  if (scen === 'rules') {
    G.clock.hour = 12; const x = A.x, z = A.z;
    const pair = (gap, apart) => { put(A, x, z); put(B, x + apart, z); spare(); const n0 = tb(); bark(A); run(gap); bark(B); return tb() - n0; };
    out.together = pair(0.1, 8); run(T.teamBark.cd + 0.2);
    out.late = pair(T.teamBark.win + 0.15, 8); run(T.teamBark.cd + 0.2);
    out.far = pair(0.1, T.teamBark.near + 6); run(T.teamBark.cd + 0.2);
    out.again = pair(0.1, 8); run(0.7);
    out.hoarse = pair(0.1, 8); run(T.teamBark.cd);
    out.rested = pair(0.1, 8);
    return out;
  }
  if (scen === 'coyote' || scen === 'pack') {
    const pk = spawnPack(scen === 'pack' ? 3 : 1, { howl: false }), cs = pk.members, hx = pk.homeX, hz = pk.homeZ;
    const place = () => cs.forEach((c, i) => { c.x = hx + i * 1.5; c.z = hz; c.vx = c.vz = 0; c.state = 'pack'; c.stateT = 0; c.gx = c.x; c.gz = c.z; c.spd = 0; });
    if (scen === 'coyote') {
      G.hints['team-bark'] = false;
      const c = cs[0]; place(); c.barks = 10; c.bold = true; c.wiseShown = false;
      put(A, hx + 6, hz); put(B, hx - 6, hz); spare(); bark(A);
      Object.assign(out, { soloState: c.state, soloBold: c.bold, hint: !!G.hints['team-bark'] });
      run(1); place(); put(A, hx + 6, hz); put(B, hx - 6, hz); spare();
      const n0 = tb(); bark(A); run(0.1); bark(B);
      Object.assign(out, { teams: tb() - n0, state: c.state, bold: c.bold });
      return out;
    }
    place(); const ds = [A, B, C, D];
    ds.forEach((d, i) => put(d, hx + Math.cos(i * Math.PI / 2) * 7, hz + Math.sin(i * Math.PI / 2) * 7));
    const n0 = tb(); for (const d of ds) { bark(d); step(0.025); step(0.025); step(0.025); step(0.025); }
    Object.assign(out, { teams: tb() - n0, phase: pk.phase, states: cs.map(c => c.state) });
    return out;
  }
  if (scen === 'cougar' || scen === 'maul') {
    const k = COUGARS[0], L = k.lair, ux = Math.sin(L.yaw), uz = Math.cos(L.yaw);
    living().forEach(s => { s.x = L.x + ux * 22 + (Math.random() - 0.5) * 6; s.z = L.z + uz * 22 + (Math.random() - 0.5) * 6; s.vx = s.vz = 0; s.pen = null; s.lamb = false; s.ram = false; });
    put(A, L.x + ux * 60, L.z + uz * 60); put(B, A.x + 3, A.z); spare();
    cougarHunt(k, 0); for (let i = 0; i < 400 && k.state !== 'stalk'; i++) step(0.025);
    out.stalk = k.state === 'stalk';
    const s = living().find(s => !s.ram);
    const near = (d, r, a) => put(d, k.x + Math.cos(a) * r, k.z + Math.sin(a) * r);
    if (scen === 'cougar') {
      k.x = s.x + 1; k.z = s.z; cougarGrab(k, s); run(0.2);   // out by the flock: a way to drag it
      const saved0 = G.stats.saved;
      near(A, 10, 0); near(B, 10, Math.PI); spare(); bark(A);
      out.solo = k.state; run(1);
      near(A, 10, 0); near(B, 10, Math.PI); spare(); bark(A); run(0.1); bark(B);
      Object.assign(out, { state: k.state, held: !!s.grabbed, saved: G.stats.saved - saved0 });
      return out;
    }
    put(D, k.x + 1.5, k.z); startMaul(k, D);
    near(B, 9, 2); near(C, 9, 4); put(A, B.x + 1.5, B.z); bark(B);
    out.solo = k.state; run(1);
    near(B, 9, 2); near(C, 9, 4); put(A, B.x + 1.5, B.z); bark(B); run(0.1); bark(C);
    Object.assign(out, { state: k.state, freed: !D.maul });
    return out;
  }
  if (scen === 'falcon') {
    G.clock.hour = 12;
    const N = NESTS[1], live = living(); live.forEach(s => { s.x = N.x + 30 + (Math.random() - 0.5) * 10; s.z = N.z + (Math.random() - 0.5) * 10; s.vx = s.vz = 0; s.pen = null; });
    put(A, N.x + 90, N.z); put(B, N.x + 95, N.z); spare();
    const s = live.find(s => !s.ram); falconCome(s);
    for (let i = 0; i < 2400 && !(F.state === 'carry' && F.t > 1); i++) step(0.025);
    out.carry = F.state === 'carry' && F.prey === s;
    const r = 17; put(A, F.x + r, F.z); put(B, F.x + 15, F.z + 8); spare(); bark(A); out.solo = F.state === 'carry' && F.prey === s; run(0.6);
    put(A, F.x + r, F.z); put(B, F.x + 15, F.z + 8); spare(); bark(A); run(0.05); put(B, F.x + 15, F.z + 8); bark(B);
    Object.assign(out, { dk: [A, B].map(d => +Math.hypot(d.x - F.x, d.z - F.z).toFixed(1)), dropped: F.prey !== s, held: s.grabbed === F });
    return out;
  }
}, scen);
const scens = only ? [only] : ['rules', 'coyote', 'pack', 'cougar', 'maul', 'falcon'];
let fail = 0;
for (const sc of scens) {
  const r = await run(sc);
  let ok = true;
  if (sc === 'rules') ok = r.together === 1 && r.late === 0 && r.far === 0 && r.again === 1 && r.hoarse === 0 && r.rested === 1;
  if (sc === 'coyote') ok = r.soloBold && !['flee', 'leave'].includes(r.soloState) && r.hint && r.teams === 1 && ['flee', 'leave'].includes(r.state) && !r.bold;
  if (sc === 'pack') ok = r.teams === 3 && r.phase === 'retreat' && r.states.every(s => s === 'leave');
  if (sc === 'cougar') ok = r.stalk && r.solo === 'drag' && r.state !== 'drag' && !r.held && r.saved === 1;
  if (sc === 'maul') ok = r.stalk && r.solo === 'maul' && r.state !== 'maul' && r.freed;
  if (sc === 'falcon') ok = r.carry && r.solo && r.dropped && !r.held;
  if (!ok) fail++;
  console.log(ok ? 'ok  ' : 'FAIL', JSON.stringify(r));
}
console.log(fail ? `${fail} failed` : 'all ok', h.errors.slice(0, 5));
await h.close();
process.exit(fail ? 1 : 0);
