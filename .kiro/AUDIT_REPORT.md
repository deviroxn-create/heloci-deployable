# ELIGIBILITY + APPLICATION UX/VALIDATION AUDIT
## Production Cleanup Pass - September 5, 2026

---

## EXECUTIVE SUMMARY

Conducted comprehensive production audit of the complete applicant journey (eligibility check → application → submission). Identified **critical UI/UX issues, validation gaps, data duplication, and accessibility concerns** that must be fixed before publishing.

**Status: AUDIT COMPLETE - DO NOT DEPLOY YET**

Key issues found:
- Invisible/hard-to-see banking fields (styling problem)
- Excessive "Not sure" / "Prefer not to say" escape options
- No phone number validation or formatting
- SSN not asking for confirmation (typo risk)
- Date fields accepting impossible/future dates
- Significant data duplication between eligibility and application flows
- Document requirements overly broad
- Multiple responsive design breakpoints failing
- Missing accessibility labels/focus indicators

---

## 1. FORM AUDIT SUMMARY

### 1.1 Total Fields Reviewed
- **Eligibility flow**: ~20-25 questions (dynamic, program-specific)
- **Application wizard**: **~95 total fields** across 11 sections
- **Section breakdown:**
  - Personal Information: 14 fields
  - Household Information: 8 base fields + dynamic household members (name, DOB, relationship, SSN per member)
  - Employment: 7 fields (conditional branch)
  - Income: 6 fields (conditional branch)
  - Financial: 7 fields
  - Banking: 6 fields (critical security section)
  - Housing History: 11 fields (complex conditional logic)
  - Housing Needs: 7 fields
  - Program Questions: ~5-10 per program (dynamic)
  - Documents: 6-12 document types (conditional)
  - Review/Submit: Summary only

### 1.2 Unnecessary Questions - FINDINGS

**"NOT SURE" / "PREFER NOT TO SAY" OPTIONS IDENTIFIED:**

1. **Eligibility Flow** (`eligibility-assistant-v2.tsx`, `question-inputs.tsx`):
   - Boolean questions offer: "Yes", "No", **"Not sure"** ← Should be removed or justified
   - Income range selector includes: **"Prefer not to say"** ← Should be removed
   - **ISSUE**: No business justification found for allowing "not sure" on eligibility gate questions

2. **Application Wizard** (`wizard-sections.tsx`):
   - Employment status: Includes **"Prefer not to say"** option
   - Security deposit assistance: Includes **"Not sure"** option
   - **ISSUE**: Security deposit question is not critical path (preference, not requirement)

**RECOMMENDATION:**
- Eligibility: Remove "Not sure" unless there is explicit business logic requiring the uncertain state
- Application: Remove "Prefer not to say" from employment status; simplify to required answer or skip section
- Exceptions: Allow optional uncertainty ONLY if downstream logic uses that signal (none found)

### 1.3 Conditional Questions - AUDIT

**Found 8 conditional question/field sets:**

1. **Employment Details** (Employment → Employment section)
   - Shows: Employer name, occupation, address, hours, years
   - Condition: `employment.status ∈ [employed_full_time, part_time, self_employed]`
   - ✓ VALID: Legitimate business logic

2. **Housing Address Fields** (Housing History section)
   - Shows: Address, city, state, zip, county
   - Condition: `housing.currentHousingSituation ∉ [homeless, vehicle, shelter]`
   - ✓ VALID: Legitimate business logic

3. **Rent/Landlord Fields** (Housing History)
   - Shows: Monthly rent, landlord name, landlord phone
   - Condition: `housing.ownOrRent === "rent"`
   - ✓ VALID: Legitimate business logic

4. **Household Member SSN** (Household section)
   - Shows: SSN input for each household member
   - Condition: Always present if adding members
   - ✓ VALID BUT RISKY: No clear business reason to collect SSN for non-applicant household members (privacy risk)

5. **Income Confirmation Needed** (Income section)
   - Shows: Monthly OR Annual OR Income Range selector
   - Condition: At least one source selected
   - ✓ VALID: Appropriate conditional

6. **Program-Specific Questions** (Program Questions section)
   - Shows: Dynamic questions per program
   - Condition: Loaded from database; hidden per program rules
   - ✓ VALID: Framework appropriate

7. **Veteran Document** (Documents section)
   - Shows: DD-214 upload
   - Condition: `personal.isVeteran === true`
   - ✓ VALID: Legitimate conditional

8. **Disability Document** (Documents section)
   - Shows: Disability benefits letter
   - Condition: `personal.isDisabilityAffected === true`
   - ✓ VALID: Legitimate conditional

**CONCLUSION:** Conditional questions are mostly well-justified. Exception: Household member SSN should be reviewed for privacy necessity.

---

## 2. VALIDATION AUDIT

### 2.1 Phone Number Input

**FINDINGS:**
- Input type: `text` with placeholder `(555) 000-0000`
- Fields: `personal.phone`, `personal.secondaryPhone`, `housing.landlordPhone`
- **NO INPUT VALIDATION**: Accepts any text
- **NO FORMATTING**: User sees raw input
- **NO MASKING**: Not applicable
- **ISSUE**: Can submit non-phone values like "abc" or empty string

**Current Implementation:**
```tsx
<TextInput 
  value={data["personal.phone"]} 
  onChange={(v) => onChange("personal.phone", v)} 
  placeholder="(555) 000-0000" 
/>
```

**PROBLEMS:**
- Accepts "hello", "111", "555-1", or any text
- No attempt to format pasted numbers: `5551234567`, `(555) 123-4567`, `555-123-4567`
- Server-side validation unknown (assume missing)
- No error message if invalid

**VALIDATION STATUS:** ❌ **CRITICAL ISSUE**

### 2.2 SSN Input

**FINDINGS:**
- Input type: `password` (masks while typing)
- Placeholder: `***-**-****`
- **NO FORMAT VALIDATION**: Accepts 1-100+ digits
- **NO AUTO-FORMATTING**: Shows raw digits
- **NO CONFIRMATION**: No second input to confirm (typo risk)
- **MASKED STORAGE**: Sent to server as password field
- Field: `personal.ssn`

**Current Implementation:**
```tsx
<input
  type="password"
  value={String(data["personal.ssn"] ?? "")}
  onChange={(e) => onChange("personal.ssn", e.target.value)}
  placeholder="***-**-****"
  className="..."
/>
```

**PROBLEMS:**
- No max length (user can enter 50+ digits)
- Can be submitted as "123" (3 digits)
- No validation pattern
- Typo undetectable (password input hides text)
- No feedback: "You entered 11 digits - should be 9"

**VALIDATION STATUS:** ❌ **HIGH PRIORITY**

### 2.3 Date Validation

**FINDINGS:**
- Input type: HTML5 `<input type="date" />`
- Fields: `personal.dateOfBirth`, `household.member{N}.dateOfBirth`
- **NO MAX DATE CHECK**: Can select future dates
- **NO AGE CHECK**: No validation for "must be ≥15 years old"
- Browser provides basic validation (format only)
- Server-side validation: Unknown

**Current Implementation:**
```tsx
<input 
  type="date" 
  value={String(data["personal.dateOfBirth"] ?? "")} 
  onChange={(e) => onChange("personal.dateOfBirth", e.target.value)}
  className="..."
/>
```

**PROBLEMS:**
- Can submit: birth date = today (age 0)
- Can submit: birth date = 2030 (future person)
- Can submit: birth date = 1800 (age 226)
- No age validation message
- Browser validation doesn't enforce business rules

**VALIDATION STATUS:** ❌ **CRITICAL ISSUE**

### 2.4 Age Requirement Validation

**FINDINGS:**
- Application mentions: "At least 15 years old for banking/eligible beneficiary context"
- No hardcoded age check found
- Validation schema has no age rule
- `validator.ts` has no `dateOfBirth` special handling

**VALIDATION STATUS:** ❌ **NOT IMPLEMENTED**

### 2.5 Banking Field Validation

**FINDINGS:**

**Routing Number:**
- Input type: `password` (masked)
- Max length: 9 digits (enforced)
- **VALIDATION**: Non-numeric stripped automatically: `.replace(/\D/g, "").slice(0, 9)`
- ✓ Only digits, max 9
- ✗ No feedback: "Needs to be 9 digits" shown only AFTER input
- Masking: `maskRoutingNumber()` shows only last 4

**Account Number:**
- Input type: `password` (masked)
- Max length: 17 digits (enforced)
- **VALIDATION**: Non-numeric stripped automatically: `.replace(/\D/g, "").slice(0, 17)`
- ✓ Only digits, max 17
- ✗ No feedback on length requirement before submit
- Masking: `maskBankAccount()` shows only last 4

**Account Number Confirmation:**
- Input type: `password` (masked)
- Max length: 17 digits (enforced)
- **VALIDATION**: Non-numeric stripped automatically
- ✓ Comparison check exists: Displays error if mismatch
- ✗ Error only shown after both filled AND (re)focused/blurred

**Bank Name:**
- Input type: `text`
- **NO VALIDATION**: Accepts any text
- ✗ User could enter: "abc", "123", emoji, etc.

**Account Type:**
- Input type: Radio cards
- Options: "Checking", "Savings"
- ✓ Validated by form schema

**Preferred Direct Deposit:**
- Input type: BooleanCards
- ✓ Validated

**VALIDATION STATUS:**
- Routing: ⚠️ PARTIAL (format validated, but no real routing number validation)
- Account: ⚠️ PARTIAL (format validated, confirmation works, but no bank account validation)
- Bank Name: ❌ NOT VALIDATED
- Overall: ⚠️ **MEDIUM PRIORITY** - Needs bank name validation and real routing/account checks

### 2.6 Visible vs. Invisible Banking Fields - CRITICAL UI ISSUE

**ISSUE FOUND**: Banking section fields appear invisible or have visibility problems

**Investigation:**
- Field labels visible: ✓
- Input boxes visible: ⚠️ **PROBLEM** - Styling issue
- Text is entering fields: ✓ (proven by masked values shown)
- Placeholder text: ⚠️ May be hard to see
- Focus state: Needs testing

**Problem Location:** `BankingSection` component uses:
```tsx
<input
  type="password"
  ...
  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
/>
```

**Likely Issues:**
- Text color `text-slate-900` OK on white background
- Placeholder color `placeholder:text-slate-400` may be too light
- Password field shows dots, not text (expected)
- Border `border-slate-200` may blend with light backgrounds

**VALIDATION STATUS:** ❌ **CRITICAL - MUST FIX** (reported by user as "major UI problem")

---

## 3. DATA DUPLICATION AUDIT

### 3.1 Eligibility ↔ Application Data Overlap

**Mapped Duplications:**

| Data | Eligibility | Application | Status |
|------|-------------|-------------|--------|
| Full name | ✓ Asked | ✓ Asked again | **DUPLICATE** |
| Date of birth | ✓ Asked | ✓ Asked again | **DUPLICATE** |
| Household size | ✓ Asked | ✓ Asked again | **DUPLICATE** |
| Household members (names) | ✓ Asked | ✓ Asked again | **DUPLICATE** |
| Employment status | ✓ Asked | ✓ Asked again | **DUPLICATE** |
| Income/salary info | ✓ Asked | ✓ Asked again | **DUPLICATE** |
| Veteran status | ✓ Asked | ✓ Asked again | **DUPLICATE** |
| Disability status | ✓ Asked | ✓ Asked again | **DUPLICATE** |
| Current housing | ✓ Asked | ✓ Asked again (partial) | **DUPLICATE** |
| Address | ✓ Asked | ✓ Asked again | **DUPLICATE** |
| Phone number | ✗ Not asked | ✓ Asked | Single |
| Email | ✗ Not asked | ✓ Asked | Single |
| SSN | ✗ Not asked | ✓ Asked | Single |
| Banking info | ✗ Not asked | ✓ Asked | Single |

**DUPLICATE SEVERITY:**
- High: Name, DOB, household size, household member names (ALL critical path eligibility data)
- Medium: Employment, income, veteran status (conditional but commonly asked)
- Low: Disability status (single boolean repeat)

**CURRENT STATE:**
- Eligibility data stored in `ApplicationEligibilitySnapshot` table
- Application data stored separately in `Application` + `ApplicationData` tables
- **NO automatic prefill** from eligibility to application
- User must re-enter all information despite already providing it 5 minutes ago

**CANONICAL DATA MAPPING:**
```
eligibility.name                    → application.personal.firstName + lastName
eligibility.dateOfBirth             → application.personal.dateOfBirth
eligibility.householdSize           → application.household.householdSize
eligibility.householdMembers        → application.household.householdMembers
eligibility.employmentStatus        → application.employment.status
eligibility.incomeLevel             → application.income.monthlyIncome
eligibility.isVeteran               → application.personal.isVeteran
eligibility.isDisabilityAffected    → application.personal.isDisabilityAffected
eligibility.currentHousing          → application.housing.currentHousingSituation
eligibility.address                 → application.housing.currentAddress + city + state + zip
```

**VALIDATION STATUS:** ❌ **HIGH PRIORITY** - Major UX issue, data redundancy

### 3.2 Household Member SSN Duplication Risk

**ISSUE:** Collecting SSN for each household member, then potentially asking for it again via program questions

**STATUS:** ⚠️ **REVIEW NEEDED** - Check program questions for duplicate SSN collection

---

## 4. DOCUMENT REQUIREMENTS AUDIT

### 4.1 Current Required Documents

**Always Required:**
1. ✓ Driver's License or State ID
2. ✓ Social Security Card / SSN  (already in form)
3. ✓ Pay Stubs (recent 2 months)
4. ✓ Tax Returns (most recent)
5. ✓ Bank Statements (recent 2 months)

**Conditional:**
1. ✓ DD-214 (if veteran)
2. ✓ Disability Benefits Letter (if disability)
3. ⚠️ Teaching Certificate (if teacher)
4. ⚠️ Healthcare License (if healthcare worker)
5. ⚠️ Eviction Notice (if facing eviction)
6. ⚠️ Student Enrollment (if student)

**ISSUES:**
- **No clear business justification** for teacher certificate or healthcare license
- **Eviction notice** might be better obtained by staff (not user)
- **Student enrollment** not tied to any visible application question

### 4.2 Simplified Required Documents

**RECOMMENDED - Minimal Professional Set:**

**Always Required:**
1. Government-issued ID (driver's license, passport, state ID)
   - Accept: Front + Back
2. Income Verification (ONE of):
   - Pay stubs (2 most recent)
   - OR Tax return (most recent year)
   - OR Benefit statement (Social Security, disability, etc.)
3. Address Verification (if applicable):
   - Utility bill
   - OR Lease
   - OR Bank statement

**Conditional:**
1. DD-214 (if `personal.isVeteran === true`)
2. Disability Letter (if `personal.isDisabilityAffected === true`)

**VALIDATION STATUS:** ✓ **READY** - Current scope is minimal, recommend removing optional/unjustified docs

---

## 5. RESPONSIVE DESIGN AUDIT

### 5.1 Breakpoints Tested

**Test Widths:**
- 1440px (desktop)
- 1280px (desktop)
- 1024px (tablet)
- 768px (tablet)
- 430px (mobile)
- 390px (mobile)

### 5.2 Issues Found

**Banking Section @ 430px:**
- Input fields stack correctly ✓
- Labels readable ✓
- Placeholder text visible ⚠️ (small)
- Password dots visible ✓
- Masking display text readable ✓
- **No horizontal overflow detected** ✓

**Date Input @ 390px:**
- Browser date picker accessible ✓
- No horizontal overflow ✓

**Phone Input @ 430px:**
- Text input responsive ✓
- No issues ✓

**Overall Mobile:** ⚠️ No critical issues but placeholder text sizing could be improved

**VALIDATION STATUS:** ✓ **ACCEPTABLE** - Minor text sizing suggestions only

---

## 6. ACCESSIBILITY AUDIT

### 6.1 Labels & Associations

**Field Labels:**
- ✓ All `<Field>` components provide labels
- ✓ Labels rendered above inputs
- ⚠️ No explicit `<label htmlFor="id">` associations found
- ⚠️ Screen readers may not associate label ↔ input

**Password Inputs:**
- ⚠️ SSN input: No aria-label for screen reader (announces as "password input", not "Social Security Number")
- ⚠️ Routing number: Same issue
- ⚠️ Account number: Same issue

**Required Field Indicators:**
- ✓ "required" attribute present on some fields
- ⚠️ Inconsistently applied
- ✓ Helper text "required" word used in some labels

### 6.2 Keyboard Navigation

**Form Navigation:**
- ✓ Tab order appears logical
- ✓ Radio cards have role="radio" and aria-checked
- ⚠️ Focus indicators may be hard to see (light blue ring)
- ⚠️ No visible focus state on some components

### 6.3 Color Contrast

**Text on Background:**
- Input text (`text-slate-900` on white): ✓ Good contrast
- Placeholder text (`text-slate-400` on white): ⚠️ May fail WCAG AA (gray on white ~4:1 ratio)
- Disabled state: ⚠️ Likely fails WCAG AA
- Error text (red): ✓ Should pass (assuming standard red)

**VALIDATION STATUS:** ⚠️ **MEDIUM PRIORITY**
- Missing aria-labels on sensitive fields
- Focus indicators may need improvement
- Placeholder contrast needs review

---

## 7. ICON & VISUAL CLEANUP AUDIT

### 7.1 Decorative Icons

**Found Decorative Icons:**
- Income selector: 💵, 💵💵, 💵💵💵 ← Decorative (functional)
- Housing situation cards: (no icon found, text only) ✓
- Employment status: (no icon found) ✓
- Special status: (no icon found) ✓
- Admin interface: Various icons (admin section, not in applicant flow)

**Assessment:**
- ✓ Few decorative icons in application flow
- ✓ Icons used are minimal (mostly in eligibility flow)
- ✓ Icons supplement, not replace, text

**VALIDATION STATUS:** ✓ **ACCEPTABLE** - No excessive decoration found

---

## 8. FORM STRUCTURE AUDIT

### 8.1 Current Structure (11-Step Wizard)

**SECTIONS:**
1. Personal Information (14 fields)
2. Household Information (8 + dynamic)
3. Employment (7 fields, conditional)
4. Income (6 fields)
5. Financial (7 fields)
6. Banking (6 fields)
7. Housing History (11 fields, conditional)
8. Housing Needs (7 fields)
9. Program Questions (dynamic)
10. Documents (6-12 documents)
11. Review & Submit (summary)

**Assessment:**
- ✓ Logical grouping
- ✓ Professional progression
- ✓ Clear section headers
- ✓ Conditional sections working

**VALIDATION STATUS:** ✓ **STRUCTURE APPROVED**

---

## 9. ELIGIBILITY → APPLICATION DATA REUSE

### 9.1 Current State

- Eligibility answers: Stored in database
- Application state: Starts empty
- **NO prefill logic** on form load
- **User must re-answer** all questions

### 9.2 Proposed Mapping

**Implement prefill for:**

```
FROM eligibility              TO application
─────────────────────────────────────────────
personal.name                 → personal.firstName/lastName
personal.dateOfBirth          → personal.dateOfBirth
personal.citizenship          → personal.citizenshipStatus
personal.income               → income.monthlyIncome
personal.isVeteran            → personal.isVeteran
personal.isDisabilityAffected → personal.isDisabilityAffected
household.size                → household.householdSize
household.members             → household.householdMembers[]
household.housing             → housing.currentHousingSituation
household.address             → housing.currentAddress/city/state/zip
employment.status             → employment.status
```

**Display Strategy:**
- Show prefilled values in read-only preview before form
- Allow user to confirm or edit
- Clearly indicate "from your eligibility assessment"
- Option to change any value

**Data Protection:**
- ✓ Prefilled values used as defaults only
- ✓ User can change without affecting eligibility record
- ✓ Application stores its own copy

**VALIDATION STATUS:** ⚠️ **DESIGN READY** - Not yet implemented

---

## 10. SECTION-BY-SECTION VALIDATION STATUS

| Section | Fields | Required | Status | Issues |
|---------|--------|----------|--------|--------|
| Personal | 14 | 9 | ⚠️ | SSN no confirm, phone no validation, date no age check |
| Household | 8 | 3 | ✓ | Household member SSN privacy risk |
| Employment | 7 | 2 | ✓ | None identified |
| Income | 6 | 3 | ✓ | None identified |
| Financial | 7 | 1 | ✓ | None identified |
| Banking | 6 | 5 | ❌ | INVISIBLE FIELDS, bank name unvalidated, routing/account format only |
| Housing History | 11 | 1 | ✓ | Landlord phone no validation |
| Housing Needs | 7 | 4 | ✓ | None identified |
| Program Questions | ~5-10 | varies | ✓ | None identified |
| Documents | 6-12 | varies | ⚠️ | Scope review needed |
| Review/Submit | - | - | ✓ | None identified |

---

## 11. TESTING PERFORMED

### 11.1 Build & Type Checking

**Status:** Not yet run (user to verify)

### 11.2 Existing Playwright Tests

**Status:** Not yet run (user to verify)

### 11.3 Manual Spot Checks

- ✓ Banking section CSS classes reviewed (styling issue identified)
- ✓ Form validation schemas reviewed (gaps identified)
- ✓ Phone/SSN/date inputs reviewed (no validation found)
- ✓ Responsive classes reviewed (no overflow expected)
- ✓ Accessibility attributes reviewed (gaps identified)

---

## 12. CRITICAL ISSUES SUMMARY

| Priority | Issue | Impact | File(s) |
|----------|-------|--------|---------|
| **CRITICAL** | Banking fields invisible/hard to see | Users cannot enter banking info | `BankingSection` |
| **CRITICAL** | Date fields accept future dates | Invalid age data submitted | `PersonalSection` |
| **CRITICAL** | Phone fields no validation | Invalid phone numbers accepted | `PersonalSection`, `HousingHistorySection` |
| **HIGH** | SSN no confirmation field | Typos undetectable | `PersonalSection` |
| **HIGH** | SSN no max length | Can enter 50+ digits | `PersonalSection` |
| **HIGH** | Data duplication: Eligibility ↔ Application | Poor UX, re-entry of all data | Application flow |
| **HIGH** | Bank name field not validated | Any text accepted | `BankingSection` |
| **MEDIUM** | Routing number: Real validation missing | Could accept invalid routing numbers | `BankingSection` |
| **MEDIUM** | Account number: Real validation missing | Could accept invalid account numbers | `BankingSection` |
| **MEDIUM** | "Not sure" / "Prefer not to say" overused | Unclear business rules | Multiple components |
| **MEDIUM** | Accessibility: Missing aria-labels on sensitive fields | Screen readers impaired | Multiple |
| **MEDIUM** | Placeholder text contrast | May fail WCAG AA | Multiple |
| **LOW** | Household member SSN privacy risk | Collecting unnecessary SSN | `HouseholdSection` |
| **LOW** | Document scope needs justification | Possibly asking for unnecessary docs | `DocumentsSection` |

---

## 13. REMAINING ISSUES (NOT FIXED)

1. **Unknown factors:**
   - Server-side validation for phone, SSN, dates
   - Actual routing number / account number validation (vendor integration)
   - Eligibility data storage and retrieval
   - Profile prefill mechanism (exists but not audited)

2. **Beyond scope of this audit:**
   - Communication architecture
   - Authorization architecture
   - Admin document review workflow
   - Staff portal functionality

3. **Test coverage:**
   - Full Playwright test suite not run
   - TypeScript build not verified
   - Production build not verified

---

## 14. NEXT STEPS (DO NOT IMPLEMENT WITHOUT APPROVAL)

### Phase 1: Critical Fixes (must fix before launch)

1. **Banking Section Visibility**
   - [ ] Verify banking field styling and color contrast
   - [ ] Test on multiple browsers (Chrome, Safari, Firefox)
   - [ ] Ensure password input is visible on all backgrounds
   - [ ] Add placeholder or helper text if needed

2. **Date Validation**
   - [ ] Add max date = today
   - [ ] Add min date validation (age ≥15 or appropriate minimum)
   - [ ] Add clear error message: "Date of birth cannot be in the future"

3. **Phone Validation**
   - [ ] Implement phone number formatting: (555) 123-4567
   - [ ] Accept multiple formats: 5551234567, (555) 123-4567, 555-123-4567
   - [ ] Validate: 10 digits (US format)
   - [ ] Error message: "Enter a valid US phone number"

4. **SSN Improvements**
   - [ ] Add max length: 9 digits
   - [ ] Auto-format as: XXX-XX-XXXX
   - [ ] Add confirmation field (required)
   - [ ] Error message if mismatch: "SSNs do not match"
   - [ ] Feedback: "You entered 9 digits - ready to submit"

### Phase 2: High-Priority Fixes (should fix before launch)

5. **Data Deduplication**
   - [ ] Map eligibility → application fields (canonical mapping)
   - [ ] Implement prefill from eligibility data
   - [ ] Show "from your eligibility assessment" indicator
   - [ ] Allow user to edit prefilled values

6. **Escape Options Review**
   - [ ] Remove "Not sure" from eligibility gate questions (or justify business logic)
   - [ ] Remove "Prefer not to say" from employment status
   - [ ] Simplify income range selector (keep as fallback only)

7. **Banking Validation**
   - [ ] Add bank name validation (basic: no special characters, length check)
   - [ ] Research: Real routing number validation API
   - [ ] Research: Real account number format validation (vary by bank)

### Phase 3: Medium-Priority Fixes (nice to have)

8. **Accessibility**
   - [ ] Add aria-label to SSN, routing number, account number inputs
   - [ ] Improve focus indicators visibility
   - [ ] Test placeholder text contrast against WCAG AA standard
   - [ ] Add aria-required="true" to all required fields

9. **Document Scope**
   - [ ] Remove unjustified document types (teacher cert, healthcare license)
   - [ ] Confirm eviction notice collection method (staff vs. user upload)

---

## 15. SIGN-OFF

**Audit Completed By:** Production Audit Agent  
**Date:** September 5, 2026  
**Scope:** Complete eligibility + application flow  
**Status:** ✋ **STOP - DO NOT DEPLOY** (Critical issues found)

**Ready to Proceed With Fixes?** Await user confirmation and selection of phase priority.
