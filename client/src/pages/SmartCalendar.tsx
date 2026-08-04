import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Syringe, Stethoscope, AlertTriangle, CalendarClock, Bell, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAppointments, getVaccines, Appointment, Vaccine } from "@/lib/api";

interface SmartCalendarProps {
  onBack: () => void;
  petName: string;
}

type CalKind = "appointment" | "vaccine" | "reminder";

type CalEvent = {
  id: string;
  date: string; // yyyy-mm-dd
  label: string;
  kind: CalKind;
  removable?: boolean;
};

type Filter = "all" | CalKind;

const REMINDERS_KEY = "petNovaReminders";

interface Reminder {
  id: string;
  date: string;
  label: string;
}

function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReminders(reminders: Reminder[]) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default function SmartCalendar({ onBack, petName }: SmartCalendarProps) {
  const { t, language } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [newReminderText, setNewReminderText] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");

  useEffect(() => {
    setReminders(loadReminders());
    (async () => {
      try {
        const [a, v] = await Promise.all([getAppointments(), getVaccines()]);
        if (Array.isArray(a)) setAppointments(a);
        if (Array.isArray(v)) setVaccines(v);
      } catch {
        // Backend unreachable in this preview — calendar still renders empty/local
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addReminder = () => {
    if (!newReminderText.trim() || !newReminderDate) return;
    const reminder: Reminder = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      date: newReminderDate,
      label: newReminderText.trim(),
    };
    const next = [...reminders, reminder];
    setReminders(next);
    saveReminders(next);
    setNewReminderText("");
    setNewReminderDate("");
  };

  const removeReminder = (id: string) => {
    const next = reminders.filter((r) => r.id !== id);
    setReminders(next);
    saveReminders(next);
  };

  const allEvents: CalEvent[] = useMemo(() => {
    const apptEvents: CalEvent[] = appointments.map((a) => ({
      id: `appt-${a.id}`,
      date: a.date,
      label: `${a.type} · ${a.veterinarian || t("dashboard.veterinarian")}`,
      kind: "appointment",
    }));
    const vaxEvents: CalEvent[] = vaccines.map((v) => ({
      id: `vax-${v.id}`,
      date: v.nextDue,
      label: `${t("calendar.nextDoseLabel")} ${v.name}`,
      kind: "vaccine",
    }));
    const remEvents: CalEvent[] = reminders.map((r) => ({
      id: `rem-${r.id}`,
      date: r.date,
      label: r.label,
      kind: "reminder",
      removable: true,
    }));
    return [...apptEvents, ...vaxEvents, ...remEvents].filter((e) => e.date);
  }, [appointments, vaccines, reminders, language]);

  const events = useMemo(
    () => (filter === "all" ? allEvents : allEvents.filter((e) => e.kind === filter)),
    [allEvents, filter]
  );

  const eventDates = events.map((e) => new Date(e.date));

  const selectedKey = selected ? selected.toISOString().slice(0, 10) : "";
  const eventsForSelectedDay = events.filter((e) => e.date === selectedKey);

  // "Smart" suggestions: anything due within 7 days, sorted soonest first
  const upcomingSmart = useMemo(
    () =>
      events
        .map((e) => ({ ...e, delta: daysUntil(e.date) }))
        .filter((e) => e.delta >= 0 && e.delta <= 7)
        .sort((a, b) => a.delta - b.delta),
    [events]
  );

  const now = new Date();
  const thisMonthCount = allEvents.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const kindIcon = (kind: CalKind) => {
    if (kind === "vaccine") return <Syringe className="text-brand-purple" size={18} />;
    if (kind === "reminder") return <Bell className="text-amber-600" size={18} />;
    return <Stethoscope className="text-brand-purple" size={18} />;
  };

  const kindBadgeLabel = (kind: CalKind) =>
    kind === "vaccine" ? t("calendar.filterVaccines") : kind === "reminder" ? t("calendar.filterReminders") : t("calendar.filterAppointments");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Geist', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">
            {t("nav.smartCalendar")}
          </h1>
          <Badge variant="secondary" className="ml-auto hidden sm:inline-flex">
            {thisMonthCount} · {t("calendar.thisMonth")}
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(["all", "appointment", "vaccine", "reminder"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  filter === f ? "bg-brand-purple/10 text-brand-purple" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {f === "all"
                  ? t("calendar.filterAll")
                  : f === "appointment"
                  ? t("calendar.filterAppointments")
                  : f === "vaccine"
                  ? t("calendar.filterVaccines")
                  : t("calendar.filterReminders")}
              </button>
            ))}
          </div>

          <Card className="p-6 bg-white border-gray-100">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={setSelected}
              modifiers={{ hasEvent: eventDates }}
              modifiersClassNames={{ hasEvent: "bg-brand-purple/10 text-brand-purple font-bold rounded-full" }}
            />
            <div className="mt-6 border-t pt-4">
              <h3 className="font-bold text-gray-900 mb-3">
                {selected?.toLocaleDateString(language === "es" ? "es-PA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </h3>
              {eventsForSelectedDay.length === 0 ? (
                <p className="text-sm text-gray-500">{t("calendar.noDay")} {petName}.</p>
              ) : (
                <div className="space-y-2">
                  {eventsForSelectedDay.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-brand-purple/5 border border-brand-purple/10">
                      {kindIcon(e.kind)}
                      <p className="text-sm font-medium text-gray-800 flex-1">{e.label}</p>
                      <Badge variant="secondary">{kindBadgeLabel(e.kind)}</Badge>
                      {e.removable && (
                        <button onClick={() => removeReminder(e.id.replace("rem-", ""))} className="text-gray-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Add reminder */}
          <Card className="p-6 bg-white border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="text-amber-500" size={20} />
              {t("calendar.addReminder")}
            </h3>
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                value={newReminderText}
                onChange={(e) => setNewReminderText(e.target.value)}
                placeholder={t("calendar.reminderPlaceholder")}
                className="flex-1 border-gray-300"
              />
              <Input
                type="date"
                value={newReminderDate}
                onChange={(e) => setNewReminderDate(e.target.value)}
                className="md:w-48 border-gray-300"
              />
              <Button onClick={addReminder} className="bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white shrink-0">
                <Plus size={18} className="mr-2" />
                {t("dashboard.schedule")}
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-white border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarClock className="text-amber-500" size={20} />
              {t("calendar.smartReminders")}
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500">{t("calendar.loading")}</p>
            ) : upcomingSmart.length === 0 ? (
              <p className="text-sm text-gray-500">{t("calendar.nothingPending")}</p>
            ) : (
              <div className="space-y-3">
                {upcomingSmart.map((e) => (
                  <div key={e.id} className="p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-2">
                    <AlertTriangle className="text-amber-500 mt-0.5" size={16} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{e.label}</p>
                      <p className="text-xs text-gray-600">
                        {e.delta === 0
                          ? t("calendar.today")
                          : `${t("calendar.inPrefix")} ${e.delta} ${e.delta === 1 ? t("calendar.daySingular") : t("calendar.dayPlural")}`}
                      </p>
                    </div>
                    <Badge className="ml-auto" variant={e.delta <= 1 ? "destructive" : "secondary"}>
                      {kindBadgeLabel(e.kind)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 bg-white border-gray-100 text-sm text-gray-600">
            {t("calendar.aboutBefore")} <b>{petName}</b>{t("calendar.aboutAfter")}
          </Card>
        </div>
      </main>
    </div>
  );
}
