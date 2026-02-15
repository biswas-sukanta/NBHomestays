# Vercel Environment Variables Guide

For the **North Bengal Homestays** frontend to function correctly on Vercel, please configure the following Environment Variables in the Project Settings.

## Required Variables

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL of the Backend API (Render) | `https://nb-homestays-backend.onrender.com/api` |

## Optional / Future Variables

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | (If switching to Mapbox) | `pk.eyJ...` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | `G-XXXXXXXXXX` |

## Deployment Checklist
1.  **Build Command:** `next build` (Default)
2.  **Output Directory:** `.next` (Default)
3.  **Install Command:** `npm install` (Default)
