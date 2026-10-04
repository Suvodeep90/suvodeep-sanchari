/* =====================================================================
   GALLERY PHOTOS — shown in this order, then balanced into columns.

   Easiest way to add photos (resizes, converts HEIC/AVIF, writes the line):
       python3 tools/add-photos.py ~/path/to/photo.jpg --alt "What's in it"
       python3 tools/add-photos.py ~/path/to/a/folder

   By hand: put name.jpg (and optionally name.webp) in assets/img/gallery/,
   then add a line below. w and h are the image's pixel size. To remove a
   photo, delete its line. Keep it valid JSON: double quotes, commas
   between entries, no comma after the last one.
   ===================================================================== */
window.GALLERY = [
  {"src": "assets/img/gallery/us-overlook", "w": 1200, "h": 901, "webp": true, "alt": "Suvodeep and Sanchari laughing together on a rock overlook above autumn mountains"},
  {"src": "assets/img/gallery/us-field", "w": 900, "h": 1200, "webp": true, "alt": "Suvodeep and Sanchari standing in a winter field with mountains and low cloud behind them"},
  {"src": "assets/img/gallery/us-hands", "w": 1049, "h": 1400, "webp": true, "alt": "Suvodeep and Sanchari holding hands in a winter field"},
  {"src": "assets/img/gallery/us-cafe", "w": 1400, "h": 1050, "webp": true, "alt": "A sunny outdoor selfie of Suvodeep and Sanchari at a busy café"},
  {"src": "assets/img/gallery/us-traditional", "w": 1200, "h": 901, "webp": true, "alt": "Suvodeep in a kurta and Sanchari in a yellow saree, under autumn trees"},
  {"src": "assets/img/gallery/us-home", "w": 1050, "h": 1400, "webp": true, "alt": "A close indoor selfie of Suvodeep, in an apron, and Sanchari"}
];
