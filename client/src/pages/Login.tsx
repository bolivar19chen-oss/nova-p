import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { loginAccount, setToken } from "@/lib/api";
import { UserData } from "@/App";
import Logo from "@/components/Logo";
import { AuthSwitch } from "@/components/ui/auth-switch";
import { ArrowRight } from "lucide-react";

interface LoginProps {
  setUserData: (data: UserData) => void;
  goToRegister: () => void;
}

const fieldClass =
  "mt-2 bg-transparent border-brand-purple/15 dark:border-white/10 focus-visible:border-brand-cyan focus-visible:ring-brand-cyan/30 focus-visible:ring-[3px]";

export default function Login({ setUserData, goToRegister }: LoginProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.includes("@") || password.length < 1) {
      toast.error(t("login.invalidCredentials"));
      return;
    }
    setSubmitting(true);
    try {
      const { token, user } = await loginAccount({ email, password });
      setToken(token);
      const profile = (user.profile || {}) as Partial<UserData>;
      setUserData({
        petName: profile.petName || "",
        species: profile.species || "",
        age: profile.age || "",
        breed: profile.breed || "",
        weight: profile.weight || "",
        weightUnit: profile.weightUnit || "kg",
        photo: profile.photo || null,
        vaccinated: profile.vaccinated || "",
        disability: profile.disability || "no",
        disabilityDetail: profile.disabilityDetail || "",
        notes: profile.notes || "",
        ownerName: user.ownerName,
        ownerEmail: user.email,
        ownerPhone: profile.ownerPhone || "",
        ownerCity: profile.ownerCity || "Panama City",
        createdAt: new Date().toISOString(),
      });
      toast.success(t("login.welcomeToast"));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t("login.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="atmos flex min-h-screen flex-col lg:flex-row" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* Left: editorial brand panel */}
      <div className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:w-1/2 lg:px-20 lg:py-24">
        <Logo variant="full" size={56} className="self-start mb-12 rise rise-1" />
        <span className="eyebrow rise rise-1 self-start">{t("app.subtitle")}</span>
        <h1 className="text-display mt-5 font-bold text-foreground rise rise-2">
          {t("login.welcome")}
        </h1>
        <p className="mt-6 max-w-sm text-sm text-muted-foreground rise rise-3">
          {t("login.subtitle")}
        </p>
      </div>

      {/* Right: form panel, doble bisel */}
      <div className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-16 w-full lg:py-24">
        <div className="bezel spatial w-full max-w-md rise rise-2">
          <div className="bezel-core px-6 py-10 sm:px-10 sm:py-12">
            <AuthSwitch
              value="login"
              onChange={(v) => {
                if (v === "register") goToRegister();
              }}
              className="mb-8"
            />

            <div className="space-y-5">
              <div>
                <Label htmlFor="loginEmail" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("login.email")}
                </Label>
                <Input
                  id="loginEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={fieldClass}
                />
              </div>
              <div>
                <Label htmlFor="loginPassword" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("login.password")}
                </Label>
                <Input
                  id="loginPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={fieldClass}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="rememberPassword" checked={rememberPassword} onCheckedChange={(checked) => setRememberPassword(checked as boolean)} />
                <Label htmlFor="rememberPassword" className="font-normal cursor-pointer text-sm text-muted-foreground">
                  {t("login.rememberPassword")}
                </Label>
              </div>

              <Button
                onClick={handleLogin}
                disabled={submitting}
                className="press spatial group mt-2 flex h-auto w-full items-center justify-between rounded-full bg-gradient-to-r from-brand-purple-light to-brand-cyan pl-7 pr-1.5 py-1.5 text-white hover:from-brand-purple hover:to-brand-cyan disabled:opacity-60"
              >
                <span className="text-sm font-medium">
                  {submitting ? t("login.submitting") : t("login.submit")}
                </span>
                <span className="spatial flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110">
                  <ArrowRight size={18} strokeWidth={1.25} />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
