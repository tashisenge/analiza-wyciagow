"use client";

interface CategoryOption {
  id: string;
  name: string;
}

interface CategoryAssignFormProps {
  transactionId: string;
  categories: CategoryOption[];
  defaultCategoryId: string;
  similarCount: number;
  counterparty: string;
  action: (formData: FormData) => Promise<void>;
  returnTo?: string;
}

export function CategoryAssignForm({
  transactionId,
  categories,
  defaultCategoryId,
  similarCount,
  counterparty,
  action,
  returnTo = "/transactions",
}: CategoryAssignFormProps): React.JSX.Element {
  const showSimilar = similarCount > 0 && counterparty.trim().length > 0;

  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="transactionId" value={transactionId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <select
        name="categoryId"
        defaultValue={defaultCategoryId}
        className="w-full rounded border px-2 py-1 text-xs"
        onChange={(event) => {
          if (event.currentTarget.value) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
      >
        <option value="">— wybierz —</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {showSimilar ? (
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input type="checkbox" name="applyToSimilar" defaultChecked />
          Do {String(similarCount)} podobnych (bez kategorii)
        </label>
      ) : null}
      {showSimilar ? (
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input type="checkbox" name="createRule" />
          Reguła: kontrahent „{counterparty.trim().slice(0, 24)}”
        </label>
      ) : null}
    </form>
  );
}
