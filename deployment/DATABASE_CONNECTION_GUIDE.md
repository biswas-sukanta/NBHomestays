# 🗄️ Supabase Database Connection Guide

This project uses **Supabase** (PostgreSQL) as its primary database. To ensure stable connections, especially in production/Koyeb environments, follow these guidelines.

## 🔌 Connection Modes

Supabase provides two primary ways to connect. Using the correct port is critical for connection pooling.

### 1. Transaction Mode (Recommended for Apps)
- **Port:** `6543`
- **Behavior:** Connections are managed by PgBouncer. Ideal for serverless or containerized apps (Koyeb) where many short-lived connections are common.
- **JDBC URL Pattern:** `jdbc:postgresql://<host>:6543/postgres?prepareThreshold=0`
- **Note:** `prepareThreshold=0` is required because PgBouncer does not support prepared statement metadata across different sessions.

### 2. Session Mode (Recommended for Migrations/Flyway)
- **Port:** `5432`
- **Behavior:** Direct connection to PostgreSQL.
- **JDBC URL Pattern:** `jdbc:postgresql://<host>:5432/postgres`
- **Use Case:** Best for long-running tasks like Flyway migrations or heavy batch jobs.

---

## 🛠️ Performance Tuning (application.properties)

The following HikariCP settings are optimized to handle potential cold starts or network jitter between Koyeb and Supabase:

```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=120000
spring.datasource.hikari.keepalive-time=30000
spring.datasource.hikari.max-lifetime=1800000
```

## 🔐 Credentials
These should **always** be provided via environment variables in production:
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
