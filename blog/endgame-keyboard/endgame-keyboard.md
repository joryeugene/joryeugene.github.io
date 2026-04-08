# Twelve Keyboards Later

**I bought 12 keyboards so you do not have to**

[![Split ergonomic keyboard with touchpad centered between halves](piantor-setup.jpg)](piantor-setup.png)

*By Jory Pestorious*

## Twelve Keyboards

At one point I owned a Piantor Pro, a CharaChorder, a CharaChorder Forge, a Starboard stenograph, a Kinesis Advantage, a Kinesis Advantage Pro, a Moergo Glove80, a Polyglot, an Alienware, a small Miryoku board from eBay, an HHKB Type-S, and a Keychron K2. That is twelve keyboards, twelve different muscle memories, and twelve keymaps to maintain.

Four survived. Eight are getting sold or given away. This is what the rotation taught me.

## How I Got Here

The progression felt rational at every step. The MacBook keyboard is fine, but what if split ergonomic is better for your wrists? The Kinesis Advantage is great, but what if lighter switches reduce fatigue? Lighter switches are nice, but what if chording lets you type whole words at once? Chording is powerful, but what if stenography is the real speed unlock? Stenography is fast, but the learning curve is two years and you still need a regular keyboard for everything else.

Most purchases solved a real problem. Each purchase also created a new one: now you have two keyboards to maintain, and neither has the perfect layout. So you buy a third.

## What Actually Matters

After living with all of them, three things matter for programming keyboards:

**Split.** Your shoulders should not be pinched inward eight hours a day. Any split board fixes this. A laptop is a laptop, but at a desk, split is the single biggest ergonomic gain. Tenting (tilting the inner edge upward) reduces forearm pronation, and negative tilt (front edge higher than back) keeps wrists neutral. The Piantor Pro is flat, so tenting requires a 3D-printed stand or a wedge underneath. These are worth experimenting with if you have wrist discomfort, though the split angle alone solves the shoulder problem.

**Layers.** Reaching for the number row, arrow keys, or function keys interrupts flow. A 42-key board with good layers keeps everything under your fingers. The Piantor Pro handles this in Vial firmware. On a MacBook, [Karabiner-Elements](https://karabiner-elements.pqrs.org/) achieves a similar result in software. Either way, the principle is the same: keep your hands on home row.

**Light switches.** Heavy switches cause fatigue over long sessions. The Piantor Pro with Nocturnal Silent Linear 20g switches requires almost no force. Your fingers rest on the keys and thoughts become text. This is the one advantage hardware has over software remapping.

Everything else is preference, not performance. Ortholinear versus staggered, curved key wells versus flat PCB, trackball versus touchpad, wired versus wireless, and QWERTY versus Colemak-DH. These are real differences that produce approximately zero productivity delta. Switching to Colemak simultaneously with switching to split doubles the learning curve; I stayed on QWERTY because the columnar layout already breaks old muscle memory enough for one transition.

## The Four That Survived

Each of the four serves a different purpose. No single keyboard covers all of them.

**Piantor Pro with Nocturnal Silent Linear 20g switches.** This is the desk keyboard and the endpoint of the optimization path: split, columnar, 42 keys, and [Vial](https://get.vial.today/) firmware. The switches require almost no force. Fingers rest on the keys and thoughts become text without conscious effort. It lives on the desk and stays there.

**HHKB Type-S.** This one lasted longest before getting sold. Topre switches feel like nothing else: the silenced cups have a soft, rounded bottom-out that rewards slow, deliberate typing. It is not split, has minimal layers built into the DIP switches, and requires no firmware configuration. Ctrl lives where Caps Lock belongs. You plug it in and write. For anyone who does not want to go deeper into the optimization path, it is a genuinely good all-arounder. It just was not the endgame.

**Keychron K2.** This is the gaming keyboard. Games need instant access to number keys, F-keys, and Escape, and cycling through a layer to reach them while strafing and jumping does not work in practice. A 75% mechanical board gives every modifier its own physical key. The switches are loud and clicky, which does not matter for gaming because you are not in a flow state typing prose. If this board ever dies, magnetic Hall effect switches are interesting for the adjustable actuation and rapid trigger.

The mouse matters as much as the keyboard for gaming. The single most important quality is a shape you can lift and palm quickly. The Logitech G Pro X Superlight works because it is light, simple, and has no extra buttons competing for grip space. Too many side buttons change the grip angle. A [DeltaHub Carpio](https://deltahub.io/products/carpio) wrist rest under the heel of the mouse hand is worth mentioning: it keeps the wrist neutral during long sessions and slides with the mouse instead of pinning the wrist to the desk. For professional work, the Mac touchpad replaces the mouse entirely. I tried several trackballs over the years, but they slow down as the bearings collect dust, and the maintenance cycle of cleaning them to restore speed gets old.

**MacBook keyboard with Karabiner.** This is the travel keyboard. It is already attached to the laptop. macOS System Settings swaps Caps Lock and Ctrl so Ctrl sits on the home row. Karabiner then gives it Cmd+HJKL arrow keys and makes that Caps Lock position (now Ctrl) tap for Escape, hold for Ctrl. It requires zero extra gear to carry. It is not the best keyboard for long sessions, but it is the most practical one for meetings and coffee shops. The software layer does most of the work regardless of what hardware sits underneath it.

The other eight are getting sold or given away.

## The Setup That Works

The Piantor Pro sits on the desk with the Mac touchpad centered between the halves: left hand, touchpad, right hand. Nothing requires reaching.

This is the same layout a laptop provides naturally: keyboard with trackpad in the middle. The difference is lighter switches, a split angle, and the ability to adjust spacing to your shoulder width.

The keymap lives on the board itself via Vial firmware. Plug it into any computer and the layout follows. The software stack ([skhd](https://github.com/koekeishiya/skhd), [yabai](https://github.com/koekeishiya/yabai), tmux) still needs to be installed on each machine, but the keyboard layout is self-contained. The full layout is on GitHub: [heavy-handed](https://github.com/joryeugene/heavy-handed).

Modifiers live on the outer pinky columns: Ctrl top left, Cmd home left, Alt top right, Shift on both bottoms. Six thumb keys handle five layers and the five most frequent non-alpha keys: Backspace, Space, Tab, Escape, and mouse click.

The right outer thumb taps Escape and holds Hyper (all four modifiers at once), giving skhd a dedicated namespace for app launching that never collides with any other shortcut. The right inner thumb taps left-click and holds for a mouse layer that moves the cursor via HJKL, useful for quick pointer adjustments without reaching for the touchpad.

Every key is reachable without moving your hands, and the board is small enough that reaching is structurally impossible.

Home row mods do not survive 20g switches. At that actuation force, fingers rest on the keys with enough pressure to register. Fast typing holds keys for 100-150ms during normal rollover, which overlaps with the tapping term threshold. The firmware cannot reliably distinguish "typing A quickly" from "starting to hold Cmd." Dedicated modifier keys on the pinky columns have no timing ambiguity. Ctrl is always Ctrl.

The inner column keys (T/G/B and Y/H/N positions) are blank on most layers. Insert used to live on the G position of the navigation layer, and it fired constantly. Blanking the inner column on layers where it serves no purpose fixed the problem. The inner column still carries content on some layers (the number layer puts brackets on Y and equals on H; the symbol layer puts symbols across the right inner column) where those keys are intentional targets.

## The Software Stack

The keyboard layout is one layer in a stack. Hold Space and the right hand controls all of tmux: split panes, zoom, lazygit, session picker, directory jump, and yazi file manager. Hold Enter and the left hand controls yabai: focus, swap, and resize windows through HJKL in three modifier tiers. Hold Escape and the right outer thumb becomes Hyper (all four modifiers at once), giving skhd a dedicated namespace for app launching that never collides with window management or tmux.

The whole system is three tools and three modifier domains with no overlap. Alt for windows, Ctrl+A for tmux, and Hyper for apps. Each domain maps spatially to vim directions. Learning one teaches the muscle memory for all three.

A fourth layer reduces mouse dependence at the OS level. [Homerow](https://www.homerow.app/) overlays letter labels on every clickable element when triggered. Hyper+J activates click mode: type one or two letters to fire a click without moving your hand. Hyper+K activates scroll mode for areas where reaching the trackpad would break flow. This is the vim jump methodology applied to the entire operating system.

## What Each Board Taught Me

Most keyboards on this list solved a real problem. Every one of them revealed that the problem it solved was not the bottleneck.

**Kinesis Advantage / Advantage Pro.** Two coworkers settled on the Advantage 360 Pro and love it. The board is good. The curved key wells feel substantial, and the adjustable split angle is a genuine ergonomic feature. What moved me off was switch preference: Cherry MX switches have 2.0mm of actuation travel and 4.0mm total travel. Kailh Choc v1 switches have 1.5mm actuation and 3.0mm total, in a housing less than half the height. The MX switches feel hollow compared to Choc linears, and the heavier actuation combined with the extra travel distance makes long sessions noticeably more fatiguing. The Glove80 and ZSA Voyager are the two premium ergo boards that use Choc v1 switches; Kinesis boards (Advantage2, Advantage360) all use full-height MX. The contoured wells look like they should help you hit keys faster, but in practice the speed gain is negligible. The real ergonomic benefit comes from the split angle, which any split board provides.

**CharaChorder / CharaChorder Forge.** The original CharaChorder had nice switches, three thumb joysticks per thumb, and a concept that is genuinely smart: press all the letters in a word simultaneously and the processor arranges them on screen. You can also type normally by pushing individual switches in different directions, but some directions feel awkward, especially lateral motions on the pinky and ring fingers. The Forge reduced the thumb clusters to two per thumb, which is an improvement, but replaced those nice switches with hyper-sensitive mouse-like switches that made some chords nearly impossible, even for someone with dexterous fingers. The speed demos look fun and the idea is sound, but building muscle memory for hundreds of chords takes months, and the switches have a reputation for failing under heavy use. The concept is worth following without committing to the hardware. CharaChorder makes the [CharaChorder X](https://www.charachorder.com/products/charachorder-x), a USB dongle that adds chording to any existing keyboard. If you want the concept in software, [virtchord](https://github.com/c2vi/virtchord) is an open source project that turns any keyboard into a CharaChorder Lite.

**Moergo Glove80.** The Glove80 uses Choc v1 switches and is wireless with 80 keys, but it feels plastic and lightweight rather than robust. It might work for travel, but it does not inspire confidence on a desk. The real problem is the key count: with good layers, 42 keys covers everything, and the remaining 38 keys on the Glove80 create decision paralysis about what to put where. I spent more time programming those extra keys than actually using them. The wider layout also means more finger travel. The new Glove60 looks like a genuine improvement, but even 60 keys is more than necessary once you have good layers. Extra keys are not free; they are cognitive overhead for every layout decision.

**Starboard stenograph.** Stenography is fast for transcription, but the learning curve is measured in years, not weeks. Court reporters spend that time because their livelihood depends on it. For programming, where the bottleneck is thinking rather than typing speed, the investment does not pay off. Stenography has also been trending toward voice input lately, with reporters wearing masks that look like Bane from Batman to dictate silently into speech-to-text systems. The profession is converging on the same conclusion as this article: voice is the other endgame.

**Polyglot.** The Polyglot sits somewhere between a stenograph and a regular keyboard. It has a split-ish layout and is fun to play with, but it never became a daily driver. Some boards are interesting without being practical.

**Alienware.** This one entered the rotation for a specific reason: I needed the physical hardware to program the Alienware SDK RGB lighting for [Totally Reliable Delivery Service](https://totallyreliable.com/), a game I worked on. As a general-purpose keyboard it was reliable. It had a nice volume knob, it never failed, and it never made me think about it. That is a higher bar than most keyboards on this list cleared.

**Small Miryoku board from eBay.** If it is a Corne or Sweep variant, keep it as a travel backup. It shares the same layout philosophy as the Piantor Pro and fits in a jacket pocket. One warning about boards with fewer than 42 keys: they rely on home row mods, where tapping a key types a letter and holding it activates a modifier. Home row mods sound elegant in theory, but they introduce timing ambiguity that slows you down in practice. The firmware has to guess whether you meant to type "a" or start holding Cmd, and that guess is wrong often enough to break your flow. I recommend never going below 42 keys. The dedicated modifier columns on a 42-key board eliminate that ambiguity entirely.

## Where to Buy

If you want to skip the rotation and go straight to a split 42-key board:

- [Piantor Pro 42-key](https://shop.beekeeb.com/products/pre-soldered-piantor-split-keyboard) from beekeeb. Pre-soldered, Vial firmware, and hotswap Choc sockets.
- [Piantor Pro with Aluminum Case](https://shop.beekeeb.com/products/piantor-pro-with-aluminum-case) from beekeeb. Same board in an aluminum housing.

**Four I would still consider:**

- [Toucan](https://shop.beekeeb.com/products/toucan-wireless-piantor-wireless-split-keyboard-with-touchpad) from beekeeb. A wireless Piantor with a built-in touchpad and OLED screen. Same 42-key layout, same Choc sockets, but Bluetooth and QMK instead of Vial. The built-in touchpad eliminates the separate trackpad between the halves. The Mac touchpad between my Piantor halves is not a workaround, though. Apple's trackpad hardware is in a different class from the small integrated pads on keyboard PCBs: multi-finger gestures, palm rejection, and surface quality that no embedded trackpad matches yet. The tradeoff is real: wireless means no cable clutter, but QMK means rebuilding and reflashing firmware for every layout change instead of dragging keys in a GUI. Vial's live configuration is one of the Piantor Pro's best features. Whether wireless freedom is worth that friction depends on how often you change your keymap.

- [Dilemma V3](https://bastardkb.com/dilemma/) from Bastard Keyboards. A split board with an integrated trackpad, prebuilt with hotswap Choc sockets and QMK/VIA support. The MAX version adds more keys. I have not tried either. The integrated trackpad solves the extra-device problem, with the same caveat as the Toucan: embedded trackpads are not Mac trackpads.

- [Svalboard](https://svalboard.com/). Where CharaChorder tried to solve speed through chording (press all letters at once), Svalboard solves ergonomics through geometry: each finger rests in its own sculpted pocket and moves in four directions. The two boards solve different problems. CharaChorder optimizes for speed through simultaneous input. Svalboard optimizes for ergonomics through finger geometry. After going deep on steno and chording and learning that the speed bottleneck is thinking, not typing, the Svalboard's ergonomic thesis is more compelling than another speed play. It is also a massive learning curve. After twelve keyboards, this is the one I would try if the itch returns, and the one most likely to restart the whole cycle.

- [ASUS ROG Falcata](https://rog.asus.com/keyboards/keyboards/compact/rog-falcata/). The first prebuilt split keyboard with Hall effect magnetic switches. A 75% layout that joins into one piece or splits down the middle. Wireless at 8kHz polling with adjustable actuation from 0.1mm to 3.5mm per key. Hall effect switches use magnets over sensors instead of metal contact leaves. The key advantage is Rapid Trigger: the switch deactivates the instant you lift your finger and reactivates the instant you press back down, with adjustable actuation per key. In competitive shooters this translates to faster counter-strafing and more precise movement. The [Razer Huntsman V3 Pro TKL](https://www.razer.com/gaming-keyboards/razer-huntsman-v3-pro-tkl) is used by roughly 17% of CS2 professionals, and the [Wooting 80HE](https://wooting.io/wooting-80he) is the other dominant board in that space, but neither splits. This is the board that bridges the gap between ergonomic split and competitive gaming, and the first that does not force a choice between the two.

## Or Skip the Keyboard Entirely

The other endgame is voice. [Wispr Flow](https://wisprflow.ai/) is what I use for dictation: hold a hotkey, speak, release, and the text appears wherever the cursor is. It handles code terminology, punctuation, and context switching between prose and commands. Wispr is paid, but Apple Silicon MacBooks have enough local compute to run Whisper models for free.

[Open Wispr](https://github.com/human37/open-wispr) is the closest open source equivalent. It uses whisper.cpp with Metal GPU acceleration, installs via Homebrew, and runs as a background service with a Globe key hold-to-speak interface. It requires no cloud, no accounts, and no telemetry. The transcription quality is surprisingly close to the paid alternatives when running the large-v3 model locally.

Voice does not replace a keyboard for programming. It replaces the keyboard for everything that is not programming: Slack messages, PR descriptions, commit messages, documentation, and emails. The hours spent typing prose at a desk add up. A keyboard optimized for code and a voice layer optimized for natural language cover the full surface.

More on voice as an input layer in [Friction Economy: Unconscious Productivity Drains](/blog/friction-economy/).

## Or Just Use What You Have

There is a version of this article that is one sentence long: stick with whatever keyboard came with your computer.

The Alienware never let me down. It had a nice volume knob, it was reliable, and it did everything I asked of it for years. Reliable. I helped ship a game called [Totally Reliable Delivery Service](https://totallyreliable.com/) and yes, I mean the second word the whole time. The most reliable delivery system for my own typing was a keyboard that came in the box.

The Keychron K2 sounds like a hailstorm. Mechanical switches clacking away for eight hours is maddening when you are trying to think. The loudness that disappears during a gaming session becomes unbearable during a writing session. Every keystroke announces itself to the room.

If your laptop keyboard has a light touch, you already have most of what matters. The bell curve applies: the person who never thought about keyboards and the person who bought twelve of them arrive at the same conclusion. The laptop keyboard is fine. Everyone in the middle is buying the next one, convinced it will be the last.

You do not have to spend the money.

The endgame keyboard is the one where you stop thinking about keyboards and start thinking about the work.

---

## Appendix: Karabiner Basics (The Software Layer)

**Karabiner-Elements** remaps:
- Cmd+HJKL for arrow keys from home position (MacBook keyboard; the Piantor handles this in firmware)
- macOS System Settings swaps Caps Lock and Ctrl, putting Ctrl on the home row
- That Caps Lock position (now Ctrl) taps Escape, holds Ctrl (safety net for traveling without the Piantor)

**skhd + yabai** for window management:
- Alt+H/J/K/L to focus windows directionally
- Shift+Alt+H/J/K/L to swap windows
- Ctrl+Alt+H/J/K/L to resize windows
- Alt+F for fullscreen toggle
- Shift+Alt+1-6 to move windows between spaces

**Hyper** for app launching (Ctrl+Shift+Alt+Cmd, held on Piantor right thumb):
- Hyper+Q Chrome, Hyper+W WezTerm, Hyper+E Zen Browser, and Hyper+S Slack

**Homerow for click and scroll:**
- Hyper+J: click overlay. Letter labels appear over every clickable element. Type one or two letters to click.
- Hyper+K: scroll mode. Select any scrollable area by letter label.

These tools are all free and all open source. They handle the software side of what the Piantor does in firmware: home row arrows, window management, and app launching. What they cannot replicate is the physical side: split angle, columnar layout, 20g switches, and thumb clusters. Start with the software. The hardware is worth it if you spend eight hours a day at a desk.
