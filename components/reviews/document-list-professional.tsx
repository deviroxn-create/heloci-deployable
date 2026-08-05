"use client";

import { useState, useMemo } from "react";
import { 
  FileText, File, FileImage, FileSpreadsheet, 
  Search, Filter, CheckCircle2, Clock, XCircle, 
  RefreshCw, AlertCircle, Download, Eye, ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentVerification {
  id: string | null;
  status: "pending" | "verified" | "rejected" | "needs_replacement";
  reviewedBy: string | null;
  reviewedByUser: { id: string; name: string | null } | null;
  reviewedAt: Date | null;
  notes: string | null;
  rejectionReason: string | null;
}

interface DocumentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: Date;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  verification: DocumentVerification | null;
  size?: number;
}

interface DocumentListProfessionalProps {
  documents: DocumentItem[];
  selectedDocumentId?: string | null;
  onSelectDocument: (document: DocumentItem) => void;
  onBulkSelect?: (documentIds: string[]) => void;
  selectedIds?: Set<string>;
}

export function DocumentListProfessional({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onBulkSelect,
  selectedIds = new Set()
}: DocumentListProfessionalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return FileImage;
    if (["pdf"].includes(ext || "")) return FileText;
    if (["xlsx", "xls", "csv"].includes(ext || "")) return FileSpreadsheet;
    return File;
  };

  const getStatusInfo = (verification: DocumentVerification | null) => {
    if (!verification) {
      return { 
        icon: Clock, 
        color: "warning", 
        label: "Pending Review",
        bgColor: "bg-warning/10",
        textColor: "text-warning",
        borderColor: "border-warning/20"
      };
    }

    switch (verification.status) {
      case "verified":
        return { 
          icon: CheckCircle2, 
          color: "success", 
          label: "Approved",
          bgColor: "bg-success/10",
          textColor: "text-success",
          borderColor: "border-success/20"
        };
      case "rejected":
        return { 
          icon: XCircle, 
          color: "error", 
          label: "Rejected",
          bgColor: "bg-error/10",
          textColor: "text-error",
          borderColor: "border-error/20"
        };
      case "needs_replacement":
        return { 
          icon: RefreshCw, 
          color: "warning", 
          label: "Replacement Requested",
          bgColor: "bg-warning/10",
          textColor: "text-warning",
          borderColor: "border-warning/20"
        };
      default:
        return { 
          icon: Clock, 
          color: "slate", 
          label: "Pending",
          bgColor: "bg-slate-100",
          textColor: "text-slate-600",
          borderColor: "border-slate-200"
        };
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDocumentType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.fileName.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query) ||
          doc.uploadedBy.name?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((doc) => {
        const status = doc.verification?.status || "pending";
        return status === statusFilter;
      });
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case "date-desc":
        sorted.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        break;
      case "date-asc":
        sorted.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
        break;
      case "name-asc":
        sorted.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.fileName.localeCompare(a.fileName));
        break;
      case "type":
        sorted.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }

    return sorted;
  }, [documents, searchQuery, statusFilter, sortBy]);

  const statusCounts = useMemo(() => {
    return {
      all: documents.length,
      pending: documents.filter(d => !d.verification || d.verification.status === "pending").length,
      verified: documents.filter(d => d.verification?.status === "verified").length,
      rejected: documents.filter(d => d.verification?.status === "rejected").length,
      needs_replacement: documents.filter(d => d.verification?.status === "needs_replacement").length,
    };
  }, [documents]);

  return (
    <Card className="rounded-[28px] border border-border bg-white p-4 sm:p-6 shadow-soft">
      {/* Header with Search and Filters */}
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-950">Document Review List</h3>
          <p className="text-sm text-slate-500 mt-1">
            {filteredAndSortedDocuments.length} of {documents.length} documents
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
              <SelectItem value="verified">Approved ({statusCounts.verified})</SelectItem>
              <SelectItem value="rejected">Rejected ({statusCounts.rejected})</SelectItem>
              <SelectItem value="needs_replacement">Replacement ({statusCounts.needs_replacement})</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ChevronDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="type">Document Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document List */}
      {filteredAndSortedDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-950 mb-2">
            {searchQuery || statusFilter !== "all" ? "No matching documents" : "No documents uploaded"}
          </h4>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "all" 
              ? "Try adjusting your search or filters"
              : "Documents will appear here once applicants upload them"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.fileName);
            const statusInfo = getStatusInfo(doc.verification);
            const StatusIcon = statusInfo.icon;
            const isSelected = doc.id === selectedDocumentId;

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={`rounded-xl border p-4 transition-all cursor-pointer ${
                  isSelected
                    ? `${statusInfo.borderColor} ${statusInfo.bgColor} ring-2 ring-brand/20`
                    : `border-border hover:border-brand/50 hover:shadow-md`
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div className={`flex-shrink-0 h-12 w-12 rounded-lg ${statusInfo.bgColor} flex items-center justify-center`}>
                    <FileIcon className={`h-6 w-6 ${statusInfo.textColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-950 truncate mb-1">
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDocumentType(doc.type)}
                        </p>
                      </div>
                      <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} flex-shrink-0`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                      <div>
                        <span className="font-medium">Uploaded:</span>{" "}
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                      <div className="truncate">
                        <span className="font-medium">By:</span>{" "}
                        {doc.uploadedBy.name || doc.uploadedBy.email}
                      </div>
                      {doc.size && (
                        <div>
                          <span className="font-medium">Size:</span>{" "}
                          {formatFileSize(doc.size)}
                        </div>
                      )}
                      {doc.verification?.reviewedByUser && (
                        <div className="truncate">
                          <span className="font-medium">Reviewer:</span>{" "}
                          {doc.verification.reviewedByUser.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
