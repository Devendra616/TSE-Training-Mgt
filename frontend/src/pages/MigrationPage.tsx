import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  uploadMigrationFile,
  deleteMigrationFile,
  checkDuplicate,
  migrateCertificate,
  getMigrationStats,
  type MigrateCertificateData,
} from "@/services/migration";
import { getBackendAssetUrl } from "@/services/api";
import { searchEmployees, type Employee } from "@/services/employees";
import { getTrainings } from "@/services/trainings";
import { formatSapIdWithToken } from "@/utils/employeeDisplay";

const getInclusiveDayDifference = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return null;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (end < start) {
    return null;
  }

  const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  return Math.floor(diffInDays) + 1;
};

export function MigrationPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [storedFilename, setStoredFilename] = useState<string | null>(null);
  const storedFilenameRef = useRef<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<MigrateCertificateData>>({
    issueDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [employeeSearch, setEmployeeSearch] = useState("");
  const previewUrl = fileUrl ? getBackendAssetUrl(fileUrl) : null;

  // Fetch data
  const { data: stats } = useQuery({
    queryKey: ["migrationStats"],
    queryFn: getMigrationStats,
  });

  const { data: trainings } = useQuery({
    queryKey: ["trainings"],
    queryFn: () => getTrainings(),
  });

  const { data: employeeResults } = useQuery({
    queryKey: ["employeeSearch", employeeSearch],
    queryFn: () => searchEmployees(employeeSearch),
    enabled: employeeSearch.length >= 2,
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadMigrationFile,
    onSuccess: (data) => {
      setFileUrl(data.fileUrl);
      setStoredFilename(data.filename);
      setMimeType(data.mimeType);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "File upload failed.";

      toast.error(message);
      setFile(null);
      setFileUrl(null);
      setStoredFilename(null);
      storedFilenameRef.current = null;
      setMimeType(null);
    },
  });

  // Check duplicate mutation
  const checkDuplicateMutation = useMutation({
    mutationFn: checkDuplicate,
    onSuccess: (data) => {
      if (data.isDuplicate) {
        setDuplicateWarning(data.reason || "Duplicate found");
      } else {
        setDuplicateWarning(null);
      }
    },
  });

  // Migrate mutation
  const migrateMutation = useMutation({
    mutationFn: migrateCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["migrationStats"] });
      storedFilenameRef.current = null;
      // Reset form
      setFormData({ issueDate: format(new Date(), "yyyy-MM-dd") });
      setSelectedEmployee(null);
      setEmployeeSearch("");
      setFile(null);
      setFileUrl(null);
      setStoredFilename(null);
      setMimeType(null);
      setDuplicateWarning(null);
    },
  });

  const deleteUploadedFile = async (filename: string | null) => {
    if (!filename) return;
    try {
      await deleteMigrationFile(filename);
    } catch (error) {
      // Best-effort cleanup; ignore failures.
      console.warn(
        "Failed to delete orphaned migration file:",
        filename,
        error,
      );
    }
  };

  const handleDiscardFile = async () => {
    await deleteUploadedFile(storedFilenameRef.current);
    setFile(null);
    setFileUrl(null);
    setStoredFilename(null);
    storedFilenameRef.current = null;
    setMimeType(null);
  };

  // Handle file drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await deleteUploadedFile(storedFilenameRef.current);
      setFile(droppedFile);
      uploadMutation.mutate(droppedFile);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await deleteUploadedFile(storedFilenameRef.current);
      setFile(selectedFile);
      uploadMutation.mutate(selectedFile);
      e.target.value = "";
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({ ...formData, employeeId: employee.id });
    setEmployeeSearch("");

    // Check for duplicates
    if (formData.trainingId && formData.issueDate) {
      checkDuplicateMutation.mutate({
        employeeId: employee.id,
        trainingId: formData.trainingId,
        issueDate: formData.issueDate,
        certificateNumber: formData.certificateNumber?.trim(),
      });
    }
  };

  const handleTrainingChange = (trainingId: number) => {
    setFormData({ ...formData, trainingId });

    // Check for duplicates
    if (selectedEmployee && formData.issueDate) {
      checkDuplicateMutation.mutate({
        employeeId: selectedEmployee.id,
        trainingId,
        issueDate: formData.issueDate,
        certificateNumber: formData.certificateNumber?.trim(),
      });
    }
  };

  useEffect(() => {
    if (!selectedEmployee || !formData.trainingId || !formData.issueDate) {
      return;
    }

    const certificateNumber = formData.certificateNumber?.trim();
    checkDuplicateMutation.mutate({
      employeeId: selectedEmployee.id,
      trainingId: formData.trainingId,
      issueDate: formData.issueDate,
      ...(certificateNumber ? { certificateNumber } : {}),
    });
  }, [
    selectedEmployee,
    formData.trainingId,
    formData.issueDate,
    formData.certificateNumber,
  ]);

  useEffect(() => {
    if (!formData.validFrom || !formData.validUntil) {
      return;
    }

    const calculatedDays = getInclusiveDayDifference(
      formData.validFrom,
      formData.validUntil,
    );

    if (calculatedDays === null) {
      return;
    }

    setFormData((current) => {
      if (current.daysAttended === calculatedDays) {
        return current;
      }

      return {
        ...current,
        daysAttended: calculatedDays,
      };
    });
  }, [formData.validFrom, formData.validUntil]);

  useEffect(() => {
    storedFilenameRef.current = storedFilename;
  }, [storedFilename]);

  useEffect(() => {
    return () => {
      if (storedFilenameRef.current) {
        deleteUploadedFile(storedFilenameRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !formData.trainingId || !formData.issueDate) {
      return;
    }

    // Prevent race condition where the user submits before the upload callback finishes.
    if (file && !storedFilename) {
      return;
    }

    const autoCalculatedDaysAttended =
      formData.validFrom && formData.validUntil
        ? getInclusiveDayDifference(formData.validFrom, formData.validUntil)
        : null;

    migrateMutation.mutate({
      ...formData,
      employeeId: selectedEmployee.id,
      trainingId: formData.trainingId,
      issueDate: formData.issueDate,
      daysAttended:
        autoCalculatedDaysAttended ?? formData.daysAttended ?? undefined,
      sourceFileName: file?.name,
      certificatePath: storedFilename || undefined,
    } as MigrateCertificateData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Migration Tool
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Digitize legacy certificates from PDFs and images
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-400">
            {stats?.totalMigrated || 0} certificates migrated
          </span>
        </div>
      </div>

      {/* Split screen layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Document preview */}
        <Card className="h-[calc(100vh-150px)] flex flex-col">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Document Preview
            </h2>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {!fileUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Drop file here or click to upload
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">{file?.name}</span>
                  </div>
                  <button
                    onClick={handleDiscardFile}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {mimeType === "application/pdf" ||
                  file?.type === "application/pdf" ? (
                    <iframe
                      src={previewUrl || ""}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  ) : (
                    <img
                      src={previewUrl || ""}
                      alt="Certificate preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Data entry form */}
        <Card className="h-[calc(100vh-150px)] flex flex-col">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Certificate Data
            </h2>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Duplicate warning */}
              {duplicateWarning && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Potential Duplicate
                    </span>
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    {duplicateWarning}
                  </p>
                </div>
              )}

              {/* Employee search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Employee *
                </label>
                {selectedEmployee ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div>
                      <div className="font-medium">
                        {selectedEmployee.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatSapIdWithToken(selectedEmployee)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Search by name, SAP ID, or Token No..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      icon={<Search className="w-4 h-4" />}
                    />
                    {employeeResults && employeeResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {employeeResults.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => handleEmployeeSelect(emp)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="font-medium">{emp.fullName}</div>
                            <div className="text-sm text-gray-500">
                              {formatSapIdWithToken(emp)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Training */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Training *
                </label>
                <select
                  value={formData.trainingId || ""}
                  onChange={(e) => handleTrainingChange(Number(e.target.value))}
                  className="flex h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select training</option>
                  {trainings?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Certificate number */}
              <Input
                label="Certificate Number (optional)"
                value={formData.certificateNumber || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    certificateNumber: e.target.value,
                  })
                }
                placeholder="e.g., BASIC/2024/001"
              />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Issue Date *"
                  type="date"
                  value={formData.issueDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, issueDate: e.target.value })
                  }
                  required
                />
                <Input
                  label="Days Attended"
                  type="number"
                  min={1}
                  value={formData.daysAttended ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daysAttended:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date *"
                  type="date"
                  value={formData.validFrom || ""}
                  onChange={(e) => {
                    setFormData((current) => {
                      const next = { ...current, validFrom: e.target.value };

                      if (next.validFrom && next.validUntil) {
                        const calculatedDays = getInclusiveDayDifference(
                          next.validFrom,
                          next.validUntil,
                        );

                        if (calculatedDays !== null) {
                          next.daysAttended = calculatedDays;
                        }
                      }

                      return next;
                    });
                  }}
                  required
                />
                <Input
                  label="End Date *"
                  type="date"
                  value={formData.validUntil || ""}
                  onChange={(e) => {
                    setFormData((current) => {
                      const next = { ...current, validUntil: e.target.value };

                      if (next.validFrom && next.validUntil) {
                        const calculatedDays = getInclusiveDayDifference(
                          next.validFrom,
                          next.validUntil,
                        );

                        if (calculatedDays !== null) {
                          next.daysAttended = calculatedDays;
                        }
                      }

                      return next;
                    });
                  }}
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional notes..."
                />
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  isLoading={migrateMutation.isPending}
                  disabled={
                    !selectedEmployee ||
                    !formData.trainingId ||
                    uploadMutation.isPending ||
                    (file !== null && !storedFilename)
                  }
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {uploadMutation.isPending
                    ? "Uploading file..."
                    : "Save Certificate"}
                </Button>
                {migrateMutation.isSuccess && (
                  <p className="text-center text-sm text-green-600 mt-2">
                    Certificate migrated successfully!
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
