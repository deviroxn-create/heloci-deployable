import { NextResponse, NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import { importProperties } from "@/lib/properties/property-import.service";

export async function POST(request: Request | NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    let body: unknown;
    const contentType = request.headers.get("content-type") || "";

    // Handle file upload (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await (request as NextRequest).formData();
      const file = formData.get("file") as File;
      const dryRun = formData.get("dryRun") === "true";

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      if (!file.name.endsWith(".json")) {
        return NextResponse.json({ error: "File must be JSON format" }, { status: 400 });
      }

      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const properties = Array.isArray(data) ? data : [data];
        body = { properties, dryRun };
      } catch {
        return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
      }
    } else {
      // Handle JSON body
      body = await request.json() as unknown;
    }

    const requestedOrganizationId = body && typeof body === "object" && "organizationId" in body && typeof body.organizationId === "string" ? body.organizationId : null;
    const organizationId = await getOrganizationContext(user, requestedOrganizationId);
    await requireOrgRole(user.id, organizationId, ["org_admin"]);
    const result = await importProperties(body, { organizationId });
    return NextResponse.json(result, { status: result.summary.failed > 0 ? 207 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to import properties.";
    const status = message === "Unauthorized" || message === "ORGANIZATION_ACCESS_DENIED" ? 403 : message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}