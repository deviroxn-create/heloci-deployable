HELOCI PROJECT MASTER PLAN
Version 2.0 – Canonical Architecture & Development Roadmap
1. Project Vision

Heloci is not a real estate listing website.

It is not just a housing application website.

Heloci is being built as a Housing Opportunity Platform (HOP).

The platform connects housing seekers with housing opportunities from multiple providers while automatically determining eligibility, recommending the best programs, managing applications, and communicating with applicants throughout the process.

The long-term goal is to become the central platform where government agencies, NGOs, nonprofits, private homeowners, developers, and housing organizations can publish housing assistance programs and applicants can find the best opportunities through an intelligent eligibility system.

2. Types of organizations Heloci supports

Heloci must support multiple organization types.

Examples:

Government Agencies
NGOs
Nonprofits
Private Homeowners
Property Developers
Housing Cooperatives
Faith-Based Organizations
Community Housing Programs
Employer Housing Programs

Every organization has its own:

Housing Programs
Eligibility Rules
Application Workflow
Staff
Communication Settings
Templates
Documents
Reports
3. Housing Programs

A Housing Program is the core business object.

Examples:

Government First-Time Home Buyer

Emergency Housing Assistance

Affordable Rental Assistance

Rent-to-Own Program

Teacher Housing Initiative

Healthcare Worker Housing

Veteran Housing

Salary Earner Housing

Mortgage Assistance

Home Repair Assistance

Youth Housing

Senior Housing

Family Housing

Each program has:

Eligibility Rules
Questions
Required Documents
Workflow
Communication Templates
Application Periods
Target Audience
Housing Goals
4. Applicant Journey

Every applicant follows a structured journey.

Landing Page

↓

Create Account

↓

Email Verification

↓

Profile Completion

↓

Check Eligibility

↓

Dynamic Questions

↓

AI Guidance

↓

Program Matching

↓

Recommended Programs

↓

Submit Application

↓

Upload Documents

↓

Staff Review

↓

Decision

↓

Move-In / Completion

↓

Follow-up

The user should never feel lost.

Every step should explain what happens next.

5. Communication Center (Current Priority)

This is the system we are currently improving.

Its purpose is to ensure every important event on the platform generates the appropriate communication.

Current channels:

Email
Telegram
Internal Notifications

Future channels:

WhatsApp
SMS
Push Notifications

Responsibilities:

Template Management
Notification Logging
Retry Engine
Communication Timeline
User Preferences
Admin Dashboard
Delivery Analytics

Every notification must pass through one entry point:

notificationService.notify(eventName, payload)

No part of the application should send email directly.

6. Dynamic Eligibility Engine (Next Major Feature)

After the Communication Center is stable, we will build a reusable eligibility engine.

It must support:

Multi-page forms
Conditional questions
Scoring
Pass/Fail
Manual review
AI assistance
Program matching

Nothing should be hardcoded.

Organizations must create eligibility rules without developers.

7. Dynamic Form Engine

Instead of creating pages manually:

page1.tsx

page2.tsx

page3.tsx

The database should drive everything.

Questions

↓

Pages

↓

Conditions

↓

Validation

↓

Navigation

↓

Saved Answers

↓

Resume Later

One rendering engine.

Unlimited forms.

8. AI Layer

Heloci is designed to be AI-assisted, not AI-controlled.

AI helps users and staff make better decisions.

AI responsibilities include:

Applicant Assistant

Explain housing programs
Answer questions
Recommend programs
Explain eligibility

Staff Assistant

Summarize applications
Suggest missing documents
Highlight risks
Recommend next actions

Admin Assistant

Generate reports
Detect bottlenecks
Analyze communication performance
Optimize workflows

The AI should never be the final decision maker. Human staff remain responsible for approvals and denials.

9. Communication Timeline

Every interaction should be recorded.

Example:

User Registered

↓

Eligibility Started

↓

Eligibility Completed

↓

AI Recommendation Generated

↓

Application Submitted

↓

Document Uploaded

↓

Email Sent

↓

Staff Reviewed

↓

Application Approved

This gives both staff and applicants a complete history.

10. Workflow Engine

Eventually, Heloci will support configurable workflows.

Example:

Application Submitted

↓

Notify Applicant

↓

Assign Staff Member

↓

Request Documents

↓

Eligibility Verification

↓

Manager Approval

↓

Final Decision

↓

Move-In Process

Organizations should configure workflows without developers.

11. Document Management

Every program can define required documents.

Examples:

Government ID
Proof of Income
Tax Return
Employment Letter
Bank Statement
Disability Certificate
Veteran Status
Utility Bill

The system should:

Validate uploads
Track status
Request missing documents
Notify applicants automatically
12. Reporting

The platform should provide analytics such as:

Applications

Approvals

Rejections

Eligibility Success Rate

Communication Delivery Rate

Response Times

Housing Program Performance

Organization Performance

Staff Productivity

13. Security

Security is critical.

Requirements:

Role-Based Access Control (RBAC)
Audit Logs
Encrypted secrets
Secure document access
Rate limiting
Session management
Multi-tenant isolation

Every action must be auditable.

14. Development Principles

From this point forward, every developer and AI assistant must follow these rules:

Rule 1

Never hardcode business logic that should belong in the database.

Rule 2

Reuse existing services instead of creating duplicates.

Rule 3

Every feature must support multi-tenancy.

Rule 4

Every important action must emit an event.

Rule 5

Every event goes through the Communication Center.

Rule 6

Never bypass notificationService.notify().

Rule 7

Every database change must use Prisma migrations.

Rule 8

Maintain backward compatibility whenever possible.

Rule 9

Prefer configuration over custom code.

Rule 10

Document every architectural decision.

15. Current Project Status
✅ Completed
Authentication
Basic user management
Property management
Application management
Prisma-first architecture
Communication Center foundation
Notification logging
Email integration
Telegram integration
Admin notification settings
Admin communication dashboard
Notification templates
Communication timeline foundation
Domain Model V2 design
Multi-tenant planning
🚧 Current Milestone

Communication Center V2

Tasks:

Complete database-backed configuration
Remove duplicate template systems
Finish retry engine
Complete internal notification center
Finish communication timeline UI
Improve provider reliability
Production testing
⏳ Next Milestone

Dynamic Eligibility Engine

⏳ After That

Dynamic Form Engine

⏳ Then

Housing Matching Engine

⏳ Then

AI Assistant

⏳ Then

Workflow Engine

⏳ Then

Production Deployment

16. What every AI assistant should understand

Do not treat Heloci as a CRUD application.

This is a configurable, multi-tenant Housing Opportunity Platform where organizations create housing programs, define eligibility, manage applications, communicate with applicants, and use AI to improve—not replace—human decision-making.

Before implementing any feature:

Check whether the capability already exists.
Extend existing services instead of creating new ones.
Preserve the current architecture.
Use Prisma as the source of truth for application data.
Route all communications through the Communication Center.
Ensure new features are reusable across organizations and programs.
Build with scalability and maintainability in mind.   

Before implementing any feature:

1. Search the repository for an existing implementation.
2. Extend existing services instead of creating duplicates.
3. Preserve notificationService.notify() as the single communication entry point.
4. Keep Prisma as the canonical application data model.
5. Never hardcode housing programs, eligibility rules, workflows, or communication templates.
6. Build reusable engines, not one-off solutions.
7. Respect multi-tenancy in every new model and query.
8. Use Prisma migrations for all schema changes.
9. Keep backward compatibility unless an approved migration plan exists.
10. Update documentation when architecture changes.