import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, Users, MapPin, User, Clock, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { getBatches, createBatch, updateBatch, deleteBatch, type Batch, type CreateBatchData, type BatchStatus } from '@/services/batches';
import { getTrainings, type Training } from '@/services/trainings';
import { cn } from '@/utils/cn';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const STATUS_CONFIG: Record<BatchStatus, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

export function BatchesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canManage = user?.role !== 'mines_manager';
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [statusFilter, setStatusFilter] = useState<BatchStatus | ''>('');

  // Fetch batches
  const { data: batches, isLoading } = useQuery({
    queryKey: ['batches', { status: statusFilter }],
    queryFn: () => getBatches(statusFilter ? { status: statusFilter } : undefined),
  });

  // Fetch trainings for dropdown
  const { data: trainings } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => getTrainings(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setShowModal(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateBatchData> }) =>
      updateBatch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setShowModal(false);
      setEditingBatch(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this batch?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training Batches</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Schedule batches, enroll employees, and mark attendance
          </p>
        </div>

        {canManage && (
          <Button onClick={() => { setEditingBatch(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Batch
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
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
                onClick={() => setStatusFilter(status as BatchStatus)}
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

      {/* Batch Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches?.map((batch) => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_CONFIG[batch.status].color)}>
                      {STATUS_CONFIG[batch.status].label}
                    </span>

                    {canManage && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(batch); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(batch.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {batch.training?.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">{batch.training?.code}</p>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(batch.startDate), 'MMM d')} - {format(new Date(batch.endDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{batch.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{batch.instructorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>
                      {batch.enrolledCount || 0} / {batch.capacity} enrolled
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => navigate(`/batches/${batch.id}`)}
                  className="flex items-center justify-between w-full p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Manage Attendance
                  </span>
                  <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && trainings && (
        <BatchModal
          batch={editingBatch}
          trainings={trainings}
          onClose={() => { setShowModal(false); setEditingBatch(null); }}
          onSubmit={(data) => {
            if (editingBatch) {
              updateMutation.mutate({ id: editingBatch.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

// Batch Modal Component
function BatchModal({
  batch,
  trainings,
  onClose,
  onSubmit,
  isLoading,
}: {
  batch: Batch | null;
  trainings: Training[];
  onClose: () => void;
  onSubmit: (data: CreateBatchData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    trainingId: batch?.trainingId || (trainings[0]?.id || 0),
    startDate: batch?.startDate || format(new Date(), 'yyyy-MM-dd'),
    endDate: batch?.endDate || format(new Date(), 'yyyy-MM-dd'),
    capacity: batch?.capacity || 30,
    venue: batch?.venue || '',
    instructorName: batch?.instructorName || '',
    notes: batch?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {batch ? 'Edit Batch' : 'Create New Batch'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Training
            </label>
            <select
              value={formData.trainingId}
              onChange={(e) => setFormData({ ...formData, trainingId: Number(e.target.value) })}
              className="flex h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!batch}
            >
              <option value="">Select training</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <Input
            label="Capacity"
            type="number"
            min={1}
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
            required
          />
          <Input
            label="Venue"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            placeholder="e.g., Training Hall"
            required
          />
          <Input
            label="Instructor Name"
            value={formData.instructorName}
            onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              {batch ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
