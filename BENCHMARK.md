# Fast Loop benchmark

This benchmark checks whether deck-level batching and targeted repair reduce repeated production work. It is a deterministic runtime benchmark, not a claim about model inference, network latency, PowerPoint startup time, or every agent platform.

## Result

| Workflow | Five-slide wall time | Relative speed |
|---|---:|---:|
| Sequential loop | 55.187 s | 1.00× |
| Fast Loop | 11.353 s | 4.86× |

Fast Loop reduced wall time by **79.4%**. All five rendered PNG outputs were pixel-identical, and neither workflow produced an overflow failure.

## Method

- Scenario: five-slide AI asset-inventory management deck.
- Sequential baseline: five independent plan/generate/render rounds.
- Fast Loop: one deck specification validation followed by one batch render.
- Sequential round times: 11.161 s, 10.877 s, 10.851 s, 11.331 s, and 10.967 s.
- Fast Loop: 0.021 s validation plus 11.332 s batch run.
- Environment: same local runtime, same layout inputs, same output renderer.

## Interpretation

The result isolates workflow overhead. Actual end-to-end gains on WorkBuddy, ChatGPT, or another agentic platform will depend on model reasoning, queueing, network latency, file parsing, and presentation rendering. Reproduce the benchmark on your own workload before using the number in a production business case.
