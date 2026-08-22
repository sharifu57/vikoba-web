import { buildApiUrl } from "./endpoints";

export type ApiError = Error & { status?: number };

export type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  skipJsonContentType?: boolean;
};

export const AUTH_STORAGE_KEYS = {
  accessToken: "v360_access_token",
  refreshToken: "v360_refresh_token",
  user: "v360_user",
  session: "v360_session",
};

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.accessToken) || null;
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

export function clearAuthTokens() {
  setAuthTokens(null, null);
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
    localStorage.removeItem(AUTH_STORAGE_KEYS.session);
  }
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

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

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
    const token = getAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildApiUrl(path), {
    ...rest,
    headers: requestHeaders,
  });

  if (!response.ok) {
    const payload = await parseApiResponse<{ message?: string }>(response);
    const message =
      payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message) as ApiError;
    error.status = response.status;

    if (response.status === 401) {
      clearAuthTokens();
    }

    throw error;
  }

  return parseApiResponse<T>(response);
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
