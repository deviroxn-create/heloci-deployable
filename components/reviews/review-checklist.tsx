"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  completed: boolean;
  completedAt: Date | null;
  completedBy: string | null;
  notes: string | null;
  order: number;
}

interface ReviewChecklistProps {
  applicationId: string;
  organizationId: string;
  userId: string;
  onProgressUpdate?: (completedItems: number, totalItems: number) => void;
}

export function ReviewChecklist({
  applicationId,
  organizationId,
  userId,
  onProgressUpdate,
}: ReviewChecklistProps) {
  const [checklist, setChecklist] = useState<{
    id: string;
    completedItems: number;
    totalItems: number;
    completionRate: number;
    items: ChecklistItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    loadChecklist();
  }, [applicationId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reviews/checklist?applicationId=${applicationId}&organizationId=${organizationId}`
      );

      if (!response.ok) throw new Error("Failed to load checklist");

      const data = await response.json();
      setChecklist(data);

      if (onProgressUpdate) {
        onProgressUpdate(data.completedItems, data.totalItems);
      }
    } catch (error) {
      console.error("Error loading checklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    try {
      setUpdatingItem(itemId);
      const response = await fetch("/api/reviews/checklist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          completed,
          organizationId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update item");

      await loadChecklist();
    } catch (error) {
      console.error("Error toggling item:", error);
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleSaveNotes = async (itemId: string) => {
    try {
      const response = await fetch("/api/reviews/checklist/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          notes: noteText,
          organizationId,
        }),
      });

      if (!response.ok) throw new Error("Failed to save notes");

      await loadChecklist();
      setEditingNotes(null);
      setNoteText("");
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="rounded-[28px] border border-error/20 bg-error/5 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm font-medium text-error">Failed to load checklist</p>
        </div>
      </div>
    );
  }

  const completionPercentage = checklist.completionRate;

  return (
    <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-slate-950">Review Checklist</h3>
          <span className="text-sm font-semibold text-brand">
            {checklist.completedItems}/{checklist.totalItems}
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand to-brand/70 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">{completionPercentage.toFixed(0)}% Complete</p>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklist.items.map((item) => {
          const isEditing = editingNotes === item.id;
          const isUpdating = updatingItem === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition-all ${
                item.completed
                  ? "bg-success/5 border-success/20"
                  : "bg-white border-border hover:border-brand/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleItem(item.id, !item.completed)}
                  disabled={isUpdating}
                  className="flex-shrink-0 mt-0.5"
                >
                  {isUpdating ? (
                    <Loader2 className="h-5 w-5 animate-spin text-brand" />
                  ) : item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300 hover:text-brand transition" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      item.completed ? "text-slate-600 line-through" : "text-slate-950"
                    }`}
                  >
                    {item.label}
                  </p>

                  {item.completedAt && (
                    <p className="text-xs text-slate-500 mt-1">
                      Completed {new Date(item.completedAt).toLocaleDateString()}
                    </p>
                  )}

                  {item.notes && !isEditing && (
                    <div className="mt-2 rounded-lg bg-slate-50 p-2 border border-slate-200">
                      <p className="text-xs text-slate-700">{item.notes}</p>
                    </div>
                  )}

                  {isEditing && (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add notes about this verification..."
                        className="text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveNotes(item.id)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingNotes(null);
                            setNoteText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (isEditing) {
                      setEditingNotes(null);
                      setNoteText("");
                    } else {
                      setEditingNotes(item.id);
                      setNoteText(item.notes || "");
                    }
                  }}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 transition"
                >
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {checklist.completionRate === 100 && (
        <div className="rounded-xl bg-gradient-to-br from-success/10 to-success/20 p-4 border border-success/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Review Complete!</p>
              <p className="text-xs text-slate-600 mt-0.5">
                All checklist items have been verified. Ready for decision.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
