# Roll API

Other Owlbear Rodeo extensions (character sheets, macros) can throw Wayward Dice with broadcast messages. All messages are sent with `{ destination: "LOCAL" }`, so they only reach the player's own dice. The shape follows Dice+'s, so a sheet that supports Dice+ needs little extra code.

This file is the contract: other extensions (waywardsheets among them) rely only on what it says.

## Is it installed?

Send `wayward-dice/isReady` with `{ requestId }`. Wayward Dice answers on the same channel with `{ requestId, ready: true, timestamp }`. Your own request also comes back on that channel, so only treat a message with `ready: true` as the answer. No answer within a second or so means it isn't in the room.

## Roll or stage

Send `wayward-dice/roll-request`:

| Field | Type | |
|---|---|---|
| `rollId` | string | Yours; it comes back with the answer |
| `source` | string | Answers go to `{source}/roll-result` and `{source}/roll-error` |
| `notation` | string | See below |
| `label` | string? | Shown on the tray, e.g. "Hilda: Swords" |
| `visibility` | `"all"` \| `"gm"` | `"gm"` is a hidden roll: others don't see the dice or values |
| `mode` | `"roll"` \| `"stage"` | `"roll"` (default) throws now. `"stage"` opens the dice panel with the dice, bonus, keep and label filled in, without throwing; the player can change it and press Roll |

Where a roll runs:
- **Dice panel closed:** in a small tray in the bottom-right corner, like other players' rolls. The panel doesn't open.
- **Dice panel open:** in the panel's tray, as if the player had pressed Roll.

Either way it uses the dice set the player last picked in the panel.

One roll at a time: a request that arrives while a requested roll is still rolling gets `roll-error` "Roll in progress" (as Dice+ answers). A requested roll still unsettled after 15 s is given up with "Roll timed out", and the new request rolls.

### Staging

- The tray is cleared and the picker filled in; a `"gm"` request turns the panel's hidden toggle on, and the toggle goes back to what it was once the roll is thrown or cleared.
- The player can change anything and press Roll. The result comes back on the same `rollId`, with `modified: true` if the dice, bonus or keep changed.
- Clearing (✕) the staged roll, closing the dice panel, or staging another request answers `roll-error` "Cancelled".
- The panel can show any number of each die, a bonus, and keep-highest/lowest of one kind of die with up to 5 extra dice. It can't show a `d66`, or a keep alongside other dice; staging those answers `roll-error`.

### Notation

Terms joined with `+` or `-`:
- `NdX`: X = 4, 6, 8, 10, 12, 20 or 100; N from 1 to 20; `dX` means `1dX`.
- `NdXkh1` / `NdXkl1`: keep the highest or lowest one of N (at least 2). `3d20kl1` is a d20 with two boons in a roll-under game.
- `d66`: two d6 read as tens and units (11–66). One per term.
- Whole numbers, added or subtracted.

Examples: `2d6+1`, `d20-2`, `2d20kh1+3`, `3d20kl1`, `d100`, `d66`. Dice can't be subtracted.

## Answers

`{source}/roll-result`:

```json
{
  "rollId": "…",
  "label": "Hilda: Swords",
  "notation": "d20+3",
  "values": [3, 16],
  "total": 22,
  "hidden": false,
  "modified": true
}
```

- `values`: each die's face in throw order. A d100 is a tens die and a d10, as in the panel (`[10, 1]` is 11; `[0, 0]` is 100). A d66 is its tens die then its units die.
- `total`: kept dice plus the bonus.
- `modified`: only on staged rolls; true when the player changed the dice or bonus before rolling (here, by adding a d6).

`{source}/roll-error`: `{ rollId, error }`, e.g. `"No d7 in this dice set"`, `"Roll in progress"`, or `"Cancelled"` for a staged roll the player didn't throw.

## Room setting

The room's metadata key `com.plotloot.wayward-dice/settings` holds `{ keepNames: "ADVANTAGE" | "BOON" }`, set from the panel's ⚙ menu. It only renames the keep toggle (Adv/Dis, or Boon/Bane where a boon keeps the lowest); requests always say `kh1` or `kl1`.
