import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Calendar, Clock, User, FileText, Save, ArrowLeft, 
  Loader2, Sparkles, Stethoscope // Ícones para uso no JSX
} from "lucide-react";
import { Button } from "../../components/ui/button";

export default function AppointmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [patientName, setPatientName] = useState("Carregando...");

  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    professional_id: "",
    treatment_id: "",
    notes: ""
  });

  // --- 1. CARREGAR DADOS INICIAIS ---
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        // 1. Carregar listas
        const { data: profs } = await supabase.from('professionals').select('id, first_name, last_name');
        const { data: treats } = await supabase.from('treatments').select('id, name');
        setProfessionals(profs || []);
        setTreatments(treats || []);

        // 2. Carregar Agendamento
        const { data: appointment, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patient_id(name, profiles(first_name, last_name))
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        // 3. Preencher o Estado
        if (appointment) {
          setFormData({
            date: appointment.date,
            start_time: appointment.start_time,
            professional_id: appointment.professional_id,
            treatment_id: appointment.treatment_id,
            notes: appointment.notes || ""
          });

          // Nome do Paciente
          const p = Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient;
          let name = p?.name || 'Paciente';
          const prof = Array.isArray(p?.profiles) ? p.profiles[0] : p?.profiles;
          if (prof?.first_name) name = `${prof.first_name} ${prof.last_name || ''}`;
          setPatientName(name);
        }
      } catch (error) {
        toast.error("Erro ao carregar dados.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, navigate]);

  // --- 2. SALVAR ALTERAÇÕES ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('appointments').update(formData).eq('id', id);
      if (error) throw error;
      toast.success("Atualizado com sucesso!");
      navigate(-1); 
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10"/></div>;

  return (
    <div className="min-h-screen p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full h-10 w-10 p-0"><ArrowLeft/></Button>
            <h1 className="text-2xl font-bold dark:text-white">Editar Agendamento</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
            {/* Card Paciente (Apenas leitura) */}
            <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl flex items-center gap-3">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-full text-pink-600"><User/></div>
                <div><p className="text-xs font-bold text-gray-500 uppercase">Paciente</p><p className="font-bold text-gray-900 dark:text-white">{patientName}</p></div>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-bold mb-1 block dark:text-white flex items-center gap-2">
                        <Calendar size={16} className="text-pink-500"/> Data
                    </label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:text-white"/>
                </div>
                <div>
                    <label className="text-sm font-bold mb-1 block dark:text-white flex items-center gap-2">
                        <Clock size={16} className="text-pink-500"/> Horário
                    </label>
                    <input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:text-white"/>
                </div>
            </div>

            {/* Profissional e Tratamento */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-bold mb-1 block dark:text-white flex items-center gap-2">
                        <Stethoscope size={16} className="text-blue-500"/> Profissional
                    </label>
                    <select value={formData.professional_id} onChange={e => setFormData({...formData, professional_id: e.target.value})} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:text-white">
                        <option value="">Selecione...</option>
                        {professionals.map(p => <option key={p.id} value={p.id}>{p.first_name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-bold mb-1 block dark:text-white flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-500"/> Procedimento
                    </label>
                    <select value={formData.treatment_id} onChange={e => setFormData({...formData, treatment_id: e.target.value})} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:text-white">
                        <option value="">Selecione...</option>
                        {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Notas */}
            <div>
                <label className="text-sm font-bold mb-1 block dark:text-white flex items-center gap-2">
                    <FileText size={16} className="text-gray-400"/> Notas
                </label>
                <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:text-white"/>
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-pink-600 hover:bg-pink-700 text-white h-12 rounded-xl">
                {saving ? <Loader2 className="animate-spin"/> : <div className="flex items-center gap-2"><Save size={18}/> Salvar Alterações</div>}
            </Button>
        </form>
      </div>
    </div>
  );
}