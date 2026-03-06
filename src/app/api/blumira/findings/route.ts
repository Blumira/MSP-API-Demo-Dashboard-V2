import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
  fetchFindingDetail,
} from "@/lib/blumira-api";
import { getDemoFindingDetail } from "@/lib/demo-data";
import { getRuntimeDemoMode } from "../credentials/route";

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
      const finding = getDemoFindingDetail(accountId, findingId);
      if (!finding) {
        return NextResponse.json(
          { error: "Finding not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: finding, demoMode: true });
    }

    const token = await getAccessToken();
    const finding = await fetchFindingDetail(token, accountId, findingId);

    if (!finding) {
      return NextResponse.json(
        { error: "Finding not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: finding });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
