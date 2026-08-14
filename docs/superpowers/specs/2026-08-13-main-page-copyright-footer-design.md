# Main-Page Copyright Footer Design

## Goal

Add a quiet, conventional copyright notice to the four main site pages without replacing or shifting the useful information already anchored to either side of the footer.

## Scope

The prototype covers:

- Home at `/`
- Process at `/process/`
- Writing at `/blog/`
- Contact at `/contact/`

Reader pages and their existing article-specific notices remain unchanged.

## Desktop layout

The footer becomes a true three-column grid:

```text
[existing left content]   [© 2026 Jory Pestorious]   [existing right content]
```

The left and right columns use equal flexible widths. The copyright notice occupies the middle column, so it stays centered in the page rather than centered only within whatever space remains between the edge items.

Existing footer content keeps its current alignment and wording. Writing retains its keyboard hints on the left and essay count on the right. Home, Process, and Contact retain their left-side keyboard hints and leave the right column empty.

The notice uses the footer's existing muted color, font size, border, and spacing. It is plain text with no link, badge, icon, or `All rights reserved` suffix.

## Mobile layout

The copyright notice remains visible on mobile.

At the existing mobile breakpoint, keyboard hints continue to disappear. The footer changes to one centered column:

- Home, Process, and Contact show the copyright notice by itself.
- Writing keeps the essay count and places the copyright notice beneath it.

This prevents the Writing count and copyright notice from colliding in a narrow three-column row.

## Year behavior

The HTML contains `2026` as a readable fallback. The existing shared site script replaces the marked year with the visitor's current calendar year when JavaScript runs. Only the numeric year changes.

## Verification

A focused browser test will confirm that:

1. All four main pages render `©`, the current year, and `Jory Pestorious`.
2. The copyright notice is centered at a desktop viewport while Writing's existing left and right content remains at its current edges.
3. The copyright notice remains visible at the mobile breakpoint.
4. Writing's mobile essay count and copyright notice do not overlap and appear in separate centered rows.
5. Reader-page footers remain unchanged.
