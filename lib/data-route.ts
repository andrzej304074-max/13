import { handle } from "./api";
import { requireUser } from "./auth";
import { jsonCached, type Cached } from "./data-server";
import { contentQuota } from "./security";

/** Trasa /api/dane/*: tylko dla zalogowanych; pełne pobranie liczy się do limitu pobrań (304 – nie). */
export async function daneResponse(req: Request, data: () => Cached): Promise<Response> {
  try {
    const me = await requireUser();
    const v = data();
    if (req.headers.get("if-none-match") !== v.etag) await contentQuota(me, "dane");
    return jsonCached(req, v);
  } catch (e) {
    return handle(async () => { throw e; });
  }
}
