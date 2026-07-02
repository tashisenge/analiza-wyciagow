import Link from "next/link";

interface DiscretionaryPageNoticesProps {
  context: string;
  coveragePercent: number;
  discretionaryCategoryCount: number;
}

export function DiscretionaryPageNotices({
  context,
  coveragePercent,
  discretionaryCategoryCount,
}: DiscretionaryPageNoticesProps): React.JSX.Element | null {
  if (coveragePercent >= 80 && discretionaryCategoryCount > 0) {
    return null;
  }

  return (
    <>
      {coveragePercent < 80 ? (
        <p className="alert-warning text-sm">
          Tylko {coveragePercent.toFixed(1)}% wydatków ma przypisaną kategorię — wnioski
          mogą być niepełne.{" "}
          <Link
            href={`/transactions?uncategorized=1&context=${context}`}
            className="link-brand"
          >
            Uzupełnij kategorie
          </Link>
        </p>
      ) : null}

      {discretionaryCategoryCount === 0 ? (
        <p className="section-card text-sm text-slate-600">
          Brak kategorii oznaczonych jako opcjonalne.{" "}
          <Link href="/categories" className="link-brand">
            Przejdź do kategorii
          </Link>{" "}
          i zaznacz „Opcjonalny” przy np. Rozrywka.
        </p>
      ) : null}
    </>
  );
}
