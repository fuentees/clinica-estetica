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
  Loader2,
  Printer,
  Sparkles,
  Sun,
  Moon,
  Droplets,
  Flame
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AnamnesisAIService, ComprehensiveAnamnesisData } from "../../services/anamnesisAIService";
import { Button } from "../../components/ui/button";

// --- HELPERS PARA HOMECARE DINÂMICO ---
function generateHomecare(data: ComprehensiveAnamnesisData) {
  const routine = {
    morning: [] as string[],
    night: [] as string[],
    actives: [] as string[]
  };

  // Limpeza
  if (data.biotipo_cutaneo === 'Oleosa' || data.facial_acne_grau) {
    routine.morning.push("Gel de Limpeza com Ácido Salicílico");
    routine.night.push("Gel de Limpeza Controle de Oleosidade");
  } else if (data.biotipo_cutaneo === 'Seca' || data.pele_sensivel) {
    routine.morning.push("Espuma de Limpeza Suave (Sem Sabão)");
    routine.night.push("Leite de Limpeza ou Água Micelar Bifásica");
  } else {
    routine.morning.push("Sabonete Líquido Neutro");
    routine.night.push("Sabonete Líquido Neutro");
  }

  // Tratamento (Séruns)
  const queixas = (data.queixa_principal || []).join(' ').toLowerCase();
  
  if (queixas.includes('mancha') || queixas.includes('melasma')) {
    routine.morning.push("Sérum Vitamina C 10% + Ferúlico");
    routine.night.push("Ácido Tranexâmico ou Kójico");
    routine.actives.push("Vitamina C", "Ácido Tranexâmico");
  }
  
  if (queixas.includes('rugas') || queixas.includes('envelhecimento') || data.class_glogau === 'III' || data.class_glogau === 'IV') {
    if (!data.gestante) routine.night.push("Retinol ou Ácido Glicólico (Alternado)");
    routine.morning.push("Sérum Ácido Hialurônico + Peptídeos");
    routine.actives.push("Retinol", "Peptídeos", "Hialurônico");
  }

  if (queixas.includes('acne') || data.biotipo_cutaneo === 'Oleosa') {
    routine.night.push("Sérum Niacinamida ou Ácido Mandélico");
    routine.actives.push("Niacinamida", "Zinco");
  }

  // Hidratação e Proteção
  if (data.biotipo_cutaneo === 'Oleosa') {
    routine.morning.push("Hidratante Gel-Creme (Toque Seco)");
    routine.morning.push("Protetor Solar Fluid FPS 50+ (Oil Control)");
  } else {
    routine.morning.push("Hidratante Reparador Intensivo");
    routine.morning.push("Protetor Solar Hidratante FPS 50+");
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
    if (id) {
      runFullAnalysis();
    }
  }, [id]);

  async function runFullAnalysis() {
    try {
      setLoading(true);

      // 1. Buscar Dados do Paciente (Anamnese)
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (patientError) throw patientError;
      setPatientName(patient.name);

      // 2. Buscar Último Planejamento de Injetáveis (Se houver)
      const { data: plans } = await supabase
        .from("injectable_plans")
        .select("*")
        .eq("patient_id", id)
        .order("date", { ascending: false })
        .limit(1);

      const latestPlan = plans && plans.length > 0 ? plans[0] : null;

      // 3. Montar o Objeto Completo para a IA
      const strToArray = (s: string) => s ? s.split("; ").map(v => v.trim()) : [];

      const constructedData: ComprehensiveAnamnesisData = {
        ...patient,
        doencas_cronicas: strToArray(patient.doencas_cronicas),
        alergias_medicamentosas: strToArray(patient.alergias_medicamentosas),
        queixa_principal: strToArray(patient.queixa_principal),
        facial_lesoes: strToArray(patient.facial_lesoes),
        facial_patologias: strToArray(patient.facial_patologias),
        
        // Dados booleanos e strings cruciais
        gestante: patient.gestante,
        lactante: patient.lactante,
        uso_retinoide: patient.uso_retinoide,
        uso_anticoagulante: patient.uso_anticoagulante,
        lista_medicacoes: patient.lista_medicacoes,
        biotipo_cutaneo: patient.biotipo_cutaneo,
        class_glogau: patient.class_glogau,
        
        // Mapeamento e Planos
        anamnesis_body_mapping: patient.anamnesis_body_mapping,
        current_plan: latestPlan ? {
            products: latestPlan.products,
            areas: latestPlan.areas
        } : undefined
      };

      setFullData(constructedData);

      // 4. Executar a Inteligência
      const result = await AnamnesisAIService.analyzeAnamnesis(id!, constructedData);
      setAnalysis(result);

      // 5. Gerar Homecare
      setHomecare(generateHomecare(constructedData));

    } catch (error) {
      console.error("Erro na análise:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4 bg-white/50 backdrop-blur-sm">
        <div className="relative">
            <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl animate-pulse"></div>
            <BrainCircuit className="w-16 h-16 text-purple-600 relative z-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Processando Inteligência Clínica</h2>
        <p className="text-gray-500 font-medium">Analisando anamnese, medicamentos e contraindicações...</p>
      </div>
    );
  }

  if (!analysis) return <div className="p-8 text-center text-gray-500">Não foi possível gerar a análise. Verifique os dados do paciente.</div>;

  // Definição de Cores do Score
  const scoreColor = analysis.confidence_score < 50 ? 'text-red-600' : analysis.confidence_score < 80 ? 'text-amber-500' : 'text-emerald-600';
  const scoreBg = analysis.confidence_score < 50 ? 'bg-red-50 border-red-100' : analysis.confidence_score < 80 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100';
  const statusText = analysis.confidence_score < 50 ? 'Risco Elevado' : analysis.confidence_score < 80 ? 'Atenção Necessária' : 'Paciente Seguro';

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* CABEÇALHO PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-full pointer-events-none -mr-16 -mt-16"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
                <BrainCircuit className="text-purple-600 w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Auditoria Clínica IA</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {patientName}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
            {fullData?.idade && <span>{fullData.idade} anos</span>}
            {fullData?.biotipo_cutaneo && <span className="w-1 h-1 bg-gray-300 rounded-full"></span>}
            {fullData?.biotipo_cutaneo && <span>Pele {fullData.biotipo_cutaneo}</span>}
            {fullData?.fototipo && <span className="w-1 h-1 bg-gray-300 rounded-full"></span>}
            {fullData?.fototipo && <span>Fototipo {fullData.fototipo}</span>}
          </p>
        </div>

        <div className="flex items-center gap-6 relative z-10">
            <div className={`px-6 py-3 rounded-2xl border ${scoreBg} flex flex-col items-end min-w-[180px]`}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Score de Segurança</p>
                <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-8 h-8 ${scoreColor}`} />
                    <p className={`text-4xl font-black ${scoreColor} tracking-tighter`}>{analysis.confidence_score}</p>
                </div>
                <p className={`text-xs font-bold ${scoreColor} mt-1`}>{statusText}</p>
            </div>
            <Button variant="outline" onClick={() => window.print()} className="h-12 px-6 border-gray-200 hover:bg-gray-50 hover:text-purple-700">
                <Printer size={18} className="mr-2"/> Imprimir Laudo
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: DIAGNÓSTICO E RISCO */}
        <div className="xl:col-span-1 space-y-6">
            
            {/* ALERTAS DE RISCO (CRÍTICO) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 text-lg">
                    <AlertTriangle className="text-amber-500" /> Fatores de Risco
                </h2>
                
                {analysis.risk_factors.length === 0 ? (
                    <div className="p-6 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-sm flex flex-col items-center text-center gap-3">
                        <CheckCircle2 size={32} className="text-emerald-500"/> 
                        <p>Nenhuma contraindicação ou fator de risco crítico identificado nesta anamnese.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {analysis.risk_factors.map((alert: any, idx: number) => (
                            <div key={idx} className={`p-4 rounded-2xl border-l-[6px] shadow-sm transition-all hover:translate-x-1 ${
                                alert.type === 'danger' ? 'bg-red-50 border-red-500 text-red-900' :
                                alert.type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-900' :
                                'bg-blue-50 border-blue-500 text-blue-900'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {alert.type === 'danger' && <div className="bg-red-100 p-1 rounded-full"><X size={14} className="text-red-600" /></div>}
                                    <span className="font-bold text-xs uppercase tracking-wide opacity-80">{alert.category}</span>
                                </div>
                                <h4 className="font-bold text-sm mb-1">{alert.title}</h4>
                                <p className="text-xs leading-relaxed opacity-90">{alert.message}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PARECER TÉCNICO */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <h3 className="font-bold text-white/90 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Sparkles size={16}/> Parecer IA
                </h3>
                <p className="text-lg font-medium leading-relaxed italic opacity-95">
                    "{analysis.ai_suggestions}"
                </p>
                <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-xs text-white/60 uppercase">Queixas</p>
                        <p className="font-bold text-xl">{fullData?.queixa_principal?.length || 0}</p>
                    </div>
                    <div>
                        <p className="text-xs text-white/60 uppercase">Contraindicações</p>
                        <p className="font-bold text-xl">{analysis.risk_factors.filter((r:any) => r.type === 'danger').length}</p>
                    </div>
                </div>
            </div>

            {/* ZONAS MAPEADAS */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <MapPin className="text-pink-500" size={18} /> Zonas Mapeadas
                </h2>
                <div className="flex flex-wrap gap-2">
                    {analysis.bodyMapAnalysis && analysis.bodyMapAnalysis.length > 0 ? (
                        analysis.bodyMapAnalysis.map((area: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-600">
                                {area}
                            </span>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic">Nenhuma área marcada visualmente.</p>
                    )}
                </div>
            </div>
        </div>

        {/* COLUNA DIREITA: TRATAMENTOS E HOMECARE */}
        <div className="xl:col-span-2 space-y-8">
            
            {/* 1. PROTOCOLOS CLÍNICOS E INJETÁVEIS */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-3">
                        <Syringe className="text-purple-600 w-6 h-6" /> 
                        Plano de Tratamento Sugerido
                    </h2>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold uppercase">Baseado na Anamnese</span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {analysis.suggested_treatments.map((t: any, idx: number) => (
                        <div key={idx} className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                            t.contraindicated 
                                ? 'bg-gray-50 border-gray-200 opacity-60 grayscale' 
                                : 'bg-white border-purple-100 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1'
                        }`}>
                            {t.contraindicated && (
                                <div className="absolute top-4 right-4 px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-full">
                                    Contraindicado
                                </div>
                            )}
                            {!t.contraindicated && (
                                <div className="absolute top-4 right-4 px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                                    <CheckCircle2 size={10}/> Recomendado
                                </div>
                            )}

                            <h3 className={`font-bold text-lg mb-3 pr-20 ${t.contraindicated ? 'text-gray-500 line-through' : 'text-purple-800'}`}>
                                {t.treatmentName}
                            </h3>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed min-h-[40px]">
                                {t.reasoning}
                            </p>

                            {!t.contraindicated && t.expectedResults && (
                                <div className="pt-4 border-t border-dashed border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Resultados Esperados:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {t.expectedResults.map((res: string, i: number) => (
                                            <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-100 font-medium">
                                                ✨ {res}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. HOMECARE ROUTINE (SKINCARE) */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-3">
                        <Droplets className="text-blue-500 w-6 h-6" /> 
                        Prescrição Homecare
                    </h2>
                    <div className="flex gap-2">
                        {homecare?.actives.map((active: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase border border-blue-100">
                                {active}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 relative">
                    {/* Linha divisória vertical */}
                    <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-gray-100"></div>

                    {/* Manhã */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-500 mb-2">
                            <Sun size={20} />
                            <h3 className="font-bold text-sm uppercase tracking-wide">Rotina Diurna</h3>
                        </div>
                        <ul className="space-y-3">
                            {homecare?.morning.map((step: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-amber-600 font-bold text-xs shadow-sm border border-amber-100">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm text-gray-700 font-medium">{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Noite */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-500 mb-2">
                            <Moon size={20} />
                            <h3 className="font-bold text-sm uppercase tracking-wide">Rotina Noturna</h3>
                        </div>
                        <ul className="space-y-3">
                            {homecare?.night.map((step: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-indigo-600 font-bold text-xs shadow-sm border border-indigo-100">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm text-gray-700 font-medium">{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}