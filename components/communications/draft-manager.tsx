"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Trash2,
  Edit2,
  Copy,
  MoreVertical,
  FileText,
  Users,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { DraftListLoadingSkeleton, CommunicationEmptyState } from "./communication-empty-states";

interface Draft {
  id: string;
  subject: string;
  recipientEmail: string;
  recipientName?: string;
  lastSavedAt: Date;
  attachments?: number;
  templateUsed?: string;
  body: string;
}

interface DraftManagerProps {
  drafts: Draft[];
  loading?: boolean;
  onEdit: (draft: Draft) => void;
  onDelete: (draftId: string) => void;
  onDuplicate: (draft: Draft) => void;
}

/**
 * Improved draft management interface
 * Shows rich draft metadata with actions
 */
export function DraftManager({
  drafts,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
}: DraftManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (loading) {
    return <DraftListLoadingSkeleton />;
  }

  if (drafts.length === 0) {
    return <CommunicationEmptyState type="no_drafts" onAction={() => {}} />;
  }

  return (
    <div className="space-y-2">
      {drafts.map(draft => (
        <DraftCard
          key={draft.id}
          draft={draft}
          isSelected={selectedId === draft.id}
          isDeleting={deleteConfirm === draft.id}
          onSelect={() => setSelectedId(draft.id)}
          onEdit={() => onEdit(draft)}
          onDelete={() => setDeleteConfirm(draft.id)}
          onConfirmDelete={() => {
            onDelete(draft.id);
            setDeleteConfirm(null);
          }}
          onCancelDelete={() => setDeleteConfirm(null)}
          onDuplicate={() => onDuplicate(draft)}
        />
      ))}
    </div>
  );
}

interface DraftCardProps {
  draft: Draft;
  isSelected: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDuplicate: () => void;
}

/**
 * Individual draft card with rich metadata
 */
function DraftCard({
  draft,
  isSelected,
  isDeleting,
  onSelect,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onDuplicate,
}: DraftCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      onClick={onSelect}
      className={`rounded-lg border p-4 transition-all cursor-pointer ${
        isSelected
          ? "border-brand bg-brand/5"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <FileText className="h-5 w-5 text-slate-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Subject & Recipients */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {draft.subject || "Untitled"}
              </h3>
              <div className="flex items-center gap-1 text-sm text-slate-600 mt-0.5">
                <Users className="h-3.5 w-3.5" />
                <span className="truncate">
                  {draft.recipientName || draft.recipientEmail}
                </span>
              </div>
            </div>

            {/* Delete Confirmation */}
            {isDeleting && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  className="px-3 py-1 text-xs font-medium text-white bg-error rounded hover:bg-error/90 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirmDelete();
                  }}
                >
                  Confirm
                </button>
                <button
                  className="px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelDelete();
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Actions Menu */}
            {!isDeleting && (
              <div
                className="relative flex-shrink-0"
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showActions && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-max">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2 first:rounded-t-lg"
                    >
                      <Edit2 className="h-4 w-4" />
                      Continue Editing
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate();
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-error/5 text-error flex items-center gap-2 last:rounded-b-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {draft.attachments && draft.attachments > 0 && (
              <span className="flex items-center gap-1">
                📎 {draft.attachments} attachment{draft.attachments !== 1 ? "s" : ""}
              </span>
            )}

            {draft.templateUsed && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                Template: {draft.templateUsed}
              </span>
            )}

            <span className="flex items-center gap-1 ml-auto flex-shrink-0">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(draft.lastSavedAt), { addSuffix: true })}
            </span>
          </div>

          {/* Preview */}
          {draft.body && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
              {draft.body}
            </p>
          )}
        </div>
      </div>

      {/* Autosave indicator */}
      {isSelected && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Autosave enabled
        </div>
      )}
    </div>
  );
}
