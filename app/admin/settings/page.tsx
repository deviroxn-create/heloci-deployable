import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationSettingsForm } from "@/components/admin/notification-settings-form";
import { OrganizationAdminPanel } from "@/components/admin/organization-admin-panel";
import { getNotificationSettingsAction } from "@/actions/notifications.actions";
import { getOrganizationAdminDataAction } from "@/actions/organization.actions";

export default async function AdminSettingsPage() {
  const [initialSettings, initialAdminData] = await Promise.all([
    getNotificationSettingsAction(),
    getOrganizationAdminDataAction()
  ]);

  return (
    <AdminShell
      title="Organization administration"
      description="Manage your organization profile, directories, invitations, security, and communication settings from a single live workspace."
    >
      <div className="space-y-8">
        <OrganizationAdminPanel
          initialOrganization={initialAdminData.organization}
          initialMembers={initialAdminData.members}
          initialInvitations={initialAdminData.invitations}
          initialAuditLogs={initialAdminData.auditLogs}
          initialSettings={initialAdminData.settings}
        />
        <NotificationSettingsForm initialSettings={initialSettings} />
      </div>
    </AdminShell>
  );
}
