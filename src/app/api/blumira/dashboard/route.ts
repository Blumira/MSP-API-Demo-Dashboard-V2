import { NextResponse } from "next/server";
import {
  getAccessToken,
  fetchMspAccounts,
  fetchAllFindings,
  fetchAccountUsers,
  type BlumiraUser,
} from "@/lib/blumira-api";
import {
  getDemoAccounts,
  getDemoFindings,
  getDemoAllUsers,
} from "@/lib/demo-data";
import { getRuntimeDemoMode } from "../credentials/route";

export const dynamic = "force-dynamic";

export async function GET() {
  if (getRuntimeDemoMode()) {
    const accounts = getDemoAccounts();
    const findings = getDemoFindings();
    const users = getDemoAllUsers();

    return NextResponse.json({
      accounts,
      findings,
      users,
      demoMode: true,
      hasCredentials: !!(process.env.BLUMIRA_CLIENT_ID && process.env.BLUMIRA_CLIENT_SECRET),
      meta: {
        accountsCount: accounts.length,
        findingsCount: findings.length,
        usersCount: users.length,
        timestamp: new Date().toISOString(),
        dataSource: "demo",
      },
    });
  }

  const hasClientId = !!process.env.BLUMIRA_CLIENT_ID;
  const hasClientSecret = !!process.env.BLUMIRA_CLIENT_SECRET;
  const hasCredentials = hasClientId && hasClientSecret;

  if (!hasCredentials) {
    return NextResponse.json({
      accounts: [],
      findings: [],
      users: [],
      requiresAuth: true,
      hasCredentials: false,
      meta: { accountsCount: 0, findingsCount: 0, usersCount: 0, timestamp: new Date().toISOString() },
    });
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({
      accounts: [],
      findings: [],
      users: [],
      hasCredentials: true,
      authError: message,
      meta: { accountsCount: 0, findingsCount: 0, usersCount: 0, timestamp: new Date().toISOString() },
    });
  }

  const warnings: string[] = [];
  let accounts: Awaited<ReturnType<typeof fetchMspAccounts>> = [];
  let findings: Awaited<ReturnType<typeof fetchAllFindings>> = [];

  try {
    accounts = await fetchMspAccounts(token);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.warn("Failed to fetch accounts:", msg);
    warnings.push(`Accounts: ${msg}`);
  }

  try {
    findings = await fetchAllFindings(token);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.warn("Failed to fetch findings:", msg);
    warnings.push(`Findings: ${msg}`);
  }

  const usersMap = new Map<string, BlumiraUser>();
  const userFetches = accounts.map(async (account) => {
    try {
      const accountUsers = await fetchAccountUsers(token, account.account_id);
      for (const user of accountUsers) {
        const key = user.user_id || user.email;
        if (!usersMap.has(key)) {
          usersMap.set(key, { ...user, org_name: account.name, org_id: account.account_id });
        }
      }
    } catch {
      // continue if a single account's users fail
    }
  });
  await Promise.all(userFetches);

  const users = Array.from(usersMap.values()).sort((a, b) => {
    const nameA = a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || a.email;
    const nameB = b.name || `${b.first_name || ""} ${b.last_name || ""}`.trim() || b.email;
    return nameA.localeCompare(nameB);
  });

  return NextResponse.json({
    accounts,
    findings,
    users,
    hasCredentials: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    meta: {
      accountsCount: accounts.length,
      findingsCount: findings.length,
      usersCount: users.length,
      timestamp: new Date().toISOString(),
      dataSource: "live",
    },
  });
}
