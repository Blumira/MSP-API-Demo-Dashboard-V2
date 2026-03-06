import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
  fetchFindingDetail,
  updateFinding,
} from "@/lib/blumira-api";
import { getDemoFindingDetail } from "@/lib/demo-data";
import { getRuntimeDemoMode } from "../credentials/route";

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
    const finding = await fetchFindingDetail(
      token,
      encodeURIComponent(accountId),
      encodeURIComponent(findingId)
    );

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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, findingId, ...updates } = body || {};

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

      const assignedValue =
        typeof updates.assigned_to === "string"
          ? updates.assigned_to
          : updates.assigned_to === null
            ? ""
            : finding.assigned_to || "";

      const updated = {
        ...finding,
        ...updates,
        assigned_to: assignedValue || undefined,
        assigned_to_name: assignedValue || undefined,
      };

      return NextResponse.json({ data: updated, demoMode: true });
    }

    const token = await getAccessToken();
    const result = await updateFinding(token, accountId, findingId, updates);

    return NextResponse.json({ data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
