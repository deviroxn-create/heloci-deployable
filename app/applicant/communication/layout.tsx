import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function ApplicantCommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'APPLICANT') {
    if (user.role === 'STAFF' || user.role === 'ADMIN') {
      redirect('/staff/communication');
    }
    redirect('/admin/communication');
  }

  return <>{children}</>;
}
