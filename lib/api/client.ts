import { buildApiUrl } from "./endpoints";

export type ApiError = Error & { status?: number };

export type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  skipJsonContentType?: boolean;
  responseType?: "blob";
};

export const AUTH_STORAGE_KEYS = {
  accessToken: "v360_access_token",
  refreshToken: "v360_refresh_token",
  user: "v360_user",
  session: "v360_session",
};

export const SESSION_EXPIRED_EVENT = "vikoba:session-expired";
export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export function notifySessionExpired(reason = "expired") {
  if (typeof window === "undefined") return;

  clearAuthTokens();
  window.dispatchEvent(
    new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason } }),
  );
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;

  const storedToken = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
  if (storedToken) return normaliseToken(storedToken);

  // Support sessions created before the standalone access-token key was added.
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEYS.session);
  if (!storedSession) return null;

  try {
    const session = JSON.parse(storedSession) as Record<string, unknown>;
    const sessionData = session.data as Record<string, unknown> | undefined;
    const sessionToken =
      session.accessToken ??
      session.token ??
      sessionData?.accessToken ??
      sessionData?.token;
    return typeof sessionToken === "string"
      ? normaliseToken(sessionToken)
      : null;
  } catch {
    return null;
  }
}

export function getBearerHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  return { Authorization: `Bearer ${token}` };
}

function normaliseToken(token: string) {
  // Some older login/session flows persisted the token as a JSON string.
  // Remove that wrapping before constructing the Authorization header.
  const value = token.trim().replace(/^"(.*)"$/, "$1");
  if (!value) return null;
  return value.replace(/^Bearer\s+/i, "");
}

export function getAccessTokenExpiryMs(token = getAccessToken()): number | null {
  if (!token || typeof window === "undefined") return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function setAuthTokens(
  accessToken?: string | null,
  refreshToken?: string | null,
) {
  if (typeof window === "undefined") return;

  if (accessToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  }
}

export function clearVikobaLocalState() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  localStorage.removeItem(AUTH_STORAGE_KEYS.session);
  localStorage.removeItem("v360_currentGroup");
  localStorage.removeItem("v360_currentGroupId");
  localStorage.removeItem("v360_currentGroupMemberId");
  localStorage.removeItem("v360_currentGroupRole");
  localStorage.removeItem("v360_currentGroupRoles");
  localStorage.removeItem("v360_currentGroupPermissions");
  localStorage.removeItem("v360_currentGroupCurrency");
  localStorage.removeItem("v360_groups");
  localStorage.removeItem("v360_group_settings");
  localStorage.removeItem("v360_group_setup_complete");
  localStorage.removeItem("v360_group_setup_done");
  localStorage.removeItem("v360_last_activity");
  localStorage.removeItem("v360_session_expired");
}

export function clearAuthTokens() {
  setAuthTokens(null, null);
  clearVikobaLocalState();
}

export function setAuthenticatedUser(user: Record<string, unknown> | null) {
  if (typeof window === "undefined") return;

  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  }
}

function isAuthRoute(path: string) {
  return path.includes("/api/auth/");
}

let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
    const refreshToken = stored && normaliseToken(stored);
    if (!refreshToken) return null;
    try {
      const response = await fetch(buildApiUrl("/api/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return null;
      const payload = await parseApiResponse<{ token?: string; refreshToken?: string }>(response);
      if (!payload?.token) return null;
      // An idle logout or explicit sign-out may have happened while refresh was in flight.
      if (localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken) !== stored) return null;
      setAuthTokens(payload.token, payload.refreshToken || refreshToken);
      try {
        const session = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.session) || "null");
        if (session && typeof session === "object") {
          localStorage.setItem(AUTH_STORAGE_KEYS.session, JSON.stringify({
            ...session,
            accessToken: payload.token,
            refreshToken: payload.refreshToken || refreshToken,
          }));
        }
      } catch {
        // The standalone token keys are authoritative.
      }
      return normaliseToken(payload.token);
    } catch {
      return null;
    }
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function refreshSessionIfNeeded(): Promise<string | null> {
  const token = getAccessToken();
  const expiresAt = getAccessTokenExpiryMs(token);
  if (token && (expiresAt === null || expiresAt - Date.now() > 2 * 60 * 1000)) return token;
  const refreshed = await refreshAccessToken();
  if (refreshed) return refreshed;
  // Never send a known-expired access token when refresh fails.
  return expiresAt === null || expiresAt > Date.now() ? token : null;
}

async function isSessionRejected(token: string): Promise<boolean> {
  try {
    // /api/groups is an established authenticated route. A 401 here means
    // the bearer token was rejected, rather than a single feature route failing.
    const response = await fetch(buildApiUrl("/api/groups"), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.status === 401;
  } catch {
    // A network failure cannot establish that the session has expired.
    return false;
  }
}

async function parseApiResponse<T>(
  response: Response,
  responseType?: ApiRequestOptions["responseType"],
): Promise<T> {
  if (response.status === 204) return undefined as T;
  if (responseType === "blob") return (await response.blob()) as T;

  const text = await response.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    auth = !isAuthRoute(path),
    skipJsonContentType = false,
    responseType,
    headers,
    ...rest
  } = options;
  const requestHeaders = new Headers(headers || {});

  if (
    !skipJsonContentType &&
    !(rest.body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const lastActivity = Number(localStorage.getItem("v360_last_activity"));
    if (lastActivity > 0 && Date.now() - lastActivity >= SESSION_IDLE_TIMEOUT_MS) {
      notifySessionExpired("idle");
      const error = new Error("Your session expired after inactivity. Please sign in again.") as ApiError;
      error.status = 401;
      throw error;
    }
    const token = await refreshSessionIfNeeded();
    if (!token) {
      notifySessionExpired("missing-token");
      const error = new Error(
        "Your session has expired. Please sign in again.",
      ) as ApiError;
      error.status = 401;
      throw error;
    }
    // Always use the latest token, including when a caller supplied a stale header.
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(buildApiUrl(path), {
    ...rest,
    headers: requestHeaders,
  });

  if (response.status === 401 && auth && !isAuthRoute(path)) {
    // A newer token may already have been installed by another request.
    const sentToken = requestHeaders.get("Authorization")?.replace(/^Bearer\s+/i, "");
    const token = (getAccessToken() !== sentToken ? getAccessToken() : null)
      || await refreshAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
      response = await fetch(buildApiUrl(path), { ...rest, headers: requestHeaders });
    }
  }

  if (!response.ok) {
    const payload = await parseApiResponse<{ message?: string }>(response);
    const message =
      payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message) as ApiError;
    error.status = response.status;

    if (response.status === 401 && auth && !isAuthRoute(path)
      && await isSessionRejected(requestHeaders.get("Authorization")!.replace(/^Bearer\s+/i, ""))) {
      notifySessionExpired("unauthorized");
    }

    throw error;
  }

  return parseApiResponse<T>(response, responseType);
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options: ApiRequestOptions = {},
) {
  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  const url = queryString ? `${path}?${queryString}` : path;

  return apiRequest<T>(url, { ...options, method: "GET" });
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options: ApiRequestOptions = {},
) {
  return apiRequest<T>(path, {
    ...options,
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  options: ApiRequestOptions = {},
) {
  return apiRequest<T>(path, {
    ...options,
    method: "PUT",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export async function apiDelete<T = void>(
  path: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<T>(path, {
    ...options,
    method: "DELETE",
  });
}
