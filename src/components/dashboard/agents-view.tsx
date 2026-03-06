"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Monitor,
  Wifi,
  WifiOff,
  Ban,
  EyeOff,
  Key,
  RefreshCw,
  AlertTriangle,
  Search,
  HardDrive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "./metric-card";
import { formatDistanceToNow } from "date-fns";
import type { EnrichedAccount, AgentDevice } from "@/lib/blumira-api";

interface DeviceWithOrg extends AgentDevice {
  orgName: string;
  orgId: string;
}

export function AgentsView() {
  const [organizations, setOrganizations] = useState<EnrichedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch("/api/blumira/organizations");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed");
      setOrganizations(result.organizations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allDevices: DeviceWithOrg[] = useMemo(
    () =>
      organizations.flatMap((org) =>
        org.agentDevices.map((d) => ({
          ...d,
          orgName: org.name,
          orgId: org.account_id,
        }))
      ),
    [organizations]
  );

  const filteredDevices = useMemo(() => {
    let result = allDevices;

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.hostname.toLowerCase().includes(term) ||
          d.orgName.toLowerCase().includes(term) ||
          d.plat.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((d) => {
        switch (statusFilter) {
          case "online":
            return !d.is_sleeping && !d.is_isolated && !d.is_excluded;
          case "sleeping":
            return d.is_sleeping;
          case "isolated":
            return d.is_isolated;
          case "excluded":
            return d.is_excluded;
          default:
            return true;
        }
      });
    }

    if (orgFilter !== "all") {
      result = result.filter((d) => d.orgId === orgFilter);
    }

    return result;
  }, [allDevices, search, statusFilter, orgFilter]);

  const totals = useMemo(
    () => ({
      total: allDevices.length,
      online: allDevices.filter(
        (d) => !d.is_sleeping && !d.is_isolated && !d.is_excluded
      ).length,
      sleeping: allDevices.filter((d) => d.is_sleeping).length,
      isolated: allDevices.filter((d) => d.is_isolated).length,
      excluded: allDevices.filter((d) => d.is_excluded).length,
      keys: organizations.reduce(
        (sum, org) => sum + org.agentKeys.length,
        0
      ),
    }),
    [allDevices, organizations]
  );

  function getDeviceStatusIcon(device: AgentDevice) {
    if (device.is_excluded) return <EyeOff className="h-3.5 w-3.5 text-gray-400" />;
    if (device.is_isolated) return <Ban className="h-3.5 w-3.5 text-red-400" />;
    if (device.is_sleeping) return <WifiOff className="h-3.5 w-3.5 text-amber-400" />;
    return <Wifi className="h-3.5 w-3.5 text-emerald-400" />;
  }

  function getDeviceStatusBadge(device: AgentDevice) {
    if (device.is_excluded) return <Badge variant="secondary">Excluded</Badge>;
    if (device.is_isolated) return <Badge variant="destructive">Isolated</Badge>;
    if (device.is_sleeping) return <Badge variant="warning">Sleeping</Badge>;
    return <Badge variant="success">Online</Badge>;
  }

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
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Agents & Devices
          </h2>
          <p className="text-muted-foreground">
            {filteredDevices.length} of {allDevices.length} devices
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Devices"
          value={totals.total}
          icon={HardDrive}
          accentColor="text-blue-400"
        />
        <MetricCard
          title="Online"
          value={totals.online}
          icon={Wifi}
          accentColor="text-emerald-400"
        />
        <MetricCard
          title="Sleeping"
          value={totals.sleeping}
          icon={WifiOff}
          accentColor="text-amber-400"
        />
        <MetricCard
          title="Isolated"
          value={totals.isolated}
          icon={Ban}
          accentColor="text-red-400"
          urgent={totals.isolated > 0}
        />
        <MetricCard
          title="Agent Keys"
          value={totals.keys}
          icon={Key}
          accentColor="text-indigo-400"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="sleeping">Sleeping</SelectItem>
            <SelectItem value="isolated">Isolated</SelectItem>
            <SelectItem value="excluded">Excluded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.account_id} value={org.account_id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.slice(0, 60).map((device) => (
          <Card
            key={device.device_id}
            className="hover:border-muted-foreground/20 transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {getDeviceStatusIcon(device)}
                  <span className="text-sm font-semibold truncate">
                    {device.hostname}
                  </span>
                </div>
                {getDeviceStatusBadge(device)}
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  {device.plat} ({device.arch})
                </p>
                <p className="truncate">{device.orgName}</p>
                <p>Key: {device.keyname}</p>
                <p>
                  Last seen{" "}
                  {formatDistanceToNow(new Date(device.alive), {
                    addSuffix: true,
                  })}
                </p>
                {device.isolation_requested && (
                  <p className="text-red-400 font-medium">
                    Isolation requested
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Monitor className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No devices found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      )}

      {filteredDevices.length > 60 && (
        <p className="text-xs text-center text-muted-foreground">
          Showing 60 of {filteredDevices.length} devices
        </p>
      )}
    </div>
  );
}
