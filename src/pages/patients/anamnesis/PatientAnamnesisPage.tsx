import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClipboardList, Heart, Smile, User, Loader2, Save, Sparkles, 
  CheckCircle2, Scissors, ChevronRight, Scale, Syringe, 
  AlertTriangle, X, Printer, ShieldCheck
} from "lucide-react";

import { supabase } from "../../../lib/supabase"; 
import { Button } from "../../../components/ui/button";
import { AnamnesisAIService } from '../../../services/anamnesisAIService';
import { useAuth } from "../../../contexts/AuthContext"; // Importando AuthContext

// --- IMPORTAÇÕES DAS ABAS MODULARES ---
import { anamnesisSchema, AnamnesisFormValues } from "./schema";
import { TabQueixa } from "./tabs/TabQueixa";
import { TabSaude } from "./tabs/TabSaude";
import { TabFacial } from "./tabs/TabFacial";
import { TabCorporal } from "./tabs/TabCorporal";
import { TabCapilar } from "./tabs/TabCapilar";
import { TabBioimpedancia } from "./tabs/TabBioimpedancia";
import { TabInjetaveis } from "./tabs/TabInjetaveis";

// Utils de higienização de dados
const strToArray = (s: any) => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') return s.split("; ").map(v => v.trim()).filter(Boolean);
  return [];
};

const arrayToStr = (a: any) => {
  if (Array.isArray(a)) return a.filter(Boolean).join("; ");
  return a || "";
};

const PremiumTabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button 
      type="button" 
      onClick={onClick} 
      className={`relative flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
        active 
        ? 'bg-gray-900 text-white shadow-xl shadow-gray-200 dark:shadow-none scale-105 z-10' 
        : 'bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-gray-700'
      }`}
    >
        <Icon size={16} className={active ? "text-pink-500" : ""} />
        {label}
        {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-pink-500 rounded-full"></span>}
    </button>
);

export default function PatientAnamnesisPage() {
  const { id } = useParams();
  const { profile } = useAuth(); // Pega o perfil logado para verificar clinicId
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("queixa");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const methods = useForm<AnamnesisFormValues>({
    resolver: zodResolver(anamnesisSchema),
    defaultValues: { 
      body_mapping: [], 
      queixa_principal: [], 
      doencas_cronicas: [], 
      facial_baumann: [], 
      corporal_adipometria_dados: {}, 
      corporal_perimetria_dados: {} 
    }
  });

  // --- CARREGAR DADOS DO PACIENTE E ANAMNESE ---
  useEffect(() => {
    async function fetchAnamnesis() {
      if (!id || !profile?.clinicId) return; // Garante que temos o ID da clínica

      try {
        const { data, error } = await supabase
            .from("patients")
            .select("*")
            .eq("id", id)
            .eq("clinicId", profile.clinicId) // Segurança: Só carrega se for da mesma clínica
            .single();

        if (error) throw error;
        
        const formData = { ...data };
        
        // Mapeamento de campos que o banco guarda como String e o Front usa como Array
        const arrayFields = [
            "doencas_cronicas", "alergias_medicamentosas", "queixa_principal", "procedimentos_previos", 
            "facial_lesoes", "facial_patologias", "facial_discromias", "facial_envelhecimento", 
            "corporal_postura", "corporal_lipodistrofia", "corporal_estrias", "corporal_flacidez_tipo", 
            "facial_telangiectasias_local", "facial_discromias_local", "facial_rugas_local", 
            "corporal_gordura_local", "corporal_celulite_local", "corporal_estrias_local", "corporal_flacidez_local", 
            "capilar_displasias_congenitas", "capilar_displasias_adquiridas", "capilar_alopecia_areata", 
            "facial_baumann", "locais_gordura", "locais_flacidez_corporal", "locais_flacidez_facial", 
            "locais_celulite", "locais_manchas", "locais_acne", "locais_estrias", "rotina_skincare"
        ];

        arrayFields.forEach(field => {
          // Fallback seguro: se vier null, vira array vazio
          formData[field] = strToArray(data[field] || ""); 
        });

        // Tratamento de tipos específicos e JSON
        formData.tem_telangiectasias = data.tem_telangiectasias ? "true" : "false";
        formData.body_mapping = data.anamnesis_body_mapping || [];
        
        // Garantir que objetos JSON não sejam null
        formData.corporal_adipometria_dados = data.corporal_adipometria_dados || {};
        formData.corporal_perimetria_dados = data.corporal_perimetria_dados || {};

        // Resetar o formulário com os dados higienizados
        methods.reset(formData);

      } catch (e) { 
          console.error("Erro ao carregar anamnese:", e); 
          toast.error("Não foi possível carregar os dados. Verifique sua conexão."); 
      } finally { 
          setLoading(false); 
      }
    }
    fetchAnamnesis();
  }, [id, methods, profile?.clinicId]);

  // --- PERSISTÊNCIA DOS DADOS ---
  const onSubmitAnamnesis = async (data: any) => {
    if (!profile?.clinicId) return;
    setSaving(true);

    try {
      const payload = {
        ...data,
        // Conversão reversa: Array -> String para o Supabase
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => 
            Array.isArray(value) && key !== 'body_mapping' ? [key, arrayToStr(value)] : [key, value]
          )
        ),
        // Mapeamentos específicos
        tem_telangiectasias: data.tem_telangiectasias === "true",
        anamnesis_body_mapping: data.body_mapping || [],
        
        // CORREÇÃO CRÍTICA: updated_at em snake_case
        updated_at: new Date().toISOString() 
      };

      // Limpar campos auxiliares do formulário que não vão para o DB
      delete payload.body_mapping;
      
      // Segurança: Não permitir alterar o ID ou ClinicId via form
      delete payload.id;
      delete payload.clinicId;

      const { error } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", id)
        .eq("clinicId", profile.clinicId); // Segurança dupla

      if (error) throw error;

      toast.success("Prontuário atualizado com sucesso!");
      
      // Acionar IA (Try-Catch silencioso para não travar o fluxo se a IA falhar)
      try {
          const ai = await AnamnesisAIService.analyzeAnamnesis(id!, payload);
          if (ai) {
            setAiAnalysis(ai);
            if (ai.confidence_score < 70) setShowAiModal(true);
          }
      } catch (aiError) {
          console.warn("IA indisponível no momento:", aiError);
      }

    } catch (e: any) { 
        console.error(e);
        toast.error(`Falha ao salvar: ${e.message || "Erro desconhecido"}`); 
    } finally { 
        setSaving(false); 
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-900">
      <Loader2 className="animate-spin text-pink-600" size={40}/>
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Carregando Prontuário...</p>
    </div>
  );

  return (
    <div className="bg-gray-50/50 dark:bg-gray-950 min-h-screen">
      
      {/* HEADER DE NAVEGAÇÃO E INDICADOR IA */}
      <div className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <PremiumTabButton active={activeTab==="queixa"} onClick={()=>setActiveTab("queixa")} icon={ClipboardList} label="Queixa" />
              <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0"/>
              <PremiumTabButton active={activeTab==="saude"} onClick={()=>setActiveTab("saude")} icon={Heart} label="Saúde" />
              <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0"/>
              <PremiumTabButton active={activeTab==="facial"} onClick={()=>setActiveTab("facial")} icon={Smile} label="Facial" />
              <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0"/>
              <PremiumTabButton active={activeTab==="corporal"} onClick={()=>setActiveTab("corporal")} icon={User} label="Corporal" />
              <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0"/>
              <PremiumTabButton active={activeTab==="bio"} onClick={()=>setActiveTab("bio")} icon={Scale} label="Bioimpedância" />
              <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0"/>
              <PremiumTabButton active={activeTab==="capilar"} onClick={()=>setActiveTab("capilar")} icon={Scissors} label="Capilar" />
              <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0"/>
              <PremiumTabButton active={activeTab==="injectables"} onClick={()=>setActiveTab("injectables")} icon={Syringe} label="Injetáveis" />
          </div>

          {aiAnalysis && (
            <button 
              onClick={() => setShowAiModal(true)}
              className={`hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all hover:scale-105 ${
                aiAnalysis.confidence_score < 70 
                ? 'bg-red-50 text-red-600 border-red-100 animate-bounce' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}
            >
              <ShieldCheck size={18} />
              <div className="text-left leading-tight">
                <p className="text-[9px] font-black uppercase">Auditoria IA</p>
                <p className="text-xs font-bold">{aiAnalysis.confidence_score < 70 ? 'Risco Detectado' : 'Paciente Seguro'}</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* CONTEÚDO DINÂMICO */}
      <div className="max-w-[1600px] mx-auto p-6 pb-40">
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmitAnamnesis)}>
                <div className="transition-all duration-500">
                  {activeTab === "queixa" && <TabQueixa />}
                  {activeTab === "saude" && <TabSaude />}
                  {activeTab === "facial" && <TabFacial />}
                  {activeTab === "corporal" && <TabCorporal />}
                  {activeTab === "bio" && <TabBioimpedancia />}
                  {activeTab === "capilar" && <TabCapilar />}
                  {activeTab === "injectables" && <TabInjetaveis />}
                </div>
                
                {/* BOTÃO SALVAR FLUTUANTE */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                    <Button 
                      type="submit" 
                      disabled={saving} 
                      className="bg-gray-900 hover:bg-black text-white px-10 py-7 rounded-[2rem] shadow-2xl hover:-translate-y-1 transition-all text-sm font-black uppercase tracking-[0.2em] flex items-center gap-4"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} className="text-pink-500" />} 
                        {saving ? 'Processando...' : 'Salvar Prontuário'}
                    </Button>
                </div>
            </form>
        </FormProvider>
      </div>

      {/* MODAL DE ANÁLISE IA (AUDITORIA) */}
      {showAiModal && aiAnalysis && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-white/20">
            
            <div className={`p-10 flex justify-between items-center text-white ${aiAnalysis.confidence_score < 60 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                <div>
                  <h2 className="font-black text-3xl flex items-center gap-3 italic tracking-tighter">
                    <ShieldCheck className="w-10 h-10"/> Parecer de Segurança
                  </h2>
                  <p className="opacity-80 text-xs font-bold uppercase tracking-widest mt-2">Análise algorítmica de intercorrências e contraindicações</p>
                </div>
                <button type="button" onClick={() => setShowAiModal(false)} className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors"><X/></button>
            </div>

            <div className="p-10 overflow-y-auto bg-gray-50 dark:bg-gray-900 custom-scrollbar flex-1">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-8">
                    <section>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Sugestão de Conduta</h3>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {aiAnalysis.ai_suggestions}
                      </div>
                    </section>

                    {aiAnalysis.risk_factors?.length > 0 && (
                      <section>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-red-500">Alertas Detectados</h3>
                        <div className="space-y-4">
                          {aiAnalysis.risk_factors.map((risk: any, i: number) => (
                            <div key={i} className="flex gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-red-500 shadow-sm">
                              <AlertTriangle className="text-red-500 flex-shrink-0" size={20}/>
                              <div>
                                <h4 className="font-black text-gray-900 dark:text-white text-sm">{risk.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{risk.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-900 rounded-[2rem] p-8 text-center text-white">
                        <p className="text-[10px] font-black uppercase opacity-50 tracking-widest mb-2">Score de Confiança</p>
                        <div className="text-5xl font-black text-pink-500">{aiAnalysis.confidence_score}%</div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                          <div className="bg-pink-500 h-full transition-all duration-1000" style={{ width: `${aiAnalysis.confidence_score}%` }}></div>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-800/30">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">
                          Este laudo é informativo e não substitui a decisão clínica do profissional responsável.
                        </p>
                    </div>
                  </div>
                </div>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowAiModal(false)} className="h-14 px-8 rounded-2xl font-bold">Revisar Prontuário</Button>
                <Button className="bg-gray-900 text-white h-14 px-8 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2" onClick={() => window.print()}>
                  <Printer size={18}/> Imprimir Auditoria
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}