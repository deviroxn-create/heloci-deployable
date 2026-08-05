import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { getProgramForAdmin } from "@/lib/programs/program.service";
import { createEligibilityRule } from "@/lib/programs/rule-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const program = await getProgramForAdmin(id);
  if (!program) {
    return NextResponse.json({ error: "Program not found." }, { status: 404 });
  }

  await requireOrgRole(user.id, program.organizationId, ["org_admin"]);

  const body = await req.json();

  const rule = await createEligibilityRule(id, user.id, {
    version: body.version ?? 1,
    name: body.name ?? "v1",
    rules: body.rules ?? {},
  });

  publishDomainEvent("admin.action", { userId: user.id, recipientEmail: user.email, locale: "en" });

  return NextResponse.json(rule);
}
