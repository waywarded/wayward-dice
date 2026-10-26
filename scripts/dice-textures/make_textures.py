"""
Builds the Vaesen and Dragonbane dice textures from the shared UV atlas.

Every dice style uses one 2048×2048 atlas for all die shapes (see any
src/materials/*/albedo.jpg). The Iron set's albedo is plain grey with black
numerals, so it gives a clean mask of every number; this script paints new
colours under it and replaces a few faces:

- Vaesen: bone dice; the d6 shows ringed pips, with a swirl for the 6.
- Dragonbane: translucent green with white numbers; the d20's 1 is the Dragon
  and its 20 the Demon (symbols from dragon.png / demon.png here).

Run from the repo root: python3 scripts/dice-textures/make_textures.py
Needs Pillow and numpy.
"""

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
MATERIALS = ROOT / "src" / "materials"
SIZE = 2048

# Face centres in the atlas (pixels), measured from the Iron numerals
D6_FACES = {1: (147, 372), 2: (379, 854), 3: (380, 141), 4: (380, 618), 5: (381, 383), 6: (627, 379)}
D6_ERASE = 105  # half-size of the square cleared around a d6 numeral
D20_FACES = {1: (459, 1750), 20: (1039, 1688)}
D20_ERASE = 52  # radius cleared around a d20 numeral
# Rotation (degrees, counter-clockwise in the image) of the d20's 1 and 20 numerals,
# so a symbol stands the same way up on the die; checked with dev/face-viewer.html
D20_ROTATION = {1: -8, 20: 180}


def numeral_ink() -> np.ndarray:
    """Every number on every die, as 0..1 coverage (anti-aliased)"""
    iron = np.asarray(Image.open(MATERIALS / "iron" / "albedo.jpg").convert("L")).astype(float)
    return np.clip((150 - iron) / 110, 0, 1)


def clear_circle(ink: np.ndarray, centre, radius):
    yy, xx = np.ogrid[:SIZE, :SIZE]
    ink[(xx - centre[0]) ** 2 + (yy - centre[1]) ** 2 <= radius**2] = 0


def clear_square(ink: np.ndarray, centre, half):
    x, y = centre
    ink[y - half : y + half, x - half : x + half] = 0


def stamp(ink: np.ndarray, glyph: np.ndarray, centre):
    """Adds a glyph (0..1 array) centred at a point"""
    h, w = glyph.shape
    x0, y0 = centre[0] - w // 2, centre[1] - h // 2
    region = ink[y0 : y0 + h, x0 : x0 + w]
    np.maximum(region, glyph, out=region)


def supersampled(size: int, draw_fn, scale=4) -> np.ndarray:
    """Draws with ImageDraw at a higher resolution, then scales down for smooth edges"""
    big = Image.new("L", (size * scale, size * scale), 0)
    draw_fn(ImageDraw.Draw(big), size * scale)
    return np.asarray(big.resize((size, size), Image.LANCZOS)).astype(float) / 255


# --- Vaesen d6 faces ---------------------------------------------------------

PIP_OFFSETS = {
    1: [(0, 0)],
    2: [(-1, -1), (1, 1)],
    3: [(-1, -1), (0, 0), (1, 1)],
    4: [(-1, -1), (1, -1), (-1, 1), (1, 1)],
    5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)],
}


def pip_face(count: int, size=210) -> np.ndarray:
    """Ringed pips, as on Vaesen's bone dice"""

    def draw(d: ImageDraw.ImageDraw, s: int):
        # A lone pip is drawn larger, as on the real dice
        grow = 1.4 if count == 1 else 1
        spacing, ring, width, dot = s * 0.29, s * 0.14 * grow, s * 0.036 * grow, s * 0.06 * grow
        for ox, oy in PIP_OFFSETS[count]:
            cx, cy = s / 2 + ox * spacing, s / 2 + oy * spacing
            d.ellipse([cx - ring, cy - ring, cx + ring, cy + ring], outline=255, width=round(width))
            d.ellipse([cx - dot, cy - dot, cx + dot, cy + dot], fill=255)

    return supersampled(size, draw)


def swirl_face(size=210) -> np.ndarray:
    """A six-armed swirl with dots between the arms, for the 6 (our own drawing)"""

    def draw(d: ImageDraw.ImageDraw, s: int):
        c = s / 2
        width = round(s * 0.045)
        for arm in range(6):
            base = arm * math.pi / 3
            points = []
            # Out from the centre, bending, then curling back into a small spiral
            for i in range(60):
                t = i / 59
                r = s * (0.04 + 0.30 * t)
                a = base + 0.9 * t
                points.append((c + r * math.cos(a), c + r * math.sin(a)))
            end_r, end_a = s * 0.34, base + 0.9
            ex, ey = c + end_r * math.cos(end_a), c + end_r * math.sin(end_a)
            for i in range(40):
                t = i / 39
                r = s * 0.075 * (1 - 0.85 * t)
                a = end_a + math.pi / 2 + t * 1.8 * math.pi
                points.append((ex - s * 0.075 * math.cos(end_a + math.pi / 2) + r * math.cos(a),
                               ey - s * 0.075 * math.sin(end_a + math.pi / 2) + r * math.sin(a)))
            d.line(points, fill=255, width=width, joint="curve")
            # A dot between this arm and the next
            dot_a, dot_r, dot = base + math.pi / 6 + 0.55, s * 0.44, s * 0.03
            dx, dy = c + dot_r * math.cos(dot_a), c + dot_r * math.sin(dot_a)
            d.ellipse([dx - dot, dy - dot, dx + dot, dy + dot], fill=255)
        hub = s * 0.05
        d.ellipse([c - hub, c - hub, c + hub, c + hub], fill=255)

    return supersampled(size, draw)


# --- Dragonbane d20 symbols --------------------------------------------------


def dragon_glyph(size: int) -> np.ndarray:
    """The dragon is an outline; fill everything inside it"""
    src = Image.open(HERE / "dragon.png").convert("RGBA")
    line = np.asarray(src)[:, :, 3] > 0
    outside = np.zeros_like(line)
    # Flood fill the outside from the border, through pixels that aren't line
    stack = [(0, 0)]
    h, w = line.shape
    while stack:
        y, x = stack.pop()
        if 0 <= y < h and 0 <= x < w and not outside[y, x] and not line[y, x]:
            outside[y, x] = True
            stack.extend([(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)])
    filled = Image.fromarray(((~outside) * 255).astype(np.uint8))
    return fit(filled, size)


def demon_glyph(size: int) -> np.ndarray:
    """The demon face, with its dark eyes and mouth left out"""
    src = np.asarray(Image.open(HERE / "demon.png").convert("RGBA")).astype(int)
    r, g, b, a = src[:, :, 0], src[:, :, 1], src[:, :, 2], src[:, :, 3]
    face = (a > 0) & (g > 40)  # orange, not the dark red features
    return fit(Image.fromarray((face * 255).astype(np.uint8)), size)


def fit(mask: Image.Image, size: int) -> np.ndarray:
    """Crops to the shape, scales it into a size×size square, smooth edges"""
    bbox = mask.getbbox()
    mask = mask.crop(bbox)
    scale = size / max(mask.size)
    big = mask.resize((round(mask.width * scale * 4), round(mask.height * scale * 4)), Image.LANCZOS)
    big = big.filter(ImageFilter.GaussianBlur(3)).point(lambda v: 255 if v > 110 else 0)
    small = big.resize((round(mask.width * scale), round(mask.height * scale)), Image.LANCZOS)
    out = Image.new("L", (size, size), 0)
    out.paste(small, ((size - small.width) // 2, (size - small.height) // 2))
    return np.asarray(out).astype(float) / 255


def rotated(glyph: np.ndarray, degrees: float) -> np.ndarray:
    im = Image.fromarray((glyph * 255).astype(np.uint8))
    return np.asarray(im.rotate(degrees, resample=Image.BICUBIC)).astype(float) / 255


# --- Maps --------------------------------------------------------------------


def noise(scale: int, seed: int) -> np.ndarray:
    """Soft blotchy noise, 0..1"""
    rng = np.random.default_rng(seed)
    small = rng.random((SIZE // scale, SIZE // scale))
    im = Image.fromarray((small * 255).astype(np.uint8)).resize((SIZE, SIZE), Image.BICUBIC)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(scale / 2))).astype(float) / 255


def normal_map(ink: np.ndarray, depth: float, grain: np.ndarray | None = None) -> Image.Image:
    """Engraved markings: the ink is pressed in"""
    h = -np.asarray(Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(float) / 255
    if grain is not None:
        h = h + grain
    dx = np.zeros_like(h)
    dy = np.zeros_like(h)
    dx[:, 1:-1] = (h[:, 2:] - h[:, :-2]) * depth
    dy[1:-1, :] = (h[2:, :] - h[:-2, :]) * depth
    n = np.dstack([-dx, dy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8))


def save_jpg(im: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, quality=88)
    print("wrote", path.relative_to(ROOT))


def mix(base: np.ndarray, colour, amount: np.ndarray) -> np.ndarray:
    return base * (1 - amount[..., None]) + np.array(colour, dtype=float) * amount[..., None]


def vaesen():
    ink = numeral_ink()
    for value, centre in D6_FACES.items():
        clear_square(ink, centre, D6_ERASE)
        stamp(ink, swirl_face() if value == 6 else pip_face(value), centre)

    # Old bone: ivory with faint warm blotches and a few darker flecks
    blotch = noise(64, 1)
    fine = noise(8, 2)
    base = np.dstack([np.full((SIZE, SIZE), c, dtype=float) for c in (214, 194, 152)])
    base = mix(base, (190, 166, 122), blotch * 0.5)
    base = mix(base, (165, 140, 100), np.clip(fine - 0.7, 0, 1) * 1.2)
    albedo = mix(base, (38, 30, 24), ink)
    save_jpg(Image.fromarray(albedo.astype(np.uint8)), MATERIALS / "vaesen" / "albedo.jpg")

    save_jpg(normal_map(ink, depth=6, grain=fine * 0.15), MATERIALS / "vaesen" / "normal.jpg")

    # ORM: occlusion (full), roughness (satin bone, rougher in the pits), metalness (none)
    roughness = 150 + ink * 60 + blotch * 20
    orm = np.dstack([np.full((SIZE, SIZE), 255.0), roughness, np.zeros((SIZE, SIZE))])
    save_jpg(Image.fromarray(np.clip(orm, 0, 255).astype(np.uint8)), MATERIALS / "vaesen" / "orm.jpg")


def dragonbane():
    ink = numeral_ink()
    for value, centre in D20_FACES.items():
        clear_circle(ink, centre, D20_ERASE)
        glyph = dragon_glyph(132) if value == 1 else demon_glyph(118)
        stamp(ink, rotated(glyph, D20_ROTATION[value]), centre)

    swirl = noise(48, 3)
    base = np.dstack([np.full((SIZE, SIZE), c, dtype=float) for c in (22, 140, 62)])
    base = mix(base, (60, 190, 100), swirl * 0.35)
    albedo = mix(base, (245, 248, 240), ink)
    save_jpg(Image.fromarray(albedo.astype(np.uint8)), MATERIALS / "dragonbane" / "albedo.jpg")
    save_jpg(normal_map(ink, depth=5), MATERIALS / "dragonbane" / "normal.jpg")

    # Transmission mask, as Glass uses: the body lets light through, the numbers don't
    mask = 168 - ink * 140
    Image.fromarray(np.clip(mask, 0, 255).astype(np.uint8)).save(MATERIALS / "dragonbane" / "mask.png")
    print("wrote", (MATERIALS / "dragonbane" / "mask.png").relative_to(ROOT))


# --- Picker previews (300×300 PNGs) ------------------------------------------

PREVIEWS = ROOT / "src" / "previews"
DICE = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"]


def replace_centre(im: Image.Image, glyph: np.ndarray, box, colour, ink_colour, sample):
    """Paints over the front face's number and stamps a symbol there"""
    draw = ImageDraw.Draw(im)
    fill = im.getpixel(sample)
    draw.rectangle(box, fill=fill)
    g = Image.fromarray((glyph * 255).astype(np.uint8))
    tint = Image.new("RGBA", g.size, ink_colour + (255,))
    cx, cy = (box[0] + box[2]) // 2, (box[1] + box[3]) // 2
    im.paste(tint, (cx - g.width // 2, cy - g.height // 2), g)


def vaesen_previews():
    from PIL import ImageOps

    for die in DICE:
        src = Image.open(PREVIEWS / "iron" / f"{die}.png").convert("RGBA")
        alpha = src.getchannel("A")
        rgb = ImageOps.colorize(src.convert("L"), black=(34, 27, 22), white=(244, 234, 208), mid=(196, 180, 146))
        im = rgb.convert("RGBA")
        im.putalpha(alpha)
        if die == "d6":
            replace_centre(im, swirl_face(130), (88, 80, 212, 222), None, (38, 30, 24), (150, 75))
        im.save(PREVIEWS / "vaesen" / f"{die}.png")


def dragonbane_previews():
    for die in DICE:
        src = Image.open(PREVIEWS / "glass" / f"{die}.png").convert("RGBA")
        arr = np.asarray(src).astype(float)
        rgb, alpha = arr[:, :, :3], arr[:, :, 3:]
        # Glass is teal with white numbers: keep the lightness, move the hue to green
        light = rgb.mean(axis=2, keepdims=True) / 255
        white = np.clip((rgb.min(axis=2, keepdims=True) - 150) / 80, 0, 1)
        green = np.array([28, 150, 70]) * (0.45 + light) + 0
        out = green * (1 - white) + np.array([245, 248, 240]) * white
        im = Image.fromarray(np.dstack([np.clip(out, 0, 255), alpha]).astype(np.uint8), "RGBA")
        if die == "d20":
            replace_centre(im, demon_glyph(78), (108, 112, 192, 192), None, (245, 248, 240), (150, 102))
        im.save(PREVIEWS / "dragonbane" / f"{die}.png")


def previews():
    for name in ("vaesen", "dragonbane"):
        (PREVIEWS / name).mkdir(exist_ok=True)
        (PREVIEWS / name / "index.ts").write_text((PREVIEWS / "iron" / "index.ts").read_text())
    vaesen_previews()
    dragonbane_previews()
    print("wrote src/previews/vaesen, src/previews/dragonbane")


if __name__ == "__main__":
    vaesen()
    dragonbane()
    previews()
