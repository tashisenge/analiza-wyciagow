"use client";

import { CategoryListItem } from "@/components/categories/CategoryListItem";
import { CategoryRulesSection } from "@/components/categories/CategoryRulesSection";
import { PageHeader } from "@/components/ui/PageHeader";

interface CategoryRow {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  excludeFromOptimization: boolean;
  isDiscretionary: boolean;
  transactionCount: number;
}

interface RuleRow {
  id: string;
  matchField: string;
  matchContains: string;
  priority: number;
  category: { name: string };
}

interface CategoriesViewProps {
  categories: CategoryRow[];
  rules: RuleRow[];
  createCategoryAction: (formData: FormData) => Promise<void>;
  deleteCategoryAction: (formData: FormData) => Promise<void>;
  createRuleAction: (formData: FormData) => Promise<void>;
  deleteRuleAction: (formData: FormData) => Promise<void>;
  toggleOptimizationExclusionAction: (
    categoryId: string,
    excludeFromOptimization: boolean,
  ) => Promise<void>;
  toggleDiscretionaryAction: (
    categoryId: string,
    isDiscretionary: boolean,
  ) => Promise<void>;
  error?: string;
}

export function CategoriesView({
  categories,
  rules,
  createCategoryAction,
  deleteCategoryAction,
  createRuleAction,
  deleteRuleAction,
  toggleOptimizationExclusionAction,
  toggleDiscretionaryAction,
  error,
}: CategoriesViewProps): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Kategorie i reguły"
        lead="Twórz własne kategorie i reguły dopasowania przy imporcie."
        tip="Reguły mają priorytet — wyższy numer wygrywa przy konflikcie. Kategorie oznaczone jako stały wydatek nie pojawiają się w optymalizacji."
      />
      {error ? <p className="alert-error">{error}</p> : null}

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Nowa kategoria</h2>
        <form action={createCategoryAction} className="flex flex-wrap gap-2">
          <input
            name="name"
            required
            placeholder="Nazwa"
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            name="color"
            type="color"
            defaultValue="#6366f1"
            className="h-10 w-12 cursor-pointer rounded border"
          />
          <button type="submit" className="btn-primary">
            Dodaj
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Kategorie ({categories.length})</h2>
        <ul className="space-y-1">
          {categories.map((category) => (
            <CategoryListItem
              key={category.id}
              category={category}
              deleteCategoryAction={deleteCategoryAction}
              toggleOptimizationExclusionAction={toggleOptimizationExclusionAction}
              toggleDiscretionaryAction={toggleDiscretionaryAction}
            />
          ))}
        </ul>
      </section>

      <CategoryRulesSection
        categories={categories}
        rules={rules}
        createRuleAction={createRuleAction}
        deleteRuleAction={deleteRuleAction}
      />
    </div>
  );
}
