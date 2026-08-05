"use client";

import { useState } from "react";
import { CommunicationComposer } from "@/components/communications/CommunicationComposer";
import { Mail } from "lucide-react";

/**
 * Test page for Communication Composer with RecipientPickerInline
 * Navigate to /test-composer to see the email composer in action
 * 
 * This demonstrates:
 * - Inline recipient picker (Gmail-like)
 * - Internal user search
 * - External email entry
 * - Mixed recipients support
 */
export default function TestComposerPage() {
  const [showComposer, setShowComposer] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Communication Composer Test
          </h1>
          <p className="text-slate-600">
            Test the inline recipient picker with internal users and external email support
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-slate-900">
              Email Composer Demo
            </h2>
          </div>

          <div className="text-sm text-slate-600 space-y-2 mb-4">
            <p>
              <strong>Test the recipient field:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Type a user name to search internal recipients</li>
              <li>Type an email address to add external recipients</li>
              <li>Mix internal users and external emails</li>
              <li>Use keyboard arrows to navigate, Enter to select</li>
              <li>Click the × button to remove recipients</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            💡 Tip: Use "admin", "staff", or "case" to find internal users.
            Try adding external emails like "test@example.com"
          </div>
        </div>

        {showComposer && (
          <CommunicationComposer
            mode="email"
            organizationId="test-org-id"
            onClose={() => setShowComposer(false)}
            onSuccess={(message) => {
              console.log("Email sent:", message);
              alert("Email sent successfully! Check the browser console.");
              setShowComposer(false);
            }}
            onError={(error) => {
              console.error("Error sending email:", error);
            }}
          />
        )}

        {!showComposer && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800 mb-3">Composer closed</p>
            <button
              onClick={() => setShowComposer(true)}
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition text-sm font-medium"
            >
              Open Composer Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
