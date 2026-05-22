export type LogLevel = "error" | "warn";

export type LogContext = Record<string, string | number | boolean | null | undefined>;

interface SerializedError {
  name: string;
  message: string;
  stack?: string;
}

interface LogWriteOptions {
  context?: LogContext;
  error?: unknown;
}

interface ActionErrorOptions {
  context?: LogContext;
  fallbackMessage?: string;
}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }
  return { name: "Unknown", message: String(error) };
}

function write(level: LogLevel, message: string, options?: LogWriteOptions): void {
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...options?.context,
  };
  if (options?.error !== undefined) {
    payload["err"] = serializeError(options.error);
  }

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else {
    console.warn(line);
  }
}

export const logger = {
  error(message: string, options?: LogWriteOptions): void {
    write("error", message, options);
  },
  warn(message: string, options?: LogWriteOptions): void {
    write("warn", message, options);
  },
};

/** Loguje błąd i zwraca bezpieczny komunikat dla UI (bez stack trace). */
export function logActionError(
  scope: string,
  error: unknown,
  options?: ActionErrorOptions,
): string {
  const fallback = options?.fallbackMessage ?? "Wystąpił nieoczekiwany błąd";
  const message = error instanceof Error ? error.message : fallback;
  logger.error(scope, { context: { ...options?.context, userMessage: message }, error });
  return message;
}
