import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  onBack: () => void;
  title: string;
  icon?: ReactNode;
}

export default function PageHeader({ onBack, title, icon }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/[0.06]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center gap-4 md:gap-5">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="group bezel press spatial shrink-0"
          style={{ borderRadius: "9999px" }}
        >
          <span
            className="bezel-core flex items-center justify-center w-10 h-10 md:w-11 md:h-11"
            style={{ borderRadius: "9999px" }}
          >
            <ArrowLeft
              size={18}
              strokeWidth={1.25}
              className="text-brand-purple dark:text-brand-purple-light transition-transform duration-300 group-hover:-translate-x-0.5"
            />
          </span>
        </button>

        {icon}

        <div className="min-w-0 flex flex-col gap-1">
          <span className="eyebrow w-fit">Pet Nova</span>
          <h1 className="text-title md:text-headline font-bold text-foreground tracking-tight truncate">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
