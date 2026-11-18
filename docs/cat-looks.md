# Cat looks

CAT LOOKS (`index.html`, before GAME STATE): every cat and mouse drawn. Reads `CATS`, `MICE`, `MOUSE_HOLES` (MICE & CATS keeps them; a guest
gets them by NET); draws, never steps. Ease and animate locally (blinks, breathing, the gait's phase from `spd`): every screen the same way.

- **Drawing** (`syncCats`, onSync 35; `syncMice`, onSync 36): a cat's model is made the first time it's in view (`catModel`, in `CATM`, on its
  own dice: `ownDice`), hidden out of view or at sea unless ours, dropped once `c.gone` or out of `CATS` (`catDrop`); a new breed or coat: a new
  model. Nothing's made at load; no `Math.random`.
- **Breeds** (`CAT_BREEDS`, `CAT_BREED_IDS`, `CAT_COATS`; looks only): one chibi cat bent by numbers (`leg hl body head eye eyeY eyeGap slant
  mz noseY padY padK mouthY ear earR earX tail fur cheek ruff tufts britches toes`, `catDims`; a coat can bend them: `C.build`): moggy (brown tabby, orange tabby (Linus, a real cat: slim, sage eyes, a ringed tail carried up), black, tuxedo, calico, grey), ragdoll (seal / blue
  point, bicolour: long hair, a bib, blue eyes), Maine Coon (brown / red tabby, silver, black smoke: big, lynx tufts, a bib, a brush), Persian
  (white, cream, chinchilla: flat face, small ears), British Shorthair (blue-grey, lilac: round, plush, copper eyes), Siamese (seal / blue
  point: slim, big ears, a wedge), Bengal (golden rosettes, snow), Norwegian Forest Cat (one coat, a real cat's (Gandy): a broad round face, blue-grey and white, a big
  white bib, a narrow blaze into a white muzzle, white mittens, one higher, pale gold-green eyes; big, longer hind legs (the rump higher),
  wide-set ears with a hint of lynx tip, britches, toe tufts, a plume as long as it: the fluffiest). Size: `catSize(c)` = `CAT_K` × breed `k`
  × `c.scale` (a moggy ~0.43 m at the shoulder); kittens (`catKitten`: from `scale`) a bigger head, stubby legs, a short tail, longer fur.
- **Coats** (`catPaint`, `catTailCol`; `CQ`, `catMerge`: vertex colours and `aPat`, how much pattern, which way): base, belly, muzzle,
  white (tuxedo, calico, bicolour; bib: a narrow blaze, a white muzzle (`CAT_SNOW_FACE`), a narrow bib down the chest framed in grey
  (`bib`: its cloud's width, rows), the belly behind, mittens (`mitt`: a front leg each), the inner front legs, a flank sheen `sh`; `nk`,
  `mouth`: a smaller nose, a thin dark-grey mouth), colourpoints (face
  mask, ears, legs, tail). Stripes (mackerel, a line down the spine; on the head an M and lines over the crown, lines back across the cheeks), tail rings (`rings`, `ring`), rosettes, calico patches: drawn crisp (`CAT_PAT_GLSL`;
  `catMat`, one program `'catCoat'`, a material a coat).
- **Long hair** (`B.fur`: how fluffy; ragdoll, Maine, Persian, Norwegian): solid fluff, cel-shaded and outlined like the rest, no strands.
  Soft tufts (`catTuft`: a rounded lock narrowing to a gentle point, its tip a touch lighter) merged into the parts: a scalloped fringe down
  the belly, a tufty rump, britches down the back of the thighs, toe tufts, ear furnishings; cheek ruffs (`cheek`) widening the face; a bib
  (`bib`): a white cloud of round lobes layered down the chest, hung from under the chin (it swings with the gait and a breeze; a kitten's
  bigger: puffballs). Tufty parts' outlines pushed back from the eye (`catInk`): no line between tufts, the silhouette scalloped. The plume:
  the tail's tube in soft lobes, its section scalloped. White fur `CAT_SNOW` (over-bright, a touch blue: white in the warm sun, cream in shadow).
- **The model**: two body halves on a spine (they arch, curl, wiggle apart), a big round head (cheeks, whisker pads, a pink nose, a "w"),
  eyes (`MAT.basic`: they shine) set flush in a flatter face (`face`, no outline), level (almond breeds' outer corners a touch up: `slant`),
  an eye's width apart, facing forward: a thin even rim, iris, a big round pupil, two highlights (up-left, low-right); blink, squint, shut. Ears one soft shape each (`catEarGeo`: a
  rounded apex, `earR`; pink inside), lynx tips a wisp of the ear's own colour, furnishings inside (`earSoft`: no outline); they swivel, flatten, flick,
  whiskers, a mouth that opens (tongue, fangs), four legs, and a tail re-bent every frame (`catTailSet`: a tube along a curve; lift, bend,
  side, hook, sway, bottle-brush puff; its outline the same geometry). Ours (`c.owned`): a collar and a bell (`catCollar`, made the first
  time; the bell swings). The barn's turntable: `catModelIn(par, c)` (then `catSync(c, M, dt)` poses it).
- **Poses** (`catPose`; `CAT_Q`): a target for every state (`sit loaf sleep groom stretch walk trot run flee stalk freeze wiggle pounce pin play
  bite eat drink hiss swipe rub meow climb perch held taken`, and `c.dead`), angles absolute (level / straight down); the drawn pose crossfades
  into it (`CAT_BLEND`). Walks: a lateral sequence; fast: a gallop, the spine flexing. `crouch`, `tail` (up: a hooked tip), `puff`, `look`,
  `lookUp` eased in. Held / taken (`heldBy` / `grabbed`, whatever the state; dead: limp): hanging from its scruff, which is at `x, z`,
  `catScruffH(c)` above `y` (so `y` = a jaw's height − that), limp / kicking; `heldBy.cw` swings it. Shut eyes: lids ("‿ ‿").
  A cat with its mouse in its mouth: mouth open, the mouse drawn there (`catMouth`).
- **Mice** (`mouseInst`, instanced, first use): body, head (big round pink ears, bead eyes, pink nose), tail, four feet; coats brown, grey,
  sandy (`MOUSE_COATS`, `m.coat`). Run / walk (scurrying), sit (up on its haunches, nose twitching), nibble, groom, caught (wriggling),
  air (tumbling), dead (on its side); hide: not drawn. Held: at `x, y, z` (a cat's: its drawn mouth). `MOUSE_HOLES`: a dark hole, turned
  earth heaped behind it.
- **Icons**: 🐱 `cat`, 🐭 `mouse` (`ART`).
- **Contact sheets**: `node tools/cat-shots.mjs OUTDIR` (breeds × coats, walking, faces, heads (front, ¾, profile, a kitten), kittens, every
  pose, mice and a hole, game zoom; the Norwegian: posed, side on, at game zoom).
