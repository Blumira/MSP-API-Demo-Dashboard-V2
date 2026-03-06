import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
  fetchFindingComments,
  postFindingComment,
  updateFinding,
} from "@/lib/blumira-api";
import { getDemoFindingComments } from "@/lib/demo-data";
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
      const comments = getDemoFindingComments(accountId, findingId);
      return NextResponse.json({ data: comments, demoMode: true });
    }

    const token = await getAccessToken();
    const comments = await fetchFindingComments(
      token,
      encodeURIComponent(accountId),
      encodeURIComponent(findingId)
    );

    return NextResponse.json({ data: comments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accountId = body?.accountId as string | undefined;
    const findingId = body?.findingId as string | undefined;
    const note = body?.note as string | undefined;
    const responder = body?.responder as string | undefined;

    if (!accountId || !findingId || !note?.trim()) {
      return NextResponse.json(
        { error: "accountId, findingId, and note are required" },
        { status: 400 }
      );
    }

    if (getRuntimeDemoMode()) {
      return NextResponse.json({
        data: {
          id: `demo-${Date.now()}`,
          subject: "Dashboard Note",
          body: `<p>${note.trim()}</p>`,
        },
        responderUpdated: !!responder,
        demoMode: true,
      });
    }

    const token = await getAccessToken();
    const comment = await postFindingComment(token, accountId, findingId, {
      subject: "Dashboard Note",
      body: note.trim(),
    });

    let responderUpdated = false;
    if (typeof responder === "string") {
      await updateFinding(token, accountId, findingId, {
        assigned_to: responder.trim() || null,
      });
      responderUpdated = true;
    }

    return NextResponse.json({ data: comment, responderUpdated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
