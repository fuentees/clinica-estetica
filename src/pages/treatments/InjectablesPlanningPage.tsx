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
      toast.error("Erro ao carregar dados.");
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
        Retorne JSON estrito com sugestões de tratamentos seguros considerando as contraindicações clínicas acima.
        SCHEMA JSON:
        {
          "analise_tipo": "Ficha",
          "botox": { "Região": unidades },
          "preenchimento": { "Região": "ml" },
          "bioestimuladores": { "produto": "Nome", "sessoes": 0, "intervalo": "dias" },
          "pele": { "limpeza": "frequencia", "peeling": "ativo sugerido", "microagulhamento": "sim/não e ativo", "mesoterapia": "ativos" },
          "tecnologias": { "laser": "tipo", "radiofrequencia": "tipo", "outros": "ex: ultrassom" },
          "home_care": ["produto 1", "produto 2"],
          "alertas": ["texto"],
          "contraindicacoes": ["texto"],
          "justificativa": "Explicação baseada nos dados."
        }
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleanJson = textResponse.replace(/```json|```/g, '').trim();
        setAiData(JSON.parse(cleanJson));
        toast.success("Análise Clínica Realizada!");

    } catch (error) {
        console.error(error);
        toast.error("Erro na análise clínica.");
    } finally {
        setProcessing(false);
    }
  };

  // --- 2. IA MISTA (VISÃO + CLÍNICA) ---
  const handleAnalyzePhoto = async () => {
    if (!analysisImage) return toast.error("Carregue uma foto primeiro.");
    setProcessing(true);
    
    try {
        // PROMPT MISTO: Combina o que a IA vê com o que ela sabe do paciente
        const prompt = `
        Você é um Dermatologista Expert. Realize uma ANÁLISE MISTA (Visual + Clínica) para este paciente.
        
        1. CONTEXTO CLÍNICO (Crucial para segurança):
        - Paciente: ${patient.sexo}, ${patient.idade} anos.
        - Queixa Relatada: ${patient.queixa_principal}
        - Histórico de Saúde: ${patient.doencas_cronicas}
        - Medicamentos em uso: ${patient.lista_medicacoes}
        - Alergias: ${patient.alergias_medicamentosas}
        - Gestante/Lactante: ${patient.gestante || patient.lactante ? 'SIM (Contraindicação Absoluta para injetáveis)' : 'Não'}
        - Uso de Roacutan: ${patient.uso_isotretinoina ? 'SIM (Pele sensível, evitar laser/peeling forte)' : 'Não'}
        - Histórico de Queloide: ${patient.historico_queloide ? 'SIM (Cuidado com bioestimuladores)' : 'Não'}

        2. ANÁLISE VISUAL (O que você vê na imagem):
        - Identifique acne ativa, manchas, rugas, flacidez e perda de volume.
        - Compare o que você vê com os dados clínicos. Exemplo: Se vir acne ativa e o paciente usa Roacutan, sugira apenas hidratação e LED, não peeling forte.
        
        3. OBJETIVO:
        Gere um protocolo completo e SEGURO.

        Retorne APENAS JSON estrito:
        {
          "analise_tipo": "Mista",
          "botox": { "Região": unidades_sugeridas },
          "preenchimento": { "Região": "ml_sugerido" },
          "bioestimuladores": { "produto": "Nome", "sessoes": 0, "intervalo": "" },
          "pele": { 
              "limpeza": "frequência", 
              "peeling": "ativo e concentração (considere sensibilidade)", 
              "microagulhamento": "indicado ou não (verifique queloide)", 
              "mesoterapia": "ativos sugeridos" 
          },
          "tecnologias": { "laser": "tipo", "radiofrequencia": "tipo", "outros": "" },
          "home_care": ["lista de produtos"],
          "alertas": ["Avisos baseados na combinação Foto+Ficha"],
          "contraindicacoes": ["O que NÃO fazer sob hipótese alguma"],
          "justificativa": "Explicação cruzando o que foi visto na foto com os dados clínicos."
        }
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "image/jpeg", data: analysisImage } }
                    ]
                }]
            })
        });

        const data = await response.json();
        
        if (!data.candidates) throw new Error("Sem resposta da IA");

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleanJson = textResponse.replace(/```json|```/g, '').trim();
        setAiData(JSON.parse(cleanJson));
        toast.success("Análise Mista (Foto + Ficha) Completa!");

    } catch (error) {
        console.error(error);
        toast.error("Erro na análise visual.");
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
     // Lógica de salvamento
     try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('injectables_plans').insert({
            patient_id: id,
            toxina_unidades: manualPlan.toxina, // Ajuste para nome da coluna no banco se necessário
            preenchimento: manualPlan.preenchimento,
            recomendacao_ia: aiData,
            alertas_ia: aiData?.alertas,
            contraindicacoes_ia: aiData?.contraindicacoes,
            observacoes: manualPlan.observacoes,
            created_by: user?.id
        });
        if (error) throw error;
        toast.success("Protocolo salvo!");
     } catch (e) {
        toast.error("Erro ao salvar.");
     }
  };

  // Helpers de atualização manual
  const updateToxina = (area: string, valor: string) => setManualPlan(p => ({...p, toxina: {...p.toxina, [area]: Number(valor)}}));
  const updatePreenchimento = (area: string, valor: string) => setManualPlan(p => ({...p, preenchimento: {...p.preenchimento, [area]: valor}}));

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-purple-600 w-10 h-10" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/patients/${id}/history`)} className="p-2"><ArrowLeft /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Brain className="text-purple-600" /> Inteligência Clínica
            </h1>
            <p className="text-gray-500 text-sm">Paciente: {patient?.profiles?.first_name} {patient?.profiles?.last_name}</p>
          </div>
        </div>
        <Button onClick={handleSavePlan} className="bg-green-600 text-white shadow-lg"><Save size={18} className="mr-2" /> Salvar Protocolo</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* --- COLUNA ESQUERDA: FERRAMENTAS DE IA (35%) --- */}
        <div className="xl:col-span-4 space-y-6">
            
            {/* OPÇÃO 1: ANÁLISE APENAS DE FICHA */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText size={20}/></div>
                    <h3 className="font-bold text-gray-800 dark:text-white">1. Análise de Ficha (Sem Foto)</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                    Ideal para pré-avaliação ou quando não há fotos. Baseia-se apenas no relato.
                </p>
                <Button onClick={handleAnalyzeAnamnesis} disabled={processing} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {processing ? <Loader2 className="animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                    Gerar Protocolo Clínico
                </Button>
            </div>

            {/* OPÇÃO 2: ANÁLISE MISTA (FOTO + FICHA) */}
            <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-5 rounded-xl shadow-xl border border-purple-700 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="p-2 bg-white/10 rounded-lg"><ScanFace size={20} className="text-purple-300"/></div>
                    <div>
                        <h3 className="font-bold">2. Análise Mista (Foto + Ficha)</h3>
                        <p className="text-xs text-purple-200">Visão Computacional + Dados Clínicos</p>
                    </div>
                </div>
                
                <div 
                    className="w-full h-40 rounded-lg border-2 border-dashed border-purple-400/30 flex flex-col items-center justify-center bg-black/20 cursor-pointer hover:bg-black/30 transition-all overflow-hidden mb-4 relative z-10"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {analysisImagePreview ? (
                        <img src={analysisImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <><Camera className="text-purple-300 mb-2"/><span className="text-xs text-purple-200">Clique para Carregar Foto</span></>
                    )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                <Button onClick={handleAnalyzePhoto} disabled={processing || !analysisImage} className="w-full bg-white text-purple-900 hover:bg-purple-50 font-bold relative z-10 border-0">
                    {processing ? <Loader2 className="animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                    Analisar Foto + Ficha
                </Button>
            </div>

            {/* RESULTADO DA IA */}
            {aiData && (
                <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-left-4">
                    <div className="flex justify-between items-start mb-4 border-b pb-2">
                        <h3 className="font-bold text-purple-600 flex items-center gap-2"><Brain size={16}/> Sugestão IA</h3>
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-1 rounded uppercase font-bold">{aiData.analise_tipo}</span>
                    </div>
                    
                    <div className="space-y-4 text-sm">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border border-purple-100 dark:border-purple-800">
                            <p className="text-xs text-purple-600 dark:text-purple-300 font-bold uppercase mb-1">Racional Clínico</p>
                            <p className="italic text-gray-600 dark:text-gray-300 leading-snug">"{aiData.justificativa}"</p>
                        </div>

                        {/* Home Care */}
                        {aiData.home_care?.length > 0 && (
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase mb-1 flex items-center gap-1"><Pill size={12}/> Home Care</p>
                                <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400">
                                    {aiData.home_care.map((h, i) => <li key={i}>{h}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* Pele */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <span className="text-xs text-gray-500 block">Mesoterapia</span>
                                <span className="font-bold text-xs text-gray-700 dark:text-gray-200">{aiData.pele?.mesoterapia || '-'}</span>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <span className="text-xs text-gray-500 block">Peeling</span>
                                <span className="font-bold text-xs text-gray-700 dark:text-gray-200">{aiData.pele?.peeling || '-'}</span>
                            </div>
                        </div>

                        {/* Alertas */}
                        {aiData.contraindicacoes?.length > 0 && (
                            <div className="bg-red-50 text-red-700 p-2 rounded text-xs border border-red-200 font-bold">
                                ⚠️ {aiData.contraindicacoes[0]}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* --- COLUNA DIREITA: PLANEJAMENTO DO PROFISSIONAL (65%) --- */}
        <div className="xl:col-span-8 space-y-6">
            
            {/* 1. HARMONIZAÇÃO (Toxina e Preenchimento) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Syringe className="text-pink-600" /> Harmonização Facial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Toxina */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase">Toxina (Unidades)</h4>
                        {['Glabela', 'Frontal', 'Orbicular', 'Masseter'].map(area => (
                            <div key={area} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                                <span className="text-sm font-medium dark:text-gray-300">{area}</span>
                                <div className="flex items-center gap-2">
                                    {aiData?.botox && (aiData.botox as any)[area] && (
                                        <span className="text-[10px] text-purple-600 font-bold bg-purple-100 px-1.5 rounded">IA: {(aiData.botox as any)[area]}</span>
                                    )}
                                    <input type="number" className="w-16 p-1 text-right text-sm border rounded dark:bg-gray-800" placeholder="0" onChange={(e) => setManualPlan(p => ({...p, toxina: {...p.toxina, [area]: Number(e.target.value)}}))} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Preenchimento */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase">Preenchimento (ml)</h4>
                        {['Malar', 'Mento', 'Mandíbula', 'Olheiras', 'Labios'].map(area => (
                            <div key={area} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                                <span className="text-sm font-medium dark:text-gray-300">{area}</span>
                                <div className="flex items-center gap-2">
                                    {aiData?.preenchimento && (aiData.preenchimento as any)[area] && (
                                        <span className="text-[10px] text-purple-600 font-bold bg-purple-100 px-1.5 rounded">{(aiData.preenchimento as any)[area]}</span>
                                    )}
                                    <input type="text" className="w-16 p-1 text-right text-sm border rounded dark:bg-gray-800" placeholder="0 ml" onChange={(e) => setManualPlan(p => ({...p, preenchimento: {...p.preenchimento, [area]: e.target.value}}))} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. GERENCIAMENTO DE PELE & TECNOLOGIAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Droplets className="text-blue-500" /> Gerenciamento de Pele
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500">Mesoterapia / Intradermo</label>
                            <input type="text" className="w-full p-2 border rounded mt-1 dark:bg-gray-900" placeholder={aiData?.pele?.mesoterapia || "Ativos..."} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">Peeling Químico</label>
                            <input type="text" className="w-full p-2 border rounded mt-1 dark:bg-gray-900" placeholder={aiData?.pele?.peeling || "Ácido..."} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">Home Care (Prescrição)</label>
                            <textarea className="w-full p-2 border rounded mt-1 h-20 dark:bg-gray-900" placeholder={aiData?.home_care?.join(', ') || "Sabonete, Vitamina C..."} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Zap className="text-yellow-500" /> Tecnologias & Bioestimulador
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500">Bioestimulador</label>
                            <input type="text" className="w-full p-2 border rounded mt-1 dark:bg-gray-900" placeholder={aiData?.bioestimuladores?.produto || "Sculptra / Radiesse"} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">Laser / Luz Pulsada</label>
                            <input type="text" className="w-full p-2 border rounded mt-1 dark:bg-gray-900" placeholder={aiData?.tecnologias?.laser || "Lavieen, IPL..."} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">Outras Tecnologias</label>
                            <input type="text" className="w-full p-2 border rounded mt-1 dark:bg-gray-900" placeholder={aiData?.tecnologias?.radiofrequencia || "Radiofrequência, Ultraformer..."} />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 3. OBSERVAÇÕES */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="text-gray-400" /> Observações Finais
                </h3>
                <textarea 
                    className="w-full h-32 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-gray-200 outline-none transition-all"
                    placeholder="Descreva o plano completo..."
                    onChange={(e) => setManualPlan(prev => ({...prev, observacoes: e.target.value}))}
                />
            </div>

        </div>
      </div>
    </div>
  );
}