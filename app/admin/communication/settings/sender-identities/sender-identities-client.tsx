'use client';

import { useState, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, CheckCircle, Send } from 'lucide-react';
import { SenderIdentityWithUsage } from '@/lib/communications/sender-identity.service';
import {
  getSendersAction,
  createSenderAction,
  updateSenderAction,
  deleteSenderAction,
  setDefaultSenderAction,
  markSenderVerifiedAction,
  testSenderAction,
} from '@/actions/sender-identity.actions';
import { SenderIdentityModal } from './sender-identity-modal';
import { TestEmailModal } from './test-email-modal';

const getVerificationBadge = (status: string): ReactNode => {
  switch (status) {
    case 'VERIFIED':
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
    case 'FAILED':
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    case 'UNKNOWN':
      return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    default:
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  }
};

interface SenderIdentitiesClientProps {
  organizationId: string;
  initialSenders: SenderIdentityWithUsage[];
}

export function SenderIdentitiesClient({ organizationId, initialSenders }: SenderIdentitiesClientProps) {
  const [senders, setSenders] = useState<SenderIdentityWithUsage[]>(initialSenders);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSender, setEditingSender] = useState<SenderIdentityWithUsage | null>(null);
  const [testingSender, setTestingSender] = useState<SenderIdentityWithUsage | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSenders = async () => {
    try {
      const data = await getSendersAction(organizationId);
      setSenders(data);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleAddSender = async (input: any) => {
    try {
      await createSenderAction({
        organizationId,
        ...input,
      });
      setSuccess('Sender identity created successfully');
      setShowAddModal(false);
      await loadSenders();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleUpdateSender = async (input: any) => {
    try {
      if (!editingSender?.id) return;
      await updateSenderAction(String(editingSender.id), organizationId, input);
      setSuccess('Sender identity updated successfully');
      setEditingSender(null);
      await loadSenders();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDeleteSender = async (senderId: string) => {
    if (confirm('Are you sure? This will disable the sender identity.')) {
      try {
        await deleteSenderAction(String(senderId), organizationId);
        setSuccess('Sender identity disabled');
        await loadSenders();
      } catch (err) {
        setError(String(err));
      }
    }
  };

  const handleSetDefault = async (senderId: string) => {
    try {
      await setDefaultSenderAction(String(senderId), organizationId);
      setSuccess('Default sender updated');
      await loadSenders();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleMarkVerified = async (senderId: string) => {
    try {
      await markSenderVerifiedAction(String(senderId), organizationId);
      setSuccess('Sender marked as verified');
      await loadSenders();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleTestEmail = async (senderId: string, email: string, subject: string) => {
    try {
      await testSenderAction(String(senderId), organizationId, email, subject);
      setSuccess('Test email sent successfully');
      setTestingSender(null);
      await loadSenders();
    } catch (err) {
      setError(String(err));
    }
  };

  const filteredSenders = senders.filter(
    (s) =>
      s.displayName.toLowerCase().includes(search.toLowerCase()) ||
      s.emailAddress.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sender Identities</h1>
          <p className="text-gray-600">Manage email sender identities for your organization</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Sender Identity
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}
      {success && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-green-800">{success}</p>
          </CardContent>
        </Card>
      )}

      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <CardHeader>
          <CardTitle>Sender Identities ({filteredSenders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSenders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sender identities found. Create one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Display Name</th>
                    <th className="text-left py-3 px-4">Email Address</th>
                    <th className="text-left py-3 px-4">Department</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Usage</th>
                    <th className="text-left py-3 px-4">Verification</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSenders.map((sender) => (
                    <tr key={sender.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">
                          {sender.displayName}
                          {sender.isDefault && <Badge className="ml-2 bg-blue-100 text-blue-800">Default</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{sender.emailAddress}</td>
                      <td className="py-3 px-4">{sender.department || '—'}</td>
                      <td className="py-3 px-4">
                        {sender.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">{sender.sentCount || 0} sent</td>
                      <td className="py-3 px-4">{getVerificationBadge(sender.verificationStatus)}</td>
                      <td className="py-3 px-4 text-xs">{new Date(sender.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {!sender.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefault(sender.id)}
                              title="Set as default"
                            >
                              ★
                            </Button>
                          )}
                          {sender.verificationStatus !== 'VERIFIED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkVerified(sender.id)}
                              title="Mark as verified"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTestingSender(sender)}
                            title="Send test email"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingSender(sender)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSender(sender.id)}
                            title="Delete"
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <SenderIdentityModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddSender}
          title="Add Sender Identity"
        />
      )}

      {editingSender && (
        <SenderIdentityModal
          sender={editingSender}
          onClose={() => setEditingSender(null)}
          onSubmit={handleUpdateSender}
          title="Edit Sender Identity"
        />
      )}

      {testingSender && (
        <TestEmailModal
          sender={testingSender}
          onClose={() => setTestingSender(null)}
          onSubmit={(email, subject) => handleTestEmail(testingSender.id, email, subject)}
        />
      )}
    </div>
  );
}
