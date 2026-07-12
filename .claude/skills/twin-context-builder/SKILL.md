---
name: twin-context-builder
description: Builds or updates digital-twin/twin-context.md (the grounding file for Nikhil's digital-twin chatbot) from source material in digital-twin/twin-source/. USE THIS SKILL whenever the user says anything like "update my twin", "rebuild the context from my docs", "refresh twin context", "rebuild twin-context.md", mentions twin-context.md, or asks to ingest resume/project docs into the digital twin. Also use it after new files are added to twin-source/.
---

# Twin Context Builder

You are building the **single grounding file** that powers Nikhil Komakula's
digital-twin chatbot. Everything you write into `digital-twin/twin-context.md`
**will be spoken aloud by a public chatbot**. Treat every line as public.

Use ONLY your own file tools (read/list/grep/edit/write). Do not rely on any
bundled scripts — this skill must behave identically in Pi and Claude Code.

## Paths (defaults — the user may override)

- Source folder: `digital-twin/twin-source/`
- Output file: `digital-twin/twin-context.md`
- Review file: `digital-twin/twin-context.review.md`

All paths are relative to the repository root.

## Step 1 — Inventory the sources

Recursively list `digital-twin/twin-source/**`. Ignore:
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
- Exclude private PII (personal addresses, government IDs, DOB, family
  details). Public professional contact info (email, LinkedIn, portfolio
  phone) is fine.
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
   cursor agent -p "Audit digital-twin/twin-context.md against the source files in digital-twin/twin-source/. Report: (a) any claim in twin-context.md NOT traceable to a source file (hallucination risk) — cite the claim; (b) any confidentiality leak: client/NDA details, internal system names, customer data, private PII, or secrets; (c) whether the persona & grounding rules section is intact and instructs the model to answer only from the file. Output a prioritized findings list. Do not modify any files." --mode ask --trust
   ```

3. Write Cursor's full output to `digital-twin/twin-context.review.md` and
   show the user the key findings.
4. Do NOT auto-apply Cursor's suggestions — the user decides what to act on.
5. If the Cursor CLI is not installed, skip the review gracefully and say so
   in the run summary.

## Step 7 — Run summary (always)

End every run with:

- **Files read** (count + list)
- **Files skipped** (each with reason)
- **Content excluded/flagged** (confidentiality, secrets to rotate,
  "excluded pending confirmation" items)
- **Sections written/updated**
- **Cursor review:** ran (see twin-context.review.md) / skipped (why)
- Reminder: review `twin-context.review.md` before deploying the twin.
