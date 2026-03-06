import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo-data";

let runtimeDemoMode: boolean | null = null;

export function getRuntimeDemoMode(): boolean {
  if (runtimeDemoMode !== null) return runtimeDemoMode;
  return isDemoMode();
}

export function setRuntimeDemoMode(value: boolean) {
  runtimeDemoMode = value;
}

async function testCredentials(clientId: string, clientSecret: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("https://auth.blumira.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience: "public-api",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `Authentication failed (${response.status}): ${text}` };
    }

    const data = await response.json();
    if (!data.access_token) {
      return { ok: false, error: "No access token in response" };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

export async function GET() {
  const clientId = process.env.BLUMIRA_CLIENT_ID || "";
  const clientSecret = process.env.BLUMIRA_CLIENT_SECRET || "";
  const hasClientId = !!clientId;
  const hasClientSecret = !!clientSecret;
  const hasCredentials = hasClientId && hasClientSecret;
  const demoMode = getRuntimeDemoMode();

  let connectionStatus: "connected" | "auth_failed" | "none" = "none";
  let connectionError: string | undefined;

  if (hasCredentials && !demoMode) {
    const result = await testCredentials(clientId, clientSecret);
    connectionStatus = result.ok ? "connected" : "auth_failed";
    connectionError = result.error;
  } else if (hasCredentials && demoMode) {
    connectionStatus = "connected";
  }

  return NextResponse.json({
    hasCredentials,
    hasClientId,
    hasClientSecret,
    demoMode,
    connectionStatus,
    connectionError,
    dataSource: demoMode ? "demo" : connectionStatus === "connected" ? "live" : hasCredentials ? "error" : "none",
    environment: {
      demoModeEnv: process.env.DEMO_MODE || "false",
      hasClientIdEnv: hasClientId,
      hasClientSecretEnv: hasClientSecret,
      nodeEnv: process.env.NODE_ENV || "development",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.toggleDemo !== undefined) {
      setRuntimeDemoMode(!!body.toggleDemo);
      return NextResponse.json({
        success: true,
        demoMode: getRuntimeDemoMode(),
        message: body.toggleDemo
          ? "Demo mode enabled — using synthetic data"
          : "Demo mode disabled — using live API data",
      });
    }

    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID and Client Secret are required" },
        { status: 400 }
      );
    }

    const authResponse = await fetch("https://auth.blumira.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience: "public-api",
      }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      return NextResponse.json(
        { error: "Invalid credentials", details: errorText },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    if (!authData.access_token) {
      return NextResponse.json(
        { error: "Invalid response from authentication server" },
        { status: 401 }
      );
    }

    process.env.BLUMIRA_CLIENT_ID = clientId;
    process.env.BLUMIRA_CLIENT_SECRET = clientSecret;

    if (getRuntimeDemoMode()) {
      setRuntimeDemoMode(false);
    }

    return NextResponse.json({
      success: true,
      message: "Credentials validated and saved successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update credentials" },
      { status: 500 }
    );
  }
}
