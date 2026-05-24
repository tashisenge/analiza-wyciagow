# Przewodnik użytkownika

Aplikacja **Analiza wyciągów** łączy wydatki z konta **firmowego** i **domowego** mBank w jednym miejscu. Nie zastępuje księgowości — pomaga zobaczyć, na co idą pieniądze i co można zmienić.

---

## 1. Pierwsze kroki

1. **Zarejestruj się** na `/register` lub zaloguj, jeśli partner już utworzył workspace.
2. W **Ustawieniach** dodaj konta bankowe: typ **firma** lub **dom** (np. „mBank firma”, „mBank dom”).
3. **Zaimportuj wyciągi** — minimum 2–3 miesiące, żeby trendy i optymalizacja miały sens.
4. **Przypisz kategorie** — na dashboardzie użyj „Przypisz kategorie mBank” lub popraw ręcznie na liście transakcji.

---

## 2. Import wyciągów mBank

1. W mBanku: **Finanse → Zestawienie operacji → Eksport CSV** (format „Lista operacji”).
2. W aplikacji: **Import** → wybierz konto (firma/dom) → prześlij plik.
3. Duplikaty z poprzednich importów są **pomijane** — możesz bezpiecznie importować nakładające się okresy.

Więcej: [import-mbank.md](import-mbank.md).

---

## 3. Dashboard

Przełącznik **firma / dom / razem** filtruje wszystkie liczby i wykresy.

| Element               | Co pokazuje                                            |
| --------------------- | ------------------------------------------------------ |
| Karty KPI             | Wydatki, wpływy, bilans + zmiana % vs poprzedni okres  |
| Wykres kategorii      | Udział wydatków w slice’ach                            |
| Top kontrahenci       | Najwięksi odbiorcy pieniędzy, zmiana m/m               |
| Baner „bez kategorii” | Ile transakcji wymaga ręcznego ogarnięcia              |
| Widget optymalizacji  | Top 3 możliwości oszczędności + link do pełnej listy   |
| Wydatki opcjonalne    | Suma „głupot”, udział w wydatkach, limit miesięczny    |
| Panel AI              | Mapowanie mBank, batch kategoryzacji, analiza tekstowa |

**Zakres dat:** miesiąc / kwartał / rok (przełącznik nad wykresami).

---

## 4. Transakcje

- Lista do **200** ostatnich pozycji (filtr kontekstu firma/dom/razem).
- Kliknij kategorię w wierszu, aby ją zmienić — aplikacja **zapamięta kontrahenta** na przyszłość.
- Filtry w URL: brak kategorii, kategoria, kontrahent (link z kart optymalizacji).

---

## 5. Kategorie i reguły

Na stronie **Kategorie**:

- **Dodaj kategorię** — własna nazwa i kolor.
- **Wydatek opcjonalny** — checkbox przy kategorii; wydatki z tej kategorii trafiają do raportu na `/opcjonalne` (domyślnie włączone dla „Rozrywka”).
- **Reguła** — np. pole „Opis” zawiera „LIDL” → kategoria „Żywność”.
- Reguły mają **wyższy priorytet** niż pamięć kontrahenta i mapowanie mBank.

### Wydatki opcjonalne (para, jeden workspace)

1. Na **Kategorie** zaznacz, które kategorie są opcjonalne (np. Rozrywka, Restauracje).
2. Na **Opcjonalne** (`/opcjonalne`) ustaw **limit miesięczny** dla kontekstu firma/dom/razem.
3. Co miesiąc: dashboard → widget „Wydatki opcjonalne” → szczegóły → jedna wspólna decyzja, co ograniczyć.
4. Aplikacja **nie rozdziela** wydatków na osoby — to jeden wspólny widok. Jeśli chcecie oznaczać „kto”, użyjcie **tagów** (np. `Adam`, `Żona`) na transakcjach.
5. Filtr **Tylko opcjonalne** na liście transakcji: przycisk „Opcjonalne” lub `/transactions?discretionary=1`.
6. **Kto wydał:** na transakcjach przypisz tag **Adam** lub **Żona** (tworzone automatycznie) — filtry na liście transakcji.
7. **Analiza AI** uwzględnia teraz sekcję o wydatkach opcjonalnych i limicie (jeśli ustawiony).
8. Przy **przekroczeniu limitu** zobaczycie żółty alert na dashboardzie i na `/opcjonalne`.

Kolejność przypisania kategorii przy imporcie:

1. Reguły użytkownika
2. Pamięć kontrahenta (po Twojej ręcznej korekcie)
3. Mapowanie 1:1 z kategorią mBank
4. AI batch (transakcje bez sensownej kategorii)

---

## 6. Optymalizacja budżetu

Strona **Optymalizacja** (`/optimize`) — szczegóły w [optimization.md](optimization.md).

W skrócie:

1. Kliknij **Odśwież możliwości** — system wykryje powtarzalne opłaty, wpadki, skoki wydatków i przekroczenia limitów.
2. Przejrzyj listę z **szacowanymi oszczędnościami** (PLN/mies.).
3. Ustaw **limity per kategoria** — przy przekroczeniu pojawi się alert.
4. Oznacz kartę jako **Wdrożone** lub **Odrzuć** — wdrożone można zweryfikować po ~30 dniach (badge „Działa”).

Dla subskrypcji i opłat powtarzalnych: **Szukaj alternatyw** (wymaga kluczy API w `.env` u administratora).

---

## 7. AI — co robi, a czego nie

| Funkcja                 | Koszt API         | Opis                                                              |
| ----------------------- | ----------------- | ----------------------------------------------------------------- |
| Mapowanie mBank 1:1     | brak              | Kopiuje nazwę kategorii z banku do aplikacji                      |
| Kategoryzuj AI          | tak               | Max 100 transakcji bez kategorii na raz                           |
| Analiza AI              | tak               | Krótki raport markdown za bieżący miesiąc (kontekst z dashboardu) |
| Alternatywy z internetu | tak (Tavily + AI) | Tylko na wybranych kartach w optymalizacji                        |

AI **uzupełnia** listę możliwości — główne liczby i alerty pochodzą z reguł deterministycznych (powtarzalne, mediany, limity).

---

## 8. Wspólny workspace (para)

- Jedno **workspace** na parę; oboje mają te same uprawnienia.
- Zmiany kategorii i importów są **widoczne dla obu**.
- Kod zaproszenia: w ustawieniach workspace (drugi użytkownik rejestruje się i dołącza).

---

## 9. Eksport danych

Endpoint `/api/export/csv` (po zalogowaniu) — pełny eksport transakcji workspace do CSV.

---

## 10. Typowe pytania

**Dlaczego mało możliwości oszczędności?**  
Sprawdź pokrycie kategoriami (baner na dashboardzie). Poniżej ~80% mediana i subskrypcje są zawodne.

**Czy to księgowość do ZUS/US?**  
Nie. To narzędzie do **nawyków i struktury wydatków**, nie do JPK ani KPiR.

**Czy dane są współdzielone z firmami trzecimi?**  
Nie sprzedajemy danych. Hosting preferowany w UE (zob. spec bezpieczeństwa).
