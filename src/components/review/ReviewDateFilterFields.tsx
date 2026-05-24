interface ReviewDateFilterFieldsProps {
  dateFrom: string;
  dateTo: string;
  pending: boolean;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApply: () => void;
}

export function ReviewDateFilterFields({
  dateFrom,
  dateTo,
  pending,
  onDateFromChange,
  onDateToChange,
  onApply,
}: ReviewDateFilterFieldsProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-slate-600">
        Od
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => {
            onDateFromChange(event.target.value);
          }}
          className="input-field ml-1 text-xs"
        />
      </label>
      <label className="text-xs text-slate-600">
        Do
        <input
          type="date"
          value={dateTo}
          onChange={(event) => {
            onDateToChange(event.target.value);
          }}
          className="input-field ml-1 text-xs"
        />
      </label>
      <button
        type="button"
        onClick={onApply}
        disabled={pending}
        className="btn-secondary text-xs"
      >
        Zastosuj filtry
      </button>
    </div>
  );
}
