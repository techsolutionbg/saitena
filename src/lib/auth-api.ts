export class AuthApiError extends Error {
  constructor(public readonly status: number) {
    super("Заявката към клиентската зона не беше изпълнена.");
    this.name = "AuthApiError";
  }
}

const customerAuth = process.env.NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED === "true";
let customerCsrfToken: string | null = null;

export type RegistrationPolicy = {
  registration_enabled: boolean;
  documents: Record<
    "terms" | "privacy",
    { version: string; sha256: string; path: string }
  >;
};

export async function registrationPolicy(): Promise<RegistrationPolicy> {
  if (!customerAuth) throw new AuthApiError(-1);
  let response: Response;
  try {
    response = await fetch(
      `${apiUrl()}/api/v1/customer/auth/registration-policy`,
      {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    );
  } catch {
    throw new AuthApiError(0);
  }
  if (!response.ok) throw new AuthApiError(response.status);
  const value: unknown = await response.json();
  if (
    typeof value !== "object" ||
    value === null ||
    !("registration_enabled" in value) ||
    value.registration_enabled !== true ||
    !("documents" in value) ||
    typeof value.documents !== "object" ||
    value.documents === null
  )
    throw new AuthApiError(503);
  const documents = value.documents;
  function document(key: "terms" | "privacy") {
    if (!(key in documents)) throw new AuthApiError(503);
    const entry: unknown = Reflect.get(documents, key);
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("version" in entry) ||
      typeof entry.version !== "string" ||
      !/^[a-zA-Z0-9._-]{1,80}$/.test(entry.version) ||
      !("sha256" in entry) ||
      typeof entry.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) ||
      !("path" in entry) ||
      entry.path !== `/legal/${key}`
    )
      throw new AuthApiError(503);
    return { version: entry.version, sha256: entry.sha256, path: entry.path };
  }
  return {
    registration_enabled: true,
    documents: { terms: document("terms"), privacy: document("privacy") },
  };
}

function endpoint(path: string): string {
  return customerAuth
    ? path.replace("/api/v1/auth/", "/api/v1/customer/auth/")
    : path;
}

function apiUrl(): string {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true"
  )
    throw new AuthApiError(-1);
  const value =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production" ? "https://api.saitena.com" : "");
  if (!value) throw new AuthApiError(-1);

  try {
    const url = new URL(value);
    const isLocal =
      ["localhost", "127.0.0.1"].includes(url.hostname) ||
      (process.env.NEXT_PUBLIC_AUTH_TEST_MODE === "true" &&
        url.hostname === "api.saitena-auth.test");
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error();
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
    )
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
  const token = customerAuth ? customerCsrfToken : xsrfToken();
  if (!token) throw new AuthApiError(419);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    [customerAuth ? "X-CSRF-TOKEN" : "X-XSRF-TOKEN"]: token,
  };

  let response: Response;
  try {
    response = await fetch(`${apiUrl()}${endpoint(path)}`, {
      method: "POST",
      cache: "no-store",
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
    response = await fetch(
      `${apiUrl()}${customerAuth ? "/api/v1/customer/auth/csrf" : "/sanctum/csrf-cookie"}`,
      {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    );
  } catch {
    throw new AuthApiError(0);
  }
  if (customerAuth && response.ok) {
    const payload: unknown = await response.json();
    customerCsrfToken =
      typeof payload === "object" &&
      payload !== null &&
      "csrf_token" in payload &&
      typeof payload.csrf_token === "string"
        ? payload.csrf_token
        : null;
  }
  if (!response.ok || !(customerAuth ? customerCsrfToken : xsrfToken()))
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
  consent?: {
    accepted: boolean;
    terms_version: string;
    privacy_version: string;
  };
}): Promise<void> {
  if (customerAuth && input.consent?.accepted !== true)
    throw new AuthApiError(422);
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
      `${apiUrl()}${endpoint(`/api/v1/auth/email/verify/${encodeURIComponent(input.id)}/${encodeURIComponent(input.hash)}?${query}`)}`,
      {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    );
  } catch {
    throw new AuthApiError(0);
  }
  if (!response.ok) throw new AuthApiError(response.status);
}

export function clientAreaUrl(path: "login" | "dashboard"): string | null {
  const configured = process.env.NEXT_PUBLIC_CLIENT_AREA_URL;
  if (!configured) return null;
  try {
    const base = new URL(configured);
    const isLocal = ["localhost", "127.0.0.1"].includes(base.hostname);
    if (
      base.username ||
      base.password ||
      (base.protocol !== "https:" && !(base.protocol === "http:" && isLocal))
    )
      return null;
    base.pathname = `${base.pathname.replace(/\/$/, "")}/${path}`;
    base.search = "";
    base.hash = "";
    return base.toString();
  } catch {
    return null;
  }
}
