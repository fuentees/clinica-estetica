import { useState, useEffect } from 'react';
// Correção dos caminhos:
import { supabase } from '../../lib/supabase'; // Sobe 2 níveis para achar lib
import { BeforeAfter } from '../BeforeAfter'; // Sobe 1 nível para achar components
import { ImageUpload } from '../ImageUpload'; // Sobe 1 nível para achar components
import { Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PhotoPair {
  id: string;
  before_url: string;
  after_url: string;
  description: string;
  created_at: string;
}

export function PatientGallery({ patientId }: { patient_id: string }) {
  const [photos, setPhotos] = useState<PhotoPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [newBefore, setNewBefore] = useState('');
  const [newAfter, setNewAfter] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchPhotos();
  }, [patientId]);

  async function fetchPhotos() {
    try {
      const { data, error } = await supabase
        .from('patient_photos')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Erro ao buscar fotos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!newBefore) {
      toast.error('A foto do "Antes" é obrigatória!');
      return;
    }

    try {
      setIsUploading(true);
      const { error } = await supabase.from('patient_photos').insert({
        patient_id: patientId,
        before_url: newBefore,
        after_url: newAfter || newBefore,
        description: description
      });

      if (error) throw error;

      toast.success('Fotos salvas!');
      setNewBefore('');
      setNewAfter('');
      setDescription('');
      fetchPhotos();
    } catch (error) {
      toast.error('Erro ao salvar.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza?')) return;
    try {
      await supabase.from('patient_photos').delete().eq('id', id);
      toast.success('Apagado');
      setPhotos(photos.filter(p => p.id !== id));
    } catch (error) {
      toast.error('Erro ao apagar');
    }
  }

  if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* Área de Upload */}
      <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="bg-pink-600 text-white rounded-full p-1" size={24} />
          Novo Resultado
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <ImageUpload label="Foto Antes" folder="pacientes" onUpload={setNewBefore} />
          <ImageUpload label="Foto Depois" folder="pacientes" onUpload={setNewAfter} />
        </div>

        <div className="flex gap-4 items-end">
          <input 
            type="text" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (Ex: Botox Glabela)"
            className="flex-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <button 
            onClick={handleSave}
            disabled={isUploading || !newBefore}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex gap-2 items-center"
          >
            {isUploading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} Salvar
          </button>
        </div>
      </div>

      {/* Lista de Fotos Salvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {photos.map((photo) => (
          <div key={photo.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-700 dark:text-gray-300">{photo.description}</span>
              <button onClick={() => handleDelete(photo.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
            </div>
            <div className="h-64">
              <BeforeAfter beforeImage={photo.before_url} afterImage={photo.after_url || photo.before_url} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}