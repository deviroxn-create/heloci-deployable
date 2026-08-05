import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { InboxPanel } from '@/components/communications/hub-panels';

export default function StaffCommunicationPage() {
  return (
    <CommunicationHubWrapper role="staff">
      <InboxPanel />
    </CommunicationHubWrapper>
  );
}
