// Wraps fetch calls to the backend API with JSON and auth headers.
// Wraps fetch calls to the backend API with JSON and auth headers.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Sends a typed request to the backend API.
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload as T;
}
