import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { MessagesPanel } from '@/components/communications/hub-panels';

export default function MessagesPage() {

  return (
    <CommunicationHubWrapper role="staff">
      <MessagesPanel  />
    </CommunicationHubWrapper>
  );
}
