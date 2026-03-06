"use client";

import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  Activity,
  Clock,
  Building2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MetricCard } from "./metric-card";
import { FindingDetailDialog } from "./finding-detail-dialog";
import type { Finding, BlumiraUser } from "@/lib/blumira-api";
import { formatDistanceToNow } from "date-fns";

interface OverviewViewProps {
  findings: Finding[];
  accountCount: number;
  onNavigate: (view: string) => void;
  users: BlumiraUser[];
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "open":
      return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
    case "closed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case "dismissed":
      return <XCircle className="h-3.5 w-3.5 text-gray-400" />;
    default:
      return <AlertCircle className="h-3.5 w-3.5 text-gray-400" />;
  }
}

function getPriorityBadge(priority: number) {
  const map: Record<number, { label: string; variant: "destructive" | "warning" | "default" | "secondary" | "info" }> = {
    1: { label: "P1 Critical", variant: "destructive" },
    2: { label: "P2 High", variant: "warning" },
    3: { label: "P3 Medium", variant: "default" },
    4: { label: "P4 Low", variant: "info" },
    5: { label: "P5 Info", variant: "secondary" },
  };
  const entry = map[priority] || { label: `P${priority}`, variant: "secondary" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function OverviewView({
  findings,
  accountCount,
  onNavigate,
  users,
}: OverviewViewProps) {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const criticalFindings = findings.filter((f) => f.priority === 1);
  const openFindings = findings.filter((f) => f.status_name === "Open");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentFindings = findings
    .filter((f) => new Date(f.created) >= weekAgo)
    .sort(
      (a, b) =>
        new Date(b.created).getTime() - new Date(a.created).getTime()
    );

  const orgs = new Set(findings.map((f) => f.org_name));

  const priorityDistribution = [1, 2, 3, 4, 5].map((p) => ({
    priority: p,
    count: findings.filter((f) => f.priority === p).length,
  }));

  const maxCount = Math.max(...priorityDistribution.map((d) => d.count), 1);

  const priorityLabels: Record<number, string> = {
    1: "Critical",
    2: "High",
    3: "Medium",
    4: "Low",
    5: "Info",
  };

  const priorityColors: Record<number, string> = {
    1: "bg-red-500",
    2: "bg-amber-500",
    3: "bg-blue-500",
    4: "bg-emerald-500",
    5: "bg-gray-400",
  };

  const openFinding = (finding: Finding) => {
    setSelectedFinding(finding);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Security Overview
        </h2>
        <p className="text-muted-foreground">
          Real-time security posture across all MSP accounts
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Findings"
          value={findings.length}
          subtitle="Across all accounts"
          icon={Shield}
          accentColor="text-blue-500"
        />
        <MetricCard
          title="Critical"
          value={criticalFindings.length}
          subtitle="Immediate attention needed"
          icon={AlertTriangle}
          accentColor="text-red-500"
          urgent={criticalFindings.length > 0}
        />
        <MetricCard
          title="Open Findings"
          value={openFindings.length}
          subtitle="Awaiting resolution"
          icon={Activity}
          accentColor="text-amber-500"
        />
        <MetricCard
          title="Recent (7d)"
          value={recentFindings.length}
          subtitle={`${accountCount} organizations`}
          icon={Clock}
          accentColor="text-emerald-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Critical Findings
            </CardTitle>
            {criticalFindings.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("findings")}
              >
                View all
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {criticalFindings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-emerald-50 p-3 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium">No Critical Findings</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All systems look healthy
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[340px]">
                <div className="space-y-3">
                  {criticalFindings.slice(0, 10).map((finding) => (
                    <div
                      key={finding.finding_id}
                      onClick={() => openFinding(finding)}
                      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 cursor-pointer hover:bg-red-100/80 transition-colors"
                    >
                      <div className="mt-0.5">
                        {getStatusIcon(finding.status_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {finding.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{finding.org_name}</span>
                          <span>·</span>
                          <span>{finding.type_name}</span>
                          <span>·</span>
                          <span>
                            {formatDistanceToNow(new Date(finding.created), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={`https://app.blumira.com/${finding.org_id}/reporting/findings/${finding.finding_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Priority Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priorityDistribution.map((item) => (
                  <div key={item.priority} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {priorityLabels[item.priority]}
                      </span>
                      <span className="font-medium tabular-nums">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${priorityColors[item.priority]}`}
                        style={{
                          width: `${(item.count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Top Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from(orgs)
                  .map((org) => ({
                    name: org,
                    count: findings.filter((f) => f.org_name === org).length,
                    critical: findings.filter(
                      (f) => f.org_name === org && f.priority === 1
                    ).length,
                  }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((org) => (
                    <div
                      key={org.name}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{org.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {org.critical > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5">
                            {org.critical}
                          </Badge>
                        )}
                        <span className="text-sm font-medium tabular-nums w-8 text-right">
                          {org.count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("findings")}
          >
            View all
          </Button>
        </CardHeader>
        <CardContent>
          {recentFindings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No findings in the last 7 days
            </p>
          ) : (
            <div className="space-y-2">
              {recentFindings.slice(0, 8).map((finding) => (
                <div
                  key={finding.finding_id}
                  onClick={() => openFinding(finding)}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {getStatusIcon(finding.status_name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {finding.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {finding.org_name} ·{" "}
                      {formatDistanceToNow(new Date(finding.created), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getPriorityBadge(finding.priority)}
                    <Badge variant="outline" className="text-[10px]">
                      {finding.status_name}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={`https://app.blumira.com/${finding.org_id}/reporting/findings/${finding.finding_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FindingDetailDialog
        finding={selectedFinding}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        users={users}
      />
    </div>
  );
}
