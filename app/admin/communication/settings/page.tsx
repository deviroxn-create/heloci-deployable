import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { SettingsPanel } from '@/components/communications/hub-panels';

export default function SettingsPage() {

  return (
    <CommunicationHubWrapper role="admin">
      <SettingsPanel  />
    </CommunicationHubWrapper>
  );
}
