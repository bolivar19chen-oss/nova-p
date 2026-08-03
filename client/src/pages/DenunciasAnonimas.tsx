import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createAnonymousReport } from "@/lib/api";

interface DenunciasAnonimasProps {
  onBack: () => void;
}

const CATEGORIES = ["Maltrato animal", "Abandono", "Venta ilegal", "Otro"];

export default function DenunciasAnonimas({ onBack }: DenunciasAnonimasProps) {
  const [form, setForm] = useState({ category: CATEGORIES[0], description: "", location: "", city: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      toast.error("Describe la situación antes de enviar");
      return;
    }
    setSubmitting(true);
    try {
      await createAnonymousReport(form);
      setSent(true);
    } catch {
      toast.error("No se pudo enviar la denuncia. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Geist', sans-serif" }}>
      <PageHeader onBack={onBack} title="Denuncias Anónimas" />

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-16 md:py-24">
        {sent ? (
          <div className="rise">
            <div className="bezel spatial">
              <div className="bezel-core p-10 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-brand-purple/10 flex items-center justify-center">
                  <ShieldCheck className="text-brand-purple dark:text-brand-purple-light" size={32} strokeWidth={1.25} />
                </div>
                <h2 className="text-title font-bold text-foreground tracking-tight">Denuncia enviada</h2>
                <p className="text-muted-foreground">Gracias por reportarlo. Tu identidad no se guarda en ningún momento.</p>
                <button
                  type="button"
                  onClick={onBack}
                  className="group/btn inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-foreground text-background text-sm font-semibold mt-2 press spatial"
                >
                  <ArrowLeft size={14} strokeWidth={1.25} />
                  Volver
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {/* Aviso de anonimato — destacado, es lo que da confianza para usar la funcion */}
            <div className="rise">
              <div className="bezel spatial">
                <div className="bezel-core border-l-2 border-brand-purple/30 p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-brand-purple/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="text-brand-purple dark:text-brand-purple-light" size={20} strokeWidth={1.25} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">100% anónimo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      No se solicita ni se guarda tu nombre, correo o cualquier dato que te identifique.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rise rise-1">
              <div className="bezel spatial">
                <div className="bezel-core p-6 md:p-8 space-y-6">
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Tipo de denuncia</Label>
                    <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                      <SelectTrigger className="mt-2 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-foreground">Descripción</Label>
                    <Textarea
                      placeholder="Describe lo que observaste con el mayor detalle posible"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="mt-2 border-border"
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-foreground">Ubicación (opcional)</Label>
                    <Input
                      placeholder="Dirección o punto de referencia"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="mt-2 border-border"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-foreground">Ciudad (opcional)</Label>
                    <Input
                      placeholder="Ciudad"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="mt-2 border-border"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onBack}
                      className="group/btn flex-1 inline-flex items-center justify-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full border border-foreground/15 text-foreground text-sm font-semibold press spatial"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="group/btn flex-1 inline-flex items-center justify-center gap-2 pl-5 pr-1.5 py-1.5 rounded-full bg-gradient-to-r from-brand-purple-light to-brand-cyan text-white text-sm font-semibold press spatial disabled:opacity-50"
                    >
                      {submitting ? "Enviando..." : "Enviar denuncia"}
                      {!submitting && (
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 transition-transform duration-300 group-hover/btn:translate-x-0.5">
                          <ArrowRight size={14} strokeWidth={1.25} />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
