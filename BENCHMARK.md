# Benchmarks

Slide90 publishes two different measurements. Keep their scopes separate: the controlled Fast Loop experiment estimates repeated workflow overhead; the P0 runner measures only local schema validation and PPTX generation.

## P0 delivery acceptance gate

```bash
npm run verify:p0
```

The gate must finish within **600 seconds**. It includes automated tests, schema validation, three independent editable-PPTX generations, slide/package inspection, semantic fingerprint comparison, source-notes checks, and the reproducible five-slide benchmark.

Latest local acceptance result:

| Check | Result |
|---|---:|
| Complete P0 verification | 1.253 s |
| Slowest two-slide generation | 0.169 s |
| Stable generations | 3 / 3 |
| Slide XML fingerprint | identical |
| Raster pictures in fixture slides | 0 |
| Delivery ceiling | 600 s |

This is a deterministic installed-runtime gate. It excludes first-time dependency installation, model inference, network transfer, queueing, and source-approval delays. Visual rendering and overflow inspection remain mandatory before a deck is handed to a user.

## P0 reproducible renderer benchmark

Run it on your machine:

```bash
npm ci
npm run benchmark
```

The runner uses [`benchmarks/cases/five-slide.json`](benchmarks/cases/five-slide.json), performs one warm-up and three measured runs, and writes every raw value plus the median to [`benchmarks/results/latest.json`](benchmarks/results/latest.json).

Latest reference run on Linux x64 / Node 24:

| Workflow | Five-slide median | Relative speed |
|---|---:|---:|
| Five one-slide validate/render calls | 18.928 ms | 1.00× |
| One five-slide validate/render call | 7.959 ms | 2.38× |

For this local renderer-only fixture, batching reduced measured time by **58.0%**. The absolute numbers are machine-dependent; use the checked-in runner, not this reference value, for comparisons on another environment.

## Controlled Fast Loop workflow benchmark

This benchmark checks whether deck-level batching and targeted repair reduce repeated production work. It is a deterministic runtime benchmark, not a claim about model inference, network latency, PowerPoint startup time, or every agent platform.

### Result

| Workflow | Five-slide wall time | Relative speed |
|---|---:|---:|
| Sequential loop | 55.187 s | 1.00× |
| Fast Loop | 11.353 s | 4.86× |

Fast Loop reduced wall time by **79.4%**. All five rendered PNG outputs were pixel-identical, and neither workflow produced an overflow failure.

### Method

- Scenario: five-slide AI asset-inventory management deck.
- Sequential baseline: five independent plan/generate/render rounds.
- Fast Loop: one deck specification validation followed by one batch render.
- Sequential round times: 11.161 s, 10.877 s, 10.851 s, 11.331 s, and 10.967 s.
- Fast Loop: 0.021 s validation plus 11.332 s batch run.
- Environment: same local runtime, same layout inputs, same output renderer.

### Interpretation

The result isolates workflow overhead. Actual end-to-end gains on WorkBuddy, ChatGPT, or another agentic platform will depend on model reasoning, queueing, network latency, file parsing, and presentation rendering. Reproduce the benchmark on your own workload before using the number in a production business case.
