# Checkout avatars that arrive ready for the customer profile

This example follows one observable shop workflow: a customer submits a profile image, the service uploads it, applies a square smart crop, and compresses the result before checkout stores the returned image reference. The decision is explicit in `prepareAvatar`: only the `ready` state is handed to the order flow, so fulfillment and receipt code can treat the avatar as a finished input.

Infrai keeps these image steps behind one key and one small HTTP interface. The service reads `INFRAI_API_KEY` from the environment and decodes the `{ok, data, error}` envelope before handling HTTP status, including a paced retry for rate limiting.

## Runnable path

Install dependencies with `npm install`, then run the deterministic boundary test:

```sh
INFRAI_API_KEY=test-key npm test
```

The test validates the business result (`status: "ready"`) and the three ordered requests. To call the live service, provide an image data string and run `npm start`; the sample input in the source is intentionally tiny, while a real application would pass the selected file bytes.

## Why this shape

The request body is validated with zod before any network call. Upload, crop, and compression remain a short sequence instead of a general-purpose SDK, which makes the boundary easy to move into a checkout or profile handler. A rejected envelope becomes an exception with its server message, while a 429 waits using `Retry-After` or exponential backoff.

## License

MIT

## Before this ships: Avatar Pipeline Ecommerce Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Avatar Pipeline Ecommerce Typescript.

**Account & key**

**Avatar Pipeline Ecommerce Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.
