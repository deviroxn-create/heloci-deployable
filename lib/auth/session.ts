import { Prisma } from "@prisma/client";
import type { Role } from "@prisma/client";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

function getDefaultRole(): Role {
  // When a database user record is missing, do not infer elevated roles
  // from email address or Supabase user metadata.
  // Default to APPLICANT for any unknown user account.
  return "APPLICANT";
}

export function buildFallbackCurrentUser(user: { id?: string; email?: string | null; user_metadata?: Record<string, unknown> | null }, fallbackEmail: string) {
  const fallbackRole = getDefaultRole();

  return {
    id: user.id ?? fallbackEmail,
    name: (user.user_metadata?.full_name as string | null) ?? (user.user_metadata?.name as string | null) ?? fallbackEmail,
    email: fallbackEmail,
    role: fallbackRole,
    organizationId: null,
    departmentId: null,
    teamId: null,
    isPlatformAdmin: false,
    organization: null,
    department: null,
    team: null,
    orgRole: null,
    jobTitle: null,
    employeeId: null
  };
}

async function getDbUser(email: string) {
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2024") {
      return null;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return null;
    }

    throw error;
  }
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const fallbackUser = buildFallbackCurrentUser(user, user.email);

  try {
    const dbUser = await getDbUser(user.email);

    if (!dbUser) {
      const createdUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          role: getDefaultRole()
        }
      }).catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2024" || error.code === "P2021")) {
          return null;
        }
        throw error;
      });

      if (!createdUser) {
        return fallbackUser;
      }

      const [organization, department, team, orgMember] = await Promise.all([
        createdUser.organizationId ? prisma.organization.findUnique({
          where: { id: createdUser.organizationId },
          select: { id: true, name: true, slug: true }
        }) : Promise.resolve(null),
        createdUser.departmentId ? prisma.department.findUnique({
          where: { id: createdUser.departmentId },
          select: { id: true, name: true, code: true }
        }) : Promise.resolve(null),
        createdUser.teamId ? prisma.team.findUnique({
          where: { id: createdUser.teamId },
          select: { id: true, name: true }
        }) : Promise.resolve(null),
        createdUser.organizationId ? prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: createdUser.organizationId,
              userId: createdUser.id
            }
          },
          select: { role: true }
        }) : Promise.resolve(null)
      ]);

      const isPlatformAdmin = createdUser.role === "SUPER_ADMIN" && !createdUser.organizationId;

      return {
        id: createdUser.id,
        name: createdUser.name ?? user.email,
        email: createdUser.email,
        role: createdUser.role as Role,
        organizationId: createdUser.organizationId,
        departmentId: createdUser.departmentId,
        teamId: createdUser.teamId,
        isPlatformAdmin,
        organization,
        department,
        team,
        orgRole: orgMember?.role ?? null,
        jobTitle: createdUser.jobTitle,
        employeeId: createdUser.employeeId
      };
    }

    await prisma.user.update({
      where: { email: user.email },
      data: {
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined
      }
    }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2024" || error.code === "P2021")) {
        return null;
      }
      throw error;
    });

    const [organization, department, team, orgMember] = await Promise.all([
      dbUser.organizationId ? prisma.organization.findUnique({
        where: { id: dbUser.organizationId },
        select: { id: true, name: true, slug: true }
      }) : Promise.resolve(null),
      dbUser.departmentId ? prisma.department.findUnique({
        where: { id: dbUser.departmentId },
        select: { id: true, name: true, code: true }
      }) : Promise.resolve(null),
      dbUser.teamId ? prisma.team.findUnique({
        where: { id: dbUser.teamId },
        select: { id: true, name: true }
      }) : Promise.resolve(null),
      dbUser.organizationId ? prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: dbUser.organizationId,
            userId: dbUser.id
          }
        },
        select: { role: true }
      }) : Promise.resolve(null)
    ]);

    const isPlatformAdmin = dbUser.role === "SUPER_ADMIN" && !dbUser.organizationId;

    return {
      id: dbUser.id,
      name: dbUser.name ?? user.email,
      email: dbUser.email,
      role: dbUser.role as Role,
      organizationId: dbUser.organizationId,
      departmentId: dbUser.departmentId,
      teamId: dbUser.teamId,
      isPlatformAdmin,
      organization,
      department,
      team,
      orgRole: orgMember?.role ?? null,
      jobTitle: dbUser.jobTitle,
      employeeId: dbUser.employeeId
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2024" || error.code === "P2021")) {
      return fallbackUser;
    }

    throw error;
  }
}
