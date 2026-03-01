# 🚨 CRITICAL: Database Sync Guide (Flyway Baseline)

You are seeing `ERROR: relation "users" already exists` because:
1.  The database tables were created manually or pre-exist in the environment.
2.  Flyway thinks the database is at Version 1, so it tries to run Version 2, 3, etc.
3.  Version 2 tries to create `users`, but it already exists -> **CRASH**.

## The Fix: Reset Migration History

We need to tell Flyway: *"Forget about history, assume we are already at Version 7."*

### Step 1: Drop the History Table (e.g., in Supabase SQL Editor)
1.  Go to your Database Dashboard (e.g., Supabase -> **SQL Editor**).
2.  Run this command:
    ```sql
    DROP TABLE IF EXISTS "flyway_schema_history";
    ```
    *This creates a clean slate for Flyway.*

### Step 2: Configure Baseline
Ensure `application.properties` (or your environment variables) includes:
```properties
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=7
```

### Step 3: Redeploy
1.  **Push the code.**
2.  **Trigger a deployment.**
3.  Flyway will see no history table, but existing tables.
4.  It will create a new history table entry saying: *"Baselined at Version 7"*.
5.  Startup will succeed! ✅
