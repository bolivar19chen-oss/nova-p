import { useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  PawPrint,
  Syringe,
  Calendar,
  MapPin,
  ArrowRight,
} from "lucide-react";

interface DesinformacionProps {
  onBack: () => void;
}

interface Articulo {
  id: string;
  title: string;
  emoji: string;
  gradient: string;
  body: string;
}

interface Jornada {
  id: string;
  place: string;
  date: string;
  location: string;
  description: string;
}

// Contenido de ejemplo — sin assets reales todavía, se usan placeholders
// con gradiente + emoji hasta que el equipo entregue imágenes definitivas.
const ARTICULOS: Articulo[] = [
  {
    id: "cuidados-basicos",
    title: "Cuidados básicos para tu perro",
    emoji: "🐶",
    gradient: "from-brand-cyan to-brand-purple-light",
    body: "Alimentación balanceada, agua fresca disponible siempre, paseos diarios y visitas periódicas al veterinario son la base del bienestar de tu perro. No olvides mantener al día sus vacunas y desparasitaciones.",
  },
  {
    id: "alimentacion-saludable",
    title: "Alimentación saludable",
    emoji: "🥗",
    gradient: "from-brand-purple to-brand-purple-light",
    body: "Una dieta equilibrada según la edad, tamaño y nivel de actividad de tu mascota previene enfermedades y mejora su calidad de vida. Evita darle comida humana con sal, azúcar o condimentos.",
  },
  {
    id: "importancia-ejercicio",
    title: "La importancia del ejercicio",
    emoji: "🏃",
    gradient: "from-brand-cyan to-brand-purple",
    body: "El ejercicio diario ayuda a controlar el peso, reduce la ansiedad y fortalece el vínculo con tu mascota. Adapta la intensidad y duración a su raza, edad y condición física.",
  },
  {
    id: "entender-mascota",
    title: "Cómo entender a tu mascota",
    emoji: "🐾",
    gradient: "from-brand-purple-light to-brand-cyan",
    body: "El lenguaje corporal, los ladridos, maullidos y la postura de tu mascota comunican mucho sobre cómo se siente. Aprender a leer estas señales fortalece la comunicación y previene problemas de comportamiento.",
  },
  {
    id: "vacunas-esenciales",
    title: "Vacunas esenciales",
    emoji: "💉",
    gradient: "from-brand-red to-brand-purple-light",
    body: "Las vacunas protegen a tu mascota de enfermedades graves y contagiosas. Consulta con tu veterinario el esquema de vacunación adecuado según su especie, edad y estilo de vida.",
  },
  {
    id: "senales-alerta",
    title: "Señales de alerta en mascotas",
    emoji: "⚠️",
    gradient: "from-brand-purple to-brand-cyan",
    body: "Pérdida de apetito, letargo, vómitos frecuentes o cambios bruscos de comportamiento pueden ser señales de que algo no está bien. Ante cualquier duda, consulta a un veterinario cuanto antes.",
  },
];

const JORNADAS: Jornada[] = [
  {
    id: "san-miguelito",
    place: "San Miguelito",
    date: "15 de junio 2026",
    location: "Parque Los Andes",
    description: "Jornada gratuita de vacunación antirrábica y desparasitación para perros y gatos.",
  },
  {
    id: "la-chorrera",
    place: "La Chorrera",
    date: "22 de junio 2026",
    location: "Plaza Central",
    description: "Vacunación general y control veterinario básico sin costo para tu mascota.",
  },
  {
    id: "arraijan",
    place: "Arraiján",
    date: "29 de junio 2026",
    location: "Cancha Municipal",
    description: "Jornada de vacunación antirrábica abierta a toda la comunidad.",
  },
];

export default function Desinformacion({ onBack }: DesinformacionProps) {
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [selectedJornada, setSelectedJornada] = useState<Jornada | null>(null);

  const articulosRef = useRef<HTMLDivElement>(null);
  const jornadasRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Geist', sans-serif" }}>
      <PageHeader onBack={onBack} title="Desinformación" />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
        {/* Fila de botones tab — ahora son botones reales que hacen scroll suave a su bloque */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12 md:mb-16">
          <button
            type="button"
            onClick={() => scrollToSection(articulosRef)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-cyan text-white font-semibold text-sm text-center rounded-full py-3.5 px-5 press spatial hover:opacity-95"
          >
            <PawPrint size={16} strokeWidth={1.25} />
            We Care
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(jornadasRef)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-red text-white font-semibold text-sm text-center rounded-full py-3.5 px-5 press spatial hover:opacity-95"
          >
            <Syringe size={16} strokeWidth={1.25} />
            Jornadas de Vacunación
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
          {/* Bloque izquierdo: articulos */}
          <section ref={articulosRef} className="scroll-mt-24">
            <span className="eyebrow mb-4 w-fit">We Care</span>
            <h2 className="text-title font-bold text-foreground tracking-tight mb-6 flex items-center gap-2.5">
              <PawPrint className="text-brand-cyan shrink-0" size={22} strokeWidth={1.25} />
              Artículos informativos sobre mascotas
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {ARTICULOS.map((articulo, i) => (
                <div
                  key={articulo.id}
                  className="rise h-full"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedArticulo(articulo)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelectedArticulo(articulo);
                    }}
                    className="bezel press spatial h-full cursor-pointer"
                  >
                    <div className="bezel-core overflow-hidden h-full flex flex-col">
                      <div
                        className={`h-24 bg-gradient-to-br ${articulo.gradient} flex items-center justify-center text-4xl shrink-0`}
                      >
                        {articulo.emoji}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="font-semibold text-sm text-foreground leading-snug flex-1">
                          {articulo.title}
                        </p>
                        <button
                          type="button"
                          className="group/btn inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan text-xs font-semibold mt-3 w-fit press spatial"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedArticulo(articulo);
                          }}
                        >
                          Leer más
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-cyan text-white transition-transform duration-300 group-hover/btn:translate-x-0.5">
                            <ArrowRight size={12} strokeWidth={1.25} />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bloque derecho: jornadas de vacunacion */}
          <section ref={jornadasRef} className="scroll-mt-24">
            <span className="eyebrow mb-4 w-fit">Jornadas</span>
            <h2 className="text-title font-bold text-foreground tracking-tight mb-6 flex items-center gap-2.5">
              <Syringe className="text-brand-red shrink-0" size={22} strokeWidth={1.25} />
              Próximas jornadas de vacunación
            </h2>

            <div className="space-y-4 md:space-y-5">
              {JORNADAS.map((jornada, i) => (
                <div
                  key={jornada.id}
                  className="rise"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div className="bezel spatial">
                    <div className="bezel-core border-l-2 border-brand-red/25 p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-full bg-brand-red flex items-center justify-center text-white shrink-0">
                          <Calendar size={18} strokeWidth={1.25} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">
                            Jornada de Vacunación {jornada.place}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                            <Calendar size={14} strokeWidth={1.25} className="text-brand-red shrink-0" /> {jornada.date}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <MapPin size={14} strokeWidth={1.25} className="text-brand-red shrink-0" /> {jornada.location}
                          </p>
                          <button
                            type="button"
                            className="group/btn inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-brand-red text-white text-xs font-semibold mt-4 press spatial"
                            onClick={() => setSelectedJornada(jornada)}
                          >
                            Ver detalles
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 transition-transform duration-300 group-hover/btn:translate-x-0.5">
                              <ArrowRight size={12} strokeWidth={1.25} />
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Dialog detalle de articulo */}
      <Dialog open={!!selectedArticulo} onOpenChange={(open) => !open && setSelectedArticulo(null)}>
        <DialogContent>
          {selectedArticulo && (
            <>
              <div
                className={`h-32 -mx-6 -mt-6 mb-2 rounded-t-lg bg-gradient-to-br ${selectedArticulo.gradient} flex items-center justify-center text-6xl`}
              >
                {selectedArticulo.emoji}
              </div>
              <DialogHeader>
                <DialogTitle>{selectedArticulo.title}</DialogTitle>
                <DialogDescription className="text-muted-foreground leading-relaxed pt-2">
                  {selectedArticulo.body}
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog detalle de jornada */}
      <Dialog open={!!selectedJornada} onOpenChange={(open) => !open && setSelectedJornada(null)}>
        <DialogContent>
          {selectedJornada && (
            <DialogHeader>
              <DialogTitle>Jornada de Vacunación {selectedJornada.place}</DialogTitle>
              <DialogDescription asChild>
                <div className="text-muted-foreground leading-relaxed pt-2 space-y-2">
                  <p className="flex items-center gap-2">
                    <Calendar size={16} strokeWidth={1.25} className="text-brand-red shrink-0" /> {selectedJornada.date}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={16} strokeWidth={1.25} className="text-brand-red shrink-0" /> {selectedJornada.location}
                  </p>
                  <p>{selectedJornada.description}</p>
                </div>
              </DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
