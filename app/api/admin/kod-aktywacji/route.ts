import { handle } from "@/lib/api";
import { activationCodeInfo, newActivationCode, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requireUser({ admin: true });
    return activationCodeInfo();
  });
}

export async function POST() {
  return handle(async () => {
    await requireUser({ admin: true });
    await newActivationCode();
    return activationCodeInfo();
  });
}
