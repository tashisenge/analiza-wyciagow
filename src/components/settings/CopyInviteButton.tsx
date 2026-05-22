"use client";

export function CopyInviteButton({ code }: { code: string }): React.JSX.Element {
  return (
    <button
      type="button"
      className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
      onClick={() => {
        void navigator.clipboard.writeText(code);
      }}
    >
      Kopiuj kod
    </button>
  );
}
