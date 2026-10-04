#!/usr/bin/env python3
"""Add photos to the gallery.

    python3 tools/add-photos.py PHOTO_OR_FOLDER [...] [--alt "Description"] [--front]
    python3 tools/add-photos.py --list
    python3 tools/add-photos.py --remove NAME

Each photo is resized to 1400px on its long edge, saved as JPEG and WebP in
assets/img/gallery/, and added to assets/js/gallery.js with its pixel size.
HEIC, AVIF, JPEG, PNG and WebP all work. Orientation from the camera is kept.

--alt     describes the photo for screen readers and the lightbox. If you add
          several at once, each gets the same text; edit gallery.js afterwards
          to make them specific. Without it a generic description is used.
--front   put the new photos at the start of the gallery instead of the end.

Needs macOS `sips` (built in) for HEIC/AVIF. WebP copies use `cwebp` if
installed, otherwise Pillow; if neither is available the JPEG alone is used.
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "assets", "js", "gallery.js")
OUT  = os.path.join(ROOT, "assets", "img", "gallery")
EXTS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".avif", ".webp", ".tif", ".tiff"}
LONG_EDGE = 1400
DEFAULT_ALT = "Suvodeep and Sanchari"

def load():
    text = open(DATA, encoding="utf-8").read()
    m = re.search(r"window\.GALLERY\s*=\s*(\[.*\])\s*;", text, re.S)
    if not m:
        sys.exit("Could not find 'window.GALLERY = [...];' in %s" % DATA)
    try:
        return text, m, json.loads(m.group(1))
    except json.JSONDecodeError as e:
        sys.exit("gallery.js is not valid JSON (%s). Check quotes and commas near line %d." % (e.msg, e.lineno))

def save(text, m, items):
    body = "[\n" + ",\n".join("  " + json.dumps(i, ensure_ascii=False) for i in items) + "\n]"
    open(DATA, "w", encoding="utf-8").write(text[:m.start(1)] + body + text[m.end(1):])

def slug(path, taken):
    base = re.sub(r"[^a-z0-9]+", "-", os.path.splitext(os.path.basename(path))[0].lower()).strip("-")[:40] or "photo"
    # camera and phone exports are IDs like 2E77E6E5-473D-... or IMG_4821 — name those plainly
    if re.fullmatch(r"[0-9a-f-]{12,}", base) or re.fullmatch(r"(img|dsc|pxl|photo|image)-?\d+.*", base):
        base = "photo"
    name, n = base, 2
    while name in taken or os.path.exists(os.path.join(OUT, name + ".jpg")):
        name, n = "%s-%d" % (base, n), n + 1
    return name

def to_jpeg(src, dst):
    """sips handles HEIC/AVIF and applies the camera's rotation; Pillow is the fallback."""
    if shutil.which("sips"):
        r = subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82",
                            "--resampleHeightWidthMax", str(LONG_EDGE), src, "--out", dst],
                           capture_output=True, text=True)
        if r.returncode == 0 and os.path.exists(dst):
            return
    try:
        from PIL import Image, ImageOps
    except ImportError:
        sys.exit("Need macOS 'sips' or Pillow (pip install pillow) to convert %s" % src)
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    im.thumbnail((LONG_EDGE, LONG_EDGE))
    im.save(dst, quality=82, optimize=True, progressive=True)

def to_webp(jpg, dst):
    if shutil.which("cwebp"):
        if subprocess.run(["cwebp", "-q", "80", jpg, "-o", dst], capture_output=True).returncode == 0:
            return True
    try:
        from PIL import Image
        Image.open(jpg).save(dst, "WEBP", quality=80)
        return True
    except Exception:
        return False

def size(jpg):
    try:
        from PIL import Image
        return Image.open(jpg).size
    except ImportError:
        out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", jpg], capture_output=True, text=True).stdout
        w = int(re.search(r"pixelWidth: (\d+)", out).group(1)); h = int(re.search(r"pixelHeight: (\d+)", out).group(1))
        return w, h

def gather(paths):
    files = []
    for p in paths:
        p = os.path.expanduser(p)
        if os.path.isdir(p):
            files += sorted(os.path.join(p, f) for f in os.listdir(p)
                            if os.path.splitext(f)[1].lower() in EXTS and not f.startswith("."))
        elif os.path.isfile(p) and os.path.splitext(p)[1].lower() in EXTS:
            files.append(p)
        else:
            print("  skipped (not a photo): %s" % p)
    return files

def main():
    ap = argparse.ArgumentParser(description="Add photos to the wedding gallery.")
    ap.add_argument("paths", nargs="*", help="photo files or folders")
    ap.add_argument("--alt", help="description for the photo(s)")
    ap.add_argument("--front", action="store_true", help="add at the start instead of the end")
    ap.add_argument("--list", action="store_true", help="show the current gallery")
    ap.add_argument("--remove", metavar="NAME", help="remove a photo by name (see --list)")
    a = ap.parse_args()

    text, m, items = load()

    if a.list:
        for n, it in enumerate(items, 1):
            print("%2d. %-28s %4dx%-4d %s" % (n, os.path.basename(it["src"]), it["w"], it["h"], it.get("alt", "")))
        return
    if a.remove:
        keep = [i for i in items if os.path.basename(i["src"]) != a.remove]
        if len(keep) == len(items):
            sys.exit("No photo named %r. Run with --list to see names." % a.remove)
        for ext in (".jpg", ".webp"):
            f = os.path.join(OUT, a.remove + ext)
            if os.path.exists(f): os.remove(f)
        save(text, m, keep); print("Removed %s. %d photos left." % (a.remove, len(keep)))
        return
    if not a.paths:
        ap.print_help(); return

    os.makedirs(OUT, exist_ok=True)
    taken = {os.path.basename(i["src"]) for i in items}
    added = []
    for src in gather(a.paths):
        name = slug(src, taken); taken.add(name)
        jpg = os.path.join(OUT, name + ".jpg")
        to_jpeg(src, jpg)
        has_webp = to_webp(jpg, os.path.join(OUT, name + ".webp"))
        w, h = size(jpg)
        added.append({"src": "assets/img/gallery/" + name, "w": w, "h": h, "webp": has_webp,
                      "alt": a.alt or DEFAULT_ALT})
        print("  added %-28s %4dx%-4d %s" % (name, w, h, "jpg+webp" if has_webp else "jpg"))

    if not added:
        sys.exit("No photos added.")
    items = added + items if a.front else items + added
    save(text, m, items)
    print("\n%d added, %d in the gallery now." % (len(added), len(items)))
    if not a.alt:
        print("Tip: give each a description in assets/js/gallery.js (the \"alt\" field) —"
              " screen readers and the lightbox use it.")

if __name__ == "__main__":
    main()
