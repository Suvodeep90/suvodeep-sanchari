/* =====================================================================
   WEDDING SITE CONFIG  —  edit this file, nothing else, for the basics.
   ===================================================================== */
window.WEDDING_CONFIG = {

  /* ---- When the countdown counts down to (local time, 24h clock) ---- */
  weddingDate: '2026-12-12T16:00:00',   // ceremony, Sat 12 Dec 4:00 pm

  /* ---- RSVP endpoint -------------------------------------------------
     Paste the Google Apps Script Web App URL here after you deploy it.
     Step-by-step instructions: see SETUP.md  →  "2. Wire up the RSVP".
     Leave as '' and the form will politely tell guests to email instead.
     It looks like:
       https://script.google.com/macros/s/AKfycb..................../exec
  ------------------------------------------------------------------- */
  rsvpEndpoint: '',

  /* ---- Fallback contact shown if the RSVP endpoint is not set ------- */
  contactEmail: 'suvodeep.majumder90@gmail.com',

  /* ---- Deadline shown on the RSVP card ------------------------------ */
  rsvpDeadline: 'October 1, 2026',

  /* ---- Background music ---------------------------------------------
     Drop an .mp3 at assets/audio/ambient.mp3 and it just works.
     If the file isn't there, the music button hides itself automatically.
     Always starts muted — browsers block autoplay, and guests hate it.
  ------------------------------------------------------------------- */
  audioSrc: 'assets/audio/ambient.mp3',
  audioVolume: 0.35
};
