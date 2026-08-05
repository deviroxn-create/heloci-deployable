import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { TimelinePanel } from '@/components/communications/hub-panels';

export default function TimelinePage() {

  return (
    <CommunicationHubWrapper role="platform">
      <TimelinePanel  />
    </CommunicationHubWrapper>
  );
}
