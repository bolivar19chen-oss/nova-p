import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

// Logo real de la marca, extraido del arte original y exportado con fondo
// transparente. Los cuatro PNG viven en client/public/:
//   pet-nova-logo.png        lockup completo, morado
//   pet-nova-mark.png        solo el perro y el gato, morado
//   pet-nova-logo-white.png  lockup completo, blanco, para fondos oscuros
//   pet-nova-mark-white.png  solo el simbolo, blanco, para fondos oscuros
//
// Son PNG y no SVG porque el arte original que entrego el equipo es un JPG,
// no un vector. Si algun dia aparece el vector, reemplazar estos archivos por
// .svg y actualizar SRC: el resto del componente no cambia.

interface LogoProps {
  /** "mark" = solo el perro y el gato. "full" = simbolo + PET NOVA + lema. */
  variant?: "mark" | "full";
  /** "white" para fondos oscuros, donde el morado no contrasta. */
  tone?: "color" | "white";
  /** Alto en pixeles. El ancho se ajusta solo. */
  size?: number;
  className?: string;
}

const SRC = {
  "mark-color": "/pet-nova-mark.png",
  "mark-white": "/pet-nova-mark-white.png",
  "full-color": "/pet-nova-logo.png",
  "full-white": "/pet-nova-logo-white.png",
} as const;

export default function Logo({
  variant = "full",
  tone = "color",
  size = 40,
  className,
}: LogoProps) {
  const { t } = useLanguage();
  return (
    <img
      src={SRC[`${variant}-${tone}`]}
      alt={t("app.logoAlt")}
      style={{ height: size, width: "auto" }}
      className={cn("inline-block select-none", className)}
    />
  );
}
