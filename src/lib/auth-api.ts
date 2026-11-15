export class AuthApiError extends Error {
  constructor(public readonly status: number) {
    super("Заявката към клиентската зона не беше изпълнена.");
    this.name = "AuthApiError";
  }
}

function apiUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production" ? "https://api.saitena.com" : "");
  if (!value) throw new AuthApiError(-1);

  try {
    const url = new URL(value);
    const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.username || url.password) throw new Error();
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal))
      throw new Error();
    if (process.env.NODE_ENV === "development" && !isLocal) throw new Error();
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new AuthApiError(-1);
  }
}

function xsrfToken(): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith("XSRF-TOKEN="));
  return cookie ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)) : null;
}

async function postJson(path: string, body: object): Promise<void> {
  const token = xsrfToken();
  if (!token) throw new AuthApiError(419);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-XSRF-TOKEN": token,
  };

  let response: Response;
  try {
    response = await fetch(`${apiUrl()}${path}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError(0);
  }

  if (!response.ok) throw new AuthApiError(response.status);
}

async function csrfCookie(): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl()}/sanctum/csrf-cookie`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new AuthApiError(0);
  }
  if (!response.ok || !xsrfToken())
    throw new AuthApiError(response.ok ? 419 : response.status);
}

export async function signIn(email: string, password: string): Promise<void> {
  await csrfCookie();
  await postJson("/api/v1/auth/login", { email, password });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await csrfCookie();
  await postJson("/api/v1/auth/forgot-password", { email });
}

export async function resetPassword(
  email: string,
  token: string,
  password: string,
  passwordConfirmation: string,
): Promise<void> {
  await csrfCookie();
  await postJson("/api/v1/auth/reset-password", {
    email,
    token,
    password,
    password_confirmation: passwordConfirmation,
  });
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await csrfCookie();
  await postJson("/api/v1/auth/register", input);
}

export async function verifyEmail(input: {
  id: string;
  hash: string;
  expires: string;
  signature: string;
}): Promise<void> {
  const query = new URLSearchParams({
    expires: input.expires,
    signature: input.signature,
  });
  let response: Response;
  try {
    response = await fetch(
      `${apiUrl()}/api/v1/auth/email/verify/${encodeURIComponent(input.id)}/${encodeURIComponent(input.hash)}?${query}`,
      { credentials: "include", headers: { Accept: "application/json" } },
    );
  } catch {
    throw new AuthApiError(0);
  }
  if (!response.ok) throw new AuthApiError(response.status);
}

export function clientAreaUrl(path: "login"): string | null {
  const configured = process.env.NEXT_PUBLIC_CLIENT_AREA_URL;
  if (!configured) return null;
  try {
    const base = new URL(configured);
    const isLocal = ["localhost", "127.0.0.1"].includes(base.hostname);
    if (base.protocol !== "https:" && !(base.protocol === "http:" && isLocal))
      return null;
    base.pathname = `${base.pathname.replace(/\/$/, "")}/${path}`;
    base.search = "";
    base.hash = "";
    return base.toString();
  } catch {
    return null;
  }
}
