/**
 * PHASE 5F — Trace Recorder
 * 
 * Captures execution flow through the notification pipeline for certification.
 * Every stage records what it received, what it produced, and how long it took.
 * 
 * This enables:
 * 1. Verification that values don't mutate unexpectedly
 * 2. Identification of which stage introduced a defect
 * 3. Audit trail for compliance
 * 4. Reproducible tracing for debugging
 * 
 * Usage:
 * ```typescript
 * const tracer = new TraceRecorder(traceId);
 * 
 * const startTime = performance.now();
 * const output = audienceResolver.resolve(input);
 * const duration = performance.now() - startTime;
 * 
 * tracer.recordStep({
 *   stage: 'audience_resolution',
 *   input: { eventName, contextOrg: context.organizationId },
 *   output: { recipientCount: output.recipients.length },
 *   duration,
 *   mutations: [],
 *   status: 'pass',
 * });
 * ```
 */

export interface TraceStep {
  /**
   * Stage name (e.g., 'initial_request', 'audience_resolution', 'planning', etc.)
   */
  stage: string;

  /**
   * Input snapshot (what this stage received)
   * Keep this minimal — only values that matter for verification
   * Do NOT include full objects or payloads (too noisy)
   */
  input: Record<string, unknown>;

  /**
   * Output snapshot (what this stage produced)
   * Again, minimal — only the results that matter
   */
  output: Record<string, unknown>;

  /**
   * Execution time in milliseconds
   */
  duration: number;

  /**
   * Any unexpected mutations detected
   * Examples:
   * - "recipient changed from john@ex.com to admin@ex.com"
   * - "organizationId dropped from context"
   * - "audience_role mutated from applicant to admin"
   */
  mutations: string[];

  /**
   * Pass/fail status for this stage
   */
  status: 'pass' | 'fail' | 'warn';

  /**
   * If status is 'fail' or 'warn', describe the issue
   */
  errorMessage?: string;
}

export interface TraceReport {
  traceId: string;
  timestamp: string;
  eventName: string;
  totalDuration: number;
  steps: TraceStep[];
  certification: {
    passed: boolean;
    checklist: Record<string, boolean>;
    blockers: string[];
  };
}

/**
 * Records execution trace through notification pipeline
 */
export class TraceRecorder {
  private steps: TraceStep[] = [];
  private traceId: string;
  private eventName: string;
  private startTime: number;
  private checklist: Record<string, boolean> = {
    'event_name_preserved': false,
    'organization_id_preserved': false,
    'audience_preserved': false,
    'recipient_preserved': false,
    'sender_preserved': false,
    'template_preserved': false,
    'channel_preserved': false,
    'correlation_id_preserved': false,
    'no_unexpected_mutations': false,
    'provider_response_logged': false,
    'audit_trail_complete': false,
  };
  private blockers: string[] = [];

  constructor(traceId: string, eventName: string) {
    this.traceId = traceId;
    this.eventName = eventName;
    this.startTime = performance.now();
  }

  /**
   * Record a single stage execution
   */
  recordStep(step: TraceStep) {
    this.steps.push(step);

    // If any step failed, track it as a blocker
    if (step.status === 'fail') {
      this.blockers.push(`${step.stage}: ${step.errorMessage || 'failed'}`);
    }

    // If unexpected mutations, flag it
    if (step.mutations.length > 0) {
      this.checklist['no_unexpected_mutations'] = false;
      this.blockers.push(`${step.stage}: unexpected mutations: ${step.mutations.join(', ')}`);
    }
  }

  /**
   * Mark that a certification item passed
   */
  checklistPass(item: keyof typeof this.checklist) {
    this.checklist[item] = true;
  }

  /**
   * Mark that a certification item failed
   */
  checklistFail(item: keyof typeof this.checklist, reason: string) {
    this.checklist[item] = false;
    this.blockers.push(`${item}: ${reason}`);
  }

  /**
   * Generate the final certification report
   */
  getReport(): TraceReport {
    const totalDuration = performance.now() - this.startTime;

    // If no blockers and all checklist items pass, certification passes
    const passed = this.blockers.length === 0 && Object.values(this.checklist).every(v => v);

    return {
      traceId: this.traceId,
      timestamp: new Date().toISOString(),
      eventName: this.eventName,
      totalDuration: Math.round(totalDuration),
      steps: this.steps,
      certification: {
        passed,
        checklist: this.checklist,
        blockers: this.blockers,
      },
    };
  }

  /**
   * Pretty-print report to console
   */
  printReport(report: TraceReport) {
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('RUNTIME CERTIFICATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    console.log(`EVENT: ${report.eventName}`);
    console.log(`TRACE_ID: ${report.traceId}`);
    console.log(`TIMESTAMP: ${report.timestamp}`);
    console.log(`TOTAL_DURATION: ${report.totalDuration}ms\n`);

    console.log('───────────────────────────────────────────────────────────────────\n');
    console.log('STAGES:\n');

    for (const step of report.steps) {
      const statusSymbol = step.status === 'pass' ? '✓' : step.status === 'fail' ? '✗' : '⚠';
      console.log(`${statusSymbol} ${step.stage} (${step.duration.toFixed(2)}ms)`);
      console.log(`  Input: ${JSON.stringify(step.input)}`);
      console.log(`  Output: ${JSON.stringify(step.output)}`);
      if (step.mutations.length > 0) {
        console.log(`  Mutations: ${step.mutations.join(', ')}`);
      }
      if (step.errorMessage) {
        console.log(`  Error: ${step.errorMessage}`);
      }
      console.log();
    }

    console.log('───────────────────────────────────────────────────────────────────\n');
    console.log('CERTIFICATION CHECKLIST:\n');

    for (const [item, passed] of Object.entries(report.certification.checklist)) {
      const symbol = passed ? '✓' : '✗';
      console.log(`${symbol} ${item}`);
    }

    console.log('\n───────────────────────────────────────────────────────────────────\n');

    if (report.certification.blockers.length > 0) {
      console.log('BLOCKERS:\n');
      for (const blocker of report.certification.blockers) {
        console.log(`✗ ${blocker}`);
      }
      console.log();
    }

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`CERTIFICATION RESULT: ${report.certification.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log('═══════════════════════════════════════════════════════════════════\n');
  }

  /**
   * Serialize report to JSON for storage/analysis
   */
  toJSON(): string {
    return JSON.stringify(this.getReport(), null, 2);
  }
}

/**
 * Helper: Compare two values and return human-readable description if they differ
 * 
 * Usage:
 * ```typescript
 * const mutation = valueChanged('john@ex.com', 'admin@ex.com', 'recipient');
 * if (mutation) {
 *   step.mutations.push(mutation);
 * }
 * ```
 */
export function valueChanged(before: unknown, after: unknown, fieldName: string): string | null {
  if (before !== after) {
    return `${fieldName} changed from ${JSON.stringify(before)} to ${JSON.stringify(after)}`;
  }
  return null;
}

/**
 * Helper: Check if array contents changed (order-agnostic for primitive arrays)
 */
export function arrayChanged(before: unknown[], after: unknown[], fieldName: string): string | null {
  const beforeSet = new Set(before.map(v => JSON.stringify(v)));
  const afterSet = new Set(after.map(v => JSON.stringify(v)));

  if (beforeSet.size !== afterSet.size) {
    return `${fieldName} array size changed from ${beforeSet.size} to ${afterSet.size}`;
  }

  for (const item of beforeSet) {
    if (!afterSet.has(item)) {
      return `${fieldName} item removed: ${item}`;
    }
  }

  for (const item of afterSet) {
    if (!beforeSet.has(item)) {
      return `${fieldName} item added: ${item}`;
    }
  }

  return null;
}
