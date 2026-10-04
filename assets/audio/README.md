# Background music

Drop a single file here named **`ambient.mp3`** and the music button
appears in the bottom-right corner of the site. No code change needed.

If the file isn't here, the button hides itself — the site is perfectly
happy without it.

### Choosing a track

- **Keep it short and loopable.** It loops forever; 60–120 seconds is plenty.
- **Keep it small.** Aim for under 2 MB so guests on mobile data aren't punished.
  A 96 kbps mono MP3 is fine for ambient music.
- **It never autoplays.** Browsers block that, and guests opening your site in a
  quiet office will thank you. The button starts muted; they choose to press it.

### Licensing — please read

Do not drop in a commercial recording. A public GitHub Pages site is public
distribution, and that's a copyright problem waiting to happen. Safe sources
for royalty-free acoustic or orchestral music that suits this theme:

- [Pixabay Music](https://pixabay.com/music/) — free, no attribution required
- [Free Music Archive](https://freemusicarchive.org/) — check each licence
- [Incompetech](https://incompetech.com/) — attribution required

### Converting a file

```bash
# any audio file -> small, web-friendly mp3
ffmpeg -i source.wav -ac 1 -b:a 96k ambient.mp3
```
