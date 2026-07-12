import assert from "node:assert/strict";
import { test } from "node:test";
import { extractEventFrames } from "../../_lib/pipeline/extract-frames";
import { silentLogger } from "../support/silent-logger";

test("extractEventFrames: empty condensedEvents -> empty array (no ffmpeg call)", async () => {
  const result = await extractEventFrames({
    videoBuffer: Buffer.alloc(0),
    condensedEvents: [],
    logger: silentLogger(),
  });
  assert.deepEqual(result, []);
});
