import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const businessRoots = [
  path.join(repoRoot, "actions"),
  path.join(repoRoot, "app", "api"),
  path.join(repoRoot, "lib", "auth"),
  path.join(repoRoot, "lib", "applications"),
  path.join(repoRoot, "lib", "cases"),
  path.join(repoRoot, "lib", "documents"),
  path.join(repoRoot, "lib", "eligibility"),
  path.join(repoRoot, "lib", "matching"),
  path.join(repoRoot, "lib", "organizations"),
  path.join(repoRoot, "lib", "reviews"),
  path.join(repoRoot, "lib", "workflows"),
  path.join(repoRoot, "services"),
];

const excludedDirs = [
  path.join(repoRoot, "lib", "notifications"),
  path.join(repoRoot, "lib", "communications"),
  path.join(repoRoot, "lib", "email"),
  path.join(repoRoot, "lib", "events"),
  path.join(repoRoot, "lib", "prisma"),
  path.join(repoRoot, "lib", "telegram"),
  path.join(repoRoot, "lib", "supabase"),
];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(repoRoot, fullPath);
    if (entry.isDirectory()) {
      if (excludedDirs.some((excluded) => fullPath === excluded || fullPath.startsWith(excluded + path.sep))) {
        continue;
      }
      files.push(...walk(fullPath));
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function readText(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

test("business folders do not contain direct notification-service usage", () => {
  const violatingFiles: string[] = [];
  const pattern = /notificationService\.notify\(|deliveryChannels|routingPlans|\baudience\b/;

  for (const root of businessRoots) {
    for (const filePath of walk(root)) {
      const content = readText(filePath);
      if (pattern.test(content)) {
        violatingFiles.push(path.relative(repoRoot, filePath));
      }
    }
  }

  assert.deepEqual(violatingFiles, [], `Found business-layer violations:\n${violatingFiles.join("\n")}`);
});
