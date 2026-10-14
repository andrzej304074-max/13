import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, isNetworkError } from "@/lib/client";

const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const netErr = () => Promise.reject(new TypeError("Load failed"));

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("api() przy błędach sieci", () => {
  it("GET ponawia po błędzie sieci i się udaje", async () => {
    vi.useFakeTimers();
    const f = vi.fn().mockImplementationOnce(netErr).mockImplementationOnce(netErr).mockResolvedValueOnce(ok({ a: 1 }));
    vi.stubGlobal("fetch", f);
    const p = api<{ a: number }>("/x");
    await vi.runAllTimersAsync();
    expect(await p).toEqual({ a: 1 });
    expect(f).toHaveBeenCalledTimes(3);
  });
  it("GET po 3 nieudanych próbach – polski komunikat i flaga sieci", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(netErr));
    const p = api("/x").catch((e) => e);
    await vi.runAllTimersAsync();
    const e = await p;
    expect(isNetworkError(e)).toBe(true);
    expect((e as Error).message).toMatch(/Brak połączenia z serwerem/);
  });
  it("POST nie jest ponawiany", async () => {
    const f = vi.fn().mockImplementation(netErr);
    vi.stubGlobal("fetch", f);
    const e = await api("/x", { method: "POST", body: "{}" }).catch((x) => x);
    expect(f).toHaveBeenCalledTimes(1);
    expect(isNetworkError(e)).toBe(true);
  });
  it("błąd z API – komunikat serwera i status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok({ error: "Na to pytanie już odpowiedziano." }, 409)));
    const e = (await api("/x", { method: "POST" }).catch((x) => x)) as ApiError;
    expect(e).toBeInstanceOf(ApiError);
    expect(e.status).toBe(409);
    expect(e.message).toBe("Na to pytanie już odpowiedziano.");
    expect(isNetworkError(e)).toBe(false);
  });
  it("5xx bez JSON – czytelny komunikat", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("<html>", { status: 504 })));
    const p = api("/x").catch((x) => x);
    await vi.runAllTimersAsync();
    expect(((await p) as Error).message).toMatch(/Serwer chwilowo nie odpowiada \(błąd 504\)/);
  });
});
