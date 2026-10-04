"""Regenerate the Smoky Mountain ridges in index.html.

Each ridge is a fractal-sine profile turned into smooth beziers. The nearest
ridges also get a conifer treeline — the jagged spruce edge you see on the
close ridges at Newfound Gap.

Change a seed or a colour in LAYERS, re-run, and paste the output over the
matching block in index.html. The site has no build step and never runs this.

    python3 tools/generate-ridges.py
"""
import math, random

W, H, N = 1440, 500, 230

def profile(seed, base, amp, octaves, gain=.45, lac=2.3, sharpen=1.0):
    """A ridged multifractal under a slow envelope.

    Summed sines give rolling dunes. Folding each octave as (1 - |sin|)^2 puts
    a sharp crest where the wave crosses zero, and weighting each octave by the
    one above it keeps the fine detail near the crests. The envelope then swells
    and collapses the whole amplitude across the width, so each ridge gets one
    or two dominant massifs with long shoulders instead of a row of same-sized
    peaks.
    """
    rnd = random.Random(seed)
    oct_ = [((.88 * lac ** o) * rnd.uniform(.8, 1.26), rnd.uniform(0, math.tau),
             amp * gain ** o) for o in range(octaves)]
    env_f, env_p = rnd.uniform(.55, 1.05), rnd.uniform(0, math.tau)
    env_f2, env_p2 = rnd.uniform(1.4, 2.3), rnd.uniform(0, math.tau)
    pts = []
    for i in range(N + 1):
        t = i / N
        env = (.58
               + .30 * (.5 + .5 * math.sin(t * math.tau * env_f + env_p))
               + .12 * (.5 + .5 * math.sin(t * math.tau * env_f2 + env_p2)))
        y, w = 0.0, 1.0
        for f, ph, a in oct_:
            r = 1.0 - abs(math.sin(t * math.tau * f + ph))
            r *= r
            y += a * r * w
            w = max(0.0, min(1.0, r * 1.7))
        pts.append((t * W, base + amp * .46 - y * env * sharpen))
    return pts

def to_path(pts):
    """Straight segments: cheaper than beziers and keeps the peaks angular."""
    return ("M%.1f,%.1f" % pts[0] + "".join("L%.1f,%.1f" % p for p in pts[1:])
            + "L%d,%d L0,%d Z" % (W, H, H))

def conifer(x, ybase, w, h, lean):
    """One fir in silhouette: a narrow point over two skirted tiers.

    Drawn as its own subpath so neighbours overlap and merge into a canopy
    under the default nonzero fill rule — that union is what stops the
    treeline reading as a row of identical triangles.
    """
    return [
        (x - w,        ybase + 1.6),
        (x - w * .44,  ybase - h * .38),
        (x - w * .64,  ybase - h * .43),
        (x - w * .19,  ybase - h * .73),
        (x + lean,     ybase - h),
        (x + w * .19,  ybase - h * .73),
        (x + w * .64,  ybase - h * .43),
        (x + w * .44,  ybase - h * .38),
        (x + w,        ybase + 1.6),
    ]

def treeline(pts, seed, spacing, hmin, hmax):
    """Scatter firs along the ridge, overlapping, heights heavily skewed small
    so a handful of emergents break the line instead of a uniform comb."""
    rnd = random.Random(seed * 7 + 1)
    def y_at(x):
        i = min(int(x / W * (len(pts) - 1)), len(pts) - 2)
        p, q = pts[i], pts[i + 1]
        f = 0 if q[0] == p[0] else (x - p[0]) / (q[0] - p[0])
        return p[1] + (q[1] - p[1]) * f
    trees, x = [], -6.0
    while x < W + 6:
        w = spacing * rnd.uniform(.34, .72)
        h = hmin + (hmax - hmin) * (rnd.random() ** 2.1)
        trees.append(conifer(x, y_at(x), w, h, rnd.uniform(-.14, .14) * w))
        x += spacing * rnd.uniform(.38, 1.05)
    return trees

# far -> near. Colours sampled from a Smoky Mountain sunset: pale lavender haze
# in the distance down to near-black indigo in the foreground.
LAYERS = [
    # seed, base y, amplitude, octaves, fill, treeline(spacing, min h, max h)
    (11, 156,  56, 3, '#a3a9c6', None),
    (23, 202,  70, 4, '#9097b6', None),
    (37, 248,  84, 4, '#7a80a4', None),
    (41, 298,  98, 5, '#5f6690', None),
    (59, 350, 112, 5, '#454a71', (9.5, 5, 16)),
    (67, 402, 126, 6, '#2d3153', (11,  7, 23)),
    (83, 454, 140, 6, '#191c35', (13,  9, 30)),
]

defs, hero = [], []
for i, (seed, base, amp, octaves, fill, trees) in enumerate(LAYERS, start=1):
    pts = profile(seed, base, amp, octaves)
    d = to_path(pts)
    if trees:
        for t in treeline(pts, seed, *trees):
            pt = [(round(a), round(b)) for a, b in t]
            d += "M%d %d" % pt[0]
            px, py = pt[0]
            for qx, qy in pt[1:]:
                d += "l%d %d" % (qx - px, qy - py)
                px, py = qx, qy
            d += "Z"
    defs.append('    <path id="r%d" d="%s"/>' % (i, d))
    hero.append('      <svg class="ridge" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMax slice">'
                '<use href="#r%d" fill="%s"/></svg>' % (W, H, i, fill))
    if i < len(LAYERS):
        top = (base + amp * .35) / H * 100
        hero.append('      <span class="haze" style="top:%.1f%%;--h:%.2f"></span>'
                    % (top, .52 - i * .045))

open('_defs.txt', 'w').write("\n".join(defs))
open('_hero.txt', 'w').write("\n".join(hero))
print("generated %d ridges (%d with treelines)" % (len(LAYERS), sum(1 for l in LAYERS if l[5])))
