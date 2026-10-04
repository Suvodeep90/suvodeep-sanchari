/* =====================================================================
   Suvodeep & Sanchari — site behaviour
   Nothing here needs editing for normal use; change assets/js/config.js.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.WEDDING_CONFIG || {};
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------- config into page */
  var deadlineEl = $('#rsvpDeadline');
  if (deadlineEl && CFG.rsvpDeadline) deadlineEl.textContent = CFG.rsvpDeadline;

  var faqEmail = $('#faqEmail');
  if (faqEmail && CFG.contactEmail) {
    faqEmail.href = 'mailto:' + CFG.contactEmail;
    faqEmail.textContent = CFG.contactEmail;
  }

  /* ----------------------------------------------------------- nav */
  var nav = $('#nav');
  var navToggle = $('#navToggle');

  navToggle.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  $$('#navLinks a').forEach(function (a) {
    a.addEventListener('click', function () {
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });

  /* --------------------------------------- scroll: nav bg + parallax */
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;
    nav.classList.toggle('scrolled', y > 40);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ----------------------------------------------------- gallery grid */
  /* Built from window.GALLERY (assets/js/gallery.js). Photos go into
     whichever column is shortest, tallest photos placed first, so the
     columns finish level however many photos are added. Within a column
     they keep their list order. */
  var GALLERY = (window.GALLERY || []).filter(function (p) { return p && p.src && p.w && p.h; });
  (function galleryGrid() {
    var grid = $('#galleryGrid');
    if (!grid) return;
    if (!GALLERY.length) { grid.innerHTML = '<p class="center">Photos coming soon.</p>'; return; }

    function esc(t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function figure(p, i) {
      var alt = esc(p.alt || 'Suvodeep and Sanchari');
      return '<figure class="photo"><button class="photo-btn" type="button" data-i="' + i + '" aria-label="Open photo: ' + alt + '">' +
             '<picture>' + (p.webp ? '<source srcset="' + esc(p.src) + '.webp" type="image/webp">' : '') +
             '<img src="' + esc(p.src) + '.jpg" alt="' + alt + '" width="' + p.w + '" height="' + p.h + '" loading="lazy">' +
             '</picture></button></figure>';
    }

    var cols = 0;
    function build() {
      var n = window.innerWidth <= 600 ? 1 : 3;
      if (n === cols) return;
      cols = n;
      var height = [], members = [];
      for (var c = 0; c < n; c++) { height.push(0); members.push([]); }
      GALLERY.map(function (p, i) { return { i: i, r: p.h / p.w }; })
        .sort(function (a, b) { return b.r - a.r || a.i - b.i; })
        .forEach(function (it) {
          var c = height.indexOf(Math.min.apply(null, height));
          height[c] += it.r; members[c].push(it.i);
        });
      if (n > 1) refine(members);
      /* columns read left to right by their earliest photo, so the first
         line in gallery.js always lands top-left */
      members.forEach(function (list) { list.sort(function (a, b) { return a - b; }); });
      members.sort(function (a, b) { return (a[0] === undefined ? 1e9 : a[0]) - (b[0] === undefined ? 1e9 : b[0]); });
      grid.innerHTML = members.map(function (list) {
        return '<div class="masonry-col">' + list.sort(function (a, b) { return a - b; })
          .map(function (i) { return figure(GALLERY[i], i); }).join('') + '</div>';
      }).join('');
      level(members);
    }

    function ratio(i) { return GALLERY[i].h / GALLERY[i].w; }
    function total(list) { return list.reduce(function (s, i) { return s + ratio(i); }, 0); }

    /* Greedy placement can strand a column. Keep moving or swapping photos
       between the tallest and shortest columns while it narrows the gap. */
    function refine(members) {
      for (var round = 0; round < 60; round++) {
        var t = members.map(total);
        var hi = t.indexOf(Math.max.apply(null, t)), lo = t.indexOf(Math.min.apply(null, t));
        var spread = t[hi] - t[lo], best = null;
        members[hi].forEach(function (a, ai) {
          var gain = spread - Math.abs((t[hi] - ratio(a)) - (t[lo] + ratio(a)));
          if (gain > 1e-6 && (!best || gain > best.gain)) best = { gain: gain, ai: ai, bi: -1 };
          members[lo].forEach(function (b, bi) {
            var d = ratio(a) - ratio(b);
            var g2 = spread - Math.abs((t[hi] - d) - (t[lo] + d));
            if (d > 0 && g2 > 1e-6 && (!best || g2 > best.gain)) best = { gain: g2, ai: ai, bi: bi };
          });
        });
        if (!best) break;
        var a = members[hi].splice(best.ai, 1)[0];
        if (best.bi >= 0) members[hi].push(members[lo].splice(best.bi, 1)[0]);
        members[lo].push(a);
      }
    }

    /* Placement gets the columns close; this closes the last gap by letting
       every photo in a shorter column grow a little taller (cropped with
       object-fit). Capped at 35% per photo so nothing is cut into a new
       shape — beyond that the columns are simply left a touch uneven. */
    function level(members) {
      if (members.length < 2) return;
      var colW = grid.querySelector('.masonry-col').getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(grid.querySelector('.masonry-col')).rowGap) || 0;
      var g = gap / colW;                                   /* the gap, in column-widths */
      var tall = members.map(function (list) {
        return total(list) + g * (list.length - 1);
      });
      var target = Math.max.apply(null, tall);
      members.forEach(function (list, c) {
        var extra = target - tall[c];
        if (extra < 0.005 || !list.length) return;
        var grow = extra / total(list);                     /* same share for every photo in the column */
        if (grow > 0.35) return;
        var imgs = grid.children[c].querySelectorAll('img');
        list.forEach(function (i, k) {
          imgs[k].style.aspectRatio = '1 / ' + (ratio(i) * (1 + grow)).toFixed(4);
          imgs[k].style.objectFit = 'cover';
        });
      });
    }
    build();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });
  })();

  /* ------------------------------------------------ reveal on scroll */
  var revealables = $$('.fade-in');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ------------------------------------------------------- scrollspy */
  var sections = $$('main section[id]');
  var navMap = {};
  $$('#navLinks a[href^="#"]').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = navMap[en.target.id];
        if (!link) return;
        if (en.isIntersecting) {
          Object.keys(navMap).forEach(function (k) { navMap[k].removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* -------------------------------------------------------- countdown */
  (function countdown() {
    var root = $('#cd');
    if (!root) return;
    var target = new Date(CFG.weddingDate || '2026-12-11T16:00:00').getTime();
    if (isNaN(target)) return;

    var cells = {
      days:  root.querySelector('[data-cd="days"]'),
      hours: root.querySelector('[data-cd="hours"]'),
      mins:  root.querySelector('[data-cd="mins"]'),
      secs:  root.querySelector('[data-cd="secs"]')
    };
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        root.innerHTML = '<p class="cd-done script">The day is here.</p>';
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      cells.days.textContent  = Math.floor(s / 86400);
      cells.hours.textContent = pad(Math.floor(s / 3600) % 24);
      cells.mins.textContent  = pad(Math.floor(s / 60) % 60);
      cells.secs.textContent  = pad(s % 60);
    }
    tick();
    var timer = setInterval(tick, 1000);
  })();

  /* ------------------------------------------- itinerary scroll story */
  (function scrollStory() {
    var story = $('.scroll-story');
    if (!story) return;
    var stage    = $('.scenes', story);
    var skies    = $$('.sky', story);
    var night    = $$('.night-only', story);
    var ridgeBox = $('.scene-ridges', story);
    var layers   = $$('.scene-ridges [data-d]', story);
    var fills    = $$('.ridge-fill', story);
    var journals = $$('.journal', story);
    var steps    = $$('.story-step', story);
    var rail     = $$('.rail-btn', story);
    var palettes = JSON.parse(stage.getAttribute('data-palettes'));
    var hazes    = JSON.parse(stage.getAttribute('data-hazes')).map(function (h) { return h.split(',').map(Number); });

    /* --- the card: discrete, one per day ---------------------------- */
    var current = '1';
    function show(n) {
      if (n === current) return;
      current = n;
      var idx = +n;
      journals.forEach(function (j) {
        var k = +j.dataset.scene;
        j.classList.toggle('is-active', k === idx);
        j.classList.toggle('is-past', k < idx);
      });
      rail.forEach(function (b, i) { b.classList.toggle('is-active', i + 1 === idx); });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) show(en.target.dataset.scene); });
      }, { rootMargin: '-50% 0px -50% 0px' });
      steps.forEach(function (st) { io.observe(st); });
    }
    rail.forEach(function (b) {
      b.addEventListener('click', function () {
        var t = document.getElementById(b.getAttribute('data-target'));
        if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset,
                                 behavior: reduced ? 'auto' : 'smooth' });
      });
    });

    /* --- the landscape: continuous, never swapped ---------------------
       "time" runs 0 → 3 across the story: 0 is Friday dusk, 1 Saturday
       night, 2 Sunday mist, 3 Monday dawn. It is read straight from the
       scroll position, then eased toward with a little inertia, so a
       mouse-wheel notch becomes a glide rather than a jump. */
    function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    var pal = palettes.map(function (p) { return p.map(hex); });
    function mix(a, b, f) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * f); }); }
    function smooth(f) { return f * f * (3 - 2 * f); }

    function targetTime() {
      var r = story.getBoundingClientRect();
      var s = -r.top / window.innerHeight;          /* screens scrolled into the story */
      return Math.max(0, Math.min(3, s - 0.5));     /* each day's hold is centred on a whole number */
    }

    function render(t) {
      var i = Math.min(2, Math.floor(t)), f = smooth(t - i);
      for (var k = 0; k < fills.length; k++) {
        var c = mix(pal[i][k], pal[i + 1][k], f);
        fills[k].setAttribute('fill', 'rgb(' + c.join(',') + ')');
      }
      stage.style.setProperty('--hz', mix(hazes[i], hazes[i + 1], f).join(','));
      skies.forEach(function (sk, n) { sk.style.opacity = Math.max(0, 1 - Math.abs(t - n)).toFixed(3); });
      var nightAmt = Math.max(0, 1 - Math.abs(t - 1) * 1.1).toFixed(3);
      night.forEach(function (el) { el.style.opacity = nightAmt; });

      if (reduced) return;
      /* the camera starts high and sinks into the valley: near ridges begin
         pushed down out of frame and rise into it as the weekend goes on */
      var p = t / 3;
      for (var j = 0; j < layers.length; j++) {
        var d = +layers[j].dataset.d;
        layers[j].style.transform = 'translate3d(0,' + ((1 - p) * d * 150).toFixed(1) + 'px,0)';
      }
      ridgeBox.style.transform = 'scale(' + (1 + p * 0.07).toFixed(4) + ')';
    }

    var shown = targetTime(), running = false;
    function frame() {
      var goal = targetTime();
      shown += (goal - shown) * 0.09;
      if (Math.abs(goal - shown) < 0.0008) shown = goal;
      render(shown);
      if (shown !== goal) requestAnimationFrame(frame); else running = false;
    }
    function kick() {
      if (reduced) { render(targetTime()); return; }
      if (!running) { running = true; requestAnimationFrame(frame); }
    }
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick, { passive: true });
    render(shown);
  })();

  /* ---------------------------------------------------- gallery lightbox */
  (function lightbox() {
    var box = $('.lightbox'), grid = $('#galleryGrid');
    if (!box || !grid || !GALLERY.length || typeof box.showModal !== 'function') return;
    var view = $('.lightbox-img', box), count = $('.lb-count', box);
    var at = 0, opener = null;
    var webp = (function () { try { return document.createElement('canvas').toDataURL('image/webp').indexOf('image/webp') === 5; } catch (e) { return false; } })();

    /* steps through the list order, not the column order */
    function go(i) {
      at = (i + GALLERY.length) % GALLERY.length;
      var p = GALLERY[at];
      view.src = p.src + (p.webp && webp ? '.webp' : '.jpg');
      view.alt = p.alt || 'Suvodeep and Sanchari';
      view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '';
      count.textContent = (at + 1) + ' / ' + GALLERY.length;
    }
    /* delegated, so it survives the grid being rebuilt on resize */
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.photo-btn');
      if (!btn) return;
      opener = btn; go(+btn.dataset.i); box.showModal();
    });
    $('.lb-prev', box).addEventListener('click', function () { go(at - 1); });
    $('.lb-next', box).addEventListener('click', function () { go(at + 1); });
    $('.lb-close', box).addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(at - 1);
      if (e.key === 'ArrowRight') go(at + 1);
    });
    box.addEventListener('close', function () { if (opener && document.contains(opener)) opener.focus(); });

    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go(at + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  })();

  /* ------------------------------------------------- copy the address */
  (function copyAddress() {
    var btn = $('.copy-addr'), note = $('.copy-done');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-address');
      function done(ok) {
        note.textContent = ok ? 'Copied' : 'Press and hold the address to copy';
        clearTimeout(btn._t); btn._t = setTimeout(function () { note.textContent = ''; }, 2400);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        /* file:// and older browsers have no async clipboard */
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done(ok);
      }
    });
  })();

  /* ------------------------------------------------- weather, per day */
  /* Each itinerary day gets its own strip. Until a forecast exists for the
     dates (Open-Meteo reaches 16 days ahead) it shows the ten-year typical
     conditions from weather.js, labelled as such; from then on it fetches
     the live forecast and caches it for three hours. */
  (function weather() {
    var W = window.WEATHER;
    var journals = $$('.journal');
    if (!W || !W.normals || !journals.length) return;
    var dates = Object.keys(W.normals).sort();
    /* a link out for guests who want AccuWeather's month view; the strip's
       own numbers stay on Open-Meteo (free, keyless, and it can be fetched) */
    var ACCU = 'https://www.accuweather.com/en/us/gatlinburg/37738/december-weather/335723?year=2026';
    var forecast = {}, unit = 'F';
    try { unit = localStorage.getItem('wx-unit') === 'C' ? 'C' : 'F'; } catch (e) {}

    var ICON = {
      sun:   '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      part:  '<path d="M8 3.6V2M3.6 8H2M4.3 4.3l1.1 1.1M12.4 4.3l-1.1 1.1"/><path d="M5.6 10.4A3.4 3.4 0 0 1 11 6.6"/><path d="M8 19h9.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.3A3 3 0 0 0 8 19z"/>',
      cloud: '<path d="M7 18h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 11.6 3.3 3.3 0 0 0 7 18z"/>',
      rain:  '<path d="M7 14h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 7.6 3.3 3.3 0 0 0 7 14z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
      snow:  '<path d="M7 14h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 7.6 3.3 3.3 0 0 0 7 14z"/><path d="M8 18h.01M12 20h.01M16 18h.01M10 21.5h.01M14 21.5h.01" stroke-width="2.4" stroke-linecap="round"/>',
      fog:   '<path d="M4 9h16M3 13h18M5 17h14"/>',
      storm: '<path d="M7 14h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 7.6 3.3 3.3 0 0 0 7 14z"/><path d="M12.5 15l-2 3.5h3l-2 3.5"/>'
    };
    function wmo(c) {
      if (c === 0) return ['sun', 'Clear'];
      if (c <= 2) return ['part', 'Partly cloudy'];
      if (c === 3) return ['cloud', 'Overcast'];
      if (c === 45 || c === 48) return ['fog', 'Fog'];
      if (c >= 71 && c <= 77 || c === 85 || c === 86) return ['snow', 'Snow'];
      if (c >= 95) return ['storm', 'Thunderstorms'];
      return ['rain', c >= 51 && c <= 57 ? 'Drizzle' : 'Rain'];
    }
    function t(c) { return Math.round(unit === 'F' ? c * 9 / 5 + 32 : c) + '°'; }
    function depth(mm, isSnow) {          /* snowfall arrives in cm, rain in mm */
      if (unit === 'F') { var inch = isSnow ? mm / 2.54 : mm / 25.4; return (inch < 0.1 ? '<0.1' : inch.toFixed(1)) + ' in'; }
      return isSnow ? mm.toFixed(1) + ' cm' : Math.round(mm) + ' mm';
    }
    function label(d) {
      var dt = new Date(d + 'T12:00:00');
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function strip(d) {
      var f = forecast[d], n = W.normals[d], icon, desc, meta, src;
      if (f) {
        var w = wmo(f.code); icon = w[0]; desc = w[1];
        var bits = [];
        if (f.snow >= 0.1) bits.push('Snow ' + depth(f.snow, true));
        else if (f.pop != null) bits.push((f.pop >= 10 ? 'Rain ' + f.pop + '%' : 'Dry'));
        if (!(f.snow >= 0.1) && f.rain >= 1) bits.push(depth(f.rain, false));
        meta = bits.join(' · ');
        src = 'Forecast &middot; updated ' + new Date(f.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        var hi = f.hi, lo = f.lo, fh = f.fhi, fl = f.flo;
      } else {
        icon = n.snowPct >= 30 ? 'snow' : n.wetPct >= 40 ? 'rain' : 'part';
        desc = 'Typical conditions';
        var wet = Math.round(n.wetPct / 10), sn = Math.round(n.snowPct / 10);
        meta = wet ? 'Rain or snow in ' + wet + ' of ' + n.years + ' years' + (sn ? ', snow in ' + sn : '') : 'Dry in all ' + n.years + ' years';
        src = 'Typical for ' + label(d) + ' &middot; ' + W.span;
        hi = n.hi; lo = n.lo; fh = n.feelsHi; fl = n.feelsLo;
      }
      var said = desc + '. High ' + t(hi) + ', low ' + t(lo) + ', feels like ' + t(fh) + ' to ' + t(fl) + '. ' + meta + '.';
      return '<div class="wx" role="group" aria-label="Weather for ' + label(d) + ': ' + said.replace(/°/g, ' degrees') + '">' +
        '<svg class="wx-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[icon] + '</svg>' +
        '<div class="wx-temps" aria-hidden="true"><span class="wx-hi">' + t(hi) + '</span><span class="wx-lo">' + t(lo) + '</span></div>' +
        '<div class="wx-meta" aria-hidden="true"><span>Feels ' + t(fh) + ' / ' + t(fl) + '</span><span>' + meta + '</span></div>' +
        '<div class="wx-unit" role="group" aria-label="Temperature unit">' +
          '<button type="button" data-u="F" aria-pressed="' + (unit === 'F') + '">°F</button>' +
          '<button type="button" data-u="C" aria-pressed="' + (unit === 'C') + '">°C</button></div>' +
        '<p class="wx-src">' + src + ' &middot; <a href="' + ACCU + '" target="_blank" rel="noopener">AccuWeather outlook&nbsp;&#8599;</a></p></div>';
    }

    function paint() {
      journals.forEach(function (j) {
        var d = dates[+j.dataset.scene - 1];
        if (!d) return;
        var old = j.querySelector('.wx');
        var holder = document.createElement('div'); holder.innerHTML = strip(d);
        if (old) old.replaceWith(holder.firstChild); else j.appendChild(holder.firstChild);
      });
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.wx-unit button');
      if (!b || b.dataset.u === unit) return;
      unit = b.dataset.u;
      try { localStorage.setItem('wx-unit', unit); } catch (er) {}
      paint();
    });
    paint();

    /* --- live forecast, once the dates are within reach --------------- */
    var DAY = 864e5, today = new Date(); today.setHours(0, 0, 0, 0);
    var first = new Date(dates[0] + 'T00:00:00'), last = new Date(dates[dates.length - 1] + 'T00:00:00');
    var reach = new Date(today.getTime() + 15 * DAY);                 /* stay a day inside the 16-day limit */
    if (first > reach || last < today) return;                        /* too early, or it's all over */
    var end = last < reach ? last : reach;
    function iso(dt) { return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2); }
    var start = first < today ? today : first;

    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('wx-forecast') || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.at < 3 * 36e5 && cached.end === iso(end)) { forecast = cached.days; paint(); return; }

    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + W.lat + '&longitude=' + W.lon +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,' +
      'precipitation_probability_max,precipitation_sum,snowfall_sum&timezone=America%2FNew_York' +
      '&start_date=' + iso(start) + '&end_date=' + iso(end);
    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      if (!data || data.error || !data.daily) return;                 /* keep showing typical conditions */
      var dd = data.daily, at = Date.now(), days = {};
      dd.time.forEach(function (d, k) {
        if (dd.temperature_2m_max[k] == null) return;
        days[d] = { code: dd.weather_code[k], hi: dd.temperature_2m_max[k], lo: dd.temperature_2m_min[k],
                    fhi: dd.apparent_temperature_max[k], flo: dd.apparent_temperature_min[k],
                    pop: dd.precipitation_probability_max[k], rain: dd.precipitation_sum[k] || 0,
                    snow: dd.snowfall_sum[k] || 0, at: at };
      });
      forecast = days; paint();
      try { localStorage.setItem('wx-forecast', JSON.stringify({ at: at, end: iso(end), days: days })); } catch (e) {}
    }).catch(function () { /* offline or blocked: typical conditions stay up */ });
  })();

  /* ------------------------------------------- particles: confetti & rain */
  /* One full-screen canvas, created on first use and torn down when idle.
     Physics are time-scaled, so 120Hz screens don't play it at double speed. */
  var FX = (function () {
    var cv = null, ctx = null, parts = [], raf = 0, last = 0, W = 0, H = 0;
    var emojiCache = {};

    function size() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function open() {
      if (cv) return;
      cv = document.createElement('canvas');
      cv.className = 'fx-canvas'; cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv);
      ctx = cv.getContext('2d'); size();
      window.addEventListener('resize', size);
    }
    function close() {
      cancelAnimationFrame(raf); raf = 0;
      window.removeEventListener('resize', size);
      if (cv) cv.remove(); cv = ctx = null;
    }
    /* emoji are drawn once to a small canvas, then stamped — far cheaper
       than fillText every frame */
    function emojiSprite(ch) {
      if (emojiCache[ch]) return emojiCache[ch];
      var c = document.createElement('canvas'), x = c.getContext('2d');
      c.width = c.height = 96;
      x.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(ch, 48, 54);
      return (emojiCache[ch] = c);
    }
    function shade(hex, k) {
      var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
      return 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')';
    }

    function draw(p) {
      var a = p.life > p.max * 0.72 ? 1 - (p.life - p.max * 0.72) / (p.max * 0.28) : 1;
      if (p.y > H + 60) a = 0;
      ctx.globalAlpha = Math.max(0, Math.min(1, a)) * (p.alpha || 1);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === 'emoji') {
        var s = p.size; ctx.drawImage(emojiSprite(p.ch), -s / 2, -s / 2, s, s);
      } else if (p.kind === 'paper') {
        /* a flat piece turning through 3D: squash on one axis, darker when
           its back face is towards us */
        var f = Math.cos(p.flip);
        ctx.scale(1, f);
        ctx.fillStyle = f < 0 ? p.back : p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.kind === 'dot') {
        ctx.scale(Math.abs(Math.cos(p.flip)) * 0.6 + 0.4, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'ribbon') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-p.len / 2, 0);
        for (var k = 1; k <= 6; k++) {
          var x = -p.len / 2 + p.len * k / 6;
          ctx.lineTo(x, Math.sin(p.flip + k * 1.1) * 4);
        }
        ctx.stroke();
      } else if (p.kind === 'glint') {
        var g = (Math.sin(p.flip * 2) + 1) / 2 * p.r + 1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -g * 2); ctx.lineTo(g * 0.45, 0); ctx.lineTo(0, g * 2); ctx.lineTo(-g * 0.45, 0);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-g * 2, 0); ctx.lineTo(0, g * 0.45); ctx.lineTo(g * 2, 0); ctx.lineTo(0, -g * 0.45);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    function frame(t) {
      var dt = last ? Math.min(3, (t - last) / 16.667) : 1; last = t;
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter(function (p) {
        if (p.delay > 0) { p.delay -= dt; return true; }
        p.life += dt;
        var drag = Math.pow(p.drag, dt);
        p.vx *= drag; p.vy = p.vy * drag + p.g * dt;
        if (p.sway) p.vx += Math.sin(p.life * p.swayRate + p.phase) * p.sway * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt; p.flip += p.fr * dt;
        draw(p);
        return p.life < p.max && p.y < H + 80;
      });
      ctx.globalAlpha = 1;
      if (parts.length) raf = requestAnimationFrame(frame);
      else { last = 0; close(); }
    }
    function run(newParts) {
      open();
      parts = parts.concat(newParts);
      if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }
    var R = function (a, b) { return a + Math.random() * (b - a); };
    var COLORS = ['#e3c88b', '#c5a365', '#f6e2a0', '#262c4e', '#4a5180', '#7a80a4', '#f2b5a7', '#e68a8a', '#fff3df'];

    /* confetti: two angled jets from the edges of the button + a central fountain */
    function confetti(rect) {
      var out = [], cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      function piece(x, y, angle, spread, speed, delay) {
        var a = (angle + R(-spread, spread)) * Math.PI / 180, v = R(speed * 0.55, speed);
        var c = COLORS[(Math.random() * COLORS.length) | 0];
        var roll = Math.random(), base = {
          x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.2, drag: 0.976,
          rot: R(0, 6.28), vr: R(-0.12, 0.12), flip: R(0, 6.28), fr: R(0.08, 0.22),
          life: 0, max: R(150, 230), delay: delay, color: c, sway: 0.035, swayRate: R(0.05, 0.11), phase: R(0, 6.28)
        };
        if (roll < 0.55) { base.kind = 'paper'; base.w = R(9, 15); base.h = R(5, 9); base.back = shade(c, 0.62); }
        else if (roll < 0.74) { base.kind = 'dot'; base.r = R(3, 4.8); }
        else if (roll < 0.9) { base.kind = 'ribbon'; base.len = R(18, 30); base.drag = 0.968; }
        else { base.kind = 'glint'; base.r = R(2.6, 4.2); base.color = Math.random() < 0.6 ? '#f6e2a0' : '#fff'; base.g = 0.11; }
        out.push(base);
      }
      for (var i = 0; i < 110; i++) piece(rect.left + 6, cy, -118, 20, 25, R(0, 5));
      for (var j = 0; j < 110; j++) piece(rect.right - 6, cy, -62, 20, 25, R(0, 5));
      for (var k = 0; k < 90; k++) piece(cx, rect.top, -90, 26, 22, R(4, 12));
      /* second wave: a soft shower from the top of the screen, so the whole
         page celebrates, not just the button */
      for (var m = 0; m < 140; m++) {
        piece(R(0, window.innerWidth), R(-60, -10), 90, 25, 3, R(14, 70));
        var q = out[out.length - 1]; q.vx = R(-1, 1); q.max = R(260, 340);
      }
      run(out);
    }

    /* sad rain: a few seconds of slow, swaying, turning emoji across the screen */
    function sadRain() {
      var out = [], set = ['😢', '😭', '🥺', '💔', '😢', '😞'];
      var n = Math.round(Math.min(90, Math.max(40, window.innerWidth / 16)));
      for (var i = 0; i < n; i++) {
        out.push({
          kind: 'emoji', ch: set[(Math.random() * set.length) | 0], size: R(28, 58),
          x: R(0, window.innerWidth), y: R(-260, -40), vx: R(-0.4, 0.4), vy: R(2.2, 3.8),
          g: 0.035, drag: 0.992, rot: R(-0.5, 0.5), vr: R(-0.02, 0.02), flip: 0, fr: 0,
          sway: 0.05, swayRate: R(0.03, 0.06), phase: R(0, 6.28),
          life: 0, max: 420, delay: R(0, 55), alpha: 0.95
        });
      }
      run(out);
    }
    return { confetti: confetti, sadRain: sadRain };
  })();

  /* ------------------------------------- RSVP: the shy "decline" button */
  (function rsvpFun() {
    var accept = $('input[name="attending"][value="Joyfully accepts"]');
    var decline = $('input[name="attending"][value="Regretfully declines"]');
    if (!accept || !decline) return;
    var acceptBox = accept.closest('.choice'), box = decline.closest('.choice');
    var label = box.querySelector('span'), card = $('.rsvp-card'), note = $('#shyNote');
    var original = label.textContent;
    var LINES = ['Are you sure? 🥺', 'Really?? 😟', 'Please reconsider 😭'];
    var SAID  = ['The decline button moved. Are you sure?', 'It moved again. Really?', 'Please reconsider.'];
    /* finishing: the third try is playing out — swallow clicks until we select it ourselves */
    var tries = 0, done = false, finishing = false, tx = 0, ty = 0, homeTimer = 0, recentPointer = 0, lastPt = null;
    box.classList.add('is-shy');

    function place(x, y, tilt) {
      tx = x; ty = y;
      box.style.transform = (x || y) ? 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px) rotate(' + tilt.toFixed(1) + 'deg)' : '';
      box.classList.toggle('is-away', !!(x || y));
    }
    function home() { clearTimeout(homeTimer); place(0, 0, 0); }

    /* pick a spot inside the card, as far from the pointer as possible,
       clear of the accept button, and a real jump from where it is now */
    function dodge(pt) {
      var c = card.getBoundingClientRect(), r = box.getBoundingClientRect();
      var hx = r.left - tx, hy = r.top - ty, w = r.width, h = r.height;
      var a = acceptBox.getBoundingClientRect(), pad = 14;
      var minX = c.left + pad, maxX = c.right - pad - w;
      var minY = Math.max(c.top + pad, hy - 190, 84), maxY = Math.min(c.bottom - pad - h, hy + 190, window.innerHeight - h - 12);
      var px = pt ? pt.x : r.left + w / 2, py = pt ? pt.y : r.top + h / 2;
      var best = null;
      for (var i = 0; i < 40; i++) {
        var x = minX + Math.random() * Math.max(0, maxX - minX), y = minY + Math.random() * Math.max(0, maxY - minY);
        var cx = x + w / 2, cy = y + h / 2;
        var score = Math.hypot(cx - px, cy - py);
        var overlapA = !(x + w < a.left - 8 || x > a.right + 8 || y + h < a.top - 8 || y > a.bottom + 8);
        if (overlapA) score -= 2000;
        if (Math.hypot(x - r.left, y - r.top) < 120) score -= 600;
        if (!best || score > best.s) best = { s: score, x: x, y: y };
      }
      place(best.x - hx, best.y - hy, (Math.random() - 0.5) * 8);
      clearTimeout(homeTimer);
      /* if they give up, drift back rather than squatting on another field */
      homeTimer = setTimeout(function () { if (!done && !finishing) home(); }, 2400);
    }

    function attempt(pt) {
      tries++;
      label.textContent = LINES[Math.min(tries, 3) - 1];
      note.textContent = SAID[Math.min(tries, 3) - 1];
      if (!reduced) dodge(pt);
      if (tries < 3) return;

      finishing = true;
      box.classList.remove('is-shy');
      setTimeout(function () {
        if (!reduced) { FX.sadRain(); card.classList.add('is-sad'); }
        setTimeout(function () {
          home();
          label.textContent = original;
          finishing = false; done = true;
          decline.checked = true;
          decline.dispatchEvent(new Event('change', { bubbles: true }));
          note.textContent = 'Regretfully declines is selected. We will miss you.';
        }, reduced ? 0 : 900);
        setTimeout(function () { card.classList.remove('is-sad'); }, 3600);
      }, reduced ? 0 : 450);
    }

    /* mouse and touch: dodge the moment the press begins */
    box.addEventListener('pointerdown', function (e) {
      if (done) return;
      e.preventDefault();
      if (finishing) return;
      lastPt = { x: e.clientX, y: e.clientY };
      recentPointer = Date.now();
      attempt(lastPt);
    });
    /* keyboard (Space, arrow keys) and anything else that would select it */
    decline.addEventListener('click', function (e) {
      if (done) return;
      e.preventDefault();
      if (finishing || Date.now() - recentPointer < 600) return;    /* playing out, or already handled on pointerdown */
      attempt(null);
    });

    /* confetti for a yes, every time it's pressed (but not in a flurry) */
    var lastBurst = 0;
    accept.addEventListener('click', function () {
      if (tx || ty) home();
      acceptBox.classList.remove('pop'); void acceptBox.offsetWidth; acceptBox.classList.add('pop');
      if (reduced || Date.now() - lastBurst < 700) return;
      lastBurst = Date.now();
      FX.confetti(acceptBox.getBoundingClientRect());
    });
  })();

  /* ------------------------------------------------------ music toggle */
  (function music() {
    var btn = $('#musicBtn');
    if (!btn || !CFG.audioSrc) return;

    var audio = new Audio(CFG.audioSrc);
    audio.loop = true;
    audio.volume = typeof CFG.audioVolume === 'number' ? CFG.audioVolume : 0.35;

    /* Only show the button once we know the file actually exists. */
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', function () { btn.hidden = false; });
    audio.addEventListener('error', function () { btn.hidden = true; });

    btn.addEventListener('click', function () {
      if (audio.paused) {
        audio.play().then(function () {
          btn.classList.add('playing');
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('aria-label', 'Pause background music');
        }).catch(function () { /* browser refused; leave it alone */ });
      } else {
        audio.pause();
        btn.classList.remove('playing');
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Play background music');
      }
    });
  })();

  /* -------------------------------------------------------------- RSVP */
  (function rsvp() {
    var form = $('#rsvpForm');
    if (!form) return;

    var msg     = $('#formMsg');
    var thanks  = $('#rsvpThanks');
    var submit  = $('#rsvpSubmit');
    var details = $('#ifAttending');

    /* Collapse the guest details when someone declines. */
    $$('input[name="attending"]', form).forEach(function (r) {
      r.addEventListener('change', function () {
        var coming = r.value.indexOf('Joyfully') === 0 && r.checked;
        details.hidden = !coming;
      });
    });

    function show(text, isError) {
      msg.innerHTML = text;
      msg.classList.toggle('error', !!isError);
      msg.hidden = false;
    }

    function mailtoFallback() {
      if (!CFG.contactEmail) return '';
      return ' Please email <a href="mailto:' + CFG.contactEmail + '">' + CFG.contactEmail + '</a> instead.';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.hidden = true;

      /* --- validation ------------------------------------------------ */
      var f = form.elements;
      var name = f.name.value.trim();
      var email = f.email.value.trim();
      var attending = form.querySelector('input[name="attending"]:checked');

      if (!name)       { show('Please tell us your name.', true); f.name.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        show('That email address doesn’t look right.', true); f.email.focus(); return;
      }
      if (!attending)  { show('Please let us know whether you can make it.', true); return; }
      if (f.website.value) { return; }  /* honeypot tripped — silently drop */

      /* --- gather ---------------------------------------------------- */
      var coming = attending.value.indexOf('Joyfully') === 0;
      var payload = {
        name: name,
        email: email,
        attending: attending.value,
        phone: coming ? f.phone.value.trim() : '',
        dietary: coming ? f.dietary.value.trim() : '',
        song: coming ? f.song.value.trim() : '',
        message: f.message.value.trim(),
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      if (!CFG.rsvpEndpoint) {
        show('The RSVP form isn’t connected yet.' + mailtoFallback(), true);
        return;
      }

      /* --- send ------------------------------------------------------
         text/plain keeps this a "simple" request, so the browser skips
         the CORS preflight that Apps Script cannot answer.             */
      submit.disabled = true;
      submit.textContent = 'Sending…';

      fetch(CFG.rsvpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      })
        .then(function (res) { return res.json().catch(function () { return { ok: res.ok }; }); })
        .then(function (res) {
          if (!res || res.ok === false) throw new Error(res && res.error || 'rejected');
          form.hidden = true;
          thanks.hidden = false;
          if (!coming) {
            $('#thanksText').textContent =
              'Thank you for letting us know. You will be missed — we will raise a glass to you.';
          }
          thanks.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        })
        .catch(function () {
          submit.disabled = false;
          submit.textContent = 'Send our reply';
          show('Something went wrong sending that.' + mailtoFallback(), true);
        });
    });
  })();

})();
