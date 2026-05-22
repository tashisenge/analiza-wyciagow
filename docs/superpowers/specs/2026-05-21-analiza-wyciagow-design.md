# Spec: Analiza wyciągów — aplikacja do zrozumienia wydatków (firma + dom)

**Data:** 2026-05-21  
**Status:** Zatwierdzony kierunek (Podejście 1 — monolit webowy)  
**Użytkownicy:** Para + JDG, wspólny workspace, oboje edytują kategorie

---

## 1. Problem i cel

Para prowadząca JDG i budżet domowy nie rozumie **struktury wydatków** ani **własnych zachowań zakupowych**. Dane są w mBanku, ale brak jednego miejsca, które łączy:

- konto **firmowe** i **domowe**,
- widok dla **obojga** partnerów,
- analizę pod kątem **optymalizacji nawyków** (nie księgowości podatkowej).

**Cel produktu:** Po imporcie 2–3 miesięcy wyciągów użytkownicy widzą, gdzie idą największe pieniądze (firma vs dom), którzy merchantowie dominują, i mogą świadomie zmienić 1–2 nawyki.

**Poza zakresem MVP:** JPK, eksport do Symfonii/wFirma, pełna księgowość, budżety z limitami (możliwe w v1.2).

---

## 2. Decyzje produktowe (z warsztatu)

| Obszar        | Decyzja                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| Segment       | Freelancer / JDG + gospodarstwo domowe (małżeństwo)                      |
| Bank          | mBank (oboje); import **CSV** na start                                   |
| Konta         | Typ `firma` \| `dom`; dashboard z przełącznikiem **firma / dom / razem** |
| Użytkownicy   | 2 osoby, 1 workspace, te same uprawnienia, oboje korygują kategorie      |
| Platforma     | Aplikacja webowa w chmurze (desktop + mobile browser)                    |
| Priorytet MVP | Kategoryzacja + wykresy kategorii (A) + top merchantów (B)               |
| Później       | Wpadki, subskrypcje, powtarzalne kwoty (C); Open Banking (v2)            |
| Architektura  | Monolit (Next.js + PostgreSQL) — Podejście 1                             |

---

## 3. Analiza konkurencji (rynek PL i benchmarki)

### 3.1 Polskie aplikacje PFM

#### Kontomierz ([kontomierz.pl](https://kontomierz.pl/))

- Automatyczny import z wielu banków (w tym mBank), plan Pro ~24,99 PLN/mies.
- Kategoryzacja, własne kategorie, tagi, planer budżetu, wykres cashflow.
- **Luka względem nas:** brak widoku **JDG + dom** w jednym produkcie pod kątem nawyków; focus na finanse osobiste, nie para+firma.

#### EasyBudget ([easybudget.pl](https://www.easybudget.pl/funkcje/))

- Import **CSV** (mBank, PKO, ING i inne), współdzielenie budżetu dla pary.
- Statystyki: trendy, udział kategorii; metoda kopertowa.
- **Luka:** wyłącznie budżet domowy, brak kontekstu firmowego.

#### Nasze Finanse ([tamart.pl](https://tamart.pl/))

- Open Banking (PSD2), AI kategoryzacja, wspólny budżet, limity per kategoria, eksport CSV.
- **Luka:** gospodarstwo domowe, nie JDG + przełącznik firma/dom.

#### Open Banking (ekosystem)

Aplikacje typu Martia, Finansomat, Freenance, Kontomatik — dostęp do kont przez PSD2 (odczyt, bez hasła w aplikacji). To głównie **synchronizacja**, nie dedykowany UX „zmiana zachowań + firma/dom”.

### 3.2 Księgowość JDG (inny segment)

| Produkt | Profil                                    |
| ------- | ----------------------------------------- |
| inFakt  | Koszty, faktury, księgowanie — compliance |
| wFirma  | KPiR, księgowanie wydatków — compliance   |

**Wniosek:** Rozwiązują obowiązek podatkowy, nie mapę zachowań zakupowych. W naszym produkcie eksport księgowy pozostaje poza MVP.

### 3.3 Benchmarki zagraniczne

| Aplikacja     | Istotne dla nas                                |
| ------------- | ---------------------------------------------- |
| YNAB          | Zmiana nawyków, metoda „każda złotówka ma cel” |
| Monarch Money | Para, agregacja kont                           |
| Copilot       | Auto-kategoryzacja, UX                         |

Brak integracji z polskimi bankami i JDG w jednym modelu firma+dom.

### 3.4 Self-hosted

Firefly III, Actual Budget — możliwe technicznie, ale wysoki koszt utrzymania i słabszy UX dla pary bez dedykowanego produktu.

### 3.5 Mapa pozycjonowania

```
                    DOM (para)     FIRMA (JDG)     ZMIANA NAWYKÓW
Kontomierz          ████████       ░░░░░░░░        ██████░░
EasyBudget          ████████       ░░░░░░░░        ███████░
Nasze Finanse       ████████       ░░░░░░░░        ████████
inFakt / wFirma     ░░░░░░░░       ████████        ██░░░░░░
Nasza aplikacja     ████████       ████████        ████████  ← nisza
```

**Nisza produktowa:** jeden dashboard **firma / dom / razem**, para ze wspólną edycją, **mBank CSV** na start, focus na optymalizację zachowań (nie księgowość).

### 3.6 Inspiracje przeniesione do roadmapy

| Z rynku                                    | MVP | Później     |
| ------------------------------------------ | --- | ----------- |
| Auto-kategoryzacja + nauka z korekt        | Tak | —           |
| Współdzielenie (1 subskrypcja / workspace) | Tak | —           |
| Import CSV mBank                           | Tak | —           |
| Top merchant + trendy m/m                  | Tak | —           |
| Limity budżetowe / alerty                  | Nie | v1.2        |
| Open Banking (np. 4×/dzień)                | Nie | v2          |
| Wpadki / subskrypcje                       | Nie | v1.1        |
| Asystent głosowy / AI                      | Nie | opcjonalnie |

---

## 4. Architektura

```
[Przeglądarka] → [Next.js app]
                    ├── UI (dashboard, import, kategorie)
                    ├── API (REST lub Server Actions)
                    └── Auth (sesja, 2 konta)
                          ↓
                    [PostgreSQL]
```

- **Jeden workspace** na parę/JDG: wspólna baza transakcji.
- **Deploy:** chmura (np. Vercel + PostgreSQL zarządzany; szczegóły przy implementacji).
- **Język UI:** polski.

### Stack (propozycja)

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma
- Auth: Auth.js (credentials lub magic link)
- Wykresy: Recharts lub Chart.js
- Parser: `lib/mbank-csv.ts` — format **Lista operacji** mBank
- Testy: Vitest (≥95% `src/lib/`), Playwright E2E; `npm run test:watch` na co dzień
- Jakość: ESLint strict + Prettier + Husky (`docs/testing-strategy.md`)

### Format CSV mBank (Lista operacji)

Nagłówek danych: `#Data operacji;#Opis operacji;#Rachunek;#Kategoria;#Kwota;`  
Kwoty: `-13,38 PLN`. Fixture: `tests/fixtures/mbank-sample.csv`. Prawdziwe pliki w `.gitignore`.

---

## 5. Model danych

| Encja               | Opis                                                                            |
| ------------------- | ------------------------------------------------------------------------------- |
| **User**            | Konto logowania                                                                 |
| **Workspace**       | Wspólna przestrzeń (para + JDG)                                                 |
| **WorkspaceMember** | User ↔ Workspace                                                                |
| **Account**         | Konto bankowe: `firma` \| `dom`, nazwa, opcjonalny alias                        |
| **Transaction**     | Data, kwota, waluta, opis, kontrahent, account_id, category_id, import_batch_id |
| **Category**        | Np. Żywność, Transport, KUP, ZUS, Rozrywka (płaskie drzewo w MVP)               |
| **CategoryRule**    | Tekst w opisie/kontrahencie → kategoria                                         |
| **ImportBatch**     | Plik, data, statystyki (nowe / pominięte duplikaty)                             |

**Duplikaty:** hash `(data, kwota, opis, account_id)` — ponowny import tego samego pliku nie dubluje wpisów.

**Widok „razem”:** agregacja transakcji z kont `firma` + `dom` (sumy i trendy; kategorie bez mieszania logiki podatkowej).

---

## 6. Przepływy

### 6.1 Import CSV (mBank)

1. Wybór konta (`firma` / `dom`) i upload pliku.
2. Parser formatu mBank (jeden szablon w MVP).
3. Zapis nowych transakcji; duplikaty pomijane z raportem.
4. Auto-kategoryzacja (reguły + pamięć kontrahenta).

### 6.2 Kategoryzacja

1. **Reguły użytkownika** (najwyższy priorytet).
2. **Pamięć kontrahenta:** po ręcznej korekcie — kolejne transakcje tego kontrahenta dostają tę samą kategorię (auto, z możliwością cofnięcia w UI).
3. **Nieskategoryzowane:** osobna lista „do ogarnięcia”.

### 6.3 Dashboard (MVP)

- Filtry: firma / dom / razem + zakres dat (miesiąc, kwartał, rok).
- **A:** wykres kategorii, porównanie miesiąc do miesiąca, suma wydatków vs wpływy.
- **B:** top 10–20 merchantów, zmiana % vs poprzedni okres.
- **Tabela transakcji:** filtry, inline zmiana kategorii.

### 6.4 v1.1 — Insight „C”

- Transakcje powtarzalne (kwota ± tolerancja).
- Subskrypcje (cykliczne, podobny merchant).
- Wpadki: kwoty > N× mediana kategorii lub nietypowy merchant.

### 6.5 v2 — Open Banking

- Synchronizacja mBank przez PSD2 zamiast ręcznego CSV (po stabilnym MVP i ocenie kosztów/licencji AISP).

---

## 7. Ekrany (MVP)

1. **Logowanie / rejestracja** + zaproszenie drugiego użytkownika do workspace.
2. **Dashboard** — przełącznik firma/dom/razem + wykresy A+B.
3. **Transakcje** — lista, filtry, edycja kategorii.
4. **Import** — upload CSV, podsumowanie.
5. **Kategorie i reguły** — CRUD kategorii, reguły tekstowe.
6. **Ustawienia** — konta bankowe, członkowie workspace.

---

## 8. Jakość kodu i testy

Szczegóły: `docs/testing-strategy.md`, reguły Cursor: `.cursor/rules/code-readability.mdc`, `.cursor/rules/testing.mdc`.

| Warstwa       | Narzędzie                                | Próg                     |
| ------------- | ---------------------------------------- | ------------------------ |
| Unit          | Vitest                                   | `src/lib/**` ≥ 95% lines |
| Integracja    | Vitest + DB testowa                      | actions ≥ 85%            |
| E2E           | Playwright                               | login, import, dashboard |
| Częstotliwość | `test:watch`, `test:changed`, pre-commit | przy każdej zmianie      |

Komenda przed merge: `npm run check` (format + lint + typecheck + coverage).

## 9. Bezpieczeństwo i RODO

- HTTPS, hasła hashowane (bcrypt/argon2), sesje httpOnly.
- Dane izolowane per workspace.
- Hosting preferowany w UE.
- Eksport i usunięcie wszystkich danych użytkownika (prawo do usunięcia).
- Brak sprzedaży danych / analytics third-party w MVP.

---

## 10. Roadmapa

| Faza     | Zakres                                                                               |
| -------- | ------------------------------------------------------------------------------------ |
| **MVP**  | mBank CSV, firma+dom+razem, 2 użytkowników, reguły + pamięć kontrahenta, wykresy A+B |
| **v1.1** | Wpadki, subskrypcje, powtarzalne (C)                                                 |
| **v1.2** | Budżety / cele oszczędnościowe per kategoria (opcjonalnie)                           |
| **v2**   | Open Banking mBank                                                                   |
| **v3+**  | Inne banki, rola „tylko odczyt” dla księgowej, sugestie AI                           |

---

## 11. Kryteria sukcesu MVP

- [ ] Import min. 2 miesięcy wyciągów z mBank (firma i dom) bez duplikatów.
- [ ] > 80% transakcji ma kategorię (auto lub ręcznie) po pierwszym tygodniu użytkowania.
- [ ] Para potrafi w 5 minut odpowiedzieć: „na co wydajemy najwięcej” w obu kontekstach.
- [ ] Zidentyfikowany min. 1 merchant lub kategoria do świadomej optymalizacji.

---

## Źródła (analiza konkurencji)

- [Kontomierz](https://kontomierz.pl/)
- [EasyBudget — funkcje](https://www.easybudget.pl/funkcje/)
- [Nasze Finanse / tamart](https://tamart.pl/)
- [Open Banking w Polsce — Martia](https://martia.ai/open-banking-polska-co-to-jest)
- [Firefly III](https://www.firefly-iii.org/)
- [inFakt — pomoc](https://pomoc.infakt.pl/)
- [wFirma — księgowanie wydatków](https://pomoc.wfirma.pl/-ksiegowanie-wydatkow)

---

_Następny krok po akceptacji speca: plan implementacji (`writing-plans`)._
