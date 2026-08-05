import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { DeliveryPanel } from '@/components/communications/hub-panels';

export default function AdminDeliveryPage() {

  return (
    <CommunicationHubWrapper role="admin">
      <DeliveryPanel  />
    </CommunicationHubWrapper>
  );
}
