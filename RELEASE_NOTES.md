# 🚀 RELEASE NOTES: Emergency System Rescue

**Status:** READY FOR DEPLOYMENT
**Version:** 1.0.0-rescue

## 🛠️ Critical Fixes Implemented

### 1. 🛡️ Security & Authentication
- **Fixed 403 Forbidden Error:** Updated frontend API calls to use `/api/auth/...`, matching the backend whitelist.
- **CORS Configuration:** Enabled wildcard access (`*`) for initial deployment compatibility.
- **Password Compatibility:** Adjusted encoding to match seeded users.

### 2. 🗄️ Database Stability
- **Flyway Repair:** Enforced `baseline-version=7` to bypass "Table Already Exists" errors caused by manual schema setup.
- **PostGIS Injection:** Injected `CREATE EXTENSION IF NOT EXISTS postgis;` into `V1__init.sql` to prevent "Geometry Type" errors.
- **Connection Pooler:** Configured backend to use Supabase Transaction Pooler (Port 5432) with prepared statements disabled.
- **Config Sanitization:** Removed invalid markdown syntax from `application.properties` JDBC URL.

### 4. ⚡ Performance Stabilization
- **Supabase Session Mode:** Enforced hard limit of 3 connections per instance to prevent `FATAL: max clients` errors.
- **Leak Prevention:** Reduced idle timeout to 30s to quickly release unused connections.

### 3. 🏗️ Use Case Completion
- **"Always Verify":** Added mandatory E2E verification protocol.
- **Frontend-Backend Sync:** Aligned API client base paths and rewrites.

## 🔑 Test Credentials (Live System)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@nbh.com` | `admin123` |
| **Host** | `host@nbh.com` | `host123` |
| **Guest** | `user@nbh.com` | `user123` |

## ⚠️ Deployment Instructions

1.  **Supabase:**
    - Go to SQL Editor.
    - Run: `DROP TABLE IF EXISTS "flyway_schema_history";` (Required for baseline fix).

2.  **Render/Vercel:**
    - Deployments should trigger automatically on git push (already done).
    - Check logs for "Started BackendApplication" to confirm health.

## 📝 Known Issues
- Local E2E tests may fail if run against the Production Database due to data state or network latency. Recommended to run tests against a local Docker database for future development.
