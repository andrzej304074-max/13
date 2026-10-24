import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { exportData } from "@/lib/account";
import { HttpError } from "@/lib/tests";

export const dynamic = "force-dynamic";

/** Eksport danych konta (RODO) – plik JSON do pobrania. */
export async function GET() {
  try {
    const data = await exportData(await requireUser({ active: false }));
    return new NextResponse(JSON.stringify(data, null, 1), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="owe-moje-dane-${new Date().toISOString().slice(0, 10)}.json"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof HttpError ? e.message : "Błąd serwera." }, { status: e instanceof HttpError ? e.status : 500 });
  }
}
