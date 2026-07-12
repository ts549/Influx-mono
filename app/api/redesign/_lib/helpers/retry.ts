import type { Logger } from "../types";

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const RETRYABLE_STATUS_NAMES = /UNAVAILABLE|RESOURCE_EXHAUSTED|INTERNAL|DEADLINE_EXCEEDED/;

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: unknown; code?: unknown; message?: unknown };
  const status = e.status ?? e.code;
  if (typeof status === "number" && RETRYABLE_STATUSES.has(status)) return true;
  const msg = String(e.message ?? "");
  if (/\b(429|500|502|503|504)\b/.test(msg)) return true;
  if (RETRYABLE_STATUS_NAMES.test(msg)) return true;
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; baseDelayMs?: number; logger?: Logger } = {},
): Promise<T> {
  const { maxAttempts = 4, baseDelayMs = 1000, logger } = opts;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !isRetryable(err)) throw err;
      const delayMs = baseDelayMs * 2 ** (attempt - 1);
      logger?.warn(
        `  transient error (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}
