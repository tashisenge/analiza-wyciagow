import { InfoTip } from "@/components/ui/InfoTip";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

export function TransactionsHelpPanel(): React.JSX.Element {
  return (
    <details className="help-panel group">
      <summary className="cursor-pointer font-medium text-slate-800">
        Jak kategoryzować i co oznaczają kolumny
        <InfoTip label="Pomoc transakcje">
          Rozwiń tę sekcję, gdy potrzebujesz przypomnienia o transferach i podobnych
          transakcjach.
        </InfoTip>
      </summary>
      <ul className="mt-3 list-inside list-disc space-y-2 text-slate-600">
        <li>
          <strong>Podobne</strong> — ten sam kontrahent; osobno licznik z tą samą kwotą.
        </li>
        <li>
          Przy zmianie kategorii możesz zastosować do podobnych i zawęzić do identycznej
          kwoty.
        </li>
        <li>
          Transfer między <strong>Twoimi kontami</strong> tylko gdy w bazie jest para
          (przeciwna kwota, inne konto, ±5 dni) → kategoria{" "}
          <strong>{TRANSFER_BETWEEN_ACCOUNTS_CATEGORY}</strong>.
        </li>
        <li>
          <strong>Usuń kategorię</strong> lub wybór „— wybierz —” czyści przypisanie.
        </li>
      </ul>
    </details>
  );
}
