import { useState, useMemo } from "react";
import { CheckSquare, Clock, Plus, Filter, Calendar, AlertCircle, ChevronRight, User } from "lucide-react";
import { CRMTask, CRMLead } from "../../crm/types";

interface CrmTasksListProps {
  tasks: CRMTask[];
  leads: CRMLead[];
  onToggleTaskStatus: (taskId: string, currentStatus: string) => void;
  onAddTask: (leadId: number, title: string, dueAt: string, priority: "Low" | "Medium" | "High") => void;
  onSelectLead: (lead: CRMLead) => void;
}

export function CrmTasksList({
  tasks,
  leads,
  onToggleTaskStatus,
  onAddTask,
  onSelectLead
}: CrmTasksListProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("pending");
  const [showAddModal, setShowAddModal] = useState(false);

  // New task state
  const [selectedLeadId, setSelectedLeadId] = useState<number>(leads[0]?.id || 0);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");

  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (filter === "pending") return t.status === "pending";
      if (filter === "completed") return t.status === "completed";
      if (filter === "overdue") {
        return t.status === "pending" && new Date(t.dueAt) < now;
      }
      return true;
    });
  }, [tasks, filter]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedLeadId) return;
    onAddTask(
      Number(selectedLeadId),
      title.trim(),
      dueAt || new Date(Date.now() + 86400000).toISOString(),
      priority
    );
    setTitle("");
    setDueAt("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-once">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-app-aside-bg/40 p-4 rounded-2xl border border-app-border">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold text-app-text font-display">Sales Tasks & Follow-ups</h2>
          </div>
          <p className="text-xs text-app-text-sec">
            Manage scheduled customer calls, quotation deliveries, and pipeline action items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-app-bg p-1 rounded-xl border border-app-border text-xs">
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filter === "pending" ? "bg-app-text text-app-bg" : "text-app-text-sec hover:text-app-text"
              }`}
            >
              Pending ({tasks.filter((t) => t.status === "pending").length})
            </button>
            <button
              onClick={() => setFilter("overdue")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filter === "overdue" ? "bg-red-500 text-white" : "text-app-text-sec hover:text-app-text"
              }`}
            >
              Overdue
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filter === "completed" ? "bg-app-text text-app-bg" : "text-app-text-sec hover:text-app-text"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filter === "all" ? "bg-app-text text-app-bg" : "text-app-text-sec hover:text-app-text"
              }`}
            >
              All ({tasks.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="glass p-12 text-center text-xs text-app-text-muted rounded-2xl border border-app-border">
            No tasks found matching current filter.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isOverdue = t.status === "pending" && new Date(t.dueAt) < new Date();
            const matchedLead = leads.find((l) => l.id === t.leadId);

            return (
              <div
                key={t.id}
                className={`glass p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  isOverdue
                    ? "border-red-500/30 bg-red-500/5"
                    : t.status === "completed"
                    ? "border-app-border/40 opacity-60 bg-app-aside-bg/10"
                    : "border-app-border bg-app-aside-bg/30 hover:border-app-border/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={t.status === "completed"}
                    onChange={() => onToggleTaskStatus(t.id, t.status)}
                    className="w-4 h-4 rounded text-sky-500 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <h4 className={`text-xs font-bold ${t.status === "completed" ? "line-through text-app-text-muted" : "text-app-text"}`}>
                      {t.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-app-text-sec mt-0.5">
                      {matchedLead ? (
                        <button
                          onClick={() => onSelectLead(matchedLead)}
                          className="hover:underline text-sky-500 flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <User className="w-3 h-3" />
                          <span>{matchedLead.company} ({matchedLead.name})</span>
                        </button>
                      ) : (
                        <span>Lead #{t.leadId}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-[11px] font-mono flex items-center gap-1 justify-end ${isOverdue ? "text-red-500 font-bold" : "text-app-text-sec"}`}>
                      {isOverdue && <AlertCircle className="w-3 h-3 text-red-500" />}
                      <span>Due: {new Date(t.dueAt).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[10px] text-app-text-muted font-mono uppercase">
                      Priority: {t.priority}
                    </span>
                  </div>

                  {matchedLead && (
                    <button
                      onClick={() => onSelectLead(matchedLead)}
                      className="p-1.5 rounded-lg bg-app-btn-sec hover:bg-app-btn-sec/80 text-app-text transition cursor-pointer"
                      title="Open Lead Profile"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="bg-app-bg border border-app-border rounded-2xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl">
            <h3 className="text-sm font-bold text-app-text">Schedule Follow-up Task</h3>

            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Associated Lead</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(Number(e.target.value))}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.company} - {l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Task Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Follow up on proposal sent via email..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-app-text-muted block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-xl bg-app-btn-sec text-app-text font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium cursor-pointer"
              >
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
