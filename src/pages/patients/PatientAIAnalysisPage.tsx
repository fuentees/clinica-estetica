import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  BrainCircuit, 
  Syringe,
  MapPin,
  Printer,
  Sparkles,
  Sun,
  Moon,
  Droplets,
  Zap,
  Info
} from "lucide-react"; 
import { supabase } from "../../lib/supabase";
import { AnamnesisAIService, ComprehensiveAnamnesisData } from "../../services/anamnesisAIService";
import { Button } from "../../components/ui/button";

// --- MOTOR DE HOMECARE INTELIGENTE (ORIGINAL INTEGRAL) ---
function generateHomecare(data: ComprehensiveAnamnesisData) {
  const routine = { morning: [] as string[], night: [] as string[], actives: [] as string[] };
  const queixas = (data.queixa_principal || []).join(' ').toLowerCase();

  // 1. Limpeza Baseada no Biotipo
  if (data.biotipo_cutaneo === 'Oleosa' || data.facial_acne_grau) {
    routine.morning.push("Gel de Limpeza com Ácido Salicílico 2%");
    routine.night.push("Gel de Limpeza Purificante (Oil Control)");
    routine.actives.push("Ácido Salicílico");
  } else if (data.biotipo_cutaneo === 'Seca' || data.pele_sensivel) {
    routine.morning.push("Loção de Limpeza Hidratante (Sem Sulfatos)");
    routine.night.push("Leite de Limpeza Suave");
  } else {
    routine.morning.push("Sabonete Líquido Facial Neutro");
    routine.night.push("Sabonete Líquido Facial Neutro");
  }

  // 2. Tratamentos Específicos (Ativos Originais)
  if (queixas.includes('mancha') || queixas.includes('melasma')) {
    routine.morning.push("Sérum Vitamina C 15% + Phloretin");
    routine.night.push("Complexo Clareador (Ác. Tranexâmico + Kójico)");
    routine.actives.push("Vitamina C", "Ác. Tranexâmico");
  }
  
  if (queixas.includes('rugas') || queixas.includes('envelhecimento') || data.class_glogau === 'III') {
    routine.morning.push("Sérum de Peptídeos Tensores");
    if (!data.gestante) {
      routine.night.push("Retinol 0.3% ou Ácido Glicólico");
      routine.actives.push("Retinol");
    } else {
      routine.night.push("Bakuchiol (Alternativa Segura ao Retinol)");
      routine.actives.push("Bakuchiol");
    }
  }

  // 3. Hidratação e Fotoproteção
  if (data.biotipo_cutaneo === 'Oleosa') {
    routine.morning.push("Filtro Solar Fluido Toque Seco FPS 60");
    routine.night.push("Gel-Creme com Niacinamida");
    routine.actives.push("Niacinamida");
  } else {
    routine.morning.push("Protetor Solar Cremoso Hidratante FPS 50");
    routine.night.push("Creme Barreira com Ceramidas");
    routine.actives.push("Ceramidas");
  }

  return routine;
}

export function PatientAIAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [homecare, setHomecare] = useState<any>(null);
  const [fullData, setFullData] = useState<ComprehensiveAnamnesisData | null>(null);

  useEffect(() => {
    if (id) runFullAnalysis();
  }, [id]);

  async function runFullAnalysis() {
    try {
      setLoading(true);
      const { data: patient, error: patientError } = await supabase.from("patients").select("*").eq("id", id).single();
      if (patientError) throw patientError;
      setPatientName(patient.first_name + " " + (patient.last_name || ""));

      const { data: plans } = await supabase.from("injectable_plans").select("*").eq("patient_id", id).order("date", { ascending: false }).limit(1);
      const latestPlan = plans?.[0] || null;

      const strToArray = (s: any) => (typeof s === 'string' ? s.split("; ").filter(Boolean) : (Array.isArray(s) ? s : []));

      // Objeto integral com todos os seus campos para análise da IA
      const constructedData: ComprehensiveAnamnesisData = {
        ...patient,
        doencas_cronicas: strToArray(patient.doencas_cronicas),
        alergias_medicamentosas: strToArray(patient.alergias_medicamentosas),
        queixa_principal: strToArray(patient.queixa_principal),
        facial_lesoes: strToArray(patient.facial_lesoes),
        facial_patologias: strToArray(patient.facial_patologias),
        // Preservando campos booleanos e strings cruciais para o parecer
        gestante: patient.gestante,
        lactante: patient.lactante,
        uso_retinoide: patient.uso_retinoide,
        biotipo_cutaneo: patient.biotipo_cutaneo,
        facial_fitzpatrick: patient.facial_fitzpatrick,
        current_plan: latestPlan ? { products: latestPlan.products, areas: latestPlan.areas } : undefined
      };

      setFullData(constructedData);
      const result = await AnamnesisAIService.analyzeAnamnesis(id!, constructedData);
      setAnalysis(result);
      setHomecare(generateHomecare(constructedData));
    } catch (e) { 
      console.error("Erro na análise clínica:", e); 
    } finally { 
      setLoading(false); 
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 bg-white dark:bg-gray-950">
      <div className="relative">
        <div className="absolute inset-0 bg-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <BrainCircuit className="w-20 h-20 text-pink-600 relative z-10 animate-bounce" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Auditoria IA em Execução</h2>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">Validando anamnese e riscos de intercorrência...</p>
      </div>
    </div>
  );

  if (!analysis) return <div className="p-20 text-center font-bold text-gray-400 uppercase">Não foi possível carregar a análise clínica.</div>;

  const scoreColor = analysis.confidence_score < 50 ? 'text-red-600' : analysis.confidence_score < 80 ? 'text-amber-500' : 'text-emerald-500';
  const scoreBg = analysis.confidence_score < 50 ? 'bg-red-50 border-red-100' : analysis.confidence_score < 80 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100';

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      
      {/* 1. HEADER (DADOS ORIGINAIS INTEGRADOS) */}
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={40} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest">Protocolo de Segurança v2.0</span>
              <Sparkles size={12} className="text-pink-500 animate-pulse"/>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic">{patientName}</h1>
            
            {/* Informações Clínicas do fullData (Aproveitando campos originais) */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {fullData?.biotipo_cutaneo && (
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                  <Droplets size={12} className="text-blue-500"/>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">Pele {fullData.biotipo_cutaneo}</span>
                </div>
              )}
              {/* Casting para evitar erro de propriedade inexistente no TS */}
              {(fullData as any)?.facial_fitzpatrick && (
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                  <Sun size={12} className="text-amber-500"/>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">Fitzpatrick {(fullData as any).facial_fitzpatrick}</span>
                </div>
              )}
              {fullData?.idade && (
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">{fullData.idade} Anos</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10">
          <div className={`px-8 py-4 rounded-[2rem] border-2 ${scoreBg} text-right min-w-[220px]`}>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status de Segurança</p>
            <p className={`text-5xl font-black ${scoreColor} tracking-tighter`}>{analysis.confidence_score}%</p>
            <p className={`text-[10px] font-black uppercase mt-1 ${scoreColor}`}>
              {analysis.confidence_score < 70 ? 'Risco Clínico Detectado' : 'Paciente Apto'}
            </p>
          </div>
          <Button onClick={() => window.print()} className="h-14 px-8 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold uppercase text-xs tracking-widest shadow-xl">
            <Printer size={18} className="mr-2"/> Imprimir Laudo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* COLUNA ESQUERDA (RISCOS E MAPA) */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 uppercase text-sm tracking-widest">
              <AlertTriangle className="text-red-500" size={20} /> Fatores Contraditórios
            </h2>
            
            {analysis.risk_factors.length === 0 ? (
              <div className="p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 text-center space-y-4">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto"/>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Anamnese de Baixo Risco</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analysis.risk_factors.map((risk: any, i: number) => (
                  <div key={i} className={`p-5 rounded-2xl border-l-4 flex gap-4 transition-all hover:translate-x-1 ${
                    risk.type === 'danger' ? 'bg-red-50 border-red-500 text-red-900' : 'bg-amber-50 border-amber-500 text-amber-900'
                  }`}>
                    <div className="mt-1">{risk.type === 'danger' ? <X size={18}/> : <AlertTriangle size={18}/>}</div>
                    <div>
                      <h4 className="font-black text-[10px] uppercase tracking-tight mb-1">{risk.title}</h4>
                      <p className="text-xs font-medium opacity-80 leading-relaxed">{risk.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={120}/></div>
            <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-4">Parecer Final IA</h3>
            <p className="text-lg font-medium leading-relaxed italic opacity-90">"{analysis.ai_suggestions}"</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <MapPin size={14} className="text-pink-500"/> Zonas Relevantes
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.bodyMapAnalysis?.map((area: string, i: number) => (
                <span key={i} className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase border border-gray-100 dark:border-gray-700">{area}</span>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (PLANOS E HOMECARE) */}
        <div className="xl:col-span-2 space-y-8">
          {/* TRATAMENTOS CLÍNICOS */}
          <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-black text-2xl text-gray-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                <Syringe className="text-pink-600" size={32} /> Planejamento Sugerido
              </h2>
              <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-900/20 px-4 py-2 rounded-full border border-pink-100 dark:border-pink-900/40">
                <Info size={14} className="text-pink-600"/>
                <span className="text-[10px] font-black text-pink-700 dark:text-pink-400 uppercase tracking-widest">Algoritmo de Atendimento</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {analysis.suggested_treatments.map((t: any, idx: number) => (
                <div key={idx} className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${
                  t.contraindicated 
                    ? 'bg-gray-50 border-gray-200 opacity-40 grayscale' 
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 hover:border-pink-500 hover:shadow-2xl'
                }`}>
                  <div className="flex justify-between items-start mb-6">
                    <h3 className={`font-black text-xl tracking-tighter italic ${t.contraindicated ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{t.treatmentName}</h3>
                    <div className={`p-2 rounded-xl ${t.contraindicated ? 'bg-gray-200' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-600'}`}>
                      <Sparkles size={20}/>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">{t.reasoning}</p>
                  
                  {!t.contraindicated && t.expectedResults && (
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-pink-600 uppercase tracking-[0.2em]">Metas de Resultado</p>
                      <div className="flex flex-wrap gap-2">
                        {t.expectedResults.map((res: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">#{res}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* HOMECARE (DADOS INTEGRADOS) */}
          <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-12">
              <h2 className="font-black text-2xl text-gray-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                <Droplets className="text-cyan-500" size={32} /> Prescrição Skincare
              </h2>
              <div className="flex gap-2">
                {homecare?.actives.map((act: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-cyan-100">{act}</span>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 relative">
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-700"></div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 text-amber-500 mb-8 bg-amber-50 dark:bg-amber-900/20 w-fit px-4 py-2 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <Sun size={20} />
                  <span className="font-black text-xs uppercase tracking-widest">Protocolo Manhã</span>
                </div>
                {homecare?.morning.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-black text-[10px] flex-shrink-0">{i+1}</div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 pt-1.5">{step}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 text-indigo-500 mb-8 bg-indigo-50 dark:bg-indigo-900/20 w-fit px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                  <Moon size={20} />
                  <span className="font-black text-xs uppercase tracking-widest">Protocolo Noite</span>
                </div>
                {homecare?.night.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center font-black text-[10px] flex-shrink-0">{i+1}</div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 pt-1.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}