## Review

- Correct: The redesign is coherent and professionally positioned: semantic single-page sections, strong enterprise AI narrative, proper `rel="noopener"` on new-tab links, `defer` for JS, passive scroll listeners, `IntersectionObserver` unobserves revealed items, and initial reduced-motion handling is present (`index.html:23`, `index.html:74-78`, `assets/js/main.js:45-68`, `assets/js/main.js:110-122`, `assets/js/main.js:143`).
- Fixed: None — review only; no files changed.
- Blocker: The page content is hidden when JavaScript is unavailable or fails before reveal initialization.
- Note: No current fixed bottom-right element conflicts with the planned digital-twin widget, and CSS reserves that space conceptually (`assets/css/style.css:8-13`), but the proposed z-index plan needs adjustment before the widget lands.

## Critical

1. **Critical — No-JS / JS-failure fallback hides most of the site.**  
   Evidence: `.reveal` starts at `opacity: 0` and translated down (`assets/css/style.css:447-452`), while nearly every meaningful block uses `reveal` (`index.html:57`, `index.html:94`, `index.html:119`, `index.html:169`, `index.html:297`, `index.html:391`, `index.html:438`, `index.html:484`). Only JS makes these visible (`assets/js/main.js:48-68`). If JS is disabled, blocked, or errors early, recruiters see mostly blank content.  
   **Fix:** Make content visible by default and only apply hidden reveal state under a JS-enabled class, e.g. add `document.documentElement.classList.add("js")` early and change CSS to `.js .reveal { opacity: 0; ... }`.

## Important

1. **Important — Mobile menu is visually hidden but remains keyboard/screen-reader reachable when closed.**  
   Evidence: mobile nav is only moved offscreen with `transform: translateY(-130%)` (`assets/css/style.css:476-485`); JS only toggles class and `aria-expanded` (`assets/js/main.js:24-36`); the nav has no `hidden`, `inert`, or focus management (`index.html:36-44`).  
   **Fix:** Add `aria-controls="navLinks"` to the button, toggle `hidden`/`inert` on the nav links, add `visibility/pointer-events` CSS for the closed state, close on `Escape`, and return focus to the burger.

2. **Important — Keyboard focus states are missing for primary interactions.**  
   Evidence: CSS defines hover states for nav/buttons/social/cards/footer (`assets/css/style.css:101`, `assets/css/style.css:128-132`, `assets/css/style.css:208`, `assets/css/style.css:303`, `assets/css/style.css:344-348`, `assets/css/style.css:433`, `assets/css/style.css:445`), but there are no focus rules.  
   **Fix:** Add a global accessible style such as `:where(a, button):focus-visible { outline: 3px solid var(--accent-1); outline-offset: 4px; }`, with component-specific refinements.

3. **Important — Linked project card has an invisible focus target.**  
   Evidence: the OpenPages card uses an empty absolutely positioned overlay link (`index.html:327-329`) styled as `position: absolute; inset: 0; z-index: 1` (`assets/css/style.css:349`). Keyboard users can focus it, but there is no visible focus indicator tied to the card.  
   **Fix:** Add `.project__link-overlay:focus-visible { outline: 3px solid var(--accent-1); outline-offset: 4px; }` or wrap the card content in a visible anchor pattern.

4. **Important — Contact email CTA can overflow on narrow mobile screens.**  
   Evidence: the email is rendered as a large pill button (`index.html:490-493`) with fixed horizontal padding (`assets/css/style.css:117-133`), and mobile CSS does not override it (`assets/css/style.css:468-492`). On ~320px screens, the email plus 68px horizontal padding is likely wider than the content area.  
   **Fix:** Add `max-width: 100%; overflow-wrap: anywhere; padding-inline` reduction under small breakpoints, or split label/text.

5. **Important — Reduced-motion support is incomplete for hover/transition motion.**  
   Evidence: reduced-motion disables reveal transitions and a few animations (`assets/css/style.css:454-458`), but hover transforms/transitions remain on buttons, cards, chips, socials, and footer (`assets/css/style.css:122`, `assets/css/style.css:128-132`, `assets/css/style.css:208`, `assets/css/style.css:303`, `assets/css/style.css:344-348`, `assets/css/style.css:397-400`, `assets/css/style.css:445`).  
   **Fix:** In the reduced-motion media query, neutralize nonessential transforms/transitions, e.g. `*, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }` and remove hover translate effects.

6. **Important — `100svh` lacks a fallback for older browsers.**  
   Evidence: hero uses only `min-height: 100svh` (`assets/css/style.css:136-140`).  
   **Fix:** Add `min-height: 100vh; min-height: 100svh;` so older Safari/Chromium variants still size the hero correctly.

7. **Important — Planned digital-twin z-index can conflict with navigation on mobile/expanded states.**  
   Evidence: CSS reserves twin widget z-index `150` while nav is `100` (`assets/css/style.css:8-13`, `assets/css/style.css:73-80`), and the mobile menu is a fixed dropdown under that nav (`assets/css/style.css:476-485`). A future widget at `150` can sit above nav/menu UI.  
   **Fix:** Define widget layering now: either keep nav/menu above chat, hide/minimize chat while the mobile menu is open, or give expanded chat a modal/focus-trap pattern with intentional z-index.

## Nice-to-have

1. **Nice — Add a skip link for keyboard users.**  
   Evidence: body starts with progress/header before main (`index.html:25-50`).  
   **Fix:** Add `<a class="skip-link" href="#about">Skip to content</a>` or target `<main>`, with visible focus styling.

2. **Nice — Metadata sharing could be richer.**  
   Evidence: Open Graph has type/title/description/url only (`index.html:11-16`).  
   **Fix:** Add `og:image`, `twitter:card`, and canonical URL for better LinkedIn/recruiter sharing previews.

3. **Nice — Font payload is heavier than necessary for a static portfolio.**  
   Evidence: three Google font families and many weights are requested in one render-blocking stylesheet (`index.html:19-23`).  
   **Fix:** Consider reducing weights/families, self-hosting, or using `font-display: swap` plus a smaller display/body pairing. `display=swap` is already good.

4. **Nice — Canvas animation is tasteful but can be even more power-aware.**  
   Evidence: node linking is O(n²), capped at 90 nodes (`assets/js/main.js:162-190`), and it pauses only when the hero/canvas leaves the viewport (`assets/js/main.js:238-253`).  
   **Fix:** Add `visibilitychange` pause/resume, debounce resize (`assets/js/main.js:255`), and consider lower caps for coarse pointers/mobile.

5. **Nice — Content is strong, but a few phrases can sound overclaimed/gimmicky for enterprise buyers.**  
   Evidence: “Cloud Platforms Mastered” (`index.html:103-104`) and “Crafted with ♥ and a neural network or two” (`index.html:507`).  
   **Fix:** Use more precise wording such as “Cloud Platforms” or “Cloud & AI Platforms,” and make the footer more understated if targeting senior enterprise clients.

6. **Nice — Some resume-reference keywords are missing from the redesigned skills section.**  
   Evidence: README highlights TensorFlow/Keras (`README.md:13`, `README.md:21`), while the redesigned “Languages & Frameworks” list includes PyTorch/Scikit-learn but not TensorFlow/Keras (`index.html:416-419`).  
   **Fix:** Add TensorFlow and Keras if still accurate, improving recruiter keyword matching.

7. **Nice — Emoji/icons should be hidden from assistive tech where decorative.**  
   Evidence: decorative emoji appear in cards/headings/contact links (`index.html:142-155`, `index.html:439-461`, `index.html:496-499`).  
   **Fix:** Wrap decorative emoji in `<span aria-hidden="true">…</span>` and keep accessible text clean.