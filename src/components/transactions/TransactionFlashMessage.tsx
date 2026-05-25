"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useErrorPopup } from "@/components/ui/ErrorPopupProvider";

interface TransactionFlashMessageProps {
  error?: string;
  msg?: string;
}

export function TransactionFlashMessage({
  error,
  msg,
}: TransactionFlashMessageProps): React.JSX.Element | null {
  const { enabled: popupEnabled } = useErrorPopup();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (error && popupEnabled) {
      dialogRef.current?.showModal();
    }
  }, [error, popupEnabled]);

  function dismissError(): void {
    dialogRef.current?.close();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    const query = params.toString();
    router.replace(query ? `/transactions?${query}` : "/transactions");
  }

  if (error && popupEnabled) {
    return (
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 m-auto w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-red-200 bg-white p-5 shadow-xl backdrop:bg-slate-900/40"
        aria-labelledby="transaction-error-title"
      >
        <h2 id="transaction-error-title" className="text-base font-semibold text-red-800">
          Nie udało się zapisać
        </h2>
        <p className="mt-2 text-sm text-slate-700">{error}</p>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={dismissError} className="btn-primary">
            OK
          </button>
        </div>
      </dialog>
    );
  }

  return (
    <>
      {error ? <p className="alert-error">{error}</p> : null}
      {msg ? <p className="alert-success">{msg}</p> : null}
    </>
  );
}
