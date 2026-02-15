# 🚨 CRITICAL: Supabase Connection Guide (IPv4 Fix)

If Render fails with `java.net.SocketException: Network unreachable`, it is because Render uses IPv4 but Supabase Direct URLs are IPv6.

**SOLUTION:** Use the Supabase Connection Pooler (Supavisor) which supports IPv4.

## Step 1: Get the Pooler URL
1.  Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navigate to **Project Settings** -> **Database**.
3.  Scroll to the **"Connection String"** section.
4.  **⚠️ CRITICAL STEP:** Toggle the switch **"Use connection pool"** to **ON**.
5.  **Mode:** Select **"Session"** (Port `5432`).
    * *Note: Do NOT use "Transaction" mode (Port 6543) for this Spring Boot setup yet.*
6.  Copy the **URI**.
    * It should look like: `postgresql://postgres.projectref:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`

## Step 2: Update Render Environment Variables
1.  Go to your **Render Dashboard** -> Select `nb-homestay-api`.
2.  Click on **Environment**.
3.  Update `SPRING_DATASOURCE_URL`:
    * **Value:** `jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
    * *Note:* Remove `postgres://` prefix if you copied it directly, use `jdbc:postgresql://` instead.
    * *Make sure there are no query parameters like `?user=` or `&password=` at the end.*
4.  Update `SPRING_DATASOURCE_USERNAME`:
    * Check closely. The pooler username often changes format.
    * **Direct:** `postgres`
    * **Pooler:** `postgres.projectref` (e.g., `postgres.qedomjhuepcbjjpskvoq`)
5.  Update `SPRING_DATASOURCE_PASSWORD`:
    * This usually remains your database password.

## Step 3: Redeploy
1.  Click **"Save Changes"** in Render.
2.  Render will automatically restart the service.
3.  Watch the logs for: `Started BackendApplication in ... seconds`.
