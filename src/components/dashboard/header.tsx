"use client";

import { RefreshCw, Search, Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  criticalCount: number;
  lastUpdated?: string;
}

export function Header({
  onRefresh,
  refreshing,
  searchTerm,
  onSearchChange,
  criticalCount,
  lastUpdated,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white/80 backdrop-blur-sm px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search findings, organizations, devices..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-muted/50"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {lastUpdated && (
          <span className="text-xs text-muted-foreground hidden lg:block">
            Updated {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {criticalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {criticalCount > 9 ? "9+" : criticalCount}
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>

        <Button variant="outline" size="sm" asChild>
          <a
            href="https://app.blumira.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Blumira
          </a>
        </Button>
      </div>
    </header>
  );
}
