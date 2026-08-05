import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { documentStorageService } from '@/lib/documents/storage.service';
import { DOCUMENT_TYPES } from '@/lib/documents/categories';
import { uploadDocumentForApplication } from '@/lib/documents/document.service';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const applicationId = formData.get('applicationId') as string;
    const documentType = formData.get('documentType') as string;
    const category = formData.get('category') as string;

    if (!file || !applicationId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, applicationId, documentType' },
        { status: 400 }
      );
    }

    // Get document type config for validation
    const docConfig = DOCUMENT_TYPES.find((d) => d.id === documentType);
    if (!docConfig) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Validate file
    const validation = documentStorageService.validateFile(
      file,
      docConfig.acceptedFormats,
      docConfig.maxSizeMB
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const document = await uploadDocumentForApplication({
        userId: user.id,
        applicationId,
        documentType,
        category,
        buffer,
        fileName: file.name,
        mimeType: file.type,
      });

      return NextResponse.json({
        success: true,
        document,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload document';
      if (message === 'Application not found') {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
