# Cat looks

CAT LOOKS (`index.html`, before GAME STATE): every cat and mouse drawn. Reads `CATS`, `MICE`, `MOUSE_HOLES` (MICE & CATS keeps them; a guest
gets them by NET); draws, never steps. Ease and animate locally (blinks, breathing, the gait's phase from `spd`): every screen the same way.

- **Drawing** (`syncCats`, onSync 35; `syncMice`, onSync 36): a cat's model is made the first time it's in view (`catModel`, in `CATM`, on its
  own dice: `ownDice`), hidden out of view or at sea unless ours, dropped once `c.gone` or out of `CATS` (`catDrop`); a new breed or coat: a new
  model. Nothing's made at load; no `Math.random`.
- **Breeds** (`CAT_BREEDS`, `CAT_BREED_IDS`, `CAT_COATS`; looks only): one chibi cat bent by numbers (`leg body head eye ex mz ear tail fur
  cheek ruff tufts`, `catDims`): moggy (brown / orange tabby, black, tuxedo, calico, grey), ragdoll (seal / blue point, bicolour: long hair, ruff,
  blue eyes), Maine Coon (brown / red tabby, silver, black smoke: the biggest, lynx tufts, ruff, a huge brush), Persian (white, cream,
  chinchilla: flat face, small ears, fluffiest), British Shorthair (blue-grey, lilac: round, plush, copper eyes), Siamese (seal / blue point:
  slim, big ears, a wedge), Bengal (golden rosettes, snow). Size: `catSize(c)` = `CAT_K` × breed `k` × `c.scale` (a moggy ~0.43 m at the
  shoulder); kittens (`catKitten`: from `scale`) a bigger head, stubby legs, a short tail.
- **Coats** (`catPaint`, `catTailCol`; `CQ`, `catMerge`: vertex colours and `aPat`, how much pattern, which way): base, belly, muzzle,
  white (tuxedo, calico, bicolour), colourpoints (face mask, ears, legs, tail). Stripes (mackerel, a line down the spine, the brow), rosettes,
  calico patches: drawn crisp by `catMat` (one program, `'catCoat'`; a material a coat). Long hair: FUR shells on the body (`catFur`; roots
  barely darker).
- **The model**: two body halves on a spine (they arch, curl, wiggle apart), a big round head (cheeks, whisker pads, a pink nose, a "w"),
  big eyes (`MAT.basic`: they shine; a dark rim, iris, pupil, two highlights; blink, squint, shut), pink-lined ears (swivel, flatten, flick),
  whiskers, a mouth that opens (tongue, fangs), four legs, and a tail re-bent every frame (`catTailSet`: a tube along a curve; lift, bend,
  side, hook, sway, bottle-brush puff; its outline the same geometry). Ours (`c.owned`): a collar and a bell (`catCollar`, made the first
  time; the bell swings).
- **Poses** (`catPose`; `CAT_Q`): a target for every state (`sit loaf sleep groom stretch walk trot run flee stalk freeze wiggle pounce pin play
  bite eat drink hiss swipe rub meow climb perch held taken`, and `c.dead`), angles absolute (level / straight down); the drawn pose crossfades
  into it (`CAT_BLEND`). Walks: a lateral sequence; fast: a gallop, the spine flexing. `crouch`, `tail` (up: a hooked tip), `puff`, `look`,
  `lookUp` eased in. Held / taken: hanging from the scruff (a standing cat's scruff height above `y`; `heldBy.cw` swings it), limp / kicking.
  A cat with its mouse in its mouth: mouth open, the mouse drawn there (`catMouth`).
- **Mice** (`mouseInst`, instanced, first use): body, head (big round pink ears, bead eyes, pink nose), tail, four feet; coats brown, grey,
  sandy (`MOUSE_COATS`, `m.coat`). Run / walk (scurrying), sit (up on its haunches, nose twitching), nibble, groom, caught (wriggling),
  air (tumbling), dead (on its side); hide: not drawn. Held: at `x, y, z` (a cat's: its drawn mouth). `MOUSE_HOLES`: a dark hole, turned
  earth heaped behind it.
- **Icons**: 🐱 `cat`, 🐭 `mouse` (`ART`).
- **Contact sheets**: `node tools/cat-shots.mjs OUTDIR` (breeds × coats, walking, faces, kittens, every pose, mice and a hole, game zoom).
