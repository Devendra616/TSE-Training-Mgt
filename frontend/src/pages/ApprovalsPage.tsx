import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, User, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getPendingApprovals, approveCertificate, rejectCertificate, bulkApprove } from '@/services/certificates';

export function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Fetch pending approvals
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: getPendingApprovals,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: approveCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: () => bulkApprove(selectedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      setSelectedIds([]);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectCertificate(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      setRejectModal(null);
      setRejectReason('');
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(certificates?.map((c) => c.id) || []);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approval Queue</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review and approve pending certificates
          </p>
        </div>
        {selectedIds.length > 0 && (
          <Button
            onClick={() => bulkApproveMutation.mutate()}
            isLoading={bulkApproveMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve {selectedIds.length} Selected
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {certificates?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Pending Approval</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk select */}
      {certificates && certificates.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <button onClick={selectAll} className="text-blue-600 hover:text-blue-700 font-medium">
            Select all
          </button>
          {selectedIds.length > 0 && (
            <button onClick={() => setSelectedIds([])} className="text-gray-500 hover:text-gray-700">
              Clear selection ({selectedIds.length})
            </button>
          )}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : certificates?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              All caught up!
            </h3>
            <p className="text-gray-500">No certificates pending approval</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {certificates?.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Main row */}
                <div className="flex items-center gap-4 p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(cert.id)}
                    onChange={() => toggleSelect(cert.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {cert.employee?.photoUrl ? (
                      <img src={cert.employee.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {cert.employee?.fullName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {cert.employee?.sapId} • {cert.training?.name}
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Valid until
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(cert.validUntil), 'MMM d, yyyy')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(cert.id)}
                      isLoading={approveMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Approve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setRejectModal({ id: cert.id, name: cert.employee?.fullName || '' })}
                    >
                      <XCircle className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Reject</span>
                    </Button>
                    <button
                      onClick={() => setExpandedId(expandedId === cert.id ? null : cert.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {expandedId === cert.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === cert.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">Training</div>
                        <div className="font-medium">{cert.training?.name}</div>
                        <div className="text-xs text-gray-400">{cert.training?.code}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Batch Dates</div>
                        <div className="font-medium">
                          {cert.batch && format(new Date(cert.batch.startDate), 'MMM d')} - {cert.batch && format(new Date(cert.batch.endDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Venue</div>
                        <div className="font-medium">{cert.batch?.venue}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Days Attended</div>
                        <div className="font-medium">{cert.daysAttended}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Reject Certificate
            </h2>
            <p className="text-gray-500 mb-4">
              Rejecting certificate for <strong>{rejectModal.name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Reason for Rejection
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide a reason..."
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setRejectModal(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => rejectMutation.mutate({ id: rejectModal.id, reason: rejectReason })}
                isLoading={rejectMutation.isPending}
                disabled={!rejectReason.trim()}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
