# Dogs

- **Roles** (`ROLES`, `T.roles`, `T.traits`): 📣 bark (reach, scare), 💥 bonk (punts,
  predator hits), ⤴ jump (height, air time), ⚡ speed, 💨 stamina, 🛡 grit (damage, heal, KO,
  mashing free), ✊ grip (hold cost, drag speed, flings, shakes). ★ 1…3 each, 14 in all; ★★ =
  as tuned. Header (all ★★, learns `learn`×), Huntaway, Heeler, Outrunner, Backer; `build` its weight
  (`boneMass`). P1 picks on the title (chips, ←/→ / A/D / D-pad, eaten before join), anyone in the
  barn's Dogs tab (R3); kept per slot in `DOGS.looks[slot].role` (old saves: `breed`); `T.roleDef` per slot (all
  Headers in `?sim`). Online: a guest's title pick goes to the host (`hi.ro`, `b`), and its barn's (`dl`), mid-journey too.
- **Training** (`T.train`, `G.train[slot|role]`, `trainRec`): doing it earns xp in that trait
  (barks that reach something, bonks that hit, jumps on the move `jumpGap` apart, m sprinted,
  stamina spent, hp lost, s holding); levels at `lv` (max 5), each × (1 + `per`); ⬆ over the dog
  (`trainFx`). One journey: `resetGame` clears it; swap role and back keeps it. Off in `?sim`
  (`T.train.on`). Guests get `d.role` + levels (`rol`, `netDogRole`).
- **Idle** (`T.idle`, `dogIdle`, `d.antic`/`d.anticT`, synced; drawn: `dogAntic`, `anticSpin`): no input `after` s, still, mouth free →
  `poop` (`spawnPoop` at `drop` s, back feet kick the grass from `kick`), `pee` (`PUDDLES`, drawing only), `chase` (its tail; dizzy),
  `sleep` (round once, then curled, mode `lie`; by day `nap` s, at night till woken). Odds `w.day` / `w.night` (night: mostly naps).
  Any input or knock: `anticEnd`. Poops are BONES (`b.poop`, `boneK`, `POOP_GEO`): grabbed, carried, thrown, SPLAT!, gone after `life` s,
  up to `max`, not saved, cleared on a new journey (`idleReset`); Hank moans on a pick, a throw, a hit (`poopSay`, `POOP_SAY`, what he sees). Off in `?sim`.
- **Muddy dogs** (MUDDY DOGS, `T.dirt`, `updateDirt`, `d.mud`/`d.wet` 0…1, synced): a bog cakes it (`mudK` × moving; lying: a
  wallow; in at speed, a pounce or a landing: SPLUT, + `splat`). Never wears off, nor wades off. A swim washes it (`swim`/s). A hop or
  jump over a pen's water trough (`waterTroughAt`): a jump always, a hop (pushing into it) only muddy, lands in it (`tubIn`, `d.tub`,
  `tubStep` from updateDog; `d.tubT` synced, < 0: empty): SPLOOSH, `cost` water slopped out, sheep drinking there scatter, the water
  mucky (`W.muck`, drawing only) a few h; a sit, scrubbed clean, out (`out` s early: stick / jump) on the pen side or the stick's. An
  empty one: CLONK, dazed, still muddy. Out of the water: a shake (`shakeDue`, `dirtFx('shake')`) leaves `shake`× wet. A sheep in
  muddy jaws gets muddy (`s.mud`). Hank says so once. Drawn (`syncDirt`): the coat (fur shader), the plunge, scrub, shake (twist,
  spray, fluff), wallow, clods, drips, pawprints (`PAWS`), flies. `dirtFx` relayed online. Test: `mud-test.mjs`.
- **Dog health** (`d.hp`, `T.dogHp`): heals after a few s unhurt (faster lying
  down); at 0 knocked out (`d.ko`) till Hank brings it round (RESCUE), never dies. Cougar close (`maulR`, or bumped
  while dragging) leaps on the dog: a swipe/bite every `maul.every` s up to
  `maul.max`; mash pounce to throw it off, or a partner pounces it. Coyotes nip
  (`T.nip`) when bold, screening or striking.
- **Grab: hold RB** (or Ⓧ; E / , / ✊, `inp.grab`; RB leaves the thumb free): held, it bites what comes in reach and keeps hold; let go: dropped
  (running: a fling). Lost while held (slip, buck, knocked): no bite again till it's let go (`d.grabLock`). Ⓑ or a
  right-stick swing (`inp.shake`: out from rest or across, counted in `padPoll` like presses, `T.shake`; not a station) with
  something in its mouth: a shake (`shakeHold`, `T.shakeCd`), in a tug of war a heave (`tugTap`); a held gate: Ⓑ lets go,
  pounces. A coyote: each shake dazes it longer once let go (`c.shook` → `c.dazeT`, `coyoteDazed`: it sways, seeing stars,
  then runs); `toss` shakes: shaken loose. Sprint is RT / L3. Bots: `grab: true` is held, `shake: true` a swing.
- **Bones** (`BONES`, `T.bone`): permanent (not reset; saved in `localStorage['collies.bones.v1']`, host only, `T.bone.save`
  off in `?sim`; up to `max`). Bitten like anything (`boneGrip`, `holdKind 'bone'`, free to carry), crosswise in the jaws;
  let go, it's tossed (`boneLetGo`: the run × `mul` + `add`, `up`); knocked about, just dropped. Flies, tumbles, bounces,
  slides (`boneStep`, sub-stepped), bounces off rock and fences. Hits (`boneHits`) by real physics: J = (1+e)·vn / (1/m_bone
  + 1/m), Δv = J/m (`boneMass`: × size³ for sheep, × build for dogs), the bone gets J back. `boneHit`: dog knocked, sheep
  pushed or (light) bowled, ram provoked, coyote scared, cougar spooked / drops its catch, Hank staggers. Never its own
  thrower at first; a pounce kicks a lying one; caught in the air. Online: `NET_TYPES.bone` (made and killed on guests).
- **Punts by weight** (`punt`, `puntK`, `T.punt`): speed × bonk trait × the dog's momentum shared (`boneMass`): a ewe ~20 m, a ram
  less, a lamb or a dog more (`kMin`…`kMax`). Brambles: a low pop (`rescueUp`).
- **Dog punts.** A pounce into another dog launches it like a sheep (`puntDog`,
  `T.punt`); not one under a cougar (that pounce frees it).
- **Dogs fly as sheep do.** `launchDog(d, vx, vz, vy, kind, by)`: same kinds, spin (`airSpin`),
  bounces (`airBounce`), hits (`airHits`: caroms, bowls, knocks), landing (`T.landKeep`), pose (`dogPose`).
- **Grab a dog** (`grabKinds.dog`, `grabbableDog`, `d.heldBy`): by the scruff, like a sheep; it drops what
  it had (a rope too: a tug lost). Its holder carries it (`updateHeldDog`, after it moves); let go moving: flung (`'fling'`). Held:
  barks work, its stick tugs the holder, mash pounce to wriggle free (`heldDogInput`, `T.dogHeld`).
- **Jump** (Ⓨ / Space / [ / ⤴, `startJump`, `T.jump`): a hop on the spot (`d.hopT`, `hopH`); sprinting, a long vault.
  Mid-air: rams, pouncing dogs, flying sheep and cougar leaps miss. Clears fences, not the trough one. Lie is LT.
