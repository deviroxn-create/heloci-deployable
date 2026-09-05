"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, FileText, Home, Loader2, MessageCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserBadge } from "@/components/shared/user-badge";
import { ConversationWorkspace } from "@/components/communications/ConversationWorkspace";
import { useConversations, type Conversation } from "@/hooks/use-conversations";

interface Application {
  id: string;
  status: string;
  updatedAt: string;
  program: { name: string; slug: string };
  documentRequests: Array<{ status: string }>;
}

interface DashboardData {
  applications: Application[];
  profileCompletion: number;
  recommendedCount: number;
  pendingDocuments: number;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { conversations, isLoading: conversationsLoading } = useConversations({ view: "applicant", pageSize: 10 });

  useEffect(() => {
    void Promise.all([
      fetch("/api/applications/my").then((response) => response.json()),
      fetch("/api/matches").then((response) => response.json()),
      fetch("/api/applicant-profile").then((response) => response.json()),
    ]).then(([applicationsResponse, matchesResponse, profileResponse]) => {
      const applications = (applicationsResponse.applications ?? []) as Application[];
      const profile = profileResponse.profile ?? {};
      const filledFields = [
        profile.personal?.fullName,
        profile.personal?.dateOfBirth,
        profile.household?.householdSize,
        profile.income?.incomeRange,
        profile.employment?.status,
        profile.housing?.currentHousingSituation,
      ].filter(Boolean).length;

      setData({
        applications,
        profileCompletion: Math.round((filledFields / 10) * 100),
        recommendedCount: (matchesResponse.eligible?.length ?? 0) + (matchesResponse.nearlyEligible?.length ?? 0),
        pendingDocuments: applications.reduce(
          (total, application) => total + application.documentRequests.filter((document) => document.status === "pending").length,
          0
        ),
      });
    }).finally(() => setLoading(false));
  }, []);

  const latestApplication = data?.applications[0];
  const openMessages = () => {
    setSelectedConversation(conversations[0] ?? null);
    setMessagesOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#003DB8] text-sm font-bold text-white">H</span>
            Heloci
          </Link>
          <div className="flex items-center gap-3">
            <button type="button" onClick={openMessages} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[#003DB8] hover:text-[#003DB8]" aria-label="Open messages">
              <MessageCircle className="h-5 w-5" />
              {conversations.some((conversation) => conversation.unreadCount > 0) ? <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#E85D3F]" /> : null}
            </button>
            <UserBadge />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:py-12">
        <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#003DB8] via-[#1555C5] to-[#4A8BEA] px-6 py-10 text-white shadow-[0_24px_60px_rgba(0,61,184,0.2)] sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border-[28px] border-white/10" />
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Your housing journey</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">A clearer next step starts here.</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-blue-50 sm:text-lg">Keep your housing search, applications, documents, and support in one calm place.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="!bg-white !text-[#003DB8] hover:!bg-blue-50"><Link href="/check-eligibility">Check your eligibility</Link></Button>
              <Button asChild variant="outline" className="border-white/60 !bg-white/10 !text-white hover:!bg-white/20"><Link href="/apply"><Plus className="mr-2 h-4 w-4" /> Start an application</Link></Button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center gap-3 rounded-3xl bg-white p-8 text-slate-600 shadow-sm"><Loader2 className="h-5 w-5 animate-spin text-[#003DB8]" /> Loading your home…</div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Applications", value: data?.applications.length ?? 0, icon: FileText },
                { label: "Recommended programs", value: data?.recommendedCount ?? 0, icon: Home },
                { label: "Documents to review", value: data?.pendingDocuments ?? 0, icon: Clock3 },
                { label: "Profile complete", value: `${data?.profileCompletion ?? 0}%`, icon: CheckCircle2 },
              ].map((stat) => {
                const Icon = stat.icon;
                return <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#003DB8]"><Icon className="h-5 w-5" /></span><span className="text-2xl font-semibold text-slate-950">{stat.value}</span></div><p className="mt-4 text-sm text-slate-600">{stat.label}</p></div>;
              })}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#003DB8]">Your progress</p><h2 className="mt-2 text-2xl font-semibold">Keep moving forward</h2></div><Link href="/applicant/applications" className="text-sm font-semibold text-[#003DB8]">All applications <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div>
                {latestApplication ? <div className="mt-6 rounded-3xl bg-[#F5F8FC] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest application</p><h3 className="mt-2 text-lg font-semibold">{latestApplication.program.name}</h3></div><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-[#003DB8]">{statusLabel(latestApplication.status)}</span></div><p className="mt-4 text-sm leading-7 text-slate-600">Your application is saved here so you can return whenever you are ready.</p><Button asChild size="sm" className="mt-5"><Link href={latestApplication.status === "draft" ? `/apply/${latestApplication.program.slug}` : "/applicant/applications"}>{latestApplication.status === "draft" ? "Continue application" : "View application"}</Link></Button></div> : <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-8 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold">No application yet</p><p className="mt-1 text-sm text-slate-600">Start by checking your eligibility or exploring programs.</p></div>}
              </div>

              <div className="rounded-[32px] bg-[#EAF2FF] p-6 sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#003DB8]">Personal support</p><h2 className="mt-2 text-2xl font-semibold">Questions about your next step?</h2><p className="mt-4 text-sm leading-7 text-slate-600">Message your support team without leaving your dashboard.</p><button type="button" onClick={openMessages} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#003DB8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#002E8A]"><MessageCircle className="h-4 w-4" /> Open messages</button></div>
            </section>

            <section className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#003DB8]">Your next steps</p><h2 className="mt-2 text-2xl font-semibold">Small steps, steady progress.</h2></div>
                <p className="text-sm text-slate-500">Choose what feels useful today.</p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  { title: "Review your matches", text: "See programs that may fit your situation.", href: "/matches", icon: Home },
                  { title: "Check your documents", text: "Upload or review requested paperwork.", href: "/applicant/documents", icon: FileText },
                  { title: "Update your profile", text: "Add details to improve recommendations.", href: "/check-eligibility", icon: CheckCircle2 },
                ].map((step) => {
                  const Icon = step.icon;
                  return <Link key={step.title} href={step.href} className="group rounded-3xl border border-slate-200 bg-[#F8FAFD] p-5 transition hover:-translate-y-0.5 hover:border-[#9DBDF4] hover:bg-white hover:shadow-sm"><Icon className="h-5 w-5 text-[#003DB8]" /><h3 className="mt-4 font-semibold text-slate-950">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#003DB8]">Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>;
                })}
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[32px] border border-[#D8E6FA] bg-[#F7FAFF] p-6 sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#003DB8]">A calmer process</p><h2 className="mt-3 text-2xl font-semibold">You do not have to figure it out alone.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Heloci keeps your applications, documents, and support in one place so every next step is easier to understand.</p><button type="button" onClick={openMessages} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#003DB8]">Talk to support <ArrowRight className="h-4 w-4" /></button></div>
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Need a fresh start?</p><h2 className="mt-3 text-2xl font-semibold">Explore a different housing path.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Browse available programs and begin a new application when you are ready.</p><Button asChild className="mt-5"><Link href="/apply">Browse programs <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div><p className="font-semibold text-slate-800">Heloci</p><p className="mt-1">Housing support for your next step.</p></div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Applicant footer">
            <Link href="/check-eligibility" className="hover:text-[#003DB8]">Eligibility help</Link>
            <button type="button" onClick={openMessages} className="hover:text-[#003DB8]">Contact support</button>
            <Link href="/" className="hover:text-[#003DB8]">Public home</Link>
          </nav>
        </div>
      </footer>

      {messagesOpen ? <div className="fixed inset-0 z-50 bg-slate-950/35" onClick={() => setMessagesOpen(false)}><aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#003DB8]">Messages</p><h2 className="mt-1 text-xl font-semibold">Your support conversations</h2></div><button type="button" onClick={() => setMessagesOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close messages"><X className="h-5 w-5" /></button></div><div className="p-6">{conversationsLoading ? <p className="text-sm text-slate-600">Loading conversations…</p> : selectedConversation ? <ConversationWorkspace applicationId={selectedConversation.applicationId} organizationId={selectedConversation.organizationId ?? ""} onClose={() => setSelectedConversation(null)} /> : conversations.length > 0 ? <div className="space-y-3">{conversations.map((conversation) => <button key={conversation.conversationId} type="button" onClick={() => setSelectedConversation(conversation)} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:border-[#003DB8]"><p className="font-semibold">{conversation.programName}</p><p className="mt-1 text-sm text-slate-600">{conversation.lastMessagePreview || "Open conversation"}</p></button>)}</div> : <div className="rounded-2xl bg-[#F5F8FC] p-6 text-center"><MessageCircle className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 font-semibold">No messages yet</p><p className="mt-1 text-sm text-slate-600">Your support conversations will appear here.</p></div>}</div></aside></div> : null}
    </div>
  );
}
