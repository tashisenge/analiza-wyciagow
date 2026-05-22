# Import wyciągów mBank

---

## Eksport z mBanku

1. Zaloguj się do mBanku (web lub aplikacja).
2. **Finanse** → **Zestawienie operacji**.
3. Ustaw zakres dat (zalecane: pełne miesiące, min. 2–3 miesiące przy pierwszym użyciu).
4. **Eksport** → format **CSV** („Lista operacji”).

Pliki `lista_operacji*.csv` zawierają dane osobowe — **nie commituj** ich do repozytorium (są w `.gitignore`).

---

## Import w aplikacji

1. **Import** w menu.
2. Wybierz **konto** (firma lub dom) — musi być wcześniej dodane w Ustawieniach.
3. Prześlij plik CSV.
4. Po imporcie zobaczysz podsumowanie: ile nowych transakcji, ile pominiętych (duplikaty).

Możesz importować **nakładające się okresy** — duplikaty są pomijane na podstawie hash transakcji.

---

## Co się dzieje po imporcie

1. Parser rozpoznaje kolumny mBank (`src/lib/mbank-csv.ts`).
2. Dla każdego wiersza liczony jest `dedupeHash` — jeśli już istnieje w workspace, wiersz jest pominięty.
3. Kategoria przypisywana kolejno:
   - reguły użytkownika (najwyższy priorytet),
   - pamięć kontrahenta,
   - mapowanie 1:1 nazwy kategorii mBank,
   - opcjonalnie AI (batch na dashboardzie).

---

## Format CSV (MVP)

Aplikacja obsługuje jeden szablon mBank „Lista operacji”. Fixture testowy: `tests/fixtures/mbank-sample.csv`.

Wymagane kolumny (nazwy z eksportu mBank):

- data operacji,
- kwota,
- opis / tytuł,
- kontrahent (jeśli dostępny),
- kategoria mBank (opcjonalnie).

Przy zmianie formatu przez bank — zaktualizuj parser i fixture testowy.

---

## Typowe problemy

| Problem               | Rozwiązanie                                              |
| --------------------- | -------------------------------------------------------- |
| „0 nowych transakcji” | Plik już importowany — sprawdź zakres dat lub inne konto |
| Zła kategoria         | Reguła tekstowa lub ręczna korekta + pamięć kontrahenta  |
| „Bez kategorii”       | Mapowanie mBank 1:1 lub AI batch na dashboardzie         |
| Błąd parsowania       | Sprawdź, czy to CSV „Lista operacji”, nie inny eksport   |

---

## Dla deweloperów

- Server Action: `importCsv` w `src/server/actions/import.ts`
- Logika: `processCsvImport` w `src/lib/import/process-csv-import.ts`
- Testy: `tests/lib/mbank-csv.test.ts`, `tests/integration/import-flow.test.ts`
