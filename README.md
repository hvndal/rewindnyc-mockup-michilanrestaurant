# Rewind NYC — redesign concept (Mander)

Static site in `site/` — no build step.

- `site/index.html` — the demo page
- `site/leave-behind.html` — what changed, full-build scope, SEO suggestions
- `site/main.js` — set `WEB3FORMS_KEY` (free, registered to sales@mander.tech) so the Mander form delivers; without it the form opens a prefilled email.

Run locally: `cd site && python3 -m http.server`

Video: Rewind's own 540p clips, upscaled to 1080p with Real-ESRGAN (`tools/upscale.py`, realesr-general-x4v3) and encoded with ffmpeg.
