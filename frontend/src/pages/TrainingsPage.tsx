import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import {
  getTrainings,
  createTraining,
  updateTraining,
  deleteTraining,
  type Training,
  type CreateTrainingData,
  type TrainingType,
} from "@/services/trainings";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

const TRAINING_TYPES: { value: TrainingType; label: string }[] = [
  { value: "BASIC", label: "Basic Training" },
  { value: "REF", label: "Refresher" },
  { value: "COJ", label: "Change of Job" },
  { value: "OTHR", label: "Other" },
];

export function TrainingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canManage = ["admin", "training_officer"].includes(user?.role || "");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);

  // Fetch trainings
  const {
    data: trainings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["trainings", { search }],
    queryFn: () => getTrainings({ search }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
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
      data: Partial<CreateTrainingData>;
    }) => updateTraining(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      setShowModal(false);
      setEditingTraining(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
    },
  });

  const handleEdit = (training: Training) => {
    setEditingTraining(training);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this training?")) {
      deleteMutation.mutate(id);
    }
  };

  const getTypeColor = (type: TrainingType) => {
    const colors: Record<TrainingType, string> = {
      BASIC: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      REF: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      COJ: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      OTHR: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    };
    return colors[type];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Trainings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage training catalog and compliance requirements
          </p>
        </div>

        {canManage && (
          <Button
            onClick={() => {
              setEditingTraining(null);
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Training
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </CardContent>
      </Card>

      {/* Training Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          Failed to load trainings
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainings?.map((training) => (
            <Card
              key={training.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        getTypeColor(training.trainingType),
                      )}
                    >
                      {training.trainingType}
                    </span>
                    {training.isMandatory && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Mandatory
                      </span>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(training)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(training.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {training.name}
                </h3>
                <p className="text-sm text-gray-500 font-mono mb-3">
                  {training.code}
                </p>

                {training.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {training.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {training.durationDays} day
                    {training.durationDays > 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid {training.validityDays} days
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TrainingModal
          training={editingTraining}
          onClose={() => {
            setShowModal(false);
            setEditingTraining(null);
          }}
          onSubmit={(data) => {
            if (editingTraining) {
              updateMutation.mutate({ id: editingTraining.id, data });
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

// Training Modal Component
function TrainingModal({
  training,
  onClose,
  onSubmit,
  isLoading,
}: {
  training: Training | null;
  onClose: () => void;
  onSubmit: (data: CreateTrainingData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: training?.name || "",
    code: training?.code || "",
    trainingType: training?.trainingType || ("REF" as TrainingType),
    validityDays: training?.validityDays || 365,
    durationDays: training?.durationDays || 1,
    isMandatory: training?.isMandatory || false,
    description: training?.description || "",
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
          {training ? "Edit Training" : "Add Training"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Training Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., First Aid Refresher"
            required
          />
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="e.g., FA-REF"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Training Type
            </label>
            <select
              value={formData.trainingType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  trainingType: e.target.value as TrainingType,
                })
              }
              className="flex h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {TRAINING_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (days)"
              type="number"
              min={1}
              value={formData.durationDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  durationDays: Number(e.target.value),
                })
              }
              required
            />
            <Input
              label="Validity (days)"
              type="number"
              min={1}
              value={formData.validityDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  validityDays: Number(e.target.value),
                })
              }
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isMandatory"
              checked={formData.isMandatory}
              onChange={(e) =>
                setFormData({ ...formData, isMandatory: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="isMandatory"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Mandatory training
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the training..."
            />
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
              {training ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
