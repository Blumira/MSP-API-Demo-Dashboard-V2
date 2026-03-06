import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, fetchFindingEvidence } from "@/lib/blumira-api";
import { getDemoFindingEvidence } from "@/lib/demo-data";
import { getRuntimeDemoMode } from "../../credentials/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const findingId = searchParams.get("findingId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

    if (!accountId || !findingId) {
      return NextResponse.json(
        { error: "accountId and findingId are required" },
        { status: 400 }
      );
    }

    if (getRuntimeDemoMode()) {
      const evidence = getDemoFindingEvidence(accountId, findingId, page, pageSize);
      return NextResponse.json({ ...evidence, demoMode: true });
    }

    const token = await getAccessToken();
    const evidence = await fetchFindingEvidence(token, accountId, findingId, page, pageSize);

    if (!evidence) {
      return NextResponse.json({
        data: [],
        evidence_keys: [],
        meta: { page: 1, page_size: pageSize, total_items: 0, total_pages: 0 },
        status: "OK",
      });
    }

    return NextResponse.json(evidence);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
