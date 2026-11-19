# NKB GLOBAL HUNTER — ADMINISTRATOR & USER OPERATING MANUAL

## 1. Initial Access & Authentication

1. Navigate to the platform URL.
2. Log in using your assigned enterprise credentials.
3. Default Initial Administrator Account:
   - **Email:** `admin@nkb-hunter.local`
   - **Password:** `Admin@NKB2026!`
   - *Recommendation:* Promptly change your password in User Management or update database credentials in production.

---

## 2. Navigating the 17 Enterprise Modules

The left navigation sidebar is divided into dedicated operational sections:

1. **Executive Dashboard:** Live KPI metrics (total verified companies, qualified prospects, active opportunities, won contracts). Automatically shows 0 when no records exist.
2. **Global Company Finder:** Live search tool querying public registries (Wikidata SPARQL, public directories) filtered by country, industry, and keyword.
3. **Company Intelligence:** Comprehensive directory of all discovered companies. Allows deep profile inspection and verification status updates.
4. **Enterprise Prospects:** Filtered view for Tier A (80–100) and Tier B (60–79) high-value prospects.
5. **Contact Discovery:** Centralized roster of verified and publicly listed decision-makers.
6. **AI Research Agents:** Management portal for all 7 specialized acquisition agents with execution logs and zero-cost tracking.
7. **Market Intelligence:** Cross-border manufacturing demand reports and verifiable public procurement signals.
8. **CRM Pipeline:** 14-stage interactive Kanban board and list view for deals.
9. **Opportunities:** Active opportunity table with win probabilities and CSV export.
10. **Proposals:** Professional B2B OEM/ODM manufacturing proposal generator with print/PDF export.
11. **Outreach Center:** Business email drafting, suppression list checking, and mandatory human approval workflow.
12. **Reports & Analytics:** Tabular distributions and one-click CSV data exports.
13. **Tasks & Follow-ups:** Sales reminders, prototype deadlines, and quotation follow-ups.
14. **Data Sources:** Management of active external connectors and API credentials.
15. **User Management:** Create user accounts, assign RBAC roles, and toggle user active states.
16. **System Settings:** Interactive sliders to adjust the 100-point scoring model weights.
17. **Audit Logs:** Immutable chronological log of all security and business events.

---

## 3. Human Approval & Anti-Fabrication Safeguards

- **Zero-Dummy-Data:** Never enter fake test records into staging or production.
- **Mandatory Proposal Approval:** Sales Staff can prepare proposals, but only a Sales Manager or Administrator can authorize external dispatch.
- **Outreach Approval:** Emails are never sent automatically. Drafts must receive human approval and pass suppression verification before transmission.
