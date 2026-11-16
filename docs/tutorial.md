# Tutorial (the practice)

- **A practice evening at Hank's corral, before day 1** (`G.tut` while it's on; `TUT`, `TUT_L`, TUTORIAL). `startGame` →
  `tutDue` → `tutStart` instead of the journey. Why: a journey throws 14 sheep, eight hints and nightfall at a new player in 3 minutes.
- **The sun waits**: `stepClock` stands still (`dtH` 0: no hunger, no nightfall, no events); each lesson sets its own hour
  (`L.hour`) behind a dip to black (`#tutFade`, `TUT_T`). No dens (`G.dens` empty: the only coyote is the lesson's), no hints
  (`hint` is quiet: the card says it), no journey save (`journeyCan`), no fast-forward (`G.ff`). Nothing dies (`tutSafe`: a dog's hp never
  under `TUT_T.hp`, a coyote drops its catch after `prey` s, the lesson's coyote never digs). The HUD: "Practice", no compass.
- **Lessons** (`TUT_L`: `name`, `hour`, `setup(U)`, `steps`, `learnt`, Hank's `line`, `calm`). Each starts with the whole flock calm, fed
  (`TUT_T.fed`: they keep to an open pen, a stray comes home) and penned, the gate latched (`tutHome`, `resetGate`), a dog that
  shut itself in put out by the gate. Places:
  `tutSpot(d, l)`, m out from the gate and to the side. Ewes: `tutPick`, the easiest to work first (not the bell ewe, not a
  lamb's mother, not skittish or stubborn, the bravest). Lesson 1's never panics (`calm`).
  1. **The stray** (13:30): one ewe out. Push the gate open; get behind her, walk her in; push it shut.
  2. **The bunch** (15:30): five out. Sprint over; lie down; creep; bring them home; shut.
  3. **Trouble** (17:48): a cast ewe. Pounce her over; grab her; carry or fling her home; shut.
  4. **Night** (21:00): one coyote prowling (`tutCoyote`: a pack of one, no den). Bark; then pounce.
- **A step** is done by doing it, never by a timer: `done(U, dt)` (`U.acc`: s of doing it). `text(U, cap, touch)`: its line, the
  player's own buttons (`TUT_CAPS`, `tutDev`). `at(U)`: what it's about; `drive(U)` / `spot(U)`: where to stand. Order's forgiving
  (the ewe walks in by herself: both steps done). `TUT_SHUT` ends a lesson: everyone in, the gate latched; sheep that got out: "🐑 n still out".
- **Phases** (`U.ph`): `in` (fading in, playable) → `play` → `won` (✔, Hank) → `out` (to black) → the next (`tutLesson`), or `tutEnd`.
- **Drawn**: the card `#tut` (where the hints go; pips a step; `tutCard`, only when it changes), a bobbing marker over each `at`
  (off screen: an arrow at the edge; behind the card: on its rim; `tutMark`, `TUT.rect`), a dashed ring where to stand (`tutRing`:
  the far side of the sheep from the gate; behind the open leaf).
- **Over or skipped** (`tutEnd`): `resetGame`, a new journey as ever; the same flock (`TUT.seed`: `spawnFlock` on the same dice);
  hints for what the passed lessons taught are marked seen (`learnt`; all four: `herd` too, then `travel`); `TUT_KEY` set.
  A journey that was saved is carried on with instead. `FLOCK.journeys`: the practice isn't one.
- **When**: by itself the first time on a device (no `collies.tut`, no saved journey, no flock that's been on one); never under
  `?sim`, `?debug`, `?sea`, `?go`, `?join`. The title's 🎓 (`#tTut`, T / Ⓨ; `tutWant`): on or off, any time. Skip: ⏩ on the card, the
  pause screen's button (Ⓨ there). Offline only: going online ends it (`updateTut`). Friends on the sofa join as ever.
- Test: `tools/tutorial-test.mjs` (a bot plays it through).
