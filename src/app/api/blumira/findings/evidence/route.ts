import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, fetchFindingEvidence } from "@/lib/blumira-api";
import { getDemoFindingEvidence } from "@/lib/demo-data";
import { getRuntimeDemoMode } from "../../credentials/route";

export const dynamic = "force-dynamic";

const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function isSafeId(value: string) {
  return SAFE_ID_PATTERN.test(value);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const findingId = searchParams.get("findingId");

    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const rawPageSize = Number.parseInt(searchParams.get("pageSize") || "50", 10);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.min(rawPage, 1000) : 1;
    const pageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0
        ? Math.min(rawPageSize, 200)
        : 50;

    if (!accountId || !findingId) {
      return NextResponse.json(
        { error: "accountId and findingId are required" },
        { status: 400 }
      );
    }

    if (!isSafeId(accountId) || !isSafeId(findingId)) {
      return NextResponse.json(
        { error: "Invalid accountId or findingId" },
        { status: 400 }
      );
    }

    if (getRuntimeDemoMode()) {
      const evidence = getDemoFindingEvidence(accountId, findingId, page, pageSize);
      return NextResponse.json({ ...evidence, demoMode: true });
    }

    const token = await getAccessToken();
    const evidence = await fetchFindingEvidence(
      token,
      encodeURIComponent(accountId),
      encodeURIComponent(findingId),
      page,
      pageSize
    );

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
