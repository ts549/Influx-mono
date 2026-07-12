# Redesign evals

Ports the two-tier eval setup from the standalone `itera` CLI to the `/api/redesign` route in this repo.

- **Unit tests** exercise pure functions in `_lib/` — no API keys required, fast.
- **LLM-as-judge** evals grade the Gemini agents against hand-authored expected outputs. `triage` is live; `ui-gen` is a phase-2 stub, mirroring the source.

## Layout

```
_evals/
├── tests/                                # unit tests — node --test via tsx
│   ├── condense.test.ts
│   ├── parse-events.test.ts
│   ├── retry.test.ts
│   ├── extract-frames.test.ts
│   ├── triage.test.ts
│   └── generate-ui.test.ts
├── support/
│   └── silent-logger.ts                  # no-op / console Logger impls for tests + runners
└── llm-as-judge/
    ├── judges/
    │   ├── triage-judge.ts               # Claude Sonnet grader
    │   └── prompts/triage_judge.md
    ├── cases/triage/<case-name>/
    │   ├── posthog-raw.json
    │   ├── session-replay.mp4
    │   └── expected.md
    ├── runners/
    │   ├── run-triage-judge.ts
    │   ├── run-ui-gen-judge.ts           # stub (phase 2)
    │   └── run-all.ts
    └── results/                          # timestamped, gitignored
```

## Commands

- `npm test` — unit tests, no external calls.
- `npm run eval:triage` — triage judge only (requires both API keys).
- `npm run eval:ui-gen` — stub for now.
- `npm run eval:all` — both suites into one dated results dir.

## Environment

Unit tests: nothing.

LLM-as-judge:

- `GEMINI_API_KEY` — production triage / UI-gen agents.
- `ANTHROPIC_API_KEY` — Claude judge. Cross-provider judging reduces self-agreement bias.

Both live in `.env.local`, but the eval scripts run outside Next.js so you'll need to export them (or use `dotenv-cli`, or use `node --env-file=.env.local ...`).

## Adding a triage case

1. `_evals/llm-as-judge/cases/triage/<case-name>/`
2. Drop `session-replay.mp4`, `expected.md`, and one of:
   - `events-condensed.json` — from a prior production run (`.itera/itera-metadata/events-condensed.json` in the standalone CLI).
   - `posthog-raw.json` — raw rrweb export; parsed on the fly.
3. Write `expected.md` in plain English — describe the AOI(s) a good triage should find. For a control ("no-AOI") session, write "The session has NO SIGNIFICANT AOI."
4. `npm run eval:triage`.

## Reading judgments

Every `<case-name>.json` includes the raw judge output. The `matches[]` and `extraActualAois[]` arrays carry `reasoning` fields — **read them when spot-checking**. High score with weak reasoning = lenient judge; low score with sharp reasoning = real signal.

## Meta-eval

The judge is a prompt. It can be wrong. Every ~10 runs, read the judge's reasoning on 3–5 cases by hand. If you'd have graded differently, tune `judges/prompts/triage_judge.md` before trusting further scores.
