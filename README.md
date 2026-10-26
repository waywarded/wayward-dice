# Wayward Dice

A fork of [Owlbear Rodeo's Dice](https://github.com/owlbear-rodeo/dice) (GPL-3.0) that adds a roll API so character sheets and other extensions can throw the 3D dice, or stage a roll in the dice panel for the player to adjust. See [docs/roll-api.md](docs/roll-api.md).

Hosted at <https://dice.plotloot.com/>; install it in Owlbear Rodeo with `https://dice.plotloot.com/manifest.json`. It uses its own metadata ids, so it can sit next to the official Dice in one room.

Below is the upstream README, with the build instructions updated for this fork. Changes in this fork are copyright Wayward Distractions, under the same licence.

---

# Owlbear Rodeo Dice

Beautiful 3D dice extension for d20 based systems

![Example](/docs/header.jpg)

## Installing

The extension can be installed from the [store page](https://extensions.owlbear.rodeo/dice).

## How it Works

This project uses [React](https://reactjs.org/) for UI, [Three.js](https://threejs.org/) for rendering and [Rapier](https://rapier.rs/) for physics.

The physics simulation is used to both generate the animation for the roll as well as the final roll values.

> Wait is it really random if physics is used to determine the result? How do I know the dice rolls are fair?

Short answer yes, the dice are fair. Long answer [here's a statistical analysis](https://blog.owlbear.rodeo/are-owlbear-rodeos-dice-fair/) of the rolling methodology.

In order to sync rolls over the network efficiently we rely on the fact the Rapier is a deterministic physics engine. This means that across two different computers we'll get the same result given the same initial parameters.

So we only need to make sure that all the initial parameters are synced and then each client can run its own simulation and end up with the correct animation.

To try out the dice roller outside of Owlbear Rodeo you can head to <https://dice.owlbear.rodeo/>.

## Building

This project uses [pnpm](https://pnpm.io/) (Node 22 or later).

- `pnpm install`
- `pnpm dev` runs a development server: `/` is the standalone roller, and `/dev/obr-host.html` is a fake Owlbear Rodeo host that loads the background popover, the dice panel and a test "sheet" that sends roll requests
- `pnpm build` makes a static site in `dist/`

## Project Structure

All source files can be found in the `src` folder.

If you'd like to create a new dice set with the existing dice styles edit the `diceSets.ts` file in the `sets` folder.

If you'd like to add a new dice style the 3D models for the dice are split across four folders: `materials`, `meshes`, `colliders` and `previews`.

The `materials` folder contains the PBR materials for each dice style.

The `meshes` folder contains the 3D geometry used for the dice.

The `colliders` folder contains the simplified collider geometry for the dice.

The `previews` folder contains 2D image previews for each dice.

All the code specific for the Owlbear Rodeo extension is in the `plugin` folder.

## License

GNU GPLv3

## Contributing

This project is provided as an example of how to use the Owlbear Rodeo SDK. As such it is unlikely that we will accept pull requests for new features.

Instead we encourage you to fork this repository and build the dice roller of your dreams.

Copyright (C) 2023 Owlbear Rodeo
