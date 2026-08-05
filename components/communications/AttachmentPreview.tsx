"use client";

import { useState, useMemo } from "react";
import {
  FileText, Download, X, Eye, AlertCircle, Image as ImageIcon,
  File, FileCode, FileArchive, Music, Video
} from "lucide-react";
import { Attachment } from "./ConversationWorkspace.types";

interface AttachmentPreviewProps {
  attachment: Attachment;
  onDownload?: (attachment: Attachment) => void;
  onPreview?: (attachment: Attachment) => void;
  onRemove?: (attachmentId: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

/**
 * Attachment Preview Component
 *
 * Displays inline preview for:
 * - Images (jpg, png, gif, webp)
 * - PDFs
 * - Office documents (docx, xlsx, pptx)
 * - Other files (generic preview with download)
 *
 * Features:
 * - Type detection with appropriate icons
 * - File size formatting
 * - Download functionality
 * - Quick preview/open
 * - Accessibility support
 */
export function AttachmentPreview({
  attachment,
  onDownload,
  onPreview,
  onRemove,
  readOnly = false,
  compact = false,
}: AttachmentPreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fileInfo = useMemo(() => {
    const extension = attachment.name.split(".").pop()?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension);
    const isPdf = extension === "pdf";
    const isOffice = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension);
    const isCode = ["js", "ts", "tsx", "jsx", "py", "java", "cpp", "cs", "rb", "go"].includes(
      extension
    );
    const isArchive = ["zip", "rar", "7z", "tar", "gz"].includes(extension);
    const isAudio = ["mp3", "wav", "aac", "flac", "ogg"].includes(extension);
    const isVideo = ["mp4", "webm", "avi", "mov", "mkv"].includes(extension);

    return {
      extension,
      isImage,
      isPdf,
      isOffice,
      isCode,
      isArchive,
      isAudio,
      isVideo,
    };
  }, [attachment.name]);

  const getIcon = () => {
    if (fileInfo.isImage) return <ImageIcon className="h-4 w-4" />;
    if (fileInfo.isPdf) return <FileText className="h-4 w-4" />;
    if (fileInfo.isOffice) return <FileText className="h-4 w-4" />;
    if (fileInfo.isCode) return <FileCode className="h-4 w-4" />;
    if (fileInfo.isArchive) return <FileArchive className="h-4 w-4" />;
    if (fileInfo.isAudio) return <Music className="h-4 w-4" />;
    if (fileInfo.isVideo) return <Video className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(attachment);
    } else {
      // Default download behavior
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(attachment);
    } else {
      setPreviewOpen(true);
    }
  };

  // Image preview
  if (fileInfo.isImage && !compact) {
    return (
      <div className="relative group inline-block">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-64 max-w-96 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition"
          onClick={handlePreview}
          onError={() => setLoadError(true)}
          role="button"
          tabIndex={0}
          aria-label={`Image: ${attachment.name}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handlePreview();
            }
          }}
        />

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 group-hover:bg-black/30 rounded-lg transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={handlePreview}
            className="p-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition"
            aria-label="Preview image"
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition"
            aria-label="Download image"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* Error state */}
        {loadError && (
          <div className="absolute inset-0 bg-slate-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
        )}
      </div>
    );
  }

  // PDF/Document preview
  if ((fileInfo.isPdf || fileInfo.isOffice) && !compact) {
    return (
      <div className="relative">
        <div
          className="bg-slate-100 rounded-lg border border-slate-200 p-6 cursor-pointer hover:bg-slate-200 transition flex flex-col items-center justify-center min-h-48 max-w-xs group"
          onClick={handlePreview}
          role="button"
          tabIndex={0}
          aria-label={`Document: ${attachment.name}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handlePreview();
            }
          }}
        >
          <FileText className="h-12 w-12 text-slate-400 mb-3 group-hover:text-slate-600 transition" />
          <p className="text-sm font-medium text-slate-700 text-center truncate w-full px-2">
            {attachment.name}
          </p>
          <p className="text-xs text-slate-500 mt-2">{formatFileSize(attachment.size)}</p>
          <p className="text-xs text-slate-400 mt-3 px-3 text-center">
            Click to preview or download
          </p>
        </div>
      </div>
    );
  }

  // Compact file item
  if (compact) {
    return (
      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-slate-300 transition group">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0 p-2 bg-slate-100 rounded text-slate-600">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-900 hover:text-brand truncate block"
              title={attachment.name}
            >
              {attachment.name}
            </a>
            <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition">
          {fileInfo.isImage || fileInfo.isPdf || fileInfo.isOffice ? (
            <button
              onClick={handlePreview}
              className="p-2 hover:bg-slate-200 rounded transition"
              aria-label="Preview attachment"
              title="Preview"
            >
              <Eye className="h-4 w-4 text-slate-600" />
            </button>
          ) : null}

          <button
            onClick={handleDownload}
            className="p-2 hover:bg-slate-200 rounded transition"
            aria-label="Download attachment"
            title="Download"
          >
            <Download className="h-4 w-4 text-slate-600" />
          </button>

          {!readOnly && onRemove && (
            <button
              onClick={() => onRemove(attachment.id)}
              className="p-2 hover:bg-red-100 rounded transition"
              aria-label="Remove attachment"
              title="Remove"
            >
              <X className="h-4 w-4 text-slate-600 hover:text-red-600" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default: generic file preview
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition">
      <div className="flex-shrink-0 p-2 bg-slate-100 rounded text-slate-600">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-slate-900 hover:text-brand truncate block"
          title={attachment.name}
        >
          {attachment.name}
        </a>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
          {attachment.uploadedBy && (
            <>
              <span className="text-xs text-slate-400">•</span>
              <p className="text-xs text-slate-500">by {attachment.uploadedBy.name}</p>
            </>
          )}
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="flex-shrink-0 p-2 hover:bg-slate-200 rounded transition"
        aria-label="Download attachment"
        title="Download"
      >
        <Download className="h-4 w-4 text-slate-600 hover:text-slate-900" />
      </button>

      {/* Preview button for supported types */}
      {fileInfo.isImage || fileInfo.isPdf ? (
        <button
          onClick={handlePreview}
          className="flex-shrink-0 p-2 hover:bg-slate-200 rounded transition"
          aria-label="Preview attachment"
          title="Preview"
        >
          <Eye className="h-4 w-4 text-slate-600 hover:text-slate-900" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Attachment List Component
 * Display multiple attachments
 */
interface AttachmentListProps {
  attachments: Attachment[];
  onDownload?: (attachment: Attachment) => void;
  onPreview?: (attachment: Attachment) => void;
  onRemove?: (attachmentId: string) => void;
  readOnly?: boolean;
  compact?: boolean;
  maxInline?: number; // Max items to show inline before collapsing
}

export function AttachmentList({
  attachments,
  onDownload,
  onPreview,
  onRemove,
  readOnly = false,
  compact = false,
  maxInline = 3,
}: AttachmentListProps) {
  const [showAll, setShowAll] = useState(false);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const visibleAttachments = showAll ? attachments : attachments.slice(0, maxInline);
  const hiddenCount = Math.max(0, attachments.length - maxInline);

  return (
    <div className="space-y-2">
      {visibleAttachments.map((attachment) => (
        <AttachmentPreview
          key={attachment.id}
          attachment={attachment}
          onDownload={onDownload}
          onPreview={onPreview}
          onRemove={onRemove}
          readOnly={readOnly}
          compact={compact}
        />
      ))}

      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm text-brand hover:underline font-medium"
        >
          Show {hiddenCount} more attachment{hiddenCount !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
