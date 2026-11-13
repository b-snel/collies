# Dog looks

- **Dog pack** (DOG PACK, `dogPackBuild`, `dogPackSync`, drawing only): carrying greens or salt, a dog wears saddlebags in its collar's colour,
  fitted to its breed's hull (`packHull`, `packR`). Greens fill the pockets in turn (bags, then outer pockets), salt in the top pocket. Emptied: it pops off.
- **Wearables: every breed.** Anything a dog wears (hats, kit, the pack): check it on all breeds before it ships: a `role-test.mjs` check over
  every breed's coat lengths (`DOG_BREEDS.flatMap(dogForms)`; outside the body, off the ground, clear of head and legs) and a look at `node tools/dog-shots.mjs OUT.png` (`--pack`, `--tilt`).
- **Dog breeds** (`DOG_BREEDS`, `DOG_PATS`, `dogShape`, `buildDog`): looks only, nothing in the sim reads one. The herding
  dogs (Border Collie first; the default a rough black and white one), a Portuguese Water Dog, + the AKC's ten most popular. One collie bent by numbers (`leg len fat head muz mw sw sh`,
  `ear`, `tail` (`dogTailGeo`: a tapered tube per kind, `dogTube`; brush under a plume), `fur`, `pat`), clamped to `DOG_FIT`: feet on the ground, near the collie's size, mouth at `M.mouthZ` (carried
  things hang there). Coats per breed (`L.coat` = its base hex, one each; `fitCoat`). Coat lengths where the breed has them (`hairs`, `L.hair`,
  `dogForm(id, hair)`: its own numbers and shape; `fitHair`): Border Collie rough / smooth, Belgian Shepherd short / long / wire, Dachshund, Dutch,
  GSD, Huntaway, Icelandic, Pyrenean, Spanish Water Dog. Old saves' merged breeds: `BREED_WAS`. Hats and kit fitted per form (`dogGear(id, B)`:
  hat on the skull `hatY`, shades on its eyes, a flower behind its ear; collar kit in `M.neck`, scaled about the collar). Barn:
  ‹ › / L3; `L.breed`; Coat chips (`#barnHair`), Colour swatches in each coat's colours (`coatSwatches`); Ⓧ: the next colour, then length.
  Online: in the look (`look`; `hair` a pick like `coat`). Contact sheet: `node tools/dog-shots.mjs OUT.png` (`--breeds id:n:hair`, `--pack g,s`: the pack on).
- **Mouth loads swing** (CARRY SWING, `carrySwing`, `d.cw`, `T.carrySwing`, drawing only): anything in a
  dog's mouth (bucket, sheep, coyote, dog) hangs from its jaws on a pendulum: lags starts, stops, turns and hops,
  clonks off the chest (head jolts, tin tonk), kicks, sloshes. Cute and comical. New mouth load → turn it by `d.cw`.
- **Fur** (FUR, `T.fur`, `furMat`, `furCoat`, `furShellGeo`, `furInk`, drawing only): each coat part (body, head, legs, tail, ears, locks)
  streaked along the lie of its fur, with `n` shells over it in one mesh (`aFurK`: each vertex's shell, out along its normal and combed
  back), tufts cut by a noise, darker roots, light-catching tips; its outline out in the fur, ragged (`ink`, `rag`). Eyes, nose, collar:
  none. Coat length and tuft size per breed (`dogShape().furs`); short coats sleek (`'sleek'`: no shells, clean outline). Belly feathering (`dogFringe`): a thin sheet a flank, three pieces, tapering to pointed tufts (fur, not balls); it sways (`skirt`), no more. Two programs for all of it. Still slow at pixel ratio 1: shells off
  (`furLite`, `T.fur.auto`).
- **Hair** (HAIR, `T.hair`, `hairPiece`, `hairStep`, `M.hair`, drawing only): long hair, cords and floppy ears swing. Each piece a rod
  from its root stepped in world space (Verlet): lags its root, damped against it (`damp`) and the air (`air`), springs back to how it
  grows (`k` per kind), hangs by its weight as the dog tips (upside down: it falls), off the ground, out of the coat (`hull`), at most
  `max` from rest. Locks grouped by side and along the body; a cord's lower piece hangs off its upper. buildDog makes them; syncDog, the barn step them.
