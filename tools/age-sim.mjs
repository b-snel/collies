// Headless ageing test: `node tools/age-sim.mjs`.
// The first flock's ages; how sheep look with age (fleece, face, size, the barn's words, running speed); then a
// lifetime of dawns (GAME.lambsAtDawn, well fed, no coyotes): nobody dies of old age before T.lifeDays[0], everyone
// has by T.lifeDays[1], each at the age it drew; and ages survive the saved flock.
import { open } from './harness.mjs';
const h = await open({ query: '?sim&debug' });
const r = await h.page.evaluate(() => {
  const { G, T, oldK, ageGrow, ageWord, sheepWoolColor, sheepHeadColor, makeSheep } = GAME;
  if (!G.players.length) GAME.startGame({ kind: 'bot', index: 0 });
  GAME.resetGame(); for (const c of G.coyotes) c.gone = true;
  const out = {};
  const adults = G.sheep.filter(s => !s.lamb);
  out.startAges = adults.map(s => s.age).sort((a, b) => a - b).join(',');
  out.startLives = `${Math.min(...adults.map(s => s.life))}-${Math.max(...adults.map(s => s.life))}`;
  out.startOld = adults.filter(s => oldK(s) > 0).length;
  // looks: the same ewe (and a black one) through her life
  const col = () => ({ r: 0, g: 0, b: 0, set() { return this; }, setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; }, multiplyScalar(k) { this.r *= k; this.g *= k; this.b *= k; return this; }, lerp(o, k) { this.r += (o.r - this.r) * k; this.g += (o.g - this.g) * k; this.b += (o.b - this.b) * k; return this; } });
  const w = makeSheep(0, 0, { age: 10, black: false }), b = makeSheep(0, 0, { age: 10, black: true }); w.life = b.life = 50; w.hunger = b.hunger = 0.2;
  const at = (s, a, f) => { s.age = a; return +f(s, col()).r.toFixed(2); };
  out.look = [10, 32, 41, 49].map(a => `day ${a}: white fleece ${at(w, a, sheepWoolColor)} face ${at(w, a, sheepHeadColor)} | black fleece ${at(b, a, sheepWoolColor)} face ${at(b, a, sheepHeadColor)} | oldK ${oldK(w).toFixed(2)} size ${ageGrow(w).toFixed(2)} "${ageWord(w)}"`);
  out.yearling = [2, 4, 6, 8].map(a => { w.age = a; return `${a}:${ageGrow(w).toFixed(2)} ${ageWord(w)}`; }).join(' · ');
  // a lifetime of dawns
  const lives = new Map(G.sheep.filter(s => !s.lamb).map(s => [s.name, s.life])), deaths = [];
  const n0 = G.sheep.length;
  for (let day = 1; day <= T.lifeDays[1] + 3; day++) {
    G.clock.day = day;
    const ages = new Map(G.sheep.map(s => [s.name, s.age + 1]));
    const lost0 = G.lost.length;
    for (const s of G.sheep) { s.hunger = 0.1; s.bred = false; }
    GAME.lambsAtDawn();
    G.sheep = G.sheep.filter(s => !s.dead);
    for (const m of G.lost.slice(lost0)) deaths.push({ name: m.name, why: m.why, day, age: ages.get(m.name), life: lives.get(m.name) });
  }
  const old = deaths.filter(d => d.why === 'old');
  out.flock = n0; out.diedOfOldAge = old.length; out.otherDeaths = deaths.length - old.length; out.stillAlive = G.sheep.length;
  out.ageAtDeath = old.length ? `${Math.min(...old.map(d => d.age))}-${Math.max(...old.map(d => d.age))}` : '-';
  out.diedAtTheirAge = old.filter(d => d.life === undefined || d.age === d.life).length + '/' + old.length;
  out.tooYoung = old.filter(d => d.age < T.lifeDays[0]).length;
  out.stats = G.stats;
  // the saved flock keeps ages
  GAME.resetGame();
  const s0 = G.sheep.find(s => !s.lamb); s0.age = 40; s0.life = 55; GAME.saveFlock(); const name = s0.name;
  GAME.resetGame(); const back = G.sheep.find(s => s.name === name);
  out.savedAge = back ? `${back.age}/${back.life}` : 'missing';
  GAME.freshFlock();
  return out;
});
console.log(JSON.stringify(r, null, 1));
if (h.errors.length) console.log('PAGE ERRORS', h.errors.slice(0, 3));
await h.close();
