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
| `crit` | `{ success?, failure? }`? | Critical faces of the kept die, e.g. `{ "success": "1", "failure": "20" }` for Dragonbane's Dragon and Demon: a face, or an inclusive bound (`">18"` is 18 and up, `"<3"` 3 and down). See *Crits* |
| `mode` | `"roll"` \| `"stage"` | `"roll"` (default) throws now. `"stage"` opens the dice panel with the dice, bonus, keep and label filled in, without throwing; the player can change it and press Roll |

Where a roll runs depends on the player's **Auto-open dice panel** setting (⚙ in the panel; *My rolls* unless they change it):
- **Dice panel open:** in the panel's tray, as if the player had pressed Roll.
- **Closed, *My rolls* or *All rolls*:** the panel opens and the dice are thrown there. If it doesn't load within 5 s, the corner tray rolls instead.
- **Closed, *Never*:** in a small tray in the bottom-right corner, like other players' rolls.

With *All rolls*, the panel also opens on another player's tray when they roll (not their hidden rolls, and not while this player has a staged roll waiting).

Either way it uses the dice set the player last picked in the panel.

One roll at a time: a request that arrives while a requested roll is still rolling gets `roll-error` "Roll in progress" (as Dice+ answers). A requested roll still unsettled after 15 s is given up with "Roll timed out", and the new request rolls.

### Staging

- The tray is cleared and the picker filled in; a `"gm"` request turns the panel's hidden toggle on, and the toggle goes back to what it was once the roll is thrown or cleared.
- The player can change anything and press Roll. The result comes back on the same `rollId`, with `modified: true` if the dice, bonus or keep changed.
- Clearing (✕) the staged roll, closing the dice panel, or staging another request answers `roll-error` "Cancelled".
- The panel can show any number of each die, a bonus, keep-highest/lowest of one kind of die with up to 5 extra dice, and a count of successes (or a target, with or without a keep). It can't show a `d66`, a keep alongside other dice, or a roll in parts; staging those answers `roll-error`.
- Staging also clears the corner tray's last roll.

### Notation

Terms joined with `+` or `-`:
- `NdX`: X = 4, 6, 8, 10, 12, 20 or 100; N from 1 to 20; `dX` means `1dX`.
- `NdXkh1` / `NdXkl1`: keep the highest or lowest one of N (at least 2). `3d20kl1` is a d20 with two boons in a roll-under game.
- `d66`: two d6 read as tens and units (11–66). One per term.
- Whole numbers, added or subtracted.
- **Counting successes:** dice followed by `=N`, `>N`, `>=N`, `<N` or `<=N` count the dice that meet it instead of adding them up. `5d6=6` counts the sixes (Vaesen); `2d10<6` counts the dice below 6 (Starforged progress). A keep counts its kept die. No bonus or d66 in a counted roll; a d10's 0 counts as 10.
- **Against a target:** a count of a single die (or a keep) reads as Success or Failure: `d20<=12` is Dragonbane's roll under a skill of 12, and `2d20kl1<=12` the same with a boon. It shows as "8 · Success".
- **Parts:** commas split a roll into up to 5 parts rolled together but read apart: `1d6+2, 1d10, 1d10` (Ironsworn's action and challenge dice).

At most 20 dice in all. Examples: `2d6+1`, `d20-2`, `2d20kh1+3`, `3d20kl1`, `d100`, `d66`, `5d6=6`, `2d10<6`, `1d6+2, 1d10, 1d10`. Dice can't be subtracted.

The tray and the panel show a count as "2 successes" (the successes underlined in the breakdown), a target roll as "8 · Success" or "15 · Failure", and parts as "6 · 3 · 9".

### Crits

A roll that comes down to one die (one die, one keep, or one die against a target, with or without a bonus) can be critical, judged on the kept die's natural face. The faces come from the request's `crit`; without it, a d20 gets defaults by direction: roll-under (a `<`/`<=` target, or a room set to Boon / Bane) makes 1 a crit and 20 a fumble, roll-over the reverse. A crit decides a target roll: "1 · Critical success", "20 · Critical failure". Otherwise it's added: "23 · Critical", "4 · Fumble". The panel shows successes and crits in green, failures and fumbles in red.

### Push

When the GM turns on **Pushes** (⚙, whole room), a finished roll in the panel offers **Push** next to Re-roll, once: it rolls a pool's dice that didn't succeed (Vaesen), or the whole roll when a target roll failed (Dragonbane). Plain totals can't be pushed. A pushed requested roll is reported again, with `pushed: true`.

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
- `total`: kept dice plus the bonus. For a counted roll, the number of successes (also as `successes`). For a roll in parts, `null`, and `parts` has one `{ values, total, successes?, success?, crit? }` per part.
- `success`: only for a roll against a target.
- `crit`: `"critical"` or `"fumble"` when the kept die shows a critical face.
- `pushed`: on the second answer for a roll the player pushed.
- `modified`: only on staged rolls; true when the player changed the dice or bonus before rolling (here, by adding a d6).

`{source}/roll-error`: `{ rollId, error }`, e.g. `"No d7 in this dice set"`, `"Roll in progress"`, or `"Cancelled"` for a staged roll the player didn't throw.

## Room setting

The room's metadata key `com.plotloot.wayward-dice/settings` holds `{ keepNames: "ADVANTAGE" | "BOON", pushes: boolean }`, set from the panel's ⚙ menu. `keepNames` renames the keep toggle (Adv/Dis, or Boon/Bane where a boon keeps the lowest) and sets the default crit direction (Boon/Bane rolls under); requests always say `kh1` or `kl1`. `pushes` (GM only) offers Push on finished rolls.

## Roll history

Every roll, from a request or the panel, goes into a shared log once it settles: the log-sheet button in the panel's sidebar lists the room's newest 30, and the GM can clear them.

Each player's client writes only its own last 8 rolls, under the room metadata key `com.plotloot.wayward-dice/history/<player id>`, so rolls made at the same moment don't overwrite each other and the log survives players leaving. An entry is about 100 bytes:

```json
{ "i": "abcdmh3k2x", "t": 1793000000, "p": "Hilda", "c": "#ff5c5c", "l": "Hilda: Swords (STR) ≤ 12", "n": "2d20kl1", "r": "5", "v": "5,17" }
```

`t` is in epoch seconds, `l` is the request's label (absent for panel rolls), `n` the notation, `r` the result as shown, and `v` the faces. A hidden roll is shared as `{ i, t, p, c, h: 1 }` only; its roller keeps the full entry in their own browser. Other extensions may read the log but shouldn't write to it.
