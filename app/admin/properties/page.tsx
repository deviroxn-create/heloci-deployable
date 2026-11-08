"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, Edit3, ImagePlus, Loader2, MapPin, Plus, RefreshCw, Save, Trash2, Upload, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPropertyListingCategory } from "@/lib/properties/listing-category";

type Unit = { id: string; beds: number; price: number; available: boolean };
type Image = { id: string; url: string; altText: string | null };
type Property = { id: string; title: string; description: string; address: string; city: string; state: string; zip: string | null; rent: number; listingType: string | null; salePrice: number | null; bedrooms: number; bathrooms: number; sqft: number; status: string; availabilityStatusSource: "AUTOMATIC" | "STAFF" | "UNKNOWN"; publicationStatus: string; units: Unit[]; images: Image[] };
type Program = { id: string; name: string; housingGoal: string };
type Readiness = { status: string; checks: Record<string, boolean>; availableUnitCount: number; imageCount: number; readyForProgramAssignment: boolean };
type Assignment = { id: string; programId: string; propertyId: string; isActive: boolean; availableFrom: string | null; availableUntil: string | null; property: { title: string } };
type ReconciliationReport = {
  mode: "DRY_RUN" | "EXECUTED";
  previewToken: string;
  scanned: number;
  specialListingReview: number;
  eligibleForAvailabilityCorrection: number;
  eligibleForPublication: number;
  staffAvailabilityDecision: number;
  unknownAvailabilityDecision: number;
  remainUnavailable: number;
  needsMissingInformation: number;
  uncertainSourceStatus: number;
  confirmedInactive: number;
  unknownListingCategory: number;
  unchanged: number;
  appliedAvailabilityChanges: number;
  appliedPublicationChanges: number;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
  reasonCounts: Record<string, number>;
  candidates: Array<{
    id: string;
    title: string;
    listingCategory: "SALE" | "RENT" | "UNKNOWN";
    currentAvailability: string;
    availabilityStatusSource: "AUTOMATIC" | "STAFF" | "UNKNOWN";
    proposedAvailability: string;
    currentPublicationStatus: string;
    proposedPublicationStatus: string;
    sourceStatus: string | null;
    action: "AVAILABILITY" | "PUBLICATION" | "AVAILABILITY_AND_PUBLICATION" | "REVIEW";
    specialReview: boolean;
    reasons: string[];
    eligibleForAvailabilityCorrection: boolean;
    eligibleForPublication: boolean;
  }>;
  errors: Array<{ propertyId: string; message: string }>;
};
type SaleActivationReport = {
  organizationId: string;
  mode: "DRY_RUN" | "EXECUTED";
  scanned: number;
  approvedScopeSize: number;
  candidateCount: number;
  candidateIdDigest: string;
  previewToken: string;
  scopeMatchesApprovedSet: boolean;
  candidates: Array<{
    propertyId: string;
    externalId: string;
    salePrice: number;
    currentAvailability: string;
    currentPublicationStatus: string;
    currentAvailabilityProvenance: "UNKNOWN";
    currentPublicationProvenance: string;
    sourceStatus: string | null;
  }>;
  activatedCount: number;
  skippedCount: number;
  failedCount: number;
  auditEntriesCreated: number;
  auditEntriesVerified: number;
  auditVerified: boolean;
  persistedRecordsVerified: number;
  persistedStateVerified: boolean;
  reason: string;
  activatedAt: string | null;
};
type ProvenanceReviewReport = {
  organizationId: string;
  generatedAt: string;
  totalUnknown: number;
  categories: {
    strongAutomaticEvidence: number;
    staffReviewRequired: number;
    notEligibleForAutomaticApproval: number;
  };
  listingCategories: { rental: number; sale: number; unknown: number };
  currentAvailability: Record<string, number>;
  publicationStatus: Record<string, number>;
  candidates: Array<{
    id: string;
    title: string;
    description: string;
    address: string;
    externalId: string | null;
    sourceName: string | null;
    sourceIdentityValid: boolean;
    listingType: string | null;
    listingCategory: "RENT" | "SALE" | "UNKNOWN";
    availabilityStatusSource: "AUTOMATIC" | "STAFF" | "UNKNOWN";
    currentAvailability: string;
    availabilityCount: number;
    publicationStatus: string;
    sourceStatus: string | null;
    sourceStatusText: string | null;
    sourceMarketingStatus: string | null;
    sourcePropertyDetailsStatus: string | null;
    sourcePropertyDetailsStatusText: string | null;
    sourcePropertyDetailsMarketingStatus: string | null;
    normalizedSourceAvailability: "AVAILABLE" | "UNAVAILABLE" | "UNCERTAIN";
    rent: number;
    salePrice: number | null;
    rentalUnits: Array<{ beds: number; price: number; available: boolean }>;
    imageUrls: string[];
    missingOrInvalidInformation: string[];
    evidenceCategory: "STRONG_AUTOMATIC_EVIDENCE" | "STAFF_REVIEW_REQUIRED" | "NOT_ELIGIBLE_FOR_AUTOMATIC_APPROVAL";
    automaticApprovalEligible: boolean;
    evidence: string[];
    reviewReasons: string[];
    evidenceToken: string;
  }>;
};

const emptyForm = { title: "", description: "", address: "", city: "", state: "", zip: "", rent: "", salePrice: "", bedrooms: "", bathrooms: "", sqft: "" };
const emptyUnit = { beds: "", price: "", available: true };

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Property | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [unitForm, setUnitForm] = useState(emptyUnit);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [assignmentDates, setAssignmentDates] = useState({ availableFrom: "", availableUntil: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [reconciliation, setReconciliation] = useState<ReconciliationReport | null>(null);
  const [saleActivation, setSaleActivation] = useState<SaleActivationReport | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconciliationCategory, setReconciliationCategory] = useState("ALL");
  const [reconciliationAction, setReconciliationAction] = useState("ALL");
  const [provenanceReview, setProvenanceReview] = useState<ProvenanceReviewReport | null>(null);
  const [provenanceCategory, setProvenanceCategory] = useState("ALL");
  const [provenanceAvailability, setProvenanceAvailability] = useState("ALL");
  const [provenancePublication, setProvenancePublication] = useState("ALL");
  const [provenanceSearch, setProvenanceSearch] = useState("");
  const [provenanceReasons, setProvenanceReasons] = useState<Record<string, string>>({});
  const [provenanceEvidenceCategory, setProvenanceEvidenceCategory] = useState("ALL");
  const [provenanceStaffConfirmed, setProvenanceStaffConfirmed] = useState<Record<string, boolean>>({});
  const [provenanceDetailsOpened, setProvenanceDetailsOpened] = useState<Record<string, boolean>>({});
  const [provenanceBusyId, setProvenanceBusyId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [propertyResponse, programResponse] = await Promise.all([fetch("/api/admin/properties"), fetch("/api/admin/programs")]);
      const propertyBody = await propertyResponse.json();
      const programBody = await programResponse.json();
      if (!propertyResponse.ok) throw new Error(propertyBody.error || "Unable to load properties.");
      if (!programResponse.ok) throw new Error(programBody.error || "Unable to load programs.");
      setProperties(propertyBody.properties ?? []);
      setPrograms(Array.isArray(programBody) ? programBody : []);
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load properties."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadData(); }, []);

  async function openProperty(property: Property) {
    const propertyResponse = await fetch(`/api/admin/properties/${property.id}`);
    const propertyBody = await propertyResponse.json();
    const currentProperty = propertyResponse.ok ? propertyBody.property as Property : property;
    setSelected(currentProperty); setForm(propertyToForm(currentProperty)); setError(null); setNotice(null);
    const [readinessResponse, ...assignmentResponses] = await Promise.all([
      fetch(`/api/admin/properties/${property.id}/readiness`),
      ...programs.map((program) => fetch(`/api/admin/programs/${program.id}/properties`))
    ]);
    if (readinessResponse.ok) setReadiness(await readinessResponse.json());
    const found: Assignment[] = [];
    for (const response of assignmentResponses) {
      if (response.ok) {
        const body = await response.json();
        found.push(...(body.assignments ?? []).filter((assignment: Assignment) => assignment.propertyId === property.id));
      }
    }
    setAssignments(found);
  }

  async function request(url: string, init?: RequestInit) {
    const response = await fetch(url, init);
    const body = response.status === 204 ? null : await response.json();
    if (!response.ok && response.status !== 207) throw new Error(body?.error || "Unable to save property changes.");
    return body;
  }

  async function previewReconciliation() {
    setReconciling(true); setError(null); setNotice(null);
    try {
      const report = await request("/api/admin/properties/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true })
      }) as ReconciliationReport;
      setReconciliation(report);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to preview reconciliation.");
    } finally { setReconciling(false); }
  }

  async function previewSaleActivation() {
    setReconciling(true); setError(null); setNotice(null);
    try {
      const report = await request("/api/admin/properties/sale-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true })
      }) as SaleActivationReport;
      setSaleActivation(report);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to preview sale activation.");
    } finally { setReconciling(false); }
  }

  async function loadProvenanceReview() {
    setReconciling(true); setError(null); setNotice(null);
    try {
      const report = await request("/api/admin/properties/provenance") as ProvenanceReviewReport;
      setProvenanceReview(report);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load availability provenance review.");
    } finally { setReconciling(false); }
  }

  function provenanceFailureMessage(message: string) {
    if (message === "APPROVAL_REASON_TOO_SHORT") return "Enter a meaningful review reason of at least 12 characters.";
    if (message === "APPROVAL_REASON_TOO_LONG") return "Review reason must be 1000 characters or fewer.";
    if (message === "STAFF_INTENT_CONFIRMATION_REQUIRED") return "Confirm that the current availability decision is intentional before classifying it as staff-managed.";
    if (message === "AUTOMATIC_PROVENANCE_EVIDENCE_INSUFFICIENT") return "The current evidence does not qualify this property for automatic provenance.";
    if (message === "PROVENANCE_EVIDENCE_STALE" || message === "PROVENANCE_CONCURRENT_UPDATE" || message === "PROVENANCE_NOT_UNKNOWN_OR_NOT_FOUND") {
      return "This property changed or was classified after the report was generated. The report is being refreshed; inspect the current details before retrying.";
    }
    return message || "Unable to classify availability provenance.";
  }

  async function inspectProvenanceProperty(candidate: ProvenanceReviewReport["candidates"][number]) {
    const property = properties.find((item) => item.id === candidate.id);
    if (!property) {
      setError("Property details are not available in the current Admin list. Refresh properties and try again.");
      return;
    }
    try {
      await openProperty(property);
      setProvenanceDetailsOpened({ ...provenanceDetailsOpened, [candidate.id]: true });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to open property details.");
    }
  }

  async function approveProvenance(candidate: ProvenanceReviewReport["candidates"][number], decision: "AUTOMATIC" | "STAFF") {
    const reason = provenanceReasons[candidate.id]?.trim();
    if (!provenanceDetailsOpened[candidate.id]) {
      setError("Open and inspect this property's details before classifying its availability provenance.");
      return;
    }
    if (!reason || reason.length < 12) {
      setError("Enter a meaningful review reason of at least 12 characters.");
      return;
    }
    if (reason.length > 1000) {
      setError("Review reason must be 1000 characters or fewer.");
      return;
    }
    if (decision === "AUTOMATIC" && !candidate.automaticApprovalEligible) {
      setError("This record does not have evidence that qualifies for automatic provenance.");
      return;
    }
    if (decision === "STAFF" && !provenanceStaffConfirmed[candidate.id]) {
      setError("Confirm that the current availability decision is intentional before classifying it as staff-managed.");
      return;
    }
    const confirmed = window.confirm(
      `Classify availability provenance for ${candidate.title || candidate.id} as ${decision}? Current availability stays ${candidate.currentAvailability} and publication stays ${candidate.publicationStatus}.`
    );
    if (!confirmed) return;
    setProvenanceBusyId(candidate.id); setError(null); setNotice(null);
    try {
      await request(`/api/admin/properties/provenance/${candidate.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          reason,
          confirmIntentionalAvailability: decision === "STAFF" && provenanceStaffConfirmed[candidate.id] === true,
          evidenceToken: candidate.evidenceToken
        })
      });
      setReconciliation(null);
      await loadProvenanceReview();
      setNotice(`Availability provenance for ${candidate.title || candidate.id} set to ${decision}. Availability remains ${candidate.currentAvailability}; publication remains ${candidate.publicationStatus}.`);
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "";
      if (message === "PROVENANCE_EVIDENCE_STALE" || message === "PROVENANCE_CONCURRENT_UPDATE" || message === "PROVENANCE_NOT_UNKNOWN_OR_NOT_FOUND") {
        const staleMessage = provenanceFailureMessage(message);
        setProvenanceDetailsOpened({ ...provenanceDetailsOpened, [candidate.id]: false });
        await loadProvenanceReview();
        setError(staleMessage);
      } else {
        setError(provenanceFailureMessage(message));
      }
    } finally { setProvenanceBusyId(null); }
  }

  async function executeReconciliation() {
    if (!reconciliation || reconciliation.mode !== "DRY_RUN") return;
    const confirmed = window.confirm(
      `Apply the previewed corrections? ${reconciliation.eligibleForAvailabilityCorrection} availability changes and ${reconciliation.eligibleForPublication} publication changes may be applied. Special-review listings are excluded and require individual decisions.`
    );
    if (!confirmed) return;
    setReconciling(true); setError(null); setNotice(null);
    try {
      const report = await request("/api/admin/properties/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false, confirm: true, previewToken: reconciliation.previewToken })
      }) as ReconciliationReport;
      setReconciliation(report);
      setNotice(`Reconciliation finished: ${report.appliedCount} records applied, ${report.skippedCount} skipped, ${report.failedCount} failed (${report.appliedAvailabilityChanges} availability and ${report.appliedPublicationChanges} publication changes).`);
      await loadData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to execute reconciliation.");
    } finally { setReconciling(false); }
  }

  async function executeSaleActivation() {
    if (!saleActivation || saleActivation.mode !== "DRY_RUN" || !saleActivation.scopeMatchesApprovedSet) return;
    const confirmed = window.confirm(
      `Set availability to AVAILABLE and publication to PUBLISHED for exactly ${saleActivation.candidateCount} approved Zillow sale records? This is a STAFF decision; rental data and all other fields remain unchanged.`
    );
    if (!confirmed) return;
    setReconciling(true); setError(null); setNotice(null);
    try {
      const report = await request("/api/admin/properties/sale-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun: false,
          confirm: true,
          previewToken: saleActivation.previewToken,
          approvedPropertyIds: saleActivation.candidates.map((candidate) => candidate.propertyId)
        })
      }) as SaleActivationReport;
      setSaleActivation(report);
      if (!report.auditVerified || !report.persistedStateVerified) {
        setError(`Activation returned without complete verification: ${report.activatedCount} activated; ${report.persistedRecordsVerified}/${report.activatedCount} persisted records verified; ${report.auditEntriesVerified}/${report.activatedCount} audit entries verified. Do not retry until the persisted state and audit log are reviewed.`);
        return;
      }
      setReconciliation(null);
      setNotice(`Sale activation verified: ${report.activatedCount} activated; ${report.skippedCount} skipped; ${report.failedCount} failed; ${report.persistedRecordsVerified} persisted records and ${report.auditEntriesVerified} audit entries verified.`);
      await loadData();
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : "Unable to activate sale inventory.";
      setError(`Sale activation did not return a verified result. Do not retry until you refresh and check the property states and audit records. ${detail}`);
    } finally { setReconciling(false); }
  }

  async function savePublicationDecision(publicationStatus: string) {
    if (!selected) return;
    setSaving(true);
    try {
      await request(`/api/admin/properties/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicationStatus })
      });
      await loadData();
      await openProperty(selected);
      setNotice(`Publication decision set to ${publicationStatus.replaceAll("_", " ").toLowerCase()}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update publication decision.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAvailabilityDecision(status: "AVAILABLE" | "UNAVAILABLE") {
    if (!selected) return;
    const listingType = selected.listingType?.trim().toLowerCase().replace(/[_-]+/g, " ");
    const isSale = ["for sale", "sale", "buy", "purchase"].includes(listingType ?? "");
    const isRental = ["for rent", "rent", "rental", "lease"].includes(listingType ?? "");
    const availableUnitCount = selected.units.filter((unit) =>
      unit.available && Number.isInteger(unit.beds) && unit.beds >= 0 && Number.isSafeInteger(unit.price) && unit.price > 0
    ).length;
    if (status === "AVAILABLE" && (
      isSale && (!selected.salePrice || selected.salePrice <= 0)
      || isRental && (selected.rent <= 0 || availableUnitCount === 0)
      || !isSale && !isRental
    )) {
      setError("Availability cannot be set manually until the listing category and required price/unit data are valid.");
      return;
    }

    setSaving(true);
    try {
      await request(`/api/admin/properties/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, availabilityCount: status === "AVAILABLE" && isRental ? availableUnitCount : 0 })
      });
      await loadData();
      await openProperty(selected);
      setNotice(`Availability set to ${status.toLowerCase()}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update availability.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProperty(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return; setSaving(true);
    try { await request(`/api/admin/properties/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toPropertyInput(form)) }); setNotice("Property details saved."); await loadData(); if (selected) await openProperty({ ...selected, ...toPropertyInput(form) } as Property); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save property."); } finally { setSaving(false); }
  }

  async function createProperty(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try { await request("/api/admin/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toPropertyInput(form)) }); setForm(emptyForm); setShowCreate(false); setNotice("Property created."); await loadData(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create property."); } finally { setSaving(false); }
  }

  async function saveUnit(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return;
    try { await request(`/api/admin/properties/${selected.id}/units${editingUnit ? `?unitId=${editingUnit}` : ""}`, { method: editingUnit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ beds: Number(unitForm.beds), price: Number(unitForm.price), available: unitForm.available }) }); setUnitForm(emptyUnit); setEditingUnit(null); setNotice("Unit saved."); await loadData(); await openProperty(selected); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save unit."); }
  }

  async function deleteUnit(unitId: string) { if (!selected || !window.confirm("Remove this unit?")) return; try { await request(`/api/admin/properties/${selected.id}/units?unitId=${unitId}`, { method: "DELETE" }); setNotice("Unit removed."); await loadData(); await openProperty(selected); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to remove unit."); } }
  async function addImage(event: React.FormEvent) { event.preventDefault(); if (!selected) return; try { if (imageFile) { const body = new FormData(); body.set("file", imageFile); await request(`/api/admin/properties/${selected.id}/images`, { method: "POST", body }); } else { await request(`/api/admin/properties/${selected.id}/images`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: imageUrl }) }); } setImageUrl(""); setImageFile(null); setNotice("Image added."); await loadData(); await openProperty(selected); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to add image."); } }
  async function deleteImage(imageId: string) { if (!selected || !window.confirm("Remove this image?")) return; try { await request(`/api/admin/properties/${selected.id}/images?imageId=${imageId}`, { method: "DELETE" }); setNotice("Image removed."); await loadData(); await openProperty(selected); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to remove image."); } }

  async function saveAssignment(assignment?: Assignment, activeOverride?: boolean) {
    if (!selected || (!assignment && !selectedProgram)) return;
    try {
      const programId = assignment?.programId ?? selectedProgram;
      const url = assignment ? `/api/admin/programs/${programId}/properties/${assignment.id}` : `/api/admin/programs/${programId}/properties`;
      await request(url, { method: assignment ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: selected.id, isActive: activeOverride ?? assignment?.isActive ?? true, availableFrom: assignmentDates.availableFrom || null, availableUntil: assignmentDates.availableUntil || null }) });
      setSelectedProgram(""); setAssignmentDates({ availableFrom: "", availableUntil: "" }); setNotice("Program assignment saved."); await openProperty(selected);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save program assignment."); }
  }

  const availableUnits = selected?.units.filter((unit) => unit.available).length ?? 0;
  const filteredCandidates = reconciliation?.candidates.filter((candidate) => {
    const categoryMatches = reconciliationCategory === "ALL" || candidate.listingCategory === reconciliationCategory;
    const actionMatches = reconciliationAction === "ALL"
      || reconciliationAction === "SPECIAL_REVIEW" && candidate.specialReview
      || reconciliationAction === "AVAILABILITY" && candidate.eligibleForAvailabilityCorrection
      || reconciliationAction === "PUBLICATION" && candidate.eligibleForPublication
      || reconciliationAction === "REVIEW" && candidate.action === "REVIEW";
    return categoryMatches && actionMatches;
  }) ?? [];
  const filteredProvenance = provenanceReview?.candidates.filter((candidate) => {
    const categoryMatches = provenanceCategory === "ALL" || candidate.listingCategory === provenanceCategory;
    const availabilityMatches = provenanceAvailability === "ALL" || candidate.currentAvailability === provenanceAvailability;
    const publicationMatches = provenancePublication === "ALL" || candidate.publicationStatus === provenancePublication;
    const evidenceMatches = provenanceEvidenceCategory === "ALL" || candidate.evidenceCategory === provenanceEvidenceCategory;
    const query = provenanceSearch.trim().toLowerCase();
    const searchMatches = !query || [candidate.title, candidate.address, candidate.externalId]
      .some((value) => value?.toLowerCase().includes(query));
    return categoryMatches && availabilityMatches && publicationMatches && evidenceMatches && searchMatches;
  }) ?? [];
  return <AdminShell title="Property management" description="Manage property details, units, images, readiness, and program visibility." actions={<div className="flex gap-2"><Link href="/admin/properties/import"><Button size="sm" variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></Link><Button size="sm" onClick={() => { setForm(emptyForm); setShowCreate(true); }}><Plus className="mr-2 h-4 w-4" /> Add property</Button></div>}>
    {error && <div className="rounded-2xl border border-error/20 bg-error/5 p-4 text-sm text-error">{error}</div>}
    {notice && <div className="rounded-2xl border border-success/20 bg-success/5 p-4 text-sm text-success">{notice}</div>}
    <div className="grid gap-4 sm:grid-cols-3">{[{ label: "Owned listings", value: properties.length }, { label: "Available properties", value: properties.filter((property) => property.status === "AVAILABLE").length }, { label: "Needs setup", value: properties.filter((property) => property.status !== "AVAILABLE").length }].map((item) => <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p></div>)}</div>
    <section aria-labelledby="availability-provenance-heading" className="rounded-[28px] border border-border bg-white p-5 shadow-soft md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="availability-provenance-heading" className="text-lg font-semibold text-slate-950">Historical availability provenance review</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Review records with unknown decision origin. Provenance classification is separate from availability and publication status. Source listing status does not establish who set HELOCI availability; uncertain records remain UNKNOWN.</p>
        </div>
        <Button size="sm" variant="outline" disabled={reconciling} onClick={() => void loadProvenanceReview()}>
          {reconciling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Load review report
        </Button>
      </div>
      {provenanceReview && (
        <div className="mt-5 space-y-5">
          <p className="text-sm text-slate-600">Generated {new Date(provenanceReview.generatedAt).toLocaleString()} · {provenanceReview.totalUnknown} UNKNOWN records in this organization.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Strong automatic evidence", provenanceReview.categories.strongAutomaticEvidence],
              ["Staff review required", provenanceReview.categories.staffReviewRequired],
              ["Not eligible for automatic approval", provenanceReview.categories.notEligibleForAutomaticApproval],
              ["Rental listings", provenanceReview.listingCategories.rental],
              ["Sale listings", provenanceReview.listingCategories.sale],
              ["Unknown categories", provenanceReview.listingCategories.unknown]
            ].map(([label, count]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{count}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm font-medium text-slate-700">Listing type
              <select value={provenanceCategory} onChange={(event) => setProvenanceCategory(event.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2">
                <option value="ALL">All types</option><option value="RENT">Rental</option><option value="SALE">Sale</option><option value="UNKNOWN">Unknown</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Current availability
              <select value={provenanceAvailability} onChange={(event) => setProvenanceAvailability(event.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2">
                <option value="ALL">All statuses</option>{Object.keys(provenanceReview.currentAvailability).sort().map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Publication status
              <select value={provenancePublication} onChange={(event) => setProvenancePublication(event.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2">
                <option value="ALL">All statuses</option>{Object.keys(provenanceReview.publicationStatus).sort().map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Evidence category
              <select value={provenanceEvidenceCategory} onChange={(event) => setProvenanceEvidenceCategory(event.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2">
                <option value="ALL">All evidence categories</option>
                <option value="STRONG_AUTOMATIC_EVIDENCE">Strong automatic evidence</option>
                <option value="STAFF_REVIEW_REQUIRED">Staff review required</option>
                <option value="NOT_ELIGIBLE_FOR_AUTOMATIC_APPROVAL">Not eligible for automatic approval</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Search title, address, or external ID
              <input value={provenanceSearch} onChange={(event) => setProvenanceSearch(event.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2" />
            </label>
          </div>
          <p className="text-sm font-medium text-slate-700">Showing {filteredProvenance.length} of {provenanceReview.candidates.length} UNKNOWN records.</p>
          <div className="max-h-[42rem] space-y-3 overflow-auto">
            {filteredProvenance.map((candidate) => (
              <article key={candidate.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{candidate.title || "Untitled property"}</h3>
                    <p className="mt-1 text-sm text-slate-600">{candidate.address || "Address missing"} · {candidate.listingCategory} · ID {candidate.id}</p>
                    <p className="mt-2 text-sm text-slate-600">{candidate.description || "Description missing"}</p>
                    <p className="mt-1 text-xs text-slate-500">External ID: {candidate.externalId || "missing"} · Source: {candidate.sourceName || "unknown"} · Identity valid: {candidate.sourceIdentityValid ? "yes" : "no"}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{candidate.evidenceCategory.replaceAll("_", " ")}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <p>Provenance: <strong>{candidate.availabilityStatusSource}</strong></p>
                  <p>Availability: <strong>{candidate.currentAvailability}</strong> · count {candidate.availabilityCount}</p>
                  <p>Publication: <strong>{candidate.publicationStatus}</strong></p>
                  <p>Listing type: <strong>{candidate.listingType || "unknown"}</strong></p>
                  <p>Source status: {candidate.sourceStatus || "missing"} · {candidate.sourceStatusText || "no status text"}</p>
                  <p>Marketing status: {candidate.sourceMarketingStatus || candidate.sourcePropertyDetailsMarketingStatus || "missing"}</p>
                  <p>Property-details status: {candidate.sourcePropertyDetailsStatus || "missing"} · {candidate.sourcePropertyDetailsStatusText || "no status text"}</p>
                  <p>Normalized source availability: {candidate.normalizedSourceAvailability}</p>
                  <p>Rent: ${candidate.rent.toLocaleString()} · Sale price: {candidate.salePrice == null ? "missing" : `$${candidate.salePrice.toLocaleString()}`}</p>
                  <p className="sm:col-span-2">Units: {candidate.rentalUnits.length ? candidate.rentalUnits.map((unit) => `${unit.beds} beds / $${unit.price.toLocaleString()} / ${unit.available ? "available" : "unavailable"}`).join("; ") : "none"}</p>
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase text-slate-500">Property images ({candidate.imageUrls.length})</h4>
                  {candidate.imageUrls.length > 0
                    ? <div className="mt-1 flex flex-wrap gap-2">{candidate.imageUrls.map((url, index) => <a key={`${candidate.id}-image-${index}`} href={url} target="_blank" rel="noreferrer" className="text-sm text-brand underline">Open image {index + 1}</a>)}</div>
                    : <p className="mt-1 text-xs text-slate-500">No images recorded.</p>}
                </div>
                {(candidate.evidence.length > 0 || candidate.reviewReasons.length > 0 || candidate.missingOrInvalidInformation.length > 0) && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div><h4 className="text-xs font-semibold uppercase text-slate-500">Evidence</h4><ul className="mt-1 list-inside list-disc text-xs text-slate-700">{candidate.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div>
                    <div><h4 className="text-xs font-semibold uppercase text-slate-500">Review reasons</h4><ul className="mt-1 list-inside list-disc text-xs text-slate-700">{candidate.reviewReasons.map((item) => <li key={item}>{item}</li>)}</ul></div>
                    <div><h4 className="text-xs font-semibold uppercase text-slate-500">Missing / invalid</h4><ul className="mt-1 list-inside list-disc text-xs text-slate-700">{candidate.missingOrInvalidInformation.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  </div>
                )}
                <label className="mt-3 block text-sm font-medium text-slate-700">Review reason (at least 12 characters)
                  <textarea value={provenanceReasons[candidate.id] ?? ""} maxLength={1000} onChange={(event) => setProvenanceReasons({ ...provenanceReasons, [candidate.id]: event.target.value })} className="mt-1 w-full rounded-xl border border-border px-3 py-2" rows={2} />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void inspectProvenanceProperty(candidate)}>
                    {provenanceDetailsOpened[candidate.id] ? "Reopen property details" : "Open property details"}
                  </Button>
                  <Button size="sm" disabled={provenanceBusyId === candidate.id || !provenanceDetailsOpened[candidate.id] || !candidate.automaticApprovalEligible || (provenanceReasons[candidate.id]?.trim().length ?? 0) < 12} onClick={() => void approveProvenance(candidate, "AUTOMATIC")}>Classify as AUTOMATIC</Button>
                </div>
                <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={provenanceStaffConfirmed[candidate.id] ?? false}
                    onChange={(event) => setProvenanceStaffConfirmed({ ...provenanceStaffConfirmed, [candidate.id]: event.target.checked })}
                    disabled={!provenanceDetailsOpened[candidate.id] || provenanceBusyId === candidate.id}
                    className="mt-1"
                  />
                  <span>I inspected the property and verified that its current availability decision ({candidate.currentAvailability}) was intentionally made by staff and should be protected from automatic reconciliation. This does not change availability or publication.</span>
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button size="sm" variant="outline" disabled={provenanceBusyId === candidate.id || !provenanceDetailsOpened[candidate.id] || !provenanceStaffConfirmed[candidate.id] || (provenanceReasons[candidate.id]?.trim().length ?? 0) < 12} onClick={() => void approveProvenance(candidate, "STAFF")}>Classify as STAFF</Button>
                  <p className="text-xs text-slate-600">No decision leaves this property UNKNOWN. Classification never changes its availability or publication status.</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
    <section aria-labelledby="sale-activation-heading" className="rounded-[28px] border border-amber-300 bg-amber-50/50 p-5 shadow-soft md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="sale-activation-heading" className="text-lg font-semibold text-slate-950">Approved Zillow sale activation</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">One-time, organization-scoped activation for exactly the approved 416-record scope. The service revalidates every sale, requires a fresh preview token, applies only the four authorized decision fields, and writes one audit record per property.</p>
        </div>
        <Button size="sm" variant="outline" disabled={reconciling} onClick={() => void previewSaleActivation()}>
          {reconciling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Preview approved scope
        </Button>
      </div>
      {saleActivation && (
        <div className="mt-5 space-y-4">
          <p className="text-sm font-medium text-slate-700">
            {saleActivation.mode === "DRY_RUN" ? "Read-only preview" : "Activation result"}: scanned {saleActivation.scanned}; eligible {saleActivation.candidateCount}/{saleActivation.approvedScopeSize}.
            {saleActivation.mode === "DRY_RUN" && " No records were changed."}
          </p>
          <p className="break-all font-mono text-xs text-slate-600">Candidate ID digest: {saleActivation.candidateIdDigest}</p>
          {saleActivation.mode === "DRY_RUN" && (
            <Button size="sm" disabled={reconciling || !saleActivation.scopeMatchesApprovedSet} onClick={() => void executeSaleActivation()}>
              Activate and publish exactly 416 sales
            </Button>
          )}
          {saleActivation.mode === "EXECUTED" && (
            <p role={saleActivation.auditVerified && saleActivation.persistedStateVerified ? "status" : "alert"} className="text-sm font-semibold text-slate-800">
              {saleActivation.activatedCount} activated; {saleActivation.skippedCount} skipped; {saleActivation.failedCount} failed; {saleActivation.persistedRecordsVerified}/{saleActivation.activatedCount} properties and {saleActivation.auditEntriesVerified}/{saleActivation.activatedCount} audit entries verified.
            </p>
          )}
          <details>
            <summary className="cursor-pointer text-sm font-medium text-slate-700">Review exact candidate IDs ({saleActivation.candidates.length})</summary>
            <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-amber-200 bg-white p-3 font-mono text-xs">
              {saleActivation.candidates.map((candidate) => (
                <p key={candidate.propertyId}>{candidate.propertyId} · {candidate.externalId} · ${candidate.salePrice.toLocaleString()} · {candidate.currentAvailability}/{candidate.currentPublicationStatus}/{candidate.currentAvailabilityProvenance}</p>
              ))}
            </div>
          </details>
        </div>
      )}
    </section>
    <section aria-labelledby="property-reconciliation-heading" className="rounded-[28px] border border-border bg-white p-5 shadow-soft md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="property-reconciliation-heading" className="text-lg font-semibold text-slate-950">Imported property reconciliation</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Preview source-verified availability and publication corrections. Uncertain listings and records missing required details will remain unchanged and be flagged for review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={reconciling} onClick={() => void previewReconciliation()}>
            {reconciling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Preview
          </Button>
          {reconciliation?.mode === "DRY_RUN" && (
            <Button size="sm" disabled={reconciling || reconciliation.eligibleForAvailabilityCorrection + reconciliation.eligibleForPublication === 0} onClick={() => void executeReconciliation()}>
              Apply previewed changes
            </Button>
          )}
        </div>
      </div>
      {reconciliation && (
        <div className="mt-5 space-y-5">
          <p className="text-sm font-medium text-slate-700">
            {reconciliation.mode === "DRY_RUN" ? "Preview" : "Execution"} scanned {reconciliation.scanned} organization properties.
            {reconciliation.mode === "DRY_RUN" && " No records were changed."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Eligible for availability correction", reconciliation.eligibleForAvailabilityCorrection],
              ["Eligible for publication", reconciliation.eligibleForPublication],
              ["Staff-managed availability decisions", reconciliation.staffAvailabilityDecision],
              ["Unknown availability decision origin", reconciliation.unknownAvailabilityDecision],
              ["Will remain unavailable", reconciliation.remainUnavailable],
              ["Needs missing information", reconciliation.needsMissingInformation],
              ["Uncertain source status", reconciliation.uncertainSourceStatus],
              ["Confirmed inactive", reconciliation.confirmedInactive],
              ["Unknown listing category", reconciliation.unknownListingCategory],
              ["Special listings for individual review", reconciliation.specialListingReview]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
          {Object.keys(reconciliation.reasonCounts).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Review reasons</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {Object.entries(reconciliation.reasonCounts).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                  <li key={reason} className="flex items-start gap-2 text-sm text-slate-600">
                    <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span><strong className="text-slate-800">{count}</strong> — {reason.replaceAll("_", " ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {reconciliation.errors.length > 0 && (
            <div role="alert" className="rounded-2xl border border-error/20 bg-error/5 p-4 text-sm text-error">
              {reconciliation.appliedCount} records were applied, {reconciliation.skippedCount} skipped, and {reconciliation.failedCount} failed. Successful updates are retained in this report; review errors before creating a fresh preview.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Listing category
              <select value={reconciliationCategory} onChange={(event) => setReconciliationCategory(event.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2">
                <option value="ALL">All categories</option>
                <option value="SALE">Sale</option>
                <option value="RENT">Rental</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Proposed action
              <select value={reconciliationAction} onChange={(event) => setReconciliationAction(event.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2">
                <option value="ALL">All actions</option>
                <option value="AVAILABILITY">Availability change</option>
                <option value="PUBLICATION">Publication change</option>
                <option value="REVIEW">Review only</option>
                <option value="SPECIAL_REVIEW">Special listing review</option>
              </select>
            </label>
          </div>
          <p className="text-sm font-medium text-slate-700">Showing {filteredCandidates.length} of {reconciliation.candidates.length} candidate and review records.</p>
          <div className="max-h-[34rem] overflow-auto rounded-xl border border-border">
            <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3">Property</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Availability current → proposed</th>
                  <th className="p-3">Publication current → proposed</th>
                  <th className="p-3">Source status</th>
                  <th className="p-3">Reasons</th>
                  <th className="p-3">Review</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-t border-border align-top">
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{candidate.title || "Untitled property"}</p>
                      <p className="mt-1 font-mono text-[10px] text-slate-500">{candidate.id}</p>
                      {candidate.specialReview && <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-1 font-semibold text-amber-900">Special review</span>}
                    </td>
                    <td className="p-3">{candidate.listingCategory}</td>
                    <td className="p-3">{candidate.currentAvailability} → {candidate.proposedAvailability}<p className="mt-1 text-slate-500">Decision source: {candidate.availabilityStatusSource}</p></td>
                    <td className="p-3">{candidate.currentPublicationStatus} → {candidate.proposedPublicationStatus}</td>
                    <td className="max-w-48 whitespace-normal p-3">{candidate.sourceStatus || "Unknown"}</td>
                    <td className="max-w-64 whitespace-normal p-3">{candidate.reasons.map((reason) => reason.replaceAll("_", " ")).join("; ") || "No review reasons"}</td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" onClick={() => {
                        const property = properties.find((item) => item.id === candidate.id);
                        if (property) void openProperty(property);
                      }}>Review individually</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
    {loading ? <div className="mt-5 flex items-center gap-3 rounded-3xl bg-white p-8 text-slate-600"><Loader2 className="h-5 w-5 animate-spin text-brand" /> Loading properties...</div> : properties.length === 0 ? <div className="mt-5 rounded-[28px] border-2 border-dashed border-border bg-white p-10 text-center"><Building2 className="mx-auto h-10 w-10 text-brand/50" /><h2 className="mt-4 font-semibold">No owned properties yet</h2><Button className="mt-5" onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> Add property</Button></div> : <div className="mt-5 grid gap-5 xl:grid-cols-2">{properties.map((property) => <PropertyCard key={property.id} property={property} onOpen={() => void openProperty(property)} />)}</div>}
    {selected && <PropertyWorkspace property={selected} form={form} setForm={setForm} saving={saving} onSave={saveProperty} onAvailabilityDecision={saveAvailabilityDecision} onPublicationDecision={savePublicationDecision} readiness={readiness} availableUnits={availableUnits} unitForm={unitForm} setUnitForm={setUnitForm} editingUnit={editingUnit} setEditingUnit={setEditingUnit} onSaveUnit={saveUnit} onDeleteUnit={deleteUnit} imageUrl={imageUrl} setImageUrl={setImageUrl} imageFile={imageFile} setImageFile={setImageFile} onAddImage={addImage} onDeleteImage={deleteImage} programs={programs} assignments={assignments} selectedProgram={selectedProgram} setSelectedProgram={setSelectedProgram} assignmentDates={assignmentDates} setAssignmentDates={setAssignmentDates} onSaveAssignment={saveAssignment} onClose={() => setSelected(null)} />}
    {showCreate && <PropertyForm title="Add property" form={form} setForm={setForm} saving={saving} onSubmit={createProperty} onClose={() => setShowCreate(false)} />}
  </AdminShell>;
}

function PropertyCard({ property, onOpen }: { property: Property; onOpen: () => void }) { return <button type="button" onClick={onOpen} className="w-full rounded-[28px] border border-border bg-white p-6 text-left shadow-soft transition hover:border-brand/40"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><Building2 className="h-6 w-6 text-brand" /><div><h2 className="font-semibold text-slate-950">{property.title}</h2><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {property.city}, {property.state}</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">Property: {property.status}</span></div><div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm"><span><strong className="block text-slate-950">{property.units.length}</strong>total units</span><span><strong className="block text-slate-950">{property.units.filter((unit) => unit.available).length}</strong>available units</span><span><strong className="block text-slate-950">{property.images.length}</strong>images</span></div><p className="mt-5 text-sm font-semibold text-brand">Manage lifecycle <Edit3 className="ml-1 inline h-4 w-4" /></p></button>; }

function PropertyWorkspace({ property, form, setForm, saving, onSave, onAvailabilityDecision, onPublicationDecision, readiness, availableUnits, unitForm, setUnitForm, editingUnit, setEditingUnit, onSaveUnit, onDeleteUnit, imageUrl, setImageUrl, imageFile, setImageFile, onAddImage, onDeleteImage, programs, assignments, selectedProgram, setSelectedProgram, assignmentDates, setAssignmentDates, onSaveAssignment, onClose }: any) {
  const isSale = getPropertyListingCategory(property.listingType) === "SALE";
  const priceField = isSale ? "salePrice" : "rent";
  const priceLabel = isSale ? "Sale price" : "Monthly rent";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4">
      <div className="mx-auto my-6 max-w-6xl rounded-3xl bg-slate-50 p-5 shadow-xl md:p-8">
        <div className="flex items-start justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Property lifecycle</p><h2 className="mt-2 text-2xl font-semibold text-slate-950">{property.title}</h2></div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <section className="mt-5 rounded-2xl bg-white p-5">
          <h3 className="font-semibold">Availability decision · {property.status}</h3>
          <p className="mt-1 text-sm text-slate-600">Special and uncertain source listings require individual staff review before activation.</p>
          <div className="mt-3 flex flex-wrap gap-2">{["AVAILABLE", "UNAVAILABLE"].map((status) => <Button key={status} size="sm" variant="outline" disabled={saving || property.status === status} onClick={() => void onAvailabilityDecision(status)}>{status.replaceAll("_", " ")}</Button>)}</div>
        </section>
        <section className="mt-5 rounded-2xl bg-white p-5">
          <h3 className="font-semibold">Publication decision · {property.publicationStatus}</h3>
          <p className="mt-1 text-sm text-slate-600">Review this property individually before changing its publication state.</p>
          <div className="mt-3 flex flex-wrap gap-2">{["PENDING_REVIEW", "APPROVED_UNPUBLISHED", "PUBLISHED", "REJECTED"].map((status) => <Button key={status} size="sm" variant="outline" disabled={saving || property.publicationStatus === status} onClick={() => void onPublicationDecision(status)}>{status.replaceAll("_", " ")}</Button>)}</div>
        </section>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-5">
            <h3 className="font-semibold">Property details</h3>
            <form onSubmit={onSave} className="mt-4 grid gap-3 sm:grid-cols-2">
              {(["title", "address", "city", "state", "zip", "bedrooms", "bathrooms", "sqft"] as const).map((field) => (
                <label key={field} className="text-sm font-medium text-slate-700">{field}
                  <input required={field !== "zip"} type={["bedrooms", "bathrooms", "sqft"].includes(field) ? "number" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 w-full rounded-xl border border-border px-3 py-2" />
                </label>
              ))}
              <label className="text-sm font-medium text-slate-700">{priceLabel}
                <input required type="number" min="1" value={form[priceField]} onChange={(event) => setForm({ ...form, [priceField]: event.target.value })} className="mt-1 w-full rounded-xl border border-border px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">description
                <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-border px-3 py-2" />
              </label>
              <Button type="submit" disabled={saving} className="sm:col-span-2"><Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save details"}</Button>
            </form>
          </section>
          <ReadinessPanel readiness={readiness} availableUnits={availableUnits} />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {!isSale ? <UnitsPanel property={property} unitForm={unitForm} setUnitForm={setUnitForm} editingUnit={editingUnit} setEditingUnit={setEditingUnit} onSave={onSaveUnit} onDelete={onDeleteUnit} /> : null}
          <ImagesPanel property={property} imageUrl={imageUrl} setImageUrl={setImageUrl} imageFile={imageFile} setImageFile={setImageFile} onAdd={onAddImage} onDelete={onDeleteImage} />
        </div>
        <AssignmentsPanel programs={programs} assignments={assignments} selectedProgram={selectedProgram} setSelectedProgram={setSelectedProgram} dates={assignmentDates} setDates={setAssignmentDates} onSave={onSaveAssignment} readiness={readiness} />
      </div>
    </div>
  );
}

function ReadinessPanel({ readiness, availableUnits }: { readiness: Readiness | null; availableUnits: number }) { const checks = readiness ? [{ label: "Organization assigned", value: readiness.checks.organizationAssigned }, { label: "Required details", value: readiness.checks.requiredDetailsComplete }, { label: "Units entered", value: readiness.checks.unitsEntered }, { label: "Available units", value: readiness.checks.availableUnits }, { label: "Images entered", value: readiness.checks.imagesEntered }, { label: "Property status AVAILABLE", value: readiness.status === "AVAILABLE" }] : []; return <section className="rounded-2xl bg-white p-5"><h3 className="font-semibold">Canonical readiness</h3>{readiness ? <><p className="mt-2 text-sm text-slate-600">Property status: <strong>{readiness.status}</strong> · Available units: <strong>{availableUnits}</strong></p><div className="mt-4 grid gap-2">{checks.map((check) => <div key={check.label} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${check.value ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{check.value ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {check.label}</div>)}</div><p className="mt-4 text-sm font-semibold">{readiness.readyForProgramAssignment ? "Ready for active program assignment" : "Not ready for active program assignment"}</p></> : <p className="mt-3 text-sm text-slate-500">Loading readiness...</p>}</section>; }

function UnitsPanel({ property, unitForm, setUnitForm, editingUnit, setEditingUnit, onSave, onDelete }: any) { return <section className="rounded-2xl bg-white p-5"><h3 className="font-semibold">Units</h3><p className="mt-2 text-sm text-slate-600">Total: {property.units.length} · Available: {property.units.filter((unit: Unit) => unit.available).length} · Unavailable: {property.units.filter((unit: Unit) => !unit.available).length}</p><div className="mt-4 space-y-2">{property.units.map((unit: Unit) => <div key={unit.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"><span>{unit.beds} beds · ${unit.price.toLocaleString()} · {unit.available ? "Available" : "Unavailable"}</span><span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditingUnit(unit.id); setUnitForm({ beds: String(unit.beds), price: String(unit.price), available: unit.available }); }}>Edit</Button><Button size="sm" variant="outline" onClick={() => void onDelete(unit.id)}><Trash2 className="h-4 w-4" /></Button></span></div>)}</div><form onSubmit={onSave} className="mt-4 flex flex-wrap gap-2"><input required type="number" min="0" placeholder="Beds" value={unitForm.beds} onChange={(event) => setUnitForm({ ...unitForm, beds: event.target.value })} className="w-24 rounded-xl border border-border px-3 py-2" /><input required type="number" min="0" placeholder="Price" value={unitForm.price} onChange={(event) => setUnitForm({ ...unitForm, price: event.target.value })} className="w-28 rounded-xl border border-border px-3 py-2" /><label className="flex items-center gap-2 px-2 text-sm"><input type="checkbox" checked={unitForm.available} onChange={(event) => setUnitForm({ ...unitForm, available: event.target.checked })} /> Available</label><Button type="submit">{editingUnit ? "Save unit" : "Add unit"}</Button></form></section>; }

function ImagesPanel({ property, imageUrl, setImageUrl, imageFile, setImageFile, onAdd, onDelete }: any) { return <section className="rounded-2xl bg-white p-5"><h3 className="font-semibold">Images</h3><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{property.images.map((image: Image) => <div key={image.id} className="relative overflow-hidden rounded-xl border border-border"><img src={image.url} alt={image.altText || property.title} className="aspect-[4/3] w-full object-cover" /><button type="button" aria-label="Remove image" onClick={() => void onDelete(image.id)} className="absolute right-2 top-2 rounded-lg bg-white/90 p-2 text-error"><Trash2 className="h-4 w-4" /></button></div>)}</div><form onSubmit={onAdd} className="mt-4 grid gap-2"><input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="block w-full text-sm" /><div className="flex gap-2"><input type="url" placeholder="Or image URL" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-border px-3 py-2" /><Button type="submit"><ImagePlus className="mr-2 h-4 w-4" /> Add image</Button></div></form></section>; }

function AssignmentsPanel({ programs, assignments, selectedProgram, setSelectedProgram, dates, setDates, onSave, readiness }: any) { const selectedAssignment = assignments.find((assignment: Assignment) => assignment.programId === selectedProgram); return <section className="mt-5 rounded-2xl bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Program assignments</h3><p className="mt-1 text-sm text-slate-600">Active assignments are enabled only when canonical readiness passes.</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${readiness?.readyForProgramAssignment ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{readiness?.readyForProgramAssignment ? "Ready" : "Not ready"}</span></div><div className="mt-4 space-y-3">{assignments.map((assignment: Assignment) => <div key={assignment.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><strong>{programs.find((program: Program) => program.id === assignment.programId)?.name || assignment.programId}</strong><p className="text-xs text-slate-500">{assignment.isActive ? "Active" : "Inactive"} · {assignment.availableFrom ? new Date(assignment.availableFrom).toLocaleDateString() : "No start"} to {assignment.availableUntil ? new Date(assignment.availableUntil).toLocaleDateString() : "No end"}</p></div><Button size="sm" variant="outline" onClick={() => { setSelectedProgram(assignment.programId); setDates({ availableFrom: assignment.availableFrom?.slice(0, 10) || "", availableUntil: assignment.availableUntil?.slice(0, 10) || "" }); }}>{assignment.isActive ? "Edit dates / deactivate" : "Edit dates / activate"}</Button></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><select value={selectedProgram} onChange={(event) => setSelectedProgram(event.target.value)} className="rounded-xl border border-border px-3 py-2"><option value="">Assign a program...</option>{programs.filter((program: Program) => !assignments.some((assignment: Assignment) => assignment.programId === program.id)).map((program: Program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select><input type="date" value={dates.availableFrom} onChange={(event) => setDates({ ...dates, availableFrom: event.target.value })} className="rounded-xl border border-border px-3 py-2" /><input type="date" value={dates.availableUntil} onChange={(event) => setDates({ ...dates, availableUntil: event.target.value })} className="rounded-xl border border-border px-3 py-2" />{selectedAssignment ? <><Button onClick={() => void onSave(selectedAssignment)}>Save dates</Button><Button variant="outline" onClick={() => void onSave(selectedAssignment, !selectedAssignment.isActive)} disabled={!selectedAssignment.isActive && !readiness?.readyForProgramAssignment}>{selectedAssignment.isActive ? "Deactivate" : "Activate"}</Button></> : <Button onClick={() => void onSave()} disabled={!readiness?.readyForProgramAssignment || !selectedProgram}>Assign active</Button>}</div></section>; }

function PropertyForm({ title, form, setForm, saving, onSubmit, onClose }: any) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{title}</h2><Button type="button" variant="outline" onClick={onClose}>Close</Button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{(["title", "address", "city", "state", "zip", "rent", "bedrooms", "bathrooms", "sqft"] as const).map((field) => <label key={field} className="text-sm font-medium text-slate-700">{field}<input required={field !== "zip"} type={["rent", "bedrooms", "bathrooms", "sqft"].includes(field) ? "number" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 w-full rounded-xl border border-border px-3 py-2" /></label>)}<label className="text-sm font-medium text-slate-700 sm:col-span-2">description<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-border px-3 py-2" /></label></div><Button type="submit" disabled={saving} className="mt-6"><Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save property"}</Button></form></div>; }

function propertyToForm(property: Property) { return { title: property.title, description: property.description, address: property.address, city: property.city, state: property.state, zip: property.zip || "", rent: String(property.rent), salePrice: property.salePrice === null ? "" : String(property.salePrice), bedrooms: String(property.bedrooms), bathrooms: String(property.bathrooms), sqft: String(property.sqft) }; }
function toPropertyInput(form: typeof emptyForm) { return { ...form, rent: Number(form.rent), salePrice: form.salePrice ? Number(form.salePrice) : null, bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), sqft: Number(form.sqft), zip: form.zip || null }; }