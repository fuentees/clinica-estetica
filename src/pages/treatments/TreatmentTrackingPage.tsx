import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Upload, FileText, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { usePatientTreatments } from '../../hooks/usePatientTreatments';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { ProgressForm } from './components/ProgressForm';

export function TreatmentTrackingPage() {
  const { id } = useParams();
  const { data: treatments, isLoading, refetch } = usePatientTreatments(id!);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (treatmentId: string, file: File) => {
    try {
      setUploading(true);
      const fileName = `${treatmentId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('treatment-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('patient_treatments')
        .update({
          photos: supabase.sql`array_append(photos, ${fileName})`
        })
        .eq('id', treatmentId);

      if (updateError) throw updateError;

      toast.success('Foto adicionada com sucesso!');
      refetch();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Acompanhamento de Tratamentos</h1>

      <div className="space-y-6">
        {treatments?.map((treatment) => (
          <div key={treatment.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{treatment.treatments.name}</h2>
                <p className="text-gray-600">{treatment.treatments.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTreatment(treatment.id);
                    setShowProgressForm(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Registrar Evolução
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`photo-${treatment.id}`)?.click()}
                  disabled={uploading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Adicionar Foto'}
                </Button>
                <input
                  type="file"
                  id={`photo-${treatment.id}`}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePhotoUpload(treatment.id, file);
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Histórico de Sessões
                </h3>
                <div className="space-y-2">
                  {treatment.appointments?.map((appointment, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{format(new Date(appointment.start_time), 'dd/MM/yyyy HH:mm')}</span>
                      <span className={`px-2 py-1 rounded text-sm
                        ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Observações e Recomendações
                </h3>
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-sm text-yellow-800">{treatment.notes || 'Nenhuma observação registrada'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Fotos do Progresso</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {treatment.photos?.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={`${supabase.storage.from('treatment-photos').getPublicUrl(photo).data.publicUrl}`}
                      alt={`Progresso ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg">
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-sm">
                          {format(new Date(photo.split('/')[1].split('-')[0]), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showProgressForm && selectedTreatment && (
        <ProgressForm
          treatmentId={selectedTreatment}
          onClose={() => {
            setShowProgressForm(false);
            setSelectedTreatment(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}