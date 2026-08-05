'use client';

import { useEffect, useState } from 'react';
import { getDefaultSenderAction, getSendersAction } from '@/actions/sender-identity.actions';
import { SenderIdentityWithUsage } from '@/lib/communications/sender-identity.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SenderSelectorProps {
  organizationId: string;
  value?: string;
  onChange?: (senderId: string, sender: SenderIdentityWithUsage) => void;
  label?: string;
  required?: boolean;
}

export function SenderSelector({
  organizationId,
  value,
  onChange,
  label = 'From',
  required = false,
}: SenderSelectorProps) {
  const [senders, setSenders] = useState<SenderIdentityWithUsage[]>([]);
  const [selectedSender, setSelectedSender] = useState<SenderIdentityWithUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSenders();
  }, [organizationId]);

  useEffect(() => {
    if (value && senders.length > 0) {
      const sender = senders.find((s) => s.id === value);
      if (sender) {
        setSelectedSender(sender);
      }
    }
  }, [value, senders]);

  const loadSenders = async () => {
    try {
      setLoading(true);
      const data = await getSendersAction(organizationId);
      setSenders(data.filter((s) => s.isActive));

      // Set default sender if no value specified
      if (!value && data.length > 0) {
        const defaultSender = data.find((s) => s.isDefault && s.isActive) || data[0];
        setSelectedSender(defaultSender);
        onChange?.(defaultSender.id, defaultSender);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (senderId: string) => {
    const sender = senders.find((s) => s.id === senderId);
    if (sender) {
      setSelectedSender(sender);
      onChange?.(senderId, sender);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (senders.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="text-sm text-gray-500">No sender identities configured</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="sender-select">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={selectedSender?.id || ''} onValueChange={handleChange}>
        <SelectTrigger id="sender-select" className="w-full">
          <SelectValue placeholder="Select sender" />
        </SelectTrigger>
        <SelectContent>
          {senders.map((sender) => (
            <SelectItem key={sender.id} value={sender.id}>
              <div className="flex items-center gap-2">
                <span>{sender.displayName}</span>
                <span className="text-xs text-gray-500">({sender.emailAddress})</span>
                {sender.isDefault && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Default</span>}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedSender && (
        <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
          <div className="font-medium">{selectedSender.displayName}</div>
          <div className="text-gray-600 font-mono">{selectedSender.emailAddress}</div>
          {selectedSender.department && (
            <div className="text-gray-600 text-xs">Department: {selectedSender.department}</div>
          )}
          {selectedSender.replyTo && selectedSender.replyTo !== selectedSender.emailAddress && (
            <div className="text-gray-600 text-xs">Reply-To: {selectedSender.replyTo}</div>
          )}
        </div>
      )}
    </div>
  );
}
