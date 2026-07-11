# Task for cursor-reviewer

You must perform a review in this single turn. Do not ask what to do next — the task is fully specified here. Read these three files with your read tool and output the review immediately in your required "## Review" format (Correct / Blocker / Note with file:line evidence):

1. /Users/nikhil.komakula/Databricks/Workspace/personal-projects/nikhilkomakula.github.io/index.html
2. /Users/nikhil.komakula/Databricks/Workspace/personal-projects/nikhilkomakula.github.io/assets/css/style.css
3. /Users/nikhil.komakula/Databricks/Workspace/personal-projects/nikhilkomakula.github.io/assets/js/main.js

What changed: A complete portfolio redesign for Nikhil Komakula, Senior AI Engineer @ Databricks (AI Forward Deployed Engineer). New single-page static site: hero (neural-network canvas, typing effect), animated stat counters, about, experience timeline (Databricks → IBM → SureStep → IBM decade → early career), 5 project cards + GitHub CTA, skills chips in 6 groups, certifications/awards/education, contact, mobile hamburger nav, scroll-progress bar, IntersectionObserver reveals, prefers-reduced-motion support. Goal: professional "wow-feeling" portfolio.

Review dimensions:
- HTML/CSS/JS correctness bugs and browser edge cases
- Accessibility: contrast, aria, keyboard navigation, focus states, reduced motion
- Responsive behavior (mobile nav, grids, typography scaling)
- Visual design quality and animation tastefulness
- Content: professional narrative, tone, credibility, engagement for recruiters/clients
- Performance (canvas loop, observers, font loading)

A future "digital twin" chat widget is planned for the bottom-right corner — flag anything that would conflict with that.

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