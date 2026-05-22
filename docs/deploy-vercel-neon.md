# Deploy: Vercel + Neon Postgres

Checklist dla produkcji (hosted Postgres, bez własnego serwera DB).

## Wymagania wstępne

- Konto [Vercel](https://vercel.com) i [Neon](https://neon.tech)
- Repozytorium na GitHub/GitLab/Bitbucket
- Node.js 22+ (Vercel ustawia wersję w Project Settings → General)

## 1. Neon — baza danych

1. Utwórz projekt w Neon (region blisko użytkowników, np. `aws-eu-central-1`).
2. W **Connection details** włącz **Pooled connection** i skopiuj:
   - **Pooled** → `DATABASE_URL` (host zawiera `-pooler` lub `.pooler.neon.tech`)
   - **Direct** → `DIRECT_URL` (host bez poolera)
3. Do obu URL dodaj `?sslmode=require` (Neon wymaga SSL).

Przykład (wartości fikcyjne):

```env
DATABASE_URL="postgresql://user:pass@ep-abc-123-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-abc-123.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

**Dlaczego dwa URL?** Prisma na serverless (Vercel) używa pooled connection do zapytań runtime; `prisma migrate deploy` wymaga direct connection (migracje nie działają przez PgBouncer w trybie transaction).

## 2. Vercel — projekt

1. **Add New Project** → import repozytorium `analiza_wyciagow`.
2. Framework: **Next.js** (auto).
3. **Build Command** — domyślnie Vercel uruchomi skrypt `vercel-build` z `package.json`:

   ```bash
   prisma generate && prisma migrate deploy && next build
   ```

4. **Install Command** — `npm install` (domyślnie; `postinstall` uruchomi dodatkowo `prisma generate`).

Nie trzeba `vercel.json` — konfiguracja jest w `package.json`.

## 3. Zmienne środowiskowe (Vercel Dashboard)

**Settings → Environment Variables** — ustaw dla **Production** (i opcjonalnie Preview):

| Zmienna             | Wymagane | Uwagi                                                     |
| ------------------- | -------- | --------------------------------------------------------- |
| `DATABASE_URL`      | tak      | Neon **pooled** + `?sslmode=require`                      |
| `DIRECT_URL`        | tak      | Neon **direct** + `?sslmode=require`                      |
| `AUTH_SECRET`       | tak      | `openssl rand -base64 32` (min. 32 znaki)                 |
| `NEXTAUTH_URL`      | tak      | Pełny URL prod, np. `https://analiza-wyciagow.vercel.app` |
| `ANTHROPIC_API_KEY` | nie      | AI — kategoryzacja / insights                             |
| `OPENAI_API_KEY`    | nie      | alternatywa dla Anthropic                                 |
| `AI_PROVIDER`       | nie      | `anthropic` lub `openai`                                  |

Po pierwszym deployu zaktualizuj `NEXTAUTH_URL`, jeśli Vercel nada inną domenę niż zakładałeś.

## 4. Pierwszy deploy

1. Push na branch podłączony do Vercel (np. `main`).
2. Vercel buduje projekt; w logach buildu powinno być:
   - `prisma generate`
   - `prisma migrate deploy` (stosuje `prisma/migrations/*`)
   - `next build`
3. Otwórz URL produkcji → rejestracja / logowanie.

### Błędy buildu — typowe

| Objaw                    | Przyczyna                      | Działanie                              |
| ------------------------ | ------------------------------ | -------------------------------------- |
| `migrate deploy` timeout | Zły `DIRECT_URL` lub brak SSL  | Sprawdź direct URL i `sslmode=require` |
| P1001 / connection       | Zły pooled URL                 | Użyj connection string z Neon „Pooled” |
| Auth redirect loop       | `NEXTAUTH_URL` ≠ faktyczny URL | Ustaw dokładny HTTPS URL z Vercel      |

## 5. Opcjonalnie: dane demo

Lokalnie (jednorazowo), z produkcyjnym `DATABASE_URL` w shellu — **nie** commituj `.env` z sekretami:

```bash
export DATABASE_URL="postgresql://..."  # pooled lub direct do seed
export DIRECT_URL="postgresql://..."    # jeśli skrypt używa Prismy z migracjami
npm run demo:seed
```

Albo uruchom seed z Neon SQL Editor / własnego CI z secretami w vault.

## 6. Lokalny dev vs produkcja

|                | Lokalnie                  | Vercel + Neon         |
| -------------- | ------------------------- | --------------------- |
| `DATABASE_URL` | `localhost:5432`          | pooled Neon           |
| `DIRECT_URL`   | ten sam co `DATABASE_URL` | direct Neon           |
| `NEXTAUTH_URL` | `http://localhost:3000`   | `https://…vercel.app` |

Skopiuj `.env.example` → `.env` i uzupełnij wartości lokalne.

## 7. CI (GitHub Actions)

Workflow `.github/workflows/ci.yml` używa lokalnego Postgresa w service — bez zmian dla Neon. Produkcja = tylko Vercel env vars.

## 8. Weryfikacja przed deployem

```bash
npm run build
npm test
```

Test integracyjny (`tests/integration/`) pomija się bez `DATABASE_URL`.
