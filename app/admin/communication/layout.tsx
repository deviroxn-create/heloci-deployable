import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function AdminCommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    if (user.role === 'APPLICANT') {
      redirect('/applicant/communication');
    }
    if (user.role === 'STAFF') {
      redirect('/staff/communication');
    }
    redirect('/login');
  }

  return <>{children}</>;
}
