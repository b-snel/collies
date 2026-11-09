# AGENTS.md

Guidance for AI agents working in this repo.

## Demo slices: prototyping an idea from scratch

A **demo slice** is a clean-slate branch for trying one focused idea in
isolation, away from the main game. Everything from `main` is deleted, the idea
is built from nothing, and later the branch serves as a reference
implementation when the feature is added to the main game.

### Is this a demo slice?

Treat a branch as a demo slice if either is true:

- Its name starts with `demo-slice` (`demo-slice`, `demo-slice-sheepdog-ai`),
  or one of its `/`-separated parts does (`claude/demo-slice-sheepdog-ai`).
- Its root `AGENTS.md` says it is a demo slice.

If you are on a demo slice, follow **Working in a demo slice** below and
ignore guidance that only applies to the main game.

### When the user asks for one

Phrases like "create a demo", "make a demo slice", "I want to try out an idea
from scratch" or "prototype X on its own" mean: start a new demo slice. The
user has said that asking for a demo is their request for a new demo-slice
branch.

1. **Branch from the latest `main`**, named `demo-slice-<short-idea>`:

   ```bash
   git fetch origin main
   git checkout -b demo-slice-<short-idea> origin/main
   ```

   Use a hyphen, not a slash. A `demo-slice` branch already exists, so git
   cannot also create `demo-slice/<idea>`. If your environment only lets you
   push to a branch it assigned you, use that branch, follow the rest of these
   steps, and tell the user. The stub `AGENTS.md` still marks it as a demo
   slice.

2. **Delete everything, without reading it first.** The point is a clean slate
   that the main game's code does not shape:

   ```bash
   git rm -r -q .
   ```

3. **Add the stub `AGENTS.md`** (template below) at the root, with the idea
   filled in. Also add a `CLAUDE.md` containing the single line `@AGENTS.md`
   so Claude Code loads it.

4. **Commit and push**, for example `Start demo slice: <idea>`. Then build the
   idea.

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
- **Never merge a demo slice into `main`**, and never open a PR from one into
  `main`. Its history deletes the whole game. Features get ported by hand.

### Porting a demo slice into the main game

When the user asks to add an idea from a demo slice to the game:

1. Work on a normal branch from `main`, not on the demo slice.
2. Read the demo without checking it out over your work:

   ```bash
   git fetch origin <demo-branch>
   git ls-tree -r --name-only origin/<demo-branch>
   git show origin/<demo-branch>:<path>
   ```

   Start with its `AGENTS.md`, especially "Notes for porting".
3. Re-implement the behavior in the game's existing structure and
   conventions. Port the idea, not the files. Don't merge or cherry-pick
   demo-slice commits.

### Template: `AGENTS.md` for a new demo slice

```markdown
# Demo slice: <idea>

This branch is a **demo slice**: a clean-slate prototype for trying one
focused idea in isolation. Everything from `main` was deleted on purpose. See
`AGENTS.md` on `main` for the full workflow.

## Rules

- Build from scratch. Don't read, copy or restore code from `main` or other
  branches unless the user asks.
- Stay focused on the idea below. Placeholder art and rough UI are fine.
- Keep it easy to run, and say how below.
- Never merge this branch into `main` or open a PR into `main`: its history
  deletes the whole game. Features are ported to `main` by hand.
- Keep "Notes for porting" current as you go.

## The idea

<one or two sentences>

## How to run

<e.g. open index.html, or `python3 -m http.server` and visit localhost:8000>

## Notes for porting

<what worked, key decisions, gotchas, what the main game needs to change>
```
