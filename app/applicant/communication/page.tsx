import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { InboxPanel } from '@/components/communications/hub-panels';

export default function ApplicantCommunicationPage() {
  return (
    <CommunicationHubWrapper role="applicant">
      <InboxPanel />
    </CommunicationHubWrapper>
  );
}
