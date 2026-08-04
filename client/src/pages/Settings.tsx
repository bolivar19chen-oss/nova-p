import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Globe, Moon, Sun, Lock, LogOut, User, Mail, PawPrint, Camera } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, changePassword, resizeImageToBase64 } from "@/lib/api";
import { UserData } from "@/App";

interface SettingsProps {
  onBack: () => void;
  userData: UserData;
  setUserData: (data: UserData) => void;
  onLogout: () => void;
}

type Language = "en" | "es";

export default function Settings({ onBack, userData, setUserData, onLogout }: SettingsProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ ownerName: userData.ownerName, ownerPhone: userData.ownerPhone, ownerCity: userData.ownerCity });
  const [savingProfile, setSavingProfile] = useState(false);

  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [emailForm, setEmailForm] = useState(userData.ownerEmail);
  const [savingEmail, setSavingEmail] = useState(false);

  const [editPetOpen, setEditPetOpen] = useState(false);
  const [petForm, setPetForm] = useState({
    petName: userData.petName,
    breed: userData.breed,
    age: userData.age,
    weight: userData.weight,
    weightUnit: userData.weightUnit,
    vaccinated: userData.vaccinated,
    notes: userData.notes,
  });
  const [savingPet, setSavingPet] = useState(false);
  const [petPhotoPreview, setPetPhotoPreview] = useState<string | null>(userData.photo);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    if (passwordForm.new.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword: passwordForm.current, newPassword: passwordForm.new });
      toast.success("Contraseña actualizada");
      setPasswordForm({ current: "", new: "", confirm: "" });
      setChangePasswordOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "No se pudo cambiar la contraseña");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        ownerName: profileForm.ownerName,
        profile: { ownerPhone: profileForm.ownerPhone, ownerCity: profileForm.ownerCity },
      });
      setUserData({ ...userData, ...profileForm });
      toast.success("Perfil actualizado");
      setEditProfileOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "No se pudo guardar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailForm.includes("@")) {
      toast.error("Ingresa un correo válido");
      return;
    }
    setSavingEmail(true);
    try {
      await updateProfile({ email: emailForm });
      setUserData({ ...userData, ownerEmail: emailForm });
      toast.success("Correo actualizado");
      setEditEmailOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "No se pudo actualizar el correo");
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImageToBase64(file)
      .then((dataUrl) => setPetPhotoPreview(dataUrl))
      .catch((err: Error) => toast.error(err.message));
  };

  const handleSavePet = async () => {
    if (!petForm.petName) {
      toast.error("El nombre de tu mascota no puede estar vacío");
      return;
    }
    setSavingPet(true);
    try {
      await updateProfile({ profile: { ...petForm, photo: petPhotoPreview } });
      setUserData({ ...userData, ...petForm, photo: petPhotoPreview });
      toast.success("Información de tu mascota actualizada");
      setEditPetOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "No se pudo guardar la información");
    } finally {
      setSavingPet(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent" style={{ letterSpacing: "-0.01em" }}>
            {t("settings.title")}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        {/* Profile Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("settings.profile")}</h2>

          <Card className="p-6 bg-white border-gray-100 mb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-purple-light to-brand-cyan flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {userData.ownerName ? userData.ownerName.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="text-lg font-semibold text-gray-900">{userData.ownerName || "Sin nombre"}</p>
              </div>
            </div>
            <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white">
                  <User size={18} className="mr-2" />
                  Editar Perfil
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                  <DialogDescription>Actualiza tus datos de contacto</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Tu nombre</Label>
                    <Input
                      value={profileForm.ownerName}
                      onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                      className="mt-2 border-gray-300"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Teléfono</Label>
                    <Input
                      value={profileForm.ownerPhone}
                      onChange={(e) => setProfileForm({ ...profileForm, ownerPhone: e.target.value })}
                      className="mt-2 border-gray-300"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Ciudad</Label>
                    <Input
                      value={profileForm.ownerCity}
                      onChange={(e) => setProfileForm({ ...profileForm, ownerCity: e.target.value })}
                      className="mt-2 border-gray-300"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditProfileOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white">
                    {savingProfile ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>

          {/* Pet info */}
          <Card className="p-6 bg-white border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {petPhotoPreview ? <img src={petPhotoPreview} alt={userData.petName} className="w-full h-full object-cover" /> : <PawPrint className="text-gray-400" size={28} />}
              </div>
              <div>
                <p className="text-sm text-gray-600">Tu mascota</p>
                <p className="text-lg font-semibold text-gray-900">{userData.petName || "Sin nombre"} · {userData.breed || userData.species}</p>
              </div>
            </div>
            <Dialog open={editPetOpen} onOpenChange={setEditPetOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <PawPrint size={18} className="mr-2" />
                  Editar información de tu mascota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar a {userData.petName}</DialogTitle>
                  <DialogDescription>Actualiza el nombre, la foto y los datos de tu mascota</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {petPhotoPreview ? <img src={petPhotoPreview} alt="preview" className="w-full h-full object-cover" /> : <PawPrint className="text-gray-400" size={24} />}
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
                    <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
                      <Camera size={16} className="mr-2" />
                      Cambiar foto
                    </Button>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Nombre</Label>
                    <Input value={petForm.petName} onChange={(e) => setPetForm({ ...petForm, petName: e.target.value })} className="mt-2 border-gray-300" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Raza</Label>
                    <Input value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} className="mt-2 border-gray-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Edad</Label>
                      <Input value={petForm.age} onChange={(e) => setPetForm({ ...petForm, age: e.target.value })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Peso</Label>
                      <div className="flex gap-2 mt-2">
                        <Input value={petForm.weight} onChange={(e) => setPetForm({ ...petForm, weight: e.target.value })} className="border-gray-300" />
                        <Select value={petForm.weightUnit} onValueChange={(v) => setPetForm({ ...petForm, weightUnit: v })}>
                          <SelectTrigger className="w-20 border-gray-300"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="lb">lb</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Vacunación</Label>
                    <Select value={petForm.vaccinated} onValueChange={(v) => setPetForm({ ...petForm, vaccinated: v })}>
                      <SelectTrigger className="mt-2 border-gray-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Vacunado</SelectItem>
                        <SelectItem value="partial">Parcialmente vacunado</SelectItem>
                        <SelectItem value="no">Sin vacunar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Notas</Label>
                    <Textarea value={petForm.notes} onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })} className="mt-2 border-gray-300" rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditPetOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSavePet} disabled={savingPet} className="bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white">
                    {savingPet ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>

        {/* Account Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("settings.account")}</h2>

          {/* Email */}
          <Card className="p-6 bg-white border-gray-100 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-purple/10 to-brand-purple/5 flex items-center justify-center">
                  <Mail className="text-brand-purple" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t("settings.email")}</h3>
                  <p className="text-sm text-gray-600">{userData.ownerEmail}</p>
                </div>
              </div>
              <Dialog open={editEmailOpen} onOpenChange={(open) => { setEditEmailOpen(open); if (open) setEmailForm(userData.ownerEmail); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Cambiar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cambiar correo</DialogTitle>
                  </DialogHeader>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Nuevo correo</Label>
                    <Input type="email" value={emailForm} onChange={(e) => setEmailForm(e.target.value)} className="mt-2 border-gray-300" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditEmailOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveEmail} disabled={savingEmail} className="bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white">
                      {savingEmail ? "Guardando..." : "Guardar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          {/* Password */}
          <Card className="p-6 bg-white border-gray-100 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-cyan/10 to-brand-cyan/5 flex items-center justify-center">
                  <Lock className="text-brand-cyan" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t("settings.password")}</h3>
                  <p className="text-sm text-gray-600">••••••••</p>
                </div>
              </div>
              <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Cambiar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cambiar contraseña</DialogTitle>
                    <DialogDescription>Ingresa tu contraseña actual y la nueva</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Contraseña actual</Label>
                      <Input
                        type="password"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        className="mt-2 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Nueva contraseña</Label>
                      <Input
                        type="password"
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                        className="mt-2 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Confirmar nueva contraseña</Label>
                      <Input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="mt-2 border-gray-300"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancelar</Button>
                    <Button onClick={handleChangePassword} disabled={savingPassword} className="bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white">
                      {savingPassword ? "Guardando..." : "Cambiar Contraseña"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </div>

        {/* Preferences Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("settings.preferences")}</h2>

          {/* Language */}
          <Card className="p-6 bg-white border-gray-100 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-brand-cyan/10 flex items-center justify-center">
                  <Globe className="text-brand-cyan" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t("settings.language")}</h3>
                  <p className="text-sm text-gray-600">Elige tu idioma preferido</p>
                </div>
              </div>
              <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <SelectTrigger className="w-40 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Theme */}
          <Card className="p-6 bg-white border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  {theme === "dark" ? (
                    <Moon className="text-orange-600" size={24} />
                  ) : (
                    <Sun className="text-amber-600" size={24} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t("settings.theme")}</h3>
                  <p className="text-sm text-gray-600">Actual: {theme === "dark" ? "Oscuro" : "Claro"}</p>
                </div>
              </div>
              <Button onClick={toggleTheme} variant="outline" className="gap-2">
                {theme === "dark" ? (
                  <>
                    <Sun size={18} />
                    Claro
                  </>
                ) : (
                  <>
                    <Moon size={18} />
                    Oscuro
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* About Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("settings.about")}</h2>

          <Card className="p-6 bg-white border-gray-100">
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>Pet Nova v1.0</strong>
              </p>
              <p>
                Pet Nova es una plataforma integral de cuidado de mascotas para gestionar citas, vacunas y conectar con la comunidad.
              </p>
              <p className="text-sm">© 2026 Pet Nova. Todos los derechos reservados.</p>
            </div>
          </Card>
        </div>

        {/* Logout Button */}
        <div className="mb-8">
          <Button variant="destructive" className="w-full gap-2 bg-red-600 hover:bg-red-700" onClick={onLogout}>
            <LogOut size={18} />
            {t("nav.logout")}
          </Button>
        </div>
      </main>
    </div>
  );
}
