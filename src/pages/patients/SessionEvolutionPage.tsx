import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ArrowLeft, Save, Activity, Scale, FileText, UploadCloud } from 'lucide-react';
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
        imc: '', // Calculado
        gordura: '',
        massa_magra: '',
        agua: '',
        tmb: '',
        musculo_esqueletico: '',
        retencao: '',
        rcq: '', // Razão Cintura/Quadril
        idade_metabolica: '',
        arquivo: '' // URL do upload
    });

    useEffect(() => {
        if (patientId) loadData();
    }, [patientId]);

    // Cálculo Automático de IMC na Bioimpedância
    useEffect(() => {
        if (bioData.peso && bioData.altura) {
            const imc = Number(bioData.peso) / (Number(bioData.altura) * Number(bioData.altura));
            if (!isNaN(imc) && isFinite(imc)) {
                setBioData(prev => ({ ...prev, imc: imc.toFixed(2) }));
            }
        }
    }, [bioData.peso, bioData.altura]);

    async function loadData() {
        try {
            setLoading(true);
            const { data: pat } = await supabase
                .from('patients')
                .select(`id, altura, peso, profiles (first_name, last_name)`)
                .eq('id', patientId)
                .single();
            setPatient(pat);
            
            // Pré-preenche peso/altura se já tiver no cadastro
            if (pat) {
                setBioData(prev => ({
                    ...prev,
                    peso: pat.peso || '',
                    altura: pat.altura || ''
                }));
            }

            const { data: treats } = await supabase.from('treatments').select('*').order('name');
            setTreatmentsList(treats || []);
        } catch (error) {
            toast.error("Erro ao carregar dados.");
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
            toast('Modo Bioimpedância Ativado', { icon: '⚖️' });
        } else {
            setIsBio(false);
        }
    };

    const handleSaveEvolution = async () => {
        if (!selectedTreatmentId) return toast.error("Selecione o procedimento.");

        setIsSubmitting(true);
        try {
            const treatmentName = treatmentsList.find(t => t.id === selectedTreatmentId)?.name;

            // 1. Salva no Histórico Geral
            const { error: sessionError } = await supabase
                .from('patient_treatments')
                .insert({
                    patient_id: patientId,
                    treatment_id: selectedTreatmentId,
                    notes: `Sessão ${sessionNumber} - ${treatmentName}: ${notes}`,
                    photos: photos,
                });

            if (sessionError) throw sessionError;

            // 2. Salva na Tabela de Bioimpedância
            if (isBio) {
                const { error: bioError } = await supabase
                    .from('patient_bioimpedance')
                    .insert({
                        patient_id: patientId,
                        data: new Date().toISOString(),
                        peso: Number(bioData.peso),
                        altura: Number(bioData.altura),
                        imc: Number(bioData.imc),
                        gordura_percentual: Number(bioData.gordura),
                        massa_magra_percentual: Number(bioData.massa_magra), // Salvando como % ou kg, dependendo da sua regra
                        agua_percentual: Number(bioData.agua),
                        massa_muscular_esqueletica_kg: Number(bioData.musculo_esqueletico),
                        nivel_retencao_hidrica: bioData.retencao,
                        razao_cintura_quadril: Number(bioData.rcq),
                        idade_metabolica: Number(bioData.idade_metabolica),
                        tmb: Number(bioData.tmb),
                        arquivo_balanca: bioData.arquivo,
                        observacoes: notes
                    });
                
                // Atualiza o peso/altura no cadastro principal também
                await supabase.from('patients').update({ peso: Number(bioData.peso), altura: Number(bioData.altura) }).eq('id', patientId);

                if (bioError) throw bioError;
            }
            
            toast.success("Salvo com sucesso!");
            if (isBio) navigate(`/patients/${patientId}/bioimpedance`);
            else navigate(`/patients/${patientId}/history`);
            
        } catch (error) {
            toast.error("Erro ao salvar.");
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
                    <p className="text-sm text-gray-500">{patient?.profiles?.first_name} {patient?.profiles?.last_name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="font-semibold text-lg mb-4 dark:text-white flex items-center gap-2">
                            <Activity size={20} className="text-pink-600" /> Dados da Sessão
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Procedimento</label>
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
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Sessão Nº</label>
                                <Input type="number" value={sessionNumber} onChange={e => setSessionNumber(Number(e.target.value))} />
                            </div>
                        </div>
                        
                        {/* --- BLOCO DE BIOIMPEDÂNCIA --- */}
                        {isBio && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800 mb-6 animate-in fade-in slide-in-from-top-2">
                                <h3 className="text-md font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                                    <Scale size={18} /> Parâmetros da Balança
                                </h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Peso (kg)</label>
                                        <Input type="number" step="0.1" value={bioData.peso} onChange={e => setBioData({...bioData, peso: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Altura (m)</label>
                                        <Input type="number" step="0.01" value={bioData.altura} onChange={e => setBioData({...bioData, altura: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">IMC</label>
                                        <Input readOnly value={bioData.imc} className="bg-blue-100 dark:bg-blue-900 font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Gordura %</label>
                                        <Input type="number" step="0.1" value={bioData.gordura} onChange={e => setBioData({...bioData, gordura: e.target.value})} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Massa Magra (kg)</label>
                                        <Input type="number" step="0.1" value={bioData.massa_magra} onChange={e => setBioData({...bioData, massa_magra: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Músculo Esq. (kg)</label>
                                        <Input type="number" step="0.1" value={bioData.musculo_esqueletico} onChange={e => setBioData({...bioData, musculo_esqueletico: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Água %</label>
                                        <Input type="number" step="0.1" value={bioData.agua} onChange={e => setBioData({...bioData, agua: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Retenção</label>
                                        <select 
                                            className="w-full p-2 border rounded-md text-sm h-10 dark:bg-gray-900 dark:border-gray-600"
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

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">TMB (Kcal)</label>
                                        <Input type="number" value={bioData.tmb} onChange={e => setBioData({...bioData, tmb: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Idade Metab.</label>
                                        <Input type="number" value={bioData.idade_metabolica} onChange={e => setBioData({...bioData, idade_metabolica: e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">RCQ (Cintura/Quadril)</label>
                                        <Input type="number" step="0.01" value={bioData.rcq} onChange={e => setBioData({...bioData, rcq: e.target.value})} placeholder="Ex: 0.85" />
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-blue-200 pt-4">
                                    <label className="text-xs font-bold text-blue-700 uppercase mb-2 block flex items-center gap-2">
                                        <UploadCloud size={14} /> Upload Folha da Balança
                                    </label>
                                    <ImageUpload 
                                        label="Foto do Relatório" 
                                        folder={`bioimpedancia/${patientId}`} 
                                        onUpload={(url) => setBioData({...bioData, arquivo: url})} 
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-medium dark:text-gray-300">
                                {isBio ? "Observações / Interpretação" : "Anotações do Procedimento"}
                            </label>
                            <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-4 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                placeholder="Detalhes adicionais..."
                            />
                        </div>
                    </div>
                    
                    {!isBio && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <SignaturePad onEnd={setSignatureDataURL} isLoading={isSubmitting} />
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-6">
                        <h2 className="font-semibold text-lg mb-4 dark:text-white flex items-center gap-2">
                            📸 Fotos da Sessão
                        </h2>
                        <div className="space-y-6">
                            <ImageUpload label="Antes" folder={`prontuario/${patientId}`} onUpload={url => setPhotos(p => ({...p, before: url}))} />
                            <ImageUpload label="Depois" folder={`prontuario/${patientId}`} onUpload={url => setPhotos(p => ({...p, after: url}))} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t dark:border-gray-700">
                <Button onClick={handleSaveEvolution} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg shadow-lg">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                    {isBio ? "Salvar Bioimpedância" : "Finalizar Sessão"}
                </Button>
            </div>
        </div>
    );
}