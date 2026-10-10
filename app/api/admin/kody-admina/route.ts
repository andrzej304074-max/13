import { handle, readJson } from "@/lib/api";
import { listAdminCodes, newAdminCode, requireUser, revokeAdminCode } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requireUser({ admin: true });
    return listAdminCodes();
  });
}

export async function POST() {
  return handle(async () => {
    await newAdminCode(await requireUser({ admin: true }));
    return listAdminCodes();
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    await requireUser({ admin: true });
    const { code } = await readJson(req);
    await revokeAdminCode(code);
    return listAdminCodes();
  });
}
