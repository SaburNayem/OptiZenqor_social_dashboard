# Dashboard Backend Integration Report

Updated: 2026-05-01

## Current Local State

The local dashboard is no longer just the public Vite starter. It is a working admin console wired to backend APIs and verified locally.

## Verified Dashboard Capabilities

- admin login via `POST /admin/auth/login`
- session restore via `GET /admin/auth/me`
- refresh flow via `POST /admin/auth/refresh`
- logout via `POST /admin/auth/logout`
- live overview via `GET /admin/dashboard/overview`
- live users via `GET /admin/users`
- live content moderation via `GET /admin/content`
- live reports via `GET /admin/reports`
- live audit logs via `GET /admin/audit-logs`
- live settings via `GET/PATCH /admin/settings`
- live app-domain browsing via:
  - `/marketplace/products`
  - `/jobs`
  - `/events`
  - `/communities`
  - `/pages`
  - `/admin/support-operations`

## Local Dashboard File State

- `src/App.jsx` is locally API-driven
- `.env.example` contains `VITE_API_BASE_URL=http://localhost:3000`

## Remaining Dashboard Gaps

- the dashboard is still implemented as a compact single-file app rather than a fully modular professional admin frontend
- richer pagination/search/filter controls are still basic for some pages
- dedicated pages for live streams, notification devices, and wallet/subscription operations are not yet broken out into specialized views
- mutation coverage is strongest for users/content/reports/settings; broader admin mutations still need expansion

## Validation

- `npm install`: pass in current workspace
- `npm run lint`: pass
- `npm run build`: pass
# 2026-05-01 Update

- Dashboard now keeps its API/session logic in `src/services/apiClient.js` instead of leaving transport/session helpers embedded only in `App.jsx`.
- Verification after this pass:
  - `npm run lint`: pass
  - `npm run build`: pass
