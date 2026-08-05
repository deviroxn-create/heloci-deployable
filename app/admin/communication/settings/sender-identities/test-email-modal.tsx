'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Send } from 'lucide-react';
import type { SenderIdentityWithUsage } from '@/lib/communications/sender-identity.service';

interface TestEmailModalProps {
  sender: SenderIdentityWithUsage;
  onClose: () => void;
  onSubmit: (email: string, subject: string) => Promise<void>;
}

export function TestEmailModal({ sender, onClose, onSubmit }: TestEmailModalProps) {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Test Email from ' + sender.displayName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(email, subject);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Send Test Email</h2>
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

          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">Sender Identity</h3>
            <p className="text-sm text-blue-800">
              <strong>{sender.displayName}</strong>
            </p>
            <p className="text-sm text-blue-800 font-mono">{sender.emailAddress}</p>
            {sender.department && (
              <p className="text-xs text-blue-700 mt-1">Department: {sender.department}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address to receive test"
              required
            />
            <p className="text-xs text-gray-500">
              We'll send a test email to this address using the sender identity above
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Test email subject"
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Send className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
