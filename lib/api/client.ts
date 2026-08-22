import { buildApiUrl } from "./endpoints";

export type ApiError = Error & { status?: number };

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(
      message || `Request failed with status ${response.status}`,
    ) as ApiError;
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  const url = queryString ? `${path}?${queryString}` : path;

  return apiFetch<T>(url);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options: RequestInit = {},
) {
  return apiFetch<T>(path, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  options: RequestInit = {},
) {
  return apiFetch<T>(path, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T = void>(
  path: string,
  options: RequestInit = {},
) {
  return apiFetch<T>(path, {
    ...options,
    method: "DELETE",
  });
}
