# PHASE 5F-A.2 — Neon Database Diagnostics

**Goal**: Determine why Neon is unreachable

---

## Configuration Review (Already Verified ✅)

```
.env DATABASE_URL:        postgresql://...@ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech/...
Prisma datasource:        ✅ Reads env("DATABASE_URL")
PrismaClient init:        ✅ Uses DATABASE_URL correctly
prisma db pull output:    ✅ Shows correct -pooler endpoint
```

**Conclusion**: Configuration is correct. Issue is network connectivity.

---

## Network Diagnostics Needed

### Test 1: Can This Environment Reach Neon?

**Windows Command:**
```powershell
# Test DNS resolution
nslookup ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech

# If that works, test TCP connectivity (requires telnet or Test-NetConnection)
Test-NetConnection -ComputerName ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech -Port 5432
```

**Expected Output If Working:**
```
TcpTestSucceeded : True
```

**Expected Output If Failing:**
```
TcpTestSucceeded : False
# or
getaddrinfo ENOTFOUND ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech
```

### Test 2: Neon Project Status

Visit: https://cloud.neon.tech

**Check:**
- ✅ Project is active (not suspended)
- ✅ Connection is showing correct status
- ✅ Database user (neondb_owner) is active
- ✅ No rate limits or billing issues

### Test 3: Direct Connection (If Tools Available)

```bash
# If psql is available on system
psql "postgresql://neondb_owner:npg_H0Eid3hmKILk@ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech:5432/neondb"
```

---

## Database Verification Checklist

### Exit Criteria to Resume Phase 5F

- [ ] `nslookup ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech` resolves successfully
- [ ] `Test-NetConnection` to port 5432 shows `TcpTestSucceeded: True`
- [ ] `npx prisma db pull` completes without "Can't reach database server" error
- [ ] `npx prisma generate` completes successfully
- [ ] Curl/test request to `/api/auth/me` returns 200 (or 401 if unauthenticated), not 500
- [ ] Can successfully call `prisma.user.findUnique()` without PrismaClientInitializationError

### Current Status

- ❌ `npx prisma db pull` fails: Cannot reach Neon
- ❌ `/api/auth/me` fails: PrismaClientInitializationError
- ❌ Signup/Login fails: Can't connect to database

---

## Root Cause Hypotheses (Ordered by Likelihood)

1. **Network/Firewall Restriction** (60%)
   - Local firewall blocking port 5432
   - ISP blocking database connections
   - VPN/proxy interfering with connection
   - **Fix**: Check firewall, connect to VPN, contact network admin

2. **Neon Instance Issue** (20%)
   - Project suspended/deleted
   - Connection pool exhausted
   - Neon service down
   - **Fix**: Check Neon console, restart project, contact Neon support

3. **Credentials/Auth Issue** (10%)
   - Password changed
   - API key invalidated
   - Wrong username
   - **Fix**: Update DATABASE_URL with new credentials from Neon console

4. **DNS Issue** (5%)
   - DNS lookup failing for Neon hostname
   - **Fix**: Use IP address directly (if available) or check DNS settings

5. **Configuration Bug** (5%)
   - Despite checks above, configuration is wrong
   - **Fix**: Re-export DATABASE_URL from Neon console and paste fresh

---

## If Neon is Unreachable

### Option A: Use Direct Connection (Without Pooler)

```
DATABASE_URL_UNPOOLED="postgresql://...@ep-snowy-hall-atck4ttn.c-9.us-east-1.aws.neon.tech/neondb"
```

Update `.env.local` to use this instead of pooled connection.

**Pros**: Might bypass pooler if it's having issues  
**Cons**: Direct connection is slower, no connection pooling

### Option B: Use Local Database Temporarily

Set up local PostgreSQL and test Phase 5F locally before moving back to Neon.

### Option C: Wait for Network Access

If this is a corporate/restricted environment, contact infrastructure team to whitelist:
- `ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech:5432`
- Outbound TCP connections to AWS

---

## Timeline

Once Neon connectivity is restored:

1. ✅ `npx prisma db pull` succeeds
2. ✅ `npx prisma generate` succeeds  
3. ✅ `/api/auth/me` returns 200 (authenticated) or 401 (unauthenticated), not 500
4. ✅ Signup form works end-to-end
5. ✅ Login works end-to-end
6. ✅ Resume Phase 5F: Verify notification email after signup

---

## Next Prompt

Run the network diagnostics above and report:

1. Result of `nslookup ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech`
2. Result of `Test-NetConnection -ComputerName ... -Port 5432`
3. Current status of Neon project (active/suspended/other)
4. Result of `npx prisma db pull` after any fixes

Then we can either:
- **Fix the connectivity** and resume Phase 5F testing
- **Switch strategies** (use local DB, different connection method, etc.)
