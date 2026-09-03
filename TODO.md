# TODO — remaining work

Everything below is not yet done. Everything NOT listed here (i18n across all
pages, attachments module, offline queue, tests, CI, .env.example, lint/typecheck/
build) is done and verified as of this pass — full stack was re-run clean:
backend lint (0 errors, 2 pre-existing harmless warnings) + tsc + 25 vitest tests
+ build, and frontend lint (0 errors/warnings) + build, all pass.

## 1. Decide what to do about the two conflicting proposal documents

`CS300_Project_Proposal.docx` commits to a Flask backend, a Leaflet/OpenStreetMap
facility locator, and a Chart.js heatmap dashboard. None of that exists in the
codebase (which is Node/Express, and has no `facilities` table or map at all).
`Project_Proposal.docx` matches the actual build much more closely. This is the
only remaining open decision before submission: either update CS300's proposal
to match what was built, or build a facility locator + map/chart dashboard to
match CS300's proposal.

## 2. Production hardening (not blocking, worth knowing about)

- **Attachments storage on Render uses a persistent disk** (`render.yaml` mounts
  one at `/app/uploads`) rather than S3/object storage. Fine for a course project;
  would need revisiting for real multi-instance production use.
- **`multer@1.x`** is what's installed (matches the code's API) — npm flags it as
  deprecated/has known advisories. Consider `multer@2.x` later; the API is close
  but wasn't verified compatible here.
- Backend has 2 pre-existing ESLint warnings (`_password_hash` unused var in
  `auth.service.ts` and `health-workers.controller.ts`) — harmless, not new.

## i18n coverage (for reference, all done)

All pages now use `useLanguage()` / `t()`: `Landing.jsx`, `Navbar.jsx`,
`OfflineBanner.jsx`, `ReportForm.jsx`, `TrackStatus.jsx`, `Login.jsx`,
`TriageDashboard.jsx`, `Incidents.jsx`, `IncidentDetail.jsx`, `ReportDetail.jsx`.
Translation keys exist in `translations.js` for EN/FR for all of the above,
including a shared `attachments.*` section for file-picker validation messages
and a `{count}`-based `singular|plural` convention (see `t()`'s `pluralize`
helper in `LanguageContext.jsx`) used by `reportForm.attachmentsSelected`.

Still intentionally untranslated (matches existing codebase convention, not an
oversight): enum-ish literal values shown as-is — `CATEGORY_LABELS`, raw
`status`/`priority_level` strings, and date/duration strings from
`utils/formatters.js` (e.g. "Overdue"). Translating those would mean touching
shared formatter/constants logic used across many components, which felt like a
separate, larger change — flag if you want that done too.

## Re-verify command reference

```bash
cd backend && npm run lint && npx tsc --noEmit && npx vitest run && npm run build
cd frontend && npm run lint && npm run build
```
