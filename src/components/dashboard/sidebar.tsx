"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  Building2,
  Monitor,
  BarChart3,
  Settings,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  findingsBadge?: number;
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "findings", label: "Findings", icon: AlertTriangle },
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "agents", label: "Agents & Devices", icon: Monitor },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  activeView,
  onViewChange,
  collapsed,
  onCollapsedChange,
  findingsBadge,
}: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-blue-600" />
              <div>
                <h1 className="text-sm font-bold text-foreground tracking-tight">
                  BLUMIRA
                </h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">
                  MSP Dashboard
                </p>
              </div>
            </div>
          )}
          {collapsed && (
            <Shield className="h-7 w-7 text-blue-600 mx-auto" />
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const button = (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {!collapsed &&
                  item.id === "findings" &&
                  findingsBadge !== undefined &&
                  findingsBadge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-semibold text-red-600">
                      {findingsBadge}
                    </span>
                  )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.label}
                    {item.id === "findings" &&
                      findingsBadge !== undefined &&
                      findingsBadge > 0 && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                          {findingsBadge}
                        </span>
                      )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
