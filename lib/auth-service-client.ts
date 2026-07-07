const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL as string;
const AUTH_SERVICE_API_KEY = process.env.AUTH_SERVICE_API_KEY as string;

export async function callAuthService<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(`${AUTH_SERVICE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": AUTH_SERVICE_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T;
  return { ok: response.ok, status: response.status, data };
}
