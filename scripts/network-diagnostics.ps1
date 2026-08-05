# PHASE 5F-A.3 Network Diagnostics

Write-Host "=== PHASE 5F-A.3 Network Isolation Diagnosis ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: HTTPS
Write-Host "[1/6] Testing outbound HTTPS..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://console.neon.tech" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ HTTPS works: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTPS failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: TCP to Neon PostgreSQL
Write-Host ""
Write-Host "[2/6] Testing TCP:5432 to Neon PostgreSQL..." -ForegroundColor Yellow
$result = Test-NetConnection "ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech" -Port 5432 -WarningAction SilentlyContinue
if ($result.TcpTestSucceeded) {
    Write-Host "✅ TCP:5432 works" -ForegroundColor Green
} else {
    Write-Host "❌ TCP:5432 FAILED - Connection timeout or refused" -ForegroundColor Red
    Write-Host "   Computer: $($result.ComputerName)"
    Write-Host "   Remote Port: $($result.RemotePort)"
    Write-Host "   Succeeded: $($result.TcpTestSucceeded)"
}

# Test 3: VPN Status
Write-Host ""
Write-Host "[3/6] Checking VPN status..." -ForegroundColor Yellow
$vpns = @(Get-VpnConnection -ErrorAction SilentlyContinue)
if ($vpns.Count -gt 0) {
    Write-Host "⚠️  VPN found:" -ForegroundColor Yellow
    foreach ($vpn in $vpns) {
        Write-Host "   $($vpn.Name): $($vpn.ConnectionState)"
    }
} else {
    Write-Host "✅ No VPN configured (not the blocker)" -ForegroundColor Green
}

# Test 4: Firewall Policy
Write-Host ""
Write-Host "[4/6] Checking Windows Defender Firewall policy..." -ForegroundColor Yellow
$fwOutput = netsh advfirewall show allprofiles 2>&1
if ($fwOutput -match "AllowOutbound") {
    Write-Host "✅ Firewall policy allows outbound" -ForegroundColor Green
} else {
    Write-Host "⚠️  Firewall policy might restrict outbound" -ForegroundColor Red
}

# Test 5: DNS Resolution
Write-Host ""
Write-Host "[5/6] Testing DNS resolution..." -ForegroundColor Yellow
try {
    $resolved = [System.Net.Dns]::GetHostAddresses("ep-snowy-hall-atck4ttn-pooler.c-9.us-east-1.aws.neon.tech")
    Write-Host "✅ DNS resolves to: $($resolved[0].IPAddressToString)" -ForegroundColor Green
} catch {
    Write-Host "❌ DNS resolution failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Try other common ports
Write-Host ""
Write-Host "[6/6] Testing other common ports to 8.8.8.8 (Google DNS)..." -ForegroundColor Yellow
$ports = @(443, 80, 3306, 5432)
foreach ($port in $ports) {
    $testResult = Test-NetConnection "8.8.8.8" -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    $status = if ($testResult.TcpTestSucceeded) { "✅" } else { "❌" }
    $statusText = if ($testResult.TcpTestSucceeded) { "Open" } else { "Blocked/Timeout" }
    Write-Host "$status Port $port`: $statusText"
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
$resultStatus = if ($result.TcpTestSucceeded) { "✅ WORKING" } else { "❌ BLOCKED" }
$resultColor = if ($result.TcpTestSucceeded) { "Green" } else { "Red" }
Write-Host "TCP:5432 to Neon PostgreSQL: $resultStatus" -ForegroundColor $resultColor
Write-Host ""

if (-not $result.TcpTestSucceeded) {
    Write-Host "Root Cause: Connection times out (not refused)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Likely causes (in order of probability):" -ForegroundColor Yellow
    Write-Host "1. ISP/Router blocking port 5432 to external services"
    Write-Host "2. Network firewall rule silently dropping packets"
    Write-Host "3. Antivirus software blocking database connections"
    Write-Host "4. Corporate network policy restricting database access"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "• Try on mobile hotspot to bypass home network"
    Write-Host "• Check router/ISP port blocking"
    Write-Host "• Check antivirus firewall settings"
    Write-Host "• Contact network admin if corporate environment"
}
