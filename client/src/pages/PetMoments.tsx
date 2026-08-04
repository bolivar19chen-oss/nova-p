import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/PageHeader";

interface PetMomentsProps {
  onBack: () => void;
  petName: string;
  petPhoto: string | null;
  breed: string;
  age: string;
}

interface Photo {
  id: string;
  emoji: string;
  gradient: string;
  caption?: string;
}

interface Album {
  id: string;
  name: string;
  date: string;
  likes: number;
  /** Color de acento del album. Da variedad cromatica al grid sin saturar. */
  accent: string;
  photos: Photo[];
}

type View = "profile" | "albums" | "album";

// Paleta de gradientes de marca usada como placeholder de fotos —
// no hay assets reales todavía, así que cada "foto" es un degradé + emoji.
const GRADIENTS = [
  "from-brand-purple to-brand-cyan",
  "from-brand-cyan to-brand-purple-light",
  "from-brand-purple-light to-brand-red",
  "from-brand-red to-brand-purple",
  "from-brand-purple to-brand-purple-light",
  "from-brand-cyan to-brand-purple",
];

function makePhotos(emojis: string[], captions: string[]): Photo[] {
  return emojis.map((emoji, i) => ({
    id: `${emoji}-${i}`,
    emoji,
    gradient: GRADIENTS[i % GRADIENTS.length],
    caption: captions[i],
  }));
}

// Un usuario nuevo arranca SIN albumes: ve el estado vacio y sube los suyos.
// Los de abajo quedan como referencia de la forma del dato para cuando exista
// backend de albumes; no se muestran.
const SAMPLE_ALBUMS: Album[] = [];

const _EJEMPLO_DE_FORMA: Album[] = [
  {
    id: "1",
    name: "Beach day",
    date: "12/05/2026",
    likes: 128,
    accent: "var(--color-brand-cyan)",
    photos: makePhotos(
      ["🏖️", "🐾", "🌊", "☀️", "🐕", "🐚"],
      ["Arriving at the sand", "Paw prints on the shore", "Watching the sea", "Resting in the sun", "Running happy", "Treasure found"]
    ),
  },
  {
    id: "2",
    name: "Birthday",
    date: "03/02/2026",
    likes: 96,
    accent: "var(--color-brand-purple-light)",
    photos: makePhotos(
      ["🎂", "🎉", "🎁", "🐶"],
      ["Blowing out the candles", "Surprise party", "Opening presents", "The guest of honor"]
    ),
  },
  {
    id: "3",
    name: "Walk in the park",
    date: "20/03/2026",
    likes: 74,
    accent: "#3fb96b",
    photos: makePhotos(
      ["🌳", "🐾", "🍃", "🦴"],
      ["Exploring the trail", "New paw prints", "Among the leaves", "A well-earned treat"]
    ),
  },
  {
    id: "4",
    name: "The first days",
    date: "14/01/2026",
    likes: 212,
    accent: "#f0a132",
    photos: makePhotos(
      ["🍼", "😴", "🧸", "🐕"],
      ["Just home", "First nap", "New stuffed friend", "Growing up happy"]
    ),
  },
];

// Rotaciones/offsets fijos para el efecto "pila de polaroids desparramadas"
// en los tiles del grid de álbumes.
const STACK_TRANSFORMS = [
  { rotate: -10, x: -22, y: 8 },
  { rotate: 7, x: 18, y: -12 },
  { rotate: -4, x: 2, y: 16 },
  { rotate: 12, x: 26, y: 2 },
];

const POLAROID_ROTATIONS = [-7, 5, -3, 8];

const CURSIVE_FONT = "'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive";

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// El scrapbook (hoja fisica de papel color crema, polaroids, cinta y stickers)
// es intencionalmente fijo y no reacciona al tema. No se toca.
function Polaroid({ photo, rotate, className }: { photo: Photo; rotate: number; className?: string }) {
  return (
    <div
      className={`absolute bg-white p-1.5 pb-4 sm:p-2 sm:pb-5 rounded-sm shadow-xl ${className ?? ""}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* cinta adhesiva simulada */}
      <div
        className="absolute -top-2.5 left-1/2 w-12 h-5 bg-yellow-100/80 border border-yellow-200/70 shadow-sm"
        style={{ transform: "translateX(-50%) rotate(-4deg)" }}
      />
      <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br ${photo.gradient} flex items-center justify-center text-2xl sm:text-3xl md:text-4xl`}>
        {photo.emoji}
      </div>
      {photo.caption && (
        <p className="text-center text-[10px] text-gray-500 mt-1 max-w-[5rem] sm:max-w-[6rem] md:max-w-[7rem]" style={{ fontFamily: CURSIVE_FONT }}>
          {photo.caption}
        </p>
      )}
    </div>
  );
}

export default function PetMoments({ onBack, petName, petPhoto, breed, age }: PetMomentsProps) {
  const { t } = useLanguage();
  const [view, setView] = useState<View>("profile");
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const activeAlbum = SAMPLE_ALBUMS.find((a) => a.id === activeAlbumId) ?? null;
  // 2 fotos por hoja física: en desktop se muestran dos hojas como spread
  // (izq = pages[pageIndex], der = pages[pageIndex + 1]); en mobile sólo
  // se ve la hoja izq y las flechas avanzan de a una.
  const pages = activeAlbum ? chunk(activeAlbum.photos, 2) : [];
  const leftPhotos = pages[pageIndex] ?? [];
  const rightPhotos = pages[pageIndex + 1] ?? [];

  const recentThumbnails = SAMPLE_ALBUMS.flatMap((a) => a.photos).slice(0, 6);

  const openAlbum = (albumId: string) => {
    setActiveAlbumId(albumId);
    setPageIndex(0);
    setView("album");
  };

  const goToAlbumsGrid = () => {
    setActiveAlbumId(null);
    setView("albums");
  };

  // El header retrocede un nivel a la vez (album -> grid -> perfil) y sólo
  // llama a onBack cuando ya estamos en la vista raíz, siguiendo el patrón
  // de CreateAlert.tsx pero adaptado a la navegación en tres pasos.
  const handleHeaderBack = () => {
    if (view === "album") goToAlbumsGrid();
    else if (view === "albums") setView("profile");
    else onBack();
  };

  const prevPage = () => setPageIndex((p) => Math.max(0, p - 1));
  const nextPage = () => setPageIndex((p) => Math.min(pages.length - 1, p + 1));

  const headerTitle = view === "album" && activeAlbum ? activeAlbum.name : "Pet Moments";

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Geist', sans-serif" }}>
      <PageHeader onBack={handleHeaderBack} title={headerTitle} />

      {/* VISTA 1 — Perfil */}
      {view === "profile" && (
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="flex flex-col items-center text-center gap-2 rise">
            <div className="bezel spatial" style={{ borderRadius: "9999px" }}>
              <div
                className="bezel-core w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden flex items-center justify-center"
                style={{ borderRadius: "9999px" }}
              >
                {petPhoto ? (
                  <img src={petPhoto} alt={petName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-white text-4xl font-bold">
                    {petName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <h2 className="text-title sm:text-headline font-bold text-foreground tracking-tight">{petName}</h2>
              <Heart size={20} strokeWidth={1.25} className="text-brand-red fill-brand-red shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground">{breed}</p>
            <p className="text-sm text-muted-foreground">{age} {t("petMoments.age")}</p>
          </div>

          <div className="flex justify-center gap-10 mt-10 py-5 border-y border-foreground/10 rise rise-1">
            <Stat value={28} label={t("petMoments.statMoments")} />
            <Stat value={156} label={t("petMoments.statLikes")} />
            <Stat value={32} label={t("petMoments.statFollowers")} />
          </div>

          <div className="mt-10 rise rise-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground tracking-tight">{t("petMoments.recentMoments")}</h3>
              <button
                onClick={() => setView("albums")}
                className="flex items-center gap-1 text-sm font-medium text-brand-purple dark:text-brand-purple-light hover:opacity-80 transition-opacity"
              >
                {t("petMoments.viewAlbums")} <ChevronRight size={16} strokeWidth={1.25} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recentThumbnails.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setView("albums")}
                  className={`aspect-square rounded-2xl bg-gradient-to-br ${photo.gradient} flex items-center justify-center text-3xl press spatial hover:scale-[1.03]`}
                >
                  {photo.emoji}
                </button>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* VISTA 2 — Grid de álbumes */}
      {view === "albums" && (
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <h2 className="text-title font-bold text-foreground tracking-tight">{t("petMoments.myAlbums")}</h2>
            <button
              onClick={() => toast(t("petMoments.toastCreateSoon"))}
              className="group/btn inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-light text-white text-sm font-medium press spatial"
            >
              {t("petMoments.newAlbum")}
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 transition-transform duration-300 group-hover/btn:translate-x-0.5">
                <Plus size={14} strokeWidth={1.25} />
              </span>
            </button>
          </div>

          {SAMPLE_ALBUMS.length === 0 && (
            <div className="bezel spatial rise">
              <div className="bezel-core px-6 py-20 text-center">
                <p className="text-title font-bold tracking-tight text-foreground">{t("petMoments.noAlbumsTitle")}</p>
                <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                  {t("petMoments.createFirstAlbumBefore")} {petName}.
                </p>
                <button
                  onClick={() => toast(t("petMoments.toastCreateUploadSoon"))}
                  className="press spatial group mt-8 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-brand-purple-light to-brand-cyan py-1.5 pl-6 pr-1.5 text-white"
                >
                  <span className="text-sm font-medium">{t("petMoments.createAlbum")}</span>
                  <span className="spatial flex size-9 items-center justify-center rounded-full bg-white/20 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110">
                    <Plus size={16} strokeWidth={1.5} />
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 md:gap-8">
            {SAMPLE_ALBUMS.map((album, i) => (
              <div key={album.id} className="space-y-3 rise" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="bezel spatial">
                  <div className="bezel-core p-2.5 md:p-3">
                    <button
                      onClick={() => openAlbum(album.id)}
                      className="relative w-full aspect-square rounded-2xl bg-brand-purple/5 overflow-hidden press spatial hover:scale-[1.015]"
                    >
                      {album.photos.slice(0, 4).map((photo, i) => {
                        const t = STACK_TRANSFORMS[i % STACK_TRANSFORMS.length];
                        return (
                          <div
                            key={photo.id}
                            className="absolute top-1/2 left-1/2 w-[55%] aspect-[3/4] bg-white p-1.5 rounded-lg shadow-[0_14px_30px_-14px_rgba(82,63,122,0.4)]"
                            style={{
                              transform: `translate(-50%, -50%) rotate(${t.rotate}deg) translate(${t.x}px, ${t.y}px)`,
                              zIndex: i,
                            }}
                          >
                            <div className={`w-full h-full rounded bg-gradient-to-br ${photo.gradient} flex items-center justify-center text-2xl md:text-3xl`}>
                              {photo.emoji}
                            </div>
                          </div>
                        );
                      })}
                    </button>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2 px-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{album.name}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      {/* Los likes en el color de acento del album: aporta variedad
                          cromatica sin saturar, el color aparece en el dato, no en el fondo. */}
                      <span className="inline-flex items-center gap-1 font-medium" style={{ color: album.accent }}>
                        <Heart size={13} strokeWidth={2} className="fill-current" />
                        {album.likes}
                      </span>
                      <span>{album.photos.length} {t("petMoments.photosSuffix")}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toast(`${t("petMoments.optionsForBefore")} "${album.name}" ${t("petMoments.optionsForAfter")}`)}
                    className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`${t("petMoments.optionsForBefore")} ${album.name}`}
                  >
                    <MoreHorizontal size={18} strokeWidth={1.25} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* VISTA 3 — Álbum abierto tipo scrapbook */}
      {view === "album" && activeAlbum && (
        <main className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <button
            onClick={goToAlbumsGrid}
            className="group/btn inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full border border-foreground/15 text-sm font-medium text-foreground press spatial mb-8"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-purple/10 transition-transform duration-300 group-hover/btn:-translate-x-0.5">
              <ArrowLeft size={13} strokeWidth={1.25} className="text-brand-purple dark:text-brand-purple-light" />
            </span>
            {t("petMoments.backToAlbums")}
          </button>

          {/* Marco exterior — doble bisel alrededor de la hoja física.
              La hoja en si (fondo crema, polaroids, cinta, stickers, espiral)
              queda intacta a proposito y no reacciona al tema. */}
          <div className="relative px-6 md:px-10">
            {pages.length > 1 && (
              <>
                <button
                  onClick={prevPage}
                  disabled={pageIndex === 0}
                  className="group absolute left-0 top-1/2 -translate-y-1/2 z-20 bezel press spatial disabled:opacity-40 disabled:pointer-events-none"
                  style={{ borderRadius: "9999px" }}
                  aria-label={t("petMoments.prevPage")}
                >
                  <span className="bezel-core flex items-center justify-center w-10 h-10" style={{ borderRadius: "9999px" }}>
                    <ChevronLeft size={18} strokeWidth={1.25} className="text-brand-purple dark:text-brand-purple-light" />
                  </span>
                </button>
                <button
                  onClick={nextPage}
                  disabled={pageIndex === pages.length - 1}
                  className="group absolute right-0 top-1/2 -translate-y-1/2 z-20 bezel press spatial disabled:opacity-40 disabled:pointer-events-none"
                  style={{ borderRadius: "9999px" }}
                  aria-label={t("petMoments.nextPage")}
                >
                  <span className="bezel-core flex items-center justify-center w-10 h-10" style={{ borderRadius: "9999px" }}>
                    <ChevronRight size={18} strokeWidth={1.25} className="text-brand-purple dark:text-brand-purple-light" />
                  </span>
                </button>
              </>
            )}

            <div className="bezel spatial">
              <div className="bezel-core p-2 sm:p-3 md:p-4">
                {/* --- Hoja física: intocable, decidido a proposito --- */}
                <div className="rounded-[1.75rem] shadow-2xl overflow-hidden relative" style={{ backgroundColor: "#f6ecd8" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 relative">
                    {/* página izquierda */}
                    <div className="relative p-6 md:p-10 min-h-[420px] md:min-h-[500px]">
                      <span className="absolute top-4 left-5 text-2xl">🌸</span>
                      {leftPhotos[0] && (
                        <Polaroid photo={leftPhotos[0]} rotate={POLAROID_ROTATIONS[0]} className="top-10 left-6 md:left-10" />
                      )}
                      {leftPhotos[1] && (
                        <Polaroid photo={leftPhotos[1]} rotate={POLAROID_ROTATIONS[1]} className="bottom-16 right-4 md:right-8" />
                      )}
                      <p
                        className="absolute bottom-4 left-6 text-lg md:text-xl text-brand-purple max-w-[80%]"
                        style={{ fontFamily: CURSIVE_FONT }}
                      >
                        {t("petMoments.soulfulMoments")}
                      </p>
                    </div>

                    {/* página derecha — oculta en mobile, sólo se ve una hoja a la vez */}
                    <div className="hidden md:block relative p-6 md:p-10 min-h-[420px] md:min-h-[500px] md:border-l md:border-black/5">
                      <span className="absolute top-4 right-6 text-lg text-gray-600" style={{ fontFamily: CURSIVE_FONT }}>
                        {activeAlbum.date}
                      </span>
                      {rightPhotos[0] && (
                        <Polaroid photo={rightPhotos[0]} rotate={POLAROID_ROTATIONS[2]} className="top-14 left-4 md:left-8" />
                      )}
                      {rightPhotos[1] && (
                        <Polaroid photo={rightPhotos[1]} rotate={POLAROID_ROTATIONS[3]} className="bottom-14 right-6 md:right-10" />
                      )}
                      <div
                        className="absolute bg-yellow-200 shadow-md p-3 w-24 md:w-28 text-[11px] text-gray-700 leading-snug"
                        style={{ top: 100, right: 14, transform: "rotate(4deg)", fontFamily: CURSIVE_FONT }}
                      >
                        {t("petMoments.happyDayNote")}
                      </div>
                      <span className="absolute bottom-6 left-6 text-xl">💐</span>
                    </div>

                    {/* espiral del cuaderno — sólo visible desde md, en mobile no hay dos hojas que unir */}
                    <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col justify-around py-3 z-10 pointer-events-none">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="w-3.5 h-3.5 rounded-full bg-gray-200 border border-gray-400/60 shadow-inner" />
                      ))}
                    </div>
                  </div>
                </div>
                {/* --- fin hoja física --- */}
              </div>
            </div>
          </div>

          {pages.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-6">
              {pages.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === pageIndex ? "bg-brand-purple" : "bg-foreground/15"}`} />
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
