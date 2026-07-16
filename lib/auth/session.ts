import { Role } from "@prisma/client";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

function inferRole(email: string, metadataRole?: string | null): Role {
  const normalizedEmail = email.toLowerCase();
  if (metadataRole) return metadataRole as Role;
  if (normalizedEmail.includes("admin")) return "ADMIN";
  if (normalizedEmail.includes("staff")) return "STAFF";
  return "APPLICANT";
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const inferredRole = inferRole(user.email, user.user_metadata?.role as string | null);

  // Auto-create the Prisma row if it's missing, and sync the role so seeded
  // admin/staff accounts don't get downgraded to applicant on first sign-in.
  const dbUser = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
      role: inferredRole
    },
    create: {
      email: user.email,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      role: inferredRole
    }
  });

  return {
    id: dbUser.id,
    name: dbUser.name ?? user.email,
    email: dbUser.email,
    role: dbUser.role as Role,
    organizationId: dbUser.organizationId
  };
}
