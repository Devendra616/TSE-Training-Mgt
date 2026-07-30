import { useState } from "react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
  type CreateEmployeeData,
} from "@/services/employees";
import { getDepartments, type Department } from "@/services/departments";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canManage = ["admin", "training_officer"].includes(user?.role || "");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("fullName");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field)
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    return sortOrder === "ASC" ? (
      <ArrowUp className="w-4 h-4 ml-1 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />
    );
  };

  // Fetch employees
  const { data, isLoading, error } = useQuery({
    queryKey: ["employees", { search, page, sortBy, sortOrder }],
    queryFn: () => getEmployees({ search, page, limit: 10, sortBy, sortOrder }),
  });

  // Fetch departments for dropdown
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setShowModal(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateEmployeeData>;
    }) => updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setShowModal(false);
      setEditingEmployee(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(
        <div className="flex items-center justify-between gap-4">
          <span>Employee deactivated</span>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 px-3 text-xs"
            onClick={() =>
              updateMutation.mutate({ id, data: { status: "active" } })
            }
          >
            Undo
          </Button>
        </div>,
        { autoClose: 5000 },
      );
    },
    onError: () => {
      toast.error("Failed to deactivate employee");
    },
  });

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employees
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage employee records and training assignments
          </p>
        </div>

        {canManage && (
          <Button
            onClick={() => {
              setEditingEmployee(null);
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, SAP ID, or designation..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              Failed to load employees
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                      <th
                        className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort("fullName")}
                      >
                        <div className="flex items-center">
                          Employee
                          <SortIcon field="fullName" />
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort("sapId")}
                      >
                        <div className="flex items-center">
                          SAP ID
                          <SortIcon field="sapId" />
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort("designation")}
                      >
                        <div className="flex items-center">
                          Designation
                          <SortIcon field="designation" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Department
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center">
                          Status
                          <SortIcon field="status" />
                        </div>
                      </th>
                      {canManage && (
                        <th className="text-right py-3 px-4 font-medium text-gray-500">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data?.employees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                              {employee.photoUrl ? (
                                <img
                                  src={employee.photoUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {employee.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-mono">
                          {employee.sapId}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {employee.designation}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <Building2 className="w-4 h-4" />
                            {employee.department?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              employee.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
                            )}
                          >
                            {employee.status}
                          </span>
                        </td>
                        {canManage && (
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(employee)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {employee.status !== "inactive" ? (
                                <button
                                  onClick={() => handleDelete(employee.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <div className="w-7 h-7" />
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * 10 + 1} to{" "}
                    {Math.min(page * 10, data.pagination.total)} of{" "}
                    {data.pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          departments={departments || []}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
          onSubmit={(data) => {
            if (editingEmployee) {
              updateMutation.mutate({ id: editingEmployee.id, data });
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

// Employee Modal Component
function EmployeeModal({
  employee,
  departments,
  onClose,
  onSubmit,
  isLoading,
}: {
  employee: Employee | null;
  departments: Department[];
  onClose: () => void;
  onSubmit: (data: CreateEmployeeData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateEmployeeData>({
    sapId: employee?.sapId || "",
    fullName: employee?.fullName || "",
    designation: employee?.designation || "",
    departmentId: employee?.departmentId || departments[0]?.id || 0,
    status: employee?.status || "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {employee ? "Edit Employee" : "Add Employee"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="SAP ID"
            value={formData.sapId}
            onChange={(e) =>
              setFormData({ ...formData, sapId: e.target.value })
            }
            required
          />
          <Input
            label="Full Name"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
          />
          <Input
            label="Designation"
            value={formData.designation}
            onChange={(e) =>
              setFormData({ ...formData, designation: e.target.value })
            }
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Department
            </label>
            <select
              value={formData.departmentId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  departmentId: Number(e.target.value),
                })
              }
              className="flex h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              {employee ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
