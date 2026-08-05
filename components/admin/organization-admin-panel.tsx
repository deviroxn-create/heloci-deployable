"use client";

import { useState } from "react";
import { Building2, ShieldCheck, Users, BellRing, KeyRound, History, Sparkles, Send, Mail, Lock, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateOrganizationProfileAction, saveOrganizationPreferencesAction, inviteOrganizationMemberAction, updateOrganizationMemberRoleAction, removeOrganizationMemberAction, saveOrganizationCommunicationSettingsAction } from "@/actions/organization.actions";

interface OrganizationAdminPanelProps {
  initialOrganization: any;
  initialMembers: any[];
  initialInvitations: any[];
  initialAuditLogs: any[];
  initialSettings: any;
}

export function OrganizationAdminPanel({
  initialOrganization,
  initialMembers,
  initialInvitations,
  initialAuditLogs,
  initialSettings
}: OrganizationAdminPanelProps) {
  const [organization, setOrganization] = useState(initialOrganization);
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [settings, setSettings] = useState(initialSettings);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("reviewer");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await updateOrganizationProfileAction({
        name: organization?.name,
        slug: organization?.slug,
        description: organization?.description,
        website: organization?.website,
        logoUrl: organization?.logoUrl,
        emailFromName: organization?.emailFromName,
        telegramChannelId: organization?.telegramChannelId
      });
      setOrganization(updated);
      setStatus("Organization profile saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const updated = await saveOrganizationPreferencesAction(organization?.preferences || {});
      setOrganization((current: any) => ({ ...current, preferences: updated.preferences }));
      setStatus("Organization preferences saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail) return;
    setSaving(true);
    try {
      const invitation = await inviteOrganizationMemberAction(inviteEmail, inviteRole);
      setInvitations((current) => [invitation, ...current]);
      setInviteEmail("");
      setStatus(`Invitation sent to ${inviteEmail}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send invitation.");
    } finally {
      setSaving(false);
    }
  };

  const updateMemberRole = async (memberUserId: string, role: string) => {
    setSaving(true);
    try {
      await updateOrganizationMemberRoleAction(memberUserId, role);
      setMembers((current) => current.map((member) => member.user.id === memberUserId ? { ...member, role } : member));
      setStatus("Member role updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update role.");
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (memberUserId: string) => {
    setSaving(true);
    try {
      await removeOrganizationMemberAction(memberUserId);
      setMembers((current) => current.filter((member) => member.user.id !== memberUserId));
      setStatus("Member removed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to remove member.");
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await saveOrganizationCommunicationSettingsAction(settings);
      setStatus("Communication settings saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand/10 p-2 text-brand"><Building2 className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Organization profile</h2>
            <p className="text-xs text-slate-500">Keep the profile and public-facing details in sync with the database.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Name
            <input value={organization?.name || ""} onChange={(event) => setOrganization((current: any) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-slate-700">Slug
            <input value={organization?.slug || ""} onChange={(event) => setOrganization((current: any) => ({ ...current, slug: event.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Description
            <textarea value={organization?.description || ""} onChange={(event) => setOrganization((current: any) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-slate-700">Website
            <input value={organization?.website || ""} onChange={(event) => setOrganization((current: any) => ({ ...current, website: event.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-slate-700">Email from name
            <input value={organization?.emailFromName || ""} onChange={(event) => setOrganization((current: any) => ({ ...current, emailFromName: event.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-slate-700">Telegram channel ID
            <input value={organization?.telegramChannelId || ""} onChange={(event) => setOrganization((current: any) => ({ ...current, telegramChannelId: event.target.value }))} className="mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => void saveProfile()} disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand/10 p-2 text-brand"><Users className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Staff directory & roles</h2>
            <p className="text-xs text-slate-500">Manage the active organization members and their review permissions.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Invite by email" className="flex-1 rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm">
            <option value="reviewer">Reviewer</option>
            <option value="org_admin">Administrator</option>
          </select>
          <Button onClick={() => void inviteMember()} disabled={saving}>Send invite</Button>
        </div>
        <div className="mt-6 space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{member.user?.name || member.user?.email}</p>
                <p className="text-sm text-slate-500">{member.user?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={member.role} onChange={(event) => void updateMemberRole(member.user.id, event.target.value)} className="rounded-2xl border border-border bg-white px-3 py-2 text-sm">
                  <option value="reviewer">Reviewer</option>
                  <option value="org_admin">Administrator</option>
                </select>
                <Button variant="outline" onClick={() => void removeMember(member.user.id)} disabled={saving}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand/10 p-2 text-brand"><BellRing className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Communication & notification settings</h2>
            <p className="text-xs text-slate-500">Persist your preferred delivery channels and communication preferences.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            { key: "email", label: "Email" },
            { key: "telegram", label: "Telegram" },
            { key: "whatsapp", label: "WhatsApp" },
            { key: "internal", label: "Internal" }
          ].map((channel) => (
            <label key={channel.key} className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm">
              <span>{channel.label}</span>
              <input type="checkbox" checked={Boolean(settings?.channels?.[channel.key])} onChange={() => setSettings((current: any) => ({ ...current, channels: { ...current.channels, [channel.key]: !current.channels?.[channel.key] } }))} />
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => void saveSettings()} disabled={saving}>{saving ? "Saving..." : "Save communication settings"}</Button>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand/10 p-2 text-brand"><Settings2 className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Departments, permissions & preferences</h2>
            <p className="text-xs text-slate-500">Persist the organization-level preferences that drive approvals, permissions, and collaboration workflows.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Departments
            <textarea value={(organization?.preferences?.departments || []).join("\n")} onChange={(event) => setOrganization((current: any) => ({ ...current, preferences: { ...(current.preferences || {}), departments: event.target.value.split(/\n|,/).map((item: string) => item.trim()).filter(Boolean) } }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-slate-700">Permissions
            <textarea value={(organization?.preferences?.permissions || []).join("\n")} onChange={(event) => setOrganization((current: any) => ({ ...current, preferences: { ...(current.preferences || {}), permissions: event.target.value.split(/\n|,/).map((item: string) => item.trim()).filter(Boolean) } }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-slate-700">Branding
            <input value={organization?.preferences?.branding || "Heloci"} onChange={(event) => setOrganization((current: any) => ({ ...current, preferences: { ...(current.preferences || {}), branding: event.target.value } }))} className="mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-slate-700">Security mode
            <input value={organization?.preferences?.securityMode || "standard"} onChange={(event) => setOrganization((current: any) => ({ ...current, preferences: { ...(current.preferences || {}), securityMode: event.target.value } }))} className="mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => void savePreferences()} disabled={saving}>{saving ? "Saving..." : "Save preferences"}</Button>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand/10 p-2 text-brand"><KeyRound className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Security, API keys & session controls</h2>
            <p className="text-xs text-slate-500">Store the organization defaults for API access, session limits, and security posture.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">API key prefix
            <input value={organization?.preferences?.apiKeyPrefix || "heloci_"} onChange={(event) => setOrganization((current: any) => ({ ...current, preferences: { ...(current.preferences || {}), apiKeyPrefix: event.target.value } }))} className="mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-slate-700">Session timeout (minutes)
            <input type="number" value={organization?.preferences?.sessionTimeoutMinutes || 60} onChange={(event) => setOrganization((current: any) => ({ ...current, preferences: { ...(current.preferences || {}), sessionTimeoutMinutes: Number(event.target.value) } }))} className="mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Security notes
            <textarea value={organization?.preferences?.securityNotes || ""} onChange={(event) => setOrganization((current: any) => ({ ...current, preferences: { ...(current.preferences || {}), securityNotes: event.target.value } }))} className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => void savePreferences()} disabled={saving}>{saving ? "Saving..." : "Save security settings"}</Button>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand/10 p-2 text-brand"><History className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Invitations & audit log</h2>
            <p className="text-xs text-slate-500">Review recent invitations and member actions against the live audit trail.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Pending invitations</h3>
            <div className="mt-3 space-y-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-600">{invitation.email} · {invitation.role}</div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent activity</h3>
            <div className="mt-3 space-y-2">
              {auditLogs.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-600">{entry.action} · {new Date(entry.createdAt).toLocaleString()}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
