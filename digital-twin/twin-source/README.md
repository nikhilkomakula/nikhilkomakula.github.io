# twin-source/ — drop zone for digital-twin source material

Put resumes, project write-ups, decks (.pptx — speaker notes are ingested
too), notes, and exports here, then tell your agent **"update my twin"**.
The `nk-twin-context-builder` skill ingests everything in this folder into
`../twin-context.md`.

**Everything in this folder except this README is gitignored** — your raw
documents never reach the public repo or the GitHub Pages site. The generated
`twin-context.md` is gitignored too; it only leaves your machine bundled
inside the Cloudflare Worker at deploy time.

Supported: `.md` `.txt` `.pdf` `.docx` `.pptx` `.potx` `.json` `.csv`
`.ipynb` `.rst` and text-bearing images.
