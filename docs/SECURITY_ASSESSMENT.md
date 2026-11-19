# NKB GLOBAL HUNTER — CYBERSECURITY & COMPLIANCE ASSESSMENT

## 1. Authentication & Session Security

- **Algorithm:** JWT (JSON Web Tokens) signed via HMAC SHA-256 with 64+ character secret keys.
- **Expiry:** Configurable 7-day token expiration with immediate server-side revocation on user account deactivation.
- **Password Protection:** Cryptographic hashing via `bcryptjs` with 10 salt rounds. Plaintext passwords are never logged or stored.

---

## 2. API Hardening & Injection Defense

- **SQL Injection Defense:** All queries utilize parameterized placeholders (`$1, $2, ...` mapped to driver parameter arrays). Raw string concatenation in SQL statements is strictly prohibited.
- **Cross-Site Scripting (XSS):** React 18 DOM tree rendering automatically escapes all dynamic data bindings. Raw HTML injection (`dangerouslySetInnerHTML`) is absent.
- **HTTP Security Headers:** `helmet` middleware sets secure headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=15552000; includeSubDomains`
- **Rate Limiting:** `express-rate-limit` enforces a maximum of 120 API requests per minute per IP address to safeguard against brute-force attacks and resource exhaustion.

---

## 3. Role-Based Access Control (RBAC) Governance

- Route endpoints are guarded by `authenticateToken` and `requireRole(...)`.
- Administrative privileges (scoring weight alterations, user creation, connector credential updates, audit log inspection) are restricted to `role_admin`.
- Proposal approval and outreach transmission are restricted to `role_sales_manager` and `role_admin`.

---

## 4. Privacy & Anti-Harassment Compliance

- **Zero-Send Outreach Policy:** The application strictly prevents automated background bulk email spam.
- **Mandatory Human Approval:** Every draft must be inspected and approved by authorized personnel.
- **Suppression Registry:** Permanent suppression list blocks any email or domain that has unsubscribed, bounced, or requested exclusion.
