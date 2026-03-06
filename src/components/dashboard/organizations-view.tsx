"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Monitor,
  Shield,
  Users,
  AlertTriangle,
  Activity,
  Key,
  Wifi,
  WifiOff,
  Ban,
  EyeOff,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./metric-card";
import { formatDistanceToNow } from "date-fns";
import type { EnrichedAccount } from "@/lib/blumira-api";

interface OrgData {
  organizations: EnrichedAccount[];
  totals: Record<string, number>;
}

export function OrganizationsView() {
  const [data, setData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch("/api/blumira/organizations");
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to fetch organizations");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="h-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-500/30">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={fetchData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const organizations = data?.organizations || [];
  const totals = data?.totals || {};

  const getLicenseBadge = (license: string) => {
    const map: Record<string, "default" | "info" | "warning" | "success" | "secondary"> = {
      FREE: "secondary",
      TRIAL: "warning",
      BASIC: "info",
      PREMIUM: "default",
      ENTERPRISE: "success",
    };
    return (
      <Badge variant={map[license?.toUpperCase()] || "secondary"}>
        {license}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Organizations
          </h2>
          <p className="text-muted-foreground">
            {organizations.length} MSP client accounts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Organizations"
          value={organizations.length}
          icon={Building2}
          accentColor="text-blue-400"
        />
        <MetricCard
          title="Total Users"
          value={totals.totalUsers || 0}
          icon={Users}
          accentColor="text-indigo-400"
        />
        <MetricCard
          title="Devices"
          value={totals.totalDevices || 0}
          subtitle={`${totals.onlineDevices || 0} online`}
          icon={Monitor}
          accentColor="text-emerald-400"
        />
        <MetricCard
          title="Critical Findings"
          value={totals.criticalFindings || 0}
          icon={AlertTriangle}
          accentColor="text-red-400"
          urgent={(totals.criticalFindings || 0) > 0}
        />
      </div>

      <div className="space-y-3">
        {organizations.map((org) => {
          const expanded = expandedOrg === org.account_id;
          const utilization =
            org.details?.agent_count_available &&
            org.details.agent_count_available > 0
              ? Math.round(
                  ((org.details.agent_count_used || 0) /
                    org.details.agent_count_available) *
                    100
                )
              : 0;

          return (
            <Card
              key={org.account_id}
              className="hover:border-muted-foreground/20 transition-colors"
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() =>
                  setExpandedOrg(expanded ? null : org.account_id)
                }
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">
                      {org.name}
                    </p>
                    {getLicenseBadge(org.details?.license || "Unknown")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {org.account_id}
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-6 text-xs shrink-0">
                  <div className="text-center">
                    <p className="font-semibold tabular-nums">
                      {org.stats.totalDevices}
                    </p>
                    <p className="text-muted-foreground">Devices</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold tabular-nums">
                      {org.stats.totalFindings}
                    </p>
                    <p className="text-muted-foreground">Findings</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold tabular-nums text-red-400">
                      {org.stats.criticalFindings}
                    </p>
                    <p className="text-muted-foreground">Critical</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold tabular-nums">
                      {org.details?.user_count || 0}
                    </p>
                    <p className="text-muted-foreground">Users</p>
                  </div>
                </div>

                <Button variant="ghost" size="icon" asChild className="shrink-0">
                  <a
                    href={`https://app.blumira.com/${org.account_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>

                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>

              {expanded && (
                <CardContent className="border-t pt-4">
                  <div className="grid gap-6 md:grid-cols-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        License & Users
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            License
                          </span>
                          {getLicenseBadge(
                            org.details?.license || "Unknown"
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Users
                          </span>
                          <span className="font-medium">
                            {org.details?.user_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        Agent Capacity
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Used</span>
                          <span className="font-medium">
                            {org.details?.agent_count_used || 0} /{" "}
                            {org.details?.agent_count_available || 0}
                          </span>
                        </div>
                        <Progress value={utilization} />
                        <p className="text-xs text-muted-foreground">
                          {utilization}% utilization
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5" />
                        Device Status
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Wifi className="h-3 w-3 text-emerald-400" />
                            Online
                          </span>
                          <span className="font-medium">
                            {org.stats.onlineDevices}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <WifiOff className="h-3 w-3 text-amber-400" />
                            Sleeping
                          </span>
                          <span className="font-medium">
                            {org.stats.sleepingDevices}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Ban className="h-3 w-3 text-red-400" />
                            Isolated
                          </span>
                          <span className="font-medium">
                            {org.stats.isolatedDevices}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <EyeOff className="h-3 w-3 text-gray-400" />
                            Excluded
                          </span>
                          <span className="font-medium">
                            {org.stats.excludedDevices}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Security
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Total
                          </span>
                          <span className="font-medium">
                            {org.stats.totalFindings}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Critical
                          </span>
                          <span className="font-medium text-red-400">
                            {org.stats.criticalFindings}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Open</span>
                          <span className="font-medium text-amber-400">
                            {org.stats.openFindings}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Keys</span>
                          <span className="font-medium">
                            {org.stats.agentKeysCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {org.agentDevices.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Recent Devices ({org.agentDevices.length})
                      </h4>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {org.agentDevices.slice(0, 6).map((device) => (
                          <div
                            key={device.device_id}
                            className="rounded-lg border p-3 text-sm"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {device.is_excluded ? (
                                <EyeOff className="h-3 w-3 text-gray-400" />
                              ) : device.is_isolated ? (
                                <Ban className="h-3 w-3 text-red-400" />
                              ) : device.is_sleeping ? (
                                <WifiOff className="h-3 w-3 text-amber-400" />
                              ) : (
                                <Wifi className="h-3 w-3 text-emerald-400" />
                              )}
                              <span className="font-medium truncate">
                                {device.hostname}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {device.plat} ({device.arch}) · {device.keyname}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Last seen{" "}
                              {formatDistanceToNow(new Date(device.alive), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}

        {organizations.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No organizations found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check your API credentials and permissions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
