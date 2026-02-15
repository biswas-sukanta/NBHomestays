# North Bengal Homestays Platform

A comprehensive full-stack platform for booking homestays in North Bengal, featuring a viral, story-driven frontend and a robust Spring Boot backend.

## 🚀 Quick Start

To start the full stack application locally with a single command (requires Docker Compose):

```bash
docker-compose up --build
```

Access the application:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)
- **Maildev**: [http://localhost:1080](http://localhost:1080)

## 🏗️ Architecture

- **Backend**: Java 21, Spring Boot 3.3, PostgreSQL (PostGIS), Hibernate (EhCache L2), JWT Auth.
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Shadcn UI, Zustand, TanStack Query.
- **Infrastructure**: Docker, GitHub Actions CI/CD.

## ✨ Features

- **Story Mode**: Immersive video-based homestay discovery.
- **Interactive Map**: Location-based search using PostGIS.
- **Comparison Tool**: Compare up to 3 homestays side-by-side.
- **Booking System**: Real-time availability and dynamic pricing.
- **Vibe Score**: Automated scoring based on reviews and amenities.

## 🛠️ Development

### Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Verification

Run the production readiness check:

**Windows (PowerShell):**
```powershell
./verify_production_readiness.ps1
```

**Linux/Mac:**
```bash
./verify_production_readiness.sh
```

## 📦 Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and tests the application on every push to `main`.
