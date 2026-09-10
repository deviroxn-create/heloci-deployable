"use client";

import { useState } from "react";
import { DocumentUploader } from "@/components/documents/document-uploader";
import {
  APPLICANT_IDENTITY_DOCUMENTS,
  APPLICANT_INCOME_DOCUMENTS,
  APPLICANT_UTILITY_DOCUMENT,
  DOCUMENT_TYPES,
  type ApplicantIdentityDocument,
} from "@/lib/documents/categories";
import type { WizardData } from "@/components/application/wizard-sections";

export interface ApplicantUpload {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: Date;
}

interface ApplicantDocumentsSectionProps {
  data: WizardData;
  applicationId: string;
  onChange: (key: string, value: unknown) => void;
  onDocumentsChange: (documents: ApplicantUpload[]) => void;
}

function configFor(id: string) {
  const config = DOCUMENT_TYPES.find((document) => document.id === id);
  if (!config) throw new Error(`Missing document configuration: ${id}`);
  return config;
}

function UploadField({ label, documentType, applicationId, existingDocument, onUploadComplete, onDelete, required = true }: {
  label: string;
  documentType: ReturnType<typeof configFor>;
  applicationId: string;
  existingDocument?: ApplicantUpload;
  onUploadComplete: (document: ApplicantUpload) => void;
  onDelete: () => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-800">
        {label} <span className={required ? "text-red-600" : "text-slate-500"}>{required ? "Required" : "Optional"}</span>
      </p>
      <DocumentUploader
        documentType={documentType}
        applicationId={applicationId}
        existingDocument={existingDocument}
        onUploadComplete={onUploadComplete}
        onDelete={onDelete}
      />
    </div>
  );
}

export function ApplicantDocumentsSection({ data, applicationId, onChange, onDocumentsChange }: ApplicantDocumentsSectionProps) {
  const [identityType, setIdentityType] = useState<ApplicantIdentityDocument | undefined>(
    data["documents.identityType"] as ApplicantIdentityDocument | undefined
  );
  const [incomeType, setIncomeType] = useState<"w2" | "ein">(
    data["documents.incomeType"] === "ein" ? "ein" : "w2"
  );
  const [uploads, setUploads] = useState<ApplicantUpload[]>(
    Array.isArray(data["_uploadedDocuments"])
      ? data["_uploadedDocuments"] as ApplicantUpload[]
      : []
  );

  const identityConfig = identityType ? APPLICANT_IDENTITY_DOCUMENTS[identityType] : undefined;
  const identityFront = identityConfig ? configFor(identityConfig.frontId) : undefined;
  const identityBack = identityConfig ? configFor(identityConfig.backId) : undefined;
  const utilityBill = configFor(APPLICANT_UTILITY_DOCUMENT);
  const incomeConfig = configFor(APPLICANT_INCOME_DOCUMENTS[incomeType].id);

  function updateUploads(next: ApplicantUpload[]) {
    setUploads(next);
    onDocumentsChange(next);
  }

  function upload(document: ApplicantUpload) {
    updateUploads([...uploads.filter((item) => item.type !== document.type), document]);
  }

  function existing(type: string) {
    return uploads.find((document) => document.type === type);
  }

  function remove(type: string) {
    const document = existing(type);
    if (document) updateUploads(uploads.filter((item) => item.id !== document.id));
  }

  function chooseIdentity(value: ApplicantIdentityDocument) {
    setIdentityType(value);
    onChange("documents.identityType", value);
  }

  function chooseIncome(value: "w2" | "ein") {
    setIncomeType(value);
    onChange("documents.incomeType", value);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">Documents</h2>
        <p className="mt-2 text-base leading-7 text-slate-500">Provide one identity document. Utility and income documents are optional.</p>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Identity document <span className="text-sm font-medium text-red-600">Required</span></h3>
          <p className="mt-1 text-sm text-slate-600">Choose one identity document. Both front and back are required.</p>
        </div>
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="sr-only">Choose one identity document</legend>
          {Object.entries(APPLICANT_IDENTITY_DOCUMENTS).map(([value, option]) => (
            <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${identityType === value ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}>
              <input type="radio" name="identity-document" value={value} checked={identityType === value} onChange={() => chooseIdentity(value as ApplicantIdentityDocument)} />
              {option.label}
            </label>
          ))}
        </fieldset>
        {identityConfig && identityFront && identityBack && <div className="grid gap-5 sm:grid-cols-2">
          <UploadField label="Front" documentType={identityFront} applicationId={applicationId} existingDocument={existing(identityConfig.frontId)} onUploadComplete={upload} onDelete={() => remove(identityConfig.frontId)} />
          <UploadField label="Back" documentType={identityBack} applicationId={applicationId} existingDocument={existing(identityConfig.backId)} onUploadComplete={upload} onDelete={() => remove(identityConfig.backId)} />
        </div>}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Proof of address <span className="text-sm font-medium text-slate-500">Optional</span></h3>
          <p className="mt-1 text-sm text-slate-600">You may upload a recent utility bill.</p>
        </div>
        <UploadField label="Utility bill" required={false} documentType={utilityBill} applicationId={applicationId} existingDocument={existing(APPLICANT_UTILITY_DOCUMENT)} onUploadComplete={upload} onDelete={() => remove(APPLICANT_UTILITY_DOCUMENT)} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Income / employment <span className="text-sm font-medium text-slate-500">Optional</span></h3>
          <p className="mt-1 text-sm text-slate-600">You may provide W-2 or EIN documentation.</p>
        </div>
        <fieldset className="flex flex-wrap gap-4">
          <legend className="sr-only">Choose income document</legend>
          {Object.entries(APPLICANT_INCOME_DOCUMENTS).map(([value, option]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="radio" name="income-document" value={value} checked={incomeType === value} onChange={() => chooseIncome(value as "w2" | "ein")} />
              {option.label}
            </label>
          ))}
        </fieldset>
        <UploadField label={APPLICANT_INCOME_DOCUMENTS[incomeType].label} required={false} documentType={incomeConfig} applicationId={applicationId} existingDocument={existing(incomeConfig.id)} onUploadComplete={upload} onDelete={() => remove(incomeConfig.id)} />
      </section>
    </div>
  );
}
