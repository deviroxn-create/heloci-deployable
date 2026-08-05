import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listDocumentsForUser } from '@/lib/documents/document.service';

/**
 * GET /api/documents?userId=xxx
 * List all documents for current user
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const documents = await listDocumentsForUser(user.id);

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 });
  }
}
