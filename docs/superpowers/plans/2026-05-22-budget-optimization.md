# Optymalizacja budżetu — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Pełny cykl optymalizacji — wykrywanie, limity, śledzenie wdrożenia.

**Architecture:** Silnik deterministyczny w `src/lib/optimization/` + Prisma + `/optimize` + widget dashboard.

**Tech Stack:** Next.js 15, Prisma 6, Zod, Vitest, Playwright.

Szczegóły zadań: plik planu w `.cursor/plans/` (źródło) oraz spec `docs/superpowers/specs/2026-05-22-budget-optimization.md`.

## Taski

1. Task 0 — monthly-trend + spec
2. Task 1 — Prisma migration
3. Task 2 — recurring + subscriptions
4. Task 3 — anomalies + merchant spikes
5. Task 4 — orchestrator + upsert
6. Task 5 — server actions
7. Task 6 — UI /optimize
8. Task 7 — dashboard widget + scoped AI
9. Task 8 — follow-up verification
10. Task 9 — README + check
