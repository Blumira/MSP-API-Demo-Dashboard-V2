import { NextResponse } from "next/server";
import {
  getAccessToken,
  fetchMspAccounts,
  fetchEnrichedAccount,
} from "@/lib/blumira-api";
import { getDemoEnrichedAccounts } from "@/lib/demo-data";
import { getRuntimeDemoMode } from "../credentials/route";

export const dynamic = "force-dynamic";

export async function GET() {
  if (getRuntimeDemoMode()) {
    const enriched = getDemoEnrichedAccounts();

    const totals = enriched.reduce(
      (acc, org) => ({
        totalFindings: acc.totalFindings + org.stats.totalFindings,
        criticalFindings: acc.criticalFindings + org.stats.criticalFindings,
        openFindings: acc.openFindings + org.stats.openFindings,
        totalDevices: acc.totalDevices + org.stats.totalDevices,
        onlineDevices: acc.onlineDevices + org.stats.onlineDevices,
        sleepingDevices: acc.sleepingDevices + org.stats.sleepingDevices,
        isolatedDevices: acc.isolatedDevices + org.stats.isolatedDevices,
        excludedDevices: acc.excludedDevices + org.stats.excludedDevices,
        totalAgentKeys: acc.totalAgentKeys + org.stats.agentKeysCount,
        totalUsers: acc.totalUsers + (org.details?.user_count || 0),
        totalAgentCapacity: acc.totalAgentCapacity + (org.details?.agent_count_available || 0),
        totalAgentUsed: acc.totalAgentUsed + (org.details?.agent_count_used || 0),
      }),
      {
        totalFindings: 0, criticalFindings: 0, openFindings: 0,
        totalDevices: 0, onlineDevices: 0, sleepingDevices: 0,
        isolatedDevices: 0, excludedDevices: 0, totalAgentKeys: 0,
        totalUsers: 0, totalAgentCapacity: 0, totalAgentUsed: 0,
      }
    );

    return NextResponse.json({
      organizations: enriched,
      totals,
      demoMode: true,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const token = await getAccessToken();
    const accounts = await fetchMspAccounts(token);

    const enriched = await Promise.all(
      accounts.map((account) => fetchEnrichedAccount(token, account))
    );

    const totals = enriched.reduce(
      (acc, org) => ({
        totalFindings: acc.totalFindings + org.stats.totalFindings,
        criticalFindings: acc.criticalFindings + org.stats.criticalFindings,
        openFindings: acc.openFindings + org.stats.openFindings,
        totalDevices: acc.totalDevices + org.stats.totalDevices,
        onlineDevices: acc.onlineDevices + org.stats.onlineDevices,
        sleepingDevices: acc.sleepingDevices + org.stats.sleepingDevices,
        isolatedDevices: acc.isolatedDevices + org.stats.isolatedDevices,
        excludedDevices: acc.excludedDevices + org.stats.excludedDevices,
        totalAgentKeys: acc.totalAgentKeys + org.stats.agentKeysCount,
        totalUsers: acc.totalUsers + (org.details?.user_count || 0),
        totalAgentCapacity:
          acc.totalAgentCapacity +
          (org.details?.agent_count_available || 0),
        totalAgentUsed:
          acc.totalAgentUsed + (org.details?.agent_count_used || 0),
      }),
      {
        totalFindings: 0,
        criticalFindings: 0,
        openFindings: 0,
        totalDevices: 0,
        onlineDevices: 0,
        sleepingDevices: 0,
        isolatedDevices: 0,
        excludedDevices: 0,
        totalAgentKeys: 0,
        totalUsers: 0,
        totalAgentCapacity: 0,
        totalAgentUsed: 0,
      }
    );

    return NextResponse.json({
      organizations: enriched,
      totals,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
