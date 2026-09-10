"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WizardShell, type WizardSection } from "@/components/application/wizard-shell";
import {
  PersonalSection,
  HouseholdSection,
  EmploymentSection,
  IncomeSection,
  FinancialSection,
  HousingHistorySection,
  HousingNeedsSection,
  ProgramQuestionsSection,
  ReviewSection,
  type WizardData,
} from "@/components/application/wizard-sections";
import { ApplicantDocumentsSection } from "@/components/application/applicant-documents-section";
import { getMissingApplicantDocuments } from "@/lib/documents/applicant-requirements";
import type { RenderedQuestion } from "@/lib/forms/renderer";
import { supabase } from "@/lib/supabase/client";

/* ─── Section config ─────────────────────────────────────────── */
const STATIC_SECTIONS: WizardSection[] = [
  { id: "personal",        label: "Personal Information" },
  { id: "household",       label: "Household" },
  { id: "employment",      label: "Employment" },
  { id: "income",          label: "Income" },
  { id: "financial",       label: "Financial Information" },
  { id: "housing-history", label: "Housing History" },
  { id: "housing-needs",   label: "Housing Needs" },
  { id: "program-questions", label: "Program Questions" },
  { id: "documents",       label: "Documents" },
  { id: "review",          label: "Review & Submit" },
];

/* ─── Draft key ──────────────────────────────────────────────── */
function draftKey(slug: string) {
  return `heloci-app-draft-${slug}`;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function setNested(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!;
    if (i === parts.length - 1) { cur[p] = value; }
    else { if (!cur[p] || typeof cur[p] !== "object") cur[p] = {}; cur = cur[p] as Record<string, unknown>; }
  }
}

/* ─── Types ──────────────────────────────────────────────────── */
interface ProgramInfo {
  id: string;
  name: string;
  slug: string;
  requiredDocuments: unknown;
  organization?: { name: string } | null;
}

/* ─── Required fields per section ───────────────────────────── */
function sectionIsValid(sectionId: string, data: WizardData): boolean {
  if (sectionId === "personal") {
    return Boolean(
      data["personal.firstName"] && 
      data["personal.lastName"] && 
      data["personal.dateOfBirth"] &&
      data["personal.phone"] &&
      data["personal.email"] &&
      data["personal.ssn"] &&
      data["personal.driverLicense"] &&
      data["personal.dlState"] &&
      data["personal.citizenshipStatus"]
    );
  }
  if (sectionId === "household") {
    return Boolean(
      data["household.type"] && 
      data["household.householdSize"] &&
      data["household.adults"]
    );
  }
  if (sectionId === "employment") {
    const status = data["employment.status"];
    const isEmployed = ["employed_full_time", "employed_part_time", "self_employed"].includes(String(status));
    if (isEmployed) {
      return Boolean(status && data["employment.employerName"]);
    }
    return Boolean(status);
  }
  if (sectionId === "income") {
    const sources = data["income.sources"];
    if (!sources || (Array.isArray(sources) && sources.length === 0)) return false;
    // Must have either monthly income, annual income, or income range
    return Boolean(data["income.monthlyIncome"] || data["income.annualIncome"] || data["income.incomeRange"]);
  }
  if (sectionId === "financial") {
    return Boolean(data["financial.assets"] && Array.isArray(data["financial.assets"]) && data["financial.assets"].length > 0);
  }
  if (sectionId === "housing-history") {
    const situation = data["housing.currentHousingSituation"];
    const needsAddress = situation !== "homeless" && situation !== "vehicle" && situation !== "shelter";
    
    if (needsAddress) {
      return Boolean(
        situation &&
        data["housing.currentAddress"] &&
        data["housing.city"] &&
        data["housing.state"] &&
        data["housing.zipCode"] &&
        data["housing.county"]
      );
    }
    return Boolean(situation);
  }
  if (sectionId === "documents") {
    const missing = getMissingApplicantDocuments({
      identityType: typeof data["documents.identityType"] === "string" ? data["documents.identityType"] as "national_id" | "visa" | "drivers_license" : undefined,
      uploads: Array.isArray(data["_uploadedDocuments"]) ? data["_uploadedDocuments"] as Array<{ type: string }> : [],
    });
    return missing.length === 0;
  }
  return true; // all other sections are optional / advisory
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function ApplyPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  /* ── Remote state ── */
  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [programQuestions, setProgramQuestions] = useState<RenderedQuestion[]>([]);
  const [applicationId, setApplicationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Wizard state ── */
  const [sectionIndex, setSectionIndex] = useState(0);
  const [data, setData] = useState<WizardData>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);

  /* ── Load program + form + draft ── */
  useEffect(() => {
    if (!slug) return;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace(`/register?redirectTo=/apply/${slug}`);
        return;
      }
      setAuthChecked(true);
      setLoading(true);
      setLoadError(null);
      try {
        // Load program info
        const [progRes, formRes] = await Promise.all([
          fetch(`/api/programs/${slug}`),
          fetch(`/api/programs/${slug}/form?createDraft=true`),
        ]);
        if (!progRes.ok) { setLoadError("Program not found."); setLoading(false); return; }

        const progData = await progRes.json() as ProgramInfo;
        setProgram(progData);

        if (formRes.ok) {
          const formData = await formRes.json() as { pages: Array<{ questions: RenderedQuestion[] }>; applicationId: string };
          const questions = (formData.pages ?? []).flatMap((p) => p.questions);
          setProgramQuestions(questions);
          if (formData.applicationId) setApplicationId(formData.applicationId);
        }

        // Restore profile defaults
        const profileRes = await fetch("/api/applicant-profile");
        if (profileRes.ok) {
          const { profile } = await profileRes.json() as { profile: Record<string, unknown> };
          const defaults: WizardData = {};
          const p = profile as Record<string, Record<string, unknown>>;
          
          // Personal information (prefilled from profile and eligibility)
          if (p.personal?.firstName)      defaults["personal.firstName"]       = p.personal.firstName;
          if (p.personal?.middleName)     defaults["personal.middleName"]      = p.personal.middleName;
          if (p.personal?.lastName)       defaults["personal.lastName"]        = p.personal.lastName;
          if (p.personal?.fullName)       defaults["personal.fullName"]        = p.personal.fullName;
          if (p.personal?.preferredName)  defaults["personal.preferredName"]   = p.personal.preferredName;
          if (p.personal?.phone)          defaults["personal.phone"]           = p.personal.phone;
          if (p.personal?.secondaryPhone) defaults["personal.secondaryPhone"]  = p.personal.secondaryPhone;
          if (p.personal?.email)          defaults["personal.email"]           = p.personal.email;
          if (p.personal?.dateOfBirth)    defaults["personal.dateOfBirth"]     = p.personal.dateOfBirth;
          if (p.personal?.driverLicense)  defaults["personal.driverLicense"]   = p.personal.driverLicense;
          if (p.personal?.dlState)        defaults["personal.dlState"]         = p.personal.dlState;
          if (p.personal?.citizenshipStatus) defaults["personal.citizenshipStatus"] = p.personal.citizenshipStatus;
          if (p.personal?.preferredLanguage) defaults["personal.preferredLanguage"] = p.personal.preferredLanguage;
          if (p.personal?.isVeteran !== undefined) defaults["personal.isVeteran"] = String(p.personal.isVeteran);
          if (p.personal?.isDisabilityAffected !== undefined) defaults["personal.isDisabilityAffected"] = String(p.personal.isDisabilityAffected);
          
          // Household information (prefilled from profile and eligibility)
          if (p.household?.householdSize) defaults["household.householdSize"] = p.household.householdSize;
          if (p.household?.type)          defaults["household.type"]          = p.household.type;
          if (p.household?.adults)        defaults["household.adults"]        = p.household.adults;
          if (p.household?.children)      defaults["household.children"]      = p.household.children;
          if (p.household?.dependents)    defaults["household.dependents"]    = p.household.dependents;
          if (p.household?.elderlyMembers) defaults["household.elderlyMembers"] = p.household.elderlyMembers;
          if (p.household?.disabledMembers) defaults["household.disabledMembers"] = p.household.disabledMembers;
          if (p.household?.totalIncome)   defaults["household.totalIncome"]   = p.household.totalIncome;
          
          // Housing history (prefilled from profile)
          if (p.housing?.currentHousingSituation) defaults["housing.currentHousingSituation"] = p.housing.currentHousingSituation;
          if (p.housing?.currentAddress)  defaults["housing.currentAddress"]  = p.housing.currentAddress;
          if (p.housing?.city)            defaults["housing.city"]            = p.housing.city;
          if (p.housing?.state)           defaults["housing.state"]           = p.housing.state;
          if (p.housing?.zipCode)         defaults["housing.zipCode"]         = p.housing.zipCode;
          if (p.housing?.county)          defaults["housing.county"]          = p.housing.county;
          if (p.housing?.ownOrRent)       defaults["housing.ownOrRent"]       = p.housing.ownOrRent;
          if (p.housing?.monthlyRent)     defaults["housing.monthlyRent"]     = p.housing.monthlyRent;
          if (p.housing?.lengthOfResidence) defaults["housing.lengthOfResidence"] = p.housing.lengthOfResidence;
          
          // Income & Employment (prefilled from profile)
          if (p.income?.incomeRange)      defaults["income.incomeRange"]      = p.income.incomeRange;
          if (p.income?.employmentStatus) defaults["employment.status"]       = p.income.employmentStatus;
          if (p.employment?.status)       defaults["employment.status"]       = p.employment.status;
          if (p.employment?.employerName) defaults["employment.employerName"] = p.employment.employerName;
          if (p.employment?.occupation)   defaults["employment.occupation"]   = p.employment.occupation;
          if (p.employment?.isTeacher !== undefined) defaults["employment.isTeacher"] = String(p.employment.isTeacher);
          if (p.employment?.isHealthcareWorker !== undefined) defaults["employment.isHealthcareWorker"] = String(p.employment.isHealthcareWorker);
          if (p.employment?.isGovernmentEmployee !== undefined) defaults["employment.isGovernmentEmployee"] = String(p.employment.isGovernmentEmployee);
          
          // Income sources and amounts (prefilled from profile)
          if (Array.isArray(p.income?.sources)) defaults["income.sources"] = p.income.sources;
          if (p.income?.monthlyIncome)    defaults["income.monthlyIncome"]    = p.income.monthlyIncome;
          if (p.income?.annualIncome)     defaults["income.annualIncome"]     = p.income.annualIncome;
          if (p.income?.frequency)        defaults["income.frequency"]        = p.income.frequency;
          
          // Financial assets (prefilled from profile)
          if (Array.isArray(p.financial?.assets)) defaults["financial.assets"] = p.financial.assets;
          if (p.financial?.checkingBalance)    defaults["financial.checkingBalance"]    = p.financial.checkingBalance;
          if (p.financial?.savingsBalance)     defaults["financial.savingsBalance"]     = p.financial.savingsBalance;
          if (p.financial?.retirementBalance)  defaults["financial.retirementBalance"]  = p.financial.retirementBalance;
          if (p.financial?.investmentBalance)  defaults["financial.investmentBalance"]  = p.financial.investmentBalance;
          if (p.financial?.ownsProperty !== undefined) defaults["financial.ownsProperty"] = String(p.financial.ownsProperty);
          if (p.financial?.ownsVehicle !== undefined)  defaults["financial.ownsVehicle"]  = String(p.financial.ownsVehicle);
          
          // Preferences (prefilled from profile)
          if (Array.isArray(p.preferences?.preferredLocations)) defaults["preferences.preferredLocations"] = p.preferences.preferredLocations;

          // Merge with local draft (draft wins on conflicts)
          const raw = localStorage.getItem(draftKey(slug));
          const draft = raw ? (JSON.parse(raw) as { data?: WizardData; sectionIndex?: number }) : null;
          setData({ ...defaults, ...(draft?.data ?? {}) });
          if (typeof draft?.sectionIndex === "number") setSectionIndex(draft.sectionIndex);
        }
      } catch (err) {
        setLoadError((err as Error).message ?? "Unable to load application.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router, slug]);

  /* ── Persist draft on change ── */
  useEffect(() => {
    if (!slug || loading) return;
    try { localStorage.setItem(draftKey(slug), JSON.stringify({ data, sectionIndex })); }
    catch { /* ignore */ }
  }, [data, sectionIndex, slug, loading]);

  /* ── Scroll to top on section change ── */
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sectionIndex]);

  /* ── Derived ── */
  const currentSection = STATIC_SECTIONS[sectionIndex]!;
  const isLastStep = sectionIndex === STATIC_SECTIONS.length - 1;
  const sectionValid = sectionIsValid(currentSection.id, data);
  const canContinue = !sectionValid ? false : true;
  
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-slate-600">
        Checking your account…
      </div>
    );
  }

  /* ── Handlers ── */
  function handleChange(key: string, value: unknown) {
    setData((prev) => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
    setValidationError(null);
  }

  function handleBack() {
    setValidationError(null);
    setSectionIndex((i) => Math.max(0, i - 1));
  }

  function handleContinue() {
    if (!sectionIsValid(currentSection.id, data)) {
      if (currentSection.id === "documents") {
        const missing = getMissingApplicantDocuments({
          identityType: typeof data["documents.identityType"] === "string" ? data["documents.identityType"] as "national_id" | "visa" | "drivers_license" : undefined,
          uploads: Array.isArray(data["_uploadedDocuments"]) ? data["_uploadedDocuments"] as Array<{ type: string }> : [],
        });
        setValidationError(missing.join(" "));
      } else {
        setValidationError("Please fill in the required fields before continuing.");
      }
      return;
    }
    setValidationError(null);
    if (!isLastStep) {
      setSectionIndex((i) => i + 1);
      return;
    }
    void handleSubmit();
  }

  async function saveDraft() {
    if (!applicationId) return;
    setIsSaving(true);
    try {
      // Build profile-shaped payload and save to applicant profile
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null || value === "") continue;
        if (key.includes(".")) setNested(payload, key, value);
        else payload[key] = value;
      }
      payload.meta = { answers: data };
      await fetch("/api/applicant-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Save progress to application record
      await fetch(`/api/applications/${applicationId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageData: data, currentPage: sectionIndex }),
      });
      setSavedNotice("Progress saved — you can continue from here any time.");
    } catch { /* silent */ }
    finally { setIsSaving(false); }
  }

  async function handleSaveAndExit() {
    await saveDraft();
    router.push("/applicant/dashboard");
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setValidationError(null);
    try {
      await saveDraft();
      const res = await fetch(`/api/applications/${applicationId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = await res.json() as { error?: string; errors?: Record<string, string> };
      if (!res.ok) {
        // If there are field-level validation errors, show them
        if (json.errors) {
          const errorMessages = Object.entries(json.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join("; ");
          throw new Error(`Validation errors: ${errorMessages}`);
        }
        throw new Error(json.error ?? "Submission failed.");
      }
      try { localStorage.removeItem(draftKey(slug)); } catch { /* ignore */ }
      router.push(`/apply/${slug}/success`);
    } catch (err) {
      setValidationError((err as Error).message ?? "Unable to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Render section content ── */
  function renderSection() {
    switch (currentSection.id) {
      case "personal":        return <PersonalSection data={data} onChange={handleChange} />;
      case "household":       return <HouseholdSection data={data} onChange={handleChange} />;
      case "employment":      return <EmploymentSection data={data} onChange={handleChange} />;
      case "income":          return <IncomeSection data={data} onChange={handleChange} />;
      case "financial":       return <FinancialSection data={data} onChange={handleChange} />;
      case "housing-history": return <HousingHistorySection data={data} onChange={handleChange} />;
      case "housing-needs":   return <HousingNeedsSection data={data} onChange={handleChange} />;
      case "program-questions": return <ProgramQuestionsSection questions={programQuestions} data={data} onChange={handleChange} />;
      case "documents":
        return (
          <ApplicantDocumentsSection
            data={data}
            applicationId={applicationId}
            onChange={handleChange}
            onDocumentsChange={(docs) => {
              // Store document IDs in wizard data for tracking
              setData(prev => ({
                ...prev,
                "_uploadedDocuments": docs,
              }));
            }}
          />
        );
      case "review":
        return (
          <ReviewSection
            data={data}
            programName={program?.name ?? ""}
            onEditSection={(id) => {
              const idx = STATIC_SECTIONS.findIndex((s) => s.id === id);
              if (idx >= 0) setSectionIndex(idx);
            }}
          />
        );
      default: return null;
    }
  }

  /* ── Loading / error states ── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#006AFF]/20 border-t-[#006AFF]" />
          <p className="text-sm text-slate-600">Loading your application…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md space-y-4 text-center">
          <p className="text-lg font-semibold text-slate-900">We couldn't load this application</p>
          <p className="text-sm text-slate-600">{loadError}</p>
          <button type="button" onClick={() => router.push("/matches")} className="text-sm font-semibold text-[#006AFF] hover:underline">
            Return to matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef}>
      <WizardShell
        sections={STATIC_SECTIONS}
        currentIndex={sectionIndex}
        programName={program?.name ?? "Application"}
        canContinue={canContinue}
        isLastStep={isLastStep}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        onBack={handleBack}
        onContinue={handleContinue}
        onSaveAndExit={handleSaveAndExit}
        onJumpTo={(idx) => { if (idx <= sectionIndex) setSectionIndex(idx); }}
        validationError={validationError}
        savedNotice={savedNotice}
        onDismissSaved={() => setSavedNotice(null)}
      >
        {renderSection()}
      </WizardShell>
    </div>
  );
}
