import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { EmailPanel } from '@/components/communications/hub-panels';

export default function EmailPage() {

  return (
    <CommunicationHubWrapper role="admin">
      <EmailPanel  />
    </CommunicationHubWrapper>
  );
}
