import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, fetchFindingComments } from "@/lib/blumira-api";
import { getDemoFindingComments } from "@/lib/demo-data";
import { getRuntimeDemoMode } from "../../credentials/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const findingId = searchParams.get("findingId");

    if (!accountId || !findingId) {
      return NextResponse.json(
        { error: "accountId and findingId are required" },
        { status: 400 }
      );
    }

    if (getRuntimeDemoMode()) {
      const comments = getDemoFindingComments(accountId, findingId);
      return NextResponse.json({ data: comments, demoMode: true });
    }

    const token = await getAccessToken();
    const comments = await fetchFindingComments(token, accountId, findingId);

    return NextResponse.json({ data: comments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
