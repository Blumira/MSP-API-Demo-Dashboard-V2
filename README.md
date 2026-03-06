cp .env.test .env.local
# Blumira MSP API Dashboard

A modern, dark-themed security operations dashboard for Managed Service Providers, built with Next.js 15 and powered by the Blumira Public API.

## Overview

This dashboard provides MSPs with a unified view of security findings, agent devices, and organization management across all client accounts managed through Blumira. It demonstrates the full capabilities of the Blumira Public API.

## Features

- **Security Overview** — Real-time metrics showing total findings, critical alerts, open issues, and recent activity across all MSP accounts
- **Findings Management** — Sortable, filterable table of all security findings with direct links to the Blumira platform for investigation
- **Organization Drill-Down** — Expandable view of each MSP client account showing license details, agent capacity, device status, and security posture
- **Agents & Devices** — Grid view of all deployed agent devices with status indicators (online, sleeping, isolated, excluded) and filtering
- **Analytics** — Priority distribution, timeline charts, threat type analysis, organization comparisons, and resolution time metrics
- **Credential Management** — Built-in settings page to configure and validate Blumira API credentials

## Blumira API Endpoints Used

| Endpoint | Description |
|----------|-------------|
| `GET /msp/accounts` | List all MSP client accounts |
| `GET /msp/accounts/:id` | Account details (license, capacity, users) |
| `GET /msp/accounts/findings` | All findings across all accounts |
| `GET /msp/accounts/:id/findings` | Findings for a specific account |
| `GET /msp/accounts/:id/agents/devices` | Agent devices for an account |
| `GET /msp/accounts/:id/agents/keys` | Agent deployment keys |

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom dark theme
- **UI Components:** Radix UI primitives (shadcn/ui pattern)
- **Icons:** Lucide React
- **Charts:** Custom SVG visualizations
- **Data:** Blumira Public API v1

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)
- Blumira API credentials (Client ID and Client Secret)

### Installation

```bash
git clone <repository-url>
cd blumira-msp-dashboard
npm install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Add your Blumira API credentials to `.env.local`:
```
BLUMIRA_CLIENT_ID=your_client_id
BLUMIRA_CLIENT_SECRET=your_client_secret
```

Alternatively, you can configure credentials through the Settings page in the dashboard UI.

### Demo Mode (Test Environment)

If you don't have Blumira API credentials or want to explore the dashboard with sample data, you can enable **demo mode**:

**Option 1 — Use the `.env.test` file:**
```bash
cp .env.test .env.local
npm run dev
```

**Option 2 — Set the environment variable manually:**
```bash
# Add to .env.local
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
```

**Option 3 — Toggle in the UI:**

Launch the dashboard and either:
- Click **"Try Demo Mode"** on the credentials-required screen, or
- Go to **Settings** and flip the **Demo Mode** toggle

Demo mode provides synthetic data including 5 organizations, 18 security findings, ~198 agent devices, and 10 users — enough to exercise every dashboard view.

When you're ready to connect real data, enter your Blumira API credentials in Settings. Saving valid credentials automatically disables demo mode.

### Data Source Status

The **Settings** page includes a **Data Source Status** panel that shows:
- Whether the dashboard is using **live API data**, **demo data**, or has **no data source**
- Which environment variables are configured
- Whether Client ID and Client Secret are present

This makes it easy to verify that your credentials are stored and your connection is active.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
.env.example                   # Environment template
.env.test                      # Test/demo environment (copy to .env.local)
src/
├── app/
│   ├── api/blumira/           # API proxy routes
│   │   ├── credentials/       # Credential management + demo toggle
│   │   ├── dashboard/         # Main data endpoint
│   │   ├── findings/          # Finding detail endpoint
│   │   └── organizations/     # Enriched org data
│   ├── globals.css            # Tailwind + dark theme
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Dashboard entry point
├── components/
│   ├── dashboard/             # Dashboard views
│   │   ├── dashboard-shell    # Main layout with sidebar + demo banner
│   │   ├── overview-view      # Security overview
│   │   ├── findings-view      # Findings table
│   │   ├── organizations-view # Org management
│   │   ├── agents-view        # Devices & agents
│   │   ├── analytics-view     # Charts & analytics
│   │   └── settings-view      # Credentials, demo toggle, data status
│   └── ui/                    # Reusable UI primitives
└── lib/
    ├── blumira-api.ts         # Blumira API client
    ├── demo-data.ts           # Synthetic demo data generator
    └── utils.ts               # Utility functions
```

## About Blumira Findings

Findings are security detections organized by priority:

- **P1 Critical** — Immediate action required
- **P2 High** — Significant security concern
- **P3 Medium** — Moderate risk
- **P4 Low** — Minor issue
- **P5 Info** — Informational

Types include **Threats** (confirmed malicious activity), **Suspects** (potential threats needing investigation), and **Operational** findings (configuration and health alerts).

## Deployment

The dashboard can be deployed to any platform supporting Next.js:

- **Vercel** (recommended) — Zero-config deployment
- **Docker** — Containerized deployment
- **Any Node.js host** — Standard `npm run build && npm start`

Set `BLUMIRA_CLIENT_ID` and `BLUMIRA_CLIENT_SECRET` as environment variables in your deployment platform. Optionally set `DEMO_MODE=true` and `NEXT_PUBLIC_DEMO_MODE=true` to start the dashboard in demo mode.

## License

MIT
