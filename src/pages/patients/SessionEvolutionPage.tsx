import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ArrowLeft, Save, Activity, Scale } from 'lucide-react';
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
    
    // Dados Gerais da Sessão
    const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
    const [notes, setNotes] = useState('');
    const [sessionNumber, setSessionNumber] = useState(1);
    const [photos, setPhotos] = useState({ before: '', after: '' });
    const [signatureDataURL, setSignatureDataURL] = useState('');

    // Dados Específicos de Bioimpedância
    const [isBio, setIsBio] = useState(false);
    const [bioData, setBioData] = useState({
        gordura: '',
        musculo: '',
        agua: '',
        visceral: '',
        metabolica: '',
        tmb: ''
    });

    useEffect(() => {
        if (patientId) loadData();
    }, [patientId]);

    async function loadData() {
        try {
            setLoading(true);
            
            // 1. Paciente
            const { data: pat } = await supabase
                .from('patients')
                .select(`id, profiles (first_name, last_name)`)
                .eq('id', patientId)
                .single();
            setPatient(pat);

            // 2. Lista de Tratamentos (Para o select)
            const { data: treats } = await supabase
                .from('treatments')
                .select('*')
                .order('name');
            setTreatmentsList(treats || []);

        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }

    // Detecta se o tratamento selecionado é Bioimpedância
    const handleTreatmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedTreatmentId(id);
        
        const treatment = treatmentsList.find(t => t.id === id);
        if (treatment && treatment.name.toLowerCase().includes('bioimped')) {
            setIsBio(true);
            toast('Modo Bioimpedância Ativado', { icon: '⚖️' });
        } else {
            setIsBio(false);
        }
    };

    const handleSaveEvolution = async () => {
        if (!selectedTreatmentId) return toast.error("Selecione o procedimento realizado.");

        setIsSubmitting(true);
        try {
            const treatmentName = treatmentsList.find(t => t.id === selectedTreatmentId)?.name;

            // 1. Salva no Histórico Clínico (Geral)
            const { data: sessionData, error: sessionError } = await supabase
                .from('patient_treatments')
                .insert({
                    patient_id: patientId,
                    treatment_id: selectedTreatmentId,
                    notes: `Sessão ${sessionNumber} - ${treatmentName}: ${notes}`,
                    photos: photos,
                })
                .select()
                .single(); // Retorna o ID para vincular financeiro se quiser

            if (sessionError) throw sessionError;

            // 2. Se for Bioimpedância, salva na tabela de métricas também
            if (isBio) {
                const { error: bioError } = await supabase
                    .from('patient_bioimpedance')
                    .insert({
                        patient_id: patientId,
                        data: new Date().toISOString(),
                        gordura_percentual: Number(bioData.gordura),
                        massa_muscular_kg: Number(bioData.musculo),
                        agua_percentual: Number(bioData.agua),
                        gordura_visceral: Number(bioData.visceral),
                        idade_metabolica: Number(bioData.metabolica),
                        tmb: Number(bioData.tmb),
                        observacoes: notes
                    });
                
                if (bioError) throw bioError;
            }
            
            toast.success("Sessão registrada com sucesso!");
            
            // Redireciona para o lugar certo
            if (isBio) {
                // Se foi bioimpedância, leva pro gráfico pra ver o resultado
                navigate(`/patients/${patientId}/bioimpedance`);
            } else {
                navigate(`/patients/${patientId}/history`);
            }
            
        } catch (error) {
            toast.error("Erro ao salvar sessão.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-600" /></div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <Button variant="ghost" onClick={() => navigate(`/patients/${patientId}/history`)}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Registrar Procedimento</h1>
                    <p className="text-sm text-gray-500">
                        Paciente: {patient?.profiles?.first_name} {patient?.profiles?.last_name}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Esquerda: Dados */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="font-semibold text-lg mb-4 dark:text-white flex items-center gap-2">
                            <Activity size={20} className="text-pink-600" /> Dados da Sessão
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="label">Qual procedimento foi feito?</label>
                                <select 
                                    className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                    value={selectedTreatmentId}
                                    onChange={handleTreatmentChange}
                                >
                                    <option value="">Selecione...</option>
                                    {treatmentsList.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Sessão Nº</label>
                                <Input type="number" value={sessionNumber} onChange={e => setSessionNumber(Number(e.target.value))} />
                            </div>
                        </div>
                        
                        {/* --- CAMPO ESPECIAL DE BIOIMPEDÂNCIA (SÓ APARECE SE SELECIONAR) --- */}
                        {isBio && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-4 animate-in fade-in slide-in-from-top-2">
                                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                                    <Scale size={16} /> Dados da Balança
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold">% Gordura</label>
                                        <Input type="number" step="0.1" value={bioData.gordura} onChange={e => setBioData({...bioData, gordura: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">Músculo (kg)</label>
                                        <Input type="number" step="0.1" value={bioData.musculo} onChange={e => setBioData({...bioData, musculo: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">% Água</label>
                                        <Input type="number" step="0.1" value={bioData.agua} onChange={e => setBioData({...bioData, agua: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">Visceral</label>
                                        <Input type="number" value={bioData.visceral} onChange={e => setBioData({...bioData, visceral: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">Idade Metab.</label>
                                        <Input type="number" value={bioData.metabolica} onChange={e => setBioData({...bioData, metabolica: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold">TMB (kcal)</label>
                                        <Input type="number" value={bioData.tmb} onChange={e => setBioData({...bioData, tmb: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="label">Anotações / Detalhes</label>
                            <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-4 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                placeholder={isBio ? "Ex: Paciente bem hidratado, retenção menor que mês passado..." : "Descreva a aplicação..."}
                            />
                        </div>
                    </div>
                    
                    {/* Assinatura (Só se não for bioimpedância, ou se quiser confirmar leitura) */}
                    {!isBio && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <SignaturePad onEnd={setSignatureDataURL} isLoading={isSubmitting} />
                        </div>
                    )}
                </div>

                {/* Coluna Direita: Fotos */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-6">
                        <h2 className="font-semibold text-lg mb-4 dark:text-white flex items-center gap-2">
                            📸 Registro Fotográfico
                        </h2>
                        <div className="space-y-6">
                            <ImageUpload label="Antes" folder={`prontuario/${patientId}`} onUpload={url => setPhotos(p => ({...p, before: url}))} />
                            <ImageUpload label="Depois / Resultado" folder={`prontuario/${patientId}`} onUpload={url => setPhotos(p => ({...p, after: url}))} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t dark:border-gray-700">
                <Button onClick={handleSaveEvolution} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg shadow-lg">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                    {isBio ? "Salvar Medição" : "Finalizar Sessão"}
                </Button>
            </div>
        </div>
    );
}