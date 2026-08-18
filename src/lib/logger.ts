import { signal } from '@preact/signals';

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export function isLogLevel(value: unknown): value is LogLevel {
  return (
    typeof value === 'string' && (LOG_LEVELS as readonly string[]).includes(value)
  );
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function atLeast(level: LogLevel, minimum: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minimum];
}

export type LogEntry = {
  id: number;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
};

/**
 * A ring buffer, not an ever-growing list. The dashboard is meant to run for
 * days; an unbounded log would become the leak it was meant to help find.
 */
const MAX_ENTRIES = 200;

export const logs = signal<readonly LogEntry[]>([]);
export const errorCount = signal(0);

let nextId = 0;

function append(level: LogLevel, category: string, message: string): void {
  nextId += 1;

  const entry: LogEntry = {
    id: nextId,
    timestamp: Date.now(),
    level,
    category,
    message,
  };

  const previous = logs.value;
  const trimmed =
    previous.length >= MAX_ENTRIES
      ? previous.slice(previous.length - MAX_ENTRIES + 1)
      : previous;

  logs.value = [...trimmed, entry];

  if (level === 'error') {
    errorCount.value += 1;
  }
}

export const logger = {
  debug: (category: string, message: string) =>
    append('debug', category, message),
  info: (category: string, message: string) => append('info', category, message),
  warn: (category: string, message: string) => append('warn', category, message),
  error: (category: string, message: string) =>
    append('error', category, message),
};

export function clearLogs(): void {
  logs.value = [];
  errorCount.value = 0;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
