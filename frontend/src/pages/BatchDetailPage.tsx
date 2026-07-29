import { useState } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Plus, X, Check, Calendar, MapPin, User, Clock, Award } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { getBatch, getBatchAttendance, enrollEmployees, removeEmployee, markAttendance, type BatchAttendanceResponse } from '@/services/batches';
import { generateCertificates } from '@/services/certificates';
import { searchEmployees, type Employee } from '@/services/employees';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canManage = ['admin', 'training_officer'].includes(user?.role || '');
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Fetch batch details
  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ['batch', id],
    queryFn: () => getBatch(Number(id)),
    enabled: !!id,
  });

  // Fetch attendance
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['batchAttendance', id],
    queryFn: () => getBatchAttendance(Number(id)),
    enabled: !!id,
  });

  // Mark attendance mutation
  const markMutation = useMutation({
    mutationFn: ({ employeeId, dayNumber, isPresent }: { employeeId: number; dayNumber: number; isPresent: boolean }) =>
      markAttendance(Number(id), employeeId, dayNumber, isPresent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchAttendance', id] });
    },
  });

  // Remove employee mutation
  const removeMutation = useMutation({
    mutationFn: (employeeId: number) => removeEmployee(Number(id), employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', id] });
      queryClient.invalidateQueries({ queryKey: ['batchAttendance', id] });
    },
  });

  // Generate certificates mutation
  const generateMutation = useMutation({
    mutationFn: () => generateCertificates(Number(id)),
    onSuccess: (data) => {
      const { generated, skipped } = data;
      if (generated > 0) {
        toast.success(`Generated ${generated} new certificates`);
      }
      if (skipped.length > 0) {
        toast.info(`Skipped ${skipped.length} employees (incomplete attendance or already exists)`);
      }
      if (generated === 0 && skipped.length === 0) {
        toast.info('No eligible employees found for certificate generation');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate certificates');
    },
  });

  if (batchLoading || attendanceLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!batch || !attendanceData) {
    return <div className="text-center py-20 text-gray-500">Batch not found</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/batches')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {batch.training?.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{batch.training?.code}</p>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => generateMutation.mutate()} isLoading={generateMutation.isPending}>
              <Award className="w-4 h-4 mr-2" />
              Generate Certificates
            </Button>
            <Button onClick={() => setShowEnrollModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Enroll Employees
            </Button>
          </div>
        )}
      </div>

      {/* Batch Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
              <span>{attendanceData.attendance.length} / {batch.capacity} enrolled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Attendance ({attendanceData.durationDays} days)
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 sticky left-0 bg-gray-50 dark:bg-gray-900">
                    Employee
                  </th>
                  {Array.from({ length: attendanceData.durationDays }, (_, i) => (
                    <th key={i} className="text-center py-3 px-2 font-medium text-gray-500 min-w-[60px]">
                      Day {i + 1}
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                  {canManage && <th className="py-3 px-4"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {attendanceData.attendance.map((record) => (
                  <tr key={record.employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 sticky left-0 bg-white dark:bg-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                          {record.employee.photoUrl ? (
                            <img src={record.employee.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {record.employee.fullName}
                          </div>
                          <div className="text-xs text-gray-500">{record.employee.sapId}</div>
                        </div>
                      </div>
                    </td>
                    {record.days.map((day) => (
                      <td key={day.day} className="text-center py-3 px-2">
                        <button
                          onClick={() => markMutation.mutate({
                            employeeId: record.employee.id,
                            dayNumber: day.day,
                            isPresent: !day.isPresent,
                          })}
                          className={cn(
                            'w-8 h-8 rounded-lg transition-colors flex items-center justify-center mx-auto',
                            day.isPresent
                              ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                          )}
                        >
                          {day.isPresent ? <Check className="w-4 h-4" /> : '-'}
                        </button>
                      </td>
                    ))}
                    <td className="text-center py-3 px-4 font-medium">
                      {record.totalPresent} / {attendanceData.durationDays}
                    </td>
                    <td className="text-center py-3 px-4">
                      {record.isComplete ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Complete
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {canManage && (
                        <button
                          onClick={() => {
                            if (confirm('Remove this employee from the batch?')) {
                              removeMutation.mutate(record.employee.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {attendanceData.attendance.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No employees enrolled. Click "Enroll Employees" to add participants.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <EnrollModal
          batchId={Number(id)}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={() => {
            setShowEnrollModal(false);
            queryClient.invalidateQueries({ queryKey: ['batch', id] });
            queryClient.invalidateQueries({ queryKey: ['batchAttendance', id] });
          }}
        />
      )}
    </div>
  );
}

// Enroll Modal Component
function EnrollModal({
  batchId,
  onClose,
  onSuccess,
}: {
  batchId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Employee[]>([]);

  // Search employees
  const { data: searchResults } = useQuery({
    queryKey: ['employeeSearch', search],
    queryFn: () => searchEmployees(search),
    enabled: search.length >= 2,
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: () => enrollEmployees(batchId, selected.map(e => e.id)),
    onSuccess: () => {
      toast.success('Employees enrolled successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to enroll employees');
    },
  });

  const toggleEmployee = (employee: Employee) => {
    if (selected.find(e => e.id === employee.id)) {
      setSelected(selected.filter(e => e.id !== employee.id));
    } else {
      setSelected([...selected, employee]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start p-4 pt-12 md:pt-20">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] flex flex-col overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Enroll Employees
        </h2>

        {/* Search */}
        <Input
          placeholder="Search by name or SAP ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        {/* Selected */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
            {selected.map((emp) => (
              <span
                key={emp.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {emp.fullName}
                <button onClick={() => toggleEmployee(emp)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto border rounded-lg border-gray-200 dark:border-gray-700 mb-4 min-h-0">
          {search.length < 2 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Type at least 2 characters to search
            </div>
          ) : searchResults?.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No employees found
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {searchResults?.map((emp) => {
                const isSelected = selected.some(e => e.id === emp.id);
                return (
                  <button
                    key={emp.id}
                    onClick={() => toggleEmployee(emp)}
                    className={cn(
                      'flex items-center gap-3 w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800',
                      isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{emp.fullName}</div>
                      <div className="text-xs text-gray-500 truncate">{emp.sapId} • {emp.department?.name}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => enrollMutation.mutate()}
            isLoading={enrollMutation.isPending}
            disabled={selected.length === 0}
            className="flex-1"
          >
            Enroll {selected.length} Employee{selected.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
