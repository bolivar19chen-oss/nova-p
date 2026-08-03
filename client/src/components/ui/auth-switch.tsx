import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export interface AuthSwitchProps {
  value: "login" | "register";
  onChange: (v: "login" | "register") => void;
  className?: string;
}

export function AuthSwitch({ value, onChange, className }: AuthSwitchProps) {
  const { t } = useLanguage();
  const OPTIONS: { value: "login" | "register"; label: string }[] = [
    { value: "login", label: t("authSwitch.login") },
    { value: "register", label: t("authSwitch.register") },
  ];
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = OPTIONS.findIndex((option) => option.value === value);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const dir = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (activeIndex + dir + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[nextIndex].value);
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={t("authSwitch.ariaLabel")}
      className={cn(
        "relative inline-flex w-full items-center rounded-full bg-muted p-1",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-gradient-to-r from-brand-purple-light to-brand-cyan shadow-sm transition-transform spatial"
        style={{ transform: activeIndex === 1 ? "translateX(100%)" : "translateX(0%)" }}
      />
      {OPTIONS.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "press relative z-10 flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
              selected ? "text-white" : "text-muted-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default AuthSwitch;
