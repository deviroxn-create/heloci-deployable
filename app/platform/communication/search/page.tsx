import CommunicationHubWrapper from '@/components/communications/communication-hub-wrapper';
import { SearchPanel } from '@/components/communications/hub-panels';

export default function SearchPage() {

  return (
    <CommunicationHubWrapper role="platform">
      <SearchPanel  />
    </CommunicationHubWrapper>
  );
}
