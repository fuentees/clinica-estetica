import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BeforeAfter } from '../BeforeAfter';
import { ImageUpload } from '../ImageUpload'; 
import { Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PhotoPair {
  id: string;
  before_url: string;
  after_url: string;
  description: string;
  created_at: string;
}

// ✅ CORREÇÃO AQUI: O tipo da prop deve bater com o nome usado ({ patientId }: { patientId: string })
export function PatientGallery({ patientId }: { patientId: string }) {
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
        .eq('patient_id', patientId) // Aqui usamos o ID passado via prop
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
        patient_id: patientId, // Mapeia a prop React para a coluna do banco
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

  if (loading) return <div className="p-4"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Área de Upload */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
          <Plus className="bg-pink-600 text-white rounded-lg p-1" size={20} />
          Novo Resultado
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ImageUpload label="Foto Antes" folder="pacientes" onUpload={setNewBefore} />
          <ImageUpload label="Foto Depois" folder="pacientes" onUpload={setNewAfter} />
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Descrição do Procedimento</label>
             <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Harmonização Facial - 1ª Sessão"
                className="w-full h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
             />
          </div>
          <button 
            onClick={handleSave}
            disabled={isUploading || !newBefore}
            className="h-12 px-6 bg-gray-900 hover:bg-green-600 text-white rounded-xl font-black uppercase text-xs tracking-widest disabled:opacity-50 flex gap-2 items-center transition-all shadow-lg min-w-fit"
          >
            {isUploading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} Salvar Resultado
          </button>
        </div>
      </div>

      {/* Lista de Fotos Salvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {photos.map((photo) => (
          <div key={photo.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                  <span className="block font-black text-gray-900 dark:text-white uppercase italic tracking-tighter text-lg">{photo.description || "Sem descrição"}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(photo.created_at).toLocaleDateString()}</span>
              </div>
              <button onClick={() => handleDelete(photo.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
            </div>
            
            <div className="h-80 w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
              <BeforeAfter beforeImage={photo.before_url} afterImage={photo.after_url || photo.before_url} />
            </div>
          </div>
        ))}
      </div>
      
      {photos.length === 0 && !loading && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[3rem]">
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhuma foto na galeria.</p>
          </div>
      )}
    </div>
  );
}