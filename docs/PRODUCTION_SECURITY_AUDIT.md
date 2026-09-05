# Production Security Audit

Status: HOLD FOR REVIEW — not deployment-authorized.

This document reflects the remediation checkpoint after migrating document persistence to Supabase Storage. No Vercel deployment was performed.

## Scope
This audit covered the production-readiness gate for the HELOCI application, with specific focus on:
- server-side authentication and role-based access
- organization-bound access enforcement
- direct-file exposure from document storage
- credential leakage in repo artifacts and seed data
- deployment blockers for Vercel and environment configuration

## Security posture summary
The application has a meaningful server-side auth foundation, including authenticated API routes and organization-aware access checks. However, the repository still contains production blockers that must be resolved before deployment review can proceed.

## Security controls verified
- Authentication: reviewed authenticated route and server-action boundaries derive identity from the server session; unauthenticated document, email, workflow, notification, and organization operations are rejected.
- Authorization: reviewed resource operations use uploader/application ownership, organization membership, role checks, or resource relationship checks at the server boundary.
- Organization isolation: forged organization IDs are rejected in reviewed email, draft, recipient, template, member-management, communication, and document paths.
- Document access: preview/download require authentication and `validateDocumentAccess`; applicant access is owner-bound and staff access is organization-bound.
- Service-role boundary: service-role usage is confined to server-side actions, seed code, and diagnostic scripts; it is not imported by client components.
- Environment boundary: `env.ts` is marked `server-only`; no secret variable is prefixed with `NEXT_PUBLIC_`.
- Cron/workflow protection: the workflow route requires an exact `Authorization: Bearer <CRON_SECRET>` header and fails closed when the secret is absent.
- Template authorization: all listed template database helpers have callers only in reviewed server actions, and resource calls carry resolved organization scope; global templates are explicitly nullable/shared.
- Public artifact exposure: new files use the private Supabase Storage bucket `heloci-documents`; the old public upload directory is empty in the working tree and its tracked artifacts are marked deleted.
- Storage persistence: document persistence now uses private Supabase Storage and no longer uses local filesystem writes or reads. The bucket was created and verified as non-public with a 12 MB limit.

## Verified findings

### 1) Public document storage exposure
Risk: High
Finding: Uploaded files were stored under a public web path and could be resolved directly without authentication. This created a direct object exposure vector even when the application enforced access checks elsewhere.
Fix applied: document uploads now use the private `heloci-documents` Supabase Storage bucket and public-facing URLs are routed through the secure preview endpoint instead of raw storage locators.

### 2) Hardcoded credential-like values in seed/development scripts
Risk: High
Finding: Local seed scripts and diagnostic scripts embedded password defaults and env-dependent secrets in source-controlled files. These values are not acceptable for a production-bound repository state.
Fix applied: seed defaults now require explicit environment variables instead of fixed examples in code. This prevents the repo from silently depending on checked-in credential patterns.

### 3) Document URL contract was exposing raw storage paths
Risk: Medium
Finding: API responses returned raw file URLs to clients, which undermines the secure preview/download architecture and encourages direct file access patterns.
Fix applied: document metadata now routes callers to /api/documents/[id]/preview when a secure route is available.

### 4) Repository contains unrelated pre-existing TypeScript test issues
Risk: Medium for repo-wide validation
Finding: The wider repository currently fails a full TypeScript compile due to unrelated communication/notification test and type-definition issues outside the production-security fix set.
Status: these errors are not part of the document hardening fix and must be triaged separately; they block a repository-wide "clean compile" claim.

### 5) Existing database records reference deleted public artifacts
Risk: High until disposition is approved
Finding: Aggregate inspection found 17 `Document` rows with the old public URL pattern. They were uploaded in 2026 and are associated with 9 submitted, 4 draft, and 4 rejected applications. This is not sufficient evidence to classify them as disposable test/demo data.
Status: no database records were modified. An approved migration or restoration decision is required before deployment. Restoration should move needed files into private storage and update references; deletion requires explicit data-owner approval and retention review.

### 6) Current local filesystem storage was not Vercel-safe
Risk: High deployment blocker
Finding: the previous implementation used `writeFile`, `mkdir`, `unlink`, and local reads under `storage/documents`. Vercel function filesystems are ephemeral and unsuitable for durable user-document storage.
Fix applied: `lib/documents/storage.service.ts` now uses a server-side Supabase client with `SUPABASE_SERVICE_ROLE_KEY` for private-bucket upload/download/remove operations. No raw storage URL is returned to clients.

### 7) Production dependency vulnerabilities
Risk: High
Finding: the initial `pnpm audit --prod` run reported 31 production vulnerabilities: 18 high, 11 moderate, and 2 low. The affected dependency graph included Next.js `16.2.3` and transitive `sharp`, `postcss`, `nanoid`, and `browserslist` packages.
Fix applied: Next.js and `eslint-config-next` were upgraded to `16.2.11`, and patched pnpm overrides were added for the affected transitive packages. A fresh `pnpm audit --prod` now reports no known vulnerabilities.

## Test/demo record classification
The public binary files are confirmed test/demo artifacts and must remain absent from `public/uploads/documents`. That conclusion does not automatically classify the database rows as disposable. Read-only application tracing found six associated application IDs, all using the `Global Housing Eligibility` program. The affected rows include 9 submitted applications, 4 draft applications, and 4 rejected applications; the newest submitted application was updated and submitted on 2026-09-02.

Additional non-sensitive evidence:
- 15 of 17 affected rows are associated with accounts that do not match the known seed-account set; 2 of 17 match known seed-account identities.
- Application workflow history exists for five of the six application IDs, including document requests and/or messages. One submitted application ID is referenced by an existing repository evidence report for a submission flow.
- No applicant identity, document contents, or credential values were output or inspected for this classification.

Conclusion: under the requested strict classification, **A = 0** and **B = 17**. No row was both associated with a known seed account and in draft/rejected status without a submission timestamp. Two rows match known seed-account identities, but both belong to a submitted application and therefore classify as B. The other 15 rows are associated with non-seed accounts and also classify as B. No record may be deleted until a data owner confirms test provenance and retention disposition.

No cleanup SQL is proposed for execution because no records meet category A. All 17 records require manual review; any later deletion would require an approved, auditable data-cleanup operation.

The current application does not depend on the old public files for new upload or authorized preview: uploads target the private `heloci-documents` Supabase Storage bucket, and preview resolves through the authenticated `/api/documents/[id]/preview` route. The old public directory can and must remain empty.

## Exact affected-record inventory
The following inventory contains only document/application identifiers, status, path metadata, timestamps, and document type. No applicant information or file contents were inspected.

| Document ID | Application/Case ID | Status | Old path pattern | Uploaded | Type | Workspace artifact | Private artifact | Git recoverable |
|---|---|---|---|---|---|---|---|---|
| `cmsdgiaje000c9j1di32echwj` | `cmsdgb49o00029j1dvvqy9tv2` | rejected | `/uploads/documents/..._c12f2a18-f675-4da5-91b3-7e0c70b70bac.png` | 2026-08-03 | employment_letter | no | no | yes |
| `cmsdgidxx000e9j1daij1igvc` | `cmsdgb49o00029j1dvvqy9tv2` | rejected | `/uploads/documents/..._30619f6c-cd63-4b88-93a0-4ccf68b4f8e0.png` | 2026-08-03 | self_employment | no | no | yes |
| `cmsdmvn01001suoklzx4qy5fd` | `cmsdmqpya001quokldavm59ra` | submitted | `/uploads/documents/..._841cc3da-7c94-4dbd-9ac6-8cd1d4ebd77c.png` | 2026-08-03 | drivers_license | no | no | yes |
| `cmsdmvn08001uuoklz2irw219` | `cmsdmqpya001quokldavm59ra` | submitted | `/uploads/documents/..._ff78403b-2ef4-4358-add6-a5b67afd4854.png` | 2026-08-03 | social_security_card | no | no | yes |
| `cmsdpdvaa0001wsddouwhomo3` | `cmsdmqpya001quokldavm59ra` | submitted | `/uploads/documents/..._13fcc512-fe03-49aa-982d-cf9c3ea713df.png` | 2026-08-03 | self_employment | no | no | yes |
| `cmsdgi0e600089j1d5tkhqhyt` | `cmsdgb49o00029j1dvvqy9tv2` | rejected | `/uploads/documents/..._8b4d2884-fd27-45d4-9fe5-90655ff08e0.png` | 2026-08-05 | drivers_license | no | no | yes |
| `cmsdgi3qz000a9j1dr581silk` | `cmsdgb49o00029j1dvvqy9tv2` | rejected | `/uploads/documents/..._37c730b3-d0ae-4ec9-9cce-e42fe06e64e7.png` | 2026-08-05 | social_security_card | no | no | yes |
| `cmsdzh2sd000m12bdhqll5wfo` | `cmsdz7qtz000k12bdvzzte9q7` | submitted | `/uploads/documents/..._f05f490d-24b3-4fdc-a92a-b64b7c5ccd90.png` | 2026-08-14 | drivers_license | no | no | no |
| `cmsdzhncu000o12bddtsm69il` | `cmsdz7qtz000k12bdvzzte9q7` | submitted | `/uploads/documents/..._2f9bfb4f-de5e-48db-a323-0792966f5fbf.png` | 2026-08-14 | social_security_card | no | no | no |
| `cmst8qiyi000pk6dnep72qf4e` | `cmsdz7qtz000k12bdvzzte9q7` | submitted | `/uploads/documents/..._e3e17f44-fe95-40fe-a39a-d568bc3c431e.png` | 2026-08-14 | pay_stubs | no | no | no |
| `cmst8i434000lk6dn37k1ullg` | `cmsdz7qtz000k12bdvzzte9q7` | submitted | `/uploads/documents/..._767111c3-adf4-4031-a4a6-fc4f542d0fa2.png` | 2026-08-14 | tax_returns | no | no | no |
| `cmsgva9is0003ucfwyef83d8u` | `cmsgv4fu10001ucfw5ke23iep` | draft | `/uploads/documents/..._bfabc444-393d-4bff-9b79-0ead35792d8b.png` | 2026-08-06 | drivers_license | no | no | no |
| `cmsgvah4g0005ucfwct0e1iiu` | `cmsgv4fu10001ucfw5ke23iep` | draft | `/uploads/documents/..._520c6a8d-db76-42ce-8905-9ed0636daeae.png` | 2026-08-06 | social_security_card | no | no | no |
| `cmsnalgc7002hv550fa729gv3` | `cmsn9u90z002fv5507go8lcto` | draft | `/uploads/documents/..._04dc6822-844e-4770-953a-6c556a672c84.png` | 2026-08-10 | drivers_license | no | no | no |
| `cmsnalgp3002jv550aojm4esy` | `cmsn9u90z002fv5507go8lcto` | draft | `/uploads/documents/..._52ed0aea-c048-46e2-aa36-275d151ff670.png` | 2026-08-10 | social_security_card | no | no | no |
| `cmtkg28th00034o7leexfjdp8` | `cmtkfnuqo00014o7lix0s5mjz` | submitted | `/uploads/documents/..._5387ad47-b40f-4946-9cf0-2bba98acfca1.png` | 2026-09-02 | drivers_license | no | no | no |
| `cmtkg2fvw00054o7lr03xvehn` | `cmtkfnuqo00014o7lix0s5mjz` | submitted | `/uploads/documents/..._dc997fc4-b464-4825-b289-101667ceb06a.png` | 2026-09-02 | social_security_card | no | no | no |

## Git recovery findings
`git log --all --full-history --name-status -- public/uploads/documents` found one reachable commit containing 31 public upload artifacts. Exact filename comparison shows:
- 7 of the 17 affected database records have matching artifacts recoverable from that Git commit.
- 10 of the 17 affected records have no matching artifact in reachable Git history.
- None of the 17 artifacts currently exists elsewhere in the workspace or in `storage/documents`.

The recoverable files must not be restored to `public/uploads/documents`. Because the files are confirmed test/demo artifacts, no Git recovery or private migration is recommended. Git history is evidence of provenance only; it is not a source for production-document restoration.

## Migration/restoration plan (not executed)

Classification:
- A: 7 records have matching blobs in reachable Git history, but none are approved for migration because the source files are confirmed test/demo artifacts.
- B: 0 records, no equivalent private-storage artifact found.
- C: 10 records have no matching artifact in the workspace, private storage, or reachable Git history.
- D: all 17 records require manual business/data-owner review before deletion or retention cleanup. This is an approval classification, not an automatic database action.

For the confirmed test/demo files, no recovery or migration operation is proposed. The public directory remains empty.

For C records, do not fabricate replacements and do not delete the database rows. A data owner must decide whether an authorized re-upload/request is required, whether the record should remain as an unavailable historical record, or whether a separately approved retention process applies.

No schema migration is required. If the data owner approves deletion of confirmed test/demo rows, a controlled, auditable data-cleanup operation would be required; it must not run until approved. If any submitted/non-seed row is retained, it requires an approved restoration or re-upload business process rather than fabricated content.

Rollback would restore each original `Document.fileUrl` value only if the original public artifact has been deliberately restored to a protected legacy quarantine location; otherwise rollback should be logical and restore the prior private key from a migration manifest. The migration must be transactional for database updates and produce an audit manifest without file contents.

Post-migration verification must confirm: private file exists, stored size and MIME metadata match, public URL fetch is unavailable, authenticated owner/staff preview succeeds, cross-applicant and cross-organization preview/download fail, and audit logging records the access decision.

### 7) Previously unprotected server boundaries
Risk: Critical/High
Finding: The focused authorization audit found an unauthenticated workflow trigger, unprotected notification server actions, caller-controlled organization IDs in email/draft routes, an unbound email retry operation, and organization member actions without role checks.
Fix applied: the workflow endpoint now requires `CRON_SECRET`; notification server actions require an authenticated operator; email and draft routes verify organization roles; retries are bound to the authenticated user; and member-management actions require `org_admin`.

### 8) Cross-organization template reads and mutations
Risk: High
Finding: Template operations were not consistently tenant-scoped when addressed by template ID.
Fix applied: notification and message-template queries now permit only the active organization plus explicitly global templates, and template preview/publish/archive/update/delete operations verify organization scope.

## Authorization posture
The application uses server-side authorization at route, server-action, and service boundaries rather than relying on middleware alone. The focused review verified:
- applicant document upload requires ownership of the application;
- document preview/download/access-history uses authenticated access validation with applicant ownership or staff organization isolation;
- document detail/delete binds access to the uploader;
- case-document mutations validate the case/document relationship;
- communication routes derive the actor from the server session and enforce organization scope;
- forged email/draft organization IDs, member-management calls, recipient context calls, and template IDs are now checked at server boundaries;
- platform super-admin access is an explicit role and organization-state exception, not caller metadata.

The existing cross-organization integration test passed. No evidence was found that client-supplied `userId`, `applicantId`, `caseId`, `documentId`, `communicationId`, or `recipientId` can override the authenticated actor in the reviewed production paths. Resource IDs remain inputs by design, but each reviewed sensitive resource path performs an ownership, organization, or relationship check.

## Supabase and Prisma boundary
- `SUPABASE_SERVICE_ROLE_KEY` is read only by server-side actions, seed code, and diagnostic scripts; it is not referenced by client components.
- `env.ts` is now marked `server-only`, preventing accidental client imports of the object that contains server credentials.
- `lib/supabase/client.ts` uses only the public Supabase URL and anon key.
- Prisma imports occur in server-side modules and services; no client component imports Prisma directly.
- Document and notification responses were reviewed for unnecessary raw storage-path exposure; document-facing responses now return secure preview URLs.
- `.env` is ignored and is not tracked. Public uploaded document artifacts were removed from `public/uploads/documents`.

## Document security verification
- New uploads use private Supabase Storage bucket `heloci-documents`, outside the public web root.
- `/api/documents/[id]/preview` requires an authenticated session and calls `validateDocumentAccess` before reading a file.
- Applicant access is bound to the application owner; staff access is organization-bound; platform super-admin access is explicit.
- Substituting another document ID reaches the same authorization check and does not bypass ownership.
- Document metadata returns `/api/documents/[id]/preview`, not a raw filesystem/storage path.
- Filename extension and MIME/size validation remain enforced by the upload route and document configuration.
- Path traversal is rejected by the integrity helper; preview/download/history errors return generic external messages.

## Remediation completed
- Hardened storage path: moved uploads from public web-accessible paths to the private `heloci-documents` Supabase Storage bucket.
- Secure preview route usage: document metadata now resolves through the authenticated preview route.
- Seed hygiene: removed fixed default-password assumptions from repository seed scripts.
- Added regression guard: the auth/session regression test checks that secure preview URLs are returned instead of raw file paths.
- Added traversal regression guard for document integrity verification.
- Removed embedded Supabase credentials and password literals from legacy diagnostic scripts and historical seed/auth documentation.
- Disabled the test composer route in production builds.

## Environment-variable classification
The following classification is based on current code references. Secret values are intentionally omitted.

| Variable | Read locations | Classification | Production requirement |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public/server Supabase clients, proxy, seed and diagnostics | Public client-safe project URL | Required in Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public/server Supabase clients, proxy, seed and diagnostics | Public client-safe anon key | Required in Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | server staff action, seed, diagnostics | Server-only secret | Required only if those server capabilities run; never client-exposed |
| `DEFAULT_ADMIN_PASSWORD` | seed and admin diagnostic/test scripts | Development/seed/test credential input | Do not add to Vercel unless an approved production seed operation explicitly needs it |
| `STAFF_DEFAULT_PASSWORD` | seed script | Development/seed credential input | Not required for normal Vercel runtime |
| `REVIEWER_DEFAULT_PASSWORD` | seed script | Development/seed credential input | Not required for normal Vercel runtime |
| `TEXAS_ADMIN_DEFAULT_PASSWORD` | seed script | Development/seed credential input | Not required for normal Vercel runtime |
| `TEXAS_REVIEWER_DEFAULT_PASSWORD` | seed script | Development/seed credential input | Not required for normal Vercel runtime |
| `CALIFORNIA_ADMIN_DEFAULT_PASSWORD` | seed script | Development/seed credential input | Not required for normal Vercel runtime |
| `APPLICANT_DEFAULT_PASSWORD` | seed script | Development/seed credential input | Not required for normal Vercel runtime |
| `CRON_SECRET` | workflow API route | Server-only machine-auth secret | Required if the workflow route is enabled in production |
| `DATABASE_URL` | Prisma client | Server-only database credential | Required in Vercel |
| `RESEND_API_KEY` | email provider and diagnostics | Server-only provider secret | Required if production email delivery is enabled; otherwise optional |
| `OPENAI_API_KEY` | AI assistant and embeddings | Server-only provider secret | Required only if production AI features are enabled; otherwise optional |
| `TELEGRAM_BOT_TOKEN` | notification configuration and alert service | Server-only provider secret | Required only if Telegram delivery is enabled; otherwise optional |
| `TELEGRAM_CHAT_ID` | notification configuration | Server-only provider configuration | Required only if Telegram delivery is enabled; otherwise optional |
| `CLOUDINARY_URL` | shared env contract only; no production consumer found in reviewed application paths | Server-only provider credential if later enabled | Optional; do not configure until Cloudinary storage is actually enabled |

The default-password variables are not read by production routes or client components. They are seed/diagnostic inputs only and should not be configured in Vercel Production for normal runtime. `SUPABASE_SERVICE_ROLE_KEY` is not client-safe; it is required only for server features or operational scripts that explicitly use it. The two `NEXT_PUBLIC_SUPABASE_*` values are intentionally public client configuration and are required by the browser/server Supabase clients.

## Remaining deployment blockers
The following must still be resolved or explicitly reviewed before deployment approval:
1. Existing database rows that reference the removed public upload artifacts require explicit retention/deletion approval; no records were changed automatically.
2. The actual Vercel and Supabase environment contract must be configured and reviewed outside this gate; no deployment configuration was changed.
3. `CRON_SECRET` must be configured wherever the workflow route is enabled.
4. The 17-row document-data disposition remains unresolved; submitted and non-seed-associated records must not be treated as disposable without approval.
5. Confirm the private Supabase Storage bucket and Vercel production environment contract during deployment review.

## Repository validation debt
The required full TypeScript command exits nonzero with 244 diagnostic lines. Classification of the complete captured list:
- A: 0 remaining production application errors after fixing `lib/notifications/runtime/audience-resolver.ts`.
- B: 0 remaining production declaration/type errors.
- C: test-only errors in `tests/5h2-notification-routing-trace.test.ts`, `tests/emit-registration-trace.test.ts`, `tests/k1-provider-execution-certification.test.ts`, `tests/k2-communication-event-certification.test.ts`, `tests/k2-core-events-certification.test.ts`, `tests/k2-review-runtime.test.ts`, `tests/k3-root-cause-analysis.test.ts`, and `tests/phase-b-subscriber-coverage.test.ts`.
- D: communication/notification test infrastructure errors in `lib/communications/contracts/__tests__/CommunicationRequest.test.ts`, `lib/communications/contracts/__tests__/Serializer.test.ts`, `lib/communications/runtime/__tests__/AudienceResolver.test.ts`, `lib/matching/engine.test.ts`, `lib/notifications/notification.service.test.ts`, `lib/notifications/runtime/audience-resolver.test.ts`, `lib/notifications/runtime/runtime-orchestrator.test.ts`, and `lib/notifications/runtime/runtime-subscriber.test.ts`.
- E: 0 remaining unrelated tooling/development errors identified in the captured list.

These errors are not being changed merely to make the repository-wide command green.

## Required environment variables (names only)
Do not include secret values in this document.

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DEFAULT_ADMIN_PASSWORD
- STAFF_DEFAULT_PASSWORD
- REVIEWER_DEFAULT_PASSWORD
- TEXAS_ADMIN_DEFAULT_PASSWORD
- TEXAS_REVIEWER_DEFAULT_PASSWORD
- CALIFORNIA_ADMIN_DEFAULT_PASSWORD
- APPLICANT_DEFAULT_PASSWORD

## Vercel deployment contract
Production environment variables on Vercel must be configured using these names only. The values must be managed in Vercel itself, not committed in source files or checked into the repo.

## Verification evidence
- `node scripts/run-tests.cjs tests/auth-session.test.ts`: 3 passed, 0 failed.
- `node scripts/run-tests.cjs tests/c1-integration-flow.test.ts`: 1 passed, 0 failed.
- Focused ESLint over all changed TypeScript/TSX files: passed with no output/errors.
- `git diff --check`: passed; only pre-existing line-ending warnings were reported for unrelated files.
- Secret literal scan for the known leaked password/key patterns: no matches remain in `prisma`, `scripts`, `actions`, `app`, `lib`, or `docs`.
- `.env` tracking check: ignored and not tracked.
- Public upload cleanup check: `public/uploads/documents` is empty on disk; its prior tracked artifacts are deleted in the working tree.
- `npx tsc --noEmit --pretty false`: failed due to unrelated existing errors in communication/notification tests and type declarations. No matching errors were found in the changed security files during the focused output check.
- Complete TypeScript output was reviewed from the final run: 244 diagnostic lines; after the runtime narrowing fix, all remaining diagnostics are categories C/D above.
- Template authorization tests: no dedicated pre-existing template authorization test exists; caller trace plus focused TypeScript/ESLint validation covered every listed helper. No database test fixture was modified.
- Document database inspection: 17/17 `Document` rows reference the old public pattern; 5/5 `DocumentRequest` rows have no file URL. No records were modified.
- Test/demo classification inspection: 6 associated applications; 9 submitted, 4 draft, 4 rejected; 2/17 rows match known seed accounts and 15/17 do not. Classification remains manual review, not disposable by default.
- Requested strict classification: A = 0, B = 17; no cleanup SQL proposed or executed.
- Storage architecture inspection: private Supabase Storage bucket `heloci-documents`; no document persistence uses local filesystem or public static storage.
- Ignore-rule inspection: `public/uploads/documents/` and generated `prisma/seed.js` are now listed in `.gitignore`; previously tracked files remain a separate Git index concern and were not force-removed here.
- Supabase bucket inspection: `heloci-documents` exists, is private, and has a 12 MB file-size limit.
- Supabase Storage lifecycle smoke test: upload, download, byte comparison, and remove passed using an approved document MIME type; no application database record was used.
- Production build: `pnpm exec next build` passed after adding the registration Suspense boundary; 121 static pages generated successfully.
- Test-composer production behavior: `/test-composer` is a server route that calls `notFound()` when `NODE_ENV` is production; the interactive demo is isolated in a client component.
- Remote image configuration: `next.config.mjs` now has no remote image patterns because all reviewed `next/image` sources are local assets.
- Dependency audit remediation: `pnpm audit --prod` now reports no known vulnerabilities after upgrading Next.js and `eslint-config-next` to `16.2.11` and overriding patched transitive `sharp`, `postcss`, `nanoid`, and `browserslist` versions.

## Final gate status
Status: HOLD for review.

The verified production-security fixes for document exposure, credential leakage, focused IDOR boundaries, and durable private storage have been applied. The public test/demo files must remain absent, but the 17 database rows are not proven disposable and require explicit data-owner disposition. The repository is not yet a clean deployment-review candidate because that data decision, dependency advisories, Vercel environment review, and repository validation debt remain. No deployment action was taken.
