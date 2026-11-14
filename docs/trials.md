# The trials (issue #180)

- **The ring** (`TRIAL`, `T.trial`, TRIALS; on: off in `?sim`): a show ring at Sweetgrass Meadow, east of the trail before the camp. Where:
  the clearest spot near `at` (`TF`: its middle, `hl` × `hw` half; load-time maths only). Field coords: u up the screen, v across (`fp`,
  `fu`, `fv`); `TL` has where everything is. Made the first time a dog comes within `buildR` (`trialBuild`: lazily, ?sim's dice never see it):
  white hurdles all round (`TRIAL.ring` in `staticFences`, stamped for nav), bunting, the judge's table and the cup, the scoreboard, a mat a
  event below the ring, the rivals and their dogs, the champion, the host's llama, the rival shearer, the trial rope (`R.trial`, in `ROPES`).
  Anything in it when it goes up is put out (`trialEvict`). Ducks, llamas, the vagabond keep off it (`trialClear`).
- **An event**: a dog on its mat barks (`trialPress`, before the bark in `updateDog`), by day (`from`…`to`), none on, not run yet. Its things
  out (`trialProps`: each event's group and fences), the dogs to the start (`trialPlaceDogs`), a count (`count` s), then `TRIAL_STEP[id]`.
  While one's on the clock runs × `clock` (`stepClock`). Over: every phase done, its `time` out, or the dogs gone (`trialEnd`): its score
  (the phases' points less `fault` a fault, 0…100) in `TRIAL.res`, xp in its trait × score/100, the card. Each once a journey.
- **Faults** (`trialHerdFault`, from HERD): a grip, a bonk (a pounce) on the host's animals, a duck put up. Not a grip in the shearing race.
- **The events** (`TRIAL_PH`: each phase's icon, points):
  - 🐑 **Course**: 5 of the host's sheep (HERD, `grp.trial`), one with a ribbon. Outrun (a dog behind them, not within `tight`), lift, fetch
    (through the fetch gate: `gateCross`, a miss −; straight, together, calm), drive (D1, D2, the shedding ring), shed (the ribbon one `gap`
    apart, `hold` s), pen (all settled in: `trialPenStep`; Hank shuts the gate on its rope: `gateK`, the leaf).
  - 🐕 **Brace**: 10; fetched, then five in each pen (`trialBraceN`).
  - 🦆 **Ducks**: 5 (HERD); G1, G2, the duck house; quick: points.
  - 🦙 **Llama lead**: the host's llama on the trial rope (`R.llama`, led as a broken one is); the poles in and out (left of the first);
    one brushed (it or a dog): down; a sprinting dog: it balks. Under `par` s: points.
  - ⤴ **Agility**: hurdles (a fence: the dog hops it; on the ground: the bar down), tunnel (in one end, out the other), see-saw (end to end;
    its plank tips with the dog on it: `trialSawStep`, `trialY` in `groundY` via `TRIAL_Y`), weave poles, the table (up on it: `trialY`,
    lie down `table.t` s), a hurdle, the finish. One skipped or wrong: a fault. Under `par`.
  - 🪢 **Tug of war**: the local champion (`TRIAL.champ`, a dog on a rope as Hank is: `R.champ`, `ropeNpc`, `hankTug` with `T.trial.tug`,
    `str` × (1 + `per` a dog more of ours), `champTugEnd`). Won: 100; lost: by how near.
  - 🦴 **Long throw**: the trial bone (`b.trial`: not kept), 3 throws from behind the line; let go over it: no throw. Where it first comes
    down; the best counts (`par` m: 100).
  - ✂ **Shearing race**: 10 woolly ones in the catch pen; carried (or walked) to Hank's board he shears each (`t` s, 🧶); the rival shearer
    one every `rival` s. More than him: 100.
- **Rivals** (`TRIAL.rivals`, `trialRoll`): three, each a skill (± `spread`), their scores rolled from `TRIAL.seed` (a new journey: new).
- **Hank** (`trialHankGoal`, early in `hankGoal`): the handler's post (the pen's gate for the pen), his board, the line; between events, the dogs
  all there: by the judge (`trialHankIdle`, after his jobs). Steps over the ring's hurdles (`trialHankHop`).
- **The prizes** (`trialAwards`): all eight run, or by `to` with some run and a dog by. Totals, placings (a tie's yours). 🥇 the champion ram
  (`trialChampRam`: `s.champ`, brave, big; joins the flock; his rosette drawn on `s.bodyM`; saved with the flock; the next dawn report:
  `trialNewcomers`) and the keg; 🥈 the keg and `wool[1]` 🧶; 🥉 `wool[2]`. An event won: a rosette for the dogs (`trialRosette`, once).
- **The keg** (DOG WARDROBE `keg`, a prize: never dug up): a dog wearing it (`d.keg`, `trialKeg`) is a little fire up the pass (`kegHeat` in
  `heatAt`): sheep, llamas, the dog itself; its bark (`trialKegNip`): cold −`nipK` for each within `nip` m, then `cd` s.
- **HUD** (`drawTrialOverlay`): over each mat its icon and your score (or the best rival's); the board (totals, medals once done); an event
  on: the judge's card (icon, the clock, each phase's points, faults ✖) under the clock, an arrow at the next thing; after: its score and
  place; the prizes: the standings.
- **Online**: `NET_TYPES.trial` (seed, scores, the event for the card, props, the gate, poles and bars down, the last, the prizes),
  `NET_TYPES.tnpc` (the champion, the llama, the shearer), the host's animals are HERD's (`NET_TYPES.herd`); `trialFx` relayed. A guest builds
  the ring when its camera comes near.
- **Save** (`onSave('trial')`): the seed, the scores, done, placing. The ram is the flock's; the keg and rosettes the dogs' wardrobe.
- **Dev**: `7` to the trials (again: every event scored), the strip's 🏆; `devTrial`, `devTrialAll`. Test: `trial-test.mjs`.
