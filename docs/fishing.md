# Fishing

- **The rod** (`ROD`, `T.fish`, FISHING; on: off in `?sim`): 🎣 from the vagabond (row 2, `T.vendor.rod`), one a journey (hidden once bought),
  at the buying dog's feet (`rodSell`). A thing in the jaws (`holdKind 'rod'`, `rodGrip`, `rodPick`, `rodLetGo`; `T.grabKinds.rod`: free):
  let go, it lies there (on the run: tossed; water or rock: back on the bank, `rodLie`). Left far behind (`left` m from the flock, nobody
  by, off screen): Hank brings it to camp (`rodFetch`: by the bowl, else the nearest camp pen's gate). At sea off the deck: stowed. ✊ 🎣 over
  it near a dog. With it in its jaws a dog stops at the water's edge (no swimming off with it).
- **Casting** (`rodPress`: Ⓑ, or a right-stick swing, with it in its jaws): by water (`fishWater`: a stream, the river, a lake, the sea's
  edge, Cold Harbour's bay; `castAim`: along its nose, a touch either side) Ⓑ 🎣 shows. Ⓑ winds up (`ph 'wind'`, `ROD.gauge` 0→1→0, a bar
  by the dog), Ⓑ again lets fly (`castGo`: `min`…`max` m past the tip, the water nearest that); left winding, it flies at `auto` s. Near
  the top (`sweet`): PERFECT, bites sooner (`perfect`). Away from water: 💧 ✖. Walked off past `line` m: the bobber's dragged after it
  (out of the water: reeled in, `fishIn`).
- **Bites** (`ph 'float'`, `fishFloat`): a fish comes after `wait` s ÷ `ecoD('fish')` (fished out: slower, at most `out`×); the camera frames the bobber too (`fishCam`); its kind by
  the water (`waters`, `fishPick`: trout, perch, catfish, salmon, mackerel, a rare golden one; `kinds`: kg, beat, strength, runs, leaps,
  wariness, colours). Its shadow noses up (`fst 'come'`), nibbles (`'nib'`: the bobber dips, a plip). Ⓑ then: spooked (`fishLost('spook')`,
  the next later). Ⓑ with none near: a twitch (one comes sooner). **The bite** (`ph 'bite'`): under it goes, ❗ Ⓑ, a rumble: Ⓑ within
  `win` × the kind's `wary` s: hooked (`fishHook`: hit-stop, HOOKED!); late: the bait's gone; none by `plunge` s: gone too.
- **The fight** (`ph 'fight'`, `fishFight`, `T.fish.fight`), a tug of war with the fish (ROPES' rules): struck, it bolts `start` m out.
  Its tail's beat (the kind's `T`; `fishFx('beat')`: the bobber jumps, `ROD.beatAt`), the heave key over it, red on the beat. A heave
  (`fishHeave`) on the beat (within `win`, `gap` since the last; × wind-up as the tug's) reels `reel` m in (÷ its size, × grip), tires it;
  off the beat a little; mashing barely, piling on tension. Stamina: `tap` a heave (× `off` off the beat), `grabKinds.rodFight` holding on
  (it stands to it). The tension (`ROD.ten`, a bar, the line whitens → reddens) eases toward its pull; it takes line as it swims.
  - **A run** (`runW` warned: the line whines; `run`: the reel screams): dig in (LT, `d.dugIn`, ⚓ chip): tension held, line out; else the
    tension climbs, a heave on it worse: SNAP.
  - **A leap** (`leapW`: bubbles; `leap`: out of the water): taut at its top (`taut`): it throws the hook. Step in toward it (stick toward,
    `give`): slack, kept (✔, tired, the next heave counts on the beat). ⤴ chip, an arrow from the dog to it.
  - **Team heave** (`fishHelp`, `help`): another dog within `r` m, mouth free: Ⓑ on the fish's beat heaves too (× `k`), TEAM HEAVE!; off
    it, nothing (no pounce). Its key over the fish.
  - Walking back reels slowly; stepping in when it's not leaping: slack (too long, `slackT` s: off). All the line out: SNAP.
  - In to `land` m (or the bank in the way): landed (`fishLand`): it flies onto the bank, flops, into the pack (`fishBag`: `d.fish`, up to
    `carry`; full: back in the water). 🐟 kg, confetti. Each kept: `ecoEat('dog', 'fish', leg)`, `G.stats.fish`. Hank on a big one, a golden one.
  - Let go, knocked, swimming: the fish is off (a landed one's kept).
- **The pack**: `d.fish` (synced, saved, reset in `resetForage`); a fish pokes out of a bag for each (`dogPackSync(…, fish)`, `dogPackFish`);
  🐟 pip by its name (`drawDogCarry`).
- **The bowl** (`BOWL`, SHARED HOOK; `bowlTake()`: a cat eats one): 🥣 from the vagabond (`T.vendor.bowl`), Hank sets it outside the 📍 pen
  past its latch post (`bowlSpot`: dry, open, clear of the gate's swing, the fire, the bucket, a fold; `bowlSet`). Of an evening (15:00–06:00)
  with most of the flock shut in another camp's pen, he takes it there, fish and all (`bowlStep`). A dog with fish walks up to it (`tipR`):
  in they go (`bowlTip`, up to `BOWL.cap`). Drawn with its fish in it; 🐟 ➜ 🥣 near it, an arrow at the edge while it's off screen;
  🥣 n/cap by it. MICE & CATS: strays come to it.
- **Online**: `NET_TYPES.rod` (tag `'2'`, the rod, its line, the fish, the bowl), dog `fish`; `fishFx` relayed (its sounds: `FSND`);
  guests draw. **Save**: `onSave('fish')` (the rod where it lay, the bowl's pen and fish, each dog's fish). **Dev**: 🎣 (`devFish`: a rod at
  its nose, a bowl, on a stream bank; `fishBank(x, z, open)`). Meshes made on first use (`fishMake`; `?sim` keeps its dice).
- **Test**: `tools/fish-test.mjs`.
