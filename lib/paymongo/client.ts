export class PaymongoError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "PaymongoError";
  }
}

export async function paymongoFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const secret = process.env.PAYMONGO_SECRET_KEY;
  if (!secret) {
    throw new PaymongoError("PAYMONGO_SECRET_KEY is not configured");
  }

  const auth = Buffer.from(`${secret}:`).toString("base64");
  const res = await fetch(`https://api.paymongo.com${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      (json as { errors?: { detail?: string }[] })?.errors?.[0]?.detail ??
      "PayMongo request failed";
    throw new PaymongoError(detail, res.status, json);
  }
  return json as T;
}
