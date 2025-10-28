import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://auth.blumira.com/oauth/token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.BLUMIRA_CLIENT_ID,
      client_secret: process.env.BLUMIRA_CLIENT_SECRET,
      audience: "public-api",
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    console.error(await res.text());
    return NextResponse.json({ error: "token_error" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ token: data.access_token });
}
