# Wyszukiwanie alternatyw — plan implementacji

**Goal:** On-demand research alternatyw dla subskrypcji/powtarzalnych opłat z Tavily + AI + cache.

**Architecture:** `src/lib/research/` + `OpportunityResearch` + Server Action + rozszerzenie `OpportunityCard`.

## Taski

1. Prisma: model `OpportunityResearch` + migracja
2. `src/lib/research/` — config, normalize, query, tavily, run orchestrator
3. `src/lib/ai/synthesize-alternatives.ts` — Zod + prompt
4. `src/server/actions/research.ts`
5. `load-optimization-data` — include research
6. `ResearchAlternatives.tsx` + `OpportunityCard`
7. `.env.example` + README
8. Testy jednostkowe + `npm run check`
