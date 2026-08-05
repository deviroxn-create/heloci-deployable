'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2 } from 'lucide-react';
import { OrganizationContext } from '@/lib/organizations/organization-context';
import { useCommunicationExecutionContext } from './communication-execution-context';

interface OrganizationSelectorProps {
  organizations: OrganizationContext[];
  pageBaseUrl: string;
}

export function OrganizationSelector({ organizations, pageBaseUrl }: OrganizationSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const { organization, setOrganization, setOrganizationId } = useCommunicationExecutionContext();

  const filtered = organizations.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (org: OrganizationContext) => {
    setOrganization(org);
    setOrganizationId(org.id);
    setIsNavigating(true);
    router.push(`${pageBaseUrl}?org=${org.id}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Communication Hub</h2>
        <p className="text-slate-600 text-sm">Select an organization to manage</p>
      </div>

      <Card className="p-6">
        {isNavigating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
            <span className="text-slate-600">Loading workspace...</span>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600">No organizations available</p>
          </div>
        ) : (
          // Multiple organizations - show dropdown
          <div className="space-y-4">
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg flex items-center justify-between bg-white hover:bg-slate-50 transition"
              >
                <span className="text-left">
                  {organization ? (
                    <span className="font-medium text-slate-950">{organization.name}</span>
                  ) : (
                    <span className="text-slate-500">Choose an organization...</span>
                  )}
                </span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-slate-200">
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">No organizations found</div>
                    ) : (
                      filtered.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => handleSelect(org)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-100 transition ${
                            organization?.id === org.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="font-medium text-slate-950">{org.name}</div>
                          {org.slug && <div className="text-xs text-slate-500">{org.slug}</div>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {organization && (
              <Button
                onClick={() => handleSelect(organization)}
                className="w-full"
                disabled={isNavigating}
              >
                {isNavigating ? 'Loading...' : `Continue to ${organization?.name ?? 'selected organization'}`}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
