# Spec: Optymalizacja budżetu

**Data:** 2026-05-22  
**Status:** Zatwierdzony do implementacji  
**Zależności:** MVP analytics, roadmap v1.1 (bulk kategoryzacja zalecana przed produkcją)

---

## Cel

Para z JDG identyfikuje konkretne możliwości oszczędności, ustawia limity per kategoria, wdraża zmiany i weryfikuje efekt w kolejnym okresie — bez polegania wyłącznie na tekście AI.

## Typy możliwości

| Typ              | Reguła                                                     | Szacowane oszczędności |
| ---------------- | ---------------------------------------------------------- | ---------------------- |
| `RECURRING`      | Ten sam kontrahent, kwota ±5%, min. 3 wystąpienia w 90 dni | średnia miesięczna     |
| `SUBSCRIPTION`   | RECURRING + odstęp 28–35 dni lub słowa kluczowe            | jak wyżej              |
| `ANOMALY`        | Wydatek > 3× mediana kategorii (6 mies.)                   | kwota − mediana        |
| `MERCHANT_SPIKE` | Top merchant, wzrost m/m > 50% i > 200 PLN                 | bieżący − poprzedni    |
| `BUDGET_OVERRUN` | Suma kategorii > limit miesięczny                          | actual − limit         |

## Model danych

- `OptimizationOpportunity` — wykryte możliwości ze statusem OPEN / ACKNOWLEDGED / IMPLEMENTED / DISMISSED
- `CategoryBudget` — limit miesięczny per kategoria i kontekst firma/dom/razem

## UI

- `/optimize` — lista możliwości, edytor budżetów, sekcja wdrożonych
- Dashboard — widget top 3 możliwości + link

## Kryteria akceptacji

- Po 3 miesiącach importu i >80% kategorii: widoczne możliwości z kwotami
- Limit kategorii → alert BUDGET_OVERRUN przy przekroczeniu
- IMPLEMENTED → follow-up badge „Działa” gdy spend spadł >10% po 30 dniach
- AI insights respektują kontekst firma/dom

---

_Plan implementacji: `docs/superpowers/plans/2026-05-22-budget-optimization.md`_
