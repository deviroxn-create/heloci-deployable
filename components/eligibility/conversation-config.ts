/**
 * conversation-config.ts
 *
 * Single source of truth for all conversation content in the Eligibility Assistant.
 * UI components consume this config. Business logic stays in the eligibility engine.
 *
 * HOW TO EXTEND:
 *   1. Add a new ConversationStage to CONVERSATION_STAGES (or add steps to an existing one).
 *   2. Map your new step key to a RenderedQuestion key in PROFILE_KEY_MAP if it writes to profile.
 *   3. Add branching rules to BRANCH_RULES if the step should be conditionally shown.
 *   4. Add caseworker messaging to CASEWORKER_MESSAGES keyed by step ID.
 *
 * Stage → Step mapping to existing profile/eligibility keys:
 *   intention.housingGoals        → preferences.housingGoal  (multi-select)
 *   emergency.currentSituation    → housing.currentHousingSituation
 *   household.size                → household.householdSize
 *   household.members             → household.members (array)
 *   personal.isVeteran            → personal.isVeteran
 *   personal.isDisabilityAffected → personal.isDisabilityAffected
 *   personal.isPublicWorker       → personal.isPublicWorker (teacher / healthcare)
 *   personal.dateOfBirth          → personal.dateOfBirth
 *   income.range                  → income.incomeRange
 *   employment.status             → income.employmentStatus / employment.status
 *   preferences.states            → preferences.preferredLocations
 *   preferences.bedrooms          → preferences.bedrooms
 *   preferences.maxRent           → preferences.maxRent
 */

/* ──────────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────────── */

export type InputType =
  | "multiselect_cards"   // Large multi-select cards (housing goals)
  | "radio_cards"         // Single-select large cards
  | "boolean_cards"       // Yes / No / Not sure
  | "numeric_stepper"     // +/- stepper (household size, age)
  | "income_range"        // Specialised income bracket cards
  | "searchable_chips"    // Location / state chips
  | "text"                // Free text
  | "date"                // Date picker
  | "info"                // Non-input informational step (transition, branch intro)
  | "recommendation_preview"; // Live program match preview panel

export interface ConversationOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface BranchRule {
  /** Key in answers map to test */
  answerKey: string;
  /** Values that satisfy the condition (any match = true) */
  includesAny?: string[];
  /** Value must equal this */
  equals?: string;
  /** Value must NOT be one of these */
  excludes?: string[];
}

export interface ConversationStep {
  id: string;
  /** Which profile/applicant key this answer maps to */
  profileKey?: string;
  /** Stage this step belongs to */
  stage: ConversationStageId;
  /** Question text shown in the large heading */
  question: string;
  /** Supporting explanation shown below the question */
  subtext?: string;
  inputType: InputType;
  options?: ConversationOption[];
  required: boolean;
  /** Minimum selections for multiselect */
  minSelections?: number;
  stepperMin?: number;
  stepperMax?: number;
  stepperSuffix?: string;
  /** If defined, step is only shown when this rule passes */
  showWhen?: BranchRule;
  /** Search placeholder for searchable_chips */
  searchPlaceholder?: string;
}

export type ConversationStageId =
  | "welcome"
  | "intention"
  | "emergency_branch"
  | "veteran_branch"
  | "household"
  | "personal"
  | "income"
  | "employment"
  | "preferences"
  | "recommendation_preview"
  | "completion";

export interface ConversationStage {
  id: ConversationStageId;
  label: string;
  /** Short sentence shown at the top of the first step in this stage */
  transition?: string;
  steps: ConversationStep[];
}

export interface CaseworkerMessage {
  /** Main message bubble text */
  message: string;
  /** Optional follow-up message (shown as second bubble) */
  followUp?: string;
  /** Emoji avatar variant: "standard" | "encouraging" | "important" */
  tone?: "standard" | "encouraging" | "important";
}

/* ──────────────────────────────────────────────────────────────
   Housing goal options (Stage 2)
────────────────────────────────────────────────────────────── */

export const HOUSING_GOAL_OPTIONS: ConversationOption[] = [
  { value: "affordable_housing",         label: "Affordable Housing",          icon: "🏘️" },
  { value: "public_housing",             label: "Public Housing",              icon: "🏢" },
  { value: "section_8",                  label: "Section 8 Voucher",           icon: "📋" },
  { value: "emergency_housing",          label: "Emergency Housing",           icon: "🚨" },
  { value: "rent_assistance",            label: "Rent Assistance",             icon: "💳" },
  { value: "rent_to_own",                label: "Rent to Own",                 icon: "🔑" },
  { value: "first_time_homebuyer",       label: "First-Time Homebuyer",        icon: "🏠" },
  { value: "down_payment_assistance",    label: "Down Payment Assistance",     icon: "💰" },
  { value: "veteran_housing",            label: "Veteran Housing",             icon: "🎖️" },
  { value: "senior_housing",             label: "Senior Housing",              icon: "👴" },
  { value: "accessible_housing",         label: "Accessible Housing",          icon: "♿" },
  { value: "healthcare_worker_housing",  label: "Healthcare Worker Housing",   icon: "🏥" },
  { value: "teacher_housing",            label: "Teacher Housing",             icon: "📚" },
  { value: "family_housing",             label: "Family Housing",              icon: "👨‍👩‍👧" },
  { value: "domestic_violence",          label: "Domestic Violence Assistance",icon: "🛡️" },
  { value: "disaster_recovery",          label: "Disaster Recovery Housing",   icon: "🆘" },
  { value: "student_housing",            label: "Student Housing",             icon: "🎓" },
  { value: "other",                      label: "Other",                       icon: "✦" },
];

export const EMPLOYMENT_STATUS_OPTIONS: ConversationOption[] = [
  { value: "employed_full_time",   label: "Employed full-time",    icon: "💼" },
  { value: "employed_part_time",   label: "Employed part-time",    icon: "⏰" },
  { value: "self_employed",        label: "Self-employed / Freelance", icon: "🧑‍💻" },
  { value: "unemployed",           label: "Currently unemployed",  icon: "🔍" },
  { value: "retired",              label: "Retired",               icon: "🏖️" },
  { value: "student",              label: "Student",               icon: "📚" },
  { value: "disability_benefits",  label: "On disability benefits", icon: "♿" },
];

export const CURRENT_HOUSING_OPTIONS: ConversationOption[] = [
  { value: "renting",          label: "Currently renting",      icon: "🏠" },
  { value: "staying_with",     label: "Staying with family/friends", icon: "👫" },
  { value: "homeless",         label: "Currently unhoused",     icon: "🏕️" },
  { value: "shelter",          label: "In a shelter",           icon: "🏫" },
  { value: "own_home",         label: "Own a home",             icon: "🔑" },
  { value: "temporary",        label: "In temporary housing",   icon: "⏳" },
  { value: "unsafe",           label: "In an unsafe situation", icon: "⚠️" },
  { value: "other",            label: "Other",                  icon: "✦" },
];

export const URGENCY_OPTIONS: ConversationOption[] = [
  { value: "immediate",  label: "I need help immediately (within days)", icon: "🚨" },
  { value: "weeks",      label: "Within the next few weeks",             icon: "⚡" },
  { value: "months",     label: "Within the next few months",            icon: "📅" },
  { value: "planning",   label: "I'm planning ahead",                    icon: "🗓️" },
];

/* ──────────────────────────────────────────────────────────────
   Stage definitions
────────────────────────────────────────────────────────────── */

export const CONVERSATION_STAGES: ConversationStage[] = [
  /* ── Stage 1: Welcome (info only, no data collected) ── */
  {
    id: "welcome",
    label: "Welcome",
    steps: [
      {
        id: "welcome.intro",
        stage: "welcome",
        question: "Welcome to Heloci",
        subtext:
          "I'm your Housing Case Worker assistant. I'll help you discover housing programs across the United States that may fit your situation.\n\nMost applicants finish in about 8 minutes. Don't worry if you're unsure about an answer — you can update your profile at any time.\n\nThe recommendations I provide are advisory. You're always welcome to apply to any program regardless of what I suggest. Final eligibility is determined by the housing provider after reviewing your full application.",
        inputType: "info",
        required: false,
      },
    ],
  },

  /* ── Stage 2: Intention (what brings you here) ── */
  {
    id: "intention",
    label: "What you're looking for",
    transition: "Let's start with what brought you here today.",
    steps: [
      {
        id: "intention.housingGoals",
        profileKey: "preferences.housingGoal",
        stage: "intention",
        question: "What type of housing help are you looking for?",
        subtext:
          "Select everything that applies. I'll use this to focus the rest of our conversation on what matters most to you.",
        inputType: "multiselect_cards",
        options: HOUSING_GOAL_OPTIONS,
        required: true,
        minSelections: 1,
      },
    ],
  },

  /* ── Stage 3a: Emergency branch ── */
  {
    id: "emergency_branch",
    label: "Your current situation",
    transition: "Since you're looking for emergency help, I want to make sure I understand your situation.",
    steps: [
      {
        id: "emergency.currentSituation",
        profileKey: "housing.currentHousingSituation",
        stage: "emergency_branch",
        question: "Where are you staying right now?",
        subtext: "This helps me prioritise programs with the fastest response times.",
        inputType: "radio_cards",
        options: CURRENT_HOUSING_OPTIONS,
        required: true,
        showWhen: {
          answerKey: "intention.housingGoals",
          includesAny: ["emergency_housing", "domestic_violence", "disaster_recovery"],
        },
      },
      {
        id: "emergency.urgency",
        profileKey: "meta.urgency",
        stage: "emergency_branch",
        question: "How urgently do you need housing support?",
        subtext: "Emergency programs prioritise applicants based on urgency. Be honest — this helps, not hurts.",
        inputType: "radio_cards",
        options: URGENCY_OPTIONS,
        required: true,
        showWhen: {
          answerKey: "intention.housingGoals",
          includesAny: ["emergency_housing", "domestic_violence", "disaster_recovery"],
        },
      },
    ],
  },

  /* ── Stage 3b: Veteran branch ── */
  {
    id: "veteran_branch",
    label: "Veteran status",
    transition: "I see you're interested in veteran housing. Let me ask a quick follow-up.",
    steps: [
      {
        id: "personal.isVeteran",
        profileKey: "personal.isVeteran",
        stage: "veteran_branch",
        question: "Have you served in the U.S. military?",
        subtext:
          "Veterans and active-duty service members qualify for a separate tier of housing assistance with different income thresholds and priority access.",
        inputType: "boolean_cards",
        required: true,
        showWhen: {
          answerKey: "intention.housingGoals",
          includesAny: ["veteran_housing"],
        },
      },
    ],
  },

  /* ── Stage 4: Household composition ── */
  {
    id: "household",
    label: "Your household",
    transition:
      "Many housing programs are designed around household size and composition. I'll use this to unlock programs built specifically for your situation.",
    steps: [
      {
        id: "household.size",
        profileKey: "household.householdSize",
        stage: "household",
        question: "How many people are in your household?",
        subtext: "Include yourself and anyone who will be living with you.",
        inputType: "numeric_stepper",
        required: true,
        stepperMin: 1,
        stepperMax: 20,
        stepperSuffix: "people",
      },
    ],
  },

  /* ── Stage 5: Personal ── */
  {
    id: "personal",
    label: "About you",
    transition:
      "A few personal details help me match programs that target specific groups — like seniors, teachers, healthcare workers, or people with disabilities.",
    steps: [
      {
        id: "personal.dateOfBirth",
        profileKey: "personal.dateOfBirth",
        stage: "personal",
        question: "What is your date of birth?",
        subtext:
          "Age determines eligibility for senior housing programs (typically 55+) and certain youth programs. This is not shared with employers.",
        inputType: "date",
        required: true,
      },
      {
        id: "personal.isDisabilityAffected",
        profileKey: "personal.isDisabilityAffected",
        stage: "personal",
        question: "Do you have a disability that affects your housing needs?",
        subtext:
          "People living with disabilities often qualify for accessible housing programs with modified income thresholds and priority placement.",
        inputType: "boolean_cards",
        required: false,
        showWhen: {
          answerKey: "intention.housingGoals",
          excludes: [],
        },
      },
      {
        id: "personal.isPublicWorker",
        profileKey: "personal.isPublicWorker",
        stage: "personal",
        question: "Are you a teacher, healthcare worker, or first responder?",
        subtext:
          "Several programs specifically support public servants including teachers, nurses, paramedics, police, and firefighters.",
        inputType: "boolean_cards",
        required: false,
        showWhen: {
          answerKey: "intention.housingGoals",
          includesAny: ["teacher_housing", "healthcare_worker_housing", "affordable_housing", "first_time_homebuyer"],
        },
      },
    ],
  },

  /* ── Stage 6: Income ── */
  {
    id: "income",
    label: "Income",
    transition:
      "Income is the most important factor in housing program eligibility. Most programs use Area Median Income (AMI) thresholds — I just need a range, not an exact figure.",
    steps: [
      {
        id: "income.range",
        profileKey: "income.incomeRange",
        stage: "income",
        question: "What is your approximate monthly household income?",
        subtext:
          "Include all sources — wages, benefits, alimony, child support. I'll use this to match you with income-qualified programs. A range is fine.",
        inputType: "income_range",
        required: false,
      },
    ],
  },

  /* ── Stage 7: Employment ── */
  {
    id: "employment",
    label: "Employment",
    transition:
      "Your employment status helps me identify programs that are open to you — some require active employment, others support people between jobs.",
    steps: [
      {
        id: "employment.status",
        profileKey: "employment.status",
        stage: "employment",
        question: "What is your current employment situation?",
        subtext: "There's no wrong answer. I ask because some programs have employment requirements.",
        inputType: "radio_cards",
        options: EMPLOYMENT_STATUS_OPTIONS,
        required: false,
      },
    ],
  },

  /* ── Stage 8: Location & preferences ── */
  {
    id: "preferences",
    label: "Preferences",
    transition:
      "Almost there. These last few questions help me narrow down programs that are actually available in your area and match your housing needs.",
    steps: [
      {
        id: "preferences.states",
        profileKey: "preferences.preferredLocations",
        stage: "preferences",
        question: "Which states or cities are you open to?",
        subtext:
          "Housing programs are location-specific. Adding multiple states increases the number of matches I can show you.",
        inputType: "searchable_chips",
        required: false,
        searchPlaceholder: "Search states or cities…",
      },
      {
        id: "preferences.bedrooms",
        profileKey: "preferences.bedrooms",
        stage: "preferences",
        question: "How many bedrooms do you need?",
        subtext: "This helps filter programs with the right unit sizes for your household.",
        inputType: "numeric_stepper",
        required: false,
        stepperMin: 0,
        stepperMax: 8,
        stepperSuffix: "bedrooms",
      },
    ],
  },

  /* ── Stage 9: Live recommendation preview ── */
  {
    id: "recommendation_preview",
    label: "Your matches so far",
    steps: [
      {
        id: "recommendation_preview.panel",
        stage: "recommendation_preview",
        question: "Here's what I've found so far",
        subtext:
          "Based on what you've shared, I've already identified several programs that may fit your situation. Your matches will improve as I learn more.",
        inputType: "recommendation_preview",
        required: false,
      },
    ],
  },

  /* ── Stage 10: Completion summary ── */
  {
    id: "completion",
    label: "Complete",
    steps: [],
  },
];

/* ──────────────────────────────────────────────────────────────
   Flat step list (derived — keeps stage order)
────────────────────────────────────────────────────────────── */

export function getFlatSteps(): ConversationStep[] {
  return CONVERSATION_STAGES.flatMap((stage) => stage.steps);
}

/* ──────────────────────────────────────────────────────────────
   Branch rule evaluator
────────────────────────────────────────────────────────────── */

export function shouldShowStep(
  step: ConversationStep,
  answers: Record<string, unknown>
): boolean {
  if (!step.showWhen) return true;

  const rule = step.showWhen;
  const rawValue = answers[rule.answerKey];
  const valueArray: string[] = Array.isArray(rawValue)
    ? rawValue.map(String)
    : rawValue !== undefined && rawValue !== null && rawValue !== ""
    ? [String(rawValue)]
    : [];

  if (rule.includesAny && rule.includesAny.length > 0) {
    return rule.includesAny.some((v) => valueArray.includes(v));
  }

  if (rule.equals !== undefined) {
    return valueArray.includes(rule.equals);
  }

  if (rule.excludes && rule.excludes.length > 0) {
    return !rule.excludes.some((v) => valueArray.includes(v));
  }

  return true;
}

/* ──────────────────────────────────────────────────────────────
   Caseworker messages keyed by step ID
────────────────────────────────────────────────────────────── */

export const CASEWORKER_MESSAGES: Record<string, CaseworkerMessage> = {
  "welcome.intro": {
    message:
      "Hi, I'm your Heloci Housing Case Worker. I'm here to help you find housing opportunities that fit your life — not just fill out a form.",
    followUp:
      "Everything you share stays private and is only used to match you with programs. You can update or delete your profile at any time.",
    tone: "standard",
  },
  "intention.housingGoals": {
    message:
      "Your housing goal shapes everything. Whether you need emergency support tonight or are planning a first home purchase, each path has completely different programs.",
    followUp: "Select as many as apply — there's no wrong answer here.",
    tone: "standard",
  },
  "emergency.currentSituation": {
    message:
      "I want to make sure I connect you with the fastest available help. Some programs are designed specifically for people in urgent situations.",
    tone: "important",
  },
  "emergency.urgency": {
    message:
      "Emergency housing programs prioritise based on urgency. Being honest about your timeline helps me put the most relevant programs at the top of your list.",
    tone: "important",
  },
  "personal.isVeteran": {
    message:
      "Veteran housing programs often have fewer income restrictions and faster processing. Even if you've been out of service for years, you may still qualify.",
    tone: "encouraging",
  },
  "household.size": {
    message:
      "Many programs calculate assistance based on household size. A larger household often qualifies for higher income thresholds and larger units.",
    followUp: "Include everyone who will live with you — children, dependents, partners.",
    tone: "standard",
  },
  "personal.dateOfBirth": {
    message:
      "Some programs are specifically designed for applicants over 55 or 62. Others support young adults. Your age helps me surface the right tier.",
    tone: "standard",
  },
  "personal.isDisabilityAffected": {
    message:
      "Accessible housing programs often have separate, more generous income limits. There are also programs specifically for accessible unit types.",
    tone: "standard",
  },
  "personal.isPublicWorker": {
    message:
      "Teachers, nurses, paramedics, and first responders are prioritised in several programs — including some with below-market rates and down payment assistance.",
    tone: "encouraging",
  },
  "income.range": {
    message:
      "Most programs use income brackets tied to Area Median Income (AMI). A rough range is all I need — this won't disqualify you from anything.",
    followUp:
      "If you prefer not to share, select 'Prefer not to say' and I'll still show you programs where income isn't the deciding factor.",
    tone: "standard",
  },
  "employment.status": {
    message:
      "Some programs require active employment. Others are designed specifically for people between jobs or on benefits. There's a program for every situation.",
    tone: "standard",
  },
  "preferences.states": {
    message:
      "Housing programs are state and city specific. Adding more locations means more matches. If you're flexible, I'd recommend adding 2–3 states.",
    tone: "standard",
  },
  "preferences.bedrooms": {
    message:
      "This helps filter programs that actually have units available for your household size. If you're not sure, I'll include all options.",
    tone: "standard",
  },
  "recommendation_preview.panel": {
    message:
      "Great progress! Based on what you've shared so far, I've already identified programs that may be a good fit.",
    followUp:
      "Your list will get even better as we finish. Keep going — you're almost done.",
    tone: "encouraging",
  },
};

/* ──────────────────────────────────────────────────────────────
   Stage label helper (for progress bar stage names)
────────────────────────────────────────────────────────────── */

export function getStageForStep(stepId: string): ConversationStage | undefined {
  const step = getFlatSteps().find((s) => s.id === stepId);
  if (!step) return undefined;
  return CONVERSATION_STAGES.find((stage) => stage.id === step.stage);
}

export function getStageProgress(
  currentStepId: string
): { stageIndex: number; totalStages: number; stageLabel: string } {
  const allStages = CONVERSATION_STAGES.filter((s) => s.id !== "completion");
  const currentStage = getStageForStep(currentStepId);
  const stageIndex = currentStage
    ? allStages.findIndex((s) => s.id === currentStage.id)
    : 0;

  return {
    stageIndex: Math.max(0, stageIndex),
    totalStages: allStages.length,
    stageLabel: currentStage?.label ?? "",
  };
}
