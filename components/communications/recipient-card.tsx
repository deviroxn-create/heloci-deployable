"use client";

import { memo } from "react";
import {
  Check, CheckCircle, Clock, Bell, Mail, Phone,
  Building2, Users
} from "lucide-react";
import type { RecipientCard as RecipientCardType } from "@/lib/communications/recipient.types";

interface RecipientCardProps {
  recipient: RecipientCardType;
  isSelected?: boolean;
  isRecent?: boolean;
  isFavorite?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  compact?: boolean;
  showCheckbox?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * RecipientCard Component
 * 
 * Displays recipient information with:
 * - Avatar/initials
 * - Name, role, email
 * - Department/organization
 * - Status indicator
 * - Recent/favorite badges
 * - Selection checkbox
 * - Notification preferences
 * 
 * Used in RecipientPicker and recipient lists
 */
export const RecipientCard = memo(function RecipientCard({
  recipient,
  isSelected = false,
  isRecent = false,
  isFavorite = false,
  onSelect,
  onRemove,
  compact = false,
  showCheckbox = true,
  onClick,
  className = "",
}: RecipientCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleLabel = {
    org_admin: "Admin",
    case_worker: "Case Worker",
    reviewer: "Reviewer",
    manager: "Manager",
    applicant: "Applicant",
  }[recipient.role] || recipient.role;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected && onRemove) {
      onRemove();
    } else if (!isSelected && onSelect) {
      onSelect();
    }
  };

  if (compact) {
    return (
      <div
        onClick={onClick || onSelect}
        className={`group flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:border-brand hover:bg-brand/5 cursor-pointer transition ${
          isSelected ? "bg-brand/10 border-brand" : "bg-white"
        } ${className}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick ? onClick() : onSelect?.();
          }
        }}
        aria-selected={isSelected}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showCheckbox && (
            <button
              onClick={handleCheckboxClick}
              className="flex-shrink-0 h-5 w-5 rounded border border-slate-300 bg-white hover:border-brand flex items-center justify-center transition"
              aria-label={isSelected ? "Deselect" : "Select"}
            >
              {isSelected && (
                <Check className="h-3 w-3 text-brand font-semibold" />
              )}
            </button>
          )}

          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
              {getInitials(recipient.name)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {recipient.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{recipient.email}</p>
          </div>
        </div>

        {/* Status indicator */}
        {recipient.status && recipient.status !== "offline" && (
          <div className="flex-shrink-0 h-2 w-2 rounded-full bg-success" title={recipient.status} />
        )}
      </div>
    );
  }

  // Full card layout
  return (
    <div
      onClick={onClick || onSelect}
      className={`group p-4 rounded-lg border transition cursor-pointer ${
        isSelected
          ? "bg-brand/10 border-brand shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300"
      } ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick ? onClick() : onSelect?.();
        }
      }}
      aria-selected={isSelected}
    >
      {/* Header with avatar and checkbox */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          {showCheckbox && (
            <button
              onClick={handleCheckboxClick}
              className="flex-shrink-0 h-5 w-5 rounded border-2 border-slate-300 bg-white hover:border-brand flex items-center justify-center transition mt-1"
              aria-label={isSelected ? "Deselect" : "Select"}
            >
              {isSelected && (
                <Check className="h-3 w-3 text-brand font-semibold" />
              )}
            </button>
          )}

          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand to-brand/50 flex items-center justify-center text-sm font-semibold text-white">
              {getInitials(recipient.name)}
            </div>
          </div>

          {/* Name and contact info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-slate-900">{recipient.name}</p>
              {isRecent && (
                <Badge className="text-xs bg-slate-100 text-slate-600">Recent</Badge>
              )}
              {isFavorite && (
                <Badge className="text-xs bg-yellow-100 text-yellow-700">★</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">{recipient.email}</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {recipient.status === "online" && (
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" title="Online" />
          )}
          {recipient.status === "idle" && (
            <div className="h-2 w-2 rounded-full bg-warning" title="Idle" />
          )}
        </div>
      </div>

      {/* Role and Department */}
      <div className="space-y-2 text-xs">
        <div className="flex flex-wrap gap-2">
          {/* Role badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-700">
            <Users className="h-3 w-3" />
            {roleLabel}
          </div>

          {/* Department badge */}
          {recipient.department && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700">
              <Building2 className="h-3 w-3" />
              {recipient.department}
            </div>
          )}
        </div>
      </div>

      {/* Notification preferences (if available) */}
      {recipient.notificationPreferences && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 text-xs">
          {recipient.notificationPreferences.email && (
            <div className="flex items-center gap-1 text-slate-600" title="Email enabled">
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </div>
          )}
          {recipient.notificationPreferences.inApp && (
            <div className="flex items-center gap-1 text-slate-600" title="In-app enabled">
              <Bell className="h-3 w-3" />
              <span>In-App</span>
            </div>
          )}
          {recipient.notificationPreferences.sms && (
            <div className="flex items-center gap-1 text-slate-600" title="SMS enabled">
              <Phone className="h-3 w-3" />
              <span>SMS</span>
            </div>
          )}
        </div>
      )}

      {/* Last contacted info */}
      {recipient.lastContactedAt && (
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last contacted {formatLastContacted(recipient.lastContactedAt)}
        </div>
      )}
    </div>
  );
});

RecipientCard.displayName = "RecipientCard";

// Helper component for Badge
const Badge = memo(function Badge({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {children}
    </span>
  );
});

/**
 * Helper: Format "last contacted" time
 */
function formatLastContacted(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
