import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../api/recipe-assistant.js";

function responseMock() {
  return {
    code: null,
    headers: {},
    body: null,
    ended: false,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    end() { this.ended = true; return this; }
  };
}

test("recipe API accepts the same preview origin for preflight and POST", async () => {
  const origin = "https://rumbo-preview-gonzaloor1988-8991.vercel.app";
  const preflight = responseMock();
  await handler({ method: "OPTIONS", headers: { origin } }, preflight);
  assert.equal(preflight.code, 204);
  assert.equal(preflight.headers["access-control-allow-origin"], origin);
  assert.equal(preflight.ended, true);

  const post = responseMock();
  await handler({ method: "POST", headers: { origin }, body: { query: "ab" } }, post);
  assert.equal(post.code, 400);
  assert.equal(post.headers["access-control-allow-origin"], origin);
  assert.match(post.body.error, /plato o ingrediente/i);
});

test("recipe API rejects an unapproved origin for both preflight and POST", async () => {
  const origin = "https://attacker.example";
  const preflight = responseMock();
  await handler({ method: "OPTIONS", headers: { origin } }, preflight);
  assert.equal(preflight.code, 403);

  const post = responseMock();
  await handler({ method: "POST", headers: { origin }, body: { query: "paella" } }, post);
  assert.equal(post.code, 403);
});
