import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, ListTodo } from "lucide-react";

interface ToDoProps {
  onBack: () => void;
  petName: string;
}

interface Task {
  id: string;
  text: string;
  dueDate: string | null;
  done: boolean;
  createdAt: string;
}

const STORAGE_KEY = "petNovaTodos";

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

type Filter = "all" | "pending" | "done";

export default function ToDo({ onBack, petName }: ToDoProps) {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newText, setNewText] = useState("");
  const [newDue, setNewDue] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const persist = (next: Task[]) => {
    setTasks(next);
    saveTasks(next);
  };

  const addTask = () => {
    if (!newText.trim()) return;
    const task: Task = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      text: newText.trim(),
      dueDate: newDue || null,
      done: false,
      createdAt: new Date().toISOString(),
    };
    persist([task, ...tasks]);
    setNewText("");
    setNewDue("");
  };

  const toggleTask = (id: string) => {
    persist(tasks.map((tsk) => (tsk.id === id ? { ...tsk, done: !tsk.done } : tsk)));
  };

  const deleteTask = (id: string) => {
    persist(tasks.filter((tsk) => tsk.id !== id));
  };

  const clearDone = () => {
    persist(tasks.filter((tsk) => !tsk.done));
  };

  const filteredTasks = tasks
    .filter((tsk) => (filter === "pending" ? !tsk.done : filter === "done" ? tsk.done : true))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

  const pendingCount = tasks.filter((tsk) => !tsk.done).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Geist', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">
              {t("todo.title")}
            </h1>
            <p className="text-sm text-gray-600">{t("todo.subtitle")} · {petName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <Card className="p-4 md:p-6 bg-white border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder={t("todo.addPlaceholder")}
              className="flex-1 border-gray-300"
            />
            <Input
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              className="md:w-48 border-gray-300"
              title={t("todo.dueDate")}
            />
            <Button onClick={addTask} className="bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white shrink-0">
              <Plus size={18} className="mr-2" />
              {t("todo.add")}
            </Button>
          </div>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {(["all", "pending", "done"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  filter === f ? "bg-brand-purple/10 text-brand-purple" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t(`todo.${f}`)}
              </button>
            ))}
          </div>
          {tasks.some((tsk) => tsk.done) && (
            <button onClick={clearDone} className="text-sm text-gray-500 hover:text-red-600 transition">
              {t("todo.clearDone")}
            </button>
          )}
        </div>

        {filteredTasks.length === 0 ? (
          <Card className="p-8 bg-white border-gray-100 text-center">
            <ListTodo className="mx-auto text-gray-300 mb-3" size={36} />
            <p className="text-gray-500">{t("todo.empty")}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((tsk) => (
              <Card key={tsk.id} className="p-4 bg-white border-gray-100 flex items-center gap-3">
                <Checkbox checked={tsk.done} onCheckedChange={() => toggleTask(tsk.id)} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${tsk.done ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {tsk.text}
                  </p>
                  {tsk.dueDate && (
                    <Badge variant="secondary" className="mt-1">
                      {tsk.dueDate}
                    </Badge>
                  )}
                </div>
                <button onClick={() => deleteTask(tsk.id)} className="p-2 text-gray-400 hover:text-red-600 transition">
                  <Trash2 size={18} />
                </button>
              </Card>
            ))}
          </div>
        )}

        {pendingCount > 0 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            {pendingCount} {pendingCount === 1 ? t("todo.taskPending") : t("todo.tasksPending")}
          </p>
        )}
      </main>
    </div>
  );
}
