/**
 * COMMUNICATION COMPOSER - INTEGRATION EXAMPLES
 * 
 * Real-world usage patterns for the unified CommunicationComposer component
 * in different parts of the HELOCI application.
 */

"use client";

import { useState } from "react";
import { CommunicationComposer } from "./CommunicationComposer";
import { MessageCircle, Mail, FileText, AlertCircle, Users } from "lucide-react";

/**
 * EXAMPLE 1: Send Message from Application Detail Page
 * 
 * Use Case: Staff member sends a message to applicant from application detail
 * Location: /app/admin/applications/[id]/page.tsx
 */
export function ApplicationDetailComposer({
  applicationId,
  organizationId,
  applicantEmail,
  applicantName,
}: {
  applicationId: string;
  organizationId: string;
  applicantEmail: string;
  applicantName: string;
}) {
  const [showComposer, setShowComposer] = useState(false);

  return (
    <>
      {/* Send Message Button */}
      <button
        onClick={() => setShowComposer(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <MessageCircle className="h-4 w-4" />
        Send Message
      </button>

      {/* Composer Modal */}
      {showComposer && (
        <CommunicationComposer
          mode="message"
          applicationId={applicationId}
          organizationId={organizationId}
          recipientEmail={applicantEmail}
          recipientName={applicantName}
          onClose={() => setShowComposer(false)}
          onSuccess={(message) => {
            console.log("Message sent successfully", message);
            // Refresh conversation timeline
            // Toast: "Message sent"
            setShowComposer(false);
          }}
          onError={(error) => {
            console.error("Failed to send message", error);
            // Toast: "Failed to send message: {error.message}"
          }}
        />
      )}
    </>
  );
}

/**
 * EXAMPLE 2: Document Request from Application Review
 * 
 * Use Case: Reviewer requests documents from applicant with deadline
 * Location: /app/admin/applications/[id]/documents/page.tsx
 */
export function DocumentRequestComposer({
  applicationId,
  organizationId,
  applicantEmail,
  applicantName,
}: {
  applicationId: string;
  organizationId: string;
  applicantEmail: string;
  applicantName: string;
}) {
  const [showComposer, setShowComposer] = useState(false);

  const handleRequestDocuments = () => {
    setShowComposer(true);
  };

  return (
    <>
      {/* Request Documents Button */}
      <button
        onClick={handleRequestDocuments}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
      >
        <FileText className="h-4 w-4" />
        Request Documents
      </button>

      {/* Document Request Composer */}
      {showComposer && (
        <CommunicationComposer
          mode="document_request"
          applicationId={applicationId}
          organizationId={organizationId}
          recipientEmail={applicantEmail}
          recipientName={applicantName}
          initialData={{
            body: "Please provide the following documents:\n\n• Proof of income\n• Tax returns (last 2 years)\n• Pay stubs (last 30 days)\n• Valid ID\n\nPlease submit by " + new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          }}
          onClose={() => setShowComposer(false)}
          onSuccess={(message) => {
            console.log("Document request sent", message);
            // Refresh documents list
            // Show toast: "Document request sent"
            setShowComposer(false);
          }}
          onError={(error) => {
            console.error("Failed to request documents", error);
          }}
        />
      )}
    </>
  );
}

/**
 * EXAMPLE 3: Decision Notification from Application Review
 * 
 * Use Case: Reviewer sends approval/rejection notification to applicant
 * Location: /app/admin/applications/[id]/decision/page.tsx
 */
export function DecisionNotificationComposer({
  applicationId,
  organizationId,
  applicantEmail,
  applicantName,
  currentDecision,
}: {
  applicationId: string;
  organizationId: string;
  applicantEmail: string;
  applicantName: string;
  currentDecision: "pending" | "approved" | "rejected" | "conditional";
}) {
  const [showComposer, setShowComposer] = useState(false);

  const getInitialDecisionData = () => {
    const templates: Record<string, string> = {
      approved: "Congratulations! Your application has been approved. You meet all program requirements.",
      rejected: "Unfortunately, your application does not meet the program requirements at this time.",
      conditional: "Your application has been approved with the following conditions:\n\n• Condition 1\n• Condition 2",
      pending: "Your application is under review. We will notify you of our decision soon.",
    };

    return {
      body: templates[currentDecision],
    };
  };

  return (
    <>
      {/* Send Decision Button */}
      <button
        onClick={() => setShowComposer(true)}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        <AlertCircle className="h-4 w-4" />
        Send Decision Notification
      </button>

      {/* Decision Notification Composer */}
      {showComposer && (
        <CommunicationComposer
          mode="decision_notification"
          applicationId={applicationId}
          organizationId={organizationId}
          recipientEmail={applicantEmail}
          recipientName={applicantName}
          initialData={getInitialDecisionData()}
          onClose={() => setShowComposer(false)}
          onSuccess={(message) => {
            console.log("Decision notification sent", message);
            // Update application status in background
            // updateApplicationStatus(applicationId, currentDecision);
            // Show toast: "Decision notification sent"
            setShowComposer(false);
          }}
          onError={(error) => {
            console.error("Failed to send decision", error);
          }}
        />
      )}
    </>
  );
}

/**
 * EXAMPLE 4: Staff Announcement
 * 
 * Use Case: Admin broadcasts announcement to all staff members
 * Location: /app/admin/communications/announcements/page.tsx
 */
export function StaffAnnouncementComposer({
  organizationId,
  staffMembers,
}: {
  organizationId: string;
  staffMembers: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
  }>;
}) {
  const [showComposer, setShowComposer] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const getRecipientsForRole = (role: string | null) => {
    if (!role) return staffMembers;
    return staffMembers.filter((m) => m.role === role);
  };

  const recipients = selectedRole ? getRecipientsForRole(selectedRole) : staffMembers;

  return (
    <>
      {/* Broadcast Announcement Button */}
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Send to:</label>
          <select
            value={selectedRole || "all"}
            onChange={(e) => setSelectedRole(e.target.value === "all" ? null : e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Staff ({staffMembers.length})</option>
            <option value="org_admin">Admins ({staffMembers.filter((m) => m.role === "org_admin").length})</option>
            <option value="case_worker">Case Workers ({staffMembers.filter((m) => m.role === "case_worker").length})</option>
            <option value="reviewer">Reviewers ({staffMembers.filter((m) => m.role === "reviewer").length})</option>
          </select>
        </div>

        <button
          onClick={() => setShowComposer(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 h-fit"
        >
          <Users className="h-4 w-4" />
          Send Announcement
        </button>
      </div>

      {/* Announcement Composer */}
      {showComposer && (
        <CommunicationComposer
          mode="announcement"
          organizationId={organizationId}
          initialData={{
            recipients: recipients.map((m) => m.email),
          }}
          onClose={() => setShowComposer(false)}
          onSuccess={(message) => {
            console.log("Announcement sent to", recipients.length, "staff members");
            // Show toast: "Announcement sent to {recipients.length} recipients"
            setShowComposer(false);
          }}
          onError={(error) => {
            console.error("Failed to send announcement", error);
          }}
        />
      )}
    </>
  );
}

/**
 * EXAMPLE 5: Email to External Partner
 * 
 * Use Case: Send formatted email to housing partner or external organization
 * Location: /app/admin/communications/email/page.tsx
 */
export function ExternalEmailComposer({
  organizationId,
  recipientEmail,
  recipientName,
}: {
  organizationId: string;
  recipientEmail: string;
  recipientName: string;
}) {
  const [showComposer, setShowComposer] = useState(false);

  return (
    <>
      {/* Send Email Button */}
      <button
        onClick={() => setShowComposer(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        <Mail className="h-4 w-4" />
        Send Email
      </button>

      {/* Email Composer */}
      {showComposer && (
        <CommunicationComposer
          mode="email"
          organizationId={organizationId}
          recipientEmail={recipientEmail}
          recipientName={recipientName}
          onClose={() => setShowComposer(false)}
          onSuccess={(message) => {
            console.log("Email sent to", recipientEmail);
            // Show toast: "Email sent"
            setShowComposer(false);
          }}
          onError={(error) => {
            console.error("Failed to send email", error);
          }}
        />
      )}
    </>
  );
}

/**
 * EXAMPLE 6: Reply in Conversation
 * 
 * Use Case: Staff replies to applicant message in case conversation
 * Location: /app/admin/applications/[id]/conversation/page.tsx
 */
export function ConversationReplyComposer({
  applicationId,
  organizationId,
  applicantEmail,
  applicantName,
  originalMessage,
}: {
  applicationId: string;
  organizationId: string;
  applicantEmail: string;
  applicantName: string;
  originalMessage: {
    id: string;
    content: string;
    senderName: string;
    createdAt: Date;
  };
}) {
  const [showComposer, setShowComposer] = useState(false);

  return (
    <>
      {/* Reply Button */}
      <button
        onClick={() => setShowComposer(true)}
        className="flex items-center gap-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        <MessageCircle className="h-3 w-3" />
        Reply
      </button>

      {/* Reply Composer with Original Message Context */}
      {showComposer && (
        <>
          {/* Original message preview */}
          <div className="mb-4 p-3 bg-slate-100 rounded-lg border-l-4 border-indigo-600">
            <p className="text-xs text-slate-600 mb-1">
              In reply to {originalMessage.senderName} ({originalMessage.createdAt.toLocaleString()}):
            </p>
            <p className="text-sm text-slate-800">{originalMessage.content}</p>
          </div>

          {/* Composer */}
          <CommunicationComposer
            mode="reply"
            applicationId={applicationId}
            organizationId={organizationId}
            recipientEmail={applicantEmail}
            recipientName={applicantName}
            onClose={() => setShowComposer(false)}
            onSuccess={(message) => {
              console.log("Reply sent", message);
              // Refresh conversation thread
              setShowComposer(false);
            }}
            onError={(error) => {
              console.error("Failed to send reply", error);
            }}
          />
        </>
      )}
    </>
  );
}

/**
 * EXAMPLE 7: Composing in Communication Hub
 * 
 * Use Case: Unified composition button in main Communication Hub
 * Location: /app/admin/communication/page.tsx
 */
export function CommunicationHubCompose({
  organizationId,
  defaultMode = "message",
}: {
  organizationId: string;
  defaultMode?: "message" | "email" | "announcement";
}) {
  const [showComposer, setShowComposer] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"message" | "email" | "announcement">(defaultMode);

  return (
    <>
      {/* Compose Button */}
      <button
        onClick={() => setShowComposer(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-brand text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Mode Selection Modal (if showing) */}
      {showComposer && (
        <CommunicationComposer
          mode={selectedMode}
          organizationId={organizationId}
          onClose={() => setShowComposer(false)}
          onSuccess={() => {
            setShowComposer(false);
            // Refresh inbox or conversation list
          }}
        />
      )}
    </>
  );
}

/**
 * EXAMPLE 8: Bulk Operations
 * 
 * Use Case: Send same message to multiple applicants
 * Location: /app/admin/applications/bulk/page.tsx
 */
export function BulkMessageComposer({
  organizationId,
  selectedApplications,
}: {
  organizationId: string;
  selectedApplications: Array<{
    id: string;
    applicantEmail: string;
    applicantName: string;
  }>;
}) {
  const [showComposer, setShowComposer] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");
  const [sent, setSent] = useState(0);

  const handleSendToAll = async () => {
    for (const app of selectedApplications) {
      try {
        // Each composer instance handles one send
        await fetch("/api/communications/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: app.id,
            organizationId,
            content: templateMessage,
            messageType: "normal",
          }),
        });
        setSent((prev) => prev + 1);
      } catch (error) {
        console.error(`Failed to send to ${app.applicantEmail}`, error);
      }
    }

    // Show summary toast
    alert(`Sent to ${sent}/${selectedApplications.length} applicants`);
    setShowComposer(false);
  };

  return (
    <>
      {/* Bulk Send Button */}
      <button
        onClick={() => setShowComposer(true)}
        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
      >
        Send to {selectedApplications.length} Applicants
      </button>

      {/* Bulk Composer */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              Send Message to {selectedApplications.length} Applicants
            </h2>

            <textarea
              value={templateMessage}
              onChange={(e) => setTemplateMessage(e.target.value)}
              placeholder="Enter message to send to all selected applicants..."
              rows={6}
              className="w-full px-4 py-3 border rounded-lg mb-4"
            />

            <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-slate-700">
              Recipients: {selectedApplications.map((a) => a.applicantName).join(", ")}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToAll}
                disabled={!templateMessage.trim()}
                className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50"
              >
                Send to All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * TESTING EXAMPLE
 * 
 * Unit test demonstrating component behavior
 */
export function CommunicationComposerTest() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">CommunicationComposer Examples</h2>

      <div className="grid grid-cols-2 gap-4">
        <ApplicationDetailComposer
          applicationId="app_123"
          organizationId="org_456"
          applicantEmail="applicant@example.com"
          applicantName="John Doe"
        />

        <DocumentRequestComposer
          applicationId="app_123"
          organizationId="org_456"
          applicantEmail="applicant@example.com"
          applicantName="John Doe"
        />

        <DecisionNotificationComposer
          applicationId="app_123"
          organizationId="org_456"
          applicantEmail="applicant@example.com"
          applicantName="John Doe"
          currentDecision="approved"
        />

        <ExternalEmailComposer
          organizationId="org_456"
          recipientEmail="partner@housing.org"
          recipientName="Housing Partner"
        />
      </div>
    </div>
  );
}
