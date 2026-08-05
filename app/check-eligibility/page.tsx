import React from "react";
import { getFormForProgram } from "@/lib/forms/renderer";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import EligibilityAssistantV2 from "@/components/eligibility/eligibility-assistant-v2";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="text-center">
          <p className="text-slate-600">Please sign in to check your eligibility.</p>
          <a href="/login" className="mt-4 inline-block rounded-full bg-[#006AFF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0057e6]">
            Sign in
          </a>
        </div>
      </div>
    );
  }

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
  const form = await getFormForProgram(slug, user.id, { createDraft: false });

  return (
    <EligibilityAssistantV2
      pages={form.pages ?? []}
      userName={user.name ?? user.email ?? "there"}
    />
  );
}
