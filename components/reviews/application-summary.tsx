"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, User, Home, Briefcase, DollarSign, FileText, Heart, Phone } from "lucide-react";

interface ApplicationSummaryProps {
  applicationData: Record<string, any>;
}

export function ApplicationSummary({ applicationData }: ApplicationSummaryProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["personal"]));

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Organize data into logical sections
  const sections = [
    {
      id: "personal",
      title: "Personal Information",
      icon: User,
      fields: [
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "dateOfBirth", label: "Date of Birth", format: "date" },
        { key: "ssn", label: "SSN", format: "sensitive" },
        { key: "citizenship", label: "Citizenship" },
        { key: "preferredLanguage", label: "Preferred Language" },
      ],
    },
    {
      id: "household",
      title: "Household Information",
      icon: Home,
      fields: [
        { key: "householdSize", label: "Household Size" },
        { key: "dependents", label: "Number of Dependents" },
        { key: "maritalStatus", label: "Marital Status" },
        { key: "veteranStatus", label: "Veteran Status", format: "boolean" },
        { key: "disabilityStatus", label: "Disability Status", format: "boolean" },
      ],
    },
    {
      id: "employment",
      title: "Employment Information",
      icon: Briefcase,
      fields: [
        { key: "employmentStatus", label: "Employment Status" },
        { key: "employer", label: "Employer" },
        { key: "jobTitle", label: "Job Title" },
        { key: "employmentDuration", label: "Duration" },
        { key: "publicWorkerStatus", label: "Public Worker", format: "boolean" },
      ],
    },
    {
      id: "income",
      title: "Income & Financial Information",
      icon: DollarSign,
      fields: [
        { key: "income", label: "Annual Income", format: "currency" },
        { key: "additionalIncome", label: "Additional Income", format: "currency" },
        { key: "assets", label: "Total Assets", format: "currency" },
        { key: "debts", label: "Total Debts", format: "currency" },
        { key: "creditScore", label: "Credit Score" },
      ],
    },
    {
      id: "housing",
      title: "Current Housing Situation",
      icon: Home,
      fields: [
        { key: "currentHousingStatus", label: "Housing Status" },
        { key: "currentAddress", label: "Current Address" },
        { key: "monthlyRent", label: "Monthly Rent", format: "currency" },
        { key: "reasonForApplication", label: "Reason for Application" },
        { key: "housingNeed", label: "Housing Need" },
      ],
    },
    {
      id: "preferences",
      title: "Housing Preferences",
      icon: Heart,
      fields: [
        { key: "preferredLocation", label: "Preferred Location" },
        { key: "bedroomsNeeded", label: "Bedrooms Needed" },
        { key: "accessibilityNeeds", label: "Accessibility Needs" },
        { key: "petOwner", label: "Pet Owner", format: "boolean" },
        { key: "smokingPreference", label: "Smoking Preference" },
      ],
    },
    {
      id: "emergency",
      title: "Emergency Contact",
      icon: Phone,
      fields: [
        { key: "emergencyContactName", label: "Contact Name" },
        { key: "emergencyContactRelation", label: "Relationship" },
        { key: "emergencyContactPhone", label: "Phone" },
        { key: "emergencyContactEmail", label: "Email" },
      ],
    },
  ];

  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined || value === "") return "—";

    switch (format) {
      case "currency":
        return typeof value === "number" ? `$${value.toLocaleString()}` : value;
      case "boolean":
        return value ? "Yes" : "No";
      case "date":
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      case "sensitive":
        return `***-**-${String(value).slice(-4)}`;
      default:
        return String(value);
    }
  };

  return (
    <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-950">Application Summary</h3>
        <p className="text-sm text-slate-500 mt-1">Complete submitted application data</p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const Icon = section.icon;

          // Check if section has any data
          const hasData = section.fields.some((field) => applicationData[field.key] !== undefined);

          if (!hasData) return null;

          return (
            <div
              key={section.id}
              className="rounded-xl border border-border bg-white overflow-hidden transition-all"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-950">{section.title}</p>
                    <p className="text-xs text-slate-500">
                      {section.fields.filter((f) => applicationData[f.key] !== undefined).length} fields
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="border-t border-border bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {section.fields.map((field) => {
                      const value = applicationData[field.key];
                      if (value === undefined) return null;

                      return (
                        <div key={field.key} className="rounded-lg bg-white p-3 border border-border">
                          <p className="text-xs font-semibold uppercase text-slate-500 mb-1">
                            {field.label}
                          </p>
                          <p className="text-sm font-medium text-slate-950">
                            {formatValue(value, field.format)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional/Unmapped Fields */}
      {(() => {
        const allMappedKeys = sections.flatMap((s) => s.fields.map((f) => f.key));
        const unmappedKeys = Object.keys(applicationData).filter((key) => !allMappedKeys.includes(key));

        if (unmappedKeys.length === 0) return null;

        const isExpanded = expandedSections.has("other");

        return (
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <button
              onClick={() => toggleSection("other")}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-950">Other Information</p>
                  <p className="text-xs text-slate-500">{unmappedKeys.length} additional fields</p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-border bg-slate-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {unmappedKeys.map((key) => (
                    <div key={key} className="rounded-lg bg-white p-3 border border-border">
                      <p className="text-xs font-semibold uppercase text-slate-500 mb-1">{key}</p>
                      <p className="text-sm font-medium text-slate-950 break-words">
                        {formatValue(applicationData[key])}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
