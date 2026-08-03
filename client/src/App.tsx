import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Dashboard from "./pages/Dashboard";
import Registration from "./pages/Registration";
import Login from "./pages/Login";
import { useState, useEffect } from "react";
import { getMe, getToken, clearToken } from "./lib/api";

export interface UserData {
  petName: string;
  species: string;
  age: string;
  breed: string;
  weight: string;
  weightUnit: string;
  photo: string | null;
  vaccinated: string;
  disability: string;
  disabilityDetail: string;
  notes: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCity: string;
  createdAt: string;
}

const STORAGE_KEY = "petNovaUser";

function Router({
  userData,
  setUserData,
  authMode,
  setAuthMode,
}: {
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
  authMode: "login" | "register";
  setAuthMode: (m: "login" | "register") => void;
}) {
  return (
    <Switch>
      <Route
        path={"/"}
        component={() =>
          userData ? (
            <Dashboard userData={userData} setUserData={setUserData} />
          ) : (
            <AuthShell authMode={authMode} setAuthMode={setAuthMode} setUserData={setUserData} />
          )
        }
      />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Login y registro viven en la misma pista horizontal y se deslizan al cambiar
 * de modo, en vez de reemplazarse de golpe.
 *
 * La idea viene de un componente de referencia que el usuario compartio, pero su
 * implementacion no se copio: aquella usaba transiciones de 1.8s a 2s con
 * ease-in-out y movia clases con document.querySelector, peleando contra React.
 * Aca el desplazamiento sale del estado, dura 800ms y usa la curva del sistema,
 * que tiene masa. Dos segundos para cambiar de modo se sienten lentos, no caros.
 */
function AuthShell({
  authMode,
  setAuthMode,
  setUserData,
}: {
  authMode: "login" | "register";
  setAuthMode: (m: "login" | "register") => void;
  setUserData: (u: UserData) => void;
}) {
  const isRegister = authMode === "register";

  return (
    <div className="relative w-full overflow-x-hidden">
      <div
        className="flex w-[200%] will-change-transform motion-reduce:transition-none"
        style={{
          transform: isRegister ? "translate3d(-50%, 0, 0)" : "translate3d(0, 0, 0)",
          transition: "transform 800ms var(--ease-spatial)",
        }}
      >
        {/* Cada panel ocupa la mitad de la pista, o sea el ancho completo de la
            pantalla. aria-hidden e inert evitan que el panel oculto reciba foco
            con el tabulador mientras esta fuera de vista. */}
        <div className="w-1/2 shrink-0" aria-hidden={isRegister} {...(isRegister ? { inert: "" as unknown as boolean } : {})}>
          <Login setUserData={setUserData} goToRegister={() => setAuthMode("register")} />
        </div>
        <div className="w-1/2 shrink-0" aria-hidden={!isRegister} {...(!isRegister ? { inert: "" as unknown as boolean } : {})}>
          <Registration setUserData={setUserData} goToLogin={() => setAuthMode("login")} />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [checkingSession, setCheckingSession] = useState(true);
  const [userData, setUserDataState] = useState<UserData | null>(null);

  const setUserData = (data: UserData | null) => {
    setUserDataState(data);
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else localStorage.removeItem(STORAGE_KEY);
  };

  // Restore session on load: if there's a saved token, confirm with the
  // backend it's still valid before trusting the cached profile.
  useEffect(() => {
    (async () => {
      const token = getToken();
      const cached = localStorage.getItem(STORAGE_KEY);
      if (token) {
        try {
          await getMe(); // throws if token invalid/expired or backend down
          if (cached) setUserDataState(JSON.parse(cached));
        } catch {
          clearToken();
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setCheckingSession(false);
    })();
  }, []);

  if (checkingSession) return null;

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router userData={userData} setUserData={setUserData} authMode={authMode} setAuthMode={setAuthMode} />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
