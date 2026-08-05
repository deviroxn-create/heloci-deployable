# Phase 5F-B.1 — Evidence Table: Database Connectivity Isolation

**Objective**: Determine exactly where the connection fails  
**Date**: August 3, 2026  
**Network**: Home Wi-Fi (current test)  

---

## Evidence Table: Current Environment

| Test | Tool | Target | Port | Result | Status | Evidence |
|------|------|--------|------|--------|--------|----------|
| **DNS** | System | ep-snowy...pooler | N/A | Resolves to 3 IPs | ✅ WORKS | 3.220.135.142, 54.147.180.180, 52.45.105.76 |
| **Network** | Test-NetConnection | ep-snowy...pooler | 5432 | Timeout | ❌ BLOCKED | TcpTestSucceeded = False |
| **Client 1** | psql | ep-snowy...pooler | 5432 | Timeout | ❌ BLOCKED | "Connection timed out (0x0000274C/10060)" |
| **Client 2** | Prisma | ep-snowy...pooler | 5432 | P1001 Error | ❌ BLOCKED | "Can't reach database server" |

---

## Current Findings (Home Wi-Fi)

### ✅ What Works
- DNS resolution: Neon endpoint resolves to 3 IP addresses
- Configuration: Prisma correctly identifies the hostname

### ❌ What's Blocked
- **TCP Port 5432**: Connection times out (not refused, times out)
- **psql**: Cannot connect (same timeout as Prisma)
- **Test-NetConnection**: Port 5432 is unreachable

### Conclusion So Far
The failure is **NOT Prisma-specific**. Both psql and Prisma fail at the same point: TCP layer cannot establish connection to port 5432.

**Root cause location**: Network layer (ISP/Router/Firewall) — blocking port 5432

---

## Tests Remaining (To Complete Isolation)

### Test 5: Mobile Hotspot (Different Network)
**Purpose**: Verify if ISP is the blocker  
**Expected**:
- If succeeds on mobile hotspot → ISP is the blocker
- If fails on mobile hotspot too → Infrastructure issue at Neon level

**Status**: ⏳ Requires user action

### Test 6: DBeaver or TablePlus (Alternative Client)
**Purpose**: Confirm pattern across different clients  
**Expected**: Should also fail (same timeout as psql/Prisma)

**Status**: ⏳ Optional (psql already proves client-agnostic failure)

---

## What We Know Definitively

| Layer | Status | Evidence |
|-------|--------|----------|
| DNS Resolution | ✅ Works | Multiple IPs resolve |
| Network Routing | ❌ Blocked | Port 5432 timeout |
| Client Independence | ❌ All Blocked | psql AND Prisma fail identically |
| Configuration | ✅ Correct | Prisma loads right URL |
| ISP/Router | 🛑 Blocking | Suspected but not proven with mobile test yet |

---

## Next Action: Mobile Hotspot Test

To complete isolation and **stop guessing**, we need to test on a different network:

### Steps
1. Enable mobile hotspot on smartphone
2. Connect laptop to hotspot
3. Run tests again:
   ```powershell
   $netTest = Test-NetConnection ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech -Port 5432
   ```
4. Run psql:
   ```powershell
   $env:PGPASSWORD="npg_ko01nQupgqDm"
   & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech -U neondb_owner -d neondb -c "SELECT version();"
   ```

### Expected Results

**If Mobile Hotspot Succeeds:**
```
TcpTestSucceeded = True  ✅
psql connection successful ✅
→ Conclusion: ISP is blocking port 5432
→ Solution: Use VPN or contact ISP
```

**If Mobile Hotspot Fails:**
```
TcpTestSucceeded = False ❌
psql connection timeout ❌
→ Conclusion: Neon endpoint is unreachable from all networks (AWS/infrastructure issue)
→ Solution: Contact Neon support OR there's a credentials issue
```

---

## Evidence Tracking Across Networks

Will be updated when mobile hotspot test is performed:

| Network | DNS | psql | Prisma | TCP:5432 |
|---------|-----|------|--------|----------|
| Home Wi-Fi | ✅ WORKS | ❌ TIMEOUT | ❌ P1001 | ❌ BLOCKED |
| Mobile Hotspot | ⏳ TBD | ⏳ TBD | ⏳ TBD | ⏳ TBD |
| VPN (if needed) | ⏳ TBD | ⏳ TBD | ⏳ TBD | ⏳ TBD |

---

## Why This Approach Works

By testing across:
1. **Different tools** (psql, Prisma, Test-NetConnection) → Proves it's not client-specific
2. **Different networks** (Wi-Fi, mobile hotspot, VPN) → Proves it's not ISP-specific (if mobile succeeds)
3. **DNS + Network + Client** → Isolates exact failure point

This eliminates guessing. We'll have definitive evidence.

---

## Current Status

**Isolation Progress**: 50% complete (home network tested)

**Next Step**: Mobile hotspot test (user action required)

**Decision Point**: 
- If mobile hotspot succeeds → Use VPN solution (or contact ISP)
- If mobile hotspot fails → Different issue (contact Neon support)

---

*Awaiting mobile hotspot test to complete evidence table and proceed.*

</content>
</invoke>