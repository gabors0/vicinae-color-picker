# KDE Color Picker for Vicinae

A [Vicinae](https://vicinae.com) extension that picks colors from anywhere on screen using KWin's built-in color picker — the same one Plasma's Color Picker widget uses.

## Commands

- **Pick Color** — closes the launcher, lets you click any pixel, copies the color and saves it to history. The copy format (HEX, RGB or HSL) is set in the extension's preferences.
- **Color History** — your last 50 picked colors with swatches. Copy as HEX / RGB / HSL, pick a new color, remove one (`Ctrl+X`) or clear everything (`Ctrl+Shift+X`).

## Requirements

- KDE Plasma (Wayland or X11) — the picker is KWin's `org.kde.kwin.ColorPicker` D-Bus interface
- `busctl` (ships with systemd)

## Install

### Nix / Home Manager

Add the flake as an input and pass the package to the Vicinae Home Manager module:

```nix
# flake.nix
inputs.vicinae-kde-color-picker.url = "github:gabors0/vicinae-color-picker";
```

```nix
# home.nix
programs.vicinae.extensions = [
  inputs.vicinae-kde-color-picker.packages.${pkgs.system}.default
];
```

### Manually

Requires Node.js and npm.

```bash
git clone https://github.com/gabors0/vicinae-color-picker
cd vicinae-color-picker
npm install
npm run build
```

`npm run build` installs the extension into `~/.local/share/vicinae/extensions/kde-color-picker`. No restart needed — search for **Pick Color** in Vicinae. To update, `git pull` and run `npm run build` again.

## Development

```bash
npm run dev   # rebuilds and reloads on change
npm run lint  # validates the manifest
```
