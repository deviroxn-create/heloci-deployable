import React from "react";
import { getFormForProgram } from "@/lib/forms/renderer";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import EligibilityAssistantV2 from "@/components/eligibility/eligibility-assistant-v2";

export default async function Page() {
  const user = await getCurrentUser();

  let slug = process.env.DEFAULT_ELIGIBILITY_PROGRAM_SLUG;
  if (!slug) {
    const candidate = await prisma.program.findFirst({
      where: {
        status: "active",
        isArchived: false,
        isPublic: true,
        questionSets: { some: { isActive: true } }
      },
      orderBy: { priority: "desc" },
      select: { slug: true }
    });
    slug = candidate?.slug;
  }
  slug = slug ?? "global-eligibility";

  const form = await getFormForProgram(slug, user?.id ?? "guest", { createDraft: false });

  return (
    <EligibilityAssistantV2
      pages={form.pages ?? []}
      userName={user?.name ?? user?.email ?? "there"}
      isGuest={!user}
    />
  );
}
