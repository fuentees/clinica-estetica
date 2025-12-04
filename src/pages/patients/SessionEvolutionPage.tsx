import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ImageUpload } from '../../components/ImageUpload';
import { SignaturePad } from '../../components/SignaturePad';

// É fundamental que esta linha seja 'export function' para o App.tsx encontrar
export function SessionEvolutionPage() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patient, setPatient] = useState<any>(null);
    
    const [notes, setNotes] = useState('');
    const [sessionNumber, setSessionNumber] = useState(1);
    const [photos, setPhotos] = useState({ before: '', after: '' });
    const [signatureDataURL, setSignatureDataURL] = useState('');

    useEffect(() => {
        if (patientId) fetchPatientDetails();
    }, [patientId]);

    async function fetchPatientDetails() {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select(`id, profiles (first_name, last_name)`)
                .eq('id', patientId)
                .single();
            
            if (error) throw error;
            setPatient(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar paciente.");
        } finally {
            setLoading(false);
        }
    }

    const handleSaveEvolution = async () => {
        if (!notes) return toast.error("Anotações são obrigatórias.");

        setIsSubmitting(true);
        try {
            // Verifica se a tabela tem a coluna signature, senão ignora
            const payload: any = {
                patient_id: patientId,
                notes: `Sessão ${sessionNumber}: ${notes}`,
                photos: photos,
            };
            
            if (signatureDataURL) {
                payload.signature = signatureDataURL;
            }

            const { error } = await supabase.from('patient_treatments').insert(payload);
            
            if (error) throw error;
            
            toast.success("Sessão registrada!");
            navigate(`/patients/${patientId}/history`);
            
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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Nova Sessão</h1>
                    <p className="text-sm text-gray-500">
                        Paciente: {patient?.profiles?.first_name} {patient?.profiles?.last_name}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Esquerda: Dados e Anotações */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="font-semibold text-lg mb-4 dark:text-white flex items-center gap-2">
                            📝 Detalhes do Atendimento
                        </h2>
                        
                        <div className="mb-4 w-32">
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Sessão Nº</label>
                            <Input type="number" value={sessionNumber} onChange={e => setSessionNumber(Number(e.target.value))} />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-medium dark:text-gray-300">Evolução Clínica</label>
                            <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-4 border rounded-lg h-48 resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                placeholder="Descreva o procedimento realizado, produtos utilizados, dosagem e reação do paciente..."
                            />
                        </div>
                    </div>
                    
                    {/* Assinatura do Cliente */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <SignaturePad onEnd={setSignatureDataURL} isLoading={isSubmitting} />
                    </div>
                </div>

                {/* Coluna Direita: Fotos */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-6">
                        <h2 className="font-semibold text-lg mb-4 dark:text-white flex items-center gap-2">
                            📸 Registro Fotográfico
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2 block">Antes</span>
                                <ImageUpload label="Foto Antes" folder={`prontuario/${patientId}`} onUpload={url => setPhotos(p => ({...p, before: url}))} />
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2 block">Depois (Imediato)</span>
                                <ImageUpload label="Foto Depois" folder={`prontuario/${patientId}`} onUpload={url => setPhotos(p => ({...p, after: url}))} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t dark:border-gray-700">
                <Button onClick={handleSaveEvolution} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg shadow-lg">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                    Finalizar Sessão
                </Button>
            </div>
        </div>
    );
}