"use client";

import { useState, useTransition, useOptimistic } from "react";
import { format } from "date-fns";
import { Clock, Check } from "lucide-react";
import { toggleTaskComplete } from "@/lib/data/tasks";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  type: string;
  created_at: string;
}

export default function TaskListClient({ tasks: initialTasks }: { tasks: Task[] }) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [isPending, startTransition] = useTransition();
  const [optimisticTasks, addOptimistic] = useOptimistic(
    initialTasks,
    (state: Task[], taskId: string) =>
      state.map((t) => (t.id === taskId ? { ...t, is_completed: !t.is_completed } : t))
  );

  const filtered = optimisticTasks.filter((t) => {
    if (filter === "pending") return !t.is_completed;
    if (filter === "completed") return t.is_completed;
    return true;
  });

  const typeColors: Record<string, string> = {
    medication: "bg-blue-50 text-blue-700",
    lab: "bg-purple-50 text-purple-700",
    appointment: "bg-green-50 text-green-700",
    general: "bg-gray-100 text-gray-600",
  };

  function handleToggle(taskId: string) {
    startTransition(async () => {
      addOptimistic(taskId);
      const result = await toggleTaskComplete(taskId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {(["all", "pending", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-3 text-sm font-medium border-b-2 transition-all capitalize ${
              filter === f ? "text-primary border-primary" : "text-gray-500 border-transparent"
            }`}
          >
            {f === "all" ? "All" : f === "pending" ? "Pending" : "Completed"}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filtered.map((task) => (
          <div
            key={task.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 transition-all ${
              task.is_completed ? "opacity-60" : ""
            }`}
          >
            <button
              onClick={() => handleToggle(task.id)}
              disabled={isPending}
              className={`w-6 h-6 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                task.is_completed
                  ? "bg-primary border-primary text-white"
                  : "border-gray-300 hover:border-primary"
              }`}
            >
              {task.is_completed && <Check className="w-4 h-4" />}
            </button>
            <div className="flex-1">
              <p className={`text-sm font-medium ${task.is_completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[task.type] || typeColors.general}`}>
                  {task.type?.toUpperCase()}
                </span>
                {task.due_date && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due: {format(new Date(task.due_date), "MMM dd, yyyy")}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">No tasks found</div>
        )}
      </div>
    </div>
  );
}
