import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";

interface InfoSiteProps {
  onBack: () => void;
}

interface Article {
  id: string;
  title: string;
  summary: string;
  body: string;
}

// Contenido de ejemplo — estructura pensada para agregar más artículos
// fácilmente cuando el equipo entregue el contenido definitivo.
const ARTICLES: Article[] = [
  {
    id: "vomito",
    title: "¿Por qué mi mascota vomita después de comer?",
    summary: "Causas comunes y cuándo preocuparse.",
    body: "Puede deberse a comer muy rápido, cambios de dieta o intolerancias. Si el vómito es frecuente, tiene sangre o va acompañado de letargo, consulta a un veterinario cuanto antes. Recomendación general: dividir la comida en porciones más pequeñas y evitar cambios bruscos de alimento.",
  },
  {
    id: "rascado",
    title: "Mi mascota se rasca mucho, ¿qué puede ser?",
    summary: "Alergias, pulgas y otras causas frecuentes.",
    body: "El rascado excesivo suele estar relacionado con pulgas, alergias alimentarias o ambientales, o piel seca. Revisa el pelaje en busca de parásitos y mantén al día la desparasitación externa. Si persiste, es momento de una consulta veterinaria.",
  },
  {
    id: "letargo",
    title: "Mi mascota está más quieta de lo normal",
    summary: "Cuándo el cansancio es normal y cuándo no.",
    body: "Un poco de sueño extra después de jugar es normal. Pero si el letargo dura varios días, viene con pérdida de apetito o fiebre, puede indicar un problema de salud que requiere atención veterinaria.",
  },
];

export default function InfoSite({ onBack }: InfoSiteProps) {
  const [selected, setSelected] = useState<Article | null>(null);

  if (selected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Geist', sans-serif" }}>
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
            <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">{selected.title}</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
          <Card className="p-8 bg-white border-gray-100">
            <p className="text-gray-700 leading-relaxed">{selected.body}</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Geist', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">
            Sitio Informativo de Mascotas
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-4">
        <p className="text-gray-600 mb-2">Situaciones comunes que le pasan a tu mascota, explicadas de forma simple.</p>
        {ARTICLES.map((article) => (
          <Card
            key={article.id}
            className="p-5 bg-white border-gray-100 hover:shadow-md transition cursor-pointer"
            onClick={() => setSelected(article)}
          >
            <div className="flex items-start gap-3">
              <BookOpen className="text-brand-purple shrink-0 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-900">{article.title}</p>
                <p className="text-sm text-gray-600 mt-1">{article.summary}</p>
              </div>
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
}
