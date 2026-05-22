import { AmountValue } from "@/components/privacy/AmountValue";
import type { CategorySlice } from "@/lib/analytics/category-breakdown";

interface CategoryBreakdownListProps {
  slices: CategorySlice[];
}

export function CategoryBreakdownList({
  slices,
}: CategoryBreakdownListProps): React.JSX.Element {
  return (
    <ul className="space-y-2">
      {slices.map((slice) => (
        <li
          key={slice.categoryId ?? "none"}
          className="flex justify-between rounded border bg-white px-3 py-2 text-sm"
        >
          <span>{slice.categoryName}</span>
          <span>
            <AmountValue>{slice.total.toFixed(2)} PLN</AmountValue> (
            {String(slice.percent)}%)
          </span>
        </li>
      ))}
    </ul>
  );
}
