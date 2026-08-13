# Phalene-Vim Jumplist Design

## Goal

Make `Ctrl-O` and `Ctrl-I` behave like Vim's jumplist in the browser editor, including counted traversal, `<Tab>` as `Ctrl-I`, cross-document return, visible inspection, and bounded storage.

## User-visible semantics

The jumplist records significant jumps. It does not record ordinary cursor movement.

- `h`, `j`, `k`, `l`, `w`, `b`, and their counted forms do not add entries.
- Supported jump-producing commands add the location being left: `G`, `gg`, searches, `n`, `N`, `*`, `#`, `%`, mark jumps, paragraph and section jumps, `H`, `M`, `L`, and document-opening Ex commands.
- `Ctrl-O` moves to an older entry. `Ctrl-I` and `<Tab>` move to a newer entry in Normal and Visual modes.
- `[count]Ctrl-O`, `[count]Ctrl-I`, and `[count]<Tab>` traverse up to `count` entries and consume the count. A count never leaks into the next command.
- On the first `Ctrl-O` from the newest position, the current location is appended so `Ctrl-I` can return to it.
- A jump is deduplicated against the preceding entry when both locations refer to the same document and line.
- A new jump does not discard newer entries reached earlier with `Ctrl-O`. This matches Vim's default jumplist behavior without `jumpoptions=stack`.
- The list keeps at most 100 entries.
- Reaching the oldest or newest boundary leaves the cursor in place and reports `E662: At start of jumplist` or `E663: At end of jumplist`.

The current `autoJump()` rule is removed. Its two-line threshold wrongly records counted `j` and `k`, while missing valid jumps that happen to land on the same or an adjacent line.

## Document model

Each jump entry has this shape:

```js
{
  documentId: 'blog:friction-economy',
  filename: 'friction-economy.md',
  row: 18,
  col: 6
}
```

`documentId` is a stable session identifier derived from the source being displayed. Blog posts use `blog:<slug>`, local browser files use `file:<filename>`, help uses `help:<topic>`, and fixed generated views use names such as `welcome`, `explorer`, and `tutor`. Each `:enew` buffer receives a monotonically increasing `untitled:<number>` ID. These prefixes prevent equal display names from colliding.

A small in-memory document registry stores only documents visited during the current Vim session. Before a command replaces `state.lines`, it saves the active document's lines and display name. Activating a jump in another document restores that saved content and cursor position. This registry does not persist to `localStorage`, create windows or tab pages, or introduce a general buffer-management API.

All existing document-opening paths use one switch helper. This includes `:e`, `:enew`, `:Ex`, `:intro`, `:help`, and `:tutor`. Async blog loading records the old location before the request and adds the destination only after the requested content is available.

## Position maintenance

Jump rows remain useful after line insertions and deletions in a visited document.

- Inserting lines before a stored row shifts that row down.
- Deleting lines before a stored row shifts that row up.
- Deleting the line containing a stored location moves it to the first surviving line at the edit boundary.
- Same-line edits keep the stored row and clamp the column when the jump is used.

One small row-adjustment helper updates entries for the active `documentId` whenever an existing edit changes the number of lines. It is deliberately limited to jumplist positions in this slice. A later changelist plan may generalize it after the behavior is proven.

## Commands and input surfaces

`:jumps` shows the bounded list using the editor's existing command-output buffer convention. Each row includes the traversal marker, line, column, filename, and a short line preview. The output explains that `u` returns to the prior buffer, matching the existing `:marks` convention.

`:clearjumps` empties the list, resets its index, and reports completion in the status line.

Normal and Visual mode accept hardware `Ctrl-I` and `<Tab>`. Insert mode keeps its existing Tab behavior and insert-mode `Ctrl-O` behavior. The mobile one-shot Ctrl key can produce `Ctrl-O` and `Ctrl-I` through the existing synthetic-key dispatcher.

## Verification

Create a focused Playwright suite that proves these complete journeys:

1. Search to a result, use `Ctrl-O` to return, then use both `Ctrl-I` and `<Tab>` to revisit the result.
2. Run `:clearjumps`, move with ordinary and counted `h`, `j`, `k`, `l`, `w`, and `b`, then confirm `Ctrl-O` does not move.
3. Create three real jumps, traverse them with counts, and confirm the next counted command starts with a clean count.
4. Open two browser documents, return across them with `Ctrl-O`, then go forward with `Ctrl-I` without losing edits made before switching.
5. Insert and delete lines above a saved jump and confirm the target follows the original text.
6. Inspect entries with `:jumps`, clear them with `:clearjumps`, and verify both boundary messages.
7. Run the hardware `Ctrl-I` and `<Tab>` journey in Chromium, Firefox, and WebKit. Exercise mobile `Ctrl-O` and `Ctrl-I` through the visible one-shot Ctrl key.

Existing insert-mode `Ctrl-O`, Visual mode, tutor, dashboard, and mobile suites must remain green.

## Size and performance limits

- Add no runtime dependency, build step, parser, worker, or persistent storage.
- Keep the list capped at 100 entries and update it without scanning the document.
- Ordinary cursor movement adds no allocation, document copy, or extra render.
- Copy document lines only when switching documents, not when recording a same-document jump.
- Keep added runtime code within 4 KB gzip.
- Keep the existing 1,000-line and 10,000-line, 100-key `j` benchmark medians within 10 percent of the recorded 5.0 ms and 80.4 ms baselines. This feature should not touch that hot path after `autoJump()` is removed.

## Deferred work

The following features remain separately testable follow-on projects:

1. Command and search history with Up and Down recall.
2. Changelist traversal with `g;` and `g,`, plus automatic marks.
3. Typed named, numbered, append, black-hole, and clipboard registers.
4. Complete dot repeat through the existing bounded macro dispatcher.
5. Current-buffer `Ctrl-N` and `Ctrl-P` completion with candidate and time caps.
6. Neovim `il` and `al`, followed by sentence and tag text objects.
7. Viewport rendering if 10,000-line editing becomes a required user journey.

## Upstream references

The target semantics come from Vim `v9.2.0957` and Neovim `v0.12.4`, with current development branches checked for small portable additions on 2026-08-13.

- Vim jumplist documentation: <https://github.com/vim/vim/blob/7807dd22793da0e826618c0ca9c6210bbc1ea3f5/runtime/doc/motion.txt#L1061-L1166>
- Vim jumplist implementation: <https://github.com/vim/vim/blob/7807dd22793da0e826618c0ca9c6210bbc1ea3f5/src/mark.c#L165-L285>
- Neovim jumplist implementation: <https://github.com/neovim/neovim/blob/68ea43cd0c28af25cd47731308c94fedfcfd1b0b/src/nvim/mark.c#L251-L397>
- Vim jumplist regression tests: <https://github.com/vim/vim/blob/7807dd22793da0e826618c0ca9c6210bbc1ea3f5/src/testdir/test_jumplist.vim>
- Neovim jump regression tests: <https://github.com/neovim/neovim/blob/faf8345eef8c9a59f254d3e4bafab1a9c125ee21/test/functional/editor/jump_spec.lua>
