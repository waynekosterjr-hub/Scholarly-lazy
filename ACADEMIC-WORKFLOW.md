# Academic writing workflow

1. Import the actual assignment and grading rubric. Check extracted requirements before drafting. Missing word limits and weights are recorded as zero (unspecified), not invented requirements.
2. Set a research direction and select relevant sources. The current source library supplies metadata and abstracts, not full-text verification. Read the sources and verify the passages supporting your argument.
3. Generate an outline. Point descriptions should connect arguments to rubric criteria and identify missing evidence. Word budgets without an assignment limit are planning suggestions.
4. Draft sections and revise them. The AI receives the full rubric and supplied source evidence. `[Evidence needed: ...]` identifies a gap to resolve, not text ready for submission.
5. Run Professor Review. Scores are provisional, use supplied criterion weights, and are not instructor grades. Missing weights prevent numerical scoring. The displayed word count includes all submitted text. Library matches do not establish claim support.
6. Resolve evidence gaps and inspect the exported pages. Export warns about remaining evidence markers and preserves them rather than hiding unfinished work.

## Model selection

The existing model selection remains available. Automatic uses a routing heuristic: prefer stable Pro models for outlines, section drafts, and reviews, and Flash-Lite for lighter tasks. Prefer reasoning models uses the Pro preference for all tasks. Available models are discovered from the configured account; listing does not establish quota. Routing is not a benchmark or guarantee of quality. Failures do not silently switch providers or downgrade review quality.

The current implementation still uses the server's configured Gemini credentials. OAuth onboarding, Ollama connections, secure per-user credential storage, full-text retrieval, and a Windows executable are separate work and are not implemented by this change.
