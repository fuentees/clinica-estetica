import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ArrowLeft, Save, Activity, Scale, FileText, UploadCloud, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ImageUpload } from '../../components/ImageUpload';
import { SignaturePad } from '../../components/SignaturePad';

export function SessionEvolutionPage() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patient, setPatient] = useState<any>(null);
    const [treatmentsList, setTreatmentsList] = useState<any[]>([]);
    const [clinicId, setClinicId] = useState<string | null>(null);
    
    // Dados Gerais
    const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
    const [notes, setNotes] = useState('');
    const [sessionNumber, setSessionNumber] = useState(1);
    const [photos, setPhotos] = useState({ before: '', after: '' });
    const [signatureDataURL, setSignatureDataURL] = useState('');

    // Dados Bioimpedância
    const [isBio, setIsBio] = useState(false);
    const [bioData, setBioData] = useState({
        peso: '',
        altura: '',
        imc: '', 
        gordura: '',
        massa_magra: '',
        agua: '',
        tmb: '',
        musculo_esqueletico: '',
        retencao: '',
        rcq: '', 
        idade_metabolica: '',
        arquivo: '' 
    });

    useEffect(() => {
        if (patientId) loadData();
    }, [patientId]);

    // Cálculo Automático de IMC
    useEffect(() => {
        if (bioData.peso && bioData.altura) {
            const p = parseFloat(String(bioData.peso).replace(',', '.'));
            const a = parseFloat(String(bioData.altura).replace(',', '.'));
            
            if (p > 0 && a > 0) {
                const heightInMeters = a > 3 ? a / 100 : a;
                const imc = p / (heightInMeters * heightInMeters);
                setBioData(prev => ({ ...prev, imc: imc.toFixed(2) }));
            }
        }
    }, [bioData.peso, bioData.altura]);

    async function loadData() {
        try {
            setLoading(true);

            // 1. Pega ClinicId do usuário logado
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('clinic_id:clinic_id').eq('id', user.id).single();
                if (profile) setClinicId(profile.clinic_id);
            }

            // 2. Busca Paciente
            const { data: pat } = await supabase
                .from('patients')
                .select(`id, altura, peso, name`)
                .eq('id', patientId)
                .single();
            setPatient(pat);
            
            if (pat) {
                setBioData(prev => ({
                    ...prev,
                    peso: pat.peso || '',
                    altura: pat.altura || ''
                }));
            }

            // 3. Busca lista de tratamentos cadastrados
            const { data: treats } = await supabase.from('treatments').select('*').order('name');
            setTreatmentsList(treats || []);

        } catch (error) {
            toast.error("Erro ao carregar prontuário.");
        } finally {
            setLoading(false);
        }
    }

    const handleTreatmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedTreatmentId(id);
        const treatment = treatmentsList.find(t => t.id === id);
        if (treatment && treatment.name.toLowerCase().includes('bioimped')) {
            setIsBio(true);
            toast('Interface de Bioimpedância Ativada', { icon: '⚖️' });
        } else {
            setIsBio(false);
        }
    };

    const handleSaveEvolution = async () => {
        if (!selectedTreatmentId) return toast.error("Selecione o procedimento realizado.");
        if (!clinicId) return toast.error("Sua sessão expirou. Recarregue a página.");

        setIsSubmitting(true);
        try {
            const treatmentName = treatmentsList.find(t => t.id === selectedTreatmentId)?.name;

            // 1. Registro no Prontuário Geral (Evolução)
            const { error: sessionError } = await supabase
                .from('patient_treatments')
                .insert({
                    clinic_id: clinicId,
                    patient_id: patientId, // CamelCase conforme Prisma
                    treatment_id: selectedTreatmentId,
                    notes: `Sessão ${sessionNumber} - ${treatmentName}: ${notes}`,
                    photos: photos,
                    signature_url: signatureDataURL || null,
                    startDate: new Date().toISOString(),
                    status: 'completed'
                });

            if (sessionError) throw sessionError;

            // 2. Registro de Bioimpedância se aplicável
            if (isBio) {
                const { error: bioError } = await supabase
                    .from('patient_bioimpedance')
                    .insert({
                        patient_id: patientId, // CamelCase conforme Prisma
                        data: new Date().toISOString(),
                        peso: Number(bioData.peso),
                        altura: Number(bioData.altura),
                        imc: Number(bioData.imc),
                        gordura_percentual: Number(bioData.gordura),
                        massa_magra_kg: Number(bioData.massa_magra),
                        agua_percentual: Number(bioData.agua),
                        massa_muscular_esqueletica_kg: Number(bioData.musculo_esqueletico),
                        nivel_retencao_hidrica: bioData.retencao,
                        razao_cintura_quadril: Number(bioData.rcq),
                        idade_metabolica: Number(bioData.idade_metabolica),
                        tmb: Number(bioData.tmb),
                        arquivo_balanca: bioData.arquivo,
                        observacoes: notes
                    });
                
                // Atualiza o cadastro base do paciente com os novos valores
                await supabase.from('patients').update({ 
                    peso: Number(bioData.peso), 
                    altura: Number(bioData.altura) 
                }).eq('id', patientId);

                if (bioError) throw bioError;
            }
            
            toast.success("Evolução registrada com sucesso!");
            navigate(isBio ? `/patients/${patientId}/bioimpedance` : `/patients/${patientId}/history`);
            
        } catch (error: any) {
            toast.error("Falha ao salvar registro: " + error.message);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950">
            <Loader2 className="animate-spin text-pink-600" size={40} />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Compilando Dados Clínicos...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
            {/* HEADER */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-2xl h-12 w-12 p-0 bg-gray-50 dark:bg-gray-900">
                        <ArrowLeft size={24} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Evolução de Sessão</h1>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Paciente: {patient?.name || '---'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLUNA ESQUERDA: FORMULÁRIO */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-[0.2em]">
                            <Activity size={20} className="text-pink-600" /> Parâmetros de Aplicação
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Protocolo Aplicado</label>
                                <select 
                                    className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                                    value={selectedTreatmentId}
                                    onChange={handleTreatmentChange}
                                >
                                    <option value="">Selecione o protocolo...</option>
                                    {treatmentsList.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sequência da Sessão</label>
                                <Input type="number" value={sessionNumber} onChange={e => setSessionNumber(Number(e.target.value))} className="h-12 font-bold" />
                            </div>
                        </div>
                        
                        {isBio && (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-8 rounded-[2rem] border-2 border-blue-100 dark:border-blue-900/30 mb-8 animate-in zoom-in-95">
                                <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 mb-6 flex items-center gap-2 uppercase tracking-widest">
                                    <Scale size={18} /> Composição de Bioimpedância
                                </h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                    <InputItem label="Peso (kg)" value={bioData.peso} onChange={v => setBioData({...bioData, peso: v})} />
                                    <InputItem label="Altura (m)" value={bioData.altura} onChange={v => setBioData({...bioData, altura: v})} />
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">IMC</label>
                                        <Input readOnly value={bioData.imc} className="h-11 bg-blue-100 dark:bg-blue-900/50 font-black italic border-0" />
                                    </div>
                                    <InputItem label="Gordura %" value={bioData.gordura} onChange={v => setBioData({...bioData, gordura: v})} />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                    <InputItem label="Massa Magra (kg)" value={bioData.massa_magra} onChange={v => setBioData({...bioData, massa_magra: v})} />
                                    <InputItem label="Músculo Esq. (kg)" value={bioData.musculo_esqueletico} onChange={v => setBioData({...bioData, musculo_esqueletico: v})} />
                                    <InputItem label="Água %" value={bioData.agua} onChange={v => setBioData({...bioData, agua: v})} />
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Retenção</label>
                                        <select 
                                            className="w-full h-11 px-3 bg-white dark:bg-gray-800 border-0 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            value={bioData.retencao}
                                            onChange={e => setBioData({...bioData, retencao: e.target.value})}
                                        >
                                            <option value="">-</option>
                                            <option value="Baixa">Baixa</option>
                                            <option value="Normal">Normal</option>
                                            <option value="Alta">Alta</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <InputItem label="TMB (Kcal)" value={bioData.tmb} onChange={v => setBioData({...bioData, tmb: v})} />
                                    <InputItem label="Idade Metab." value={bioData.idade_metabolica} onChange={v => setBioData({...bioData, idade_metabolica: v})} />
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Ticket da Balança</label>
                                        <ImageUpload label="Fazer Upload do Relatório" folder={`bioimpedancia/${patientId}`} onUpload={url => setBioData({...bioData, arquivo: url})} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                {isBio ? "Resumo da Análise Bioelétrica" : "Parecer Clínico da Sessão"}
                            </label>
                            <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-6 bg-gray-50 dark:bg-gray-900 border-0 rounded-[2rem] h-40 font-medium text-sm focus:ring-2 focus:ring-pink-500 outline-none resize-none shadow-inner"
                                placeholder="Dose, técnica utilizada, reações imediatas..."
                            />
                        </div>
                    </div>
                    
                    {!isBio && (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FileText size={14} className="text-pink-600" /> Confirmação do Paciente
                            </h3>
                            <div className="p-2 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl">
                                <SignaturePad onEnd={setSignatureDataURL} isLoading={isSubmitting} />
                            </div>
                        </div>
                    )}
                </div>

                {/* COLUNA DIREITA: IMAGENS */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-widest">
                            <Camera size={20} className="text-pink-600" /> Registro Fotográfico
                        </h2>
                        <div className="space-y-8">
                            <ImageUpload label="Antes (Início Sessão)" folder={`prontuario/${patientId}`} onUpload={url => setPhotos(p => ({...p, before: url}))} />
                            <div className="h-px bg-gray-50 dark:bg-gray-700 w-full" />
                            <ImageUpload label="Depois (Final Sessão)" folder={`prontuario/${patientId}`} onUpload={url => setPhotos(p => ({...p, after: url}))} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-gray-100 dark:border-gray-800">
                <Button 
                    onClick={handleSaveEvolution} 
                    disabled={isSubmitting} 
                    className="h-16 px-12 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
                >
                    {isSubmitting ? <Loader2 className="animate-spin mr-3" /> : <Save size={20} className="mr-3 text-pink-500" />}
                    Finalizar Atendimento
                </Button>
            </div>
        </div>
    );
}

// Sub-componente de Input Auxiliar
function InputItem({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">{label}</label>
            <Input 
                type="number" 
                step="0.1" 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                className="h-11 font-bold italic border-0 bg-white dark:bg-gray-800" 
                placeholder="0.0"
            />
        </div>
    );
}