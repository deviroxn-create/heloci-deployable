"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, FileText, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProgramInfo {
  id: string;
  name: string;
  slug: string;
  organization?: { name: string } | null;
}

export default function ApplicationSuccessPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      try {
        const res = await fetch(`/api/programs/${slug}`);
        if (res.ok) {
          const data = await res.json() as ProgramInfo;
          setProgram(data);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006AFF]/20 border-t-[#006AFF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-slate-50 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        {/* Success icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="h-14 w-14 text-white" />
          </div>
        </div>

        {/* Main content card */}
        <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-10 shadow-xl">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-bold text-slate-950">
              Application submitted!
            </h1>
            {program && (
              <p className="text-lg text-slate-600">
                Your application to <span className="font-semibold text-[#006AFF]">{program.name}</span>{" "}
                has been successfully submitted.
              </p>
            )}
          </div>

          {/* What happens next */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#006AFF]" />
              <h2 className="text-lg font-semibold text-slate-900">What happens next</h2>
            </div>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#006AFF]/10 text-xs font-bold text-[#006AFF]">
                  1
                </span>
                <span>
                  The housing provider will review your application and verify your information.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#006AFF]/10 text-xs font-bold text-[#006AFF]">
                  2
                </span>
                <span>
                  You may be contacted to provide additional documentation or schedule an interview.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#006AFF]/10 text-xs font-bold text-[#006AFF]">
                  3
                </span>
                <span>
                  You'll receive notifications about your application status via email and in your dashboard.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#006AFF]/10 text-xs font-bold text-[#006AFF]">
                  4
                </span>
                <span>
                  Review times vary by program — check your dashboard regularly for updates.
                </span>
              </li>
            </ol>
          </div>

          {/* Contact info */}
          {program?.organization?.name && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Questions about your application?</p>
              <p className="mt-1">
                Contact <span className="font-medium">{program.organization.name}</span> directly for program-specific questions.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button asChild className="h-12 rounded-full px-8">
              <Link href="/applicant/dashboard" className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" /> Go to dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-full px-8">
              <Link href="/applicant/applications" className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4" /> View applications
              </Link>
            </Button>
          </div>

          {/* Additional actions */}
          <div className="border-t border-slate-200 pt-6 text-center">
            <p className="mb-3 text-sm text-slate-600">
              Want to apply for more housing programs?
            </p>
            <Button asChild variant="ghost">
              <Link href="/matches/results">Browse recommended programs</Link>
            </Button>
          </div>
        </div>

        {/* Footer tip */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            💡 Pro tip: Upload any missing documents from your{" "}
            <Link href="/applicant/documents" className="font-medium text-[#006AFF] hover:underline">
              documents page
            </Link>{" "}
            to speed up the review process.
          </p>
        </div>
      </div>
    </div>
  );
}
