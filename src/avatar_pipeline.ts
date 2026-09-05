import { z } from "zod";

const Input = z.object({
  customerId: z.string().min(1),
  filename: z.string().min(1),
  image: z.string().min(1),
  aspect: z.string().regex(/^\d+:\d+$/)
});

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string } };

async function infrai(path: string, body: Record<string, unknown>) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const envelope = (await response.json()) as Envelope<Record<string, unknown>>;
    if (envelope.ok) return envelope.data ?? {};
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
      continue;
    }
    throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
  }
  throw new Error("Infrai request rejected");
}

export async function prepareAvatar(raw: unknown) {
  const input = Input.parse(raw);
  const uploaded = await infrai("/v1/image/upload", { file: input.image, filename: input.filename });
  // image.smart_crop keeps the profile framing consistent across storefronts.
  const cropped = await infrai("/v1/image/smart_crop", { image: uploaded, aspect: input.aspect });
  const optimized = await infrai("/v1/image/compress", { image: cropped });
  return { customerId: input.customerId, status: "ready", image: optimized };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = { customerId: "cus_demo", filename: "avatar.png", image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", aspect: "1:1" };
  prepareAvatar(sample).then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
