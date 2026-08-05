# PHASE 5H.5 — Final Root Cause Analysis

**Status**: Root Cause Confirmed  
**Date**: August 4, 2026

---

## The Complete Picture

### Architecture Confirmed ✅

The submission endpoint **SHOULD validate against the question set (11 questions) only**.

This is intentional:
- Wizard collects 81 fields (complete housing profile)
- Only 11 are eligibility gates
- Everything is stored, only 11 are validated for submission

---

## The Real Bug: Two Separate Issues

### Issue 1: Mapping Mismatch ✅ (FIXED)

**Problem**: 
```typescript
"housing.currentHousingSituation": "currentHousingSituation"  // WRONG
```

**Fix**:
```typescript
"housing.currentHousingSituation": "currentHousing"  // CORRECT
```

**Status**: Already fixed in earlier steps

---

### Issue 2: Root-Level Field Loss ❌ (NOT YET FIXED)

**The Bug**: `housingGoals` is lost during transformation

#### How It Happens

1. **Wizard collects and stores**: `housingGoals` (at root level)
   ```json
   { "housingGoals": ["affordable_rent"] }
   ```

2. **Transform function processes it**:
   ```typescript
   for (const [wizardKey, value] of Object.entries(wizardData)) {
     // wizardKey = "housingGoals", value = ["affordable_rent"]
     
     if (KEY_MAPPING[wizardKey]) {
       // "housingGoals" is NOT in KEY_MAPPING (only "housing.housingGoals" is)
       // → FALSE, skip this branch
     } else if (!wizardKey.includes(".")) {
       // "housingGoals" doesn't include "."
       // → TRUE, enter this branch
       
       const hasNamespacedVersion = Object.values(KEY_MAPPING).includes(wizardKey);
       // KEY_MAPPING values include "housingGoals" (from mapping "housing.housingGoals" → "housingGoals")
       // → hasNamespacedVersion = TRUE
       
       if (!hasNamespacedVersion) {
         transformed[wizardKey] = value;  // SKIPPED because hasNamespacedVersion is TRUE
       }
       // ❌ housingGoals is NOT added to transformed!
     }
   }
   ```

3. **Result**: `housingGoals` is missing from validation payload
4. **Validation fails**: Required field `housingGoals` not found

#### Why This Logic Exists

The logic tries to prevent duplicates:
- If wizard has both `housing.housingGoals` AND `housingGoals`
- Don't keep the root-level `housingGoals` since it maps from the namespaced version

**But** the wizard ONLY provides root-level `housingGoals`, not `housing.housingGoals`.

---

## Solution

The transformation logic needs to handle root-level fields that are also question-set fields.

**Option A**: Check if the value exists in any form

```typescript
} else if (!wizardKey.includes(".")) {
  const hasNamespacedVersion = Object.keys(KEY_MAPPING)
    .some(k => KEY_MAPPING[k] === wizardKey);  // Check if it's a TARGET of a mapping
  
  if (!hasNamespacedVersion) {
    transformed[wizardKey] = value;
  }
}
```

But this might still skip valid root-level fields.

**Option B**: Always keep root-level question-set fields

```typescript
} else if (!wizardKey.includes(".")) {
  // Always include root-level keys that are question keys
  const questionKeys = ['incomeRange', 'householdSize', 'state', 'zipCode', 
    'isVeteran', 'hasDisability', 'isSenior', 'isStudent', 'currentHousing', 
    'riskOfEviction', 'housingGoals'];
  
  if (questionKeys.includes(wizardKey)) {
    transformed[wizardKey] = value;  // Always keep question-set fields
  }
}
```

**Option C**: Simplify - if it's already a valid question key, keep it

```typescript
} else if (!wizardKey.includes(".")) {
  const questionSetKeyNames = [
    'incomeRange', 'householdSize', 'state', 'zipCode',
    'isVeteran', 'hasDisability', 'isSenior', 'isStudent',
    'currentHousing', 'riskOfEviction', 'housingGoals'
  ];
  
  if (questionSetKeyNames.includes(wizardKey)) {
    transformed[wizardKey] = value;
  } else {
    const hasNamespacedVersion = Object.values(KEY_MAPPING).includes(wizardKey);
    if (!hasNamespacedVersion) {
      transformed[wizardKey] = value;
    }
  }
}
```

---

## Validation Error Prediction

When user submits without the fix:

```
❌ Validation Errors:
   - currentHousing: missing (was "currentHousingSituation", now fixed to "currentHousing")
   - housingGoals: missing (lost during transformation due to root-level logic)
```

After fixing mapping:
```
❌ Validation Error:
   - housingGoals: missing (still lost during transformation)
```

After fixing transformation:
```
✅ Validation: All required fields present
✅ HTTP 200
✅ Domain event published
```

---

## Summary of Fixes Needed

| Issue | Severity | Fix |Status |
|-------|----------|-----|-------|
| Mapping: currentHousingSituation → currentHousing | HIGH | Change mapping | ✅ DONE |
| Missing mapping entry: housing.housingGoals | MEDIUM | Add to KEY_MAPPING | ✅ DONE |
| Root-level housingGoals lost | HIGH | Fix transformation logic | ❌ TODO |

---

## Next Action

Fix the transformation logic to preserve root-level `housingGoals` field.

The code needs to recognize that `housingGoals` arriving at root level is a valid question-set field and should be included in the validation payload.

