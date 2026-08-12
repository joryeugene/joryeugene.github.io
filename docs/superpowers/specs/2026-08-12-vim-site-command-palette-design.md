# Vim Site Command Palette

## Goal

Make the website command palette available from Phalene-Vim without replacing its local Vim command palette.

## Shortcut model

- `Ctrl+K` opens the site command palette from `/vim/`.
- `Ctrl+P` continues to open the Vim command palette.
- Both shortcuts work in normal and visual modes. Insert mode keeps editor input behavior.
- Opening either palette while the other is open closes the open palette first.
- `Escape` closes the active palette and returns focus to the editor.

## Interface

The new palette uses the existing site destinations, search behavior, keyboard navigation, and empty state. Its heading reads `SITE COMMANDS` and shows `CTRL K · ESC`. The existing Vim palette heading changes to `VIM COMMANDS` so the two scopes are explicit.

The site palette adopts the Vim page's colors and geometry. It does not add the portfolio header or another persistent control to the editor.

## Implementation boundary

Move the existing site command palette object into a small shared script that exports `window.SiteCommandPalette`. The portfolio, article reader, and Vim page consume that object. Keep the command list in one place and do not add a command registry, shortcut service, dependency, or build step.

The Vim page owns opening, closing, and focus restoration because its keyboard modes are local state. Existing portfolio and reader behavior remains unchanged.

## Verification

- A browser test proves that `Ctrl+K` opens site commands from `/vim/`, filters destinations, closes with `Escape`, and leaves `Ctrl+P` opening Vim commands.
- Existing portfolio and reader palette tests prove that extracting the shared object did not change their behavior.
- Exercise the changed path at desktop and mobile viewport sizes and confirm that the palette fits without horizontal overflow.
