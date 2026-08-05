import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { AnalyticsPanel } from '@/components/communications/hub-panels';

export default function AdminAnalyticsPage() {

  return (
    <CommunicationHubWrapper role="admin">
      <AnalyticsPanel  />
    </CommunicationHubWrapper>
  );
}
