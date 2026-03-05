const AUTH_URL = "https://auth.blumira.com/oauth/token";
const API_BASE_URL = "https://api.blumira.com/public-api/v1";
export const APP_BASE_URL = "https://app.blumira.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.BLUMIRA_CLIENT_ID;
  const clientSecret = process.env.BLUMIRA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "BLUMIRA_CLIENT_ID and BLUMIRA_CLIENT_SECRET environment variables are required"
    );
  }

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: "public-api",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Authentication failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("No access token received from authentication endpoint");
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000 - 60000,
  };

  return data.access_token;
}

async function apiRequest<T = unknown>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `API ${init?.method || "GET"} failed (${response.status}): ${text}`
    );
  }

  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { data: text } as T;
  }
}

async function apiGet<T = unknown>(path: string, token: string): Promise<T> {
  return apiRequest<T>(path, token, { method: "GET" });
}

async function apiPatch<T = unknown>(
  path: string,
  token: string,
  body: Record<string, unknown>
): Promise<T> {
  return apiRequest<T>(path, token, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function apiPost<T = unknown>(
  path: string,
  token: string,
  body: Record<string, unknown>
): Promise<T> {
  return apiRequest<T>(path, token, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export interface MspAccount {
  account_id: string;
  name: string;
  open_findings?: number;
}

export interface AccountDetails {
  agent_count_available: number;
  agent_count_used: number;
  license: string;
  user_count: number;
}

export interface FindingPerson {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface FindingOwners {
  responders?: FindingPerson[];
  analysts?: FindingPerson[];
  managers?: FindingPerson[];
}

export interface FindingLocation {
  id: string;
  name: string;
  city?: string;
  country?: string;
}

export interface FindingAttachment {
  id: string;
  filename: string;
  uploaded_at: string;
  uploaded_by?: FindingPerson;
}

export interface Finding {
  finding_id: string;
  name: string;
  short_id?: string;
  priority: number;
  status_name: string;
  status?: number;
  type_name: string;
  type?: number;
  created: string;
  modified: string;
  org_name: string;
  org_id: string;
  match_id?: string | null;
  analysis?: string;
  blocked?: boolean;
  category?: string | number;
  category_name?: string;
  subcategory?: string;
  jurisdiction?: number;
  jurisdiction_name?: string;
  resolution_name?: string;
  resolution?: number;
  resolution_notes?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  description?: string;
  summary?: string;
  source?: string;
  evidence?: string;
  notes?: string;
  ip_address?: string;
  hostname?: string;
  url?: string;
  user?: string;
  workflow_name?: string;
  rule_name?: string;
  detector_name?: string;
  ui_action_type?: number;
  ui_action?: { id: number; name: string };
  owners?: FindingOwners;
  modified_by?: FindingPerson;
  status_modified_by?: FindingPerson;
  status_modified?: string | null;
  matched?: string | null;
  seconds_in_status?: number;
  seconds_to_status?: number;
  locations?: FindingLocation[];
  org_location_ids?: string[];
  attachments?: FindingAttachment[];
  related_findings?: string[];
  src_country?: string[];
  promoted_to_id?: string | null;
  confirmation_completed?: string | null;
  escalation_completed?: string | null;
  mitigation_completed?: string | null;
}

export type EvidenceRow = Record<string, unknown>;

export interface EvidenceResponse {
  data: EvidenceRow[];
  evidence_keys: string[];
  status: string;
  meta: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
  links: {
    self: string;
    next: string | null;
    prev: string | null;
  };
}

export interface FindingComment {
  id?: string | null;
  subject?: string;
  body: string;
  age?: number;
  sender?: {
    id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  };
}

export interface AgentDevice {
  device_id: string;
  hostname: string;
  alive: string;
  arch: string;
  created: string;
  is_excluded: boolean;
  is_isolated: boolean;
  is_sleeping: boolean;
  isolation_requested: boolean;
  key_id: string;
  keyname: string;
  modified: string;
  org_id: string;
  plat: string;
}

export interface AgentKey {
  key_id: string;
  key_name?: string;
  name?: string;
  status?: string;
  created_at?: string;
}

export interface BlumiraUser {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role?: string;
  status?: string;
  org_id?: string;
  org_name?: string;
  created?: string;
}

interface ApiResponse<T> {
  status?: string;
  data?: T;
  meta?: {
    total_items?: number;
    page?: number;
    per_page?: number;
  };
}

export interface FindingUpdate {
  status?: number;
  priority?: number;
  assigned_to?: string | null;
  resolution?: number;
  notes?: string;
}

export interface FindingCommentCreateInput {
  subject?: string;
  body: string;
}

export async function fetchMspAccounts(
  token: string
): Promise<MspAccount[]> {
  const res = await apiGet<ApiResponse<MspAccount[]>>(
    "/msp/accounts",
    token
  );
  return res.data || [];
}

export async function fetchAccountDetail(
  token: string,
  accountId: string
): Promise<AccountDetails | null> {
  try {
    const res = await apiGet<ApiResponse<AccountDetails> & AccountDetails>(
      `/msp/accounts/${accountId}`,
      token
    );
    return res.data || res;
  } catch {
    return null;
  }
}

export async function fetchAllFindings(
  token: string
): Promise<Finding[]> {
  const allFindings: Finding[] = [];
  let page = 1;
  const pageSize = 200;

  while (true) {
    const res = await apiGet<ApiResponse<Finding[]> & { meta?: { total_pages?: number } }>(
      `/msp/accounts/findings?page=${page}&page_size=${pageSize}`,
      token
    );
    const batch = res.data || [];
    allFindings.push(...batch);

    const totalPages = res.meta?.total_pages;
    if (!totalPages || page >= totalPages || batch.length < pageSize) break;
    page++;
  }

  return allFindings;
}

export async function fetchAccountFindings(
  token: string,
  accountId: string
): Promise<Finding[]> {
  try {
    const res = await apiGet<ApiResponse<Finding[]>>(
      `/msp/accounts/${accountId}/findings`,
      token
    );
    return res.data || [];
  } catch {
    return [];
  }
}

export async function fetchAccountAgentDevices(
  token: string,
  accountId: string
): Promise<{ devices: AgentDevice[]; meta: Record<string, unknown> | null }> {
  try {
    const res = await apiGet<ApiResponse<AgentDevice[]>>(
      `/msp/accounts/${accountId}/agents/devices`,
      token
    );
    return { devices: res.data || [], meta: res.meta || null };
  } catch {
    return { devices: [], meta: null };
  }
}

export async function fetchAccountAgentKeys(
  token: string,
  accountId: string
): Promise<AgentKey[]> {
  try {
    const res = await apiGet<ApiResponse<AgentKey[]>>(
      `/msp/accounts/${accountId}/agents/keys`,
      token
    );
    return res.data || [];
  } catch {
    return [];
  }
}

export async function fetchAccountUsers(
  token: string,
  accountId: string
): Promise<BlumiraUser[]> {
  try {
    const res = await apiGet<ApiResponse<BlumiraUser[]>>(
      `/msp/accounts/${accountId}/users`,
      token
    );
    return res.data || [];
  } catch {
    return [];
  }
}

export interface EnrichedAccount extends MspAccount {
  details: AccountDetails | null;
  findings: Finding[];
  agentDevices: AgentDevice[];
  agentKeys: AgentKey[];
  deviceMeta: Record<string, unknown> | null;
  stats: {
    totalFindings: number;
    criticalFindings: number;
    openFindings: number;
    totalDevices: number;
    onlineDevices: number;
    sleepingDevices: number;
    isolatedDevices: number;
    excludedDevices: number;
    agentKeysCount: number;
  };
}

export async function fetchFindingDetail(
  token: string,
  accountId: string,
  findingId: string
): Promise<Finding | null> {
  try {
    const res = await apiGet<ApiResponse<Finding> & Finding>(
      `/msp/accounts/${accountId}/findings/${findingId}`,
      token
    );
    return res.data || res;
  } catch {
    return null;
  }
}

export async function fetchFindingEvidence(
  token: string,
  accountId: string,
  findingId: string,
  page = 1,
  pageSize = 50
): Promise<EvidenceResponse | null> {
  try {
    const res = await apiGet<EvidenceResponse>(
      `/msp/accounts/${accountId}/findings/${findingId}/evidence?page=${page}&page_size=${pageSize}`,
      token
    );
    return res;
  } catch {
    return null;
  }
}

export async function fetchFindingComments(
  token: string,
  accountId: string,
  findingId: string
): Promise<FindingComment[]> {
  try {
    const res = await apiGet<FindingComment[] | ApiResponse<FindingComment[]>>(
      `/msp/accounts/${accountId}/findings/${findingId}/comments`,
      token
    );
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    return [];
  } catch {
    return [];
  }
}

export async function updateFinding(
  token: string,
  accountId: string,
  findingId: string,
  updates: FindingUpdate
): Promise<Finding> {
  const res = await apiPatch<ApiResponse<Finding> & Finding>(
    `/msp/accounts/${accountId}/findings/${findingId}`,
    token,
    updates as Record<string, unknown>
  );
  return res.data || res;
}

export async function postFindingComment(
  token: string,
  accountId: string,
  findingId: string,
  input: FindingCommentCreateInput
): Promise<unknown> {
  const candidates: Record<string, unknown>[] = [
    { subject: input.subject || "Dashboard Note", body: input.body },
    { body: input.body },
    { comment: input.body },
    { note: input.body },
    { notes: input.body },
  ];

  let lastError: Error | null = null;

  for (const payload of candidates) {
    try {
      return await apiPost<unknown>(
        `/msp/accounts/${accountId}/findings/${findingId}/comments`,
        token,
        payload
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown API error");
    }
  }

  throw (
    lastError ||
    new Error("Failed to post finding comment: no request attempts succeeded")
  );
}

export async function fetchEnrichedAccount(
  token: string,
  account: MspAccount
): Promise<EnrichedAccount> {
  const [details, findings, devicesResult, agentKeys] = await Promise.all([
    fetchAccountDetail(token, account.account_id),
    fetchAccountFindings(token, account.account_id),
    fetchAccountAgentDevices(token, account.account_id),
    fetchAccountAgentKeys(token, account.account_id),
  ]);

  const devices = devicesResult.devices;

  return {
    ...account,
    details,
    findings,
    agentDevices: devices,
    agentKeys,
    deviceMeta: devicesResult.meta,
    stats: {
      totalFindings: findings.length,
      criticalFindings: findings.filter((f) => f.priority === 1).length,
      openFindings: findings.filter(
        (f) => f.status_name === "Open"
      ).length,
      totalDevices: devices.length,
      onlineDevices: devices.filter(
        (d) => !d.is_sleeping && !d.is_isolated && !d.is_excluded
      ).length,
      sleepingDevices: devices.filter((d) => d.is_sleeping).length,
      isolatedDevices: devices.filter((d) => d.is_isolated).length,
      excludedDevices: devices.filter((d) => d.is_excluded).length,
      agentKeysCount: agentKeys.length,
    },
  };
}
