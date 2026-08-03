import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserData } from "@/App";
import { getAppointments, getVaccines, getAlerts, clearToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Syringe, AlertCircle, Menu, X, ChevronDown, Plus, ListTodo, Home, User, Info, Users, ShieldAlert, MapPin, Camera, Sun, Moon } from "lucide-react";
import Settings from "./Settings";
import PetMap from "./PetMap";
import SmartCalendar from "./SmartCalendar";
import Community from "./Community";
import ScheduleAppointment from "./ScheduleAppointment";
import ScheduleVaccine from "./ScheduleVaccine";
import CreateAlert from "./CreateAlert";
import ToDo from "./ToDo";
import AlertaPaw from "./AlertaPaw";
import DenunciasAnonimas from "./DenunciasAnonimas";
import Desinformacion from "./Desinformacion";
import PetMoments from "./PetMoments";
import PetHero from "@/components/PetHero";
import Logo from "@/components/Logo";

interface Appointment {
  id: string;
  date: string;
  time: string;
  type: string;
  veterinarian: string;
  notes: string;
}

interface Vaccine {
  id: string;
  name: string;
  date: string;
  nextDue: string;
  veterinarian: string;
}

interface LostPetAlert {
  id: string;
  petName: string;
  date: string;
  location: string;
  description: string;
  contact: string;
  city: string;
}

type PageView =
  | "dashboard"
  | "settings"
  | "map"
  | "calendar"
  | "community"
  | "schedule-appointment"
  | "schedule-vaccine"
  | "create-alert"
  | "todo"
  | "alerta-paw"
  | "denuncias-anonimas"
  | "info-site"
  | "vaccination-days"
  | "pet-moments";

export default function Dashboard({ userData, setUserData }: { userData: UserData; setUserData: (data: UserData | null) => void }) {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [alerts, setAlerts] = useState<LostPetAlert[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageView, setPageView] = useState<PageView>("dashboard");
  const [pendingTasks, setPendingTasks] = useState(0);
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [desinformacionMenuOpen, setDesinformacionMenuOpen] = useState(false);
  const [organizacionMenuOpen, setOrganizacionMenuOpen] = useState(false);
  const homeMenuRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const desinformacionMenuRef = useRef<HTMLDivElement>(null);
  const organizacionMenuRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHoverClose = () => {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
  };
  const scheduleHoverClose = (close: () => void) => {
    cancelHoverClose();
    hoverCloseTimer.current = setTimeout(close, 200);
  };

  const closeAllMenus = () => {
    setHomeMenuOpen(false);
    setActionMenuOpen(false);
    setProfileMenuOpen(false);
    setDesinformacionMenuOpen(false);
    setOrganizacionMenuOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (homeMenuRef.current && !homeMenuRef.current.contains(e.target as Node)) {
        setHomeMenuOpen(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (desinformacionMenuRef.current && !desinformacionMenuRef.current.contains(e.target as Node)) {
        setDesinformacionMenuOpen(false);
      }
      if (organizacionMenuRef.current && !organizacionMenuRef.current.contains(e.target as Node)) {
        setOrganizacionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("petNovaTheme");
    const shouldBeDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", shouldBeDark);
    setIsDark(shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("petNovaTheme", next ? "dark" : "light");
    setIsDark(next);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("petNovaTodos");
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list)) setPendingTasks(list.filter((tsk: { done: boolean }) => !tsk.done).length);
    } catch {
      /* ignore */
    }
  }, [pageView]);

  useEffect(() => {
    (async () => {
      try {
        const [a, v, al] = await Promise.all([getAppointments(), getVaccines(), getAlerts()]);
        if (Array.isArray(a)) setAppointments(a as unknown as Appointment[]);
        if (Array.isArray(v)) setVaccines(v as unknown as Vaccine[]);
        if (Array.isArray(al)) setAlerts(al as unknown as LostPetAlert[]);
      } catch {
        /* backend not reachable */
      }
    })();
  }, []);

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem("petNovaUser");
    setUserData(null);
  };

  const upcomingAppointments = appointments
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 3);

  const pendingVaccines = vaccines.filter(v => new Date(v.nextDue) > new Date()).slice(0, 3);

  // Page Views
  if (pageView === "settings") {
    return <Settings onBack={() => setPageView("dashboard")} userData={userData} setUserData={setUserData} onLogout={handleLogout} />;
  }

  if (pageView === "map") {
    return <PetMap onBack={() => setPageView("dashboard")} userCity={userData.ownerCity} petName={userData.petName} />;
  }

  if (pageView === "calendar") {
    return <SmartCalendar onBack={() => setPageView("dashboard")} petName={userData.petName} />;
  }

  if (pageView === "todo") {
    return <ToDo onBack={() => setPageView("dashboard")} petName={userData.petName} />;
  }

  if (pageView === "community") {
    return <Community onBack={() => setPageView("dashboard")} ownerName={userData.ownerName} city={userData.ownerCity} petName={userData.petName} />;
  }

  if (pageView === "schedule-appointment") {
    return <ScheduleAppointment onBack={() => setPageView("dashboard")} petName={userData.petName} ownerCity={userData.ownerCity} onSuccess={() => { setPageView("dashboard"); toast.success(t("toast.success")); }} />;
  }

  if (pageView === "schedule-vaccine") {
    return <ScheduleVaccine onBack={() => setPageView("dashboard")} petName={userData.petName} ownerCity={userData.ownerCity} onSuccess={() => { setPageView("dashboard"); toast.success(t("toast.success")); }} />;
  }

  if (pageView === "create-alert") {
    return <CreateAlert onBack={() => setPageView("dashboard")} petName={userData.petName} ownerCity={userData.ownerCity} onSuccess={() => { setPageView("dashboard"); toast.success(t("toast.success")); }} />;
  }

  if (pageView === "alerta-paw") {
    return <AlertaPaw onBack={() => setPageView("dashboard")} petName={userData.petName} ownerCity={userData.ownerCity} />;
  }

  if (pageView === "denuncias-anonimas") {
    return <DenunciasAnonimas onBack={() => setPageView("dashboard")} />;
  }

  // We Care y Jornadas de Vacunación son las dos secciones de una sola página
  // (así aparece en el mockup), por eso ambos items del menú abren Desinformacion.
  if (pageView === "info-site" || pageView === "vaccination-days") {
    return <Desinformacion onBack={() => setPageView("dashboard")} />;
  }

  if (pageView === "pet-moments") {
    return <PetMoments onBack={() => setPageView("dashboard")} petName={userData.petName} petPhoto={userData.photo} breed={userData.breed} age={userData.age} />;
  }

  return (
    <div className="atmos min-h-screen bg-background" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Solo el simbolo: el header ya lleva el nombre al lado, y el
                  lema del lockup completo seria ilegible a esta altura. */}
              <Logo variant="mark" size={38} />
              <span className="hidden sm:inline font-bold text-foreground">Pet Nova</span>
            </div>

            {/* Desktop Nav
                Cada item vive en un slot reservado de 60x60 (w-[60px] h-[60px] shrink-0)
                que NUNCA cambia de tamaño: eso es lo que evita que el nav salte.
                El boton real es absolute y centrado (left-1/2 -translate-x-1/2) dentro
                de ese slot, asi su expansion a 180px crece "flotando" por encima de los
                hermanos en vez de empujarlos. La lista vertical cuelga del slot fijo,
                no del boton, asi tampoco se mueve verticalmente al expandir. */}
            {/* gap amplio: al expandirse un boton a 180px necesita aire para no
                tapar a los vecinos. */}
            <nav className="hidden md:flex items-center gap-8 lg:gap-12">
              <div
                className="relative w-[60px] h-[60px] shrink-0"
                ref={homeMenuRef}
                onMouseEnter={() => { cancelHoverClose(); setHomeMenuOpen(true); setActionMenuOpen(false); setDesinformacionMenuOpen(false); setOrganizacionMenuOpen(false); setProfileMenuOpen(false); }}
                onMouseLeave={() => scheduleHoverClose(() => setHomeMenuOpen(false))}
              >
                <button
                  onClick={() => { setPageView("dashboard"); setHomeMenuOpen((v) => !v); setActionMenuOpen(false); setDesinformacionMenuOpen(false); setOrganizacionMenuOpen(false); }}
                  title={t("nav.home")}
                  aria-label={t("nav.home")}
                  className={`group isolate absolute left-1/2 -translate-x-1/2 top-0 z-10 h-[60px] ${homeMenuOpen ? "w-[180px]" : "w-[60px]"} rounded-full bg-card shadow-md overflow-hidden transition-all duration-500 motion-reduce:transition-none`}
                >
                  <span aria-hidden="true" className={`absolute inset-0 -z-20 translate-y-[10px] rounded-full bg-gradient-to-tr from-brand-purple to-brand-cyan blur-[15px] transition-opacity duration-500 motion-reduce:transition-none ${homeMenuOpen ? "opacity-50" : "opacity-0"}`} />
                  <span aria-hidden="true" className={`absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-brand-purple to-brand-cyan transition-opacity duration-500 motion-reduce:transition-none ${homeMenuOpen ? "opacity-100" : "opacity-0"}`} />
                  <Home size={22} strokeWidth={1.25} className={`absolute inset-0 m-auto text-foreground transition-transform duration-500 motion-reduce:transition-none ${homeMenuOpen ? "scale-0" : "scale-100"}`} />
                  <span className={`absolute inset-0 flex items-center justify-center whitespace-nowrap text-xs font-bold uppercase tracking-wide text-white transition-transform duration-500 delay-150 motion-reduce:transition-none motion-reduce:delay-0 ${homeMenuOpen ? "scale-100" : "scale-0"}`}>
                    {t("nav.home")}
                  </span>
                </button>
              </div>

              <div
                className="relative w-[60px] h-[60px] shrink-0"
                ref={actionMenuRef}
                onMouseEnter={() => { cancelHoverClose(); setActionMenuOpen(true); setHomeMenuOpen(false); setDesinformacionMenuOpen(false); setOrganizacionMenuOpen(false); setProfileMenuOpen(false); }}
                onMouseLeave={() => scheduleHoverClose(() => setActionMenuOpen(false))}
              >
                <button
                  onClick={() => { setActionMenuOpen((v) => !v); setHomeMenuOpen(false); setDesinformacionMenuOpen(false); setOrganizacionMenuOpen(false); setProfileMenuOpen(false); }}
                  title={t("nav.action")}
                  aria-label={t("nav.action")}
                  className={`group isolate absolute left-1/2 -translate-x-1/2 top-0 z-10 h-[60px] ${actionMenuOpen ? "w-[180px]" : "w-[60px]"} rounded-full bg-card shadow-md overflow-hidden transition-all duration-500 motion-reduce:transition-none`}
                >
                  <span aria-hidden="true" className={`absolute inset-0 -z-20 translate-y-[10px] rounded-full bg-gradient-to-tr from-brand-purple-light to-brand-cyan blur-[15px] transition-opacity duration-500 motion-reduce:transition-none ${actionMenuOpen ? "opacity-50" : "opacity-0"}`} />
                  <span aria-hidden="true" className={`absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-brand-purple-light to-brand-cyan transition-opacity duration-500 motion-reduce:transition-none ${actionMenuOpen ? "opacity-100" : "opacity-0"}`} />
                  <User size={22} strokeWidth={1.25} className={`absolute inset-0 m-auto text-foreground transition-transform duration-500 motion-reduce:transition-none ${actionMenuOpen ? "scale-0" : "scale-100"}`} />
                  <span className={`absolute inset-0 flex items-center justify-center whitespace-nowrap text-xs font-bold uppercase tracking-wide text-white transition-transform duration-500 delay-150 motion-reduce:transition-none motion-reduce:delay-0 ${actionMenuOpen ? "scale-100" : "scale-0"}`}>
                    {t("nav.action")}
                  </span>
                </button>
                {actionMenuOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 flex flex-col items-center animate-in fade-in-0 slide-in-from-top-1 duration-300 motion-reduce:animate-none">
                    <div className="min-w-[220px] bg-card rounded-lg shadow-lg border border-border py-2 overflow-hidden">
                      <button onClick={() => { setPageView("alerta-paw"); closeAllMenus(); }} className="group/item relative w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-foreground overflow-hidden transition-colors duration-500 hover:text-white">
                        <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-brand-purple-light to-brand-cyan transition-transform duration-500 ease-out group-hover/item:scale-x-100 motion-reduce:transition-none" />
                        <AlertCircle size={16} strokeWidth={1.25} className="relative z-10 shrink-0 transition-transform duration-500 group-hover/item:translate-x-1" />
                        <span className="relative z-10">{t("nav.alertaPaw")}</span>
                      </button>
                      <button onClick={() => { setPageView("denuncias-anonimas"); closeAllMenus(); }} className="group/item relative w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-foreground overflow-hidden transition-colors duration-500 hover:text-white">
                        <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-brand-purple-light to-brand-cyan transition-transform duration-500 ease-out group-hover/item:scale-x-100 motion-reduce:transition-none" />
                        <ShieldAlert size={16} strokeWidth={1.25} className="relative z-10 shrink-0 transition-transform duration-500 group-hover/item:translate-x-1" />
                        <span className="relative z-10">{t("nav.denunciasAnonimas")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative w-[60px] h-[60px] shrink-0"
                ref={desinformacionMenuRef}
                onMouseEnter={() => { cancelHoverClose(); setDesinformacionMenuOpen(true); setHomeMenuOpen(false); setActionMenuOpen(false); setOrganizacionMenuOpen(false); setProfileMenuOpen(false); }}
                onMouseLeave={() => scheduleHoverClose(() => setDesinformacionMenuOpen(false))}
              >
                <button
                  onClick={() => { setDesinformacionMenuOpen((v) => !v); setHomeMenuOpen(false); setActionMenuOpen(false); setOrganizacionMenuOpen(false); setProfileMenuOpen(false); }}
                  title={t("nav.desinformacion")}
                  aria-label={t("nav.desinformacion")}
                  className={`group isolate absolute left-1/2 -translate-x-1/2 top-0 z-10 h-[60px] ${desinformacionMenuOpen ? "w-[180px]" : "w-[60px]"} rounded-full bg-card shadow-md overflow-hidden transition-all duration-500 motion-reduce:transition-none`}
                >
                  <span aria-hidden="true" className={`absolute inset-0 -z-20 translate-y-[10px] rounded-full bg-gradient-to-tr from-brand-cyan to-brand-purple-light blur-[15px] transition-opacity duration-500 motion-reduce:transition-none ${desinformacionMenuOpen ? "opacity-50" : "opacity-0"}`} />
                  <span aria-hidden="true" className={`absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-brand-cyan to-brand-purple-light transition-opacity duration-500 motion-reduce:transition-none ${desinformacionMenuOpen ? "opacity-100" : "opacity-0"}`} />
                  <Info size={22} strokeWidth={1.25} className={`absolute inset-0 m-auto text-foreground transition-transform duration-500 motion-reduce:transition-none ${desinformacionMenuOpen ? "scale-0" : "scale-100"}`} />
                  <span className={`absolute inset-0 flex items-center justify-center whitespace-nowrap text-xs font-bold uppercase tracking-wide text-white transition-transform duration-500 delay-150 motion-reduce:transition-none motion-reduce:delay-0 ${desinformacionMenuOpen ? "scale-100" : "scale-0"}`}>
                    {t("nav.desinformacion")}
                  </span>
                </button>
                {desinformacionMenuOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 flex flex-col items-center animate-in fade-in-0 slide-in-from-top-1 duration-300 motion-reduce:animate-none">
                    <div className="min-w-[220px] bg-card rounded-lg shadow-lg border border-border py-2 overflow-hidden">
                      <button onClick={() => { setPageView("info-site"); closeAllMenus(); }} className="group/item relative w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-foreground overflow-hidden transition-colors duration-500 hover:text-white">
                        <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-brand-cyan to-brand-purple-light transition-transform duration-500 ease-out group-hover/item:scale-x-100 motion-reduce:transition-none" />
                        <Info size={16} strokeWidth={1.25} className="relative z-10 shrink-0 transition-transform duration-500 group-hover/item:translate-x-1" />
                        <span className="relative z-10">{t("nav.infoSite")}</span>
                      </button>
                      <button onClick={() => { setPageView("vaccination-days"); closeAllMenus(); }} className="group/item relative w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-foreground overflow-hidden transition-colors duration-500 hover:text-white">
                        <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-brand-cyan to-brand-purple-light transition-transform duration-500 ease-out group-hover/item:scale-x-100 motion-reduce:transition-none" />
                        <Syringe size={16} strokeWidth={1.25} className="relative z-10 shrink-0 transition-transform duration-500 group-hover/item:translate-x-1" />
                        <span className="relative z-10">{t("nav.vaccinationDays")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative w-[60px] h-[60px] shrink-0"
                ref={organizacionMenuRef}
                onMouseEnter={() => { cancelHoverClose(); setOrganizacionMenuOpen(true); setHomeMenuOpen(false); setActionMenuOpen(false); setDesinformacionMenuOpen(false); setProfileMenuOpen(false); }}
                onMouseLeave={() => scheduleHoverClose(() => setOrganizacionMenuOpen(false))}
              >
                <button
                  onClick={() => { setOrganizacionMenuOpen((v) => !v); setHomeMenuOpen(false); setActionMenuOpen(false); setDesinformacionMenuOpen(false); setProfileMenuOpen(false); }}
                  title={t("nav.desorganizacion")}
                  aria-label={t("nav.desorganizacion")}
                  className={`group isolate absolute left-1/2 -translate-x-1/2 top-0 z-10 h-[60px] ${organizacionMenuOpen ? "w-[180px]" : "w-[60px]"} rounded-full bg-card shadow-md overflow-hidden transition-all duration-500 motion-reduce:transition-none`}
                >
                  <span aria-hidden="true" className={`absolute inset-0 -z-20 translate-y-[10px] rounded-full bg-gradient-to-tr from-brand-purple to-brand-cyan blur-[15px] transition-opacity duration-500 motion-reduce:transition-none ${organizacionMenuOpen ? "opacity-50" : "opacity-0"}`} />
                  <span aria-hidden="true" className={`absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-brand-purple to-brand-cyan transition-opacity duration-500 motion-reduce:transition-none ${organizacionMenuOpen ? "opacity-100" : "opacity-0"}`} />
                  <Users size={22} strokeWidth={1.25} className={`absolute inset-0 m-auto text-foreground transition-transform duration-500 motion-reduce:transition-none ${organizacionMenuOpen ? "scale-0" : "scale-100"}`} />
                  <span className={`absolute inset-0 flex items-center justify-center whitespace-nowrap text-xs font-bold uppercase tracking-wide text-white transition-transform duration-500 delay-150 motion-reduce:transition-none motion-reduce:delay-0 ${organizacionMenuOpen ? "scale-100" : "scale-0"}`}>
                    {t("nav.desorganizacion")}
                  </span>
                </button>
                {organizacionMenuOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 flex flex-col items-center animate-in fade-in-0 slide-in-from-top-1 duration-300 motion-reduce:animate-none">
                    <div className="min-w-[240px] bg-card rounded-lg shadow-lg border border-border py-2 overflow-hidden">
                      <button onClick={() => { setPageView("community"); closeAllMenus(); }} className="group/item relative w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-foreground overflow-hidden transition-colors duration-500 hover:text-white">
                        <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-brand-purple to-brand-cyan transition-transform duration-500 ease-out group-hover/item:scale-x-100 motion-reduce:transition-none" />
                        <Users size={16} strokeWidth={1.25} className="relative z-10 shrink-0 transition-transform duration-500 group-hover/item:translate-x-1" />
                        <span className="relative z-10">{t("nav.myPetCommunity")}</span>
                      </button>
                      <button onClick={() => { setPageView("calendar"); closeAllMenus(); }} className="group/item relative w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-foreground overflow-hidden transition-colors duration-500 hover:text-white">
                        <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-brand-purple to-brand-cyan transition-transform duration-500 ease-out group-hover/item:scale-x-100 motion-reduce:transition-none" />
                        <Calendar size={16} strokeWidth={1.25} className="relative z-10 shrink-0 transition-transform duration-500 group-hover/item:translate-x-1" />
                        <span className="relative z-10">{t("nav.smartCalendar")}</span>
                      </button>
                      <button onClick={() => { setPageView("map"); closeAllMenus(); }} className="group/item relative w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-foreground overflow-hidden transition-colors duration-500 hover:text-white">
                        <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-brand-purple to-brand-cyan transition-transform duration-500 ease-out group-hover/item:scale-x-100 motion-reduce:transition-none" />
                        <MapPin size={16} strokeWidth={1.25} className="relative z-10 shrink-0 transition-transform duration-500 group-hover/item:translate-x-1" />
                        <span className="relative z-10">{t("map.title")}</span>
                      </button>
                      <button onClick={() => { setPageView("pet-moments"); closeAllMenus(); }} className="group/item relative w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-foreground overflow-hidden transition-colors duration-500 hover:text-white">
                        <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-brand-purple to-brand-cyan transition-transform duration-500 ease-out group-hover/item:scale-x-100 motion-reduce:transition-none" />
                        <Camera size={16} strokeWidth={1.25} className="relative z-10 shrink-0 transition-transform duration-500 group-hover/item:translate-x-1" />
                        <span className="relative z-10">{t("nav.petMoments")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Profile */}
            <div className="hidden md:flex items-center gap-3">
              {/* Profile Menu */}
              <div
                className="relative"
                ref={profileMenuRef}
                onMouseEnter={() => { cancelHoverClose(); setProfileMenuOpen(true); setHomeMenuOpen(false); setDesinformacionMenuOpen(false); setOrganizacionMenuOpen(false); setActionMenuOpen(false); }}
                onMouseLeave={() => scheduleHoverClose(() => setProfileMenuOpen(false))}
              >
                <button
                  onClick={() => { setProfileMenuOpen((v) => !v); setHomeMenuOpen(false); setDesinformacionMenuOpen(false); setOrganizacionMenuOpen(false); setActionMenuOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-lg transition"
                >
                  {/* La mascota es la protagonista, no el dueño: si hay foto se
                      muestra la del animal y solo se cae a la inicial si falta. */}
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-brand-purple/25 bg-gradient-to-br from-brand-purple-light to-brand-cyan flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {userData.photo ? (
                      <img src={userData.photo} alt={userData.petName} className="w-full h-full object-cover" />
                    ) : (
                      (userData.petName || userData.ownerName).charAt(0).toUpperCase()
                    )}
                  </div>
                  <ChevronDown size={16} strokeWidth={1.25} className={`transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-2 z-50">
                    <button onClick={() => { setPageView("settings"); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-brand-purple/10 hover:text-brand-purple">
                      {t("nav.settings")}
                    </button>
                    <button onClick={toggleTheme} className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-foreground hover:bg-muted">
                      {isDark ? <Sun size={16} strokeWidth={1.25} /> : <Moon size={16} strokeWidth={1.25} />}
                      {isDark ? t("theme.light") : t("theme.dark")}
                    </button>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
                      {t("nav.logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} strokeWidth={1.25} /> : <Menu size={24} strokeWidth={1.25} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-card p-4 space-y-3 mt-4 animate-in fade-in-0 slide-in-from-top-1 duration-300 motion-reduce:animate-none">
              <Button variant="ghost" size="sm" onClick={() => { setPageView("dashboard"); setMobileMenuOpen(false); }} className="w-full justify-start gap-2">
                <Home size={16} strokeWidth={1.25} /> {t("nav.home")}
              </Button>

              <p className="text-xs font-bold uppercase text-muted-foreground px-2 pt-2 flex items-center gap-1"><User size={12} strokeWidth={1.25} /> {t("nav.action")}</p>
              <Button variant="ghost" size="sm" onClick={() => { setPageView("alerta-paw"); setMobileMenuOpen(false); }} className="w-full justify-start">
                {t("nav.alertaPaw")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setPageView("denuncias-anonimas"); setMobileMenuOpen(false); }} className="w-full justify-start">
                {t("nav.denunciasAnonimas")}
              </Button>

              <p className="text-xs font-bold uppercase text-muted-foreground px-2 pt-2 flex items-center gap-1"><Info size={12} strokeWidth={1.25} /> {t("nav.desinformacion")}</p>
              <Button variant="ghost" size="sm" onClick={() => { setPageView("info-site"); setMobileMenuOpen(false); }} className="w-full justify-start">
                {t("nav.infoSite")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setPageView("vaccination-days"); setMobileMenuOpen(false); }} className="w-full justify-start">
                {t("nav.vaccinationDays")}
              </Button>

              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground px-2 flex items-center gap-1"><Users size={12} strokeWidth={1.25} /> {t("nav.desorganizacion")}</p>
                <Button variant="ghost" size="sm" onClick={() => { setPageView("community"); setMobileMenuOpen(false); }} className="w-full justify-start">
                  {t("nav.myPetCommunity")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setPageView("calendar"); setMobileMenuOpen(false); }} className="w-full justify-start">
                  {t("nav.smartCalendar")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setPageView("map"); setMobileMenuOpen(false); }} className="w-full justify-start">
                  {t("map.title")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setPageView("pet-moments"); setMobileMenuOpen(false); }} className="w-full justify-start">
                  {t("nav.petMoments")}
                </Button>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <Button variant="ghost" size="sm" onClick={() => { setPageView("settings"); setMobileMenuOpen(false); }} className="w-full justify-start">
                  {t("nav.settings")}
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-full justify-start gap-2">
                  {isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? t("theme.light") : t("theme.dark")}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-destructive">
                  {t("nav.logout")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Lo primero que ve el usuario al entrar: su mascota, con parallax al scrollear. */}
      <PetHero
        petName={userData.petName}
        petPhoto={userData.photo}
        breed={userData.breed}
        age={userData.age}
        species={userData.species}
      />

      <main className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className="space-y-16 md:space-y-24">

          {/* Saludo. La identidad de la mascota ya la muestra PetHero arriba,
              así que acá solo va el saludo al dueño, sin tarjeta ni foto repetida.
              Escala de contraste: eyebrow -> text-headline -> cuerpo text-sm. */}
          <section>
            <span className="eyebrow rise">Panel</span>
            <h2 className="text-title sm:text-headline text-foreground mt-4 rise rise-1">
              {t("dashboard.hello")}, {userData.ownerName}!
            </h2>
            <p className="text-sm text-muted-foreground mt-3 rise rise-2">{t("dashboard.welcome")} {userData.petName}'s {t("dashboard.panel")}</p>
          </section>

          {/* Quick Stats. Bento asimetrico: una tarjeta grande de 2 columnas por
              2 filas junto a tarjetas apiladas. En mobile todo colapsa a 1 columna. */}
          <section className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-2 gap-4 md:gap-6">
            <div className="rise rise-1 hover-lift lg:col-span-2 lg:row-span-2">
              <div className="bezel h-full">
                <div className="bezel-core h-full p-6 md:p-8 flex flex-col justify-between gap-8">
                  <div className="flex items-start justify-between">
                    <span className="eyebrow">{t("dashboard.appointments")}</span>
                    <Calendar className="text-brand-purple-light" size={28} strokeWidth={1.25} />
                  </div>
                  <p className="text-display leading-none text-foreground">{appointments.length}</p>
                </div>
              </div>
            </div>

            <div className="rise rise-2 hover-lift">
              <div className="bezel h-full">
                <div className="bezel-core h-full p-5 md:p-6 flex flex-col justify-between gap-6">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">{t("dashboard.vaccines")}</span>
                    <Syringe className="text-brand-cyan" size={22} strokeWidth={1.25} />
                  </div>
                  <p className="text-title text-foreground">{vaccines.length}</p>
                </div>
              </div>
            </div>

            <div className="rise rise-3 hover-lift">
              <div className="bezel h-full">
                <div className="bezel-core h-full p-5 md:p-6 flex flex-col justify-between gap-6">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">{t("dashboard.alerts")}</span>
                    <AlertCircle className="text-brand-red" size={22} strokeWidth={1.25} />
                  </div>
                  <p className="text-title text-foreground">{alerts.length}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPageView("todo")}
              className="rise rise-4 press hover-lift text-left lg:col-span-2"
            >
              <div className="bezel h-full">
                <div className="bezel-core h-full p-5 md:p-6 flex items-center justify-between gap-4">
                  <div>
                    <span className="eyebrow">{t("nav.todo")}</span>
                    <p className="text-title text-foreground mt-3">{pendingTasks}</p>
                  </div>
                  <ListTodo className="text-amber-500 shrink-0" size={26} strokeWidth={1.25} />
                </div>
              </div>
            </button>
          </section>

          {/* Upcoming Appointments */}
          <section>
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <span className="eyebrow">Agenda</span>
                <h3 className="text-title text-foreground mt-3">{t("dashboard.upcomingAppointments")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPageView("schedule-appointment")}
                className="press spatial group relative inline-flex shrink-0 items-center gap-3 rounded-full bg-gradient-to-r from-brand-purple-light to-brand-cyan pl-6 pr-1.5 py-1.5 text-sm font-semibold text-white"
              >
                {t("dashboard.scheduleAppointment")}
                <span className="spatial flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110">
                  <Plus size={16} strokeWidth={1.25} />
                </span>
              </button>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="bezel hover-lift">
                    <div className="bezel-core p-4 md:p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">{apt.type} - {apt.veterinarian}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{apt.date} at {apt.time}</p>
                      </div>
                      <Calendar className="text-brand-purple-light shrink-0" size={22} strokeWidth={1.25} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bezel">
                <div className="bezel-core p-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("dashboard.noAppointments")}</p>
                </div>
              </div>
            )}
          </section>

          {/* Pending Vaccines */}
          <section>
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <span className="eyebrow">Salud</span>
                <h3 className="text-title text-foreground mt-3">{t("dashboard.pendingVaccines")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPageView("schedule-vaccine")}
                className="press spatial group relative inline-flex shrink-0 items-center gap-3 rounded-full bg-gradient-to-r from-brand-purple-light to-brand-cyan pl-6 pr-1.5 py-1.5 text-sm font-semibold text-white"
              >
                {t("dashboard.scheduleVaccine")}
                <span className="spatial flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110">
                  <Plus size={16} strokeWidth={1.25} />
                </span>
              </button>
            </div>
            {pendingVaccines.length > 0 ? (
              <div className="space-y-4">
                {pendingVaccines.map((vac) => (
                  <div key={vac.id} className="bezel hover-lift">
                    <div className="bezel-core p-4 md:p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">{vac.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">Next due: {vac.nextDue}</p>
                      </div>
                      <Syringe className="text-brand-cyan shrink-0" size={22} strokeWidth={1.25} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bezel">
                <div className="bezel-core p-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("dashboard.noVaccines")}</p>
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}

