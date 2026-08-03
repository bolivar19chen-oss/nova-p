import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { PawPrint, CalendarDays, Dna } from "lucide-react";

interface PetHeroProps {
  petName: string;
  petPhoto: string | null;
  breed: string;
  age: string;
  species?: string;
}

export default function PetHero({
  petName,
  petPhoto,
  breed,
  age,
  species,
}: PetHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Parallax speeds from back to front — slowest background, fastest
  // foreground, mirroring the yPercent 70 / 55 / 40 / 10 reference stack.
  // When the user prefers reduced motion, every range collapses to a
  // single value so the layers render but never move.
  const bgY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ["0%", "0%"] : ["0%", "10%"]
  );
  const photoY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ["0%", "0%"] : ["0%", "-16%"]
  );
  const titleY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ["0%", "0%"] : ["0%", "-26%"]
  );
  const frontY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ["0%", "0%"] : ["0%", "-40%"]
  );

  const initial = petName?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="relative w-full">
      {/* HERO */}
      <div
        ref={heroRef}
        className="relative h-[50vh] min-h-[360px] max-h-[540px] w-full overflow-hidden rounded-b-[2.5rem] bg-brand-purple sm:rounded-b-[3rem]"
      >
        {/* Layer 1 — background, slowest */}
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 z-0 bg-gradient-to-br from-brand-purple via-[#6b53a8] to-brand-cyan"
        >
          <div className="absolute -left-16 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl sm:h-72 sm:w-72" />
          <div className="absolute -right-10 top-1/3 h-44 w-44 rounded-full bg-brand-cyan/30 blur-3xl sm:h-64 sm:w-64" />
          <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        </motion.div>

        {/* Layer 2 — pet photo, medium speed */}
        <motion.div
          style={{ y: photoY }}
          className="absolute inset-0 z-10 flex items-center justify-center pt-4"
        >
          <div className="h-36 w-36 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-white shadow-2xl ring-4 ring-white/40 sm:h-48 sm:w-48 lg:h-56 lg:w-56">
            <div className="flex h-full w-full items-center justify-center">
              {petPhoto ? (
                <img
                  src={petPhoto}
                  alt={petName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold sm:text-6xl lg:text-7xl">
                  {initial}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Layer 3 — name title, faster, overlaps the photo */}
        <motion.div
          style={{ y: titleY }}
          className="absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/45 via-black/10 to-transparent pb-6 pt-16 sm:pb-8 sm:pt-24"
        >
          <h1 className="max-w-[90%] truncate px-4 text-center text-headline sm:text-display font-bold text-white drop-shadow-md">
            {petName}
          </h1>
        </motion.div>

        {/* Layer 4 — decorative foreground, fastest */}
        <motion.div
          style={{ y: frontY }}
          className="pointer-events-none absolute inset-0 z-30"
        >
          <PawPrint
            className="absolute right-6 top-8 h-6 w-6 text-white/25 sm:right-10 sm:top-10 sm:h-8 sm:w-8"
            strokeWidth={1.25}
          />
          <PawPrint
            className="absolute left-8 top-16 h-4 w-4 rotate-[-20deg] text-white/20 sm:left-14 sm:top-20 sm:h-5 sm:w-5"
            strokeWidth={1.25}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent sm:h-20" />
        </motion.div>
      </div>

      {/* INFO CARD — visually part of the same block, overlapping the fade.
          Doble bisel en vez de borde plano + shadow-xl generico. */}
      <div className="relative z-10 -mt-8 px-4 sm:-mt-10 sm:px-6">
        <div className="mx-auto max-w-3xl bezel rise">
          <div className="bezel-core grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 sm:gap-4 sm:p-7">
            <InfoStat icon={PawPrint} label="Raza" value={breed} />
            <InfoStat icon={CalendarDays} label="Edad" value={age} />
            {species ? (
              <InfoStat icon={Dna} label="Especie" value={species} />
            ) : (
              <InfoStat icon={Dna} label="Especie" value="-" className="hidden sm:flex" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoStat({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: typeof PawPrint;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-1.5 text-center ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-white">
        <Icon className="h-4 w-4" strokeWidth={1.25} />
      </div>
      <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
