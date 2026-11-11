**Skipped from the review, and why**

- **A CSS-only safety net for the stack** (creative director). It would have to animate grid
  placement after a delay; browsers that cannot do that would bring the hidden folders back on
  top of one another. The head snippet covers both failures instead (script blocked: at `load`;
  script stalled: after four seconds), with no inline handler. Decision 15.
- **"After launch" as the stack's last row label** (creative director). Checked: the spec table
  on `/pricing/` says "Support" today. The values were changed to match it ("14 days", not
  "14 days support"). Decision 19.
- **Hiding the pause button when nothing can move** (engineer). `motion.js` cannot know what
  other scripts will animate, and it is the site-wide switch the other motion groups read; a
  remembered choice is still worth offering. It stays visible whenever script runs.
- **Compiling shaders without blocking** (engineer). Written and working with
  `KHR_parallel_shader_compile`, then taken out: 230 bytes that `shader.js` did not have. The
  first frame of each preset still compiles on the main thread, once a page.
- **A bitmap per layer sized to its own region** (engineer). Each drawn layer still holds a
  bitmap the size of the shared canvas (about 0.6 MB each with the larger ribbons; eleven on
  the demo, five or six on a real page). Changing it means giving up the zero-copy hand-over.
- **Reading the GPU's name to refuse known software renderers** (engineer, optional).
  `failIfMajorPerformanceCaveat` does the job without it.
- **Every raw length as a token** (engineer). Durations, the tap size, spacing that maps to the
  site's scale and all colours are variables. The drawn objects' own measurements (a 12px
  shoulder, a 6px leaf, an 84px strip, a 26px bookmark) stay as plain numbers in their own rules:
  the handbook allows a drawn object its own geometry, and each `var()` with a fallback costs
  bytes the 3.5 KB line does not have.

**Not right yet**

- **`shader.css` is {{shader.css}} bytes, over the 3.5 KB line.** About 600 of them are the band's
  glints and their animation, which the review moved out of WebGL into CSS; the rest was 3,360
  before. `shader.js` is {{shader.js}} of 16,000 with nothing to spare: its comments are terse
  for that reason, and section 2 has the map of the file instead. `cards.css` is {{cards.css}}
  bytes as a file; each of its three components is under 3.5 KB with the shared base counted once.
- **Never seen on a real GPU, a real phone, Safari or Firefox.** Everything was measured in
  Chromium with software WebGL forced on. That matters more than before: real visitors on
  software rendering now get the stills, so the moving pictures have only ever been watched on
  a renderer no visitor will use. Look at it on an iPhone and a mid-range Android before placing.
- **No screen reader was run.** Roles, names, states and focus order were checked by script.
- **Frame times were taken on a busy machine** and vary between passes (section 7). At desktop
  size under software rendering three ribbons at once still drop frames.
- **The closing group's files need two small changes** (theirs to make; nothing of theirs was
  edited). (1) Their demo and test pages load only `shader.js` and `shader.css`: add
  `motion.js` and `motion.css`, or the pause button never appears. (2) Their footer sky draws
  its stars with `radial-gradient` on the host, so the band no longer starts there (the sky
  keeps its own still picture, which their notes call complete): give the layer
  `--kit-shader-ground` or move the stars to a pseudo-element. Their four closing bands run as
  before (gradient folds over a solid colour are accepted), now with the DOM glints. Their notes
  still say `shader.js` shows the pause button and that the guard is 4.8:1.
- **Under reduced motion, Play moves the canvases but not the glints or the folder swap**: those
  are CSS and obey the device setting whatever the button says.
- **The pause button's place in the real chrome is still to do**: the footer partials, the top
  strip and the phone menu need the markup from section 3 and the three rules from the demo's
  `<style>` block.
- **The stack and the pricing page.** The stack is its own markup. Beside the spec table on
  `/pricing/` it would repeat the package facts. It fits the home page's packages section; on
  `/pricing/` keep the table. Step folders and the job ticket tell the same four steps: a page
  should use one of them.
- **The joined-row layout needs container queries** (Chrome 105, Safari 16, Firefox 110).
  Older browsers get the index layout at every width, which works. The kept place for the index
  needs `:has()` for anything but three or four folders (section 5).
- **A tab name that wraps** makes its tab taller than the place kept for it, and the page moves
  by a line when the script runs. Keep names to a word or two.
- **The hover lift keeps its transition when motion is paused.** It answers the pointer and is
  not ambient; under `prefers-reduced-motion` it is off.
- **The day wash is now clearly there.** If Christian wants it quieter, give it paler
  `--kit-shader-1/2/3` values on the first screen; there is no strength option.
- **The site's 140 KB stylesheet budget.** Do not fold these files into `styles.css`
  (`motion.css` excepted, at {{motion.css}} bytes): link them on the pages that use them.
- `demo.html` is assembled by `motion/work-light/build_demo.py` from `demo.main.html`,
  `demo.style.css` and the chrome of the built pricing page; rebuild it if the chrome changes.
