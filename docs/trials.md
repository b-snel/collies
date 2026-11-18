# The trials (issue #180)

- **The ring** (`TRIAL`, `T.trial`, TRIALS; on: off in `?sim`): a show ring at Sweetgrass Meadow, east of the trail before the camp. Where:
  the clearest spot near `at` (`TF`: its middle, `hl` × `hw` half; load-time maths only). Field coords: u up the screen, v across (`fp`,
  `fu`, `fv`); `TL` has where everything is. Made the first time a dog comes within `buildR` (`trialBuild`: lazily, ?sim's dice never see it):
  white hurdles all round (`TRIAL.ring` in `staticFences`, stamped for nav), bunting, the judge's table and the cup, the scoreboard, a mat a
  event below the ring, the rivals and their dogs, the champion, the host's llama, the rival shearer, the trial rope (`R.trial`, in `ROPES`).
  Anything in it when it goes up is put out (`trialEvict`). Ducks, llamas, the vagabond keep off it (`trialClear`).
- **An event**: a dog on its mat barks (`trialPress`, before the bark in `updateDog`), by day (`from`…`to`, by night: 🌙 and when it opens), none on. Its things
  out (`trialProps`: each event's group and fences), the dogs to the start and Hank to his post (`trialPlaceDogs`; not mid-rescue, on a rope,
  swimming, at a fleece), a count (`count` s), then `TRIAL_STEP[id]`.
  While one's on the clock runs × `clock` (`stepClock`). Over: every phase done, its `time` out, or the dogs gone (`trialEnd`): its score
  (the phases' points less `fault` a fault, 0…100), xp in its trait × score/100 (again, no better: × `againXp`), the card.
- **Again**: any event, as often as you like: `TRIAL.res` keeps your best (`TRIAL.last.best`: a new one). The shearing race again: the count,
  no wool (`ev.wool`).
- **Faults** (`trialHerdFault`, from HERD): a grip, a bonk (a pounce) on the host's animals, a duck put up. Not a grip in the shearing race.
- **The host's animals** (HERD, `e.trial`): calmer sheep than the flock (`T.herd.sheep`: only the trials'); they shy off the ring's hurdles
  (`trialShy`, `shy`: no jam in a corner), slide along a hurdle they're pushed square into (`herdMove`), feel Hank only close by. A pen being
  worked (`TRIAL.pull`, `trialPull`) draws the calm ones in front of its mouth in, more as more are in (`pull`); one beside or behind it: round
  its front corner first. In a pen `settle` s: penned (`trialPenStep`).
- **The events** (`TRIAL_PH`: each phase's icon, points):
  - 🐑 **Course**: 5 of the host's sheep (HERD, `grp.trial`), one with a ribbon. Outrun (a dog behind them, not within `tight`), lift, fetch
    (through the fetch gate: `gateCross`, a miss −; straight, together, calm), drive (D1, D2, the shedding ring), shed (the ribbon one `gap`
    apart, `hold` s), pen (all settled in: `trialPenStep`; Hank shuts the gate on its rope: `gateK`, the leaf; he stands off its mouth's corner).
    Gate panels ≤ 2.4 m, D2 clear of the fetch gate (no pocket between them).
  - 🐕 **Brace**: `n` (8); fetched, then half in each pen (`trialBraceN`, `trialHalf`). A pen with its half in: shut (`trialShut`: a red hurdle
    across its mouth, a fence; one more in its mouth with them: back out). Both full, or all in: over.
  - 🦆 **Ducks**: 5 (HERD); G1, G2, the duck house; quick: points. Past a gate just wide: nothing for it, on; across its line further off
    than `far` m: no matter. Through G2 with G1 to do, or one into the house: the gates skipped score nothing.
  - 🦙 **Llama lead**: the host's llama on the trial rope (`R.llama`, led as a broken one is); the poles in and out (left of the first);
    one brushed (it or a dog): down; a sprinting dog: it balks. Under `par` s: points.
  - ⤴ **Agility**: hurdles (a fence: the dog hops it; on the ground: the bar down), tunnel (in one end, out the other), see-saw (on it in its
    near half, along to its far end's last `saw.end` m; `saw.w` either side of its middle line; its plank tips with the dog on it:
    `trialSawStep`, `trialY` in `groundY` via `TRIAL_Y`), weave poles, the table (up on it or its ramp: `trialOnTable`, `trialY`; down
    `table.t` s: lie, or just stop: the runner lies down by itself, `trialDown` in `updateDog` / `netPredMove`; a ring over it fills: `ev.tab`),
    a hurdle, the finish. Any still to do counts: one done past the next, the ones skipped −`skip` each (never stuck behind one); one done
    wrong (a bar, the weave): −`fault`. Time points under `par`, × the share not skipped. A run each (the dog that barked first, then by slot:
    `ev.queue`, `trialAgilityRun`; the rest wait aside), `time` s each; the team's score is the runs' average (`trialAgilityTally`).
  - 🪢 **Tug of war**: the local champion (`TRIAL.champ`, a dog on a rope as Hank is: `R.champ`, `ropeNpc`, `hankTug` with `T.trial.tug`,
    `str` × (1 + `per` a dog more of ours), `champTugEnd`). Won: 100; lost: by how near.
  - 🦴 **Long throw**: the trial bone (`b.trial`: not kept), 3 throws from behind the line; let go over it: no throw. Where it first comes
    down; the best counts (`par` m: 100).
  - ✂ **Shearing race**: 10 woolly ones in the catch pen; carried (or walked) to Hank's board he shears each (`t` s, 🧶): one in a dog's mouth
    within `take` m he takes from it; one let go by him while he's busy waits its turn (`stay`). The rival shearer one every `rival` s. More
    than him: 100.
- **Rivals** (`TRIAL.rivals`, `trialRoll`): three, each a skill (± `spread`), their scores rolled from `TRIAL.seed` (a new journey: new). A
  player who runs them all well beats the best (`trial-sim.mjs`: the stick-only bots take 🥇).
- **Hank** (`trialHankGoal`, early in `hankGoal`): the handler's post (the pen's gate for the pen), his board, the line; between events, the dogs
  all there: by the judge (`trialHankIdle`, after his jobs). Steps over the ring's hurdles (`trialHankHop`).
- **The prizes** (`trialAwards`): all eight run, a dog by (not at dusk: the mats stay, the next day on). Totals, placings (a tie's yours).
  Later a better place (a best raised): what it adds (the ram once, the keg once, its wool; `TRIAL.place`: the best so far). 🥇 the champion ram
  (`trialChampRam`: `s.champ`, brave, big; joins the flock; his rosette drawn on `s.bodyM`; saved with the flock; the next dawn report:
  `trialNewcomers`; new blood: `kinFounder(s, 'trial')`, docs/kin.md) and the keg; 🥈 the keg and `wool[1]` 🧶; 🥉 `wool[2]`. An event won: a rosette for the dogs (`trialRosette`, once).
- **Co-op**: one team against the rivals: one score an event, one row on the board; any dog's bark on a mat starts it; every dog takes part
  (agility: a run each); anyone's fault is the team's; every dog there gets the xp; the prizes go to every dog (the ram to the one flock).
- **The keg** (DOG WARDROBE `keg`, a prize: never dug up; on every dog of ours, a friend's online too: `netFoundFor(p, id, wear)`): a dog wearing it (`d.keg`, `trialKeg`) is a little fire up the pass (`kegHeat` in
  `heatAt`): sheep, llamas, the dog itself; its bark (`trialKegNip`): cold −`nipK` for each within `nip` m, then `cd` s.
- **How it goes** (`TRIAL_HOW`: each event's goal, its phases' names; `trialTip`: what to do now, `{grab}` … → this screen's button:
  `trialKeys`, `trialKeyP`), for someone who's never seen a trial.
- **HUD** (`drawTrialOverlay`): over each mat its icon and your best (★, green: beats them all) or the score to beat (🥇), by night 🌙; a dog
  of this screen's on one: its card (`trialMatCard`: name, goal, its steps, to beat, yours, the button); the board (totals, medals once done);
  an event on: the count (`trialCount`: its card, the seconds big, GO!), the judge's card (icon, the clock, each phase's points, faults ✖, a
  phase done: +N flies up) under the clock, what to do now under it (pops when it changes), a ring and an arrow at the next thing (off
  screen: an arrow at the edge; `trialTarget`); after: the run's card (`trialRunCard`: score, place, new best, again); the prizes: the standings.
- **Juice**: the crowd (`TRIAL.crowd`, six folk along the sides; `TRIAL.cheer`) and the judge and the rivals clap a gate, cheer a phase, a
  run, the prizes (`Sound.crowd`); the last ten seconds tick.
- **Online**: `NET_TYPES.trial` (seed, scores, the event for the card and the tip (the table's `tab`), props, the gate, poles and bars down,
  the brace's shut pens, the last (a new best), the prizes),
  `NET_TYPES.tnpc` (the champion, the llama, the shearer), the host's animals are HERD's (`NET_TYPES.herd`); `trialFx` relayed. A guest builds
  the ring when its camera comes near.
- **Save** (`onSave('trial')`): the seed, the scores, done, placing. The ram is the flock's; the keg and rosettes the dogs' wardrobe.
- **Dev**: `7` to the trials (again: every event scored), the strip's 🏆; `devTrial`, `devTrialAll`. Test: `trial-test.mjs` (`again`, `tips`).
  `trial-sim.mjs`: every event played on the dog's controls only (agility twice: clean, and a player's: see-saw from its side, weave skipped,
  stopped on the table); scores, total, place; `--trace S`.
