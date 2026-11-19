# NKB GLOBAL HUNTER
### Enterprise AI-Powered Global B2B Client Acquisition & Sales Intelligence Platform

**Owner:** NKB Manufacturing  
**Domain:** [https://global.nkbmanufacturing.com](https://global.nkbmanufacturing.com)  
**Architecture:** React (Vite 6, Tailwind CSS), Node.js (Express, REST API), Dual DB Adapter (PostgreSQL / SQLite via `node:sqlite`), Multi-Agent AI Framework.

---

## 🚀 Core Capabilities
- **Global Prospect Discovery:** Traceable querying of global business directories and public data sources (Cosmetics, Perfume, Food Supplements, Packaging).
- **Zero-Dummy-Data Compliance:** Zero fabricated clients, simulated leads, or synthetic revenue. Honest empty states until real research is gathered.
- **Multi-Agent AI Intelligence:**
  1. Global Research Agent
  2. Company Intelligence Agent
  3. Lead Qualification Agent
  4. Market Opportunity Agent
  5. Contact Research Agent
  6. Sales Proposal Agent
  7. Follow-up Recommendation Agent
- **Full Sales CRM & Pipeline:** Kanban stages (Discovered, Contacted, Interested, RFQ Received, Quotation Submitted, Negotiation, Contract Won, Lost).
- **Proposal & Contract Engine:** Automated proposal generation, SKU pricing calculations, revision tracking, and approval flows.
- **Enterprise Security:** JWT-based stateless authentication, RBAC with role-level enforcement, bcrypt password hashing, helmet protection, rate-limiting, and comprehensive immutable audit logging.

---

## 🛠️ Stack & Directory Structure
```
├── client/              # React 18, Vite 6, Tailwind CSS, Lucide Icons
│   ├── dist/            # Production static build
│   └── src/             # SPA Components, Context, Services
├── server/              # Express REST API, Background Jobs, DB Migrations
│   ├── src/
│   │   ├── agents/      # Autonomous AI agent implementations
│   │   ├── controllers/ # Route handlers
│   │   ├── db/          # Migrations (32 relational tables) & DB abstraction
│   │   ├── middleware/  # JWT auth, RBAC guards
│   │   ├── routes/      # 17 enterprise feature modules
│   │   └── services/    # Discovery engines, scoring, proposal generation
│   ├── tests/           # Automated verification test suite
│   └── scripts/         # Production deployment & audit utilities
├── docs/                # Architecture and implementation specifications
└── storage/             # Embedded persistent relational storage
```

---

## 📦 Installation & Local Development

### 1. Prerequisites
- Node.js v20.x or v22.x+
- npm v10.x+

### 2. Setup Server
```bash
cd server
cp .env.example .env
npm install
npm run migrate
npm run dev
```

### 3. Setup Client
```bash
cd client
npm install
npm run dev
```

The application runs locally on `http://localhost:3000` with API proxying to `http://localhost:5000`.

---

## 🔒 Production Security & Zero Dummy Data
- Live production records start with zero artificial prospects.
- All discovered companies contain real provenance attribution (retrieval timestamp, data provider, source URL).
- Default administrative credentials must be updated upon initial deployment.
