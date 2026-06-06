# Play-round UX improvement plan

## Problem statement

The final "Now you play" section currently behaves like a real table: the player sees their own hand, while opponent hands are hidden and only discard rows/melds are visible. That realism makes the exercise hard for beginners because the important board state is split across four small rows and the next decision is not visually obvious.

A beginner-focused play mode should prioritize legibility over strict table realism. The player needs to answer four questions at a glance:

1. Whose turn is it?
2. What tile was just discarded or drawn?
3. Which tiles are visible on the board?
4. What can I do next, and why?

## Current implementation anchors

- `PlaySection` owns the last-section shell and explanatory copy, then leaves the dynamic board to `#play-table`, `#play-action`, and `#play-status`.
- `GameTable` provides the `.mj-play-table` container used by the legacy runtime.
- `PlayerSeat` already has the raw UI pieces needed for visible board state: visible/disguised hands, melds, discard rivers, active-seat state, winner state, and actionable player tiles.
- `src/app.js` still owns the play runtime renderer and state transitions, so the first UX iteration should be mostly presentational and should not rewrite game logic.

## Proposed board layout

### 1. Add a central table surface

Create a beginner-readable center panel inside `.mj-play-table`:

- **Latest tile lane**: a large card showing "Just discarded", "You drew", or "Claim opportunity" with the latest tile at `lg` size.
- **Visible board tiles**: a merged, face-up view of all public tiles:
  - every discard, grouped by seat;
  - every exposed meld;
  - flowers/animals revealed beside each seat if ruleset supports them.
- **Turn marker**: a compact compass showing East/South/West/North and highlighting the active player.
- **Wall/dead-wall count**: beginner-friendly counters such as "Tiles left: 42" and "Replacement wall: 10".

This does not reveal hidden opponent hands. It makes already-public information visible in one place.

### 2. Keep player and opponent seats, but simplify their purpose

Seat rows should become secondary context instead of the only board view:

- Keep **your hand** large and sticky at the bottom of the play area.
- Keep opponent rows compact, showing:
  - name/wind;
  - count of concealed tiles;
  - exposed melds;
  - last 3-5 discards, with a link/affordance to the full discard list in the center panel.
- Use active-seat styling only for the active player, and avoid applying multiple competing highlights at once.

### 3. Add a "What changed?" event rail

Add a small chronological rail beside the center panel:

- "South discarded 3 Bamboo"
- "You can chow this tile"
- "West called pung"
- "You drew Red Dragon"

This teaches game flow while also making the current board state easier to parse.

### 4. Make action choices explain themselves

Update `#play-action` from a plain control bar into a decision card:

- Primary action at the top: "Discard a tile" / "Claim this discard?" / "Draw to continue".
- Secondary explanation: one short sentence explaining the rule.
- Action buttons with tile previews:
  - "Chow 2-3-4 Bamboo"
  - "Pung Red Dragon"
  - "Win — 3 faan minimum met"
  - "Pass"
- Disable impossible actions with a short reason instead of hiding all context.

### 5. Add beginner toggles

Add two low-risk toggles near the play controls:

- **Beginner board: On/Off** — controls whether the central public-information panel is expanded.
- **Hints: On/Off** — shows why the suggested discard/call is good without making the move automatically.

Default both toggles to `On` for first-time users.

## Suggested component changes

### New React-facing components

1. `src/components/game/PublicBoardPanel.tsx`
   - Props: public discards, exposed melds, latest event/tile, ruleset, wall count, active seat.
   - Output: central beginner board.

2. `src/components/game/TurnCompass.tsx`
   - Props: active seat, dealer seat.
   - Output: four-wind active marker.

3. `src/components/game/EventRail.tsx`
   - Props: latest 5-8 public game events.
   - Output: chronological teaching rail.

4. `src/components/game/DecisionCard.tsx`
   - Props: current mode, available calls, suggested action, rule explanation.
   - Output: beginner-readable action surface.

### Legacy-runtime bridge

Because play rendering still lives in `src/app.js`, start by rendering these panels from the current runtime using existing data. Once the play reducer is fully React-owned, move panel rendering into React props/state.

## Highlight alignment fix plan

The green selected-tile ring is currently drawn by `.mj-tile.is-selected::after` using an absolutely positioned border around the tile container. The tile face itself is a Unicode/emoji glyph, so the glyph's visual bounds can sit slightly lower than the CSS box. That makes the bottom of the green ring look like it overlaps the tile.

Fix approach:

1. Replace the pseudo-element border with a non-overlapping outline/box-shadow ring so the stroke is painted outside the tile box.
2. Add a small `translateY()` correction only to the selected ring, not to the tile itself, so selection does not move layout.
3. Use CSS custom properties for ring offset per tile size:
   - default tile: slightly larger bottom offset;
   - `sm`/`xs`: smaller offset;
   - `lg`: slightly larger offset.
4. Regression-check the selected ring in:
   - tile explorer;
   - sandbox slots;
   - drill answer palettes;
   - playable hand actionable tiles.
5. Prefer one shared `.mj-tile.is-selected` fix over per-feature overrides so all selected tiles align consistently.

Target CSS shape:

```css
.mj-tile.is-selected::after {
  inset: var(--tile-ring-inset-y, -4px) var(--tile-ring-inset-x, -4px) var(--tile-ring-inset-bottom, -6px);
  border: none;
  border-radius: 10px;
  box-shadow: 0 0 0 2px var(--jade);
  transform: translateY(var(--tile-ring-y, 1px));
}
```

## Implementation sequence

1. Fix the shared selected-tile ring first because it is low risk and affects existing UI polish.
2. Add the `PublicBoardPanel` markup in the play table, using only public information.
3. Add latest-event data to the play renderer and show it in the center panel.
4. Convert the action bar into a decision card while preserving existing action callbacks.
5. Add beginner/hints toggles with local state and default them to `On`.
6. Once the UX works, migrate the play renderer from the legacy runtime into React components.

## Success criteria

- A new player can identify the active player, latest tile, available action, and all public tiles without scanning four separate seat rows.
- Opponent hidden hands remain hidden unless a separate teaching/demo mode intentionally reveals them.
- The selected-tile green ring is visually centered and no longer overlaps the bottom of the tile face.
- The play section remains usable on mobile, with the player hand and decision card prioritized above secondary board history.
