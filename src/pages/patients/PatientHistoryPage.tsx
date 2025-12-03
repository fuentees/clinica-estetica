import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, Plus, Calendar, FileText, Save, Loader2, Trash2 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ImageUpload } from '../../components/ImageUpload';
import { BeforeAfter } from '../../components/BeforeAfter';
import { toast } from 'react-hot-toast';

export function PatientHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [treatmentsList, setTreatmentsList] = useState<any[]>([]);
  
  // Estado do Formulário de Novo Registro
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRecord, setNewRecord] = useState({
    treatment_id: '',
    notes: '',
    photo_before: '',
    photo_after: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      // 1. Busca dados do paciente
      const { data: patientData } = await supabase
        .from('patients')
        .select(`*, profiles:profile_id (*)`)
        .eq('id', id)
        .single();
      
      setPatient(patientData);

      // 2. Busca lista de tratamentos disponíveis (para o select)
      const { data: treatmentsData } = await supabase
        .from('treatments')
        .select('*')
        .order('name');
      
      setTreatmentsList(treatmentsData || []);

      // 3. Busca o histórico clínico
      fetchHistory();

    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    const { data } = await supabase
      .from('patient_treatments')
      .select(`
        *,
        treatments (name)
      `)
      .eq('patient_id', id)
      .order('created_at', { ascending: false });
    
    setHistory(data || []);
  }

  async function handleSave() {
    if (!newRecord.treatment_id) {
      toast.error('Selecione qual procedimento foi realizado.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Monta o objeto de fotos
      const photosJson = {
        before: newRecord.photo_before,
        after: newRecord.photo_after
      };

      const { error } = await supabase.from('patient_treatments').insert({
        patient_id: id,
        treatment_id: newRecord.treatment_id,
        notes: newRecord.notes,
        photos: photosJson,
        created_at: new Date().toISOString() // Data de hoje
      });

      if (error) throw error;

      toast.success('Procedimento registrado!');
      setShowForm(false);
      setNewRecord({ treatment_id: '', notes: '', photo_before: '', photo_after: '' });
      fetchHistory(); // Atualiza a lista

    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(recordId: string) {
    if(!confirm("Tem certeza que deseja apagar este registro?")) return;
    await supabase.from('patient_treatments').delete().eq('id', recordId);
    fetchHistory();
    toast.success("Registro apagado.");
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Cabeçalho do Paciente */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/patients')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Prontuário Estético</h1>
            <p className="text-gray-500">
              {patient?.profiles?.first_name} {patient?.profiles?.last_name}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)} 
          className={`${showForm ? 'bg-gray-500' : 'bg-pink-600'} text-white`}
        >
          {showForm ? 'Cancelar' : <><Plus size={18} className="mr-2" /> Registrar Procedimento</>}
        </Button>
      </div>

      {/* --- FORMULÁRIO DE NOVO REGISTRO (Abre ao clicar no botão) --- */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-pink-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Novo Atendimento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lado Esquerdo: Dados */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Procedimento Realizado</label>
                <select 
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  value={newRecord.treatment_id}
                  onChange={e => setNewRecord({...newRecord, treatment_id: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {treatmentsList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anotações Clínicas</label>
                <textarea 
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  rows={4}
                  placeholder="Ex: Aplicado 50U de Dysport. Paciente relatou sensibilidade..."
                  value={newRecord.notes}
                  onChange={e => setNewRecord({...newRecord, notes: e.target.value})}
                />
              </div>
            </div>

            {/* Lado Direito: Fotos */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
              <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300">Registro Fotográfico</h3>
              <div className="grid grid-cols-2 gap-4">
                <ImageUpload 
                  label="Antes" 
                  folder="prontuario" 
                  onUpload={(url) => setNewRecord({...newRecord, photo_before: url})} 
                />
                <ImageUpload 
                  label="Depois (Imediato)" 
                  folder="prontuario" 
                  onUpload={(url) => setNewRecord({...newRecord, photo_after: url})} 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto">
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
              Salvar no Prontuário
            </Button>
          </div>
        </div>
      )}

      {/* --- LINHA DO TEMPO (TIMELINE) --- */}
      <div className="space-y-6">
        {history.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-gray-500">Nenhum procedimento registrado neste prontuário.</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
              
              {/* Botão de Excluir (Discreto) */}
              <button 
                onClick={() => handleDelete(item.id)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                title="Excluir registro"
              >
                <Trash2 size={16} />
              </button>

              {/* Cabeçalho do Item */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start gap-4">
                <div className="p-3 bg-pink-100 text-pink-600 rounded-lg">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    {item.treatments?.name || 'Procedimento sem nome'}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    Realizado em {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Conteúdo: Notas e Fotos */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Notas */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Anotações</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                    {item.notes || 'Nenhuma observação registrada.'}
                  </div>
                </div>

                {/* Fotos */}
                {item.photos && (item.photos.before || item.photos.after) ? (
                  <div className="h-64">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Resultado</h4>
                    <BeforeAfter 
                      beforeImage={item.photos.before || "https://placehold.co/400x300?text=Sem+Foto"}
                      afterImage={item.photos.after || item.photos.before}
                      labelBefore="Antes"
                      labelAfter="Depois"
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg text-gray-400 text-sm italic">
                    Sem fotos registradas
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}