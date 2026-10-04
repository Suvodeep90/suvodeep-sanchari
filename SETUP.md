# Setup

Three things to do, in this order. Budget about 30 minutes for all of it.

---

## 1. Put it on GitHub Pages

### Create the repo

```bash
cd /Users/suvodeepmajumder/Document/repos/wedding_website
git init -b main
git add -A
git commit -m "Wedding site"
```

Create an empty repository on github.com (no README, no .gitignore — this
folder already has them), then:

```bash
git remote add origin https://github.com/Suvodeep90/suvodeep-sanchari.git
git push -u origin main
```

### Turn Pages on

In the repo on github.com: **Settings → Pages → Build and deployment →
Source: Deploy from a branch**, then **Branch: `main`** and folder **`/ (root)`**,
and **Save**.

That's it. Every `git push` to `main` republishes the site in about a minute.
Your site is at:

```
https://suvodeep90.github.io/suvodeep-sanchari/
```

> **Tip:** if you name the repo `<your-username>.github.io`, the site lives at
> the shorter `https://<your-username>.github.io/` instead.

### A custom domain (optional)

Buy a domain, then in **Settings → Pages → Custom domain** enter it and tick
*Enforce HTTPS*. At your registrar, add these DNS records:

| Type  | Name  | Value |
|-------|-------|-------|
| A     | `@`   | `185.199.108.153` |
| A     | `@`   | `185.199.109.153` |
| A     | `@`   | `185.199.110.153` |
| A     | `@`   | `185.199.111.153` |
| CNAME | `www` | `<your-username>.github.io` |

GitHub commits a `CNAME` file to the repo for you. DNS can take a few hours.

Once you have the final URL, open `index.html` and make the `og:image` tag
absolute so WhatsApp and iMessage show the invitation in link previews:

```html
<meta property="og:image" content="https://your-domain.com/assets/img/invitation.jpg">
```

---

## 2. Wire up the RSVP

RSVPs land in a Google Sheet you own. Free, no account for guests, no limits.

**a. Create the sheet.** Go to [sheets.new](https://sheets.new) and name it
something like *Wedding RSVPs*.

**b. Open the script editor.** In that sheet: **Extensions → Apps Script**.

**c. Paste the code.** Delete whatever is in `Code.gs`, then paste the entire
contents of `rsvp-backend/Code.gs` from this repo. Save (⌘S).

**d. Optional — get emailed on every RSVP.** Near the top of the script, set:

```js
var NOTIFY_EMAIL = 'suvodeep.majumder90@gmail.com';
```

**e. Deploy it.** Click **Deploy → New deployment**. Press the gear icon next
to *Select type* and choose **Web app**. Then:

- **Execute as:** *Me*
- **Who has access:** **Anyone** ← this matters, and it does *not* make your
  sheet public. It only means guests can submit the form without a Google login.

Click **Deploy**. Google will ask you to authorise the script — click through
*Advanced → Go to (project name) → Allow*. The scary "unverified app" warning
is expected; it's your own script.

**f. Copy the Web app URL.** It ends in `/exec` and looks like:

```
https://script.google.com/macros/s/AKfycbx................../exec
```

**g. Paste it into the site.** Open `assets/js/config.js` and set:

```js
rsvpEndpoint: 'https://script.google.com/macros/s/AKfycbx................../exec',
```

**h. Test it.** Open the site, submit an RSVP with your own name, and confirm a
row appears in the sheet. You can delete the test row afterwards.

> **When you edit the script later**, you must click **Deploy → Manage
> deployments → ✏️ Edit → Version: New version → Deploy**. Just saving the file
> does *not* update the live endpoint. This trips up everyone once.

---

## 3. Fill in your details

Everything below is plain text — no code knowledge needed. Search the files for
`Edit me` and `todo` to find every spot that still needs you.

### `assets/js/config.js`
The countdown date, the RSVP endpoint, your contact email, the RSVP deadline,
and the music file. Start here.

### `index.html`
Marked with `<!-- EDIT ME -->` comments:

| Section | What to change |
|---|---|
| **Our Story** | A paragraph or two about how you met and the proposal |
| **Itinerary** | The dress code for Saturday's ceremony |
| **Travel & Stay** | Who has a room at the lodge, and where everyone else books |
| **Gallery** | Done — add more any time with `tools/add-photos.py` (see below) |
| **FAQ** | Plus-ones, children, dress code, registry, parking |

To replace a gallery placeholder, drop your photo in `assets/img/` and change
the whole `<div class="shot placeholder …">…</div>` block to:

```html
<figure class="shot fade-in d1">
  <img src="assets/img/your-photo.jpg" alt="A short description" loading="lazy">
</figure>
```

### Adding photos to the gallery

```bash
# one photo, with a description for screen readers and the lightbox
python3 tools/add-photos.py ~/Pictures/us-at-the-lake.heic --alt "Us at the lake"

# a whole folder at once (edit the descriptions in gallery.js afterwards)
python3 tools/add-photos.py ~/Pictures/new-ones

python3 tools/add-photos.py --list            # see what's in the gallery
python3 tools/add-photos.py --remove photo-3  # take one out (deletes its files too)
```

It resizes each photo, makes the WebP copy, keeps the camera's rotation, and
adds a line to `assets/js/gallery.js`. HEIC, AVIF, JPEG and PNG all work. Add
`--front` to put new photos first. Then `git add -A && git commit && git push`
and the live site updates in about a minute.

The order of lines in `gallery.js` is the order photos appear and the order
the lightbox steps through; the page balances them into level columns itself.

### `assets/audio/`
Optional background music — see the README in that folder, including a note on
licensing before you put a commercial recording on a public site.

---

## Previewing locally

```bash
cd /Users/suvodeepmajumder/Document/repos/wedding_website
python3 -m http.server 8777
```

Then open <http://localhost:8777>. Opening `index.html` directly as a `file://`
URL mostly works, but the fonts and RSVP will misbehave — use the server.
