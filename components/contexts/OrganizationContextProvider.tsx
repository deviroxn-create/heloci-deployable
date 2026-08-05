'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OrganizationContext } from '@/lib/organizations/organization-context';

interface OrganizationContextProviderValue {
  activeOrganization: OrganizationContext | null;
  setActiveOrganization: (org: OrganizationContext | null) => void;
  isLoading: boolean;
  error: string | null;
}

const OrganizationContextContext = createContext<OrganizationContextProviderValue | undefined>(undefined);

interface OrganizationContextProviderProps {
  children: ReactNode;
  initialOrganization?: OrganizationContext | null;
  organizationId?: string | null;
}

export function OrganizationContextProvider({
  children,
  initialOrganization,
  organizationId,
}: OrganizationContextProviderProps) {
  const [activeOrganization, setActiveOrganization] = useState<OrganizationContext | null>(
    initialOrganization || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load organization from organizationId prop (from session)
  useEffect(() => {
    if (organizationId && !activeOrganization) {
      setIsLoading(true);
      setError(null);

      fetch(`/api/organizations/${organizationId}/context`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.organization) {
            setActiveOrganization(data.organization);
            // Store in localStorage for session persistence
            localStorage.setItem('active_organization_id', organizationId);
          } else {
            setError(data.error || 'Failed to load organization');
          }
        })
        .catch((err) => {
          console.error('Failed to load organization context:', err);
          setError('Failed to load organization context');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [organizationId, activeOrganization]);

  return (
    <OrganizationContextContext.Provider value={{ activeOrganization, setActiveOrganization, isLoading, error }}>
      {children}
    </OrganizationContextContext.Provider>
  );
}

/**
 * Hook to access organization context
 */
export function useOrganizationContext() {
  const context = useContext(OrganizationContextContext);

  if (!context) {
    throw new Error('useOrganizationContext must be used inside OrganizationContextProvider');
  }

  return context;
}

/**
 * Hook to get active organization ID
 */
export function useActiveOrganizationId(): string | null {
  const { activeOrganization } = useOrganizationContext();
  return activeOrganization?.id || null;
}
