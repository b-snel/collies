# Ropes

- **Ropes** (`ROPES`, `T.rope`, own rng): one coiled off the trail on each leg, none in Falcon Canyon. Bitten
  anywhere (`ropeGrip`, `d.ropeI`), dragged: Verlet nodes (`ropeSim`), links solved outward from the grips, a little
  stiff, sliding friction, dogs and sheep kick it. Carrying it costs no stamina. Ⓑ: a wave (`ropeShake`). A dog near
  one, mouth free: the grab key (RB ✊) over it (`drawRopeOverlay`, this screen's dogs).
  Drawn as a twisted tube through the nodes (`syncRopes`); online: `NET_TYPES.rope` (`pts`, `tug`).
- **Tug of war** (`R.tug`, `T.rope.tug`): a second dog bites it → `tugStart`. Knot (red rag) halfway between
  grips, on a white line; each side's line `win` m off. Grips can't stretch apart (`ropeHold`): the harder heave
  (`d.tugS`: planted + walking back + heaves, each a yank; × role grip) drags the other; it trains grip. Stamina drains (`grabKinds.tug`,
  `backDrain`, `tapCost`): out → SLIP!. Knot over a line, or a side lets go: `tugEnd` (losers yanked, OOF!).
  Up to 4 dogs: across the knot each side's heaves add up and it moves as one (`ropeHold`).
  - **Heaves** (`tugTap`): Ⓑ, a right-stick swing, or a flick of the stick back (row: `rowB`). Full only wound up
    (`gap` / `beat.T`, from `min`): mashing is weak and dear. **The beat** (`beat`, `U.t0`, `tugBeatOff`): the knot jumps every `T` s
    (`ropeFx('beat')`, `R.draw.beatAt`), the heave key over it; a heave within `win` of it: × `k`, × `yank`, cheap.
  - **Team heave** (`team`): same-side heaves on the beat within `win` s: TEAM HEAVE!, × `k` each.
  - **Dig in** (LT, `d.dugIn`, `dig`): crouched, can't walk or heave, stamina back; its side's an anchor (`ropeHold`): it gives
    only as far as the other side out-heaves `dig.s`. Walkers and mashers tire on it; heaves on the beat break it.
  - **Give slack** (`give`, `tugGiven`): a dog stepping in toward the knot (`d.giving`, under `t` s) as a foe heaves: the foe
    over-yanks, stumbles (`tugStumT`: × `k`, OOF!), wary `cd` s; the stepper's next heave counts on the beat (`feintT`).
- **Hank's tug** (`hankRope`, `hankTug`, `HANK.rope`, `T.rope.tug.hank`): a dog brings a rope within `r` of him, he's free
  (`hankRopeFree`: awake, no job, nothing prowling): he walks to the far end, takes it, tugs every dog on it; walks back,
  heaves on every `beats`th beat (step in just before it: he stumbles), tires after `tire` s. Lost: OOF, stumbles. Either way he lets go (`again` s). Online: `NET_TYPES.hank` `rope`/`ropeI`.
  The vagabond plays the same (`vagRope`, `T.vag.tug`; `e.npc`, `ropeNpc(R)`); never both on one rope.
- **A llama on it** (`R.llama`: LLAMAS): roped by a dog dragging it up to a wild one, a tug as Hank's (`T.llama.tug`); broken: led on it
  (`ropeHold`: it barely pulls back). No dog-on-dog tug, nor Hank or the vagabond, on a rope with a llama on it.
- **A wild ram on it** (`R.wild`: WILD RAMS, docs/kin.md): the same, round his horns (`wildNeck`, `T.wild.tug`, `wildTugEnd`).
- **The trial rope** (`R.trial`, TRIALS, docs/trials.md): the llama lead's (the host's llama on it: `R.llama`) and the tug of war's (the local
  champion on its far end: `R.champ`, a dog on a rope as Hank is, `T.trial.tug`). Hank and the vagabond keep off it during an event.
