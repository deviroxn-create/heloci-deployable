import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getOrganizationContext } from '@/lib/organizations/organization-context';

/**
 * GET /api/organizations/:id/context
 * Get organization context for Communication Hub
 * 
 * Only Platform Super Admins or members of the organization can access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params;
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Platform Super Admin (organizationId = null) can access any organization
    // Organization member can only access their own organization
    if (user.organizationId && user.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const organization = await getOrganizationContext(organizationId);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error('[API] Error getting organization context:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
