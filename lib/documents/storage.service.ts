/**
 * Document Storage Service
 * 
 * Abstraction layer for document storage.
 * Currently uses local filesystem, but can be easily migrated to:
 * - Cloudinary
 * - AWS S3
 * - Azure Blob Storage
 * 
 * To migrate, only this file needs to be changed - UI remains the same.
 */

import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface UploadOptions {
  userId: string;
  applicationId: string;
  category: string;
  documentType: string;
}

class DocumentStorageService {
  private uploadDir: string;

  constructor() {
    // Store uploads in public/uploads directory
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
  }

  /**
   * Initialize storage directory
   */
  async init(): Promise<void> {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload a document
   */
  async upload(
    file: Buffer,
    originalName: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<UploadedDocument> {
    await this.init();

    // Generate unique filename
    const ext = path.extname(originalName);
    const uniqueId = uuidv4();
    const fileName = `${options.userId}_${options.applicationId}_${uniqueId}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Write file
    await writeFile(filePath, file);

    // Return document metadata
    return {
      id: uniqueId,
      fileName: originalName,
      fileUrl: `/uploads/documents/${fileName}`,
      mimeType,
      size: file.length,
      uploadedAt: new Date(),
    };
  }

  /**
   * Delete a document
   */
  async delete(fileUrl: string): Promise<void> {
    // Extract filename from URL
    const fileName = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, fileName);

    // Delete file if exists
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }

  /**
   * Get document URL for viewing
   */
  getViewUrl(fileUrl: string): string {
    return fileUrl;
  }

  /**
   * Validate file
   */
  validateFile(file: File | Buffer, allowedTypes: string[], maxSizeMB: number): {
    valid: boolean;
    error?: string;
  } {
    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    const fileSize = file instanceof File ? file.size : file.length;
    
    if (fileSize > maxBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    // Check file type
    if (file instanceof File) {
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: `File type not allowed. Accepted: ${allowedTypes.join(', ')}`,
        };
      }
    }

    return { valid: true };
  }
}

// Export singleton instance
export const documentStorageService = new DocumentStorageService();

// For future migration to cloud storage, create adapters:
// export class CloudinaryStorageAdapter implements DocumentStorageService { ... }
// export class S3StorageAdapter implements DocumentStorageService { ... }
