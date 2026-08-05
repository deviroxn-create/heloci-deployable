import { redirect } from 'next/navigation';
import { isPlatformSuperAdmin } from '@/lib/auth/rbac';
import { getCurrentUser } from '@/lib/auth/session';

export default async function PlatformCommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isSuperAdmin = await isPlatformSuperAdmin(user.id);

  if (!isSuperAdmin) {
    if (user.role === 'APPLICANT') {
      redirect('/applicant/communication');
    }
    if (user.role === 'STAFF' || user.role === 'ADMIN') {
      redirect('/staff/communication');
    }
    redirect('/login');
  }

  return <>{children}</>;
}
