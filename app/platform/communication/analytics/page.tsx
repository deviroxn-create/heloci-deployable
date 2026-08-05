import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { AnalyticsPanel } from '@/components/communications/hub-panels';

export default function AnalyticsPage() {

  return (
    <CommunicationHubWrapper role="platform">
      <AnalyticsPanel  />
    </CommunicationHubWrapper>
  );
}
