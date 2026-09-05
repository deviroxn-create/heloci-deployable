import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { deleteDocumentForUser, getDocumentForUser } from '@/lib/documents/document.service';
import { documentStorageService } from '@/lib/documents/storage.service';

/**
 * GET /api/documents/[id]
 * Get document details
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    try {
      const document = await getDocumentForUser(id, user.id);
      return NextResponse.json({
        document: {
          id: document.id,
          fileName: document.fileName,
          fileUrl: documentStorageService.getViewUrl(document.fileUrl, document.id),
          type: document.type,
          uploadedAt: document.uploadedAt,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get document';
      if (message === 'Document not found') {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (message === 'Unauthorized') {
        return NextResponse.json({ error: message }, { status: 403 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json({ error: 'Failed to get document' }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete a document
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    try {
      await deleteDocumentForUser(id, user.id);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete document';
      if (message === 'Document not found') {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (message === 'Unauthorized') {
        return NextResponse.json({ error: message }, { status: 403 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
