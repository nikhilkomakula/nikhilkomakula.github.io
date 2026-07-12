---
name: nk-twin-context-builder
description: Builds or updates digital-twin/twin-context.md (the grounding file for Nikhil's digital-twin chatbot) from source material in digital-twin/twin-source/. USE THIS SKILL whenever the user says anything like "update my twin", "rebuild the context from my docs", "refresh twin context", "rebuild twin-context.md", mentions twin-context.md, or asks to ingest resume/project docs into the digital twin. Also use it after new files are added to twin-source/.
---

# Twin Context Builder

You are building the **single grounding file** that powers Nikhil Komakula's
digital-twin chatbot. Everything you write into `digital-twin/twin-context.md`
**will be spoken aloud by a public chatbot**. Treat every line as public.

Use ONLY your own file tools (read/list/grep/edit/write). Do not rely on any
bundled scripts — this skill must behave identically in Pi and Claude Code.

## Paths (defaults — the user may override)

- **Gold standard (always available):** the live portfolio content —
  `index.html` and `README.md` at the repository root
- Supplementary source folder: `digital-twin/twin-source/`
- Output file: `digital-twin/twin-context.md`
- Review file: `digital-twin/twin-context.review.md`

All paths are relative to the repository root.

## Source hierarchy (critical)

1. **The portfolio site content is the GOLD STANDARD.** Always read
   `index.html` (experience timeline, projects, skills, credentials,
   contact) and `README.md` (résumé) first — they are curated, reviewed,
   and public by definition, so everything in them is safe to include.
2. **`twin-source/` is supplementary.** Additional data sources will be
   uploaded there when available — use them to ENRICH the portfolio
   baseline (project "why" context, deck speaker notes, extra detail).
3. **On conflict, the portfolio wins.** If a twin-source file contradicts
   the portfolio (dates, titles, metrics, wording), use the portfolio
   version and note the discrepancy in the run summary.
4. **An empty or missing `twin-source/` is not an error.** Build the full
   twin-context.md from the portfolio alone and note in the summary that
   no supplementary sources were found.

## Step 1 — Inventory the sources

First confirm the gold-standard files (`index.html`, `README.md`) exist.
Then recursively list `digital-twin/twin-source/**`. Ignore:
`.git`, `node_modules`, `venv`, `.venv`, `dist`, `build`, `__pycache__`,
lockfiles (`*.lock`, `package-lock.json`, `poetry.lock`, etc.), hidden files,
and `twin-context.md` itself.

Track every file as: **read**, **skipped (reason)**, or **excluded (reason)**
for the final summary.

## Step 2 — Extract professional signal

Handle these types:

- `.md`, `.txt`, `.rst`, `.json`, `.csv` — read directly.
- `.ipynb` — read the JSON; extract markdown cells and code-cell intent (what
  the notebook demonstrates), not raw code dumps.
- `.pdf` — extract text (e.g. `pdftotext -layout <file> -` if available).
- `.docx` — extract text (e.g. unzip `word/document.xml` and strip tags, or
  `textutil -convert txt` on macOS).
- `.pptx` / `.potx` — extract BOTH slide text (`ppt/slides/slide*.xml`) AND
  speaker notes (`ppt/notesSlides/notesSlide*.xml`). The speaker notes carry
  the reasoning behind projects — do not skip them.
- Text-bearing images (`.png`, `.jpg`, etc.) — if you can read images, extract
  visible text; otherwise skip and record why.

If a binary cannot be read with available tools, **skip it and record it in
the run summary**. NEVER fabricate or guess file contents.

## Step 3 — Confidentiality filter (critical)

Exclusion happens **at build time**. Do NOT write sensitive content into the
file with a "confidential" annotation — the twin will happily repeat anything
that is in the file.

- Restate client/employer work at **public-resume level** only: no internal
  system names, no customer names or data, no unreleased work, no internal
  metrics that are not already public in the portfolio/resume.

### Nikhil's PII — hard rules
- EXCLUDE all private PII about Nikhil found in any source: home/postal
  addresses, birth date, government IDs, financial data (receipts,
  payments, subscriptions), account registration/verification data, IP
  addresses, device identifiers, private phone numbers or email addresses
  found in data exports, family details, health data, photos metadata.
- Contact details in twin-context.md come ONLY from the portfolio gold
  standard (index.html/README.md) — the curated public set. NEVER source
  contact info from data exports (e.g. LinkedIn `PhoneNumbers.csv`,
  `Email Addresses.csv`, `Whatsapp Phone Numbers.csv`), even if values
  look identical to the public ones.

### Third-party / connections PII — zero tolerance
- EXCLUDE every trace of other people's data: connection lists, names of
  endorsers/recommenders, message counterparts and message content,
  invitation senders/recipients, colleagues named in award citations,
  event attendees, recruiter names. No names, emails, employers, titles,
  or aggregates that could identify a third party — even indirectly
  (e.g. "my manager at X", "a director at <client>").
- Never ingest these file types from social/data exports (LinkedIn,
  Google Takeout, Facebook, etc.): messages, connections, invitations,
  endorsements (given/received), recommendations (given/received),
  contacts, followers, ad-targeting, browsing/learning history, job
  applications, saved jobs, screening-question answers, receipts,
  registration, verifications. If a genuinely public fact (e.g. a
  recommendation's existence) seems valuable, list it under "excluded
  pending confirmation" — do not include it.

### Secrets
- If you find API keys, tokens, or credentials in any source file: EXCLUDE
  them and FLAG the file in the run summary so the user can rotate them.
- When unsure whether something is public, leave it out and list it under
  "excluded pending confirmation" in the summary.

## Step 4 — Generate or update twin-context.md (idempotent)

The file uses HTML-comment fences:

```
<!-- TWIN:AUTO:START -->   ...regenerated every run...   <!-- TWIN:AUTO:END -->
<!-- TWIN:MANUAL:START --> ...preserved verbatim...      <!-- TWIN:MANUAL:END -->
<!-- TWIN:SOURCES:START -->...refreshed every run...     <!-- TWIN:SOURCES:END -->
```

Rules:
1. Regenerate everything between `TWIN:AUTO:START/END` each run.
2. Preserve the `TWIN:MANUAL` block and ANY content outside all fences
   verbatim — byte for byte.
3. Refresh the `TWIN:SOURCES` block with the ingested file list + build date.
4. If `twin-context.md` exists but has NO fences: do NOT overwrite it. Show
   the user a proposed fenced version (their content moved into the MANUAL
   block) and ask for confirmation first.
5. If the file does not exist, create it with all three fence blocks (MANUAL
   block empty but present).

## Step 5 — Content structure (inside TWIN:AUTO)

Write lean, first-person content optimized as a Gemini Flash system context:

1. **Persona & grounding rules** — "You are Nikhil Komakula's digital twin…
   Answer ONLY from this document. If a question is not covered here, say it
   is not part of your documented background — never invent details. Keep
   answers concise and professional. Refer to Nikhil in first person ('I')."
2. **Summary** — 3-4 sentence professional summary.
3. **Experience** — every role: company, title, dates, location, 2-4 bullets.
4. **Key projects** — each with what it is, the stack, the outcome, and THE
   WHY (the reasoning/decision context, often from slide notes).
5. **Skills** — grouped (GenAI/agents, Databricks, MLOps, cloud, languages,
   data), plus certifications, awards, education, spoken languages.
6. **FAQ** — likely visitor questions with answers, INCLUDING 3-5 questions
   the file deliberately cannot answer (salary expectations, private life,
   opinions about specific employers) each mapped to a graceful decline, so
   the model learns the declining pattern.

Then the MANUAL block, then the SOURCES block.

## Step 6 — Independent review via Cursor CLI (read-only)

After writing the file, audit it with Cursor as an independent reviewer:

1. First verify the CLI exists and check flags: run `cursor agent --help`
   (note: `cursor agent` is the subcommand — plain `cursor` launches the
   editor; the standalone binary `cursor-agent` is equivalent if present).
2. Run a READ-ONLY review (adjust flags to what `--help` showed):

   ```
   cursor agent -p "Audit digital-twin/twin-context.md against its sources: the portfolio gold standard (index.html and README.md at the repo root) plus any files in digital-twin/twin-source/. Report: (a) any claim in twin-context.md NOT traceable to the portfolio or a source file (hallucination risk) — cite the claim; (b) any contradiction where twin-context.md deviates from the portfolio content; (c) any confidentiality leak — specifically: Nikhil's private PII (addresses, birth date, IDs, financial/account data, phone/email sourced from data exports rather than the portfolio), ANY third-party PII (connection names, endorsers, recommenders, message counterparts, recruiters, colleagues — even indirect identification), client/NDA details, internal system names, customer data, or secrets; (d) whether the persona & grounding rules section is intact and instructs the model to answer only from the file. Contact info is only legitimate if it matches the portfolio's public set. Output a prioritized findings list. Do not modify any files." --mode ask --trust
   ```

3. Write Cursor's full output to `digital-twin/twin-context.review.md` and
   show the user the key findings.
4. Do NOT auto-apply Cursor's suggestions — the user decides what to act on.
5. If the Cursor CLI is not installed, skip the review gracefully and say so
   in the run summary.

## Step 7 — Run summary (always)

End every run with:

- **Gold standard read:** index.html + README.md (always)
- **Supplementary files read** (count + list; "none uploaded yet" is fine)
- **Files skipped** (each with reason)
- **Conflicts vs portfolio** (twin-source claims overridden by the gold
  standard, if any)
- **PII exclusion attestation** — explicitly confirm: (1) no private PII
  about Nikhil was ingested (contact info traces to the portfolio only),
  and (2) zero third-party/connections data was ingested (list the
  private export files that were excluded by name)
- **Content excluded/flagged** (confidentiality, secrets to rotate,
  "excluded pending confirmation" items)
- **Sections written/updated**
- **Cursor review:** ran (see twin-context.review.md) / skipped (why)
- Reminder: review `twin-context.review.md` before deploying the twin.
