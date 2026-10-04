"""Build the itinerary 'scroll story' markup: four landscape scenes over the
same ridge paths as the hero (#r1..#r7), each a different time of day.

    python3 tools/build-story.py   # prints the <section> to stdout
"""
import random

BASES = [156, 202, 248, 298, 350, 402, 454]
AMPS  = [56, 70, 84, 98, 112, 126, 140]

SCENES = [
  dict(key="dusk", hz="255,206,200",
       fills=["#a3a9c6","#9097b6","#7a80a4","#5f6690","#454a71","#2d3153","#191c35"]),
  dict(key="night", hz="120,132,210",
       fills=["#3b4272","#333a66","#2b3159","#23284b","#1c203e","#151832","#0c0f22"]),
  dict(key="morning", hz="255,255,255",
       fills=["#cdd7e6","#b7c4da","#9fb0cd","#8699bd","#6c80a8","#566a92","#3f5078"]),
  dict(key="dawn", hz="255,214,190",
       fills=["#aaa4c3","#948eb1","#7d779d","#666089","#4f4a73","#39345b","#242141"]),
]

import json

def landscape():
    """One landscape for the whole weekend. JS blends the four palettes and
    moves the camera; nothing here is ever swapped out."""
    out = ['      <div class="sky sky-%s"%s></div>' % (sc["key"], ' style="opacity:1"' if n == 0 else '')
           for n, sc in enumerate(SCENES)]
    rnd = random.Random(7)
    groups = []
    for g in range(3):
        dots = "".join('<circle cx="%d" cy="%d" r="%.1f"/>' % (rnd.uniform(0, 1440), rnd.uniform(0, 300) ** 1.08, rnd.uniform(.5, 1.5))
                       for _ in range(64))
        groups.append('<g class="tw tw%d">%s</g>' % (g + 1, dots))
    out.append('      <div class="night-only"><svg class="scene-stars" viewBox="0 0 1440 500" '
               'preserveAspectRatio="xMidYMid slice">%s</svg><span class="scene-moon"></span></div>' % "".join(groups))
    out.append('      <div class="scene-ridges">')
    first = SCENES[0]
    for i in range(1, 8):
        d = i * 0.16
        out.append('        <svg viewBox="0 0 1440 500" preserveAspectRatio="xMidYMax slice" data-d="%.2f">'
                   '<use class="ridge-fill" href="#r%d" fill="%s"/></svg>' % (d, i, first["fills"][i-1]))
        if i == 7:
            rl = random.Random(12)
            dots = "".join('<circle cx="%d" cy="%d" r="%.1f"/>' % (rl.uniform(560, 880), rl.uniform(438, 468), rl.uniform(1, 2.1))
                           for _ in range(46))
            out.append('        <svg class="scene-lights night-only" viewBox="0 0 1440 500" '
                       'preserveAspectRatio="xMidYMax slice" data-d="%.2f"><g class="tw tw2">%s</g></svg>' % (d, dots))
        if i < 7:
            top = (BASES[i-1] + AMPS[i-1] * .35) / 500 * 100
            out.append('        <span class="shaze" data-d="%.2f" style="top:%.1f%%;--h:%.2f"></span>' % (d, top, .52 - i * .045))
    out.append('      </div>')
    return "\n".join(out)

PALETTES = json.dumps([sc["fills"] for sc in SCENES]).replace('"', "&quot;")
HAZES = json.dumps([sc["hz"] for sc in SCENES]).replace('"', "&quot;")

DAYS = [
  ("11","Day one &middot; Dusk","Friday, December 11","Arrival &amp; Welcome Dinner","Check-in from 4:00 pm",
   "Settle into the lodge and explore the grounds, then join us for a casual welcome BBQ and drinks around the fire pit.", None, False),
  ("12","Day two &middot; Nightfall","Saturday, December 12","The Big Day","Afternoon into the night",
   "The main event, on the lodge&rsquo;s covered pavilion &mdash; followed straight away by cocktail hour, dinner, and dancing late into the night.", None, True),
  ("13","Day three &middot; Morning mist","Sunday, December 13","Mountain Adventures","All day &middot; come and go as you like",
   "A day out in the Smokies &mdash; no hiking, no schedule, just the mountains.",
   ["Newfound Gap","Cades Cove","Downtown Gatlinburg"], False),
  ("14","Day four &middot; First light","Monday, December 14","Farewell","Checkout 12:00 pm",
   "Coffee, long goodbyes, and the drive home.", None, False),
]

def journal(i, d):
    num, mood, date, title, when, text, stops, feature = d
    f = " feature" if feature else ""
    act = " is-active" if i == 1 else ""
    stops_html = ""
    if stops:
        stops_html = ('\n          <ol class="stops">' + "".join("<li>%s</li>" % s for s in stops) + "</ol>")
    return f"""        <article class="journal{f}{act}" data-scene="{i}">
          <div class="journal-head">
            <span class="journal-num" aria-hidden="true">{num}</span>
            <div>
              <p class="journal-mood">{mood}</p>
              <p class="journal-date">{date}</p>
            </div>
          </div>
          <h3>{title}</h3>
          <p class="journal-when">{when}</p>
          <p class="journal-text">{text}</p>{stops_html}
        </article>"""

rail = "\n".join(
  '        <button class="rail-btn%s" type="button" data-target="day-%s" aria-label="Show %s">'
  '<span class="rail-num">%s</span><span class="rail-day">%s</span></button>'
  % (" is-active" if i == 0 else "", d[0], d[2], d[0], d[2].split(",")[0][:3])
  for i, d in enumerate(DAYS))

steps = "\n".join('    <div class="story-step" id="day-%s" data-scene="%d"></div>' % (d[0], i)
                  for i, d in enumerate(DAYS, start=1))

html = f"""<!-- ============================ schedule ============================ -->
<!-- A pinned scroll story. The whole stage — heading, entry and landscape —
     holds still; the empty steps underneath it supply the scroll distance,
     and whichever step crosses the middle of the screen picks the day. -->
<section id="schedule" class="scroll-story">
  <div class="story-stage">
    <div class="scenes" aria-hidden="true" data-palettes="{PALETTES}" data-hazes="{HAZES}" style="--hz:{SCENES[0]['hz']}">
{landscape()}
      <div class="stage-shade"></div>
    </div>

    <div class="stage-content wrap">
      <div class="story-intro">
        <p class="eyebrow">December 11 &ndash; 14, 2026</p>
        <h2 class="section-title">Weekend Itinerary</h2>
        <p class="lede">Four days in the mountains &mdash; keep scrolling, and the light changes with them.</p>
      </div>

      <nav class="story-rail" aria-label="Itinerary days">
{rail}
      </nav>

      <div class="journals">
{chr(10).join(journal(i, d) for i, d in enumerate(DAYS, start=1))}
      </div>
    </div>
  </div>

  <div class="story-steps" aria-hidden="true">
{steps}
  </div>
</section>

"""
print(html, end="")
