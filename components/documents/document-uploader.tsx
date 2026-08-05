"use client";

import { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentType } from '@/lib/documents/categories';

interface DocumentUploaderProps {
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

export function DocumentUploader({
  documentType,
  applicationId,
  existingDocument,
  onUploadComplete,
  onDelete,
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Validate required fields
      if (!applicationId) {
        throw new Error('Application ID is missing. Please reload the page.');
      }

      if (!documentType.id) {
        throw new Error('Document type is missing. Please reload the page.');
      }

      if (!file) {
        throw new Error('No file selected.');
      }

      // Client-side validation
      const maxBytes = documentType.maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error(`File size exceeds ${documentType.maxSizeMB}MB limit`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', applicationId);
      formData.append('documentType', documentType.id);
      formData.append('category', documentType.category);

      // Debug logging
      console.log('📤 Uploading document:', {
        fileName: file.name,
        applicationId,
        documentType: documentType.id,
        category: documentType.category,
        fileSize: file.size,
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Upload failed:', { status: response.status, error: data.error });
        throw new Error(data.error || 'Upload failed');
      }

      console.log('✅ Upload successful:', data.document);
      onUploadComplete(data.document);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload error:', errorMsg);
      setError(errorMsg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!existingDocument || !onDelete) return;

    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents/${existingDocument.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (existingDocument) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50/30 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{existingDocument.fileName}</p>
            <p className="text-xs text-slate-500">
              Uploaded {new Date(existingDocument.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={existingDocument.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View
            </a>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-slate-600 hover:text-slate-700"
            >
              Replace
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleChange}
          accept={documentType.acceptedFormats.join(',')}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors',
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100',
          uploading && 'pointer-events-none opacity-60'
        )}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-700">Uploading...</p>
            {progress > 0 && (
              <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              Drop file here or click to upload
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {documentType.acceptedFormats.join(', ')} • Max {documentType.maxSizeMB}MB
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleChange}
          accept={documentType.acceptedFormats.join(',')}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
