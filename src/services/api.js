const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) },
  });
  const type = response.headers.get("content-type") || "";
  const payload = type.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) throw new Error(payload?.message || payload?.error || payload || `Request failed (${response.status})`);
  return payload;
}

export { API_BASE };
