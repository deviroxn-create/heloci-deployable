import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { TemplatesPanel } from '@/components/communications/hub-panels';

export default function TemplatesPage() {

  return (
    <CommunicationHubWrapper role="staff">
      <TemplatesPanel  />
    </CommunicationHubWrapper>
  );
}
