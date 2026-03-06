"use client";

import { useState, useMemo, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  StickyNote,
  UserCheck,
  XSquare,
  MessageSquarePlus,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Finding, BlumiraUser } from "@/lib/blumira-api";
import {
  getAnnotation,
  bulkSetAssignee,
  bulkAddNote,
  bulkSetLocalStatus,
} from "@/lib/annotations";
import { formatDistanceToNow } from "date-fns";
import { FindingDetailDialog } from "./finding-detail-dialog";

interface FindingsViewProps {
  findings: Finding[];
  searchTerm: string;
  users: BlumiraUser[];
}

type SortField = "priority" | "created" | "name" | "org_name";
type SortDir = "asc" | "desc";

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
    1: { label: "Critical", variant: "destructive" },
    2: { label: "High", variant: "warning" },
    3: { label: "Medium", variant: "default" },
    4: { label: "Low", variant: "info" },
    5: { label: "Info", variant: "secondary" },
  };
  const entry = map[priority] || { label: `P${priority}`, variant: "secondary" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

function getUserDisplayName(user: BlumiraUser): string {
  if (user.name) return user.name;
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;
}

export function FindingsView({ findings, searchTerm, users }: FindingsViewProps) {
  const [orgFilter, setOrgFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showCount, setShowCount] = useState(50);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [annotationVersion, setAnnotationVersion] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"none" | "assign" | "note" | "close">("none");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkNote, setBulkNote] = useState("");
  const [bulkUserSearch, setBulkUserSearch] = useState("");
  const [showBulkUserDropdown, setShowBulkUserDropdown] = useState(false);

  const organizations = useMemo(
    () => [...new Set(findings.map((f) => f.org_name))].sort(),
    [findings]
  );
  const statuses = useMemo(
    () => [...new Set(findings.map((f) => f.status_name))].sort(),
    [findings]
  );

  const filtered = useMemo(() => {
    let result = findings;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.org_name.toLowerCase().includes(term) ||
          f.type_name.toLowerCase().includes(term)
      );
    }
    if (orgFilter !== "all") result = result.filter((f) => f.org_name === orgFilter);
    if (priorityFilter !== "all") result = result.filter((f) => f.priority.toString() === priorityFilter);
    if (statusFilter !== "all") result = result.filter((f) => f.status_name === statusFilter);

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "priority": cmp = a.priority - b.priority; break;
        case "created": cmp = new Date(a.created).getTime() - new Date(b.created).getTime(); break;
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "org_name": cmp = a.org_name.localeCompare(b.org_name); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [findings, searchTerm, orgFilter, priorityFilter, statusFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleAnnotationChange = useCallback(() => setAnnotationVersion((v) => v + 1), []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const visibleIds = useMemo(() => filtered.slice(0, showCount).map((f) => f.finding_id), [filtered, showCount]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) setSelected(new Set());
    else setSelected(new Set(visibleIds));
  };

  const clearSelection = () => { setSelected(new Set()); setBulkAction("none"); };

  const executeBulkAssign = () => {
    if (!bulkAssignee.trim()) return;
    bulkSetAssignee(Array.from(selected), bulkAssignee.trim());
    handleAnnotationChange();
    setBulkAction("none");
    setBulkAssignee("");
  };

  const executeBulkNote = () => {
    if (!bulkNote.trim()) return;
    bulkAddNote(Array.from(selected), bulkNote.trim(), "You");
    handleAnnotationChange();
    setBulkAction("none");
    setBulkNote("");
  };

  const executeBulkClose = () => {
    bulkSetLocalStatus(Array.from(selected), "closed");
    bulkAddNote(Array.from(selected), "Marked as closed (bulk action)", "System");
    handleAnnotationChange();
    setBulkAction("none");
  };

  const openCount = findings.filter((f) => f.status_name === "Open").length;
  const criticalCount = findings.filter((f) => f.priority === 1).length;

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
      {children}
      {sortField === field && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  );

  const filteredBulkUsers = users.filter((u) => {
    if (!bulkUserSearch) return true;
    const t = bulkUserSearch.toLowerCase();
    return getUserDisplayName(u).toLowerCase().includes(t) || u.email.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Findings</h2>
          <p className="text-muted-foreground">{filtered.length} of {findings.length} findings</p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && <Badge variant="destructive" className="text-xs">{criticalCount} Critical</Badge>}
          <Badge variant="warning" className="text-xs">{openCount} Open</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Organization" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations.map((org) => <SelectItem key={org} value={org}>{org}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="1">Critical</SelectItem>
            <SelectItem value="2">High</SelectItem>
            <SelectItem value="3">Medium</SelectItem>
            <SelectItem value="4">Low</SelectItem>
            <SelectItem value="5">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(orgFilter !== "all" || priorityFilter !== "all" || statusFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setOrgFilter("all"); setPriorityFilter("all"); setStatusFilter("all"); }}>Clear filters</Button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">{selected.size} finding{selected.size !== 1 ? "s" : ""} selected</p>
            <Button size="sm" variant="ghost" onClick={clearSelection}><X className="h-3.5 w-3.5 mr-1" />Clear</Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={bulkAction === "assign" ? "default" : "outline"} onClick={() => setBulkAction(bulkAction === "assign" ? "none" : "assign")}>
              <UserCheck className="h-3.5 w-3.5 mr-1.5" />Assign
            </Button>
            <Button size="sm" variant={bulkAction === "note" ? "default" : "outline"} onClick={() => setBulkAction(bulkAction === "note" ? "none" : "note")}>
              <MessageSquarePlus className="h-3.5 w-3.5 mr-1.5" />Add Note
            </Button>
            <Button size="sm" variant={bulkAction === "close" ? "default" : "outline"} onClick={() => setBulkAction(bulkAction === "close" ? "none" : "close")}>
              <XSquare className="h-3.5 w-3.5 mr-1.5" />Close
            </Button>
          </div>

          {bulkAction === "assign" && (
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder={users.length > 0 ? "Search users or type a name..." : "Type a name..."}
                  value={bulkAssignee}
                  onChange={(e) => { setBulkAssignee(e.target.value); setBulkUserSearch(e.target.value); setShowBulkUserDropdown(true); }}
                  onFocus={() => setShowBulkUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBulkUserDropdown(false), 200)}
                  className="pl-9"
                />
                {showBulkUserDropdown && filteredBulkUsers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
                    {filteredBulkUsers.slice(0, 10).map((user) => (
                      <button key={user.user_id || user.email} type="button"
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setBulkAssignee(getUserDisplayName(user)); setShowBulkUserDropdown(false); }}>
                        <span className="font-medium truncate">{getUserDisplayName(user)}</span>
                        {getUserDisplayName(user) !== user.email && <span className="text-xs text-muted-foreground truncate">{user.email}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button size="sm" onClick={executeBulkAssign} disabled={!bulkAssignee.trim()}>Assign {selected.size}</Button>
            </div>
          )}
          {bulkAction === "note" && (
            <div className="flex gap-2 items-end">
              <Textarea placeholder="Add a note to all selected findings..." value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} rows={2} className="flex-1" />
              <Button size="sm" className="self-end" onClick={executeBulkNote} disabled={!bulkNote.trim()}>Add to {selected.size}</Button>
            </div>
          )}
          {bulkAction === "close" && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-blue-800">Mark {selected.size} finding{selected.size !== 1 ? "s" : ""} as closed?</p>
              <Button size="sm" variant="destructive" onClick={executeBulkClose}>Confirm Close</Button>
              <Button size="sm" variant="ghost" onClick={() => setBulkAction("none")}>Cancel</Button>
            </div>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[32px_1fr_140px_90px_90px_90px_110px_36px] gap-3 items-center px-4 py-3 border-b text-xs font-medium text-muted-foreground bg-muted/30">
            <div className="flex items-center justify-center">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll}
                className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600" />
            </div>
            <SortButton field="name">Finding</SortButton>
            <SortButton field="org_name">Organization</SortButton>
            <SortButton field="priority">Priority</SortButton>
            <span>Status</span>
            <span>Tracking</span>
            <SortButton field="created">Created</SortButton>
            <span />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Filter className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No findings match</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {filtered.slice(0, showCount).map((finding) => {
                const annotation = getAnnotation(finding.finding_id);
                const displayAssignee = annotation?.assignee || finding.assigned_to_name || finding.assigned_to;
                const isChecked = selected.has(finding.finding_id);
                const isClosed = annotation?.localStatus === "closed";
                void annotationVersion;

                return (
                  <div
                    key={finding.finding_id}
                    className={`grid grid-cols-[32px_1fr_140px_90px_90px_90px_110px_36px] gap-3 items-center px-4 py-3 border-b last:border-0 transition-colors cursor-pointer group ${isChecked ? "bg-blue-50/80" : "hover:bg-blue-50/30"} ${isClosed ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(finding.finding_id)}
                        className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600" />
                    </div>
                    <div className="min-w-0" onClick={() => { setSelectedFinding(finding); setDialogOpen(true); }}>
                      <p className={`text-sm font-medium truncate group-hover:text-blue-700 transition-colors ${isClosed ? "line-through" : ""}`}>
                        {finding.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{finding.type_name}</p>
                    </div>
                    <span className="text-sm truncate" onClick={() => { setSelectedFinding(finding); setDialogOpen(true); }}>{finding.org_name}</span>
                    <div onClick={() => { setSelectedFinding(finding); setDialogOpen(true); }}>{getPriorityBadge(finding.priority)}</div>
                    <div className="flex items-center gap-1.5" onClick={() => { setSelectedFinding(finding); setDialogOpen(true); }}>
                      {isClosed ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-xs text-emerald-600">Closed</span></>
                      ) : (
                        <>{getStatusIcon(finding.status_name)}<span className="text-xs">{finding.status_name}</span></>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0" onClick={() => { setSelectedFinding(finding); setDialogOpen(true); }}>
                      {displayAssignee ? (
                        <><User className="h-3 w-3 text-muted-foreground shrink-0" /><span className="text-xs truncate">{displayAssignee}</span></>
                      ) : annotation?.notes && annotation.notes.length > 0 ? (
                        <><StickyNote className="h-3 w-3 text-blue-500 shrink-0" /><span className="text-xs text-blue-600">{annotation.notes.length} note{annotation.notes.length !== 1 ? "s" : ""}</span></>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground" onClick={() => { setSelectedFinding(finding); setDialogOpen(true); }}>
                      {formatDistanceToNow(new Date(finding.created), { addSuffix: true })}
                    </span>
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" asChild className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={`https://app.blumira.com/${finding.org_id}/reporting/findings/${finding.finding_id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filtered.length > showCount && (
                <div className="flex justify-center py-4">
                  <Button variant="outline" size="sm" onClick={() => setShowCount((c) => c + 50)}>
                    Load more ({filtered.length - showCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <FindingDetailDialog
        finding={selectedFinding}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAnnotationChange={handleAnnotationChange}
        users={users}
      />
    </div>
  );
}
