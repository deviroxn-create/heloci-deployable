'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import type { SenderIdentityWithUsage } from '@/lib/communications/sender-identity.service';

interface SenderIdentityModalProps {
  sender?: SenderIdentityWithUsage;
  onClose: () => void;
  onSubmit: (input: any) => Promise<void>;
  title: string;
}

export function SenderIdentityModal({ sender, onClose, onSubmit, title }: SenderIdentityModalProps) {
  const [formData, setFormData] = useState({
    displayName: sender?.displayName || '',
    emailAddress: sender?.emailAddress || '',
    department: sender?.department || '',
    replyTo: sender?.replyTo || '',
    signature: sender?.signature || '',
    isDefault: sender?.isDefault || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="e.g., Support Team"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailAddress">Email Address *</Label>
            <Input
              id="emailAddress"
              type="email"
              value={formData.emailAddress}
              onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
              placeholder="e.g., support@heloci.us"
              required
              disabled={!!sender}
            />
            {sender && (
              <p className="text-xs text-gray-500">Email address cannot be changed after creation</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Housing Services"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="replyTo">Reply-To Email</Label>
            <Input
              id="replyTo"
              type="email"
              value={formData.replyTo}
              onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
              placeholder="Leave blank to use same as sender email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">Email Signature</Label>
            <Textarea
              id="signature"
              value={formData.signature}
              onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
              placeholder="Optional email signature"
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as default sender for organization
            </Label>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : sender ? 'Update Sender' : 'Create Sender'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
