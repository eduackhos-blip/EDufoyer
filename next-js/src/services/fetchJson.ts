export type FetchJsonOptions = RequestInit & {
  token?: string | null;
  timeoutMs?: number;
};

export async function fetchJson<T = unknown>(
  url: string,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { token, timeoutMs = 15000, headers, ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {}),
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        (typeof payload === "object" &&
          payload &&
          "message" in payload &&
          String(payload.message)) ||
        `HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  } finally {
    clearTimeout(timeout);
  }
}
