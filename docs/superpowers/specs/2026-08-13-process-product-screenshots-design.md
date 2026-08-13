# Process Product Screenshots Design

## Outcome

Each Process case summary shows one real product-experience image beside its existing description. A visitor can identify the interface or interaction before opening the deep dive.

The prototype does not change the case-study claims, links, deep-dive layers, rejected approaches, keyboard controls, or case order.

## Selected images

| Case | Image | Source | Visible evidence |
|---|---|---|---|
| Dadbod Grip | Editable grid and generated SQL | Existing `blog/dadbod-grip/live.png`, originally published in the Dadbod Grip walkthrough | Schema navigation, query editing, staged cell mutations, and mutation SQL |
| Totally Reliable | Four ragdolls hanging in a chain from a jetpack | Approved downloaded gameplay frame from the game's IMDb media listing | Four live bodies, connected grips, flight, and an active delivery objective |
| Theosis | Current Pray Orthodox calendar and prayer reader | Fresh desktop capture from `https://prayorthodox.com/` | Calendar, appointed prayer, role selection, source disclosure, and prayer action |
| Workhelix | Nucleus AI Assessment dashboard | Product image served by `https://www.workhelix.com/platform` | AI opportunity metrics, business-unit ranking, drilldown tooltip, and use-case treemap |

The source files remain unchanged. The public site receives locally hosted, optimized copies under `jpg/process/` with descriptive filenames. The implementation must not hotlink the product sites.

## Placement

The image belongs in the top case summary, not inside the deep-dive layers.

At desktop widths, each case summary uses two columns:

- Existing eyebrow, heading, description, and links on the left.
- One bordered product image on the right.

At tablet and phone widths, the image stacks below the case links. Every case uses the same 16:9 frame so switching cases does not move the Deep dive section.

The frame uses a restrained border and the existing panel treatment. It does not add a browser-window mockup, decorative device frame, carousel, gallery, caption overlay, or lightbox.

## Image treatment

All four public assets use a consistent landscape presentation and preserve the most useful part of the original frame.

- Dadbod Grip centers the grid and generated SQL.
- Totally Reliable keeps all four connected ragdolls visible.
- Pray Orthodox keeps both the calendar column and prayer action visible.
- Nucleus keeps the main metrics, opportunity chart, and enough of the use-case view to show product depth.

The implementation should prefer WebP when the conversion does not reduce interface legibility. Text inside each screenshot must remain readable at the rendered desktop size. Each image receives intrinsic dimensions, lazy loading, asynchronous decoding, and this project-specific alternative text:

- Dadbod Grip: `Dadbod Grip in Neovim with schema navigation, a query editor, staged grid changes, and generated SQL.`
- Totally Reliable: `Four Totally Reliable Delivery Service ragdolls hanging in a chain beneath a flying jetpack.`
- Pray Orthodox: `Pray Orthodox showing the daily calendar beside the Third Hour prayer reader.`
- Nucleus: `Nucleus AI Assessment dashboard with opportunity metrics, a business-unit chart, and a use-case treemap.`

## Interaction and accessibility

Case selection continues to work by pointer, focus, click, `j` and `k`, and the URL hash. Images are evidence, not controls, so they do not receive links or focus behavior.

Alternative text describes what the screenshot proves rather than repeating the case heading. The surrounding case description remains authoritative when an image does not load.

Reduced-motion behavior is unchanged. No new animation is added.

## Verification

The prototype is accepted when:

1. Every case displays the approved image and descriptive alternative text.
2. Switching among all four cases preserves the position of the Deep dive heading and Process stage at 320, 390, 768, 994, 1280, and 1440 pixel widths.
3. No case, image, link, or layer causes horizontal overflow at 320 or 390 pixels.
4. Existing Process case, layer, keyboard, hash, and mobile tests still pass.
5. The page loads the images locally and makes no runtime requests to the four source sites.
6. Desktop and mobile screenshots are compared against the current live page, and the images remain legible without overwhelming the case descriptions.

## Scope boundary

This wave adds the four approved images to the Process summary cards only. It does not rewrite public copy, add more project images elsewhere, alter the homepage, redesign the deep dive, or publish the site.
