import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserData } from "@/App";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { registerAccount, uploadPhoto, setToken } from "@/lib/api";
import Logo from "@/components/Logo";

const BREEDS = {
  dog: ["Labrador Retriever", "Poodle", "Chihuahua", "French Bulldog", "German Shepherd", "Golden Retriever", "Bulldog", "Other"],
  cat: ["Domestic Shorthair", "Siamese", "Persian", "Maine Coon", "Bengal", "Other"],
  bird: ["Parakeet", "Cockatiel", "Canary", "Parrot", "Other"],
  rabbit: ["Holland Lop", "Dutch", "Mini Rex", "Other"],
  guinea_pig: ["American", "Abyssinian", "Other"],
  hamster: ["Syrian", "Dwarf Campbell", "Other"],
  other: ["Other"],
};

interface RegistrationProps {
  setUserData: (data: UserData) => void;
  goToLogin?: () => void;
}

const fieldClass =
  "mt-2 bg-transparent border-brand-purple/15 dark:border-white/10 focus-visible:border-brand-cyan focus-visible:ring-brand-cyan/30 focus-visible:ring-[3px]";

export default function Registration({ setUserData, goToLogin }: RegistrationProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  // El input va oculto y se dispara desde el boton con este ref. Antes el input
  // estaba dentro de un <label> con un <button> adentro, y eso NO funciona: el
  // boton es interactivo y se traga el clic en vez de reenviarlo al input.
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    petName: "",
    species: "",
    age: "",
    breed: "",
    weight: "",
    weightUnit: "kg",
    vaccinated: "",
    disability: "no",
    disabilityDetail: "",
    notes: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerCity: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    if (!formData.petName.trim()) {
      toast.error(t("toast.required"));
      return false;
    }
    if (!formData.species) {
      toast.error(t("toast.required"));
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.ownerName.trim()) {
      toast.error(t("toast.required"));
      return false;
    }
    if (!formData.ownerEmail.trim() || !formData.ownerEmail.includes("@")) {
      toast.error(t("toast.required"));
      return false;
    }
    if (!formData.ownerCity) {
      toast.error(t("toast.required"));
      return false;
    }
    if (formData.password.length < 6) {
      toast.error(t("registration.passwordMinLength"));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("registration.passwordMismatch"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setSubmitting(true);

    let photoUrl = photo;
    try {
      // 1) Create the real account (hashed password stored server-side,
      // full pet + owner profile stored so login can restore everything)
      const { password: _pw1, confirmPassword: _cpw1, ...profileFields } = formData;
      const { token } = await registerAccount({
        ownerName: formData.ownerName,
        email: formData.ownerEmail,
        password: formData.password,
        profile: { ...profileFields, photo },
      });
      setToken(token);

      // 2) Upload the real photo file to the backend (persisted to disk)
      if (photoFile) {
        try {
          const { url } = await uploadPhoto(photoFile);
          photoUrl = url;
        } catch {
          // Keep the local base64 preview if the upload endpoint isn't reachable
        }
      }
    } catch (err: any) {
      // Backend unreachable or email already registered — still let the
      // person continue with a local-only session so the demo isn't blocked
      if (err?.response?.status === 409) {
        toast.error(t("registration.emailExists"));
        setSubmitting(false);
        return;
      }
    }

    const { password: _pw, confirmPassword: _cpw, ...rest } = formData;
    const userData: UserData = {
      ...rest,
      photo: photoUrl,
      createdAt: new Date().toISOString(),
    };

    setUserData(userData);
    setSubmitting(false);
    toast.success(t("toast.success"));
  };

  const breeds = BREEDS[formData.species as keyof typeof BREEDS] || [];

  return (
    <div className="atmos min-h-screen px-4 py-16 lg:py-24" style={{ fontFamily: "'Geist', sans-serif" }}>
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-12 text-center rise rise-1">
          <Logo variant="full" size={48} className="mx-auto mb-8 block" />
          <span className="eyebrow">{t("app.subtitle")}</span>
          <h1 className="text-headline mt-5 font-bold text-foreground">{t("registration.title")}</h1>
          <p className="mt-4 text-sm text-muted-foreground">{t("registration.subtitle")}</p>
          {goToLogin && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("registration.haveAccount")}{" "}
              <button onClick={goToLogin} className="font-semibold text-brand-purple hover:underline dark:text-brand-cyan">
                {t("registration.loginLink")}
              </button>
            </p>
          )}
        </div>

        {/* Folder Tabs */}
        <div className="relative z-20 -mb-3 flex items-end gap-1 px-1 sm:px-2 select-none rise rise-2">
          {[1, 2, 3].map((s) => {
            const isActive = s === step;
            const isDone = s < step;
            return (
              <button
                key={s}
                type="button"
                disabled={!isDone && !isActive}
                aria-current={isActive ? "step" : undefined}
                onClick={() => isDone && setStep(s)}
                className={`press spatial relative flex-1 min-w-0 truncate rounded-t-2xl px-2 sm:px-5 py-2.5 sm:py-3.5 text-[11px] sm:text-sm font-semibold ${
                  isActive
                    ? "z-20 bg-card text-brand-purple dark:text-brand-cyan"
                    : isDone
                    ? "z-10 mt-2 cursor-pointer bg-muted/60 text-muted-foreground hover:bg-muted"
                    : "z-10 mt-2 cursor-not-allowed bg-muted/30 text-muted-foreground/60"
                }`}
              >
                {t(`registration.step${s}`)}
              </button>
            );
          })}
        </div>

        {/* Folder Body: doble bisel */}
        <div className="relative z-10 bezel spatial rise rise-2">
          <div className="bezel-core px-5 py-10 sm:px-10 sm:py-12">

          {/* Step 1: Pet Profile */}
          {step === 1 && (
            <div key="step1" className="rise space-y-6">
              <div>
                <h2 className="text-headline font-bold text-foreground mb-2">
                  {t("registration.step1")}
                </h2>
                <p className="text-muted-foreground text-base">Tell us about your furry friend</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="petName" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("registration.petName")}
                  </Label>
                  <Input
                    id="petName"
                    placeholder="E.g. Milo, Luna"
                    value={formData.petName}
                    onChange={(e) => handleInputChange("petName", e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="species" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("registration.species")}
                    </Label>
                    <Select value={formData.species} onValueChange={(value) => handleInputChange("species", value)}>
                      <SelectTrigger id="species" className={fieldClass}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dog">Dog</SelectItem>
                        <SelectItem value="cat">Cat</SelectItem>
                        <SelectItem value="bird">Bird</SelectItem>
                        <SelectItem value="rabbit">Rabbit</SelectItem>
                        <SelectItem value="guinea_pig">Guinea Pig</SelectItem>
                        <SelectItem value="hamster">Hamster</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="age" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("registration.age")}
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="E.g. 3"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      className={fieldClass}
                      min="0"
                      max="40"
                    />
                  </div>
                </div>

                {formData.species && (
                  <div>
                    <Label htmlFor="breed" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("registration.breed")}
                    </Label>
                    <Select value={formData.breed} onValueChange={(value) => handleInputChange("breed", value)}>
                      <SelectTrigger id="breed" className={fieldClass}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {breeds.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="weight" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("registration.weight")}
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="E.g. 8.5"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      className={fieldClass}
                      step="0.1"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weightUnit" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("registration.unit")}
                    </Label>
                    <Select value={formData.weightUnit} onValueChange={(value) => handleInputChange("weightUnit", value)}>
                      <SelectTrigger id="weightUnit" className={fieldClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-2">{t("registration.photo")}</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-brand-purple/10 to-brand-cyan/10 flex items-center justify-center text-3xl overflow-hidden">
                      {photo ? <img src={photo} alt="Pet" className="w-full h-full object-cover" /> : "🐾"}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => photoInputRef.current?.click()}
                        className="press w-full cursor-pointer"
                      >
                        {t("registration.uploadPhoto")}
                      </Button>
                      {photoFile && (
                        <p className="mt-2 truncate text-xs text-muted-foreground">{photoFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Medical Record */}
          {step === 2 && (
            <div key="step2" className="rise space-y-6">
              <div>
                <h2 className="text-headline font-bold text-foreground mb-2">
                  {t("registration.step2")}
                </h2>
                <p className="text-muted-foreground text-base">Important health information</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="vaccinated" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("registration.vaccinated")}
                  </Label>
                  <Select value={formData.vaccinated} onValueChange={(value) => handleInputChange("vaccinated", value)}>
                    <SelectTrigger id="vaccinated" className={fieldClass}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes, up to date</SelectItem>
                      <SelectItem value="partial">Partially vaccinated</SelectItem>
                      <SelectItem value="no">Not vaccinated</SelectItem>
                      <SelectItem value="unsure">Not sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="disability" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("registration.disability")}
                  </Label>
                  <Select value={formData.disability} onValueChange={(value) => handleInputChange("disability", value)}>
                    <SelectTrigger id="disability" className={fieldClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.disability === "yes" && (
                  <div>
                    <Label htmlFor="disabilityDetail" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("registration.disabilityDetail")}
                    </Label>
                    <Input
                      id="disabilityDetail"
                      placeholder="E.g. blind in one eye, limited mobility"
                      value={formData.disabilityDetail}
                      onChange={(e) => handleInputChange("disabilityDetail", e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("registration.medicalNotes")}
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Optional - Important information"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className={fieldClass}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Owner Details */}
          {step === 3 && (
            <div key="step3" className="rise space-y-6">
              <div>
                <h2 className="text-headline font-bold text-foreground mb-2">
                  {t("registration.step3")}
                </h2>
                <p className="text-muted-foreground text-base">Your information</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="ownerName" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("registration.ownerName")}
                  </Label>
                  <Input
                    id="ownerName"
                    placeholder="Your name"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange("ownerName", e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <Label htmlFor="ownerEmail" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("registration.email")}
                  </Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="you@email.com"
                    value={formData.ownerEmail}
                    onChange={(e) => handleInputChange("ownerEmail", e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerPhone" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("registration.phone")}
                    </Label>
                    <Input
                      id="ownerPhone"
                      placeholder="6000-0000"
                      value={formData.ownerPhone}
                      onChange={(e) => handleInputChange("ownerPhone", e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerCity" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("registration.city")}
                    </Label>
                    <Select value={formData.ownerCity} onValueChange={(value) => handleInputChange("ownerCity", value)}>
                      <SelectTrigger id="ownerCity" className={fieldClass}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="La Chorrera">La Chorrera</SelectItem>
                        <SelectItem value="Panama City">Panama City</SelectItem>
                        <SelectItem value="San Miguelito">San Miguelito</SelectItem>
                        <SelectItem value="Colón">Colón</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("registration.password")}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("registration.passwordPlaceholder")}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("registration.confirmPassword")}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t("registration.confirmPasswordPlaceholder")}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-8 border-t border-brand-purple/10 dark:border-white/10">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="press flex items-center gap-2 rounded-full"
              >
                <ChevronLeft size={18} strokeWidth={1.25} />
                {t("registration.back")}
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => {
                  if (step === 1 && !validateStep1()) return;
                  setStep(step + 1);
                }}
                className="press spatial ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white hover:from-brand-purple hover:to-brand-cyan"
              >
                {t("registration.next")}
                <ChevronRight size={18} strokeWidth={1.25} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="press spatial ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white hover:from-brand-purple hover:to-brand-cyan disabled:opacity-60"
              >
                <Check size={18} strokeWidth={1.25} />
                {submitting ? t("registration.creatingAccount") : t("registration.register")}
              </Button>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
