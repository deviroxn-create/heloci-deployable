import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { InboxPanel } from '@/components/communications/hub-panels';

export default function PlatformCommunicationPage() {
  return (
    <CommunicationHubWrapper role="platform">
      <InboxPanel />
    </CommunicationHubWrapper>
  );
}
