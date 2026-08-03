import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Navigation, Clock } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getTracking, startTracking, TrackingUpdate } from "@/lib/api";
import { getCityLocations } from "@/lib/petLocations";

interface PetMapProps {
  onBack: () => void;
  userCity?: string;
  petName?: string;
}

// Pin de marca dibujado en SVG. Reemplaza al marcador azul por defecto de Leaflet,
// que no tenia nada que ver con Pet Nova. Va como divIcon para poder colorearlo por
// categoria sin cargar una imagen distinta para cada una.
function brandPin(color: string) {
  return L.divIcon({
    html: `
      <div style="position:relative;width:32px;height:42px;filter:drop-shadow(0 6px 10px rgba(16,12,24,.45))">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26c0-8.837-7.163-16-16-16z" fill="${color}"/>
          <circle cx="16" cy="15.5" r="6.5" fill="#ffffff" fill-opacity="0.92"/>
        </svg>
        <div style="position:absolute;top:7px;left:0;width:32px;text-align:center;font-size:13px;line-height:17px">🐾</div>
      </div>`,
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
}

const BRAND_PURPLE = "#523f7a";
const BRAND_PURPLE_LIGHT = "#8268d5";
const BRAND_CYAN = "#0cc0df";

// Un color de marca por categoria: se distinguen de un vistazo sin salirse de la paleta.
const vetIcon = brandPin(BRAND_PURPLE);
const parkIcon = brandPin(BRAND_CYAN);
const groomerIcon = brandPin(BRAND_PURPLE_LIGHT);

const buddyIcon = L.divIcon({
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">🐾</div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function PetMap({ onBack, userCity = "Panama City", petName = "tu mascota" }: PetMapProps) {
  const { t } = useLanguage();
  const locations = getCityLocations(userCity);
  const center: [number, number] = [locations.parks[0]?.lat ?? 8.98, locations.parks[0]?.lng ?? -79.52];

  const [tracking, setTracking] = useState<TrackingUpdate | null>(null);
  const [walkStarted, setWalkStarted] = useState(false);

  const beginWalk = useCallback(async () => {
    const home = center;
    const park = locations.parks[0];
    try {
      await startTracking({
        petId: petName,
        walkerName: "Carlos (paseador Pet Nova)",
        start: { lat: home[0], lng: home[1] },
        end: { lat: park.lat, lng: park.lng },
        durationSeconds: 180,
      });
      setWalkStarted(true);
    } catch {
      // Backend not reachable (e.g. static preview) — fall back to a
      // pure client-side simulation so the map is still interactive.
      setWalkStarted(true);
      const startedAt = Date.now();
      const duration = 180000;
      const tick = () => {
        const progress = Math.min(1, (Date.now() - startedAt) / duration);
        setTracking({
          petId: petName,
          walkerName: "Carlos (paseador Pet Nova)",
          lat: home[0] + (park.lat - home[0]) * progress,
          lng: home[1] + (park.lng - home[1]) * progress,
          progress,
          etaSeconds: Math.round((1 - progress) * 180),
          arrived: progress >= 1,
        });
        if (progress < 1) setTimeout(tick, 2000);
      };
      tick();
    }
  }, []);

  useEffect(() => {
    if (!walkStarted) return;
    const interval = setInterval(async () => {
      try {
        const update = await getTracking(petName);
        setTracking(update);
        if (update.arrived) clearInterval(interval);
      } catch {
        /* client-side fallback already ticking on its own timeout loop */
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [walkStarted, petName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Geist', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent" style={{ letterSpacing: "-0.01em" }}>
            {t("map.title")}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Buddy on the way banner */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-brand-purple/5 to-brand-cyan/10 border-brand-purple/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐾</span>
            <div>
              <p className="font-bold text-gray-900">
                {tracking ? `${tracking.walkerName} en camino con ${petName}` : `Sin paseos activos para ${petName}`}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Clock size={14} />
                {tracking ? (tracking.arrived ? "¡Llegaron al parque! 🎉" : `Llega en ~${Math.ceil(tracking.etaSeconds / 60)} min`) : "Inicia un paseo simulado en tiempo real"}
              </p>
            </div>
          </div>
          {!walkStarted && (
            <Button onClick={beginWalk} className="gap-2">
              <Navigation size={16} /> Iniciar paseo (demo en vivo)
            </Button>
          )}
        </Card>

        <p className="text-xs text-gray-500 mb-6 -mt-4">
          Este botón simula un paseo. Para GPS real, la app/dispositivo del paseador debe enviar su posición a{" "}
          <code className="bg-gray-100 px-1 rounded">POST /api/tracking/{"{petId}"}/update</code> con <code className="bg-gray-100 px-1 rounded">{"{ lat, lng }"}</code> — el mapa la mostrará automáticamente en vez de la simulación.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-gray-100 h-96 md:h-[600px] p-0">
              <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                {/* Base satelital de Esri: sin token ni cuenta, a diferencia de
                    Mapbox o Google. Encima va una capa de etiquetas para que se
                    lean calles y lugares sobre la foto aerea. */}
                <TileLayer
                  attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
                <TileLayer
                  attribution=""
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
                {locations.veterinarians.map((p, i) => (
                  <Marker key={`vet-${i}`} position={[p.lat, p.lng]} icon={vetIcon}>
                    <Popup>🏥 {p.name}</Popup>
                  </Marker>
                ))}
                {locations.parks.map((p, i) => (
                  <Marker key={`park-${i}`} position={[p.lat, p.lng]} icon={parkIcon}>
                    <Popup>🌳 {p.name}</Popup>
                  </Marker>
                ))}
                {locations.groomers.map((p, i) => (
                  <Marker key={`groomer-${i}`} position={[p.lat, p.lng]} icon={groomerIcon}>
                    <Popup>✂️ {p.name}</Popup>
                  </Marker>
                ))}
                {tracking && (
                  <>
                    <Marker position={[tracking.lat, tracking.lng]} icon={buddyIcon}>
                      <Popup>
                        {tracking.walkerName} — {Math.round(tracking.progress * 100)}%
                      </Popup>
                    </Marker>
                    <Polyline positions={[center, [tracking.lat, tracking.lng]]} pathOptions={{ color: "#9333ea", dashArray: "6 8" }} />
                  </>
                )}
              </MapContainer>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-white border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="text-red-500" size={20} />
                {t("map.veterinarians")}
              </h3>
              <div className="space-y-3">
                {locations.veterinarians.map((vet, idx) => (
                  <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="font-semibold text-gray-900">{vet.name}</p>
                    <p className="text-sm text-gray-600">📍 {userCity}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="text-green-500" size={20} />
                {t("map.parks")}
              </h3>
              <div className="space-y-3">
                {locations.parks.map((park, idx) => (
                  <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="font-semibold text-gray-900">{park.name}</p>
                    <p className="text-sm text-gray-600">🌳 Pet-friendly</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="text-blue-500" size={20} />
                {t("map.groomers")}
              </h3>
              <div className="space-y-3">
                {locations.groomers.map((groomer, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="font-semibold text-gray-900">{groomer.name}</p>
                    <p className="text-sm text-gray-600">✂️ Grooming</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
