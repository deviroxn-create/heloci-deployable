/**
 * Remove Debug Logs Script
 * 
 * After manual testing is complete, this script removes or comments out
 * console.log debug statements added for Milestone 6.3 Phase 1 diagnostics.
 * 
 * Keeps error logging and structured error logs.
 * 
 * Usage: npx tsx scripts/remove-debug-logs.ts
 */

import * as fs from "fs";
import * as path from "path";

interface FileChange {
  file: string;
  removed: number;
  kept: number;
}

const KEEP_PATTERNS = [
  /console\.error/,
  /console\.warn/,
  // Keep logs that start with [ERROR], [CRITICAL], etc.
];

const REMOVE_PATTERNS = [
  /console\.log\(\"\[RBAC\]/,
  /console\.log\(\"\[Communication\]/,
  /console\.log\(\"\[API\]/,
  /console\.log\(\"\[Dashboard/,
  /console\.log\(\"\[Verify/,
];

function shouldKeepLog(line: string): boolean {
  return KEEP_PATTERNS.some(pattern => pattern.test(line));
}

function shouldRemoveLog(line: string): boolean {
  return REMOVE_PATTERNS.some(pattern => pattern.test(line));
}

function processFile(filePath: string): FileChange {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  let removed = 0;
  let kept = 0;

  const processed = lines.map(line => {
    // Check if this is a debug log we should remove
    if (shouldRemoveLog(line) && !shouldKeepLog(line)) {
      removed++;
      // Comment out the line instead of removing (safer)
      return `  // [DEBUG-REMOVED] ${line.trim()}`;
    }
    kept++;
    return line;
  }).join("\n");

  fs.writeFileSync(filePath, processed);
  return { file: filePath, removed, kept };
}

function removeDebugLogs() {
  const filesToProcess = [
    "lib/auth/rbac.ts",
    "lib/communications/case-communication.service.ts",
    "app/api/communications/messages/route.ts",
    "app/api/admin/dashboard/route.ts",
    "lib/organizations/dashboard-service.ts",
  ];

  const results: FileChange[] = [];

  console.log("\n🧹 Removing Debug Logs...\n");

  for (const file of filesToProcess) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        const result = processFile(fullPath);
        if (result.removed > 0) {
          console.log(`✓ ${file}`);
          console.log(`  Removed: ${result.removed} debug logs`);
          console.log(`  Kept: ${result.kept} lines`);
        }
        results.push(result);
      } catch (error) {
        console.error(`✗ Error processing ${file}:`, error);
      }
    } else {
      console.warn(`⚠ File not found: ${file}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  const totalRemoved = results.reduce((sum, r) => sum + r.removed, 0);
  console.log(`Total debug logs removed: ${totalRemoved}`);
  console.log("=".repeat(60) + "\n");

  console.log("📋 Changes made:");
  console.log("- console.log() calls commented out (not deleted)");
  console.log("- console.error() and console.warn() kept");
  console.log("- Review changes and git diff before committing");
  console.log("\n✨ Debug logs removed successfully!\n");
}

// Run the script
removeDebugLogs();
