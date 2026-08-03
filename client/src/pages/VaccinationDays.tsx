import { Card } from "@/components/ui/card";
import { ArrowLeft, Syringe, MapPin, CalendarDays } from "lucide-react";

interface VaccinationDaysProps {
  onBack: () => void;
}

interface VaccinationDay {
  id: string;
  date: string;
  location: string;
  city: string;
  description: string;
}

// Datos de ejemplo (placeholder) — la interfaz final se ajustará al
// mockup que entregue el equipo. Por ahora deja lista la estructura
// para mostrar jornadas reales.
const VACCINATION_DAYS: VaccinationDay[] = [
  { id: "1", date: "2026-08-15", location: "Parque Omar", city: "Panama City", description: "Jornada gratuita de vacunación antirrábica" },
  { id: "2", date: "2026-08-22", location: "Plaza Central", city: "La Chorrera", description: "Vacunación y desparasitación general" },
];

export default function VaccinationDays({ onBack }: VaccinationDaysProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Geist', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">
            Jornadas de Vacunación
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-4">
        <p className="text-gray-600 mb-2">
          Próximas jornadas de vacunación en tu ciudad. El diseño final de esta sección se ajustará más adelante.
        </p>
        {VACCINATION_DAYS.map((day) => (
          <Card key={day.id} className="p-5 bg-white border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple-light to-brand-cyan flex items-center justify-center text-white shrink-0">
                <Syringe size={18} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarDays size={16} className="text-gray-500" /> {day.date}
                </p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" /> {day.location}, {day.city}
                </p>
                <p className="text-sm text-gray-700 mt-2">{day.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
}
