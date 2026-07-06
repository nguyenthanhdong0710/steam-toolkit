export class ApiRequestError extends Error {
  status: number;
  needsTwoFactorCode?: boolean;
  needsRefreshToken?: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export async function fetchJson<TSuccess>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<TSuccess> {
  const response = await fetch(input, init);
  const payload = await response.json();

  if (!response.ok) {
    const err = new ApiRequestError(
      typeof payload?.error === "string" ? payload.error : "Request failed.",
      response.status,
    );

    if (typeof payload?.needsTwoFactorCode !== "undefined") {
      err.needsTwoFactorCode = Boolean(payload.needsTwoFactorCode);
    }
    if (typeof payload?.needsRefreshToken !== "undefined") {
      err.needsRefreshToken = Boolean(payload.needsRefreshToken);
    }

    throw err;
  }

  return payload as TSuccess;
}
