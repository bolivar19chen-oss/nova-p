import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Navigation, Clock } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getTracking, startTracking, TrackingUpdate } from "@/lib/api";
import { getCityLocations, PetLocation } from "@/lib/petLocations";
import { cn } from "@/lib/utils";

interface PetMapProps {
  onBack: () => void;
  userCity?: string;
  petName?: string;
}

type CategoryKey = "veterinarians" | "parks" | "groomers" | "petStores" | "shelters" | "emergencyClinics";
type GlyphKey = "cross" | "ring" | "diamond" | "square" | "triangle" | "target";

interface PlaceEntry extends PetLocation {
  id: string;
  category: CategoryKey;
}

interface ClusterGroup {
  lat: number;
  lng: number;
  items: PlaceEntry[];
}

const CATEGORY_ORDER: CategoryKey[] = ["veterinarians", "parks", "groomers", "petStores", "shelters", "emergencyClinics"];

const BRAND_PURPLE = "#523f7a";
const BRAND_PURPLE_LIGHT = "#8268d5";
const BRAND_CYAN = "#0cc0df";
const BRAND_RED = "#e23b3b";
// Dos tonos derivados de la marca (mezcla cyan/purpura y un rojo mas oscuro)
// para poder distinguir 6 categorias sin salirse de la paleta.
const BRAND_TEAL = "#1f8fae";
const BRAND_RED_DEEP = "#a52540";

// Un color y una forma geometrica por categoria: se distinguen de un vistazo
// sin usar iconos figurativos ni emoji.
const CATEGORY_META: Record<CategoryKey, { color: string; glyph: GlyphKey }> = {
  veterinarians: { color: BRAND_PURPLE, glyph: "cross" },
  parks: { color: BRAND_CYAN, glyph: "ring" },
  groomers: { color: BRAND_PURPLE_LIGHT, glyph: "diamond" },
  petStores: { color: BRAND_TEAL, glyph: "square" },
  shelters: { color: BRAND_RED, glyph: "triangle" },
  emergencyClinics: { color: BRAND_RED_DEEP, glyph: "target" },
};

// Formas dibujadas a mano dentro del circulo blanco del pin (coordenadas
// centradas en 15,14.5 sobre un viewBox de 30x29/30x40). Nada de emoji.
function glyphMarkup(glyph: GlyphKey, color: string): string {
  switch (glyph) {
    case "cross":
      return `<path d="M15 11v7M11.5 14.5h7" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>`;
    case "ring":
      return `<circle cx="15" cy="14.5" r="3.4" fill="none" stroke="${color}" stroke-width="1.8"/>`;
    case "diamond":
      return `<rect x="11.9" y="11.4" width="6.2" height="6.2" fill="${color}" transform="rotate(45 15 14.5)"/>`;
    case "square":
      return `<rect x="11.8" y="11.3" width="6.4" height="6.4" rx="1.1" fill="${color}"/>`;
    case "triangle":
      return `<path d="M15 10.7l4.3 7.3h-8.6z" fill="${color}"/>`;
    case "target":
      return `<circle cx="15" cy="14.5" r="4.1" fill="none" stroke="${color}" stroke-width="1.5"/><circle cx="15" cy="14.5" r="1.5" fill="${color}"/>`;
  }
}

// Pin de marca: gota con un circulo blanco adentro y la forma de la categoria
// encima. Version "highlighted" (hover desde la lista) un poco mas grande y
// con borde blanco. delayMs entra escalonado en vez de aparecer todos juntos.
function pinIcon(color: string, glyph: GlyphKey, opts: { highlighted?: boolean; delayMs?: number } = {}) {
  const scale = opts.highlighted ? 1.16 : 1;
  const w = Math.round(30 * scale);
  const h = Math.round(40 * scale);
  return L.divIcon({
    html: `
      <div class="pn-marker" style="width:${w}px;height:${h}px;animation-delay:${opts.delayMs ?? 0}ms">
        <svg width="${w}" height="${h}" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 6px 10px rgba(16,12,24,.4))">
          <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0z" fill="${color}"${opts.highlighted ? ' stroke="#ffffff" stroke-width="1.5"' : ""}/>
          <circle cx="15" cy="14.5" r="6.2" fill="#ffffff" fill-opacity="0.95"/>
          ${glyphMarkup(glyph, color)}
        </svg>
      </div>`,
    className: "",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 6],
  });
}

// Marcador de agrupamiento: circulo con anillo y el numero de lugares que
// contiene. Reemplaza al amontonamiento de pines cuando hay muchos cerca.
function clusterIcon(count: number) {
  const size = Math.round(Math.min(56, 32 + Math.sqrt(count) * 7));
  const r = size / 2;
  return L.divIcon({
    html: `
      <div class="pn-cluster" style="position:relative;width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="filter:drop-shadow(0 6px 12px rgba(16,12,24,.35))">
          <circle cx="${r}" cy="${r}" r="${r - 2}" fill="${BRAND_PURPLE}" />
          <circle cx="${r}" cy="${r}" r="${r - 2}" fill="none" stroke="#ffffff" stroke-width="2"/>
          <circle cx="${r}" cy="${r}" r="${r - 9}" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1"/>
        </svg>
        <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:600;font-size:${count > 99 ? 11 : 13}px;font-family:inherit">${count}</span>
      </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [r, r],
  });
}

// Indicador de paseo en vivo: punto con anillo pulsante, como un "estoy aqui"
// de mapa comun. Reemplaza la pata emoji de antes.
function buddyIcon() {
  return L.divIcon({
    html: `
      <div class="pn-live" style="position:relative;width:24px;height:24px">
        <span class="pn-live-ring"></span>
        <span style="position:absolute;inset:7px;border-radius:9999px;background:${BRAND_CYAN};box-shadow:0 0 0 2px #ffffff"></span>
      </div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Version React (no string) del mismo glyph, para pintarlo en la lista lateral
// y en los chips de filtro sin pasar por Leaflet.
function GlyphSwatch({ glyph, color, size = 24 }: { glyph: GlyphKey; color: string; size?: number }) {
  return (
    <span
      className="shrink-0 inline-flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 32%, transparent)`,
      }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.52}
        viewBox="0 0 30 29"
        xmlns="http://www.w3.org/2000/svg"
        dangerouslySetInnerHTML={{ __html: glyphMarkup(glyph, color) }}
      />
    </span>
  );
}

// Agrupamiento propio por zoom: sin dependencias nuevas. A mayor zoom, celdas
// mas chicas (menos agrupamiento); a partir de zoom 15 se muestran todos los
// pines sueltos. Es una grilla simple, no un clustering jerarquico.
function cellSizeForZoom(zoom: number): number {
  if (zoom >= 15) return 0;
  if (zoom >= 13) return 0.008;
  if (zoom >= 11) return 0.018;
  return 0.04;
}

function buildClusters(places: PlaceEntry[], zoom: number): ClusterGroup[] {
  const cellSize = cellSizeForZoom(zoom);
  if (cellSize === 0) {
    return places.map((p) => ({ lat: p.lat, lng: p.lng, items: [p] }));
  }
  const cells = new Map<string, PlaceEntry[]>();
  for (const place of places) {
    const key = `${Math.round(place.lat / cellSize)}:${Math.round(place.lng / cellSize)}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(place);
    else cells.set(key, [place]);
  }
  return Array.from(cells.values()).map((items) => ({
    lat: items.reduce((sum, p) => sum + p.lat, 0) / items.length,
    lng: items.reduce((sum, p) => sum + p.lng, 0) / items.length,
    items,
  }));
}

// Vuela suavemente hacia el lugar elegido en la lista lateral.
function FlyToController({ target }: { target: { lat: number; lng: number; zoom?: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? Math.max(map.getZoom(), 15), {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [target, map]);
  return null;
}

// Escucha el zoom del mapa y decide, en cada cambio, si mostrar pines sueltos
// o agrupados. El hover de la lista lateral resalta el pin correspondiente.
function ClusterLayer({
  places,
  hoveredId,
  onHoverPlace,
  labels,
}: {
  places: PlaceEntry[];
  hoveredId: string | null;
  onHoverPlace: (id: string | null) => void;
  labels: Record<CategoryKey, string>;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useMapEvents({
    zoomend() {
      setZoom(map.getZoom());
    },
  });

  const clusters = useMemo(() => buildClusters(places, zoom), [places, zoom]);

  return (
    <>
      {clusters.map((cluster, idx) => {
        if (cluster.items.length === 1) {
          const place = cluster.items[0];
          const meta = CATEGORY_META[place.category];
          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={pinIcon(meta.color, meta.glyph, {
                highlighted: place.id === hoveredId,
                delayMs: Math.min(idx, 16) * 40,
              })}
              eventHandlers={{
                mouseover: () => onHoverPlace(place.id),
                mouseout: () => onHoverPlace(null),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p
                    className="font-semibold"
                    style={{ color: meta.color, fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.06em" }}
                  >
                    {labels[place.category]}
                  </p>
                  <p className="text-foreground font-medium mt-0.5">{place.name}</p>
                </div>
              </Popup>
            </Marker>
          );
        }
        return (
          <Marker
            key={`cluster-${idx}`}
            position={[cluster.lat, cluster.lng]}
            icon={clusterIcon(cluster.items.length)}
            eventHandlers={{
              click: () => {
                map.flyTo([cluster.lat, cluster.lng], Math.min(map.getZoom() + 2, 18), { duration: 0.9 });
              },
            }}
          />
        );
      })}
    </>
  );
}

export default function PetMap({ onBack, userCity = "Panama City", petName = "tu mascota" }: PetMapProps) {
  const { t } = useLanguage();
  const locations = getCityLocations(userCity);
  const home: [number, number] = [locations.parks[0]?.lat ?? 8.98, locations.parks[0]?.lng ?? -79.52];

  const [tracking, setTracking] = useState<TrackingUpdate | null>(null);
  const [walkStarted, setWalkStarted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  const labels = useMemo<Record<CategoryKey, string>>(
    () => ({
      veterinarians: t("map.veterinarians"),
      parks: t("map.parks"),
      groomers: t("map.groomers"),
      petStores: "Tiendas de mascotas",
      shelters: "Refugios y adopcion",
      emergencyClinics: "Emergencias 24h",
    }),
    [t]
  );

  const allPlaces = useMemo<PlaceEntry[]>(
    () => CATEGORY_ORDER.flatMap((cat) => locations[cat].map((p, i): PlaceEntry => ({ ...p, id: `${cat}-${i}`, category: cat }))),
    [locations]
  );

  const filteredPlaces = useMemo(
    () => (activeCategory ? allPlaces.filter((p) => p.category === activeCategory) : allPlaces),
    [allPlaces, activeCategory]
  );

  const bounds = useMemo(() => L.latLngBounds(allPlaces.map((p): [number, number] => [p.lat, p.lng])), [allPlaces]);

  const handleSelectPlace = useCallback((place: PlaceEntry) => {
    setSelectedId(place.id);
    setFlyTarget({ lat: place.lat, lng: place.lng, zoom: 16 });
  }, []);

  const beginWalk = useCallback(async () => {
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
  }, [locations, petName, home]);

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
    <div className="atmos min-h-screen bg-background" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* Animaciones y ajustes de Leaflet propios de esta pagina: entrada
          escalonada de pines/clusters y anillo pulsante del paseo en vivo.
          No toca index.css, vive solo en este componente. */}
      <style>{`
        @keyframes pn-marker-in {
          from { opacity: 0; transform: translate3d(0, 10px, 0) scale(0.6); }
          to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        .pn-marker { animation: pn-marker-in 480ms cubic-bezier(0.32, 0.72, 0, 1) both; transform-origin: 50% 100%; }
        .pn-cluster { animation: pn-marker-in 480ms cubic-bezier(0.32, 0.72, 0, 1) both; transform-origin: 50% 50%; }

        @keyframes pn-pulse {
          0%   { transform: scale(0.6); opacity: 0.55; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        .pn-live-ring {
          position: absolute; inset: 0; border-radius: 9999px;
          border: 2px solid ${BRAND_CYAN};
          animation: pn-pulse 1.8s ease-out infinite;
        }

        .leaflet-popup-content-wrapper, .leaflet-popup-tip { border-radius: 0.75rem; }
        .dark .leaflet-popup-content-wrapper, .dark .leaflet-popup-tip {
          background: #241c33;
          color: #f4f2f8;
        }

        @media (prefers-reduced-motion: reduce) {
          .pn-marker, .pn-cluster { animation: none !important; opacity: 1 !important; transform: none !important; }
          .pn-live-ring { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver">
            <ArrowLeft size={22} />
          </Button>
          <h1 className="text-title bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent" style={{ letterSpacing: "-0.01em" }}>
            {t("map.title")}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="bezel rise mb-6">
          <div className="bezel-core p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full shrink-0"
                style={{ background: `color-mix(in oklab, ${BRAND_CYAN} 16%, transparent)` }}
              >
                <span
                  className="block h-2.5 w-2.5 rounded-full"
                  style={{
                    background: BRAND_CYAN,
                    boxShadow: walkStarted ? `0 0 0 4px color-mix(in oklab, ${BRAND_CYAN} 25%, transparent)` : "none",
                  }}
                />
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  {tracking ? `${tracking.walkerName} en camino con ${petName}` : `Sin paseos activos para ${petName}`}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock size={14} />
                  {tracking
                    ? tracking.arrived
                      ? "Llegaron al parque"
                      : `Llega en ~${Math.ceil(tracking.etaSeconds / 60)} min`
                    : "Inicia un paseo simulado en tiempo real"}
                </p>
              </div>
            </div>
            {!walkStarted && (
              <Button onClick={beginWalk} className="gap-2 press">
                <Navigation size={16} /> Iniciar paseo (demo en vivo)
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6 rise rise-1">
          Este boton simula un paseo. Para GPS real, la app/dispositivo del paseador debe enviar su posicion a{" "}
          <code className="bg-muted px-1 rounded">POST /api/tracking/{"{petId}"}/update</code> con{" "}
          <code className="bg-muted px-1 rounded">{"{ lat, lng }"}</code> — el mapa la mostrara automaticamente en vez de la simulacion.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rise rise-2">
            <div className="bezel h-96 md:h-[600px]">
              <div className="bezel-core h-full overflow-hidden">
                <MapContainer bounds={bounds} boundsOptions={{ padding: [32, 32] }} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                  {/* Base satelital de Esri: sin token ni cuenta, a diferencia de
                      Mapbox o Google. Encima va una capa de etiquetas para que se
                      lean calles y lugares sobre la foto aerea. El usuario pidio
                      satelital explicitamente; con muchos mas lugares que antes,
                      el agrupamiento por zoom evita que se amontonen los pines
                      encima de la imagen. */}
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

                  <FlyToController target={flyTarget} />
                  <ClusterLayer places={filteredPlaces} hoveredId={hoveredId} onHoverPlace={setHoveredId} labels={labels} />

                  {tracking && (
                    <>
                      <Marker position={[tracking.lat, tracking.lng]} icon={buddyIcon()}>
                        <Popup>
                          <div className="text-sm">
                            <p className="text-foreground font-medium">{tracking.walkerName}</p>
                            <p className="text-muted-foreground text-xs">{Math.round(tracking.progress * 100)}% del recorrido</p>
                          </div>
                        </Popup>
                      </Marker>
                      <Polyline positions={[home, [tracking.lat, tracking.lng]]} pathOptions={{ color: BRAND_PURPLE_LIGHT, dashArray: "6 8" }} />
                    </>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>

          <div className="rise rise-3">
            <div className="bezel h-full">
              <div className="bezel-core h-full p-4 md:p-5 flex flex-col" style={{ maxHeight: 600 }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="eyebrow">Lugares cercanos</span>
                  <span className="text-xs text-muted-foreground">
                    {filteredPlaces.length} resultado{filteredPlaces.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                      "text-xs font-medium px-2.5 py-1.5 rounded-full border spatial press",
                      activeCategory === null
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                    )}
                  >
                    Todos
                  </button>
                  {CATEGORY_ORDER.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(active ? null : cat)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium pl-1.5 pr-2.5 py-1 rounded-full border spatial press",
                          !active && "bg-transparent text-muted-foreground border-border hover:bg-accent"
                        )}
                        style={
                          active
                            ? {
                                background: `color-mix(in oklab, ${meta.color} 16%, transparent)`,
                                color: meta.color,
                                borderColor: `color-mix(in oklab, ${meta.color} 35%, transparent)`,
                              }
                            : undefined
                        }
                      >
                        <GlyphSwatch glyph={meta.glyph} color={meta.color} size={16} />
                        {labels[cat]}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                  {filteredPlaces.map((place) => {
                    const meta = CATEGORY_META[place.category];
                    const isActive = place.id === hoveredId || place.id === selectedId;
                    return (
                      <button
                        key={place.id}
                        onMouseEnter={() => setHoveredId(place.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onFocus={() => setHoveredId(place.id)}
                        onBlur={() => setHoveredId(null)}
                        onClick={() => handleSelectPlace(place)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 p-2.5 rounded-lg border border-transparent spatial press",
                          isActive ? "bg-accent" : "bg-transparent hover:bg-accent/60"
                        )}
                      >
                        <GlyphSwatch glyph={meta.glyph} color={meta.color} size={26} />
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground truncate">{place.name}</span>
                          <span className="block text-xs text-muted-foreground">{labels[place.category]}</span>
                        </span>
                      </button>
                    );
                  })}
                  {filteredPlaces.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No hay lugares para este filtro.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
