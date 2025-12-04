import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Brain, Syringe, AlertTriangle, Save, ArrowLeft, 
  Sparkles, History, Loader2, ShieldAlert, FileText 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

// --- INTERFACES E TIPOS ---
interface AIPlanResult {
  botox: Record<string, number>;
  preenchimento: Record<string, string>;
  bioestimuladores: {
    produto: string;
    sessoes: number;
    intervalo: string;
  };
  alertas: string[];
  contraindicacoes: string[]; // Definido em português
  justificativa: string;
}

export function InjectablesPlanningPage() {
  const { id } = useParams(); // ID do Paciente
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processingAI, setProcessingAI] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  
  // Estado do Plano (IA e Manual)
  const [aiData, setAiData] = useState<AIPlanResult | null>(null);
  const [manualPlan, setManualPlan] = useState({
    toxina: {} as Record<string, number>,
    preenchimento: {} as Record<string, string>,
    observacoes: ''
  });

  useEffect(() => {
    if (id) fetchPatient();
  }, [id]);

  async function fetchPatient() {
    try {
      // Busca dados profundos do paciente para a IA analisar
      const { data, error } = await supabase
        .from('patients')
        .select(`*, profiles:profile_id (*)`)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      toast.error("Erro ao carregar dados do paciente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DA IA (Simulada localmente para rapidez) ---
  const handleGenerateAI = async () => {
    setProcessingAI(true);
    
    // 1. UX: Simula "pensamento" da máquina
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Análise de Dados (Regras Clínicas)
    const age = patient?.idade || 30;
    const isGestante = patient?.gestante || false;
    const skinType = patient?.fototipo || 'II';
    const hasFlacidez = (patient?.queixa_principal || '').includes('Flacidez');

    const result: AIPlanResult = {
      botox: {},
      preenchimento: {},
      bioestimuladores: { produto: "Não indicado", sessoes: 0, intervalo: "-" },
      alertas: [],
      contraindicacoes: [],
      justificativa: "Protocolo sugerido com base na idade e fototipo."
    };

    // Regras de Segurança
    if (isGestante) {
        result.contraindicacoes.push("Gestação: Contraindicação absoluta.");
        result.justificativa = "Procedimento suspenso devido à gestação.";
    } else {
        // Protocolo Toxina
        result.botox = {
            "Glabela": age > 45 ? 25 : 20,
            "Frontal": 10, 
            "Orbicular": 12 
        };
        
        // Protocolo Preenchimento
        if (age > 35 || hasFlacidez) {
            result.preenchimento["Malar"] = "1.0ml por lado";
            result.preenchimento["Mento"] = "1.0ml";
            result.justificativa += " Estruturação indicada devido à idade.";
        }

        // Bioestimulador
        if (skinType === 'IV' || skinType === 'V' || skinType === 'VI') {
             result.bioestimuladores = { produto: "Radiesse", sessoes: 2, intervalo: "45 dias" };
        } else {
             result.bioestimuladores = { produto: "Sculptra", sessoes: 3, intervalo: "30 dias" };
        }
    }

    // Alertas
    if (patient?.uso_isotretinoina) result.alertas.push("Uso de Roacutan: Pele sensível.");
    if (patient?.tabagismo) result.alertas.push("Tabagismo: Reduz duração do efeito.");

    setAiData(result);
    setProcessingAI(false);
    
    if (result.contraindicacoes.length > 0) {
        toast.error("IA detectou contraindicações!");
    } else {
        toast.success("Plano sugerido gerado com sucesso!");
    }
  };

  const handleSavePlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('injectables_plans').insert({
        patient_id: id,
        toxina_plan: manualPlan.toxina,
        preenchimento_plan: manualPlan.preenchimento,
        ai_recommendation: aiData, 
        ai_alerts: aiData?.alertas,
        ai_contraindications: aiData?.contraindicacoes,
        observacoes: manualPlan.observacoes,
        created_by: user?.id,
        status_geral: 'Planejado'
      });

      if (error) throw error;
      toast.success("Planejamento salvo no prontuário!");
    } catch (error) {
      toast.error("Erro ao salvar plano. Verifique se a tabela 'injectables_plans' existe.");
      console.error(error);
    }
  };

  // Função auxiliar para atualizar inputs manuais
  const updateToxina = (area: string, valor: string) => {
      setManualPlan(prev => ({
          ...prev,
          toxina: { ...prev.toxina, [area]: Number(valor) }
      }));
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-purple-600 w-10 h-10" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/patients/${id}/edit`)} className="p-2">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Sparkles className="text-purple-500 fill-current" /> Planejamento de Injetáveis
            </h1>
            <p className="text-gray-500 text-sm">
              Paciente: {patient?.profiles?.first_name} {patient?.profiles?.last_name} • Idade: {patient?.idade || 'N/A'}
            </p>
          </div>
        </div>
        <Button onClick={handleSavePlan} className="bg-green-600 hover:bg-green-700 text-white shadow-lg transition-transform hover:scale-105">
          <Save size={18} className="mr-2" /> Salvar Planejamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- COLUNA DA ESQUERDA: PAINEL DA IA --- */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Principal da IA */}
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-6 rounded-2xl text-white shadow-2xl border border-purple-700 relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-500 rounded-full blur-3xl opacity-30"></div>

            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 bg-white/10 rounded-lg">
                <Brain size={28} className="text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold">IA Clínica</h2>
                <p className="text-purple-200 text-xs">Dermatologia Inteligente</p>
              </div>
            </div>
            
            <p className="text-purple-100 text-sm mb-6 leading-relaxed relative z-10">
              Clique abaixo para analisar a anamnese, fototipo e queixas do paciente e gerar um protocolo seguro.
            </p>
            
            {!aiData ? (
              <Button 
                onClick={handleGenerateAI} 
                disabled={processingAI}
                className="w-full bg-white text-purple-900 hover:bg-purple-50 font-bold py-6 shadow-lg relative z-10 border-0"
              >
                {processingAI ? (
                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Analisando dados...</span>
                ) : (
                    <span className="flex items-center gap-2"><Sparkles size={16} /> Gerar Sugestão</span>
                )}
              </Button>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4 relative z-10">
                
                {/* Justificativa */}
                <div className="bg-black/20 p-3 rounded-lg backdrop-blur-sm border border-white/5">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1 flex items-center gap-1">
                    <Brain size={12}/> Análise
                  </p>
                  <p className="text-sm italic text-gray-100">"{aiData.justificativa}"</p>
                </div>
                
                {/* Contraindicações (Crítico) */}
                {aiData.contraindicacoes.length > 0 && ( // CORRIGIDO AQUI (Português)
                   <div className="bg-red-500/90 text-white p-3 rounded-lg shadow-lg border border-red-400 animate-pulse">
                      <h4 className="flex items-center gap-2 font-bold text-sm mb-1">
                        <ShieldAlert size={16} /> CONTRAINDICAÇÃO
                      </h4>
                      <ul className="list-disc list-inside text-xs">
                        {aiData.contraindicacoes.map((c: string, i: number) => <li key={i}>{c}</li>)} {/* CORRIGIDO AQUI */}
                      </ul>
                   </div>
                )}

                {/* Alertas (Amarelo) */}
                {aiData.alertas.length > 0 && (
                   <div className="bg-yellow-500/20 border border-yellow-500/50 p-3 rounded-lg">
                      <h4 className="flex items-center gap-2 text-yellow-200 font-bold text-xs mb-1">
                        <AlertTriangle size={12} /> ATENÇÃO CLÍNICA
                      </h4>
                      <ul className="list-disc list-inside text-xs text-yellow-100">
                        {aiData.alertas.map((c: string, i: number) => <li key={i}>{c}</li>)}
                      </ul>
                   </div>
                )}

                {/* Sugestão de Bioestimulador */}
                <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                    <p className="text-xs text-purple-300 font-bold mb-2">SUGESTÃO DE BIOESTIMULADOR</p>
                    <div className="flex justify-between text-sm border-b border-white/10 pb-1 mb-1">
                        <span>Produto:</span>
                        <span className="font-bold text-white">{aiData.bioestimuladores.produto}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Sessões:</span>
                        <span className="font-bold text-white">{aiData.bioestimuladores.sessoes} ({aiData.bioestimuladores.intervalo})</span>
                    </div>
                </div>
                
                <Button onClick={handleGenerateAI} variant="ghost" size="sm" className="w-full mt-4 text-purple-200 hover:text-white hover:bg-white/10">
                    Refazer Análise
                </Button>
              </div>
            )}
          </div>

          {/* Histórico Rápido */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                <History size={16} /> Histórico
             </h3>
             <div className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                Nenhum planejamento anterior.
             </div>
          </div>

        </div>

        {/* --- COLUNA DA DIREITA: PLANEJAMENTO MANUAL --- */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* SEÇÃO 1: TOXINA BOTULÍNICA */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Syringe size={20} /></div>
                        Toxina Botulínica
                    </h2>
                    {aiData && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                            <Sparkles size={10} /> Sugestões Ativas
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['Glabela', 'Frontal', 'Orbicular', 'Nasal', 'Masseter', 'Mentual'].map(area => (
                        <div key={area} className="group bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase dark:text-gray-400">{area}</label>
                                {/* Badge de Sugestão da IA */}
                                {aiData?.botox && (aiData.botox as any)[area] && (
                                    <div className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold cursor-help" title="Sugestão baseada na idade e queixa">
                                        IA: { (aiData.botox as any)[area] }U
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    onChange={(e) => updateToxina(area, e.target.value)}
                                />
                                <span className="absolute right-3 top-2 text-xs text-gray-400 font-medium">Unidades</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SEÇÃO 2: PREENCHEDORES */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
                    <div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><Syringe size={20} /></div>
                    Preenchedores (Ácido Hialurônico)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Malar', 'Mento', 'Mandíbula', 'Olheiras', 'Lábios', 'Sulco Nasogeniano'].map(area => (
                         <div key={area} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 block">{area}</span>
                                {aiData?.preenchimento && (aiData.preenchimento as any)[area] && (
                                    <span className="text-xs text-purple-600 font-medium flex items-center gap-1 mt-1">
                                        <Sparkles size={10} /> Sugerido: {(aiData.preenchimento as any)[area]}
                                    </span>
                                )}
                            </div>
                            <input 
                                type="text" 
                                placeholder="0 ml" 
                                className="w-24 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm font-bold text-right focus:ring-2 focus:ring-pink-500 outline-none"
                                onChange={(e) => setManualPlan(prev => ({...prev, preenchimento: {...prev.preenchimento, [area]: e.target.value}}))}
                            />
                         </div>
                    ))}
                </div>
            </div>

            {/* SEÇÃO 3: OBSERVAÇÕES */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-gray-400" /> Observações e Orientações
                </h2>
                <textarea 
                    className="w-full h-32 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-gray-200 outline-none transition-all"
                    placeholder="Descreva a sequência de aplicação, produtos específicos e orientações pós-procedimento..."
                    onChange={(e) => setManualPlan({...manualPlan, observacoes: e.target.value})}
                />
            </div>

        </div>
      </div>
    </div>
  );
}