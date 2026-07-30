# Adar Warehouse — 3D Finder

Interactive 3D warehouse: search an item, category, or bin code — the camera
flies to the exact shelf, the bin glows amber, and a walk path lights up on the
floor from the entrance. Tap any bin to see what's in it. Works on a phone.

This lives here (the JKNO repo) so the work is in git and can't be stranded on
one machine. It is self-contained — nothing in the Next.js app imports it — and
is meant to eventually move into / merge with the standalone `adar-warehouse`
app (React Three Fiber, `C:\Users\katzj\adar-warehouse` on the home desktop).
This version is plain three.js, so the scene logic ports across directly.

## Open it

`dist/standalone.html` is a fully built copy — open it in any browser, no
server needed. Or the published artifact:
https://claude.ai/code/artifact/b382b791-e64d-4ef0-8ce9-f77dda1a8b15

## Layout (as confirmed)

Rectangle. Left to right: **R1** against the left wall (single face), aisle 1,
**R2** double-sided (faces R2a / R2b), aisle 2, **R3** double-sided (faces
R3a / R3b), aisle 3, **C** against the right wall (single face). Dock is
back-right, entrance front-right. 6 pickable faces, 3 aisles.

Bin codes are `FACE-BAY-LEVEL`, e.g. `R2b-04-2`. Bay 1 is at the entrance end
(you count bays as you walk in).

## Config — all in `src/app.js`, top of file

| Constant | Value | Status |
|---|---|---|
| `LEVELS` | 3 | confirmed |
| `BAYS` | 8 | **placeholder — count and change this one number** |
| `CATEGORIES` / `categoryOf()` | 6 demo zones | placeholder until real zones |
| `ITEMS` | 16 sample items | placeholder until live data (Supabase) |

## Build

```
npm install
npm run build
```

Produces `dist/artifact.html` (page content, bundle inlined — what gets
published as the claude.ai artifact) and `dist/standalone.html` (same thing as
a complete HTML document).

## Next steps

1. Real bay counts per face (can differ per face — make `BAYS` per-face then).
2. Real categories/zones and item list; wire `ITEMS` to Supabase so it's live.
3. Admin mode: place/move items from the app instead of editing code.
4. First-person walkthrough mode on top of orbit (user chose "both").
