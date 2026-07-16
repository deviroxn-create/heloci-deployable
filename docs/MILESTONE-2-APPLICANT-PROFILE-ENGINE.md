# Milestone 2: Applicant Profile Engine

## Goal
Create a reusable applicant profile engine that works across housing programs, supports progress saving, and preserves the current authentication and application flow.

## Scope
- Introduce a structured applicant profile domain model
- Support personal, household, income, education, housing, preferences, and document data
- Track profile completeness and progress over time
- Save and resume profile progress
- Reuse the profile for multiple program applications
- Route profile-related notifications through notificationService.notify()

## Current implementation status
- Structured profile service and validation schema added
- API endpoint created at /api/applicant-profile
- Existing profile page now submits to the structured profile API and displays progress
- Notification routing uses the shared notification service entry point

## Next steps
1. Add Prisma persistence for applicant profiles instead of relying only on the current Supabase-backed profile table.
2. Expand the UI into logical sections that can be completed gradually.
3. Add document upload integration and profile completeness rules.
4. Add end-to-end tests for save/resume and notification behavior.
