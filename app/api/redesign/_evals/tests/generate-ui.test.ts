import assert from "node:assert/strict";
import { test } from "node:test";
import { validateRenderability } from "../../_lib/pipeline/generate-ui";

test("validateRenderability: valid inline HTML passes", () => {
  const html = `<!DOCTYPE html><html><body style="color:red">hi</body></html>`;
  assert.doesNotThrow(() => validateRenderability(html, 0));
});

test("validateRenderability: <script> tag throws", () => {
  assert.throws(
    () => validateRenderability(`<html><body><script>x</script></body></html>`, 0),
    /<script>/,
  );
});

test("validateRenderability: <script type=...> throws", () => {
  assert.throws(
    () => validateRenderability(`<script type="text/javascript">x</script>`, 0),
    /<script>/,
  );
});

test("validateRenderability: uppercase <SCRIPT> throws (case-insensitive)", () => {
  assert.throws(() => validateRenderability(`<SCRIPT>x</SCRIPT>`, 0), /<script>/);
});

test("validateRenderability: external stylesheet <link> throws", () => {
  assert.throws(
    () =>
      validateRenderability(
        `<link rel="stylesheet" href="https://cdn.example.com/x.css">`,
        0,
      ),
    /external stylesheet/,
  );
});

test("validateRenderability: <link> with data-URI href passes", () => {
  assert.doesNotThrow(() =>
    validateRenderability(`<link rel="icon" href="data:image/png;base64,x">`, 0),
  );
});

test("validateRenderability: external image URL throws", () => {
  assert.throws(
    () => validateRenderability(`<img src="https://example.com/x.png">`, 0),
    /external image/,
  );
});

test("validateRenderability: data-URI image passes", () => {
  assert.doesNotThrow(() =>
    validateRenderability(`<img src="data:image/png;base64,iVBORw0KGgo=">`, 0),
  );
});

test("validateRenderability: HTML at 50KB boundary passes", () => {
  const body = "a".repeat(50 * 1024 - 40);
  const html = `<html><body>${body}</body></html>`;
  assert.ok(Buffer.byteLength(html, "utf8") <= 50 * 1024, "test fixture assumption");
  assert.doesNotThrow(() => validateRenderability(html, 0));
});

test("validateRenderability: HTML over 50KB throws", () => {
  const html = `<html><body>${"a".repeat(60 * 1024)}</body></html>`;
  assert.throws(() => validateRenderability(html, 0), /size ceiling/);
});
