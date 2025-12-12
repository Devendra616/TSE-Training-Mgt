import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCheck, Send, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getCertificates, bulkSubmit, type WorkflowStatus } from '@/services/certificates';
import { cn } from '@/utils/cn';

const STATUS_CONFIG: Record<WorkflowStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
  pending_approval: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

export function CertificatesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | ''>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Fetch certificates
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates', { status: statusFilter }],
    queryFn: () => getCertificates(statusFilter ? { status: statusFilter } : undefined),
  });

  // Bulk submit mutation
  const bulkSubmitMutation = useMutation({
    mutationFn: () => bulkSubmit(selectedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setSelectedIds([]);
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllDrafts = () => {
    const draftIds = certificates?.filter((c) => c.workflowStatus === 'draft').map((c) => c.id) || [];
    setSelectedIds(draftIds);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Certificates</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage training certificates and submission workflow
          </p>
        </div>
        {selectedIds.length > 0 && (
          <Button
            onClick={() => bulkSubmitMutation.mutate()}
            isLoading={bulkSubmitMutation.isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            Submit {selectedIds.length} for Approval
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setStatusFilter(''); setSelectedIds([]); }}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                statusFilter === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              )}
            >
              All
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status as WorkflowStatus); setSelectedIds([]); }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                )}
              >
                {config.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk select for drafts */}
      {statusFilter === 'draft' && certificates && certificates.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={selectAllDrafts}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Select all drafts
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    {(statusFilter === 'draft' || statusFilter === '') && (
                      <th className="py-3 px-4 w-10"></th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Certificate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Training</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Validity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {certificates?.map((cert) => {
                    const StatusIcon = STATUS_CONFIG[cert.workflowStatus].icon;
                    return (
                      <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {(statusFilter === 'draft' || statusFilter === '') && (
                          <td className="py-3 px-4">
                            {cert.workflowStatus === 'draft' && (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(cert.id)}
                                onChange={() => toggleSelect(cert.id)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            )}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-gray-900 dark:text-white">
                              {cert.certificateNumber || 'Draft'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {cert.employee?.fullName}
                            </div>
                            <div className="text-xs text-gray-500">{cert.employee?.sapId}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-gray-900 dark:text-white">{cert.training?.name}</div>
                            <div className="text-xs text-gray-500">{cert.training?.code}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {format(new Date(cert.validFrom), 'MMM d, yyyy')} -<br />
                          {format(new Date(cert.validUntil), 'MMM d, yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            STATUS_CONFIG[cert.workflowStatus].color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {STATUS_CONFIG[cert.workflowStatus].label}
                          </span>
                          {cert.rejectionReason && (
                            <div className="mt-1 text-xs text-red-500" title={cert.rejectionReason}>
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                              {cert.rejectionReason.slice(0, 30)}...
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {cert.workflowStatus === 'approved' && (
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {certificates?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No certificates found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
