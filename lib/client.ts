export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Błąd ${res.status}`);
  return data as T;
}

export const LETTERS = ["A", "B", "C", "D"];

export function fmtPoints(p: number): string {
  return p.toLocaleString("pl-PL", { maximumFractionDigits: 1 });
}

export function fmtPct(p: number): string {
  return `${p.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%`;
}

const LAST_TEST_KEY = "owe:lastTest";

export function rememberTest(id: string | null) {
  try {
    if (id) localStorage.setItem(LAST_TEST_KEY, id);
    else localStorage.removeItem(LAST_TEST_KEY);
  } catch {}
}

export function lastTest(): string | null {
  try {
    return localStorage.getItem(LAST_TEST_KEY);
  } catch {
    return null;
  }
}
