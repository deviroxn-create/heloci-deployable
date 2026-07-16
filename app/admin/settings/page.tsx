import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationSettingsForm } from "@/components/admin/notification-settings-form";
import { getNotificationSettingsAction } from "@/actions/notifications.actions";

export default async function AdminSettingsPage() {
  const initialSettings = await getNotificationSettingsAction();

  return (
    <AdminShell
      title="Notification & Communication Center"
      description="Configure channels, events, templates, and test delivery for Heloci notifications."
    >
      <NotificationSettingsForm initialSettings={initialSettings} />
    </AdminShell>
  );
}
