"use client";

/**
 * wizard-sections.tsx
 * Each exported component is one section of the application wizard.
 * They receive/emit a flat `data` object and are purely presentational.
 * No business logic — they write into the wizard's shared answer store.
 */

import { useState, useEffect } from "react";
import { FileText, Pencil, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { BooleanCards, RadioCards, NumericStepper, IncomeRangeSelector, TextInput, SearchableChips, MultiSelectCards } from "@/components/eligibility/question-inputs";
import { DocumentCard } from "@/components/documents/document-card";
import { 
  DOCUMENT_CATEGORIES, 
  getRequiredDocuments, 
  getOptionalDocuments,
  type DocumentCategory 
} from "@/lib/documents/categories";

/* ─── Shared types ─────────────────────────────────────────── */
export type WizardData = Record<string, unknown>;

interface SectionProps {
  data: WizardData;
  onChange: (key: string, value: unknown) => void;
}

/* ─── Section header ────────────────────────────────────────── */
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8 space-y-2">
      <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h2>
      <p className="text-base leading-7 text-slate-500">{description}</p>
    </div>
  );
}

/* ─── Field wrapper ─────────────────────────────────────────── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-800">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── 1. Personal Information ───────────────────────────────── */
const CITIZENSHIP_OPTIONS = [
  { value: "us_citizen", label: "U.S. Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "refugee", label: "Refugee" },
  { value: "asylee", label: "Asylee" },
  { value: "other_eligible", label: "Other Eligible Non-Citizen" },
  { value: "not_eligible", label: "Not Eligible" },
];

const LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "chinese", label: "Chinese" },
  { value: "vietnamese", label: "Vietnamese" },
  { value: "korean", label: "Korean" },
  { value: "russian", label: "Russian" },
  { value: "arabic", label: "Arabic" },
  { value: "tagalog", label: "Tagalog" },
  { value: "french", label: "French" },
  { value: "haitian_creole", label: "Haitian Creole" },
  { value: "other", label: "Other" },
];

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "District of Columbia" },
  { value: "MP", label: "Northern Mariana Islands" }, { value: "GU", label: "Guam" }, { value: "PR", label: "Puerto Rico" },
  { value: "VI", label: "U.S. Virgin Islands" }, { value: "UM", label: "U.S. Minor Outlying Islands" }
];

export function PersonalSection({ data, onChange }: SectionProps) {
  return (
    <div>
      <SectionHeader 
        title="Personal Information" 
        description="This information is used to verify your identity and determine program eligibility. All information is kept confidential and secure." 
      />
      
      <div className="space-y-8">
        {/* Legal Name */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Legal Name</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="First name" required>
              <TextInput 
                value={data["personal.firstName"]} 
                onChange={(v) => onChange("personal.firstName", v)} 
                placeholder="Legal first name" 
              />
            </Field>
            <Field label="Middle name">
              <TextInput 
                value={data["personal.middleName"]} 
                onChange={(v) => onChange("personal.middleName", v)} 
                placeholder="Middle name or initial" 
              />
            </Field>
            <Field label="Last name" required>
              <TextInput 
                value={data["personal.lastName"]} 
                onChange={(v) => onChange("personal.lastName", v)} 
                placeholder="Legal last name" 
              />
            </Field>
          </div>
        </div>

        {/* Preferred Name */}
        <Field label="Preferred name (if different from legal name)">
          <TextInput 
            value={data["personal.preferredName"]} 
            onChange={(v) => onChange("personal.preferredName", v)} 
            placeholder="Name you prefer to be called" 
          />
          <p className="mt-1 text-xs text-slate-500">We'll use this name when communicating with you</p>
        </Field>

        {/* Contact Information */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Contact Information</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary phone number" required>
              <TextInput 
                value={data["personal.phone"]} 
                onChange={(v) => onChange("personal.phone", v)} 
                placeholder="(555) 000-0000" 
              />
            </Field>
            <Field label="Secondary phone number">
              <TextInput 
                value={data["personal.secondaryPhone"]} 
                onChange={(v) => onChange("personal.secondaryPhone", v)} 
                placeholder="(555) 000-0000" 
              />
            </Field>
            <Field label="Email address" required>
              <TextInput 
                value={data["personal.email"]} 
                onChange={(v) => onChange("personal.email", v)} 
                placeholder="your.email@example.com" 
              />
            </Field>
          </div>
        </div>

        {/* Date of Birth */}
        <Field label="Date of birth" required>
          <input 
            type="date" 
            value={String(data["personal.dateOfBirth"] ?? "")} 
            onChange={(e) => onChange("personal.dateOfBirth", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20" 
          />
          <p className="mt-1 text-xs text-slate-500">Used to determine age-specific program eligibility (e.g., senior housing)</p>
        </Field>

        {/* SSN */}
        <Field label="Social Security Number" required>
          <input
            type="password"
            value={String(data["personal.ssn"] ?? "")}
            onChange={(e) => onChange("personal.ssn", e.target.value)}
            placeholder="***-**-****"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
          />
          <p className="mt-1 text-xs text-slate-500">Required for income verification and background checks. Encrypted and secure.</p>
        </Field>

        {/* Driver License / State ID */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Driver license or State ID number" required>
            <TextInput 
              value={data["personal.driverLicense"]} 
              onChange={(v) => onChange("personal.driverLicense", v)} 
              placeholder="ID number" 
            />
          </Field>
          <Field label="Issuing state" required>
            <select
              value={String(data["personal.dlState"] ?? "")}
              onChange={(e) => onChange("personal.dlState", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
            >
              <option value="">Select state</option>
              {US_STATES.map((state) => (
                <option key={state.value} value={state.value}>{state.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Citizenship Status */}
        <Field label="Citizenship or immigration status" required>
          <RadioCards 
            options={CITIZENSHIP_OPTIONS} 
            value={data["personal.citizenshipStatus"]} 
            onChange={(v) => onChange("personal.citizenshipStatus", v)} 
          />
          <p className="mt-2 text-xs text-slate-500">
            Many housing programs are available to U.S. citizens and eligible non-citizens including permanent residents, refugees, and asylees.
          </p>
        </Field>

        {/* Preferred Language */}
        <Field label="Preferred language for communication">
          <select
            value={String(data["personal.preferredLanguage"] ?? "english")}
            onChange={(e) => onChange("personal.preferredLanguage", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </Field>

        {/* Special Status */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Special Status & Eligibility</p>
          <div className="space-y-4">
            <Field label="Are you a U.S. military veteran?">
              <BooleanCards 
                value={data["personal.isVeteran"]} 
                onChange={(v) => onChange("personal.isVeteran", v)} 
              />
              <p className="mt-1 text-xs text-slate-500">Veterans may qualify for specialized housing programs and priority access</p>
            </Field>
            
            <Field label="Do you or anyone in your household have a disability?">
              <BooleanCards 
                value={data["personal.isDisabilityAffected"]} 
                onChange={(v) => onChange("personal.isDisabilityAffected", v)} 
              />
              <p className="mt-1 text-xs text-slate-500">Disability status may qualify you for accessible housing units and modified income limits</p>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 2. Household ──────────────────────────────────────────── */
const HOUSEHOLD_TYPE_OPTIONS = [
  { value: "single", label: "Single adult" },
  { value: "couple", label: "Couple (no children)" },
  { value: "family", label: "Family with children" },
  { value: "single_parent", label: "Single parent" },
  { value: "senior", label: "Senior household" },
  { value: "multigenerational", label: "Multigenerational household" },
  { value: "other", label: "Other" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "partner", label: "Domestic Partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "grandparent", label: "Grandparent" },
  { value: "grandchild", label: "Grandchild" },
  { value: "other_relative", label: "Other Relative" },
  { value: "non_relative", label: "Non-Relative" },
];

export function HouseholdSection({ data, onChange }: SectionProps) {
  const householdSize = Number(data["household.householdSize"] ?? 1);
  const adults = Number(data["household.adults"] ?? 1);
  const children = Number(data["household.children"] ?? 0);
  const dependents = Number(data["household.dependents"] ?? 0);
  
  // Initialize default values if not set
  useEffect(() => {
    if (data["household.householdSize"] === undefined) {
      onChange("household.householdSize", 1);
    }
    if (data["household.adults"] === undefined) {
      onChange("household.adults", 1);
    }
    if (data["household.children"] === undefined) {
      onChange("household.children", 0);
    }
  }, []);
  
  return (
    <div>
      <SectionHeader 
        title="Household Information" 
        description="Housing assistance is calculated based on household composition. Include all people who will live with you." 
      />
      
      <div className="space-y-8">
        {/* Household Type */}
        <Field label="Household type" required>
          <RadioCards 
            options={HOUSEHOLD_TYPE_OPTIONS} 
            value={data["household.type"]} 
            onChange={(v) => onChange("household.type", v)} 
          />
        </Field>

        {/* Household Size Breakdown */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Household Size</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Total household members" required>
              <NumericStepper 
                value={householdSize} 
                onChange={(v) => onChange("household.householdSize", v)} 
                min={1} 
                max={20} 
                suffix="people" 
              />
            </Field>
            
            <Field label="Adults (18+)" required>
              <NumericStepper 
                value={adults} 
                onChange={(v) => onChange("household.adults", v)} 
                min={1} 
                max={20} 
                suffix="adults" 
              />
            </Field>
            
            <Field label="Children (under 18)">
              <NumericStepper 
                value={children} 
                onChange={(v) => onChange("household.children", v)} 
                min={0} 
                max={15} 
                suffix="children" 
              />
            </Field>
            
            <Field label="Dependents">
              <NumericStepper 
                value={dependents} 
                onChange={(v) => onChange("household.dependents", v)} 
                min={0} 
                max={15} 
                suffix="dependents" 
              />
              <p className="mt-1 text-xs text-slate-500">Children, disabled adults, elderly requiring care</p>
            </Field>
          </div>
        </div>

        {/* Special Household Members */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Special Household Considerations</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Elderly household members (62+)">
              <NumericStepper 
                value={data["household.elderlyMembers"]} 
                onChange={(v) => onChange("household.elderlyMembers", v)} 
                min={0} 
                max={10} 
                suffix="elderly" 
              />
              <p className="mt-1 text-xs text-slate-500">Age 62 or older</p>
            </Field>
            
            <Field label="Household members with disabilities">
              <NumericStepper 
                value={data["household.disabledMembers"]} 
                onChange={(v) => onChange("household.disabledMembers", v)} 
                min={0} 
                max={10} 
                suffix="disabled" 
              />
              <p className="mt-1 text-xs text-slate-500">Any age with documented disability</p>
            </Field>
          </div>
        </div>

        {/* Household Members Detail */}
        {householdSize > 1 && (
          <div>
            <p className="mb-4 text-sm font-semibold text-slate-700">Household Members</p>
            <p className="mb-4 text-xs text-slate-500">
              Provide information about each household member. Click "Add Member" to add additional members.
            </p>
            
            <div className="space-y-4">
              {Array.from({ length: Math.min(householdSize - 1, 10) }, (_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Member {i + 2}</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="First name">
                      <TextInput 
                        value={data[`household.member${i + 2}.firstName`]} 
                        onChange={(v) => onChange(`household.member${i + 2}.firstName`, v)} 
                        placeholder="First name" 
                      />
                    </Field>
                    <Field label="Last name">
                      <TextInput 
                        value={data[`household.member${i + 2}.lastName`]} 
                        onChange={(v) => onChange(`household.member${i + 2}.lastName`, v)} 
                        placeholder="Last name" 
                      />
                    </Field>
                    <Field label="Date of birth">
                      <input 
                        type="date" 
                        value={String(data[`household.member${i + 2}.dateOfBirth`] ?? "")} 
                        onChange={(e) => onChange(`household.member${i + 2}.dateOfBirth`, e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20" 
                      />
                    </Field>
                    <Field label="Relationship to you">
                      <select
                        value={String(data[`household.member${i + 2}.relationship`] ?? "")}
                        onChange={(e) => onChange(`household.member${i + 2}.relationship`, e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                      >
                        <option value="">Select relationship</option>
                        {RELATIONSHIP_OPTIONS.map((rel) => (
                          <option key={rel.value} value={rel.value}>{rel.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="SSN (required for adults)">
                      <input
                        type="password"
                        value={String(data[`household.member${i + 2}.ssn`] ?? "")}
                        onChange={(e) => onChange(`household.member${i + 2}.ssn`, e.target.value)}
                        placeholder="***-**-****"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Household Income */}
        <Field label="Estimated total household income (all members combined)">
          <IncomeRangeSelector 
            value={data["household.totalIncome"]} 
            onChange={(v) => onChange("household.totalIncome", v)} 
          />
          <p className="mt-2 text-xs text-slate-500">
            Include income from all household members. This helps determine program eligibility and assistance amounts.
          </p>
        </Field>

        {/* Pregnancy Status */}
        <Field label="Is anyone in the household pregnant?">
          <BooleanCards 
            value={data["household.isPregnant"]} 
            onChange={(v) => onChange("household.isPregnant", v)} 
          />
          <p className="mt-1 text-xs text-slate-500">
            Pregnancy may increase household size for eligibility purposes
          </p>
        </Field>
      </div>
    </div>
  );
}

/* ─── 3. Employment ─────────────────────────────────────────── */
const EMPLOYMENT_OPTIONS = [
  { value: "employed_full_time", label: "Employed full-time" },
  { value: "employed_part_time", label: "Employed part-time" },
  { value: "self_employed", label: "Self-employed / Freelance" },
  { value: "unemployed", label: "Currently unemployed" },
  { value: "retired", label: "Retired" },
  { value: "student", label: "Full-time student" },
  { value: "disability_benefits", label: "On disability benefits" },
  { value: "homemaker", label: "Homemaker" },
  { value: "not_sure", label: "Prefer not to say" },
];

export function EmploymentSection({ data, onChange }: SectionProps) {
  const isEmployed = ["employed_full_time", "employed_part_time", "self_employed"].includes(
    String(data["employment.status"] ?? "")
  );

  return (
    <div>
      <SectionHeader 
        title="Employment Information" 
        description="Employment status affects program eligibility and income verification requirements." 
      />
      
      <div className="space-y-8">
        {/* Employment Status */}
        <Field label="Current employment status" required>
          <RadioCards 
            options={EMPLOYMENT_OPTIONS} 
            value={data["employment.status"]} 
            onChange={(v) => onChange("employment.status", v)} 
          />
        </Field>

        {/* Employment Details (shown if employed) */}
        {isEmployed && (
          <div className="space-y-6 rounded-2xl border border-blue-100 bg-blue-50/30 p-6">
            <p className="text-sm font-semibold text-slate-700">Employment Details</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employer name" required>
                <TextInput 
                  value={data["employment.employerName"]} 
                  onChange={(v) => onChange("employment.employerName", v)} 
                  placeholder="Company or organization name" 
                />
              </Field>
              
              <Field label="Your occupation or job title">
                <TextInput 
                  value={data["employment.occupation"]} 
                  onChange={(v) => onChange("employment.occupation", v)} 
                  placeholder="e.g., Teacher, Nurse, Manager" 
                />
              </Field>
            </div>

            <Field label="Employer address">
              <TextInput 
                value={data["employment.employerAddress"]} 
                onChange={(v) => onChange("employment.employerAddress", v)} 
                placeholder="123 Business St, City, State ZIP" 
              />
              <p className="mt-1 text-xs text-slate-500">Full address for employment verification</p>
            </Field>

            <Field label="How long have you worked for this employer?">
              <RadioCards
                options={[
                  { value: "less_than_6_months", label: "Less than 6 months" },
                  { value: "6_to_12_months", label: "6–12 months" },
                  { value: "1_to_2_years", label: "1–2 years" },
                  { value: "2_to_5_years", label: "2–5 years" },
                  { value: "over_5_years", label: "Over 5 years" },
                ]}
                value={data["employment.yearsEmployed"]}
                onChange={(v) => onChange("employment.yearsEmployed", v)}
              />
            </Field>

            <Field label="Average hours worked per week">
              <NumericStepper 
                value={data["employment.hoursPerWeek"]} 
                onChange={(v) => onChange("employment.hoursPerWeek", v)} 
                min={0} 
                max={80} 
                suffix="hours/week" 
              />
            </Field>
          </div>
        )}

        {/* Public Worker Status */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Special Employment Categories</p>
          <p className="mb-4 text-xs text-slate-500">
            Some housing programs offer priority access or special benefits for public service workers.
          </p>
          
          <div className="space-y-4">
            <Field label="Are you a K-12 teacher or educator?">
              <BooleanCards 
                value={data["employment.isTeacher"]} 
                onChange={(v) => onChange("employment.isTeacher", v)} 
              />
            </Field>
            
            <Field label="Are you a healthcare worker (nurse, doctor, medical staff)?">
              <BooleanCards 
                value={data["employment.isHealthcareWorker"]} 
                onChange={(v) => onChange("employment.isHealthcareWorker", v)} 
              />
            </Field>
            
            <Field label="Are you a government employee or first responder?">
              <BooleanCards 
                value={data["employment.isGovernmentEmployee"]} 
                onChange={(v) => onChange("employment.isGovernmentEmployee", v)} 
              />
              <p className="mt-1 text-xs text-slate-500">
                Includes police, fire, EMS, city/county/state/federal employees
              </p>
            </Field>

            {data["personal.isVeteran"] === "true" && (
              <Field label="Is this veteran-related employment?">
                <BooleanCards 
                  value={data["employment.isVeteranEmployment"]} 
                  onChange={(v) => onChange("employment.isVeteranEmployment", v)} 
                />
                <p className="mt-1 text-xs text-slate-500">
                  Employment through veteran services or programs
                </p>
              </Field>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 4. Income ─────────────────────────────────────────────── */
const INCOME_SOURCE_OPTIONS = [
  { value: "employment", label: "Employment Wages" },
  { value: "self_employment", label: "Self-Employment Income" },
  { value: "social_security", label: "Social Security" },
  { value: "ssi", label: "SSI (Supplemental Security Income)" },
  { value: "ssdi", label: "SSDI (Social Security Disability)" },
  { value: "pension", label: "Pension / Retirement" },
  { value: "veterans_benefits", label: "Veterans Benefits" },
  { value: "child_support", label: "Child Support" },
  { value: "alimony", label: "Alimony / Spousal Support" },
  { value: "unemployment", label: "Unemployment Benefits" },
  { value: "rental_income", label: "Rental Income" },
  { value: "tanf", label: "TANF (Temporary Assistance)" },
  { value: "snap", label: "SNAP / Food Stamps" },
  { value: "other", label: "Other Income" },
  { value: "no_income", label: "No Current Income" },
];

const INCOME_FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "bi_weekly", label: "Bi-Weekly (Every 2 weeks)" },
  { value: "semi_monthly", label: "Semi-Monthly (Twice a month)" },
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Annually" },
  { value: "irregular", label: "Irregular / Varies" },
];

export function IncomeSection({ data, onChange }: SectionProps) {
  const incomeSources = Array.isArray(data["income.sources"]) 
    ? data["income.sources"] 
    : [];
  const hasNoIncome = incomeSources.includes("no_income");

  return (
    <div>
      <SectionHeader
        title="Income Information"
        description="Income information determines program eligibility and assistance amounts. Include all sources of income for everyone in your household."
      />
      
      <div className="space-y-8">
        {/* Income Sources */}
        <Field label="Select all sources of income for your household" required>
          <MultiSelectCards
            options={INCOME_SOURCE_OPTIONS}
            value={incomeSources}
            onChange={(v) => onChange("income.sources", v)}
            helpText="Include income from all household members"
          />
        </Field>

        {/* Monthly Income */}
        {!hasNoIncome && (
          <div className="space-y-6 rounded-2xl border border-green-100 bg-green-50/30 p-6">
            <p className="text-sm font-semibold text-slate-700">Income Amounts</p>
            
            <Field label="Total monthly household income (before taxes)" required>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  value={String(data["income.monthlyIncome"] ?? "")}
                  onChange={(e) => onChange("income.monthlyIncome", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="3500"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Combined gross income from all household members before taxes and deductions
              </p>
            </Field>

            <Field label="Or, if you prefer, total annual household income">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  value={String(data["income.annualIncome"] ?? "")}
                  onChange={(e) => onChange("income.annualIncome", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="42000"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                You can provide either monthly or annual income
              </p>
            </Field>

            <Field label="How often is income received?">
              <RadioCards
                options={INCOME_FREQUENCY_OPTIONS}
                value={data["income.frequency"]}
                onChange={(v) => onChange("income.frequency", v)}
              />
            </Field>
          </div>
        )}

        {/* Income Range (Alternate) */}
        <Field label="Or select your income range if you're not sure of exact amount">
          <IncomeRangeSelector 
            value={data["income.incomeRange"]} 
            onChange={(v) => onChange("income.incomeRange", v)} 
          />
          <p className="mt-2 text-xs text-slate-500">
            This is used as a backup if exact income is not provided
          </p>
        </Field>

        {/* Additional Income Details */}
        {!hasNoIncome && incomeSources.length > 0 && (
          <div>
            <p className="mb-4 text-sm font-semibold text-slate-700">Additional Income Details (Optional)</p>
            
            {incomeSources.includes("employment") && (
              <Field label="Employment income amount (monthly)">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={String(data["income.employmentAmount"] ?? "")}
                    onChange={(e) => onChange("income.employmentAmount", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="2500"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                  />
                </div>
              </Field>
            )}

            {incomeSources.includes("self_employment") && (
              <Field label="Self-employment income (monthly average)">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={String(data["income.selfEmploymentAmount"] ?? "")}
                    onChange={(e) => onChange("income.selfEmploymentAmount", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="1500"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                  />
                </div>
              </Field>
            )}

            {(incomeSources.includes("social_security") || incomeSources.includes("ssi") || incomeSources.includes("ssdi")) && (
              <Field label="Social Security / SSI / SSDI (monthly)">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={String(data["income.benefitsAmount"] ?? "")}
                    onChange={(e) => onChange("income.benefitsAmount", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="900"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                  />
                </div>
              </Field>
            )}

            {incomeSources.includes("child_support") && (
              <Field label="Child support received (monthly)">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={String(data["income.childSupportAmount"] ?? "")}
                    onChange={(e) => onChange("income.childSupportAmount", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="500"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                  />
                </div>
              </Field>
            )}

            {incomeSources.includes("other") && (
              <Field label="Other income description">
                <TextInput 
                  value={data["income.otherDescription"]} 
                  onChange={(v) => onChange("income.otherDescription", v)} 
                  placeholder="Describe other income source" 
                />
              </Field>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 5. Financial Information ──────────────────────────────── */
const ASSET_OPTIONS = [
  { value: "checking", label: "Checking Account" },
  { value: "savings", label: "Savings Account" },
  { value: "retirement", label: "Retirement Account (401k, IRA)" },
  { value: "investments", label: "Investment Account / Stocks / Bonds" },
  { value: "cash", label: "Cash on Hand" },
  { value: "property", label: "Property / Real Estate" },
  { value: "vehicle", label: "Vehicle(s)" },
  { value: "no_assets", label: "No significant assets" },
];

export function FinancialSection({ data, onChange }: SectionProps) {
  const assets = Array.isArray(data["financial.assets"]) 
    ? data["financial.assets"] 
    : [];
  const hasNoAssets = assets.includes("no_assets");

  return (
    <div>
      <SectionHeader
        title="Financial Information"
        description="Asset information helps determine program eligibility. Many programs have asset limits for qualification."
      />
      
      <div className="space-y-8">
        {/* Assets */}
        <Field label="Select all assets your household owns" required>
          <MultiSelectCards
            options={ASSET_OPTIONS}
            value={assets}
            onChange={(v) => onChange("financial.assets", v)}
            helpText="Include assets from all household members"
          />
        </Field>

        {/* Asset Details (shown if has assets) */}
        {!hasNoAssets && assets.length > 0 && (
          <div className="space-y-6 rounded-2xl border border-purple-100 bg-purple-50/30 p-6">
            <p className="text-sm font-semibold text-slate-700">Asset Balances (Optional)</p>
            <p className="text-xs text-slate-500">
              Provide approximate balances. This information helps with eligibility calculations.
            </p>
            
            {assets.includes("checking") && (
              <Field label="Checking account balance">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={String(data["financial.checkingBalance"] ?? "")}
                    onChange={(e) => onChange("financial.checkingBalance", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                  />
                </div>
              </Field>
            )}

            {assets.includes("savings") && (
              <Field label="Savings account balance">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={String(data["financial.savingsBalance"] ?? "")}
                    onChange={(e) => onChange("financial.savingsBalance", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                  />
                </div>
              </Field>
            )}

            {assets.includes("retirement") && (
              <Field label="Retirement account balance">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={String(data["financial.retirementBalance"] ?? "")}
                    onChange={(e) => onChange("financial.retirementBalance", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                  />
                </div>
              </Field>
            )}

            {assets.includes("investments") && (
              <Field label="Investment account balance">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={String(data["financial.investmentBalance"] ?? "")}
                    onChange={(e) => onChange("financial.investmentBalance", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                  />
                </div>
              </Field>
            )}

            {assets.includes("cash") && (
              <Field label="Cash on hand">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={String(data["financial.cashOnHand"] ?? "")}
                    onChange={(e) => onChange("financial.cashOnHand", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                  />
                </div>
              </Field>
            )}

            {assets.includes("property") && (
              <div>
                <Field label="Do you own property or real estate?">
                  <BooleanCards 
                    value={data["financial.ownsProperty"]} 
                    onChange={(v) => onChange("financial.ownsProperty", v)} 
                  />
                </Field>
                
                {data["financial.ownsProperty"] === "true" && (
                  <Field label="Estimated property value">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        value={String(data["financial.propertyValue"] ?? "")}
                        onChange={(e) => onChange("financial.propertyValue", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="0"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                      />
                    </div>
                  </Field>
                )}
              </div>
            )}

            {assets.includes("vehicle") && (
              <div>
                <Field label="Do you own a vehicle?">
                  <BooleanCards 
                    value={data["financial.ownsVehicle"]} 
                    onChange={(v) => onChange("financial.ownsVehicle", v)} 
                  />
                </Field>
                
                {data["financial.ownsVehicle"] === "true" && (
                  <div className="space-y-4">
                    <Field label="Vehicle make and model">
                      <TextInput 
                        value={data["financial.vehicleMakeModel"]} 
                        onChange={(v) => onChange("financial.vehicleMakeModel", v)} 
                        placeholder="e.g., 2015 Honda Civic" 
                      />
                    </Field>
                    
                    <Field label="Estimated vehicle value">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <input
                          type="number"
                          value={String(data["financial.vehicleValue"] ?? "")}
                          onChange={(e) => onChange("financial.vehicleValue", e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="0"
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                        />
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 6. Banking Information ────────────────────────────────── */
import { maskBankAccount, maskRoutingNumber, isValidRoutingNumber } from "@/lib/security/encryption";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
];

export function BankingSection({ data, onChange }: SectionProps) {
  return (
    <div>
      <SectionHeader
        title="Banking Information"
        description="Banking information is required for direct deposit of housing assistance payments. This information is encrypted and secure."
      />
      
      <div className="space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">Secure information</p>
          <p className="mt-1 text-xs text-slate-600">
            Your banking information is encrypted and stored securely. It will only be used for housing assistance payments and is never shared with third parties.
          </p>
        </div>

        <Field label="Bank name" required>
          <TextInput 
            value={data["banking.bankName"]} 
            onChange={(v) => onChange("banking.bankName", v)} 
            placeholder="e.g., Wells Fargo, Chase, Bank of America" 
          />
        </Field>

        <Field label="Account type" required>
          <RadioCards 
            options={ACCOUNT_TYPE_OPTIONS} 
            value={data["banking.accountType"]} 
            onChange={(v) => onChange("banking.accountType", v)} 
          />
        </Field>

        <Field label="Routing number" required>
          <input
            type="password"
            value={String(data["banking.routingNumber"] ?? "")}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 9);
              onChange("banking.routingNumber", val);
            }}
            placeholder="•••••••••"
            maxLength={9}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
          />
          <p className="mt-1 text-xs text-slate-500">
            9-digit routing number (found on bottom left of your check)
          </p>
          {data["banking.routingNumber"] && String(data["banking.routingNumber"]).length === 9 ? (
            <p className="mt-1 text-xs text-slate-600">
              Entered: {maskRoutingNumber(String(data["banking.routingNumber"]))}
            </p>
          ) : null}
        </Field>

        <Field label="Account number" required>
          <input
            type="password"
            value={String(data["banking.accountNumber"] ?? "")}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 17);
              onChange("banking.accountNumber", val);
            }}
            placeholder="••••••••••••"
            maxLength={17}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
          />
          <p className="mt-1 text-xs text-slate-500">
            Account number (found on bottom of your check, to the right of routing number)
          </p>
          {data["banking.accountNumber"] && String(data["banking.accountNumber"]).length >= 4 ? (
            <p className="mt-1 text-xs text-slate-600">
              Entered: {maskBankAccount(String(data["banking.accountNumber"]))}
            </p>
          ) : null}
        </Field>

        <Field label="Confirm account number" required>
          <input
            type="password"
            value={String(data["banking.accountNumberConfirm"] ?? "")}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 17);
              onChange("banking.accountNumberConfirm", val);
            }}
            placeholder="••••••••••••"
            maxLength={17}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
          />
          <p className="mt-1 text-xs text-slate-500">
            Re-enter account number to confirm
          </p>
          {data["banking.accountNumber"] && data["banking.accountNumberConfirm"] && 
           data["banking.accountNumber"] !== data["banking.accountNumberConfirm"] ? (
            <p className="mt-1 text-xs text-red-600">
              Account numbers do not match
            </p>
          ) : null}
        </Field>

        <Field label="Do you prefer direct deposit for housing assistance payments?">
          <BooleanCards 
            value={data["banking.prefersDirectDeposit"]} 
            onChange={(v) => onChange("banking.prefersDirectDeposit", v)} 
          />
          <p className="mt-2 text-xs text-slate-500">
            Direct deposit is faster and more secure than paper checks
          </p>
        </Field>
      </div>
    </div>
  );
}

/* ─── 7. Housing History ────────────────────────────────────── */
const HOUSING_SITUATION_OPTIONS = [
  { value: "renting", label: "Currently renting" },
  { value: "staying_with", label: "Staying with family / friends" },
  { value: "homeless", label: "Currently unhoused / homeless" },
  { value: "shelter", label: "In a shelter" },
  { value: "own_home", label: "Own a home" },
  { value: "temporary", label: "In temporary housing" },
  { value: "transitional", label: "In transitional housing" },
  { value: "unsafe", label: "In an unsafe situation" },
  { value: "hotel_motel", label: "Hotel / Motel" },
  { value: "vehicle", label: "Living in vehicle" },
  { value: "other", label: "Other" },
];

const RESIDENCE_LENGTH_OPTIONS = [
  { value: "less_than_1_month", label: "Less than 1 month" },
  { value: "1_to_3_months", label: "1–3 months" },
  { value: "3_to_6_months", label: "3–6 months" },
  { value: "6_to_12_months", label: "6–12 months" },
  { value: "1_to_2_years", label: "1–2 years" },
  { value: "2_to_5_years", label: "2–5 years" },
  { value: "over_5_years", label: "Over 5 years" },
];

const OWN_RENT_OPTIONS = [
  { value: "rent", label: "Rent" },
  { value: "own", label: "Own" },
  { value: "neither", label: "Neither (staying with others)" },
];

export function HousingHistorySection({ data, onChange }: SectionProps) {
  const currentSituation = data["housing.currentHousingSituation"];
  const showAddress = currentSituation !== "homeless" && currentSituation !== "vehicle" && currentSituation !== "shelter";
  
  return (
    <div>
      <SectionHeader
        title="Housing History"
        description="Understanding your housing situation helps us prioritize your application and match you with appropriate programs."
      />
      
      <div className="space-y-8">
        {/* Current Housing Situation */}
        <Field label="What is your current housing situation?" required>
          <RadioCards
            options={HOUSING_SITUATION_OPTIONS}
            value={currentSituation}
            onChange={(v) => onChange("housing.currentHousingSituation", v)}
          />
        </Field>

        {/* Current Address */}
        {showAddress && (
          <div>
            <p className="mb-4 text-sm font-semibold text-slate-700">Current Address</p>
            <div className="space-y-4">
              <Field label="Street address" required>
                <TextInput 
                  value={data["housing.currentAddress"]} 
                  onChange={(v) => onChange("housing.currentAddress", v)} 
                  placeholder="123 Main Street, Apt 4B" 
                />
              </Field>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City" required>
                  <TextInput 
                    value={data["housing.city"]} 
                    onChange={(v) => onChange("housing.city", v)} 
                    placeholder="City" 
                  />
                </Field>
                
                <Field label="State" required>
                  <select
                    value={String(data["housing.state"] ?? "")}
                    onChange={(e) => onChange("housing.state", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                </Field>
                
                <Field label="ZIP code" required>
                  <TextInput 
                    value={data["housing.zipCode"]} 
                    onChange={(v) => onChange("housing.zipCode", v)} 
                    placeholder="12345" 
                  />
                </Field>
              </div>

              <Field label="County" required>
                <TextInput 
                  value={data["housing.county"]} 
                  onChange={(v) => onChange("housing.county", v)} 
                  placeholder="County name" 
                />
                <p className="mt-1 text-xs text-slate-500">Many housing programs are administered at the county level</p>
              </Field>
            </div>
          </div>
        )}

        {/* Rent/Own Status */}
        {showAddress && (
          <Field label="Do you rent or own your current residence?">
            <RadioCards
              options={OWN_RENT_OPTIONS}
              value={data["housing.ownOrRent"]}
              onChange={(v) => onChange("housing.ownOrRent", v)}
            />
          </Field>
        )}

        {/* Monthly Rent */}
        {data["housing.ownOrRent"] === "rent" && (
          <Field label="Current monthly rent amount">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                value={String(data["housing.monthlyRent"] ?? "")}
                onChange={(e) => onChange("housing.monthlyRent", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="1200"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Include utilities if they're included in rent</p>
          </Field>
        )}

        {/* Length of Residence */}
        <Field label="How long have you lived at your current address?">
          <RadioCards
            options={RESIDENCE_LENGTH_OPTIONS}
            value={data["housing.lengthOfResidence"]}
            onChange={(v) => onChange("housing.lengthOfResidence", v)}
          />
        </Field>

        {/* Critical Situations */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Emergency Housing Situations</p>
          <p className="mb-4 text-xs text-slate-500">
            These questions help identify urgent situations that may qualify you for emergency housing assistance.
          </p>
          
          <div className="space-y-6">
            <Field label="Are you currently facing eviction or foreclosure?">
              <BooleanCards 
                value={data["housing.facingEviction"]} 
                onChange={(v) => onChange("housing.facingEviction", v)} 
              />
            </Field>

            <Field label="Have you been homeless in the past 12 months?">
              <BooleanCards 
                value={data["housing.wasHomeless"]} 
                onChange={(v) => onChange("housing.wasHomeless", v)} 
              />
            </Field>

            <Field label="Are you currently staying in a shelter?">
              <BooleanCards 
                value={data["housing.isShelterResident"]} 
                onChange={(v) => onChange("housing.isShelterResident", v)} 
              />
            </Field>

            <Field label="Are you fleeing domestic violence?">
              <BooleanCards 
                value={data["housing.isDVSurvivor"]} 
                onChange={(v) => onChange("housing.isDVSurvivor", v)} 
              />
              <p className="mt-2 text-xs text-slate-500">
                Your information is confidential. Domestic violence survivors may qualify for priority placement and confidential addresses.
              </p>
            </Field>

            <Field label="Have you experienced eviction or foreclosure in the past 5 years?">
              <BooleanCards
                value={data["housing.priorEviction"]}
                onChange={(v) => onChange("housing.priorEviction", v)}
              />
            </Field>

            <Field label="Do you have a criminal background that may affect housing?">
              <BooleanCards
                value={data["housing.hasCriminalBackground"]}
                onChange={(v) => onChange("housing.hasCriminalBackground", v)}
              />
              <p className="mt-1 text-xs text-slate-500">
                Some programs have restrictions, but many allow case-by-case review
              </p>
            </Field>
          </div>
        </div>

        {/* Rental History */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Rental History</p>
          
          <Field label="Do you have verifiable rental history?">
            <BooleanCards 
              value={data["housing.hasRentalHistory"]} 
              onChange={(v) => onChange("housing.hasRentalHistory", v)} 
            />
          </Field>

          <Field label="Can you provide landlord references?">
            <BooleanCards 
              value={data["housing.hasLandlordReferences"]} 
              onChange={(v) => onChange("housing.hasLandlordReferences", v)} 
            />
          </Field>
        </div>

        {/* Current Landlord Info (if renting) */}
        {data["housing.ownOrRent"] === "rent" && (
          <div>
            <p className="mb-4 text-sm font-semibold text-slate-700">Current Landlord (Optional)</p>
            <div className="space-y-4">
              <Field label="Landlord or property management name">
                <TextInput 
                  value={data["housing.landlordName"]} 
                  onChange={(v) => onChange("housing.landlordName", v)} 
                  placeholder="Landlord name or company" 
                />
              </Field>
              
              <Field label="Landlord phone number">
                <TextInput 
                  value={data["housing.landlordPhone"]} 
                  onChange={(v) => onChange("housing.landlordPhone", v)} 
                  placeholder="(555) 000-0000" 
                />
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 6. Housing Needs ──────────────────────────────────────── */
const ACCESSIBILITY_NEEDS = [
  { value: "wheelchair", label: "Wheelchair accessible" },
  { value: "ground_floor", label: "Ground floor / No stairs" },
  { value: "elevator", label: "Elevator required" },
  { value: "wide_doorways", label: "Wide doorways" },
  { value: "grab_bars", label: "Grab bars in bathroom" },
  { value: "ramps", label: "Ramps" },
  { value: "visual_aids", label: "Visual aids (hearing impaired)" },
  { value: "audio_aids", label: "Audio aids (vision impaired)" },
  { value: "service_animal", label: "Service animal accommodation" },
  { value: "no_special_needs", label: "No special accessibility needs" },
];

const SPECIAL_CIRCUMSTANCES = [
  { value: "large_family", label: "Large family (5+ members)" },
  { value: "foster_care", label: "Foster parent" },
  { value: "expecting", label: "Expecting a child" },
  { value: "medical_needs", label: "Ongoing medical treatment" },
  { value: "mental_health", label: "Mental health support needed" },
  { value: "substance_recovery", label: "In substance abuse recovery" },
  { value: "recently_incarcerated", label: "Recently released from incarceration" },
  { value: "aging_out_foster", label: "Aging out of foster care" },
  { value: "student", label: "Full-time student" },
  { value: "none", label: "None apply" },
];

const HOUSING_URGENCY = [
  { value: "immediate", label: "Immediate (within 2 weeks)" },
  { value: "urgent", label: "Urgent (within 1 month)" },
  { value: "soon", label: "Soon (1-3 months)" },
  { value: "flexible", label: "Flexible (3-6 months)" },
  { value: "planning", label: "Planning ahead (6+ months)" },
];

export function HousingNeedsSection({ data, onChange }: SectionProps) {
  const accessibilityNeeds = Array.isArray(data["preferences.accessibilityNeeds"]) 
    ? data["preferences.accessibilityNeeds"] 
    : [];
  const specialCircumstances = Array.isArray(data["preferences.specialCircumstances"]) 
    ? data["preferences.specialCircumstances"] 
    : [];
  
  const hasAccessibilityNeeds = !accessibilityNeeds.includes("no_special_needs");
  const hasSpecialCircumstances = !specialCircumstances.includes("none");

  return (
    <div>
      <SectionHeader
        title="Housing Needs & Preferences"
        description="Help us understand your housing needs so we can match you with the most suitable programs and properties."
      />
      
      <div className="space-y-8">
        {/* Location Preferences */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Location Preferences</p>
          <Field label="Preferred locations (states or cities)">
            <SearchableChips
              value={data["preferences.preferredLocations"]}
              onChange={(v) => onChange("preferences.preferredLocations", v)}
              placeholder="Search states or cities…"
            />
            <p className="mt-2 text-xs text-slate-500">
              Enter multiple locations to increase your chances of finding suitable housing
            </p>
          </Field>
        </div>

        {/* Unit Requirements */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Unit Requirements</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Bedrooms needed">
              <NumericStepper
                value={data["preferences.bedrooms"]}
                onChange={(v) => onChange("preferences.bedrooms", v)}
                min={0}
                max={8}
                suffix="bedrooms"
              />
              <p className="mt-1 text-xs text-slate-500">Studio = 0 bedrooms</p>
            </Field>
            
            <Field label="Bathrooms needed">
              <NumericStepper
                value={data["preferences.bathrooms"]}
                onChange={(v) => onChange("preferences.bathrooms", v)}
                min={1}
                max={4}
                suffix="bathrooms"
              />
            </Field>
          </div>
        </div>

        {/* Affordability */}
        <Field label="Maximum monthly rent you can afford">
          <RadioCards
            options={[
              { value: "under_500", label: "Under $500" },
              { value: "500_1000", label: "$500–$1,000" },
              { value: "1000_1500", label: "$1,000–$1,500" },
              { value: "1500_2000", label: "$1,500–$2,000" },
              { value: "2000_plus", label: "$2,000+" },
              { value: "flexible", label: "Flexible" },
            ]}
            value={data["preferences.maxRent"]}
            onChange={(v) => onChange("preferences.maxRent", v)}
          />
          <p className="mt-2 text-xs text-slate-500">
            Include utilities in your estimate if they won't be covered by the program
          </p>
        </Field>

        {/* Housing Urgency */}
        <Field label="How urgently do you need housing?">
          <RadioCards
            options={HOUSING_URGENCY}
            value={data["preferences.urgency"]}
            onChange={(v) => onChange("preferences.urgency", v)}
          />
          <p className="mt-2 text-xs text-slate-500">
            Urgent situations may qualify for emergency housing programs with faster placement
          </p>
        </Field>

        {/* Accessibility Needs */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Accessibility Requirements</p>
          <Field label="Select all accessibility features you need">
            <MultiSelectCards
              options={ACCESSIBILITY_NEEDS}
              value={accessibilityNeeds}
              onChange={(v) => onChange("preferences.accessibilityNeeds", v)}
              helpText="Many programs prioritize applicants with documented accessibility needs"
            />
          </Field>

          {hasAccessibilityNeeds && (
            <Field label="Please describe any specific accessibility requirements">
              <textarea
                value={String(data["preferences.accessibilityDetails"] ?? "")}
                onChange={(e) => onChange("preferences.accessibilityDetails", e.target.value)}
                placeholder="Example: Need first-floor unit due to mobility issues, require roll-in shower, need visual fire alarms..."
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                Detailed information helps housing providers prepare appropriate accommodations
              </p>
            </Field>
          )}
        </div>

        {/* Special Circumstances */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Special Circumstances</p>
          <Field label="Select any that apply to your situation">
            <MultiSelectCards
              options={SPECIAL_CIRCUMSTANCES}
              value={specialCircumstances}
              onChange={(v) => onChange("preferences.specialCircumstances", v)}
              helpText="Some programs offer specialized support for specific situations"
            />
          </Field>

          {hasSpecialCircumstances && (
            <Field label="Additional details about your situation (optional)">
              <textarea
                value={String(data["preferences.circumstancesDetails"] ?? "")}
                onChange={(e) => onChange("preferences.circumstancesDetails", e.target.value)}
                placeholder="Provide any additional context that might help us match you with appropriate support programs..."
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
              />
            </Field>
          )}
        </div>

        {/* Additional Preferences */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Additional Preferences</p>
          <div className="space-y-4">
            <Field label="Do you have pets that need to live with you?">
              <BooleanCards 
                value={data["preferences.hasPets"]} 
                onChange={(v) => onChange("preferences.hasPets", v)} 
              />
            </Field>

            {data["preferences.hasPets"] === "true" && (
              <div className="ml-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Field label="Pet type and details">
                  <TextInput 
                    value={data["preferences.petDetails"]} 
                    onChange={(v) => onChange("preferences.petDetails", v)} 
                    placeholder="e.g., Small dog (20 lbs), Indoor cat" 
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Include type, size, and whether they're service/emotional support animals
                  </p>
                </Field>
              </div>
            )}

            <Field label="Must be near public transportation?">
              <BooleanCards 
                value={data["preferences.nearTransit"]} 
                onChange={(v) => onChange("preferences.nearTransit", v)} 
              />
              <p className="mt-1 text-xs text-slate-500">
                Important if you don't have a personal vehicle
              </p>
            </Field>

            <Field label="Need to be near schools?">
              <BooleanCards 
                value={data["preferences.nearSchools"]} 
                onChange={(v) => onChange("preferences.nearSchools", v)} 
              />
              <p className="mt-1 text-xs text-slate-500">
                Helpful if you have school-age children
              </p>
            </Field>

            <Field label="Need to be near medical facilities?">
              <BooleanCards 
                value={data["preferences.nearMedical"]} 
                onChange={(v) => onChange("preferences.nearMedical", v)} 
              />
              <p className="mt-1 text-xs text-slate-500">
                Important for ongoing medical care or disability support
              </p>
            </Field>

            <Field label="Need parking space?">
              <BooleanCards 
                value={data["preferences.needsParking"]} 
                onChange={(v) => onChange("preferences.needsParking", v)} 
              />
            </Field>

            <Field label="Prefer community with shared amenities (laundry, recreation)?">
              <BooleanCards 
                value={data["preferences.sharedAmenities"]} 
                onChange={(v) => onChange("preferences.sharedAmenities", v)} 
              />
            </Field>
          </div>
        </div>

        {/* Housing Type Preferences */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Housing Type Preferences</p>
          <Field label="Preferred housing types">
            <MultiSelectCards
              options={[
                { value: "apartment", label: "Apartment" },
                { value: "townhouse", label: "Townhouse" },
                { value: "single_family", label: "Single-family home" },
                { value: "duplex", label: "Duplex" },
                { value: "senior_community", label: "Senior community" },
                { value: "assisted_living", label: "Assisted living" },
                { value: "shared_housing", label: "Shared housing" },
                { value: "flexible", label: "Flexible / Any type" },
              ]}
              value={data["preferences.housingTypes"]}
              onChange={(v) => onChange("preferences.housingTypes", v)}
              helpText="Select all types you would consider"
            />
          </Field>
        </div>

        {/* Move-in Readiness */}
        <div>
          <p className="mb-4 text-sm font-semibold text-slate-700">Move-in Readiness</p>
          
          <Field label="Can you pay a security deposit if required?">
            <RadioCards
              options={[
                { value: "yes_full", label: "Yes, can pay full deposit" },
                { value: "yes_partial", label: "Yes, but need payment plan" },
                { value: "need_assistance", label: "Need deposit assistance" },
                { value: "not_sure", label: "Not sure" },
              ]}
              value={data["preferences.securityDeposit"]}
              onChange={(v) => onChange("preferences.securityDeposit", v)}
            />
            <p className="mt-2 text-xs text-slate-500">
              Some programs offer deposit assistance or waive deposits
            </p>
          </Field>

          <Field label="Do you have furniture for a new home?">
            <RadioCards
              options={[
                { value: "yes_fully", label: "Yes, fully furnished" },
                { value: "yes_partially", label: "Yes, have some furniture" },
                { value: "need_furniture", label: "No, need furniture assistance" },
              ]}
              value={data["preferences.hasFurniture"]}
              onChange={(v) => onChange("preferences.hasFurniture", v)}
            />
          </Field>

          <Field label="Do you need help with moving expenses?">
            <BooleanCards 
              value={data["preferences.needsMovingHelp"]} 
              onChange={(v) => onChange("preferences.needsMovingHelp", v)} 
            />
          </Field>
        </div>

        {/* Additional Comments */}
        <Field label="Any additional information about your housing needs? (optional)">
          <textarea
            value={String(data["preferences.additionalNotes"] ?? "")}
            onChange={(e) => onChange("preferences.additionalNotes", e.target.value)}
            placeholder="Share anything else that would help us find the right housing match for you..."
            rows={4}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
          />
        </Field>
      </div>
    </div>
  );
}

/* ─── 7. Program-Specific Questions (passthrough to DynamicForm) ── */
import type { RenderedQuestion } from "@/lib/forms/renderer";
import { QuestionRenderer } from "@/components/eligibility/question-inputs";

interface ProgramQuestionsProps {
  questions: RenderedQuestion[];
  data: WizardData;
  onChange: (key: string, value: unknown) => void;
}

export function ProgramQuestionsSection({ questions, data, onChange }: ProgramQuestionsProps) {
  if (!questions.length) {
    return (
      <div>
        <SectionHeader title="Program Questions" description="This program has no additional questions." />
        <p className="text-sm text-slate-500">You can continue to the next step.</p>
      </div>
    );
  }
  return (
    <div>
      <SectionHeader
        title="Program Questions"
        description="These additional questions are specific to this housing program. Answer as best you can."
      />
      <div className="space-y-8">
        {questions.map((q) => (
          <Field key={q.id} label={q.label} required={q.required}>
            {q.helpText && <p className="mb-2 text-sm text-slate-500">{q.helpText}</p>}
            <QuestionRenderer question={q} value={data[q.key]} onChange={(v) => onChange(q.key, v)} />
          </Field>
        ))}
      </div>
    </div>
  );
}

/* ─── 8. Document Uploads ───────────────────────────────────── */
const DOC_STATUS_STYLES: Record<string, string> = {
  pending:        "bg-amber-50 text-amber-700 border-amber-200",
  uploaded:       "bg-blue-50 text-blue-700 border-blue-200",
  under_review:   "bg-slate-100 text-slate-700 border-slate-200",
  accepted:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected:       "bg-red-50 text-red-700 border-red-200",
};

const DOC_STATUS_LABEL: Record<string, string> = {
  pending:        "Required",
  uploaded:       "Uploaded",
  under_review:   "Under review",
  accepted:       "Accepted",
  rejected:       "Rejected",
};

interface DocumentRequest {
  id: string;
  documentType: string;
  status: string;
  fileUrl?: string | null;
  fileName?: string | null;
  uploadedAt?: string | null;
}

interface DocumentsProps {
  data: WizardData;
  applicationId: string;
  onDocumentsChange: (documents: Array<{id: string; fileName: string; fileUrl: string; type: string; uploadedAt: Date}>) => void;
}

export function DocumentsSection({ data, applicationId, onDocumentsChange }: DocumentsProps) {
  const [expandedCategory, setExpandedCategory] = useState<DocumentCategory | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    type: string;
    uploadedAt: Date;
  }>>([]);

  // Get required and optional documents based on applicant profile
  const requiredDocs = getRequiredDocuments(data);
  const optionalDocs = getOptionalDocuments();
  const allDocs = [...requiredDocs, ...optionalDocs];

  // Group documents by category
  const documentsByCategory = Array.from(
    new Set(allDocs.map(d => d.category))
  ).map(category => ({
    category,
    config: DOCUMENT_CATEGORIES[category],
    documents: allDocs.filter(d => d.category === category),
  }));

  // Count statistics
  const totalRequired = requiredDocs.length;
  const uploadedRequired = uploadedDocuments.filter(doc => 
    requiredDocs.some(rd => rd.id === doc.type)
  ).length;

  function handleUploadComplete(document: any) {
    const newDoc = {
      id: document.id,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      type: document.type,
      uploadedAt: new Date(document.uploadedAt),
    };
    
    const updated = [...uploadedDocuments.filter(d => d.type !== document.type), newDoc];
    setUploadedDocuments(updated);
    onDocumentsChange(updated);
  }

  function handleDelete(documentId: string) {
    const updated = uploadedDocuments.filter(d => d.id !== documentId);
    setUploadedDocuments(updated);
    onDocumentsChange(updated);
  }

  return (
    <div>
      <SectionHeader
        title="Document Uploads"
        description="Upload documents to verify your eligibility. Required documents are marked with a red badge. You can upload now or come back later."
      />

      {/* Progress Summary */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900">Upload Progress</h3>
          <p className="text-sm text-slate-600">Track your document submission status</p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{totalRequired}</p>
            <p className="text-xs font-medium text-slate-600">Required Documents</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{uploadedRequired}</p>
            <p className="text-xs font-medium text-slate-600">Required Uploaded</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{uploadedDocuments.length}</p>
            <p className="text-xs font-medium text-slate-600">Total Uploaded</p>
          </div>
        </div>
        
        {totalRequired > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Required Completion</span>
              <span>{Math.round((uploadedRequired / totalRequired) * 100)}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/60">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${(uploadedRequired / totalRequired) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Document Categories */}
      <div className="space-y-4">
        {documentsByCategory.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
            <p className="text-base font-medium text-slate-600">No documents required for this program.</p>
            <p className="mt-2 text-sm text-slate-500">
              You can proceed to the next step. The housing provider may request documents during review.
            </p>
          </div>
        )}

        {documentsByCategory.map(({ category, config, documents }) => {
          const isExpanded = expandedCategory === category;
          const categoryUploaded = uploadedDocuments.filter(doc => 
            documents.some(d => d.id === doc.type)
          ).length;
          const categoryRequired = documents.filter(d => d.required || d.conditionalRequired).length;
          
          return (
            <div key={category} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{config.icon}</span>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{config.label}</h4>
                    <p className="text-xs text-slate-500">{config.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {categoryUploaded} / {documents.length}
                    </p>
                    <p className="text-xs text-slate-500">
                      {categoryRequired > 0 && `${categoryRequired} required`}
                    </p>
                  </div>
                  <svg
                    className={cn(
                      "h-5 w-5 text-slate-400 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Category Documents */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                  <div className="space-y-6">
                    {documents.map(docType => {
                      const existingDoc = uploadedDocuments.find(d => d.type === docType.id);
                      
                      return (
                        <DocumentCard
                          key={docType.id}
                          documentType={docType}
                          applicationId={applicationId}
                          existingDocument={existingDoc}
                          onUploadComplete={handleUploadComplete}
                          onDelete={existingDoc ? () => handleDelete(existingDoc.id) : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/30 p-4">
        <p className="text-sm text-slate-700">
          <strong className="font-semibold text-slate-900">Tip:</strong> You can save your progress and return later to upload documents. 
          Missing required documents may delay your application review.
        </p>
      </div>
    </div>
  );
}

/* ─── 9. Review & Confirmation ──────────────────────────────── */
interface ReviewRow {
  label: string;
  value: unknown;
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "—";
  return String(value);
}

const INCOME_LABEL: Record<string, string> = {
  under_1000: "Under $1,000/mo",
  "1000_3000": "$1,000–$3,000/mo",
  "3000_5000": "$3,000–$5,000/mo",
  "5000_8000": "$5,000–$8,000/mo",
  "8000_15000": "$8,000–$15,000/mo",
  "15000_plus": "$15,000+/mo",
  prefer_not_to_say: "Prefer not to say",
};

function ReviewGroup({ title, rows, onEdit }: { title: string; rows: ReviewRow[]; onEdit: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-700">{title}</p>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-xs font-semibold text-[#006AFF] hover:underline">
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>
      <dl className="space-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex gap-2 text-sm">
            <dt className="w-40 shrink-0 font-medium text-slate-500">{label}</dt>
            <dd className="text-slate-900">{formatValue(value === "prefer_not_to_say" ? "Prefer not to say" : INCOME_LABEL[String(value ?? "")] ?? value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface ReviewSectionProps {
  data: WizardData;
  programName: string;
  onEditSection: (sectionId: string) => void;
  requiredDocuments?: string[];
  uploadedDocuments?: string[];
}

export function ReviewSection({ data, programName, onEditSection, requiredDocuments = [], uploadedDocuments = [] }: ReviewSectionProps) {
  const [agreementStates, setAgreementStates] = useState({
    accuracyConfirmed: false,
    backgroundCheckConsent: false,
    incomeVerificationConsent: false,
    identityVerificationConsent: false,
    privacyPolicyAccepted: false,
    termsOfServiceAccepted: false,
  });
  
  const [signature, setSignature] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  
  // Calculate missing required documents
  const missingDocuments = requiredDocuments.filter(doc => !uploadedDocuments.includes(doc));
  const allDocumentsUploaded = missingDocuments.length === 0;
  
  // Check if all required fields are filled
  const hasRequiredPersonal = Boolean(
    data["personal.firstName"] && 
    data["personal.lastName"] && 
    data["personal.email"] &&
    data["personal.phone"]
  );
  
  const hasRequiredHousehold = Boolean(
    data["household.householdSize"] &&
    data["household.type"]
  );
  
  const hasRequiredIncome = Boolean(
    data["income.sources"] &&
    (data["income.monthlyIncome"] || data["income.annualIncome"] || data["income.incomeRange"])
  );
  
  // Check if all agreements are accepted
  const allAgreementsAccepted = Object.values(agreementStates).every(Boolean);
  
  // Check if signature is valid
  const hasValidSignature = signature.trim().length >= 2 && signatureDate !== "";
  
  // Overall readiness to submit
  const canSubmit = 
    hasRequiredPersonal &&
    hasRequiredHousehold &&
    hasRequiredIncome &&
    allAgreementsAccepted &&
    hasValidSignature;
  
  const fullName = `${data["personal.firstName"] ?? ""} ${data["personal.middleName"] ?? ""} ${data["personal.lastName"] ?? ""}`.trim();
  
  return (
    <div>
      <SectionHeader
        title="Review & Confirm"
        description={`Please review your information before submitting your application to ${programName}. You can edit any section before submitting.`}
      />

      <div className="space-y-4">
        <ReviewGroup
          title="Personal Information"
          onEdit={() => onEditSection("personal")}
          rows={[
            { label: "Full name", value: `${data["personal.firstName"] ?? ""} ${data["personal.middleName"] ?? ""} ${data["personal.lastName"] ?? ""}`.trim() },
            { label: "Phone", value: data["personal.phone"] },
            { label: "Email", value: data["personal.email"] },
            { label: "Date of birth", value: data["personal.dateOfBirth"] },
            { label: "Citizenship", value: data["personal.citizenshipStatus"] },
            { label: "Veteran", value: data["personal.isVeteran"] === "true" ? "Yes" : data["personal.isVeteran"] === "false" ? "No" : data["personal.isVeteran"] },
            { label: "Disability", value: data["personal.isDisabilityAffected"] === "true" ? "Yes" : data["personal.isDisabilityAffected"] === "false" ? "No" : data["personal.isDisabilityAffected"] },
          ]}
        />
        <ReviewGroup
          title="Household"
          onEdit={() => onEditSection("household")}
          rows={[
            { label: "Type", value: data["household.type"] },
            { label: "Size", value: data["household.householdSize"] },
            { label: "Adults", value: data["household.adults"] },
            { label: "Children", value: data["household.children"] },
            { label: "Elderly members", value: data["household.elderlyMembers"] },
            { label: "Disabled members", value: data["household.disabledMembers"] },
          ]}
        />
        <ReviewGroup
          title="Employment"
          onEdit={() => onEditSection("employment")}
          rows={[
            { label: "Employment status", value: data["employment.status"] },
            { label: "Employer", value: data["employment.employerName"] },
            { label: "Occupation", value: data["employment.occupation"] },
            { label: "Teacher", value: data["employment.isTeacher"] === "true" ? "Yes" : "No" },
            { label: "Healthcare worker", value: data["employment.isHealthcareWorker"] === "true" ? "Yes" : "No" },
            { label: "Government employee", value: data["employment.isGovernmentEmployee"] === "true" ? "Yes" : "No" },
          ]}
        />
        <ReviewGroup
          title="Income"
          onEdit={() => onEditSection("income")}
          rows={[
            { label: "Income sources", value: Array.isArray(data["income.sources"]) ? data["income.sources"].join(", ") : data["income.sources"] },
            { label: "Monthly income", value: data["income.monthlyIncome"] ? `$${data["income.monthlyIncome"]}` : undefined },
            { label: "Annual income", value: data["income.annualIncome"] ? `$${data["income.annualIncome"]}` : undefined },
            { label: "Income range", value: data["income.incomeRange"] },
            { label: "Frequency", value: data["income.frequency"] },
          ]}
        />
        <ReviewGroup
          title="Financial Assets"
          onEdit={() => onEditSection("financial")}
          rows={[
            { label: "Assets", value: Array.isArray(data["financial.assets"]) ? data["financial.assets"].join(", ") : data["financial.assets"] },
            { label: "Checking balance", value: data["financial.checkingBalance"] ? `$${data["financial.checkingBalance"]}` : undefined },
            { label: "Savings balance", value: data["financial.savingsBalance"] ? `$${data["financial.savingsBalance"]}` : undefined },
            { label: "Owns property", value: data["financial.ownsProperty"] === "true" ? "Yes" : "No" },
            { label: "Owns vehicle", value: data["financial.ownsVehicle"] === "true" ? "Yes" : "No" },
          ]}
        />
        <ReviewGroup
          title="Banking"
          onEdit={() => onEditSection("banking")}
          rows={[
            { label: "Bank name", value: data["banking.bankName"] },
            { label: "Account type", value: data["banking.accountType"] },
            { label: "Routing number", value: data["banking.routingNumber"] ? `****${String(data["banking.routingNumber"]).slice(-4)}` : undefined },
            { label: "Account number", value: data["banking.accountNumber"] ? `****${String(data["banking.accountNumber"]).slice(-4)}` : undefined },
            { label: "Prefers direct deposit", value: data["banking.prefersDirectDeposit"] === "true" ? "Yes" : "No" },
          ]}
        />
        <ReviewGroup
          title="Housing Situation"
          onEdit={() => onEditSection("housing-history")}
          rows={[
            { label: "Current situation", value: data["housing.currentHousingSituation"] },
            { label: "City", value: data["housing.city"] },
            { label: "State", value: data["housing.state"] },
            { label: "Length of residence", value: data["housing.lengthOfResidence"] },
            { label: "Facing eviction", value: data["housing.facingEviction"] === "true" ? "Yes" : "No" },
            { label: "Prior eviction", value: data["housing.priorEviction"] === "true" ? "Yes" : data["housing.priorEviction"] === "false" ? "No" : data["housing.priorEviction"] },
          ]}
        />
        <ReviewGroup
          title="Housing Needs"
          onEdit={() => onEditSection("housing-needs")}
          rows={[
            { label: "Preferred locations", value: data["preferences.preferredLocations"] },
            { label: "Bedrooms", value: data["preferences.bedrooms"] },
            { label: "Bathrooms", value: data["preferences.bathrooms"] },
            { label: "Max rent", value: data["preferences.maxRent"] },
            { label: "Urgency", value: data["preferences.urgency"] },
            { label: "Accessibility needs", value: Array.isArray(data["preferences.accessibilityNeeds"]) ? data["preferences.accessibilityNeeds"].join(", ") : data["preferences.accessibilityNeeds"] },
            { label: "Special circumstances", value: Array.isArray(data["preferences.specialCircumstances"]) ? data["preferences.specialCircumstances"].join(", ") : data["preferences.specialCircumstances"] },
            { label: "Has pets", value: data["preferences.hasPets"] === "true" ? `Yes - ${data["preferences.petDetails"] ?? ""}` : "No" },
            { label: "Near transit", value: data["preferences.nearTransit"] === "true" ? "Yes" : "No" },
            { label: "Near schools", value: data["preferences.nearSchools"] === "true" ? "Yes" : "No" },
            { label: "Near medical", value: data["preferences.nearMedical"] === "true" ? "Yes" : "No" },
            { label: "Housing types", value: Array.isArray(data["preferences.housingTypes"]) ? data["preferences.housingTypes"].join(", ") : data["preferences.housingTypes"] },
          ]}
        />

        {/* Document Upload Status */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-700">Document Uploads</p>
            <button type="button" onClick={() => onEditSection("documents")} className="inline-flex items-center gap-1 text-xs font-semibold text-[#006AFF] hover:underline">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </div>
          
          {(() => {
            const uploadedDocs = (data["_uploadedDocuments"] as Array<{ id: string; type: string; fileName: string }> | undefined) ?? [];
            const requiredDocs = getRequiredDocuments(data);
            const uploadedRequired = uploadedDocs.filter(doc => 
              requiredDocs.some(rd => rd.id === doc.type)
            );
            
            if (uploadedDocs.length === 0) {
              return (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                  <p className="font-semibold text-amber-900">No documents uploaded</p>
                  <p className="mt-1 text-amber-700">
                    You have {requiredDocs.length} required document{requiredDocs.length !== 1 ? 's' : ''} to upload. 
                    Click Edit to upload documents now, or you can submit and upload later.
                  </p>
                </div>
              );
            }
            
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="font-semibold text-slate-900">{uploadedRequired.length}</span>
                    <span className="text-slate-600"> / {requiredDocs.length} required uploaded</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{uploadedDocs.length}</span>
                    <span className="text-slate-600"> total documents</span>
                  </div>
                </div>
                
                {uploadedRequired.length < requiredDocs.length && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-700">
                    {requiredDocs.length - uploadedRequired.length} required document{requiredDocs.length - uploadedRequired.length !== 1 ? 's' : ''} still needed
                  </div>
                )}
                
                <div className="space-y-1.5">
                  {uploadedDocs.slice(0, 5).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-xs text-slate-600">
                      <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium text-slate-700">{doc.fileName}</span>
                    </div>
                  ))}
                  {uploadedDocs.length > 5 && (
                    <p className="pl-5 text-xs text-slate-500">
                      +{uploadedDocs.length - 5} more document{uploadedDocs.length - 5 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#006AFF]/20 bg-[#f0f7ff] p-5 text-sm leading-7 text-slate-700">
        <p className="font-semibold text-slate-900">Before you submit</p>
        <p className="mt-1">
          By submitting this application you confirm that all information provided is accurate to the best of your knowledge.
          Final eligibility is determined by the housing provider after reviewing your full application.
        </p>
      </div>
    </div>
  );
}
