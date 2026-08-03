import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { MapPin, Phone, Plus, PawPrint } from "lucide-react";
import { LostPetAlert, getAlerts } from "@/lib/api";
import CreateAlert from "./CreateAlert";

interface AlertaPawProps {
  onBack: () => void;
  petName: string;
  ownerCity: string;
}

export default function AlertaPaw({ onBack, petName, ownerCity }: AlertaPawProps) {
  const [alerts, setAlerts] = useState<LostPetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAlerts();
      if (Array.isArray(data)) setAlerts(data);
    } catch {
      /* backend not reachable */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (showForm) {
    return (
      <CreateAlert
        onBack={() => setShowForm(false)}
        petName={petName}
        ownerCity={ownerCity}
        onSuccess={() => {
          setShowForm(false);
          load();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Geist', sans-serif" }}>
      <PageHeader onBack={onBack} title="Alerta Paw" />

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10 md:mb-12">
          <p className="text-muted-foreground max-w-md">
            Mascotas reportadas como perdidas en la comunidad.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="group/btn inline-flex items-center gap-3 pl-5 pr-1.5 py-1.5 rounded-full bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white text-sm font-semibold w-fit press spatial"
          >
            Reportar mascota perdida
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 transition-transform duration-300 group-hover/btn:translate-x-0.5">
              <Plus size={16} strokeWidth={1.25} />
            </span>
          </button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Cargando alertas...</p>
        ) : alerts.length === 0 ? (
          <div className="bezel spatial">
            <div className="bezel-core p-10 text-center text-muted-foreground">
              No hay alertas activas por ahora.
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-5">
            {alerts.map((alert, i) => (
              <div key={alert.id} className="rise" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="bezel spatial">
                  <div className="bezel-core p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-purple-light to-brand-cyan flex items-center justify-center text-white shrink-0">
                        <PawPrint size={18} strokeWidth={1.25} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{alert.petName}</p>
                        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} strokeWidth={1.25} /> {alert.location}, {alert.city}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone size={14} strokeWidth={1.25} /> {alert.contact}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
