import assert from "node:assert/strict";
import { test } from "node:test";
import { withRetry } from "../../_lib/helpers/retry";

const FAST = { baseDelayMs: 1 };

test("withRetry: success on first try — no retry", async () => {
  let calls = 0;
  const result = await withRetry(() => {
    calls++;
    return Promise.resolve("ok");
  });
  assert.equal(result, "ok");
  assert.equal(calls, 1);
});

test("withRetry: 503 in message triggers retry, eventually succeeds", async () => {
  let calls = 0;
  const result = await withRetry(() => {
    calls++;
    if (calls < 3) throw new Error("503 Service Unavailable");
    return Promise.resolve("ok");
  }, FAST);
  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("withRetry: non-retryable auth error throws immediately", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(() => {
      calls++;
      const err = new Error("401 Unauthorized") as Error & { status?: number };
      err.status = 401;
      throw err;
    }, FAST),
    /401/,
  );
  assert.equal(calls, 1);
});

test("withRetry: numeric status 503 triggers retry", async () => {
  let calls = 0;
  await withRetry(() => {
    calls++;
    if (calls < 2) {
      const err = new Error("boom") as Error & { status?: number };
      err.status = 503;
      throw err;
    }
    return Promise.resolve("ok");
  }, FAST);
  assert.equal(calls, 2);
});

test("withRetry: UNAVAILABLE status name in message triggers retry", async () => {
  let calls = 0;
  await withRetry(() => {
    calls++;
    if (calls < 2) throw new Error("Service UNAVAILABLE right now");
    return Promise.resolve("ok");
  }, FAST);
  assert.equal(calls, 2);
});

test("withRetry: 429 rate limit triggers retry", async () => {
  let calls = 0;
  await withRetry(() => {
    calls++;
    if (calls < 2) throw new Error("429 Too Many Requests");
    return Promise.resolve("ok");
  }, FAST);
  assert.equal(calls, 2);
});

test("withRetry: all attempts fail — throws last error", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      () => {
        calls++;
        throw new Error("503 boom");
      },
      { maxAttempts: 3, baseDelayMs: 1 },
    ),
    /503 boom/,
  );
  assert.equal(calls, 3);
});

test("withRetry: maxAttempts override respected", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      () => {
        calls++;
        throw new Error("503 boom");
      },
      { maxAttempts: 2, baseDelayMs: 1 },
    ),
    /503/,
  );
  assert.equal(calls, 2);
});

test("withRetry: delay grows exponentially between attempts", async () => {
  const timestamps: number[] = [];
  await assert.rejects(
    withRetry(
      () => {
        timestamps.push(Date.now());
        throw new Error("503 boom");
      },
      { maxAttempts: 4, baseDelayMs: 20 },
    ),
    /503/,
  );
  assert.equal(timestamps.length, 4);
  const gaps = [
    timestamps[1] - timestamps[0],
    timestamps[2] - timestamps[1],
    timestamps[3] - timestamps[2],
  ];
  assert.ok(gaps[1] > gaps[0], `gap2 (${gaps[1]}) should exceed gap1 (${gaps[0]})`);
  assert.ok(gaps[2] > gaps[1], `gap3 (${gaps[2]}) should exceed gap2 (${gaps[1]})`);
});
