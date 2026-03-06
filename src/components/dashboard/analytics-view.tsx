"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Finding } from "@/lib/blumira-api";

interface AnalyticsViewProps {
  findings: Finding[];
}

function BarChart({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground truncate max-w-[60%]">
              {item.label}
            </span>
            <span className="font-medium tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${color}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineChart({ data }: { data: { label: string; value: number; critical: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] text-muted-foreground tabular-nums">
            {item.value > 0 ? item.value : ""}
          </span>
          <div className="w-full flex flex-col-reverse gap-[1px]">
            {item.critical > 0 && (
              <div
                className="w-full bg-red-500 rounded-t-sm"
                style={{
                  height: `${(item.critical / max) * 120}px`,
                }}
              />
            )}
            <div
              className="w-full bg-blue-500 rounded-t-sm"
              style={{
                height: `${((item.value - item.critical) / max) * 120}px`,
              }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground -rotate-45 origin-left whitespace-nowrap">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsView({ findings }: AnalyticsViewProps) {
  const priorityData = useMemo(
    () =>
      [
        { priority: 1, label: "Critical", color: "text-red-400" },
        { priority: 2, label: "High", color: "text-amber-400" },
        { priority: 3, label: "Medium", color: "text-blue-400" },
        { priority: 4, label: "Low", color: "text-emerald-400" },
        { priority: 5, label: "Info", color: "text-gray-400" },
      ].map((p) => ({
        ...p,
        count: findings.filter((f) => f.priority === p.priority).length,
      })),
    [findings]
  );

  const total = findings.length || 1;

  const orgData = useMemo(() => {
    const counts: Record<string, number> = {};
    findings.forEach((f) => {
      counts[f.org_name] = (counts[f.org_name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [findings]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    findings.forEach((f) => {
      counts[f.status_name] = (counts[f.status_name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [findings]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    findings.forEach((f) => {
      counts[f.type_name] = (counts[f.type_name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [findings]);

  const timelineData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (13 - i));
      const dateStr = date.toISOString().split("T")[0];
      const dayFindings = findings.filter(
        (f) => new Date(f.created).toISOString().split("T")[0] === dateStr
      );
      return {
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: dayFindings.length,
        critical: dayFindings.filter((f) => f.priority === 1).length,
      };
    });
  }, [findings]);

  const closedFindings = findings.filter((f) => f.status_name !== "Open");
  const avgCloseTime = useMemo(() => {
    if (closedFindings.length === 0) return 0;
    const totalHours = closedFindings.reduce((sum, f) => {
      const created = new Date(f.created).getTime();
      const modified = new Date(f.modified).getTime();
      return sum + (modified - created) / (1000 * 60 * 60);
    }, 0);
    return Math.round(totalHours / closedFindings.length);
  }, [closedFindings]);

  if (findings.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-sm font-medium">No findings data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Analytics will appear once findings are loaded
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Insights from {findings.length} findings across{" "}
          {new Set(findings.map((f) => f.org_name)).size} organizations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-red-400">
              {priorityData[0].count}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-amber-400">
              {priorityData[1].count}
            </p>
            <p className="text-xs text-muted-foreground mt-1">High</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-emerald-400">
              {closedFindings.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-blue-400">
              {avgCloseTime}h
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg Resolution
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Findings Timeline (14 Days)
          </CardTitle>
          <CardDescription>
            Daily new findings · Red = Critical
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimelineChart data={timelineData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityData.map((item) => (
                <div key={item.priority} className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.priority === 1
                        ? "bg-red-500"
                        : item.priority === 2
                        ? "bg-amber-500"
                        : item.priority === 3
                        ? "bg-blue-500"
                        : item.priority === 4
                        ? "bg-emerald-500"
                        : "bg-gray-500"
                    }`}
                  />
                  <span className="text-sm flex-1">{item.label}</span>
                  <span className="text-sm font-medium tabular-nums">
                    {item.count}
                  </span>
                  <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">
                    {((item.count / total) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={statusData} color="bg-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Organizations</CardTitle>
            <CardDescription>
              By total finding count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={orgData} color="bg-indigo-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Threat Types</CardTitle>
            <CardDescription>
              Most common detection types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={typeData} color="bg-amber-500" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
