"use client";

import { useEffect, useState } from "react";
import { tasksAPI } from "@/lib/api";
import { usePersistentState } from "@/hooks/usePersistentState";

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
  createdAt?: string;
};

interface AssignedTasksProps {
  onStarted?: () => void;
  selectedProject?: any;
}

export function AssignedTasks({ onStarted, selectedProject }: AssignedTasksProps) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = usePersistentState<Task[]>('member-assigned-tasks', []);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksAPI.getMy("Not Started");
      setTasks(data || []);
    } catch (e) {
      setError("Failed to load assigned tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStart = async (id: string) => {
    try {
      setStartingId(id);
      await tasksAPI.start(id);
      // Remove from assigned list once started
      setTasks((prev) => prev.filter((t) => t.id !== id));
      onStarted?.();
    } catch (e) {
      setError("Failed to start task");
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Assigned Tasks</h2>
        <button
          onClick={load}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
          {error}
        </div>
      )}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No assigned tasks.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <li key={task.id} className="p-4 flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-900">{task.title}</div>
                {task.description && (
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {task.description}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  <span className="mr-2 inline-flex items-center rounded bg-gray-100 px-2 py-0.5">{task.status}</span>
                  {task.priority && (
                    <span className="mr-2 inline-flex items-center rounded bg-amber-100 text-amber-800 px-2 py-0.5">{task.priority}</span>
                  )}
                  {task.dueDate && (
                    <span className="inline-flex items-center rounded bg-blue-50 text-blue-700 px-2 py-0.5">Due {new Date(task.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => handleStart(task.id)}
                  disabled={startingId === task.id}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white ${
                    startingId === task.id ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {startingId === task.id ? "Starting..." : "Start"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
