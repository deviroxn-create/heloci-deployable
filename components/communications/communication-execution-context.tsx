'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { OrganizationContext } from '@/lib/organizations/organization-context';

interface CommunicationExecutionContextValue {
  organizationId: string | undefined;
  organization: OrganizationContext | null;
  setOrganization: (organization: OrganizationContext | null) => void;
  setOrganizationId: (organizationId: string | undefined) => void;
  isHydrated: boolean;
}

const CommunicationExecutionContext = createContext<CommunicationExecutionContextValue | undefined>(undefined);

interface CommunicationExecutionProviderProps {
  children: React.ReactNode;
  initialOrganizationId?: string;
  initialOrganization?: OrganizationContext | null;
  availableOrganizations?: OrganizationContext[];
}

const STORAGE_KEY = 'communication_execution_organization_id';

export function CommunicationExecutionProvider({
  children,
  initialOrganizationId,
  initialOrganization = null,
  availableOrganizations = [],
}: CommunicationExecutionProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchOrganizationId = searchParams.get('org') || undefined;
  const [organizationId, setOrganizationIdState] = useState<string | undefined>(initialOrganizationId || searchOrganizationId);
  const [organization, setOrganizationState] = useState<OrganizationContext | null>(initialOrganization);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedOrganizationId = window.localStorage.getItem(STORAGE_KEY);
    if (!organizationId && storedOrganizationId) {
      setOrganizationIdState(storedOrganizationId);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (organizationId) {
      window.localStorage.setItem(STORAGE_KEY, organizationId);
      if (searchOrganizationId !== organizationId) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('org', organizationId);
        router.replace(`${pathname}?${params.toString()}`);
      }
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [organizationId, pathname, router, searchParams, searchOrganizationId, isHydrated]);

  useEffect(() => {
    if (!organizationId) {
      setOrganizationState(null);
      return;
    }

    const match = availableOrganizations.find((org) => org.id === organizationId);
    if (match) {
      setOrganizationState(match);
      return;
    }

    if (initialOrganization?.id === organizationId) {
      setOrganizationState(initialOrganization);
    }
  }, [availableOrganizations, initialOrganization, organizationId]);

  const setOrganization = (nextOrganization: OrganizationContext | null) => {
    setOrganizationState(nextOrganization);
    setOrganizationIdState(nextOrganization?.id);
  };

  const setOrganizationId = (nextOrganizationId: string | undefined) => {
    setOrganizationIdState(nextOrganizationId);
    if (!nextOrganizationId) {
      setOrganizationState(null);
    }
  };

  const value = useMemo<CommunicationExecutionContextValue>(() => ({
    organizationId,
    organization,
    setOrganization,
    setOrganizationId,
    isHydrated,
  }), [organizationId, organization, isHydrated]);

  return (
    <CommunicationExecutionContext.Provider value={value}>
      {children}
    </CommunicationExecutionContext.Provider>
  );
}

export function useCommunicationExecutionContext() {
  const context = useContext(CommunicationExecutionContext);
  if (!context) {
    return {
      organizationId: undefined,
      organization: null,
      setOrganization: () => undefined,
      setOrganizationId: () => undefined,
      isHydrated: true,
    } satisfies CommunicationExecutionContextValue;
  }
  return context;
}
