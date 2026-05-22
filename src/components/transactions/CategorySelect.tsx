"use client";

interface CategoryOption {
  id: string;
  name: string;
}

interface CategorySelectProps {
  transactionId: string;
  categories: CategoryOption[];
  defaultCategoryId: string;
  action: (formData: FormData) => Promise<void>;
  returnTo?: string;
}

export function CategorySelect({
  transactionId,
  categories,
  defaultCategoryId,
  action,
  returnTo = "/transactions",
}: CategorySelectProps): React.JSX.Element {
  return (
    <form action={action}>
      <input type="hidden" name="transactionId" value={transactionId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <select
        name="categoryId"
        defaultValue={defaultCategoryId}
        className="rounded border px-2 py-1 text-xs"
        onChange={(event) => {
          event.currentTarget.form?.requestSubmit();
        }}
      >
        <option value="">— wybierz —</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </form>
  );
}
