# NKB GLOBAL HUNTER — SYSTEM ARCHITECTURE
## Enterprise AI-Powered Global B2B Client Acquisition & Sales Intelligence Platform

**Owner:** NKB Manufacturing  
**Target Industries:** Cosmetics OEM/ODM, Perfume OEM/ODM, Food Supplement OEM/ODM, Packaging Materials  
**Deployment Target:** Staging & Production on Hostinger AlmaLinux 10 VPS  
**Zero-Dummy-Data Status:** Enforced & Cryptographically Audited  

---

## 1. System Overview

NKB Global Hunter is a full-stack, enterprise-grade B2B acquisition and sales intelligence platform designed to discover, qualify, analyze, and convert genuine international manufacturing buyers.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NKB GLOBAL HUNTER CLIENT                        │
│               React 18 + Vite + Tailwind CSS + Lucide Icons            │
│               (Executive ERP Workspace, Deep Navy & Amber)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JWT Auth)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NKB GLOBAL HUNTER SERVER                        │
│                Node.js v26 + Express.js + Unified DB Adapter           │
│                                                                        │
│  ┌───────────────────┐ ┌───────────────────┐ ┌──────────────────────┐  │
│  │ Discovery Engine  │ │  100-Pt Scoring   │ │   AIAgentEngine      │  │
│  │ (Wikidata, Web)   │ │  Config Weights   │ │   7 Heuristic Agents │  │
│  └───────────────────┘ └───────────────────┘ └──────────────────────┘  │
│  ┌───────────────────┐ ┌───────────────────┐ ┌──────────────────────┐  │
│  │   Proposal Engine │ │  Email Outreach   │ │   Audit Logging      │  │
│  │  (Specs & Terms)  │ │ (Human Approval)  │ │   Immutable Ledger   │  │
│  └───────────────────┘ └───────────────────┘ └──────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴───────────────────────────┐
       ▼                                                        ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│       POSTGRESQL 16          │        │      EMBEDDED RELATIONAL     │
│  (Hostinger VPS Production)  │        │   (Local Staging Fallback)   │
│  Relational Tables, Indexes  │        │  Node:SQLite WAL Engine      │
└──────────────────────────────┘        └──────────────────────────────┘
```

---

## 2. Multi-Dimensional 100-Point Qualification Model

All discovered companies are scored across five distinct enterprise evaluation dimensions. Missing information is never fabricated or awarded default points; it directly incurs a confidence penalty and missing-evidence flag.

| Dimension | Max Points | Evaluation Criteria |
| :--- | :---: | :--- |
| **1. Industry Fit** | 25 | Direct match with Cosmetics, Perfume, Dietary Supplements, Packaging Supply, or wholesale retail channels. |
| **2. NKB Service Fit** | 25 | Direct synergy with NKB's OEM/ODM manufacturing cleanroom capabilities, formula compounding, or bottling lines. |
| **3. Purchasing Potential** | 20 | Business classification indicating recurring commercial batch scale (Brand Owner, Importer, Retail Chain). |
| **4. Legitimacy & Evidence** | 15 | Active official domain, verifiable government or Wikidata registry entry, verified business address. |
| **5. Buying Signals** | 15 | Verified decision-maker contact presence, expansion announcements, active procurement mentions. |
| **TOTAL** | **100** | **Priority Tiers: A (80–100), B (60–79), C (40–59), D (&lt;40)** |

---

## 3. Real Connector Architecture

1. **Wikidata SPARQL Knowledge Graph (`WikidataConnector`):**
   - Free, open global registry querying real corporations and legal entities.
   - Filters by Q-IDs for business enterprises (`wd:Q4830453`) located in priority countries (Philippines `wd:Q928`, US `wd:Q30`, Japan `wd:Q17`, South Korea `wd:Q884`, China `wd:Q148`, UAE `wd:Q878`, Australia `wd:Q408`, UK `wd:Q145`, Germany `wd:Q183`, France `wd:Q142`).
   - Retrieves official websites, descriptions, and headquarters.
2. **Public Website & Metadata Inspector (`WebInspectorConnector`):**
   - Live HTTP/HTTPS inspection of official target domains.
   - Extracts OpenGraph tags, title, meta descriptions, and detects references to OEM, ODM, contract manufacturing, or private labeling.
   - Extracts publicly listed `mailto:` contact links.
3. **External Commercial API Connector (`CustomApiConnector`):**
   - Modular integration for Apollo, Hunter, or Google Search.
   - Provides honest status reporting (`unconfigured`, `active`, `rate_limited`).

---

## 4. Role-Based Access Control (RBAC)

- **Administrator:** Full administrative rights, user creation, scoring weight adjustments, connector credential storage, and immutable audit log review.
- **Sales Manager:** Pipeline supervision, opportunity reassignment, proposal approval, and outreach email dispatch authorization.
- **Sales Staff:** Opportunity management, proposal drafting, contact documentation, and note logging.
- **Research Analyst:** Company discovery execution, domain metadata verification, and contact discovery.
- **Read-only User:** Executive dashboards, pipeline oversight, and analytics exports.
