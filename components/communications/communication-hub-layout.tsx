'use client';

import { cloneElement, isValidElement, ReactElement, ReactNode, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Inbox,
  Mail,
  Clock,
  FileText,
  Search,
  Settings,
  LogOut,
  Bell,
  Plus,
  Menu,
  X,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserBadge } from '@/components/shared/user-badge';
import { supabase } from '@/lib/supabase/client';
import { InlineComposer } from './InlineComposer';
import { useInlineComposerState } from '@/hooks/useInlineComposerState';
import { OrganizationSelector } from './organization-selector';
import { OrganizationContext } from '@/lib/organizations/organization-context';
import { CommunicationExecutionProvider, useCommunicationExecutionContext } from './communication-execution-context';

export type CommunicationHubRole = 'applicant' | 'staff' | 'admin' | 'platform';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: CommunicationHubRole[];
}

interface CommunicationHubUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  organizationId?: string | null;
  isPlatformAdmin?: boolean | null;
}

interface CommunicationHubLayoutProps {
  role: CommunicationHubRole;
  children: ReactNode;
  unreadCount?: number;
  applicationId?: string;
  organizationId?: string;
  currentUser?: CommunicationHubUser | null;
  availableOrganizations?: OrganizationContext[];
}

const getBaseHref = (role: CommunicationHubRole) => {
  switch (role) {
    case 'applicant':
      return '/applicant/communication';
    case 'staff':
      return '/staff/communication';
    case 'admin':
      return '/admin/communication';
    case 'platform':
      return '/platform/communication';
  }
};

const navItems: NavItem[] = [
  { label: 'Overview', href: '', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Inbox', href: '/inbox', icon: <Inbox className="h-4 w-4" /> },
  { label: 'Messages', href: '/messages', icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'Email', href: '/email', icon: <Mail className="h-4 w-4" />, roles: ['staff', 'admin', 'platform'] },
  { label: 'Timeline', href: '/timeline', icon: <Clock className="h-4 w-4" />, roles: ['staff', 'admin', 'platform'] },
  { label: 'Templates', href: '/templates', icon: <FileText className="h-4 w-4" />, roles: ['staff', 'admin', 'platform'] },
  { label: 'Search', href: '/search', icon: <Search className="h-4 w-4" /> },
  { label: 'Delivery', href: '/delivery', icon: <TrendingUp className="h-4 w-4" />, roles: ['admin', 'platform'] },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-4 w-4" />, roles: ['admin', 'platform'] },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
];

function CommunicationHubLayoutContent({
  role,
  children,
  unreadCount = 0,
  applicationId,
  currentUser,
  availableOrganizations = [],
}: CommunicationHubLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [organizationSelectionRequested, setOrganizationSelectionRequested] = useState(false);
  const isPlatformSuperAdmin = Boolean(
    role === 'platform' || currentUser?.isPlatformAdmin || (currentUser?.role === 'SUPER_ADMIN' && !currentUser.organizationId)
  );

  const { organizationId: resolvedOrganizationId } = useCommunicationExecutionContext();

  const composer = useInlineComposerState({
    applicationId,
    organizationId: resolvedOrganizationId,
    initialMode: 'message',
  });
  const baseHref = getBaseHref(role);

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  const isActive = (itemHref: string) => {
    if (itemHref === '') {
      return pathname === baseHref || pathname === `${baseHref}/`;
    }
    return pathname === `${baseHref}${itemHref}`;
  };

  const contentWithOrganizationContext = useMemo(() => {
    if (isValidElement(children)) {
      return cloneElement(children as ReactElement<{ organizationId?: string }>, {
        organizationId: resolvedOrganizationId,
      });
    }

    return children;
  }, [children, resolvedOrganizationId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleExitHub = () => {
    const dashboardRoutes: Record<CommunicationHubRole, string> = {
      applicant: '/applicant/dashboard',
      staff: '/staff/dashboard',
      admin: '/admin/dashboard',
      platform: '/platform/dashboard',
    };
    router.push(dashboardRoutes[role]);
  };

  const handleCompose = () => {
    if (isPlatformSuperAdmin && !resolvedOrganizationId && availableOrganizations.length > 1) {
      setOrganizationSelectionRequested(true);
      return;
    }

    composer.openComposer();
    setOrganizationSelectionRequested(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <InlineComposer
        isOpen={composer.isOpen}
        onClose={composer.closeComposer}
        mode={composer.mode}
        applicationId={applicationId}
        organizationId={resolvedOrganizationId}
      />

      <div className="sticky top-0 z-40 lg:hidden border-b border-border bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white text-xs font-bold">
            C
          </div>
          <h1 className="text-sm font-semibold text-slate-950">Communication</h1>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 hover:bg-slate-50 rounded-lg"
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-border bg-white p-4 space-y-6 overflow-y-auto transform transition lg:relative lg:transform-none lg:w-auto ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="hidden lg:flex items-center gap-3 px-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white text-sm font-bold">
              C
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">Communication</p>
              <p className="text-xs text-slate-500 capitalize">{role} hub</p>
            </div>
          </div>

          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={`${baseHref}${item.href}`}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-brand text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleExitHub}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <Home className="h-4 w-4" />
              Exit Hub
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <main className="min-h-screen">
          <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Communication</p>
                <h1 className="text-lg font-semibold text-slate-950">Hub</h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 flex-1 max-w-xs">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent text-sm outline-none w-full"
                    disabled
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleCompose}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Compose</span>
                </Button>

                <button
                  className="relative p-2 rounded-lg hover:bg-slate-100 transition"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold text-white bg-red-500">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <UserBadge />
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {organizationSelectionRequested && isPlatformSuperAdmin && availableOrganizations.length > 1 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <OrganizationSelector
                  organizations={availableOrganizations}
                  pageBaseUrl={pathname}
                />
              </div>
            )}
            {!organizationSelectionRequested && contentWithOrganizationContext}
          </div>
        </main>
      </div>
    </div>
  );
}

export function CommunicationHubLayout(props: CommunicationHubLayoutProps) {
  return (
    <CommunicationExecutionProvider
      initialOrganizationId={props.currentUser?.organizationId || undefined}
      initialOrganization={props.availableOrganizations?.find((org) => org.id === props.currentUser?.organizationId) || null}
      availableOrganizations={props.availableOrganizations || []}
    >
      <CommunicationHubLayoutContent {...props} />
    </CommunicationExecutionProvider>
  );
}
