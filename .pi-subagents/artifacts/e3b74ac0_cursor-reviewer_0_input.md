# Task for cursor-reviewer

Review a redesigned personal portfolio website for Nikhil Komakula (Senior AI Engineer @ Databricks, AI Forward Deployed Engineer). The goal is a compelling, professional, extraordinary portfolio that gives visitors a "wow" feeling and keeps them engaged to learn about his professional background.

Files to review (repo: /Users/nikhil.komakula/Databricks/Workspace/personal-projects/nikhilkomakula.github.io, branch redesign/modern-portfolio):
- index.html — single-page portfolio (hero with neural-network canvas + typing effect, stats, about, experience timeline, projects, skills, credentials, contact)
- assets/css/style.css — dark theme design system (cyan/indigo/fuchsia gradient accents, glassmorphism, scroll reveals)
- assets/js/main.js — canvas animation, typing effect, animated counters, IntersectionObserver reveals, mobile nav

Please review BOTH:
1. STYLE/DESIGN: visual hierarchy, typography, color, spacing, animation tastefulness, responsiveness, accessibility (contrast, reduced-motion, aria), performance concerns.
2. CONTENT: professional narrative quality, accuracy of tone for a senior AI engineer, section ordering, wording improvements, anything that weakens credibility or engagement.

Also flag any bugs (HTML/CSS/JS) you find. Return a prioritized list of concrete, actionable improvements (critical / important / nice-to-have).

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