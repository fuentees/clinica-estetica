import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, FileText, Calendar, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { usePatientTreatments } from '../../hooks/usePatientTreatments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { ProgressForm } from './components/ProgressForm';

// Interfaces ajustadas para flexibilidade
interface Appointment {
  id: string;
  start_time: string;
  status: string;
}

interface Treatment {
  id: string;
  // Tenta ler de 'services' (novo padrão) ou 'treatments' (antigo)
  services?: { name: string; description: string }; 
  treatments?: { name: string; description: string };
  notes: string;
  appointments: Appointment[];
  photos: string[];
}

export function TreatmentTrackingPage() {
  const { id } = useParams();
  
  // Hook de busca de dados
  const { data: rawData, isLoading, refetch } = usePatientTreatments(id || '');
  
  // Cast seguro e log para debug
  const treatments = (rawData || []) as unknown as Treatment[];

  useEffect(() => {
      if(rawData) console.log("DEBUG: Dados recebidos no Tracking:", rawData);
  }, [rawData]);

  const [showProgressForm, setShowProgressForm] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Função segura para extrair data do nome do arquivo
  const getPhotoDate = (path: string) => {
    try {
      const filename = path.split('/').pop();
      if (!filename) return new Date();
      
      const timestampStr = filename.split('-')[0];
      const timestamp = parseInt(timestampStr);
      
      if (isNaN(timestamp)) return new Date();
      
      return new Date(timestamp);
    } catch (e) {
      return new Date();
    }
  };

  const handlePhotoUpload = async (treatmentId: string, file: File) => {
    try {
      setUploading(true);
      const timestamp = Date.now();
      
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${treatmentId}/${timestamp}-${cleanFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('treatment-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const currentTreatment = treatments?.find(t => t.id === treatmentId);
      const currentPhotos = Array.isArray(currentTreatment?.photos) ? currentTreatment.photos : [];

      // Tenta atualizar na tabela correta
      const { error: updateError } = await supabase
        .from('patient_treatments') // Verifique se este é o nome real da tabela de vínculo
        .update({ photos: [...currentPhotos, fileName] })
        .eq('id', treatmentId);

      if (updateError) throw updateError;

      toast.success('Registro visual adicionado!');
      refetch();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-pink-600 w-12 h-12" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Sincronizando Histórico Clínico...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Monitoramento de <span className="text-pink-600">Tratamentos</span></h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Evolução clínica e registros fotográficos do paciente</p>
        </div>
      </div>

      {/* LISTA DE TRATAMENTOS EM ANDAMENTO */}
      <div className="space-y-8">
        {treatments.length === 0 ? (
            <div className="p-20 text-center bg-gray-50 dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">Nenhum tratamento ativo encontrado para este paciente.</p>
                <p className="text-xs text-gray-400 mt-2">Certifique-se de ter criado um Plano de Tratamento e aprovado.</p>
            </div>
        ) : (
            treatments.map((treatment) => {
            // Lógica de Fallback para nome do serviço
            const serviceName = treatment.services?.name || treatment.treatments?.name || 'Tratamento Sem Nome';
            const serviceDesc = treatment.services?.description || treatment.treatments?.description || '';

            const appointmentsList = Array.isArray(treatment.appointments) 
                ? treatment.appointments 
                : treatment.appointments ? [treatment.appointments] : [];
            
            const photosList = Array.isArray(treatment.photos) 
                ? [...treatment.photos].sort((a, b) => getPhotoDate(b).getTime() - getPhotoDate(a).getTime())
                : [];

            return (
                <div key={treatment.id} className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group">
                
                {/* BARRA DE TÍTULO */}
                <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/50">
                    <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{serviceName}</h2>
                    <p className="text-sm text-gray-500 font-medium italic mt-1">{serviceDesc}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-gray-200"
                        onClick={() => {
                        setSelectedTreatment(treatment.id);
                        setShowProgressForm(true);
                        }}
                    >
                        <FileText className="w-4 h-4 mr-2 text-pink-500" /> Registrar Evolução
                    </Button>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-gray-900 text-white border-0 hover:bg-black dark:bg-white dark:text-black"
                        onClick={() => document.getElementById(`photo-${treatment.id}`)?.click()}
                        disabled={uploading}
                    >
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2 text-pink-400" />}
                        {uploading ? 'Enviando...' : 'Adicionar Foto'}
                    </Button>
                    <input
                        type="file"
                        id={`photo-${treatment.id}`}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(treatment.id, file);
                        e.target.value = ''; 
                        }}
                    />
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    
                    {/* HISTÓRICO */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" /> Histórico de Sessões
                        </h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {appointmentsList.length > 0 ? appointmentsList.map((appointment, index) => (
                            <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 group/item hover:border-pink-200 transition-all">
                            <span className="font-bold text-sm italic">
                                {format(new Date(appointment.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2
                                ${appointment.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                appointment.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                'bg-gray-100 text-gray-800'}`}>
                                {appointment.status === 'completed' ? 'Realizada' : 
                                appointment.status === 'scheduled' ? 'Agendada' : appointment.status}
                            </span>
                            </div>
                        )) : (
                            <p className="text-xs text-gray-400 font-medium italic p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200">Nenhuma sessão vinculada.</p>
                        )}
                        </div>
                    </div>

                    {/* NOTAS */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" /> Planejamento & Notas
                        </h3>
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-[2rem] border-2 border-dashed border-amber-100 dark:border-amber-900/30 h-full">
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium leading-relaxed italic">
                            "{treatment.notes || 'Nenhuma recomendação específica registrada para este protocolo.'}"
                        </p>
                        </div>
                    </div>
                    </div>

                    {/* FOTOS */}
                    <div className="mt-12 space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-500" /> Galeria de Evolução Facial/Corporal
                    </h3>
                    {photosList.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {photosList.map((photo, index) => {
                                const photoDate = getPhotoDate(photo);
                                return (
                                <div key={index} className="relative group aspect-square rounded-[1.5rem] overflow-hidden border-2 border-gray-100 dark:border-gray-700 hover:border-pink-500 transition-all shadow-sm cursor-pointer">
                                    <img
                                        src={`${supabase.storage.from('treatment-photos').getPublicUrl(photo).data.publicUrl}`}
                                        alt={`Evolução ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">
                                            {format(photoDate, 'dd MMM yyyy', { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem] bg-gray-50/50 dark:bg-gray-900/50">
                            <Camera className="mx-auto text-gray-200 mb-3" size={32} />
                            <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Nenhuma foto anexada</p>
                        </div>
                    )}
                    </div>
                </div>
                </div>
            );
            })
        )}
      </div>

      {/* MODAL DE EVOLUÇÃO (TEXTO) */}
      {showProgressForm && selectedTreatment && (
        <ProgressForm
          treatmentId={selectedTreatment}
          onClose={() => {
            setShowProgressForm(false);
            setSelectedTreatment(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}