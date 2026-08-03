import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { createVaccine } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getCityLocations } from "@/lib/petLocations";

interface ScheduleVaccineProps {
  onBack: () => void;
  petName: string;
  ownerCity?: string;
  onSuccess: () => void;
}

export default function ScheduleVaccine({ onBack, petName, ownerCity, onSuccess }: ScheduleVaccineProps) {
  const { t } = useLanguage();
  const veterinarians = getCityLocations(ownerCity).veterinarians;
  const [form, setForm] = useState({
    name: "",
    date: "",
    nextDue: "",
    veterinarian: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.date) {
      toast.error(t("toast.required"));
      return;
    }
    setSubmitting(true);
    try {
      await createVaccine({ petId: petName, ...form });
      onSuccess();
    } catch {
      toast.error("Error scheduling vaccine");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Geist', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">
            {t("dashboard.scheduleVaccine")}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <Card className="p-8 bg-white border-gray-100">
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-semibold text-gray-700">Vaccine Name</Label>
              <Input
                placeholder="e.g., Rabies, DHPP"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 border-gray-300"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700">{t("dashboard.date")}</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-2 border-gray-300"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700">Next Due Date</Label>
              <Input
                type="date"
                value={form.nextDue}
                onChange={(e) => setForm({ ...form, nextDue: e.target.value })}
                className="mt-2 border-gray-300"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700">{t("dashboard.veterinarian")}</Label>
              <Select value={form.veterinarian} onValueChange={(value) => setForm({ ...form, veterinarian: value })}>
                <SelectTrigger className="mt-2 border-gray-300">
                  <SelectValue placeholder="Elige una veterinaria" />
                </SelectTrigger>
                <SelectContent>
                  {veterinarians.map((vet) => (
                    <SelectItem key={vet.name} value={vet.name}>
                      {vet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <MapPin size={12} /> Estas son las veterinarias que ves en Mapa Pet, cerca de ti
              </p>
            </div>

            <div className="flex gap-4">
              <Button onClick={onBack} variant="outline" className="flex-1">
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white"
              >
                {submitting ? "Scheduling..." : t("dashboard.schedule")}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
