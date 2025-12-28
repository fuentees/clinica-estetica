import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClipboardList, Heart, Smile, User, Loader2, Save, Sparkles, 
  CheckCircle2, Scissors, ChevronRight, Scale, Syringe, 
  AlertTriangle, X
} from "lucide-react";

import { supabase } from "../../../lib/supabase"; 
import { Button } from "../../../components/ui/button";
import { AnamnesisAIService } from '../../../services/anamnesisAIService';

// --- IMPORTAÇÕES DAS ABAS MODULARES ---
import { anamnesisSchema, AnamnesisFormValues } from "./schema";
import { TabQueixa } from "./tabs/TabQueixa";
import { TabSaude } from "./tabs/TabSaude";
import { TabFacial } from "./tabs/TabFacial";
import { TabCorporal } from "./tabs/TabCorporal";
import { TabCapilar } from "./tabs/TabCapilar";
import { TabBioimpedancia } from "./tabs/TabBioimpedancia";
import { TabInjetaveis } from "./tabs/TabInjetaveis";

// Utils de conversão
const strToArray = (s: any) => typeof s === 'string' ? s.split("; ").map((v:string) => v.trim()).filter(Boolean) : (Array.isArray(s) ? s : []);
const arrayToStr = (a: any) => (Array.isArray(a) ? a.join("; ") : a);

const PremiumTabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button type="button" onClick={onClick} className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${active ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 scale-105' : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-gray-100'}`}>
        <Icon size={18} className={active ? "text-rose-400" : ""} />
        {label}
        {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-500 rounded-full"></span>}
    </button>
);

export default function PatientAnamnesisPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"queixa" | "saude" | "facial" | "corporal" | "bio" | "capilar" | "injectables">("queixa");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const methods = useForm<AnamnesisFormValues>({
    resolver: zodResolver(anamnesisSchema),
    defaultValues: { body_mapping: [], queixa_principal: [], doencas_cronicas: [], facial_baumann: [], corporal_adipometria_dados: {}, corporal_perimetria_dados: {} }
  });

  // --- CARREGAR DADOS ---
  useEffect(() => {
    async function fetchAnamnesis() {
      if (!id) return;
      try {
        const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
        if (error) throw error;
        
        const f = { ...data };
        
        // 1. Campos que são Arrays no Front e Strings no Banco
        const arrayFields = [
            "doencas_cronicas", "alergias_medicamentosas", "queixa_principal", "procedimentos_previos", 
            "facial_lesoes", "facial_patologias", "facial_discromias", "facial_envelhecimento", 
            "corporal_postura", "corporal_lipodistrofia", "corporal_estrias", "corporal_flacidez_tipo", 
            "facial_telangiectasias_local", "facial_discromias_local", "facial_rugas_local", 
            "corporal_gordura_local", "corporal_celulite_local", "corporal_estrias_local", "corporal_flacidez_local", 
            "capilar_displasias_congenitas", "capilar_displasias_adquiridas", "capilar_alopecia_areata", 
            "facial_baumann",
            // Novos campos da Queixa e Outros
            "locais_gordura", "locais_flacidez_corporal", "locais_flacidez_facial", "locais_celulite",
            "locais_manchas", "locais_acne", "locais_estrias", "rotina_skincare"
        ];
        arrayFields.forEach(k => { f[k] = strToArray(data[k]) });

        // 2. Lógica Booleana e JSONs
        f.teve_intercorrencia = data.intercorrencias_previas && data.intercorrencias_previas !== "Não" ? "true" : "false";
        if (f.teve_intercorrencia === "true") f.intercorrencias_detalhes = data.intercorrencias_previas;
        f.pratica_atividade = data.pratica_atividade ? "true" : "false";
        f.ingere_agua = data.ingere_agua ? "true" : "false";
        f.tem_telangiectasias = data.tem_telangiectasias ? "true" : "false";
        
        // Assegurar que campos JSON sejam objetos válidos
        if (!f.anamnesis_body_mapping) f.anamnesis_body_mapping = [];
        f.body_mapping = f.anamnesis_body_mapping; // Mapear para o nome usado no form
        
        if (!f.corporal_adipometria_dados) f.corporal_adipometria_dados = {};
        if (!f.corporal_perimetria_dados) f.corporal_perimetria_dados = {};

        // Definir valores no formulário
        Object.keys(f).forEach(k => methods.setValue(k as any, f[k]));
        
        // Forçar atualização do body_mapping especificamente
        methods.setValue('body_mapping', f.body_mapping);

      } catch (e) { 
          console.error("Erro ao carregar dados:", e); 
          toast.error("Erro ao carregar dados."); 
      } finally { 
          setLoading(false); 
      }
    }
    fetchAnamnesis();
  }, [id, methods]);

  // --- SALVAR DADOS ---
  const onSubmitAnamnesis = async (data: any) => {
    setSaving(true);
    console.log("Tentando salvar dados:", data);

    try {
      const payload = {
        // Campos simples (texto, número) são copiados diretamente
        // Note: desestruturamos 'data' para pegar tudo que não for tratado especificamente abaixo
        ...data,
        
        // Converter Arrays -> Strings
        doencas_cronicas: arrayToStr(data.doencas_cronicas),
        alergias_medicamentosas: arrayToStr(data.alergias_medicamentosas),
        queixa_principal: arrayToStr(data.queixa_principal),
        procedimentos_previos: arrayToStr(data.procedimentos_previos),
        facial_lesoes: arrayToStr(data.facial_lesoes),
        facial_patologias: arrayToStr(data.facial_patologias),
        facial_discromias: arrayToStr(data.facial_discromias),
        facial_envelhecimento: arrayToStr(data.facial_envelhecimento),
        corporal_postura: arrayToStr(data.corporal_postura),
        corporal_lipodistrofia: arrayToStr(data.corporal_lipodistrofia),
        corporal_estrias: arrayToStr(data.corporal_estrias),
        corporal_flacidez_tipo: arrayToStr(data.corporal_flacidez_tipo),
        facial_telangiectasias_local: arrayToStr(data.facial_telangiectasias_local),
        facial_discromias_local: arrayToStr(data.facial_discromias_local),
        facial_rugas_local: arrayToStr(data.facial_rugas_local),
        corporal_gordura_local: arrayToStr(data.corporal_gordura_local),
        corporal_celulite_local: arrayToStr(data.corporal_celulite_local),
        corporal_estrias_local: arrayToStr(data.corporal_estrias_local),
        corporal_flacidez_local: arrayToStr(data.corporal_flacidez_local),
        capilar_displasias_congenitas: arrayToStr(data.capilar_displasias_congenitas),
        capilar_displasias_adquiridas: arrayToStr(data.capilar_displasias_adquiridas),
        capilar_alopecia_areata: arrayToStr(data.capilar_alopecia_areata),
        facial_baumann: arrayToStr(data.facial_baumann),
        
        // Novos Campos da Queixa e Rotina (Arrays -> Strings)
        locais_gordura: arrayToStr(data.locais_gordura),
        locais_flacidez_corporal: arrayToStr(data.locais_flacidez_corporal),
        locais_flacidez_facial: arrayToStr(data.locais_flacidez_facial),
        locais_celulite: arrayToStr(data.locais_celulite),
        locais_manchas: arrayToStr(data.locais_manchas),
        locais_acne: arrayToStr(data.locais_acne),
        locais_estrias: arrayToStr(data.locais_estrias),
        rotina_skincare: arrayToStr(data.rotina_skincare),

        // Campos Especiais / Lógica de Negócio
        intercorrencias_previas: data.teve_intercorrencia === "true" ? data.intercorrencias_detalhes : "Não",
        pratica_atividade: data.pratica_atividade === "true",
        ingere_agua: data.ingere_agua === "true",
        tem_telangiectasias: data.tem_telangiectasias === "true",
        
        // Campos JSON
        anamnesis_body_mapping: data.body_mapping || [],
        corporal_adipometria_dados: data.corporal_adipometria_dados || {},
        corporal_perimetria_dados: data.corporal_perimetria_dados || {}
      };

      // Remover campos que não existem no banco ou são auxiliares do formulário
      delete payload.teve_intercorrencia;
      delete payload.intercorrencias_detalhes;
      delete payload.body_mapping; // O banco usa anamnesis_body_mapping

      console.log("Payload enviado ao Supabase:", payload);

      const { error } = await supabase.from("patients").update(payload).eq("id", id);
      
      if (error) {
        console.error("Erro do Supabase:", error);
        throw error;
      }

      toast.success("Prontuário salvo com sucesso!");
      
      if (id) {
          const ai = await AnamnesisAIService.analyzeAnamnesis(id, payload);
          setAiAnalysis(ai);
          if (ai && ai.confidence_score < 80) setShowAiModal(true);
      }

    } catch (e: any) { 
        console.error("Erro no catch:", e); 
        toast.error(`Erro ao salvar: ${e.message || "Verifique o console"}`); 
    } finally { 
        setSaving(false); 
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-rose-600 w-10 h-10"/></div>;

  return (
    <div className="bg-gray-50/50 dark:bg-gray-900 min-h-screen font-sans">
      
      {/* Botão IA */}
      {aiAnalysis && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <button onClick={() => setShowAiModal(true)} className={`group flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl hover:shadow-rose-500/20 transition-all hover:scale-105 border ${aiAnalysis.confidence_score < 80 ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400' : 'bg-white text-gray-900 border-gray-100'}`}>
            <div className={`p-2 rounded-full ${aiAnalysis.confidence_score < 80 ? 'bg-white/20' : 'bg-purple-100'}`}><Sparkles size={20} className={aiAnalysis.confidence_score < 80 ? 'text-white' : 'text-purple-600'} /></div>
            <div className="text-left"><p className="text-[10px] font-bold uppercase opacity-80">Segurança IA</p><p className="text-sm font-bold">{aiAnalysis.confidence_score < 80 ? 'Risco Detectado' : 'Paciente Seguro'}</p></div>
          </button>
        </div>
      )}

      {/* Navegação */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
            <PremiumTabButton active={activeTab==="queixa"} onClick={()=>setActiveTab("queixa")} icon={ClipboardList} label="1. Queixa" />
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0"/>
            <PremiumTabButton active={activeTab==="saude"} onClick={()=>setActiveTab("saude")} icon={Heart} label="2. Saúde" />
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0"/>
            <PremiumTabButton active={activeTab==="facial"} onClick={()=>setActiveTab("facial")} icon={Smile} label="3. Facial" />
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0"/>
            <PremiumTabButton active={activeTab==="corporal"} onClick={()=>setActiveTab("corporal")} icon={User} label="4. Corporal" />
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0"/>
            <PremiumTabButton active={activeTab==="bio"} onClick={()=>setActiveTab("bio")} icon={Scale} label="5. Bio Rápida" />
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0"/>
            <PremiumTabButton active={activeTab==="capilar"} onClick={()=>setActiveTab("capilar")} icon={Scissors} label="6. Capilar" />
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0"/>
            <PremiumTabButton active={activeTab==="injectables"} onClick={()=>setActiveTab("injectables")} icon={Syringe} label="7. Injetáveis" />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 pb-32">
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmitAnamnesis)}>
                {activeTab === "queixa" && <TabQueixa />}
                {activeTab === "saude" && <TabSaude />}
                {activeTab === "facial" && <TabFacial />}
                {activeTab === "corporal" && <TabCorporal />}
                {activeTab === "bio" && <TabBioimpedancia />}
                {activeTab === "capilar" && <TabCapilar />}
                {activeTab === "injectables" && <TabInjetaveis />}
                
                {activeTab !== "injectables" && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8">
                        <Button type="submit" disabled={saving} className="bg-gray-900 hover:bg-black text-white px-8 py-6 rounded-full shadow-2xl hover:shadow-gray-500/30 hover:-translate-y-1 transition-all text-lg font-bold flex items-center gap-3">
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Salvar Alterações
                        </Button>
                    </div>
                )}
            </form>
        </FormProvider>
      </div>

      {/* Modal IA */}
      {showAiModal && aiAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100">
            <div className={`p-8 flex justify-between items-center text-white ${aiAnalysis.confidence_score < 50 ? 'bg-gradient-to-r from-red-500 to-orange-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}>
                <div><h2 className="font-bold text-2xl flex items-center gap-3"><CheckCircle2 className="w-8 h-8"/> Auditoria de Segurança IA</h2><p className="opacity-90 text-sm mt-1">Análise em tempo real de contraindicações e riscos.</p></div>
                <button type="button" onClick={() => setShowAiModal(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <div className="p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900 custom-scrollbar">
                <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Parecer Geral</h3>
                    <p className="text-lg font-medium text-gray-800 dark:text-white leading-relaxed">{aiAnalysis.ai_suggestions}</p>
                </div>
                {aiAnalysis.risk_factors && aiAnalysis.risk_factors.length > 0 && (
                    <div className="space-y-3 mb-8">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Alertas Detectados</h3>
                        {aiAnalysis.risk_factors.map((alert: any, i: number) => (
                            <div key={i} className={`p-4 rounded-xl border-l-4 shadow-sm flex gap-4 items-start bg-white dark:bg-gray-800 ${alert.type === 'danger' ? 'border-red-500' : 'border-amber-500'}`}>
                                <div className={`p-2 rounded-full ${alert.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{alert.type === 'danger' ? <X size={20}/> : <AlertTriangle size={20}/>}</div>
                                <div><h4 className="font-bold text-gray-900 dark:text-white">{alert.title}</h4><p className="text-gray-600 dark:text-gray-300 text-sm">{alert.message}</p></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAiModal(false)} className="h-12 px-6 rounded-xl border-gray-200">Fechar</Button>
                <Button className="bg-gray-900 text-white hover:bg-black h-12 px-6 rounded-xl shadow-lg" onClick={() => window.print()}>Imprimir Laudo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}