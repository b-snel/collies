# AGENTS.md

Guidance for AI agents working in this repo.

## Demo slices: prototyping an idea from scratch

A **demo slice** is a clean-slate branch for trying one focused idea in
isolation, away from the main game. Nothing from `main` is carried over: the
idea is built from nothing, and later the branch serves as a reference
implementation when the feature is added to the main game.

`template/demo-slice` is the empty starting point. It has `main`'s files
deleted and holds only a template `AGENTS.md` (plus a `CLAUDE.md` that
imports it). Don't build on the template itself, and change it only when the
user asks to.

### Is this a demo slice?

Treat a branch as a demo slice if either is true:

- Its name starts with `demo-slice/` (`demo-slice/sheepdog-ai`), or contains
  `demo-slice` after another prefix (`claude/demo-slice-sheepdog-ai`).
- Its root `AGENTS.md` says it is a demo slice.

If you are on a demo slice, follow **Working in a demo slice** below and
ignore guidance that only applies to the main game.

### When the user asks for one

Phrases like "create a demo", "make a demo slice", "I want to try out an idea
from scratch" or "prototype X on its own" mean: start a new demo slice. The
user has said that asking for a demo is their request for a new demo-slice
branch.

1. **Branch off the template**, named `demo-slice/<short-idea>`:

   ```bash
   git fetch origin template/demo-slice
   git checkout -b demo-slice/<short-idea> origin/template/demo-slice
   ```

   If your environment only lets you push to a branch it assigned you, point
   that branch at the template instead
   (`git checkout -B <assigned-branch> origin/template/demo-slice`), follow
   the rest of these steps, and tell the user. The branch's `AGENTS.md` still
   marks it as a demo slice.

2. **Fill in `AGENTS.md`**: name the idea in the title and "The idea", and
   delete the "This is the template" note.

3. **Commit and push**, for example `Start demo slice: <idea>`. Then build the
   idea.

If `template/demo-slice` is missing, tell the user. To rebuild it, branch from
`main`, run `git rm -r -q .` without reading anything first, and add back an
`AGENTS.md` (in the shape of the one an existing demo slice has) and a
`CLAUDE.md` containing the single line `@AGENTS.md`.

### Working in a demo slice

- **Build from scratch.** Do not read, copy or restore code from `main` or
  other branches unless the user asks for it.
- **Stay focused** on the one idea. Placeholder art, rough UI and hard-coded
  values are fine. Skip anything the idea doesn't need.
- **Keep it easy to run.** Use a plain static page with `index.html` at the
  root and no build step, like the main game, unless the idea needs more. Put
  run instructions in the branch's `AGENTS.md`.
- **Keep "Notes for porting" current** in the branch's `AGENTS.md`. Record
  what worked, what didn't, key decisions and constants, and what the main
  game will need to change to take the feature.
- **Never merge a demo slice (or the template) into `main`**, and never open
  a PR from one into `main`. Its history deletes the whole game. Features get
  ported by hand.

### Porting a demo slice into the main game

When the user asks to add an idea from a demo slice to the game:

1. Work on a normal branch from `main`, not on the demo slice.
2. Read the demo without checking it out over your work:

   ```bash
   git fetch origin demo-slice/<idea>
   git ls-tree -r --name-only origin/demo-slice/<idea>
   git show origin/demo-slice/<idea>:<path>
   ```

   Start with its `AGENTS.md`, especially "Notes for porting".
3. Re-implement the behavior in the game's existing structure and
   conventions. Port the idea, not the files. Don't merge or cherry-pick
   demo-slice commits.
