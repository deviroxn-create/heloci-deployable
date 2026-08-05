"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";
import { apiApproveApplication, apiConditionallyApproveApplication, apiRejectApplication, apiWaitlistApplication, apiEscalateApplication, apiRequestAdditionalInfo, apiWithdrawApplication, apiCloseCase, getErrorMessage } from "@/lib/reviews/decision-api-client";
import { TemplateSelector } from "./template-selector";
import type { DecisionType } from "@/lib/reviews/decision.types";

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  organizationId: string;
  onSuccess: () => void;
}

// Modal Wrapper using Card
function ModalOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// 1. APPROVE DIALOG
// ============================================================================

interface ApproveDialogProps extends BaseDialogProps {
  applicantName?: string;
}

export function ApproveDialog({ open, onOpenChange, applicationId, organizationId, onSuccess, applicantName = "Applicant" }: ApproveDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [applicantMessage, setApplicantMessage] = useState("Congratulations! Your application has been approved.");
  const [internalNotes, setInternalNotes] = useState("");
  const [sendNotification, setSendNotification] = useState(true);

  const handleTemplateSelect = (template: any) => {
    if (template.id) {
      setApplicantMessage(template.body || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiApproveApplication(applicationId, {
        staffUserId: "",
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        applicantMessage: sendNotification ? applicantMessage : undefined,
        internalNotes: internalNotes || undefined,
      });

      if (!response.success) {
        setError(getErrorMessage(response));
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={() => onOpenChange(false)}>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Approve Application</h2>
        <p className="text-sm text-slate-600 mt-1">Confirm approval for {applicantName}. They will receive a notification.</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <div>
            <Label className="text-sm font-medium">Use Template (Optional)</Label>
            <TemplateSelector
              organizationId={organizationId}
              decisionType="approved"
              onTemplateSelect={handleTemplateSelect}
              loading={loading}
            />
          </div>

          <div>
            <Label htmlFor="effective-date">Effective Date (Optional)</Label>
            <Input id="effective-date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} disabled={loading} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="send-notification" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} disabled={loading} className="h-4 w-4 rounded" />
            <Label htmlFor="send-notification" className="font-normal">Send notification to applicant</Label>
          </div>

          {sendNotification && (
            <div>
              <Label htmlFor="applicant-message">Message to Applicant</Label>
              <Textarea id="applicant-message" placeholder="Enter message..." value={applicantMessage} onChange={(e) => setApplicantMessage(e.target.value)} disabled={loading} rows={3} />
            </div>
          )}

          <div>
            <Label htmlFor="internal-notes">Internal Notes (Reviewers Only)</Label>
            <Textarea id="internal-notes" placeholder="Add notes..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} disabled={loading} rows={2} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Approve</Button>
          </div>
        </form>
      </Card>
    </ModalOverlay>
  );
}

// ============================================================================
// 2. CONDITIONAL APPROVAL DIALOG
// ============================================================================

export function ConditionalApprovalDialog({ open, onOpenChange, applicationId, organizationId, onSuccess, applicantName = "Applicant" }: BaseDialogProps & { applicantName?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conditions, setConditions] = useState<string[]>([""]); 
  const [expirationDate, setExpirationDate] = useState("");
  const [applicantMessage, setApplicantMessage] = useState("Your application has been conditionally approved. Please review the conditions below.");
  const [internalNotes, setInternalNotes] = useState("");

  const handleTemplateSelect = (template: any) => {
    if (template.id) {
      setApplicantMessage(template.body || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const filledConditions = conditions.filter((c) => c.trim());
    if (filledConditions.length === 0) { setError("Please add at least one condition"); return; }
    if (!applicantMessage.trim()) { setError("Please provide a message to the applicant"); return; }
    setLoading(true);

    try {
      const response = await apiConditionallyApproveApplication(applicationId, {
        staffUserId: "",
        conditions: filledConditions,
        applicantMessage,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        internalNotes: internalNotes || undefined,
      });

      if (!response.success) { setError(getErrorMessage(response)); return; }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={() => onOpenChange(false)}>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Conditional Approval</h2>
        <p className="text-sm text-slate-600 mt-1">Approve with conditions for {applicantName}</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <div>
            <Label className="text-sm font-medium">Use Template (Optional)</Label>
            <TemplateSelector
              organizationId={organizationId}
              decisionType="conditional_approval"
              onTemplateSelect={handleTemplateSelect}
              loading={loading}
            />
          </div>

          <div>
            <Label className="font-semibold">Conditions (Required)</Label>
            <div className="space-y-2 mt-2">
              {conditions.map((condition, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input placeholder={`Condition ${idx + 1}...`} value={condition} onChange={(e) => { const u = [...conditions]; u[idx] = e.target.value; setConditions(u); }} disabled={loading} />
                  {conditions.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setConditions(conditions.filter((_, i) => i !== idx))} disabled={loading}><X className="h-4 w-4" /></Button>}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setConditions([...conditions, ""])} disabled={loading} className="mt-2 gap-1"><Plus className="h-4 w-4" />Add</Button>
          </div>

          <div><Label htmlFor="exp-date">Deadline (Optional)</Label><Input id="exp-date" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} disabled={loading} /></div>

          <div><Label htmlFor="app-msg">Message to Applicant</Label><Textarea id="app-msg" placeholder="Explain the conditions..." value={applicantMessage} onChange={(e) => setApplicantMessage(e.target.value)} disabled={loading} rows={3} /></div>

          <div><Label htmlFor="int-notes">Internal Notes</Label><Textarea id="int-notes" placeholder="Add notes..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} disabled={loading} rows={2} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Approve</Button>
          </div>
        </form>
      </Card>
    </ModalOverlay>
  );
}

// ============================================================================
// 3. REJECT DIALOG
// ============================================================================

export function RejectDialog({ open, onOpenChange, applicationId, organizationId, onSuccess, applicantName = "Applicant" }: BaseDialogProps & { applicantName?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [applicantMessage, setApplicantMessage] = useState("Your application has been reviewed and unfortunately does not meet the program requirements at this time.");
  const [internalNotes, setInternalNotes] = useState("");
  const [sendNotification, setSendNotification] = useState(true);

  const handleTemplateSelect = (template: any) => {
    if (template.id) {
      setApplicantMessage(template.body || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) { setError("Please provide a reason for rejection"); return; }
    setLoading(true);

    try {
      const response = await apiRejectApplication(applicationId, {
        staffUserId: "",
        reason,
        applicantMessage: sendNotification ? applicantMessage : undefined,
        internalNotes: internalNotes || undefined,
      });

      if (!response.success) { setError(getErrorMessage(response)); return; }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={() => onOpenChange(false)}>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Reject Application</h2>
        <p className="text-sm text-slate-600 mt-1">Reject the application for {applicantName}</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <div>
            <Label className="text-sm font-medium">Use Template (Optional)</Label>
            <TemplateSelector
              organizationId={organizationId}
              decisionType="rejected"
              onTemplateSelect={handleTemplateSelect}
              loading={loading}
            />
          </div>

          <div><Label htmlFor="reason">Rejection Reason (Required)</Label><Textarea id="reason" placeholder="Why is this application being rejected?" value={reason} onChange={(e) => setReason(e.target.value)} disabled={loading} rows={3} /></div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="send-notif" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} disabled={loading} className="h-4 w-4 rounded" />
            <Label htmlFor="send-notif" className="font-normal">Send notification to applicant</Label>
          </div>

          {sendNotification && <div><Label htmlFor="app-msg">Message to Applicant</Label><Textarea id="app-msg" placeholder="Enter rejection message..." value={applicantMessage} onChange={(e) => setApplicantMessage(e.target.value)} disabled={loading} rows={3} /></div>}

          <div><Label htmlFor="int-notes">Internal Notes</Label><Textarea id="int-notes" placeholder="Add notes..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} disabled={loading} rows={2} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Reject</Button>
          </div>
        </form>
      </Card>
    </ModalOverlay>
  );
}

// ============================================================================
// 4. WAITLIST DIALOG
// ============================================================================

export function WaitlistDialog({ open, onOpenChange, applicationId, organizationId, onSuccess, applicantName = "Applicant" }: BaseDialogProps & { applicantName?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("medium");
  const [expectedReviewDate, setExpectedReviewDate] = useState("");
  const [applicantMessage, setApplicantMessage] = useState("Your application has been placed on our waitlist. We will review it in the future.");
  const [internalNotes, setInternalNotes] = useState("");

  const handleTemplateSelect = (template: any) => {
    if (template.id) {
      setApplicantMessage(template.body || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiWaitlistApplication(applicationId, {
        staffUserId: "",
        reason: reason || undefined,
        expectedReviewDate: expectedReviewDate ? new Date(expectedReviewDate) : undefined,
        applicantMessage: applicantMessage || undefined,
        internalNotes: internalNotes || undefined,
      });

      if (!response.success) { setError(getErrorMessage(response)); return; }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={() => onOpenChange(false)}>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Waitlist Application</h2>
        <p className="text-sm text-slate-600 mt-1">Place {applicantName} on the waitlist</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <div>
            <Label className="text-sm font-medium">Use Template (Optional)</Label>
            <TemplateSelector
              organizationId={organizationId}
              decisionType="waitlisted"
              onTemplateSelect={handleTemplateSelect}
              loading={loading}
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
            </Select>
          </div>

          <div><Label htmlFor="review-date">Expected Review Date (Optional)</Label><Input id="review-date" type="date" value={expectedReviewDate} onChange={(e) => setExpectedReviewDate(e.target.value)} disabled={loading} /></div>

          <div><Label htmlFor="reason">Waitlist Reason (Optional)</Label><Textarea id="reason" placeholder="Why is this application being waitlisted?" value={reason} onChange={(e) => setReason(e.target.value)} disabled={loading} rows={2} /></div>

          <div><Label htmlFor="app-msg">Message to Applicant</Label><Textarea id="app-msg" placeholder="Inform applicant about waitlist status..." value={applicantMessage} onChange={(e) => setApplicantMessage(e.target.value)} disabled={loading} rows={3} /></div>

          <div><Label htmlFor="int-notes">Internal Notes</Label><Textarea id="int-notes" placeholder="Add notes..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} disabled={loading} rows={2} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Add to Waitlist</Button>
          </div>
        </form>
      </Card>
    </ModalOverlay>
  );
}

// ============================================================================
// 5. ESCALATE DIALOG
// ============================================================================

export function EscalateDialog({ open, onOpenChange, applicationId, organizationId, onSuccess, applicantName = "Applicant" }: BaseDialogProps & { applicantName?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [escalateDepartment, setEscalateDepartment] = useState("manager");
  const [escalatePriority, setEscalatePriority] = useState("medium");
  const [applicantMessage, setApplicantMessage] = useState("Your application is being reviewed by our management team.");
  const [internalNotes, setInternalNotes] = useState("");

  const handleTemplateSelect = (template: any) => {
    if (template.id) {
      setApplicantMessage(template.body || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) { setError("Please provide a reason for escalation"); return; }
    setLoading(true);

    try {
      const response = await apiEscalateApplication(applicationId, {
        staffUserId: "",
        reason,
        applicantMessage: applicantMessage || undefined,
        internalNotes: internalNotes || undefined,
      });

      if (!response.success) { setError(getErrorMessage(response)); return; }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={() => onOpenChange(false)}>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Escalate Application</h2>
        <p className="text-sm text-slate-600 mt-1">Escalate {applicantName}&apos;s application for higher review</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <div>
            <Label className="text-sm font-medium">Use Template (Optional)</Label>
            <TemplateSelector
              organizationId={organizationId}
              decisionType="escalated"
              onTemplateSelect={handleTemplateSelect}
              loading={loading}
            />
          </div>

          <div>
            <Label htmlFor="department">Escalate To</Label>
            <Select value={escalateDepartment} onValueChange={setEscalateDepartment} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="manager">Manager</SelectItem><SelectItem value="director">Director</SelectItem><SelectItem value="executive">Executive</SelectItem><SelectItem value="legal">Legal</SelectItem><SelectItem value="compliance">Compliance</SelectItem></SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={escalatePriority} onValueChange={setEscalatePriority} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
            </Select>
          </div>

          <div><Label htmlFor="reason">Escalation Reason (Required)</Label><Textarea id="reason" placeholder="Why is this application being escalated?" value={reason} onChange={(e) => setReason(e.target.value)} disabled={loading} rows={3} /></div>

          <div><Label htmlFor="app-msg">Message to Applicant (Optional)</Label><Textarea id="app-msg" placeholder="Inform applicant about escalation..." value={applicantMessage} onChange={(e) => setApplicantMessage(e.target.value)} disabled={loading} rows={2} /></div>

          <div><Label htmlFor="int-notes">Internal Notes</Label><Textarea id="int-notes" placeholder="Add notes for escalation team..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} disabled={loading} rows={2} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Escalate</Button>
          </div>
        </form>
      </Card>
    </ModalOverlay>
  );
}

// ============================================================================
// 6. REQUEST ADDITIONAL INFORMATION DIALOG
// ============================================================================

export function RequestAdditionalInfoDialog({ open, onOpenChange, applicationId, organizationId, onSuccess, applicantName = "Applicant" }: BaseDialogProps & { applicantName?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<string[]>([""]); 
  const [deadline, setDeadline] = useState("");
  const [instructions, setInstructions] = useState("");
  const [applicantMessage, setApplicantMessage] = useState("We need some additional information to complete your application review. Please provide the requested documents by the deadline below.");
  const [internalNotes, setInternalNotes] = useState("");

  const handleTemplateSelect = (template: any) => {
    if (template.id) {
      setApplicantMessage(template.body || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const filledItems = items.filter((i) => i.trim());
    if (filledItems.length === 0) { setError("Please add at least one item"); return; }
    setLoading(true);

    try {
      const response = await apiRequestAdditionalInfo(applicationId, {
        staffUserId: "",
        informationNeeded: filledItems,
        deadline: deadline ? new Date(deadline) : undefined,
        instructions: instructions || undefined,
        applicantMessage: applicantMessage || undefined,
        internalNotes: internalNotes || undefined,
      });

      if (!response.success) { setError(getErrorMessage(response)); return; }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={() => onOpenChange(false)}>
      <Card className="p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold">Request Additional Information</h2>
        <p className="text-sm text-slate-600 mt-1">Request documents or information from {applicantName}</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <div>
            <Label className="text-sm font-medium">Use Template (Optional)</Label>
            <TemplateSelector
              organizationId={organizationId}
              decisionType="needs_info"
              onTemplateSelect={handleTemplateSelect}
              loading={loading}
            />
          </div>

          <div>
            <Label className="font-semibold">Requested Items (Required)</Label>
            <div className="space-y-2 mt-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input placeholder={`Item ${idx + 1}: Document or information...`} value={item} onChange={(e) => { const u = [...items]; u[idx] = e.target.value; setItems(u); }} disabled={loading} />
                  {items.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={loading}><X className="h-4 w-4" /></Button>}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, ""])} disabled={loading} className="mt-2 gap-1"><Plus className="h-4 w-4" />Add</Button>
          </div>

          <div><Label htmlFor="deadline">Deadline (Optional)</Label><Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} disabled={loading} /></div>

          <div><Label htmlFor="instructions">Submission Instructions (Optional)</Label><Textarea id="instructions" placeholder="How should the applicant submit the information?" value={instructions} onChange={(e) => setInstructions(e.target.value)} disabled={loading} rows={2} /></div>

          <div><Label htmlFor="app-msg">Message to Applicant</Label><Textarea id="app-msg" placeholder="Explain what you need..." value={applicantMessage} onChange={(e) => setApplicantMessage(e.target.value)} disabled={loading} rows={3} /></div>

          <div><Label htmlFor="int-notes">Internal Notes</Label><Textarea id="int-notes" placeholder="Add notes..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} disabled={loading} rows={2} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Send Request</Button>
          </div>
        </form>
      </Card>
    </ModalOverlay>
  );
}

// ============================================================================
// 7. WITHDRAW DIALOG
// ============================================================================

export function WithdrawDialog({ open, onOpenChange, applicationId, organizationId, onSuccess, applicantName = "Applicant" }: BaseDialogProps & { applicantName?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [withdrawnByApplicant, setWithdrawnByApplicant] = useState(false);
  const [applicantMessage, setApplicantMessage] = useState("Your application has been withdrawn. You can reapply in the future.");
  const [internalNotes, setInternalNotes] = useState("");

  const handleTemplateSelect = (template: any) => {
    if (template.id) {
      setApplicantMessage(template.body || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) { setError("Please provide a reason for withdrawal"); return; }
    setLoading(true);

    try {
      const response = await apiWithdrawApplication(applicationId, {
        staffUserId: "",
        reason,
        applicantMessage: applicantMessage || undefined,
        internalNotes: internalNotes || undefined,
        withdrawnByApplicant,
      });

      if (!response.success) { setError(getErrorMessage(response)); return; }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={() => onOpenChange(false)}>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Withdraw Application</h2>
        <p className="text-sm text-slate-600 mt-1">Withdraw the application for {applicantName}</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <div>
            <Label className="text-sm font-medium">Use Template (Optional)</Label>
            <TemplateSelector
              organizationId={organizationId}
              decisionType="withdrawn"
              onTemplateSelect={handleTemplateSelect}
              loading={loading}
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="withdrawn-by-applicant" checked={withdrawnByApplicant} onChange={(e) => setWithdrawnByApplicant(e.target.checked)} disabled={loading} className="h-4 w-4 rounded" />
            <Label htmlFor="withdrawn-by-applicant" className="font-normal">Applicant initiated withdrawal</Label>
          </div>

          <div><Label htmlFor="reason">Withdrawal Reason (Required)</Label><Textarea id="reason" placeholder="Why is this application being withdrawn?" value={reason} onChange={(e) => setReason(e.target.value)} disabled={loading} rows={3} /></div>

          <div><Label htmlFor="app-msg">Message to Applicant</Label><Textarea id="app-msg" placeholder="Inform applicant about withdrawal..." value={applicantMessage} onChange={(e) => setApplicantMessage(e.target.value)} disabled={loading} rows={2} /></div>

          <div><Label htmlFor="int-notes">Internal Notes</Label><Textarea id="int-notes" placeholder="Add notes..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} disabled={loading} rows={2} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Withdraw</Button>
          </div>
        </form>
      </Card>
    </ModalOverlay>
  );
}

// ============================================================================
// 8. CLOSE CASE DIALOG
// ============================================================================

export function CloseCaseDialog({ open, onOpenChange, applicationId, organizationId, onSuccess, applicantName = "Applicant" }: BaseDialogProps & { applicantName?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [finalNotes, setFinalNotes] = useState("");

  const handleTemplateSelect = (template: any) => {
    if (template.id) {
      setFinalNotes(template.body || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) { setError("Please provide a reason for closure"); return; }
    setLoading(true);

    try {
      const response = await apiCloseCase(applicationId, {
        staffUserId: "",
        reason,
        internalNotes: finalNotes || undefined,
      });

      if (!response.success) { setError(getErrorMessage(response)); return; }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={() => onOpenChange(false)}>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Close Case</h2>
        <p className="text-sm text-slate-600 mt-1">Close the case for {applicantName}</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          <div>
            <Label className="text-sm font-medium">Use Template (Optional)</Label>
            <TemplateSelector
              organizationId={organizationId}
              decisionType="closed"
              onTemplateSelect={handleTemplateSelect}
              loading={loading}
            />
          </div>

          <div><Label htmlFor="reason">Closure Reason (Required)</Label><Textarea id="reason" placeholder="Why is this case being closed?" value={reason} onChange={(e) => setReason(e.target.value)} disabled={loading} rows={3} /></div>

          <div><Label htmlFor="final-notes">Final Notes</Label><Textarea id="final-notes" placeholder="Add any final notes..." value={finalNotes} onChange={(e) => setFinalNotes(e.target.value)} disabled={loading} rows={3} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Close Case</Button>
          </div>
        </form>
      </Card>
    </ModalOverlay>
  );
}
