import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { OverviewPanel } from '@/components/communications/hub-panels';

export default function AdminCommunicationPage() {
  return (
    <CommunicationHubWrapper role="admin">
      <OverviewPanel />
    </CommunicationHubWrapper>
  );
}
