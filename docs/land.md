# Off the trail

- **Dig spots** (own rng, synced): finds go on the dog, saved in
  `localStorage['collies.dogs.v1']`. Some junk is a bone (`T.dig.bone`, `digBone`): BONES.
- **Brambles** (`BRAMBLES`, `T.bramble`, own rng): patches off the trail. A
  sheep blundering in (more when running) is snagged (`s.snag`, `snagSheep`),
  stuck and bleating; a pounce pops it just clear of the bush (`punt` → `unsnag`, `T.punt.clear`), or a grab pulls it out.
  Calm sheep steer round. Off in `?sim` (`T.bramble.on`).
- **Bonk spots** (BONK SPOTS): a pounce is the fix. A rescue bonk (cast, bog,
  brambles) lands calm (`a.rescue`), no scatter.
  - **Cast** (`T.cast`): a sheep in full fleece now and then rolls onto its
    back by day (state `'cast'`, legs kicking, a "!" over it, off screen too).
    Only a pounce rights it (`castFlip`); left `die` h it dies (`'cast'`).
    Shearing stops it.
  - **Mud** (`MUDS`, `T.mud`): bogs in Sweetgrass Meadow. Sheep slow, may
    stick (`s.bog`, sinking), calm ones go round; a pounce pops it out over
    the nearest edge, muddy a while (`s.mud`). Dogs wade slow and come out caked (`d.mud`: docs/dogs.md, muddy dogs).
  - **Balker** (`T.balk`): of an evening (day 2 on) the bell ewe may plant
    herself in front of an open gate (`s.balk`, `p.balker`); pressure and
    grabs don't move her, the rest hang back. Bonked in: they follow
    (`p.leadT`).
  - **Apples** (`APPLE_TREES`, `APPLES`, `T.apple`): a pounce into the trunk
    (or a flying sheep) shakes some down; hungry sheep go for one before grass
    (state `'apple'`, `appleFor`), even tagging along with the flock (`T.apple.look`); a still dog only
    gets room. Grab one (`holdKind 'apple'`, `a.dog`): let go, dropped at the nose, running, lobbed
    (`moveApples`). Held out by a still dog (`appleHeldOut`, `T.apple.take`): a hungry sheep comes and
    takes it (`appleTaken`; that dog doesn't scare it: `appleFriend`). Penned: only ones in its pen. They grow back.
