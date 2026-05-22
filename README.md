# Analiza wyciągów

Aplikacja do zrozumienia wydatków (firma + dom) na podstawie eksportów mBank.

## Dokumentacja

**Indeks:** [`docs/README.md`](docs/README.md) — przewodnik użytkownika, architektura, model danych, deploy.

| Temat                   | Link                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Przewodnik użytkownika  | [`docs/user-guide.md`](docs/user-guide.md)                                                                                     |
| Optymalizacja budżetu   | [`docs/optimization.md`](docs/optimization.md)                                                                                 |
| Przewodnik deweloperski | [`docs/developer-guide.md`](docs/developer-guide.md)                                                                           |
| Architektura            | [`docs/architecture.md`](docs/architecture.md)                                                                                 |
| Model danych            | [`docs/data-model.md`](docs/data-model.md)                                                                                     |
| Import mBank            | [`docs/import-mbank.md`](docs/import-mbank.md)                                                                                 |
| Deploy Vercel + Neon    | [`docs/deploy-vercel-neon.md`](docs/deploy-vercel-neon.md)                                                                     |
| Testy                   | [`docs/testing-strategy.md`](docs/testing-strategy.md)                                                                         |
| Spec produktu           | [`docs/superpowers/specs/2026-05-21-analiza-wyciagow-design.md`](docs/superpowers/specs/2026-05-21-analiza-wyciagow-design.md) |

## Wymagania

- Node.js 22+
- PostgreSQL (lokalnie: `npm run db:up` lub własna instancja)

## Deploy na Vercel + Neon

Krótka ścieżka (szczegóły: [`docs/deploy-vercel-neon.md`](docs/deploy-vercel-neon.md)):

1. **Neon** — utwórz projekt Postgres; skopiuj **pooled** `DATABASE_URL` i **direct** `DIRECT_URL` (oba z `?sslmode=require`).
2. **Vercel** — import repozytorium; framework Next.js wykryty automatycznie.
3. **Zmienne środowiskowe** (Production + Preview):

   | Zmienna                                | Opis                                |
   | -------------------------------------- | ----------------------------------- |
   | `DATABASE_URL`                         | Neon pooled (`.pooler.neon.tech`)   |
   | `DIRECT_URL`                           | Neon direct (migracje)              |
   | `AUTH_SECRET`                          | `openssl rand -base64 32`           |
   | `NEXTAUTH_URL`                         | `https://<twoja-domena>.vercel.app` |
   | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | opcjonalnie                         |
   | `TAVILY_API_KEY`                       | opcjonalnie (alternatywy /optimize) |

4. **Deploy** — build uruchamia `vercel-build`: `prisma generate` → `prisma migrate deploy` → `next build`.
5. **Opcjonalnie** — po pierwszym deployu: `npm run demo:seed` lokalnie z produkcyjnym `DATABASE_URL` (nie commituj sekretów).

Lokalnie skopiuj `.env.example` → `.env` i ustaw `DIRECT_URL` na ten sam URL co `DATABASE_URL`.

## Komendy

```bash
npm install
npm run test:watch    # podczas pracy — uruchamiaj ciągle
npm run test:changed  # tylko testy powiązane ze zmianami
npm run test          # pełny suite (Vitest)
npm run test:smoke    # E2E: brak 500 na kluczowych stronach (wymaga DB + demo:seed)
npm run test:coverage # z progami coverage (fail poniżej 80% / 95% lib)
npm run check         # format + lint + typecheck + coverage
```

## AI (Claude / ChatGPT)

W `.env` ustaw jeden z kluczy:

```env
ANTHROPIC_API_KEY=sk-ant-...
# lub
OPENAI_API_KEY=sk-...
# AI_PROVIDER=anthropic   # opcjonalnie: wymusza provider
```

Na dashboardzie:

- **Przypisz kategorie mBank** — darmowe, bez API (nazwy 1:1 z eksportu mBank, np. „Żywność i chemia domowa”)
- **Kategoryzuj AI** — batch do 100 transakcji bez kategorii
- **Analiza AI** — tekstowy raport „co widać / co optymalizować” za bieżący miesiąc (w kontekście firma/dom/razem z dashboardu)

## Optymalizacja budżetu (`/optimize`)

Deterministyczne wykrywanie możliwości oszczędności (nie tylko AI):

- **Powtarzalne / subskrypcje** — ten sam kontrahent, podobna kwota
- **Wpadki** — wydatek > 3× mediana kategorii
- **Skoki merchantów** — wzrost m/m > 50%
- **Przekroczenia budżetu** — limity per kategoria (firma/dom/razem)

Na stronie **Optymalizacja**: odśwież możliwości, oznacz jako wdrożone/odrzucone, ustaw limity kategorii. Dashboard pokazuje top 3 możliwości i alerty budżetowe.

### Alternatywy z internetu (subskrypcje / powtarzalne)

Przy możliwości typu subskrypcja lub powtarzalna opłata: przycisk **Szukaj alternatyw** (Tavily + synteza AI). Wymaga w `.env`:

```env
TAVILY_API_KEY=tvly-...
ANTHROPIC_API_KEY=...   # lub OPENAI_API_KEY
```

Wynik jest cache’owany 30 dni; limit 10 nowych wyszukiwań na workspace dziennie. Spec: `docs/superpowers/specs/2026-05-22-savings-web-research.md`.

## Logowanie błędów

Błędy serwera trafiają na **stderr** jako JSON (jedna linia = jeden wpis), np.:

```json
{
  "ts": "2026-05-21T12:00:00.000Z",
  "level": "error",
  "msg": "import.csv",
  "workspaceId": "…",
  "err": { "name": "Error", "message": "…" }
}
```

Pola `msg`: `import.csv`, `auth.login.failed`, `auth.register`, `ai.categorize`, `ai.insights`, `ai.api.openai`, `transactions.updateCategory`, itd.

W dev: patrz terminal `npm run dev`. Nie logujemy haseł ani kluczy API.

## Dev server — błędy Turbopack / CSS

Domyślnie: `npm run dev` (Webpack). Szybszy wariant: `npm run dev:turbo`.

Jeśli widzisz **FATAL: Turbopack error** na `globals.css` lub `Cannot find module '.next/postcss.js'` — cache `.next` jest uszkodzony (często po `npm run build` przy włączonym dev):

```bash
# zatrzymaj wszystkie next dev (Ctrl+C), potem:
rm -rf .next
npm run dev
```

Nie uruchamiaj `build` i `dev` jednocześnie na tym samym katalogu. Jedna instancja na porcie 3000.

## Internal Server Error (dev)

Jeśli przy `npm run dev` widzisz **Internal Server Error** na stronach, zwykle wystarczy ten sam reset:

```bash
rm -rf .next && npm run dev
```

Błędne hasło przy logowaniu pokazuje komunikat na stronie — nie 500.

## Import mBank

Eksport: **Finanse → Zestawienie operacji → CSV** (format „Lista operacji”).

Pliki `lista_operacji*.csv` zawierają dane osobowe — są w `.gitignore`. Do testów używaj `tests/fixtures/mbank-sample.csv`.

## Jakość kodu

- ESLint strict: `eslint.config.mjs` (complexity ≤8, max 25 linii/funkcja, max 200 linii/plik)
- Prettier: `.prettierrc`
- Husky: przed commitem `lint-staged` + testy powiązane z plikiem
- Reguły Cursor: `.cursor/rules/`
