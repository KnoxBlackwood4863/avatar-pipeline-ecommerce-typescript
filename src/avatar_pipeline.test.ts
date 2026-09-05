import assert from "node:assert/strict";
import { prepareAvatar } from "./avatar_pipeline.js";

const originalFetch = globalThis.fetch;
const calls: string[] = [];
globalThis.fetch = (async (url: string) => {
  calls.push(url);
  return new Response(JSON.stringify({ ok: true, data: { id: calls.length } }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;
process.env.INFRAI_API_KEY = "test-key";

const result = await prepareAvatar({ customerId: "cus_1", filename: "face.png", image: "data:image/png;base64,AA==", aspect: "1:1" });
assert.equal(result.status, "ready");
assert.equal(calls.length, 3);
assert.match(calls[1], /image\/smart_crop/);
globalThis.fetch = originalFetch;
console.log("avatar decision test passed");
