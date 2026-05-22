"use client";

import { useEffect } from "react";

function logClientError(error: Error, scope: string): void {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      msg: scope,
      err: { name: error.name, message: error.message, stack: error.stack },
    }),
  );
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    logClientError(error, "ui.app.error");
  }, [error]);

  return (
    <main className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-xl font-bold text-red-800">Coś poszło nie tak</h1>
      <p className="mt-2 text-sm text-slate-600">
        Błąd został zapisany w logach serwera / konsoli. Spróbuj ponownie.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
      >
        Spróbuj ponownie
      </button>
    </main>
  );
}
