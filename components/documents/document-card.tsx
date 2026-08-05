"use client";

import { DocumentUploader } from './document-uploader';
import type { DocumentType } from '@/lib/documents/categories';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  documentType: DocumentType;
  applicationId: string;
  existingDocument?: {
    id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: Date;
  };
  onUploadComplete: (document: any) => void;
  onDelete?: () => void;
}

export function DocumentCard({
  documentType,
  applicationId,
  existingDocument,
  onUploadComplete,
  onDelete,
}: DocumentCardProps) {
  return (
    <div className="space-y-3">
      {/* Document Info */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-slate-900">
              {documentType.name}
              {documentType.required && (
                <span className="ml-2 text-xs font-medium text-red-600">Required</span>
              )}
              {documentType.conditionalRequired && (
                <span className="ml-2 text-xs font-medium text-orange-600">
                  Conditionally Required
                </span>
              )}
            </h4>
            <p className="mt-0.5 text-xs text-slate-600">{documentType.description}</p>
          </div>
        </div>

        {/* Examples */}
        {documentType.examples && documentType.examples.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {documentType.examples.map((example, idx) => (
              <span
                key={idx}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {example}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Upload Component */}
      <DocumentUploader
        documentType={documentType}
        applicationId={applicationId}
        existingDocument={existingDocument}
        onUploadComplete={onUploadComplete}
        onDelete={onDelete}
      />
    </div>
  );
}
