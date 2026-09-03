# CareLink, Frontend

React (JavaScript, Vite) frontend for the Community Health Reporting and Triage application.
Plain CSS design system, no UI framework, blue and white glass theme throughout.

## Getting started

```bash
cp .env.example .env       # point VITE_API_BASE_URL at your running backend
npm install
npm run dev                # http://localhost:5173
```

The backend must be running (see the backend README) with `CORS_ORIGIN` set to
`http://localhost:5173` in its `.env` for local development.

## What is here

```
src/
  api/            fetch based client for every backend endpoint
  context/        AuthContext, holds the signed in health worker's session
  components/     GlassCard, Button, Badge, Navbar, loading and empty states
  pages/
    Landing            entry point with three clear paths
    ReportForm          public report submission
    TrackStatus          public, token based status lookup
    Login                health worker sign in
    TriageDashboard     the priority pulse bar and sorted queue
    ReportDetail         full report view, history, and triage actions
    Incidents             detected clusters
    IncidentDetail        cluster detail and status control
  routes/
    ProtectedRoute      redirects to sign in when a session is required
  index.css, components.css, layout.css, dashboard.css
                          the design system: tokens, components, layout, dashboard
```

## Design system

- Palette: deep signal blue (`#2f73f5`) through navy (`#0c1e3d`), on white and ice
  backgrounds, with a soft animated blue gradient behind every page.
- Surfaces are frosted glass: translucent white fills, blurred backdrops, soft
  blue tinted shadows, generous rounded corners.
- Type: Sora for headings and labels, Inter for body text.
- Signature element: the priority pulse bar on the triage dashboard, a live,
  glanceable read of how many open reports sit at each priority, with a soft
  pulsing glow on the critical count when it is above zero.
- Copy and interface labels are written without hyphens or dashes throughout.
- Fully responsive: the navbar collapses to a glass mobile menu below 860px,
  and every form, card grid, and dashboard row reflows for narrow screens.

## Progressive Web App

The app installs like a native app and keeps working with a spotty connection,
both important for the low resource settings this is built for.

- **Installable**: a real web app manifest (name, icons, standalone display,
  theme color) means the browser will offer to install CareLink on desktop,
  Android, and iOS. An in-app "Install app" button appears in the navbar
  whenever the browser's install prompt is available.
- **Offline app shell**: the interface itself (HTML, CSS, JS, fonts, icons) is
  precached by a service worker on first visit, so the app still opens
  without a connection.
- **Network first data**: report and triage data always tries the network
  first, and only falls back to a short lived cache if the network is
  unreachable, so a health worker never mistakes stale cached data for the
  current queue. A banner appears app wide whenever the device goes offline.
- **Update flow**: when a new version is deployed, a toast offers a one tap
  reload rather than silently serving an old cached version indefinitely.

To try installability locally, run `npm run build && npm run preview` (service
workers do not register in `npm run dev` by design) and open the preview URL,
your browser's install icon or menu option will appear.


## Connecting to the backend

Every request goes through `src/api/client.js`, which reads `VITE_API_BASE_URL`
and attaches the stored JWT to authenticated calls automatically. To point the
app at a different backend (staging, production), change that one environment
variable, no code changes needed.

Public flows (report submission, status tracking) call the API with no token.
Health worker flows (dashboard, report actions, incidents) require sign in;
`ProtectedRoute` handles the redirect, and `AuthContext` restores the session
from the stored token on page load.
