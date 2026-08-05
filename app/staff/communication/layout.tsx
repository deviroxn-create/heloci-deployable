import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function StaffCommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'STAFF' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    if (user.role === 'APPLICANT') {
      redirect('/applicant/communication');
    }
    redirect('/login');
  }

  return <>{children}</>;
}
