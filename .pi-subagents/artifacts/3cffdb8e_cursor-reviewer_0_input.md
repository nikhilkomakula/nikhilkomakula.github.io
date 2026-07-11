# Task for cursor-reviewer

Review these three files NOW and produce the full review in your required output format. Do not ask questions — read the files and review them.

Files (all exist, read them fully):
1. /Users/nikhil.komakula/Databricks/Workspace/personal-projects/nikhilkomakula.github.io/index.html
2. /Users/nikhil.komakula/Databricks/Workspace/personal-projects/nikhilkomakula.github.io/assets/css/style.css
3. /Users/nikhil.komakula/Databricks/Workspace/personal-projects/nikhilkomakula.github.io/assets/js/main.js

Context: This is a newly redesigned single-page portfolio for Nikhil Komakula, Senior AI Engineer @ Databricks (AI Forward Deployed Engineer). Goal: a compelling, professional, "wow-feeling" portfolio. It has: hero with neural-network canvas + typing effect, animated stat counters, about section, experience timeline, project cards, skills chips, credentials, contact, mobile nav, scroll-progress bar, IntersectionObserver reveal animations, prefers-reduced-motion support.

Review for:
- Bugs in HTML/CSS/JS (correctness, edge cases, browser quirks)
- Accessibility (contrast, aria, keyboard nav, reduced motion)
- Responsive/mobile issues
- Visual design quality & tastefulness of animations
- Content quality: professional narrative, tone for a senior AI engineer, credibility, engagement
- Performance concerns

Output the review as: Correct / Blocker / Note items with file:line evidence, prioritized.

## Acceptance Contract
Acceptance level: attested
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Return concrete findings with file paths and severity when applicable

Required evidence: review-findings, residual-risks

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```