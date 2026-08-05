import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { InboxPanel } from '@/components/communications/hub-panels';

export default function InboxPage() {

  return (
    <CommunicationHubWrapper role="admin">
      <InboxPanel  />
    </CommunicationHubWrapper>
  );
}
