import { getCurrentUser } from '@/lib/auth/session';
import { getSendersAction } from '@/actions/sender-identity.actions';
import { SenderIdentitiesClient } from './sender-identities-client';

export default async function SenderIdentitiesPage() {
  const user = await getCurrentUser();
  
  if (!user?.organizationId) {
    return <div className="p-8">Unauthorized</div>;
  }

  try {
    const senders = await getSendersAction(user.organizationId);
    return <SenderIdentitiesClient organizationId={user.organizationId} initialSenders={senders} />;
  } catch (error) {
    return <div className="p-8">Error: {String(error)}</div>;
  }
}
