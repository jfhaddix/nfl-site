import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Sunday Edge decision surface", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Sunday Edge — NFL decision intelligence<\/title>/i);
  assert.match(html, /Sunday Edge/);
  assert.match(html, /Ranked opportunities/);
  assert.match(html, /Quality, not quantity/i);
  assert.match(html, /ESPN\+ expert research/i);
  assert.match(html, /context only/i);
  assert.match(html, /No-login data/i);
  assert.match(html, /No account or API key/i);
});
