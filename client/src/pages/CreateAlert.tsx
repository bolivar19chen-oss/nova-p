import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { createAlert } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface CreateAlertProps {
  onBack: () => void;
  petName: string;
  ownerCity: string;
  onSuccess: () => void;
}

export default function CreateAlert({ onBack, petName, ownerCity, onSuccess }: CreateAlertProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    location: "",
    description: "",
    contact: "",
    city: ownerCity,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.location || !form.description || !form.contact) {
      toast.error(t("toast.required"));
      return;
    }
    setSubmitting(true);
    try {
      await createAlert({
        petName,
        date: new Date().toLocaleDateString("en-US"),
        ...form,
      });
      onSuccess();
    } catch {
      toast.error("Error creating alert");
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
            {t("dashboard.createAlert")}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <Card className="p-8 bg-white border-gray-100">
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-semibold text-gray-700">Location</Label>
              <Input
                placeholder="Where was your pet last seen?"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-2 border-gray-300"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700">Description</Label>
              <Textarea
                placeholder="Describe your pet (color, size, distinctive marks, etc.)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-2 border-gray-300"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700">Contact Information</Label>
              <Input
                placeholder="Phone number or email"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="mt-2 border-gray-300"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700">City</Label>
              <Select value={form.city} onValueChange={(value) => setForm({ ...form, city: value })}>
                <SelectTrigger className="mt-2 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Panama City">Panama City</SelectItem>
                  <SelectItem value="La Chorrera">La Chorrera</SelectItem>
                  <SelectItem value="Colon">Colon</SelectItem>
                  <SelectItem value="David">David</SelectItem>
                </SelectContent>
              </Select>
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
                {submitting ? "Creating..." : t("dashboard.createAlert")}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
