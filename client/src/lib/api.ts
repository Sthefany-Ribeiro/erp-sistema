const API_URL = import.meta.env.VITE_API_URL as string;

let token: string | null = localStorage.getItem("erp_token");

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("erp_token", t);
  else localStorage.removeItem("erp_token");
}

export function getToken() {
  return token;
}

export function setUsuario(u: any | null) {
  if (u) localStorage.setItem("erp_usuario", JSON.stringify(u));
  else localStorage.removeItem("erp_usuario");
}

export function getUsuario(): any | null {
  const raw = localStorage.getItem("erp_usuario");
  return raw ? JSON.parse(raw) : null;
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({ erro: `Erro ${res.status}` }));
    throw new Error(erro.erro || `Erro ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get:  (path: string) => request(path),
  post: (path: string, body: unknown) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put:  (path: string, body?: unknown) => request(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  del:  (path: string) => request(path, { method: "DELETE" }),
};