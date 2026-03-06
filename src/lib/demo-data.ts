import type {
  MspAccount,
  AccountDetails,
  Finding,
  AgentDevice,
  AgentKey,
  BlumiraUser,
  EnrichedAccount,
  EvidenceResponse,
  EvidenceRow,
  FindingComment,
} from "./blumira-api";

const DEMO_ACCOUNTS: MspAccount[] = [
  { account_id: "demo-acct-001", name: "Acme Corp", open_findings: 12 },
  { account_id: "demo-acct-002", name: "Globex Industries", open_findings: 7 },
  { account_id: "demo-acct-003", name: "Initech Solutions", open_findings: 3 },
  { account_id: "demo-acct-004", name: "Stark Enterprises", open_findings: 18 },
  { account_id: "demo-acct-005", name: "Wayne Medical Group", open_findings: 5 },
];

const ACCOUNT_DETAILS: Record<string, AccountDetails> = {
  "demo-acct-001": { agent_count_available: 100, agent_count_used: 45, license: "Enterprise", user_count: 28 },
  "demo-acct-002": { agent_count_available: 75, agent_count_used: 32, license: "Business", user_count: 15 },
  "demo-acct-003": { agent_count_available: 50, agent_count_used: 12, license: "Business", user_count: 8 },
  "demo-acct-004": { agent_count_available: 200, agent_count_used: 87, license: "Enterprise", user_count: 42 },
  "demo-acct-005": { agent_count_available: 60, agent_count_used: 22, license: "Business", user_count: 11 },
};

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3600000).toISOString();
}

const FINDING_TEMPLATES: Omit<Finding, "finding_id" | "org_name" | "org_id" | "created" | "modified">[] = [
  { name: "Brute Force Authentication Attempt", priority: 1, status_name: "Open", type_name: "Threat", category: "Authentication", subcategory: "Brute Force", description: "Multiple failed authentication attempts detected from a single source IP, indicating a potential brute force attack against user accounts.", summary: "Over 500 failed login attempts detected within 10 minutes from IP 203.0.113.42.", source: "Windows Security", hostname: "DC-PRIMARY", ip_address: "203.0.113.42" },
  { name: "Suspicious PowerShell Execution", priority: 1, status_name: "Open", type_name: "Threat", category: "Execution", subcategory: "PowerShell", description: "Encoded PowerShell command detected that attempts to download and execute a remote payload.", summary: "Base64 encoded PowerShell command executed by user jsmith on workstation WS-042.", source: "Windows Security", hostname: "WS-042", user: "jsmith" },
  { name: "Lateral Movement via SMB", priority: 2, status_name: "Open", type_name: "Threat", category: "Lateral Movement", subcategory: "SMB", description: "Unusual SMB connections detected between workstations, potentially indicating lateral movement.", summary: "WS-015 initiated SMB connections to 8 different hosts within 5 minutes.", source: "Network Sensor", hostname: "WS-015", ip_address: "10.0.1.15" },
  { name: "Unauthorized Admin Account Created", priority: 1, status_name: "Open", type_name: "Threat", category: "Persistence", subcategory: "Account Creation", description: "A new administrator account was created outside of normal provisioning procedures.", summary: "Account 'svc_backup2' added to Domain Admins group by user admin-temp.", source: "Active Directory", hostname: "DC-PRIMARY", user: "admin-temp" },
  { name: "Malware Detection - Trojan.GenericKD", priority: 2, status_name: "Open", type_name: "Threat", category: "Malware", subcategory: "Trojan", description: "Endpoint protection detected a known trojan variant attempting to establish persistence.", summary: "Trojan.GenericKD.46789 detected in C:\\Users\\mkellar\\Downloads\\invoice.exe", source: "Endpoint Protection", hostname: "WS-067", user: "mkellar" },
  { name: "Unusual Outbound DNS Traffic", priority: 3, status_name: "Open", type_name: "Suspect", category: "Network", subcategory: "DNS", description: "High volume of DNS queries to recently registered domains detected, potentially indicating DNS tunneling or C2 communication.", summary: "Over 2,000 DNS queries to suspicious domains in the last hour from 10.0.2.33.", source: "DNS Sensor", ip_address: "10.0.2.33" },
  { name: "Failed MFA Challenge - Multiple Users", priority: 2, status_name: "Open", type_name: "Suspect", category: "Authentication", subcategory: "MFA", description: "Multiple users experiencing MFA failures from unusual geographic locations.", summary: "12 users had MFA failures from IP ranges associated with known VPN providers.", source: "Azure AD" },
  { name: "Deprecated TLS Version in Use", priority: 4, status_name: "Open", type_name: "Operational", category: "Configuration", subcategory: "TLS", description: "Server is accepting connections using TLS 1.0/1.1 which are deprecated and vulnerable.", summary: "Web server web-prod-01 still accepts TLS 1.0 connections.", source: "Vulnerability Scanner", hostname: "web-prod-01" },
  { name: "Agent Offline - Critical Server", priority: 3, status_name: "Open", type_name: "Operational", category: "Agent", subcategory: "Connectivity", description: "Blumira agent on a critical server has not reported in over 24 hours.", summary: "Agent on DB-PRIMARY has been offline since 2025-03-01T08:00:00Z.", source: "Agent Monitor", hostname: "DB-PRIMARY" },
  { name: "Privilege Escalation Attempt", priority: 1, status_name: "Open", type_name: "Threat", category: "Privilege Escalation", subcategory: "Local", description: "User attempted to exploit a known vulnerability to gain elevated privileges.", summary: "CVE-2024-1234 exploitation attempt detected on SRV-APP-01 by user contractor_a.", source: "Host IDS", hostname: "SRV-APP-01", user: "contractor_a" },
  { name: "Phishing Email Delivered", priority: 2, status_name: "Open", type_name: "Threat", category: "Initial Access", subcategory: "Phishing", description: "Phishing email with malicious attachment delivered to multiple recipients.", summary: "Email with subject 'Urgent: Invoice Payment Required' delivered to 15 mailboxes.", source: "Email Gateway" },
  { name: "SSL Certificate Expiring", priority: 5, status_name: "Open", type_name: "Operational", category: "Configuration", subcategory: "Certificate", description: "SSL certificate for a production service will expire within 30 days.", summary: "Certificate for api.acmecorp.com expires on 2025-04-15.", source: "Certificate Monitor", hostname: "LB-PROD-01" },
  { name: "Ransomware Behavior Detected", priority: 1, status_name: "Open", type_name: "Threat", category: "Impact", subcategory: "Ransomware", description: "File encryption patterns consistent with ransomware activity detected on endpoint.", summary: "Rapid file modification of 200+ files detected in shared drive on FS-01.", source: "Endpoint Protection", hostname: "FS-01", user: "lthompson" },
  { name: "Data Exfiltration Attempt", priority: 1, status_name: "Resolved", status: 2, type_name: "Threat", category: "Exfiltration", subcategory: "Cloud Storage", description: "Large volume of sensitive data uploaded to unauthorized cloud storage service.", summary: "5.2 GB uploaded to personal Dropbox from workstation WS-023.", source: "DLP", hostname: "WS-023", user: "rjohnson", resolution_name: "True Positive - Remediated" },
  { name: "Suspicious Cron Job Added", priority: 3, status_name: "Resolved", status: 2, type_name: "Suspect", category: "Persistence", subcategory: "Scheduled Task", description: "New cron job added to download and execute a script from an external URL.", summary: "Cron job on linux-web-03 downloads from http://suspicious-domain.com/update.sh.", source: "Linux Audit", hostname: "linux-web-03", resolution_name: "False Positive" },
  { name: "Firewall Rule Change", priority: 4, status_name: "Open", type_name: "Operational", category: "Configuration", subcategory: "Firewall", description: "Firewall rule modified to allow inbound traffic on non-standard port.", summary: "New rule allowing TCP/4444 inbound added to perimeter firewall.", source: "Firewall Log" },
  { name: "Password Spray Attack", priority: 2, status_name: "Open", type_name: "Threat", category: "Authentication", subcategory: "Password Spray", description: "Distributed authentication attempts using common passwords across multiple accounts.", summary: "47 accounts targeted with password 'Summer2025!' from rotating IP addresses.", source: "Azure AD" },
  { name: "Unpatched Critical Vulnerability", priority: 3, status_name: "Open", type_name: "Operational", category: "Vulnerability", subcategory: "Patching", description: "Critical CVE remains unpatched beyond SLA on production systems.", summary: "CVE-2024-5678 (CVSS 9.8) unpatched on 12 servers for 45+ days.", source: "Vulnerability Scanner" },
];

function buildFindings(): Finding[] {
  const findings: Finding[] = [];
  let idx = 0;

  for (const account of DEMO_ACCOUNTS) {
    const count = account.open_findings || 3;
    for (let i = 0; i < count && idx < FINDING_TEMPLATES.length; i++) {
      const t = FINDING_TEMPLATES[idx % FINDING_TEMPLATES.length];
      findings.push({
        ...t,
        finding_id: `demo-finding-${String(idx + 1).padStart(3, "0")}`,
        org_name: account.name,
        org_id: account.account_id,
        created: daysAgo(Math.floor(Math.random() * 30) + 1),
        modified: hoursAgo(Math.floor(Math.random() * 72) + 1),
      });
      idx++;
    }
  }

  while (idx < FINDING_TEMPLATES.length) {
    const t = FINDING_TEMPLATES[idx];
    const account = DEMO_ACCOUNTS[idx % DEMO_ACCOUNTS.length];
    findings.push({
      ...t,
      finding_id: `demo-finding-${String(idx + 1).padStart(3, "0")}`,
      org_name: account.name,
      org_id: account.account_id,
      created: daysAgo(Math.floor(Math.random() * 30) + 1),
      modified: hoursAgo(Math.floor(Math.random() * 72) + 1),
    });
    idx++;
  }

  return findings;
}

const HOSTNAMES = [
  "WS-001", "WS-002", "WS-003", "WS-015", "WS-023", "WS-042", "WS-067",
  "DC-PRIMARY", "DC-SECONDARY", "SRV-APP-01", "SRV-APP-02", "SRV-WEB-01",
  "DB-PRIMARY", "DB-REPLICA", "FS-01", "LB-PROD-01", "linux-web-03",
  "MAIL-01", "VPN-GW-01", "BACKUP-01",
];

function buildDevices(accountId: string, count: number): AgentDevice[] {
  return Array.from({ length: count }, (_, i) => {
    const hostname = HOSTNAMES[i % HOSTNAMES.length];
    const isOnline = Math.random() > 0.2;
    return {
      device_id: `demo-device-${accountId}-${String(i + 1).padStart(3, "0")}`,
      hostname: `${hostname}`,
      alive: isOnline ? hoursAgo(0) : daysAgo(Math.floor(Math.random() * 7) + 1),
      arch: Math.random() > 0.3 ? "x86_64" : "arm64",
      created: daysAgo(Math.floor(Math.random() * 180) + 30),
      is_excluded: Math.random() < 0.05,
      is_isolated: Math.random() < 0.03,
      is_sleeping: !isOnline && Math.random() > 0.5,
      isolation_requested: false,
      key_id: `demo-key-${accountId}-001`,
      keyname: "Production Key",
      modified: hoursAgo(Math.floor(Math.random() * 48)),
      org_id: accountId,
      plat: Math.random() > 0.25 ? "windows" : Math.random() > 0.5 ? "linux" : "macos",
    };
  });
}

function buildKeys(accountId: string): AgentKey[] {
  return [
    { key_id: `demo-key-${accountId}-001`, key_name: "Production Key", name: "Production Key", status: "active", created_at: daysAgo(180) },
    { key_id: `demo-key-${accountId}-002`, key_name: "Staging Key", name: "Staging Key", status: "active", created_at: daysAgo(90) },
  ];
}

const DEMO_USERS_BY_ACCOUNT: Record<string, BlumiraUser[]> = {
  "demo-acct-001": [
    { user_id: "u-001", email: "admin@acmecorp.com", first_name: "Sarah", last_name: "Chen", name: "Sarah Chen", role: "admin", status: "active", org_id: "demo-acct-001", org_name: "Acme Corp", created: daysAgo(365) },
    { user_id: "u-002", email: "jsmith@acmecorp.com", first_name: "James", last_name: "Smith", name: "James Smith", role: "analyst", status: "active", org_id: "demo-acct-001", org_name: "Acme Corp", created: daysAgo(200) },
    { user_id: "u-003", email: "mkellar@acmecorp.com", first_name: "Mike", last_name: "Kellar", name: "Mike Kellar", role: "analyst", status: "active", org_id: "demo-acct-001", org_name: "Acme Corp", created: daysAgo(150) },
  ],
  "demo-acct-002": [
    { user_id: "u-004", email: "ops@globex.io", first_name: "Lisa", last_name: "Park", name: "Lisa Park", role: "admin", status: "active", org_id: "demo-acct-002", org_name: "Globex Industries", created: daysAgo(300) },
    { user_id: "u-005", email: "security@globex.io", first_name: "David", last_name: "Torres", name: "David Torres", role: "analyst", status: "active", org_id: "demo-acct-002", org_name: "Globex Industries", created: daysAgo(180) },
  ],
  "demo-acct-003": [
    { user_id: "u-006", email: "admin@initech.com", first_name: "Rachel", last_name: "Wong", name: "Rachel Wong", role: "admin", status: "active", org_id: "demo-acct-003", org_name: "Initech Solutions", created: daysAgo(250) },
  ],
  "demo-acct-004": [
    { user_id: "u-007", email: "ciso@stark.dev", first_name: "Alex", last_name: "Rivera", name: "Alex Rivera", role: "admin", status: "active", org_id: "demo-acct-004", org_name: "Stark Enterprises", created: daysAgo(400) },
    { user_id: "u-008", email: "soc@stark.dev", first_name: "Jordan", last_name: "Lee", name: "Jordan Lee", role: "analyst", status: "active", org_id: "demo-acct-004", org_name: "Stark Enterprises", created: daysAgo(120) },
    { user_id: "u-009", email: "tier1@stark.dev", first_name: "Casey", last_name: "Nguyen", name: "Casey Nguyen", role: "viewer", status: "active", org_id: "demo-acct-004", org_name: "Stark Enterprises", created: daysAgo(60) },
  ],
  "demo-acct-005": [
    { user_id: "u-010", email: "it@waynemedical.org", first_name: "Morgan", last_name: "Blake", name: "Morgan Blake", role: "admin", status: "active", org_id: "demo-acct-005", org_name: "Wayne Medical Group", created: daysAgo(350) },
  ],
};

const DEVICE_COUNTS: Record<string, number> = {
  "demo-acct-001": 45,
  "demo-acct-002": 32,
  "demo-acct-003": 12,
  "demo-acct-004": 87,
  "demo-acct-005": 22,
};

export function getDemoAccounts(): MspAccount[] {
  return DEMO_ACCOUNTS;
}

export function getDemoAccountDetail(accountId: string): AccountDetails | null {
  return ACCOUNT_DETAILS[accountId] || null;
}

export function getDemoFindings(): Finding[] {
  return buildFindings();
}

export function getDemoAccountFindings(accountId: string): Finding[] {
  return buildFindings().filter((f) => f.org_id === accountId);
}

export function getDemoFindingDetail(accountId: string, findingId: string): Finding | null {
  return buildFindings().find((f) => f.org_id === accountId && f.finding_id === findingId) || null;
}

export function getDemoAccountDevices(accountId: string): { devices: AgentDevice[]; meta: Record<string, unknown> | null } {
  const count = DEVICE_COUNTS[accountId] || 10;
  const devices = buildDevices(accountId, count);
  return { devices, meta: { total_items: count, page: 1, per_page: count } };
}

export function getDemoAccountKeys(accountId: string): AgentKey[] {
  return buildKeys(accountId);
}

export function getDemoAccountUsers(accountId: string): BlumiraUser[] {
  return DEMO_USERS_BY_ACCOUNT[accountId] || [];
}

export function getDemoAllUsers(): BlumiraUser[] {
  return Object.values(DEMO_USERS_BY_ACCOUNT).flat().sort((a, b) => {
    const nameA = a.name || a.email;
    const nameB = b.name || b.email;
    return nameA.localeCompare(nameB);
  });
}

export function getDemoEnrichedAccount(account: MspAccount): EnrichedAccount {
  const details = getDemoAccountDetail(account.account_id);
  const findings = getDemoAccountFindings(account.account_id);
  const { devices } = getDemoAccountDevices(account.account_id);
  const agentKeys = getDemoAccountKeys(account.account_id);

  return {
    ...account,
    details,
    findings,
    agentDevices: devices,
    agentKeys,
    deviceMeta: { total_items: devices.length },
    stats: {
      totalFindings: findings.length,
      criticalFindings: findings.filter((f) => f.priority === 1).length,
      openFindings: findings.filter((f) => f.status_name === "Open").length,
      totalDevices: devices.length,
      onlineDevices: devices.filter((d) => !d.is_sleeping && !d.is_isolated && !d.is_excluded).length,
      sleepingDevices: devices.filter((d) => d.is_sleeping).length,
      isolatedDevices: devices.filter((d) => d.is_isolated).length,
      excludedDevices: devices.filter((d) => d.is_excluded).length,
      agentKeysCount: agentKeys.length,
    },
  };
}

export function getDemoEnrichedAccounts(): EnrichedAccount[] {
  return DEMO_ACCOUNTS.map(getDemoEnrichedAccount);
}

const DEMO_IPS = ["50.37.49.208", "203.0.113.42", "198.51.100.17", "172.16.0.55", "10.0.1.15", "192.168.1.100"];
const DEMO_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
  "Microsoft Office/16.0 (Windows NT 10.0; Microsoft Outlook 16.0)",
];
const DEMO_USERS_EVIDENCE = ["anna@b5alab.com", "jsmith@acmecorp.com", "admin@acmecorp.com", "mkellar@acmecorp.com", "rjohnson@globex.io", "svc_backup@initech.com"];
const DEMO_OPERATIONS = ["UserLoggedIn", "UserLoginFailed", "FileAccessed", "MailItemsAccessed", "Add member to role.", "New-InboxRule", "Set-Mailbox"];
const DEMO_RESULTS = ["Success", "Failure", "Success", "Success", "Failure"];
const DEMO_TYPES = ["office365_aad", "office365_general", "windows_security", "azure_ad_signin", "okta_system_log"];
const DEMO_COUNTRIES: [string, string][] = [["US", "United States"], ["GB", "United Kingdom"], ["DE", "Germany"], ["RU", "Russia"], ["CN", "China"], ["CA", "Canada"]];

function buildEvidenceRow(i: number, baseTime: number): EvidenceRow {
  const country = DEMO_COUNTRIES[i % DEMO_COUNTRIES.length];
  const offset = i * 30000 + Math.floor(Math.random() * 60000);
  const timeMatched = new Date(baseTime - offset).toISOString();
  const timestampParsed = new Date(baseTime - offset + 2000 + Math.floor(Math.random() * 5000)).toISOString();
  return {
    __time_matched: timeMatched,
    Logger: `${crypto.randomUUID?.() || `${i}-${Date.now()}`}`.slice(0, 36),
    Timestamp: timeMatched,
    agent: DEMO_AGENTS[i % DEMO_AGENTS.length],
    client_ip: DEMO_IPS[i % DEMO_IPS.length],
    "client_ip_geoip.countrycode": country[0],
    "client_ip_geoip.countryname": country[1],
    id: crypto.randomUUID?.() || `id-${i}-${Date.now()}`,
    operation: DEMO_OPERATIONS[i % DEMO_OPERATIONS.length],
    request_type: ["OAuth2:Authorize", "OAuth2:Token", "ROPC", "SAS"][i % 4],
    result: DEMO_RESULTS[i % DEMO_RESULTS.length],
    tenant_id: "5aa4588c-5c62-4629-82ca-18810e7c2d3d",
    timestamp_parsed: timestampParsed,
    type: DEMO_TYPES[i % DEMO_TYPES.length],
    user: DEMO_USERS_EVIDENCE[i % DEMO_USERS_EVIDENCE.length],
  };
}

const DEFAULT_EVIDENCE_KEYS = [
  "__time_matched", "Logger", "Timestamp", "agent", "client_ip",
  "client_ip_geoip.countrycode", "client_ip_geoip.countryname",
  "id", "operation", "request_type", "result", "tenant_id",
  "timestamp_parsed", "type", "user",
];

function buildDemoEvidence(count: number): EvidenceRow[] {
  const baseTime = Date.now();
  return Array.from({ length: count }, (_, i) => buildEvidenceRow(i, baseTime));
}

export function getDemoFindingEvidence(
  _accountId: string,
  _findingId: string,
  page = 1,
  pageSize = 50
): EvidenceResponse {
  const totalItems = 12;
  const allRows = buildDemoEvidence(totalItems);
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const pageRows = allRows.slice(start, start + pageSize);

  return {
    data: pageRows,
    evidence_keys: DEFAULT_EVIDENCE_KEYS,
    status: "OK",
    meta: {
      page,
      page_size: pageSize,
      total_items: totalItems,
      total_pages: totalPages,
    },
    links: {
      self: `/findings/${_findingId}/evidence?page=${page}`,
      next: page < totalPages ? `/findings/${_findingId}/evidence?page=${page + 1}` : null,
      prev: page > 1 ? `/findings/${_findingId}/evidence?page=${page - 1}` : null,
    },
  };
}

const DEMO_COMMENTS: FindingComment[] = [
  {
    id: "comm-001",
    subject: "Initial Triage",
    body: "<p>Investigated the source IP. This appears to be an external actor based on geolocation data (Eastern Europe). Escalating to Tier 2 for deeper analysis.</p>",
    age: 86400,
    sender: { id: "u-002", first_name: "James", last_name: "Smith", email: "jsmith@acmecorp.com" },
  },
  {
    id: "comm-002",
    subject: "Update",
    body: "<p>Confirmed the IP is associated with a known threat group. Blocking at the firewall and monitoring for related activity across other accounts.</p>",
    age: 43200,
    sender: { id: "u-007", first_name: "Alex", last_name: "Rivera", email: "ciso@stark.dev" },
  },
  {
    id: "comm-003",
    subject: "Remediation",
    body: "<p>Password reset enforced for all impacted accounts. MFA enrollment verified. Continuing to monitor for 48 hours.</p>",
    age: 7200,
    sender: { id: "u-001", first_name: "Sarah", last_name: "Chen", email: "admin@acmecorp.com" },
  },
];

export function getDemoFindingComments(accountId: string, findingId: string): FindingComment[] {
  const finding = getDemoFindingDetail(accountId, findingId);
  if (!finding) return [];
  if (finding.priority <= 2) return DEMO_COMMENTS;
  if (finding.priority === 3) return DEMO_COMMENTS.slice(0, 1);
  return [];
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
