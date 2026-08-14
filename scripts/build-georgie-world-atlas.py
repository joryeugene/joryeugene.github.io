"""Build Georgie's controllable seven-row sprite atlas.

The first six approved rows contain directional locomotion and the bone wag.
The final approved row contains five grounded still poses. Both inputs have
already passed chroma-spill cleanup, so this build only packages pixels. It
also verifies the dimensions that the CSS motion controller depends on.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CELL_WIDTH = 192
CELL_HEIGHT = 208
FRAME_COUNT = 8

LOCOMOTION_ROWS = ROOT / "design/georgie-world/georgie-world-locomotion-clean.png"
STILL_ROW = ROOT / "design/georgie-world/georgie-world-stills-clean.png"
PNG_OUTPUT = ROOT / "assets/georgie/georgie-world-atlas.png"
WEBP_OUTPUT = ROOT / "assets/georgie/georgie-world-atlas.webp"
REPORT = ROOT / "design/georgie-world/georgie-world-atlas-build.json"
CHROMA_REPORT = ROOT / "design/georgie-world/georgie-world-chroma-report.json"


def require_size(image: Image.Image, expected: tuple[int, int], label: str) -> None:
    if image.size != expected:
        raise RuntimeError(f"Expected {label} {expected}, found {image.size}")


def visible_green_pixels(image: Image.Image) -> int:
    return sum(
        1
        for red, green, blue, alpha in image.get_flattened_data()
        if alpha > 16 and green > 120 and green > red * 1.45 and green > blue * 1.2
    )


def main() -> None:
    row_width = CELL_WIDTH * FRAME_COUNT
    locomotion = Image.open(LOCOMOTION_ROWS).convert("RGBA")
    stills = Image.open(STILL_ROW).convert("RGBA")
    require_size(locomotion, (row_width, CELL_HEIGHT * 6), "six locomotion rows")
    require_size(stills, (row_width, CELL_HEIGHT), "grounded still row")

    atlas = Image.new("RGBA", (row_width, CELL_HEIGHT * 7), (0, 0, 0, 0))
    atlas.alpha_composite(locomotion, (0, 0))
    atlas.alpha_composite(stills, (0, CELL_HEIGHT * 6))

    PNG_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(PNG_OUTPUT)
    atlas.save(WEBP_OUTPUT, format="WEBP", lossless=True, quality=100, method=6, exact=True)

    green_pixels = visible_green_pixels(atlas)
    if green_pixels:
        raise RuntimeError(f"Refusing atlas with {green_pixels} visible green chroma pixels")

    REPORT.write_text(
        json.dumps(
            {
                "inputs": [
                    str(LOCOMOTION_ROWS.relative_to(ROOT)).replace("\\", "/"),
                    str(STILL_ROW.relative_to(ROOT)).replace("\\", "/"),
                ],
                "outputs": [
                    str(PNG_OUTPUT.relative_to(ROOT)).replace("\\", "/"),
                    str(WEBP_OUTPUT.relative_to(ROOT)).replace("\\", "/"),
                ],
                "atlasSize": list(atlas.size),
                "cellSize": [CELL_WIDTH, CELL_HEIGHT],
                "rows": {
                    "right": 0,
                    "frontRight": 1,
                    "front": 2,
                    "rearRight": 3,
                    "rear": 4,
                    "boneWag": 5,
                    "groundedStills": 6,
                },
                "stillFrames": ["right", "front-right", "front", "rear-right", "rear"],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    CHROMA_REPORT.write_text(
        json.dumps(
            {
                "ok": True,
                "asset": str(PNG_OUTPUT.relative_to(ROOT)).replace("\\", "/"),
                "visibleGreenPixels": green_pixels,
                "alphaThreshold": 16,
                "greenThreshold": 120,
                "detector": "green > red * 1.45 and green > blue * 1.2",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
