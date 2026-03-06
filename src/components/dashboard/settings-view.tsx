"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  Trash2,
  Info,
  Database,
  FlaskConical,
  Server,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface CredentialsStatus {
  hasCredentials: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  demoMode: boolean;
  connectionStatus: "connected" | "auth_failed" | "none";
  connectionError?: string;
  dataSource: "demo" | "live" | "error" | "none";
  environment: {
    demoModeEnv: string;
    hasClientIdEnv: boolean;
    hasClientSecretEnv: boolean;
    nodeEnv: string;
  };
}

interface SettingsViewProps {
  onDemoModeChange?: (demoMode: boolean) => void;
  onCredentialsSaved?: () => void;
}

export function SettingsView({ onDemoModeChange, onCredentialsSaved }: SettingsViewProps) {
  const [status, setStatus] = useState<CredentialsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingDemo, setTogglingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showId, setShowId] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [form, setForm] = useState({ clientId: "", clientSecret: "" });

  const fetchStatus = async () => {
    try {
      setError(null);
      const res = await fetch("/api/blumira/credentials");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to check credentials status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSave = async () => {
    if (!form.clientId.trim() || !form.clientSecret.trim()) {
      setError("Both Client ID and Client Secret are required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/blumira/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId.trim(),
          clientSecret: form.clientSecret.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setSuccess("Credentials validated and saved — loading your data...");
      setForm({ clientId: "", clientSecret: "" });
      await fetchStatus();
      onCredentialsSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDemoToggle = async (enabled: boolean) => {
    setTogglingDemo(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/blumira/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleDemo: enabled }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle demo mode");

      setSuccess(data.message);
      await fetchStatus();
      onDemoModeChange?.(enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle demo mode");
    } finally {
      setTogglingDemo(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your Blumira API connection and data source
        </p>
      </div>

      {/* Data Source Status */}
      <Card className="border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            Data Source Status
          </CardTitle>
          <CardDescription>
            See where your dashboard data is coming from
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking status...
            </div>
          ) : status ? (
            <>
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                {status.dataSource === "demo" ? (
                  <FlaskConical className="h-6 w-6 text-purple-400" />
                ) : status.dataSource === "live" ? (
                  <Server className="h-6 w-6 text-emerald-400" />
                ) : status.dataSource === "error" ? (
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {status.dataSource === "demo"
                      ? "Demo Mode Active"
                      : status.dataSource === "live"
                        ? "Live API Connected"
                        : status.dataSource === "error"
                          ? "Authentication Failed"
                          : "No Data Source"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {status.dataSource === "demo"
                      ? "Displaying synthetic data for testing and exploration"
                      : status.dataSource === "live"
                        ? "Fetching real-time data from the Blumira API"
                        : status.dataSource === "error"
                          ? "Credentials are configured but authentication failed — check your Client ID and Secret below"
                          : "Configure credentials or enable demo mode to get started"}
                  </p>
                </div>
                <Badge
                  variant={
                    status.dataSource === "demo"
                      ? "secondary"
                      : status.dataSource === "live"
                        ? "success"
                        : status.dataSource === "error"
                          ? "destructive"
                          : "warning"
                  }
                >
                  {status.dataSource === "demo"
                    ? "Demo"
                    : status.dataSource === "live"
                      ? "Live"
                      : status.dataSource === "error"
                        ? "Error"
                        : "Inactive"}
                </Badge>
              </div>

              {status.connectionError && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-xs break-all">{status.connectionError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border space-y-1.5">
                  <p className="font-medium text-muted-foreground uppercase tracking-wider">Environment</p>
                  <div className="flex items-center justify-between">
                    <span>Node Env</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">{status.environment.nodeEnv}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Demo Mode (env)</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">{status.environment.demoModeEnv}</Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg border space-y-1.5">
                  <p className="font-medium text-muted-foreground uppercase tracking-wider">Credentials</p>
                  <div className="flex items-center justify-between">
                    <span>Client ID</span>
                    {status.hasClientId ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Client Secret</span>
                    {status.hasClientSecret ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Demo Mode Toggle */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4" />
            Demo Mode
          </CardTitle>
          <CardDescription>
            Use synthetic data to explore the dashboard without real API credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
                Enable Demo Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Loads realistic sample data including 5 organizations, 18 findings, 198 devices, and 10 users
              </p>
            </div>
            <div className="flex items-center gap-2">
              {togglingDemo && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Switch
                id="demo-mode"
                checked={status?.demoMode || false}
                onCheckedChange={handleDemoToggle}
                disabled={togglingDemo}
              />
            </div>
          </div>

          {status?.demoMode && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 text-purple-300 text-sm">
              <FlaskConical className="h-4 w-4 shrink-0" />
              Demo mode is active. The dashboard is showing synthetic data. Toggle off or enter real credentials to switch to live data.
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Tip: You can also enable demo mode via environment variable by setting{" "}
            <code className="bg-muted px-1 rounded">DEMO_MODE=true</code> in your{" "}
            <code className="bg-muted px-1 rounded">.env.local</code> file, or copy the provided{" "}
            <code className="bg-muted px-1 rounded">.env.test</code> file.
          </p>
        </CardContent>
      </Card>

      {/* API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            API Credentials
          </CardTitle>
          <CardDescription>
            Connect to the Blumira API using your client credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Connection Status</h4>
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                {status.connectionStatus === "connected" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : status.connectionStatus === "auth_failed" ? (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {status.connectionStatus === "connected"
                      ? "Connected"
                      : status.connectionStatus === "auth_failed"
                        ? "Authentication Failed"
                        : "Not configured"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {status.connectionStatus === "connected"
                      ? "API credentials are validated and working"
                      : status.connectionStatus === "auth_failed"
                        ? "Credentials are set but could not authenticate — re-enter them below"
                        : "Enter your credentials to get started"}
                  </p>
                </div>
                <Badge
                  variant={status.connectionStatus === "connected" ? "success" : status.connectionStatus === "auth_failed" ? "destructive" : "warning"}
                >
                  {status.connectionStatus === "connected" ? "Active" : status.connectionStatus === "auth_failed" ? "Failed" : "Inactive"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded border">
                  {status.hasClientId ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  )}
                  <span className="text-xs">Client ID</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded border">
                  {status.hasClientSecret ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  )}
                  <span className="text-xs">Client Secret</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">
              {status?.hasCredentials
                ? "Update Credentials"
                : "Enter Credentials"}
            </h4>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <div className="relative">
                <Input
                  id="clientId"
                  type={showId ? "text" : "password"}
                  placeholder="Enter your Blumira Client ID"
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientId: e.target.value }))
                  }
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowId(!showId)}
                >
                  {showId ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecret ? "text" : "password"}
                  placeholder="Enter your Blumira Client Secret"
                  value={form.clientSecret}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      clientSecret: e.target.value,
                    }))
                  }
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !form.clientId.trim() ||
                !form.clientSecret.trim()
              }
              className="w-full"
            >
              <Key
                className={`h-4 w-4 mr-2 ${saving ? "animate-pulse" : ""}`}
              />
              {saving ? "Validating..." : "Save Credentials"}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">How to get your credentials</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Log in to your Blumira account at app.blumira.com</li>
              <li>Navigate to Settings &rarr; API Management</li>
              <li>Create a new API application (or use an existing one)</li>
              <li>Copy the Client ID and Client Secret</li>
              <li>Paste them into the form above</li>
            </ol>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://app.blumira.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Blumira Console
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            About this Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            This MSP Dashboard demonstrates what&apos;s possible using the Blumira
            Public API for Managed Service Providers. It provides a unified
            view of security findings, agent devices, and organization
            management across all your MSP client accounts.
          </p>
          <div className="space-y-1">
            <p className="text-foreground font-medium">API Endpoints Used:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  GET /msp/accounts
                </code>{" "}
                &mdash; List all MSP client accounts
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  GET /msp/accounts/:id
                </code>{" "}
                &mdash; Account details (license, capacity)
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  GET /msp/accounts/findings
                </code>{" "}
                &mdash; All findings across accounts
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  GET /msp/accounts/:id/findings
                </code>{" "}
                &mdash; Findings per account
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  GET /msp/accounts/:id/agents/devices
                </code>{" "}
                &mdash; Agent devices
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  GET /msp/accounts/:id/agents/keys
                </code>{" "}
                &mdash; Agent deployment keys
              </li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-foreground font-medium">
              About Blumira Findings:
            </p>
            <p>
              Findings are security detections organized by priority (P1
              Critical through P5 Info). They can be Threats (requiring
              action), Suspects (potential threats), or Operational findings
              (configuration and health). Each finding links directly to the
              Blumira platform for investigation and response.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
