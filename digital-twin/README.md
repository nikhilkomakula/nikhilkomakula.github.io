# Digital Twin — Gemini-powered chat assistant

A chat widget on [nikhilkomakula.github.io](https://nikhilkomakula.github.io)
where visitors ask an AI version of Nikhil about his professional experience.
It answers **only** from a curated grounding file, `twin-context.md`.

```
visitor browser ──► assets/js/twin.js (widget, in the portfolio site)
                        │  POST /chat  { messages: [...] }
                        ▼
        Cloudflare Worker (digital-twin/proxy/worker.js)
          · holds GEMINI_API_KEY (secret — never client-side)
          · injects twin-context.md as system instruction
          · Gemini context caching · rate limiting · CORS lock
                        │
                        ▼
              Google Gemini Flash (gemini-3.5-flash)
```

**Why Cloudflare Workers (vs Vercel):** 100k free requests/day with no cold
starts, first-class secrets (`wrangler secret`), and text-module imports let
us bundle `twin-context.md` into the Worker at deploy time — the file never
exists at a public URL. A single-file Worker with zero npm dependencies is
also the smallest possible attack/maintenance surface.

## Layout

```
digital-twin/
├── README.md                  ← you are here
├── twin-context.example.md   ← sample of the generated file (committed)
├── twin-context.md            ← REAL grounding file (gitignored, generated)
├── twin-context.review.md     ← Cursor audit output (gitignored, generated)
├── twin-source/               ← drop resumes/decks/notes here (gitignored)
└── proxy/
    ├── worker.js              ← Cloudflare Worker (no dependencies)
    ├── wrangler.toml          ← config: origins, model, caps
    ├── .env.example           ← key placeholder (never commit real key)
    └── .dev.vars.example      ← same, in wrangler's local-dev format
```

`twin-source/` and `twin-context*.md` are **gitignored** so raw documents and
the grounding file never reach the public repo or the GitHub Pages site.

## 1 · Build the grounding file

1. Drop source material into `digital-twin/twin-source/` — resume PDFs,
   project write-ups, decks (`.pptx` speaker notes are ingested too), notes.
2. In Pi or Claude Code, say: **"update my twin"**.
   The `nk-twin-context-builder` skill (`.claude/skills/nk-twin-context-builder/`,
   symlinked into `.pi/skills/`) will:
   - ingest `twin-source/**`, applying a build-time confidentiality filter
     (public-resume level only; secrets excluded & flagged),
   - regenerate the `TWIN:AUTO` block of `twin-context.md` while preserving
     your `TWIN:MANUAL` block verbatim,
   - run a **read-only Cursor CLI audit** (hallucination, leaks, persona
     integrity) into `twin-context.review.md`,
   - print a run summary.
3. **Read `twin-context.review.md` before trusting the output.** The twin
   will say anything that's in `twin-context.md`.

## 2 · Run the proxy locally

```bash
cd digital-twin/proxy
cp .dev.vars.example .dev.vars       # then paste your real Gemini key into it
npx wrangler dev                     # serves http://localhost:8787
```

Add `http://localhost:8000` to `ALLOWED_ORIGINS` in `wrangler.toml` while
testing, serve the portfolio (`python3 -m http.server 8000` at repo root),
and point the widget at the local proxy by editing `index.html`:

```html
<script>window.NK_TWIN_ENDPOINT = "http://localhost:8787";</script>
```

Smoke test without the widget:

```bash
curl -s http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{"messages":[{"role":"user","content":"What do you do at Databricks?"}]}'
```

## 3 · Deploy the proxy

```bash
cd digital-twin/proxy
npx wrangler login                       # once
npx wrangler secret put GEMINI_API_KEY   # paste key when prompted
npx wrangler deploy                      # prints https://nk-digital-twin.<acct>.workers.dev
```

Deploy bundles the **current local** `twin-context.md` into the Worker.
Rebuilt the context? Just `npx wrangler deploy` again.

## 4 · Embed the widget

The widget is already wired into this portfolio (`index.html` loads
`assets/css/twin.css` + `assets/js/twin.js`). To activate Gemini mode, set
the endpoint in `index.html`:

```html
<script>window.NK_TWIN_ENDPOINT = "https://nk-digital-twin.<acct>.workers.dev";</script>
```

With an empty endpoint the widget still works, answering from its built-in
local knowledge base (and it silently falls back to it if the proxy is ever
unreachable).

Embedding on **any other site** — paste before `</body>`:

```html
<link rel="stylesheet" href="https://nikhilkomakula.github.io/assets/css/twin.css" />
<script>window.NK_TWIN_ENDPOINT = "https://nk-digital-twin.<acct>.workers.dev";</script>
<script src="https://nikhilkomakula.github.io/assets/js/twin.js" defer></script>
```

(and add that site's origin to `ALLOWED_ORIGINS` in `wrangler.toml`).

## Cost & abuse protection

- **Context caching:** the Worker creates a Gemini `cachedContents` entry for
  `twin-context.md` (TTL 1h, configurable) so the static context isn't
  re-billed per call; it falls back to inline system instruction if the
  context is below the model's cacheable minimum (~2048 tokens) or caching
  errors out.
- **Rate limiting:** per-IP, default 8 messages/min (in-memory per isolate —
  an abuse brake, not a hard guarantee; move to Durable Objects if needed).
- **Output cap:** `MAX_OUTPUT_TOKENS = 512` hard cap per reply.
- **CORS:** locked to `ALLOWED_ORIGINS` exactly; all other origins get 403.
- **History caps:** last 8 turns, 600 chars per message, enforced server-side.

## Data & tier handling — read before going live

- **Developing/testing:** the Gemini **free tier** is fine.
- **Before public launch, switch to the paid tier** (enable billing on the
  project that owns the API key):
  1. On the free tier, Google **may use prompts and responses to improve its
     products** — visitor questions would be training data.
  2. Google's Gemini API terms require **Paid Services when serving users in
     the EEA, UK, or Switzerland** — a public portfolio inevitably reaches
     them.
  3. Paid tier = prompts/responses are **not** used for product improvement.
- **Set a spend cap** (billing budget + alerts) when enabling billing. With
  Flash pricing, context caching, a 512-token output cap, and 8 req/min/IP,
  realistic portfolio traffic costs are cents per month — the cap is there
  for abuse scenarios.

## Model

`GEMINI_MODEL` defaults to **`gemini-3.1-flash-lite`** (pinned; verified
available July 2026). Flash-Lite is the right fit for this workload — simple
grounded Q&A over a system context — at a fraction of Flash pricing and with
lower latency. Upgrade path: set `GEMINI_MODEL` in `wrangler.toml` to
`gemini-3.5-flash` (or newer) if answers ever feel too shallow; the worker
sends `thinkingConfig: { thinkingBudget: 0 }` either way so replies use the
full output-token budget.
