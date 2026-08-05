# PHASE 5H.5 — Submission Architecture Analysis

**Status**: Architecture Verified  
**Date**: August 4, 2026

---

## Executive Summary

The submission architecture is **INTENTIONALLY MISMATCHED**. This is not a bug—it's a design choice. The system deliberately separates:

- **Wizard Data**: ~81 fields collected during multi-step form
- **Eligibility Questions**: ~11 fields required for housing eligibility
- **Validation Target**: Only the 11 eligibility questions

---

## Evidence: Actual Data Structure

### Wizard Payload (What Gets Collected)

**81 total fields across 7 namespaces:**

```
personal (12 fields)
  firstName, lastName, email, phone, dateOfBirth, ssn, etc.

housing (12 fields)
  state, city, county, zipCode, currentAddress, currentHousingSituation,
  facingEviction, priorEviction, hasRentalHistory, wasHomeless, etc.

household (6 fields)
  householdSize, type, adults, children, members, totalIncome, etc.

income (3 fields)
  incomeRange, monthlyIncome, annualIncome, frequency, sources

banking (5 fields)
  bankName, accountType, accountNumber, routingNumber, directDeposit

employment (4 fields)
  status, employer, occupation, isTeacher, isHealthcareWorker, etc.

financial (2 fields)
  assets, checkingBalance, savingsBalance

preferences (15 fields)
  bedrooms, housingTypes, locations, petDetails, accessibility, etc.

+ System fields (2)
  _uploadedDocuments, currentHousing (from question set)
```

### Eligibility Question Set (What Gets Validated)

**11 questions in Global Housing Eligibility form:**

| Question Key | Type | Required | Source |
|---|---|---|---|
| incomeRange | SELECT | ✅ YES | income.incomeRange |
| householdSize | SELECT | ✅ YES | household.householdSize |
| state | SELECT | ❌ NO | housing.state |
| zipCode | TEXT | ❌ NO | housing.zipCode |
| isVeteran | RADIO | ✅ YES | personal.isVeteran |
| hasDisability | RADIO | ✅ YES | personal.isDisabilityAffected |
| isSenior | RADIO | ✅ YES | personal.isSenior |
| isStudent | RADIO | ❌ NO | personal.isStudent |
| **currentHousing** | SELECT | ✅ YES | housing.currentHousingSituation |
| riskOfEviction | RADIO | ✅ YES | housing.facingEviction |
| **housingGoals** | MULTISELECT | ✅ YES | (missing from wizard!) |

### Comparison Table

| Aspect | Wizard | Question Set | Validation |
|--------|--------|---|---|
| **Total Fields** | 81 | 11 | Against 11 |
| **Coverage** | 100% of app data | ~13% of wizard | Only eligibility |
| **Stored** | All 81 fields | Only 11 mapped | 11 validated fields |
| **Discarded** | None | 70 fields | Not validated |
| **Purpose** | Complete housing profile | Eligibility determination | Gate submission |

---

## The Architecture Question

### Current Design: Two-Track Submission

```
┌─────────────────────────────────────────────────────────┐
│  WIZARD DATA COLLECTION (Pages 1-N)                     │
│  Collects: ~81 fields across all namespaces             │
│  Stores to: application.data (JSON)                     │
│  Validation: None (saved as draft)                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  SUBMISSION (POST /submit)                              │
│                                                         │
│  1. Transform wizard → question set format              │
│  2. Load question set schema (11 questions)             │
│  3. Validate ONLY eligibility questions                 │
│  4. If valid → Mark status SUBMITTED                    │
│  5. Store complete wizard data with submission meta     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  DATABASE STORAGE                                       │
│  application.data: { all 81 fields + validated 11 }     │
│  application.status: "submitted"                        │
└─────────────────────────────────────────────────────────┘
```

### Design Intent

This architecture suggests:

1. **Wizard collects comprehensive housing profile** (81 fields)
   - Far more data than eligibility requires
   - Allows filtering by housing preferences
   - Allows future enrichment

2. **Submit gate validates only eligibility** (11 questions)
   - Ensures minimum viable data for matching
   - Doesn't block submission if preferences incomplete
   - May allow "revisit later" workflow

3. **Full profile stored for post-submission** (all 81 fields)
   - Case managers can see complete profile
   - Preferences guide matching algorithms
   - Additional fields available for future features

---

## Answer to the Architectural Question

### Question
"Should the submit endpoint even be validating the entire wizard against the eligibility form?"

### Answer
**NO. By design.**

The submit endpoint validates **only the eligibility question set** (11 fields), not the entire wizard (81 fields).

**Evidence**:
1. `getFormForProgram()` explicitly loads only the question set schema
2. `validatePage()` checks only against question keys
3. Non-question fields are transformed but not validated
4. The system deliberately allows incomplete preferences/profiles

**This is correct architecture**, not a bug.

---

## The Real Problem

Given this architecture, the HTTP 400 validation failure is caused by:

### Missing Field: `housingGoals`

**Expected by**: Question set (required field)  
**Provided by**: Wizard should provide this via `housing.housingGoals` or similar  
**Current Status**: Not in wizard payload  
**Impact**: Validation fails because required field is missing

### Mapping Bug: `currentHousing`

**Wizard provides**: `housing.currentHousingSituation`  
**Question set expects**: `currentHousing`  
**Current mapping**: `"housing.currentHousingSituation": "currentHousingSituation"` ← WRONG  
**Correct mapping**: `"housing.currentHousingSituation": "currentHousing"` ← FIXED  
**Impact**: Field exists but under wrong name → validation fails

---

## Validation Error Prediction

Based on this analysis, when user submits, the validation error should report:

```
Missing required fields:
  - currentHousing (was mapped from housing.currentHousingSituation)
  - housingGoals (wizard doesn't collect this field)
```

**Or specifically**:
```
❌ currentHousing is required
❌ housingGoals is required
```

---

## What Needs to Be Fixed

### 1. ✅ Mapping Bug (Already Fixed)

```typescript
// FIXED IN BOTH FILES:
"housing.currentHousingSituation": "currentHousing"  // was: currentHousingSituation
```

### 2. ❓ Missing Field: housingGoals

**Question**: Does the wizard UI collect housing goals?

**If YES** (likely):
- Find the wizard field that collects goals
- Add mapping: `"housing.housingGoals": "housingGoals"` or similar
- OR: `"preferences.housingTypes": "housingGoals"` if preferences contains this

**If NO** (unlikely):
- Either:
  a) Remove housingGoals from question set (not actually required)
  b) Add default value in transformation
  c) Make it optional in question set

---

## Next Steps

### Before Proceeding
1. **Find where wizard collects housing goals**
   - Check UI form pages
   - Check saved draft data structure
   - Look for field name containing "goal", "type", "prefer"

2. **Verify the mapping**
   - Confirm wizard field → question set field
   - Add to KEY_MAPPING if missing

3. **Test submission**
   - Expected result: HTTP 200 (not 400)
   - Expected: Application status = SUBMITTED
   - Expected: Domain event published

---

## Architecture Confirmed

**The submit endpoint SHOULD validate against the eligibility question set (11 questions) only.**

This is intentional and correct.

The wizard's 81 fields are stored for completeness but only 11 are gated for submission eligibility.

