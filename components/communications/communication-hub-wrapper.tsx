import { ReactNode } from 'react';
import { CommunicationHubLayout, CommunicationHubRole } from './communication-hub-layout';
import { getCurrentUser } from '@/lib/auth/session';
import { getAvailableOrganizations } from '@/lib/organizations/organization-context';

interface CommunicationHubWrapperProps {
  role: CommunicationHubRole;
  children: ReactNode;
}

export default async function CommunicationHubWrapper({
  role,
  children,
}: CommunicationHubWrapperProps) {
  const user = await getCurrentUser();
  const organizations = await getAvailableOrganizations();

  return (
    <CommunicationHubLayout
      role={role}
      currentUser={user}
      availableOrganizations={organizations}
    >
      {children}
    </CommunicationHubLayout>
  );
}
