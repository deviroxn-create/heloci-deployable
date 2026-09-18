"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChevronRight, Loader2, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ResilientImage } from "@/components/marketing/resilient-image";

interface ApplicantConversation {
  applicationId: string;
  conversationId?: string;
  programName: string;
  organizationId: string;
  lastMessagePreview?: string;
}

export function ApplicantMessagesPanel() {
  const [conversations, setConversations] = useState<ApplicantConversation[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [draft, setDraft] = useState("");
  const [propertyPreviewOpen, setPropertyPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadConversation(applicationId: string, organizationId: string) {
    const response = await fetch(
      `/api/communications/conversation?applicationId=${encodeURIComponent(applicationId)}&organizationId=${encodeURIComponent(organizationId)}`
    );
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || body.error || "Unable to load conversation.");
    setSelectedApplicationId(applicationId);
    setConversation(body.data);
  }

  useEffect(() => {
    void fetch("/api/communications?view=applicant")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load messages.");
        const items = (Array.isArray(body.data) ? body.data : body.data?.conversations || []) as ApplicantConversation[];
        setConversations(items);
        const requestedApplicationId = new URLSearchParams(window.location.search).get("applicationId");
        const selected = items.find((item) => item.applicationId === requestedApplicationId) || items[0];
        if (selected?.conversationId) await loadConversation(selected.applicationId, selected.organizationId);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  async function sendReply() {
    const selected = conversations.find((item) => item.applicationId === selectedApplicationId);
    if (!selected || !draft.trim()) return;

    const response = await fetch("/api/communications/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: selected.applicationId,
        organizationId: selected.organizationId,
        content: draft.trim(),
        messageContext: "application",
      }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "Unable to send reply.");
    setDraft("");
    await loadConversation(selected.applicationId, selected.organizationId);
  }

  if (loading) {
    return <Card className="p-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></Card>;
  }

  if (error) {
    return <Card className="border-red-200 bg-red-50 p-6 text-red-700"><AlertCircle className="mr-2 inline h-5 w-5" />{error}</Card>;
  }

  if (conversations.length === 0) {
    return <Card className="p-8 text-center"><MessageSquare className="mx-auto h-12 w-12 text-slate-300" /><h2 className="mt-4 text-lg font-semibold text-slate-950">Messages</h2><p className="mt-2 text-slate-600">Your HELOCI conversations will appear here.</p></Card>;
  }

  const property = conversation?.property;

  return (
    <div className={`grid gap-5 ${property && propertyPreviewOpen ? "xl:grid-cols-[280px_minmax(0,1fr)_360px]" : "lg:grid-cols-[280px_minmax(0,1fr)]"}`}>
      <div className="space-y-2">
        {conversations.map((item) => (
          <button key={item.applicationId} type="button" onClick={() => void loadConversation(item.applicationId, item.organizationId)} className="w-full rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50">
            <p className="font-medium text-slate-950">{item.programName}</p>
            <p className="mt-1 truncate text-sm text-slate-600">{item.lastMessagePreview || "Conversation"}</p>
          </button>
        ))}
      </div>
      {conversation && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">{conversation.subject || "HELOCI support"}</h2>
          {property && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 p-3">
              {property.images?.[0] ? <ResilientImage src={property.images[0].url} alt={property.images[0].altText || property.title} width={64} height={48} className="h-12 w-16 rounded-lg object-cover" /> : null}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Property interest</p>
                <p className="truncate text-sm font-semibold text-slate-950">{property.title}</p>
                <p className="truncate text-xs text-slate-600">{property.city}, {property.state}</p>
              </div>
              <button type="button" onClick={() => setPropertyPreviewOpen((open) => !open)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand/30 bg-white px-3 py-2 text-xs font-semibold text-brand hover:bg-brand/10">Preview property <ChevronRight className={`h-3.5 w-3.5 transition-transform ${propertyPreviewOpen ? "rotate-90" : ""}`} /></button>
            </div>
          )}
          <div className="mt-5 space-y-4">
            {(Array.isArray(conversation.timeline) ? conversation.timeline : []).filter((item: any) => item.type === "message").map((message: any) => (
              <div key={message.id} className="rounded-lg bg-slate-50 p-4">
                <p className="whitespace-pre-wrap text-sm text-slate-700">{message.content}</p>
                <p className="mt-2 text-xs text-slate-400">{message.senderName || "HELOCI team"}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Reply to HELOCI" />
            <button type="button" onClick={() => void sendReply()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Send</button>
          </div>
        </Card>
      )}
      {property && propertyPreviewOpen && (
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Property preview</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">{property.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{property.address}, {property.city}, {property.state} {property.zip || ""}</p>
            </div>
            <button type="button" onClick={() => setPropertyPreviewOpen(false)} aria-label="Collapse property preview" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {property.images?.map((image: any) => <ResilientImage key={image.id} src={image.url} alt={image.altText || property.title} width={180} height={120} className="h-28 w-full rounded-lg object-cover" />)}
          </div>
          <div className="space-y-4 p-4">
            <p className="text-sm leading-6 text-slate-600">{property.description}</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
              <div className="rounded-lg bg-slate-50 p-2"><strong className="block text-sm text-slate-950">{property.bedrooms}</strong>beds</div>
              <div className="rounded-lg bg-slate-50 p-2"><strong className="block text-sm text-slate-950">{property.bathrooms}</strong>baths</div>
              <div className="rounded-lg bg-slate-50 p-2"><strong className="block text-sm text-slate-950">{property.sqft.toLocaleString()}</strong>sqft</div>
            </div>
            <p className="text-lg font-semibold text-slate-950">${property.rent.toLocaleString()}{property.rentMax ? `-$${property.rentMax.toLocaleString()}` : ""}<span className="text-xs font-normal text-slate-500">/mo</span></p>
            {property.amenities?.length > 0 && <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Features</p><div className="mt-2 flex flex-wrap gap-1.5">{property.amenities.map((amenity: string) => <span key={amenity} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{amenity}</span>)}</div></div>}
            <Link href={`/applicant/properties/${property.programPropertyId}?applicationId=${encodeURIComponent(conversation.applicationId)}`} className="block rounded-lg bg-brand px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brandHover">Open full property details</Link>
          </div>
        </aside>
      )}
    </div>
  );
}
