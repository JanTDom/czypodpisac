/**
 * Minimalny logger strukturalny (JSON w jednej linii) dla kodu serwerowego.
 *
 * Dlaczego własny: projekt nie ma zależności do logowania, a reguła 03 wymaga,
 * żeby w logach nigdy nie było treści umów. Logger przyjmuje tylko pola
 * z białej listy typów prostych; długie napisy są przycinane, żeby przypadkowo
 * przekazany fragment dokumentu nie trafił w całości do logów.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFieldValue = string | number | boolean | null | undefined;

export type LogFields = Readonly<Record<string, LogFieldValue>>;

const MAX_FIELD_LENGTH = 200;

const LEVEL_ORDER: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minimumLevel(): LogLevel {
  const fromEnv = process.env.LOG_LEVEL;
  if (fromEnv === "debug" || fromEnv === "info" || fromEnv === "warn" || fromEnv === "error") {
    return fromEnv;
  }
  return process.env.NODE_ENV === "test" ? "error" : "info";
}

function sanitize(fields: LogFields): Record<string, LogFieldValue> {
  const out: Record<string, LogFieldValue> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = typeof value === "string" && value.length > MAX_FIELD_LENGTH
      ? `${value.slice(0, MAX_FIELD_LENGTH)}…`
      : value;
  }
  return out;
}

export function log(level: LogLevel, event: string, fields: LogFields = {}): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minimumLevel()]) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitize(fields),
  });
  process.stderr.write(`${line}\n`);
}

/** Zamienia dowolny wyjątek na krótki opis bez stosu, bezpieczny do logów. */
export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return typeof error === "string" ? error : "unknown error";
}
