# AI Insights v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wybór providera AI per workspace, poprawne analizy bez transferów wewnętrznych i wykluczonych kategorii, historia analiz z formatowaniem markdown, przejrzysty opis „Kategoryzuj AI” i dopracowane prompty.

**Architecture:** Rozszerzenie `Workspace` o preferencję providera i listę wykluczonych kategorii; nowa tabela `AiInsight` jako historia. Warstwa `src/lib/ai/` buduje zestaw transakcji do analizy przez `shouldCountInAnalytics` + wykluczenia — ten sam filtr co dashboard. UI: panel AI na dashboardzie + sekcja w ustawieniach.

**Tech Stack:** Next.js 15, Prisma/Postgres, Zod, istniejący `completeWithAi`, Vitest.

---

## Pliki (mapa)

| Plik                                             | Odpowiedzialność                          |
| ------------------------------------------------ | ----------------------------------------- |
| `prisma/schema.prisma`                           | `AiInsight`, pola workspace               |
| `src/lib/ai/resolve-workspace-ai.ts`             | Provider z env + preferencja workspace    |
| `src/lib/ai/filter-insight-transactions.ts`      | Transfery + wykluczone kategorie          |
| `src/lib/ai/prompts/categorization.ts`           | System prompt kategoryzacji               |
| `src/lib/ai/prompts/insights.ts`                 | System prompt analizy                     |
| `src/lib/ai/describe-ai-categorization.ts`       | Opis działania „Kategoryzuj AI”           |
| `src/lib/ai/save-ai-insight.ts`                  | Zapis rekordu historii                    |
| `src/lib/ai/load-ai-insight-history.ts`          | Lista ostatnich analiz                    |
| `src/components/ai/MarkdownInsight.tsx`          | Render markdown bez nowej zależności      |
| `src/components/dashboard/AiPanel.tsx`           | Provider, historia, podgląd kategoryzacji |
| `src/components/settings/AiAnalysisSettings.tsx` | Wykluczenia kategorii                     |
| `src/server/actions/ai-settings.ts`              | Mutacje ustawień AI                       |

## Dodatkowe funkcje (poza spec)

- Podgląd przed „Kategoryzuj AI” (liczba, przykłady, zasady)
- Kopiuj analizę do schowka
- Notatka w analizie o odfiltrowanych transferach i kategoriach

---

### Task 1: Schema i migracja

**Files:** `prisma/schema.prisma`, `prisma/migrations/.../migration.sql`

- [ ] Dodać enum `AiProviderPreference`, model `AiInsight`, pola workspace
- [ ] Migracja + backfill `lastAiInsight` → pierwszy `AiInsight`

### Task 2: Filtr transakcji do analizy

**Files:** `src/lib/ai/filter-insight-transactions.ts`, `tests/lib/ai/filter-insight-transactions.test.ts`

- [ ] Test: pary transferów i wykluczone kategorie nie trafiają do wyniku
- [ ] Implementacja z `shouldCountInAnalytics` + `excludedCategoryIds`

### Task 3: Prompty i resolve config

**Files:** `src/lib/ai/prompts/*.ts`, `src/lib/ai/resolve-workspace-ai.ts`, aktualizacja `categorize-batch.ts`, `generate-insights.ts`

- [ ] Prompty: JSON-only kategoryzacja, markdown analiza, zakaz halucynacji kwot
- [ ] `getAiConfigForWorkspace(workspaceId)` respektuje preferencję

### Task 4: Server actions

**Files:** `src/server/actions/ai.ts`, `src/server/actions/ai-settings.ts`

- [ ] `aiGenerateInsights` zapisuje `AiInsight`, filtruje dane
- [ ] `getAiCategorizePreview`, `updateAiProvider`, `updateAnalysisExclusions`

### Task 5: UI

**Files:** komponenty AI panel + settings, `dashboard/page.tsx`, `settings/page.tsx`

- [ ] Provider select, historia analiz, markdown render, ustawienia wykluczeń

### Task 6: Weryfikacja i deploy

- [ ] `npm run check`
- [ ] commit, push, Vercel production
