import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Brain, Syringe, AlertTriangle, Save, ArrowLeft, 
  Sparkles, Loader2, Camera, FileText, Zap, Droplets,
  ScanFace, Pill, Activity
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

// Chave da API (Inserida pelo ambiente ou manual)
const apiKey = ""; 

// Tipagem do Resultado da IA (Unificado)
interface AIPlanResult {
  analise_tipo: 'Ficha' | 'Foto' | 'Mista';
  botox: Record<string, number>;
  preenchimento: Record<string, string>;
  bioestimuladores: { produto: string; sessoes: number; intervalo: string };
  pele: { limpeza: string; peeling: string; microagulhamento: string; mesoterapia: string };
  tecnologias: { laser: string; radiofrequencia: string; outros: string };
  home_care: string[]; 
  alertas: string[];
  contraindicacoes: string[];
  justificativa: string;
}

export function InjectablesPlanningPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  
  // Imagem
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisImagePreview, setAnalysisImagePreview] = useState<string | null>(null);

  // Resultado da IA
  const [aiData, setAiData] = useState<AIPlanResult | null>(null);
  
  // Plano Manual
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
      const { data, error } = await supabase
        .from('patients')
        .select(`*, profiles:profile_id (*)`)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      toast.error("Erro ao carregar dados do prontuário.");
    } finally {
      setLoading(false);
    }
  }

  // --- 1. IA CLÍNICA (Apenas Ficha) ---
  const handleAnalyzeAnamnesis = async () => {
    setProcessing(true);
    try {
        const prompt = `
        Aja como um Especialista em Dermatologia e Estética. Analise os dados clínicos deste paciente e sugira um protocolo completo.
        
        DADOS CLÍNICOS:
        - Idade: ${patient.idade}
        - Queixa: ${patient.queixa_principal}
        - Pele: Fototipo ${patient.fototipo}, Biotipo ${patient.biotipo_cutaneo}
        - Histórico: ${patient.doencas_cronicas}
        - Medicamentos: ${patient.lista_medicacoes}
        - Gestante/Lactante: ${patient.gestante || patient.lactante ? 'Sim' : 'Não'}
        - Roacutan: ${patient.uso_isotretinoina ? 'Sim' : 'Não'}
        - Alergias: ${patient.alergias_medicamentosas}

        TAREFA:
        Retorne JSON estrito com sugestões de tratamentos seguros.
        SCHEMA JSON:
        {
          "analise_tipo": "Ficha",
          "botox": { "Glabela": 0, "Frontal": 0, "Orbicular": 0, "Masseter": 0 },
          "preenchimento": { "Malar": "0ml", "Mento": "0ml", "Mandíbula": "0ml", "Labios": "0ml" },
          "bioestimuladores": { "produto": "Nome", "sessoes": 0, "intervalo": "dias" },
          "pele": { "limpeza": "frequencia", "peeling": "ativo", "microagulhamento": "sim/não", "mesoterapia": "ativos" },
          "tecnologias": { "laser": "tipo", "radiofrequencia": "tipo", "outros": "" },
          "home_care": [],
          "alertas": [],
          "contraindicacoes": [],
          "justificativa": ""
        }`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleanJson = textResponse.replace(/```json|```/g, '').trim();
        setAiData(JSON.parse(cleanJson));
        toast.success("Análise Clínica Concluída!");

    } catch (error) {
        toast.error("Falha na comunicação com a IA.");
    } finally {
        setProcessing(false);
    }
  };

  // --- 2. IA MISTA (VISÃO + CLÍNICA) ---
  const handleAnalyzePhoto = async () => {
    if (!analysisImage) return toast.error("Carregue uma foto para análise visual.");
    setProcessing(true);
    
    try {
        const prompt = `Analise a foto e a ficha deste paciente de ${patient.idade} anos. 
        Queixa: ${patient.queixa_principal}. 
        Contraindicações: ${patient.gestante ? 'GESTANTE' : 'Nenhuma'}. 
        Gere protocolo JSON de harmonização e skin quality.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "image/jpeg", data: analysisImage } }
                    ]
                }]
            })
        });

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleanJson = textResponse.replace(/```json|```/g, '').trim();
        setAiData(JSON.parse(cleanJson));
        toast.success("Análise Visual e Clínica Completa!");

    } catch (error) {
        toast.error("Erro na análise de visão computacional.");
    } finally {
        setProcessing(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        setAnalysisImagePreview(base64String);
        setAnalysisImage(base64String.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePlan = async () => {
     try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('injectables_plans').insert({
            patient_id: id,
            toxina_unidades: manualPlan.toxina,
            preenchimento: manualPlan.preenchimento,
            recomendacao_ia: aiData,
            observacoes: manualPlan.observacoes,
            created_by: user?.id
        });
        if (error) throw error;
        toast.success("Plano de Tratamento Arquivado!");
        navigate(`/patients/${id}/history`);
     } catch (e) {
        toast.error("Erro ao salvar protocolo.");
     }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-purple-600 w-12 h-12" /></div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto pb-32 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={() => navigate(`/patients/${id}/history`)} className="h-14 w-14 rounded-2xl bg-gray-50 hover:bg-gray-100 shadow-inner p-0">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
              <Brain className="text-purple-600" /> Inteligência Clínica
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
              Planejamento Assistido para {patient?.profiles?.first_name} {patient?.profiles?.last_name}
            </p>
          </div>
        </div>
        <Button onClick={handleSavePlan} className="h-14 px-8 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
          <Save size={18} className="text-emerald-500" /> Finalizar Planejamento
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* COLUNA ESQUERDA: IA (35%) */}
        <div className="xl:col-span-4 space-y-8">
            
            {/* ANÁLISE DE FICHA */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                      <FileText size={24}/>
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">1. Protocolo por Ficha</h3>
                </div>
                <Button onClick={handleAnalyzeAnamnesis} disabled={processing} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100">
                    {processing ? <Loader2 className="animate-spin" /> : <><Sparkles size={16} className="mr-2" /> Gerar via Anamnese</>}
                </Button>
            </div>

            {/* ANÁLISE MISTA */}
            <div className="bg-gray-900 text-white p-8 rounded-[3rem] shadow-2xl border border-purple-900/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-900/40 opacity-50"></div>
                <div className="relative z-10 flex items-center gap-4 mb-8">
                    <div className="p-3 bg-white/10 rounded-2xl text-purple-400 backdrop-blur-md border border-white/10 shadow-inner">
                      <ScanFace size={24}/>
                    </div>
                    <div>
                        <h3 className="font-black uppercase tracking-tighter italic text-lg">2. Análise Híbrida</h3>
                        <p className="text-[9px] font-bold text-purple-300 uppercase tracking-widest">Visão Computacional + Ficha</p>
                    </div>
                </div>
                
                <div 
                    className="w-full h-48 rounded-[2rem] border-2 border-dashed border-purple-500/30 flex flex-col items-center justify-center bg-black/20 cursor-pointer hover:bg-black/40 transition-all overflow-hidden mb-6 relative z-10"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {analysisImagePreview ? (
                        <img src={analysisImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <><Camera className="text-purple-400 mb-3" size={32}/><span className="text-[10px] font-black uppercase tracking-widest text-purple-200">Carregar Face do Paciente</span></>
                    )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                <Button onClick={handleAnalyzePhoto} disabled={processing || !analysisImage} className="w-full h-14 bg-white text-gray-950 hover:bg-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest relative z-10">
                    {processing ? <Loader2 className="animate-spin" /> : <><Sparkles size={16} className="mr-2 text-purple-600" /> Iniciar Escaneamento</>}
                </Button>
            </div>

            {/* RESULTADO IA */}
            {aiData && (
                <div className="bg-purple-50 dark:bg-gray-800 p-8 rounded-[2.5rem] border-2 border-purple-100 dark:border-purple-900/30 animate-in slide-in-from-left-4 duration-500">
                    <div className="flex justify-between items-start mb-6 border-b border-purple-200 pb-4">
                        <h3 className="font-black text-purple-700 dark:text-purple-400 uppercase tracking-tighter italic flex items-center gap-2"><Brain size={20}/> Sugestão da IA</h3>
                        <span className="text-[8px] bg-purple-700 text-white px-3 py-1 rounded-full uppercase font-black tracking-widest">{aiData.analise_tipo}</span>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-inner italic text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            "{aiData.justificativa}"
                        </div>

                        {aiData.contraindicacoes?.length > 0 && (
                            <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border-2 border-rose-100 flex items-center gap-3">
                                <AlertTriangle size={24} className="shrink-0 animate-pulse"/>
                                <p className="text-[10px] font-black uppercase leading-tight">{aiData.contraindicacoes[0]}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-purple-100 text-center">
                                <span className="text-[8px] font-black text-gray-400 uppercase block">Peeling</span>
                                <span className="text-[10px] font-bold text-purple-600">{aiData.pele?.peeling || 'N/A'}</span>
                            </div>
                            <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-purple-100 text-center">
                                <span className="text-[8px] font-black text-gray-400 uppercase block">Meso</span>
                                <span className="text-[10px] font-bold text-purple-600">{aiData.pele?.mesoterapia || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* COLUNA DIREITA: PLANEJAMENTO (65%) */}
        <div className="xl:col-span-8 space-y-8">
            
            <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 relative">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mb-10 flex items-center gap-4">
                    <Syringe className="text-pink-600" /> Harmonização Facial & Injetáveis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Toxina */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                           <Zap size={14} className="text-amber-500"/> Toxina Botulínica (U)
                        </h4>
                        {['Glabela', 'Frontal', 'Orbicular', 'Masseter'].map(area => (
                            <div key={area} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-pink-200 transition-all group">
                                <span className="text-sm font-black uppercase tracking-tighter text-gray-600 dark:text-gray-400">{area}</span>
                                <div className="flex items-center gap-4">
                                    {aiData?.botox && (aiData.botox as any)[area] > 0 && (
                                        <span className="text-[8px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">IA: {(aiData.botox as any)[area]}U</span>
                                    )}
                                    <input type="number" className="w-16 h-10 bg-white dark:bg-gray-800 border-0 rounded-xl text-center font-black italic shadow-inner outline-none focus:ring-2 focus:ring-pink-500" placeholder="0" onChange={(e) => setManualPlan(p => ({...p, toxina: {...p.toxina, [area]: Number(e.target.value)}}))} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Preenchimento */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                           <Droplets size={14} className="text-blue-500"/> Ácido Hialurônico (ml)
                        </h4>
                        {['Malar', 'Mento', 'Mandíbula', 'Labios'].map(area => (
                            <div key={area} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 transition-all group">
                                <span className="text-sm font-black uppercase tracking-tighter text-gray-600 dark:text-gray-400">{area}</span>
                                <div className="flex items-center gap-4">
                                    {aiData?.preenchimento && (aiData.preenchimento as any)[area] && (
                                        <span className="text-[8px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">IA: {(aiData.preenchimento as any)[area]}</span>
                                    )}
                                    <input type="text" className="w-16 h-10 bg-white dark:bg-gray-800 border-0 rounded-xl text-center font-black italic shadow-inner outline-none focus:ring-2 focus:ring-blue-500" placeholder="0ml" onChange={(e) => setManualPlan(p => ({...p, preenchimento: {...p.preenchimento, [area]: e.target.value}}))} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* OBSERVAÇÕES */}
            <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 relative group">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-4">
                    <FileText className="text-gray-400" /> Plano de Cuidados & Home Care
                </h3>
                <textarea 
                    className="w-full h-40 p-6 rounded-[2rem] border-0 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 outline-none transition-all shadow-inner font-medium leading-relaxed"
                    placeholder="Descreva aqui o protocolo completo, orientações de pós e produtos para casa..."
                    onChange={(e) => setManualPlan(prev => ({...prev, observacoes: e.target.value}))}
                />
            </div>

        </div>
      </div>
    </div>
  );
}