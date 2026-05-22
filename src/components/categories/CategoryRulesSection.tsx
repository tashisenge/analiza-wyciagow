interface CategoryOption {
  id: string;
  name: string;
}

interface RuleRow {
  id: string;
  matchField: string;
  matchContains: string;
  priority: number;
  category: { name: string };
}

interface CategoryRulesSectionProps {
  categories: CategoryOption[];
  rules: RuleRow[];
  createRuleAction: (formData: FormData) => Promise<void>;
  deleteRuleAction: (formData: FormData) => Promise<void>;
}

export function CategoryRulesSection({
  categories,
  rules,
  createRuleAction,
  deleteRuleAction,
}: CategoryRulesSectionProps): React.JSX.Element {
  return (
    <>
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Nowa reguła</h2>
        <form action={createRuleAction} className="grid gap-2 sm:grid-cols-2">
          <select name="categoryId" required className="rounded border px-3 py-2 text-sm">
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="matchField" className="rounded border px-3 py-2 text-sm">
            <option value="description">Opis operacji</option>
            <option value="counterparty">Kontrahent</option>
          </select>
          <input
            name="matchContains"
            required
            placeholder="Zawiera tekst…"
            className="rounded border px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="priority"
            type="number"
            defaultValue={0}
            className="rounded border px-3 py-2 text-sm"
          />
          <button type="submit" className="btn-primary">
            Dodaj regułę
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Reguły ({rules.length})</h2>
        <ul className="space-y-1 text-sm">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between rounded border bg-white px-3 py-2"
            >
              <span>
                <strong>{rule.category.name}</strong> — {rule.matchField} zawiera „
                {rule.matchContains}” (prio {rule.priority})
              </span>
              <form action={deleteRuleAction}>
                <input type="hidden" name="ruleId" value={rule.id} />
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Usuń
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
