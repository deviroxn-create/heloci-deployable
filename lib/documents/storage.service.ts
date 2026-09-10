/**
 * Document Storage Service
 * 
 * Abstraction layer for document storage.
 * Documents are stored in a private Supabase Storage bucket. The database keeps
 * an internal storage locator while clients receive authenticated API URLs.
 */

import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import type { UploadApiResponse } from 'cloudinary';

const BUCKET_NAME = 'heloci-documents';
const STORAGE_PREFIX = `supabase://${BUCKET_NAME}/`;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

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

export interface PropertyImageUploadOptions {
  propertyId?: string;
  folder?: string;
}

class DocumentStorageService {
  async uploadPropertyImage(
    file: Buffer,
    originalName: string,
    options: PropertyImageUploadOptions = {}
  ): Promise<{ publicId: string; secureUrl: string; width: number; height: number; format: string }> {
    if (!process.env.CLOUDINARY_URL?.startsWith('cloudinary://')) {
      throw new Error('Cloudinary is not configured');
    }

    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
      secure: true,
    });

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'heloci/properties',
          public_id: options.propertyId ? `${options.propertyId}-${uuidv4()}` : undefined,
          resource_type: 'image',
          transformation: [
            { width: 1600, height: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error || new Error('Property image upload failed'));
            return;
          }

          resolve(uploaded);
        }
      );

      upload.end(file);
    });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
    };
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
    const ext = path.extname(originalName).toLowerCase();
    const safeExtension = /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
    const objectKey = `${uuidv4()}${safeExtension}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(objectKey, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error('Document storage upload failed');
    }

    // Return document metadata
    return {
      id: objectKey,
      fileName: originalName,
      fileUrl: `${STORAGE_PREFIX}${objectKey}`,
      mimeType,
      size: file.length,
      uploadedAt: new Date(),
    };
  }

  /**
   * Delete a document
   */
  async delete(fileUrl: string): Promise<void> {
    const objectKey = this.getObjectKey(fileUrl);
    if (!objectKey) {
      return;
    }

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([objectKey]);

    if (error) {
      throw new Error('Document storage delete failed');
    }
  }

  async download(fileUrl: string): Promise<Buffer> {
    const objectKey = this.getObjectKey(fileUrl);
    if (!objectKey) {
      throw new Error('Invalid document storage reference');
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(objectKey);

    if (error || !data) {
      throw new Error('Document storage download failed');
    }

    return Buffer.from(await data.arrayBuffer());
  }

  getObjectKey(fileUrl: string): string | null {
    if (!fileUrl.startsWith(STORAGE_PREFIX)) {
      return null;
    }

    const objectKey = fileUrl.slice(STORAGE_PREFIX.length);
    if (!/^[a-f0-9-]{36}\.[a-z0-9]{1,10}$/i.test(objectKey) && !/^[a-f0-9-]{36}$/i.test(objectKey)) {
      return null;
    }

    return objectKey;
  }

  /**
   * Get document URL for viewing
   */
  getViewUrl(_fileUrl: string, documentId: string): string {
    return `/api/documents/${documentId}/preview`;
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
