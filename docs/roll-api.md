# Roll API

Other Owlbear Rodeo extensions (character sheets, macros) can throw Wayward Dice with broadcast messages. All messages are sent with `{ destination: "LOCAL" }`, so they only reach the player's own dice. The shape follows Dice+'s, so a sheet that supports Dice+ needs little extra code.

The API is a spike: names and fields may still change.

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
| `mode` | `"roll"` \| `"stage"` | `"roll"` (default) throws now. `"stage"` opens the dice panel with the dice, bonus, advantage and label filled in, without throwing; the player can change it and press Roll |

Where a roll runs:
- **Dice panel closed:** in a small tray in the bottom-right corner, like other players' rolls. The panel doesn't open.
- **Dice panel open:** in the panel's tray, as if the player had pressed Roll.

### Notation

Terms joined with `+` or `-`: `NdX` (X = 4, 6, 8, 10, 12, 20 or 100; N up to 20; `dX` means `1dX`), `NdXkh1` / `NdXkl1` (keep the highest or lowest), and whole numbers. Examples: `2d6+1`, `d20-2`, `2d20kh1+3`, `d100`.

Staging can only keep the highest or lowest of exactly two dice (the panel's Adv/Dis).

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

- `values`: each die's face in throw order. A d100 is a tens die and a d10, as in the panel (`[10, 1]` is 11; `[0, 0]` is 100).
- `total`: kept dice plus the bonus.
- `modified`: only on staged rolls; true when the player changed the dice or bonus before rolling (here, by adding a d6).

`{source}/roll-error`: `{ rollId, error }`, e.g. `"No d7 in this dice set"`, or `"Cancelled"` when the player clears a staged roll.
