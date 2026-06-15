# Sidewalk

**Sidewalk** is a civic engagement platform that enables citizens to report local issues, track public cases, and build trust between communities and institutions through transparent reporting and verification workflows.

The platform helps people document problems in their neighborhoods, submit reports, monitor progress, and access public information about issues affecting their communities. By combining identity, reporting, and verification systems, Sidewalk aims to create a more accountable and responsive civic ecosystem.

Built across web, mobile, and backend services, Sidewalk is designed to support both everyday citizens and organizations responsible for resolving reported issues.

---

# Overview

Many civic issues go unresolved because there is no reliable system for reporting, tracking, and verifying them.

Citizens often submit complaints through fragmented channels with little visibility into what happens afterward. Local governments, organizations, and communities frequently lack a transparent mechanism for demonstrating progress or maintaining trust.

Sidewalk addresses these challenges by providing:

* structured issue reporting,
* citizen identity and trust systems,
* public case tracking,
* verification workflows,
* notifications and updates,
* transparent civic engagement tools.

The platform creates a shared space where reports can be submitted, monitored, verified, and resolved with greater accountability.

---

# Core Features

## Civic Reporting

Citizens can report issues affecting their communities through a structured reporting workflow.

Examples include:

* damaged roads,
* waste management issues,
* broken public infrastructure,
* environmental concerns,
* utility disruptions,
* community safety concerns,
* public service complaints.

Reports can include supporting information, media, location data, and categorization to improve visibility and response.

---

## Identity & Trust

Trust is critical in civic systems.

Sidewalk includes identity workflows that help establish credibility while protecting users from unnecessary complexity.

Identity features may include:

* user verification,
* profile management,
* trust indicators,
* contribution history,
* reputation signals,
* reporting history.

These systems help reduce abuse while increasing confidence in submitted reports.

---

## Public Case Tracking

Transparency is one of the platform's core goals.

Users can track the status of reports throughout their lifecycle.

Potential report states include:

* submitted,
* under review,
* verified,
* assigned,
* in progress,
* resolved,
* closed.

This provides visibility into what actions are being taken after a report is submitted.

---

## Notifications & Updates

Sidewalk keeps users informed as cases evolve.

Notifications may include:

* report status changes,
* verification updates,
* moderator actions,
* community engagement activity,
* resolution confirmations.

This ensures users remain connected to issues they care about.

---

## Moderation & Administration

The platform includes operational tools for maintaining data quality and platform integrity.

Administrative capabilities may include:

* report review,
* moderation workflows,
* abuse prevention,
* verification management,
* case escalation,
* operational analytics.

These tools help maintain trust and ensure the platform remains useful for communities.

---

## Stellar-Powered Verification

Sidewalk uses Stellar as a trust and verification layer rather than a traditional payment system.

The Stellar integration can be used for:

* verification receipts,
* proof of report submission,
* proof of verification events,
* auditability,
* trust signals,
* transparent record tracking.

By anchoring key events to Stellar, Sidewalk can provide stronger guarantees around authenticity and transparency while keeping the user experience simple.

---

# Technology Stack

| Area               | Technology                       |
| ------------------ | -------------------------------- |
| Web Application    | Next.js + React + TypeScript     |
| Mobile Application | Expo + React Native + TypeScript |
| Backend API        | Express.js + TypeScript          |
| Blockchain Layer   | Stellar                          |
| Package Management | pnpm                             |
| Architecture       | Monorepo                         |

---

# Repository Structure

```text
sidewalk/
│
├── apps/
│   ├── api/                # Core backend services
│   ├── web/                # Web platform
│   ├── mobile/             # Mobile application
│   └── stellar-service/    # Stellar verification service
│
├── packages/
│   ├── config/             # Shared configuration
│   └── types/              # Shared TypeScript contracts
│
└── docs/
```

---

# Applications

## API

`apps/api`

The API serves as the central backend for Sidewalk.

Responsibilities include:

* authentication,
* user management,
* report management,
* case tracking,
* moderation workflows,
* notification coordination,
* communication with the Stellar service.

---

## Web Application

`apps/web`

The web platform provides a full-featured experience for citizens, moderators, administrators, and organizations.

Potential functionality includes:

* report creation,
* public case browsing,
* report management,
* verification visibility,
* moderation interfaces,
* administrative tools,
* analytics dashboards.

The web experience is intended to provide the richest view of the platform's data and workflows.

---

## Mobile Application

`apps/mobile`

The mobile application is designed for citizens reporting issues in real-world environments.

Key use cases include:

* submitting reports from the field,
* attaching photos and evidence,
* receiving updates,
* tracking report progress,
* engaging with local issues.

The mobile experience prioritizes speed, accessibility, and ease of reporting.

---

## Stellar Service

`apps/stellar-service`

The Stellar service handles all blockchain-related functionality.

Responsibilities include:

* verification receipts,
* trust records,
* transaction generation,
* blockchain communication,
* verification lookups,
* audit support.

Separating Stellar functionality from the API keeps the architecture modular and easier to maintain.

---

# Product Roadmap

The current platform roadmap follows this progression:

1. Authentication.
2. Identity and user profiles.
3. Civic reporting workflows.
4. Public case tracking.
5. Stellar-backed verification and receipts.
6. Notifications and trust signals.
7. Moderation and administration.
8. Offline and resilience features.
9. Observability, security, and production readiness.

Each phase builds upon the previous one to create a complete civic engagement ecosystem.

---

# Getting Started

## Requirements

* Node.js 20+
* pnpm 10+

Install dependencies:

```bash
pnpm install
```

Run the primary applications:

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
pnpm dev:stellar
```

---

# Quality Checks

Run validation and development checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

---

# Environment Configuration

Each application includes an example environment file:

```text
apps/api/.env.example
apps/stellar-service/.env.example
apps/web/.env.example
apps/mobile/.env.example
```

Copy the appropriate file and configure environment variables before running services locally.

---

# Vision

Sidewalk's long-term goal is to create a trusted civic infrastructure layer where communities can report issues, verify information, monitor progress, and hold institutions accountable through transparent and verifiable workflows.

By combining reporting systems, identity, public tracking, and Stellar-backed verification, Sidewalk aims to strengthen trust between citizens, organizations, and public institutions.

---

# License

MIT
