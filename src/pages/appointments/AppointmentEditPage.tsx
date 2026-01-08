import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Calendar, Clock, User, FileText, Save, ArrowLeft, 
  Loader2, Sparkles, Stethoscope 
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { addMinutes } from "date-fns";

export default function AppointmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]); 
  const [patientName, setPatientName] = useState("Carregando...");
  const [clinicId, setClinicId] = useState<string | null>(null);

  // CORREÇÃO: Padronizei tudo para snake_case para bater com o banco
  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    professional_id: "", // snake_case
    service_id: "",      // snake_case (antes estava serviceId)
    notes: ""
  });

  // --- 1. CARREGAR DADOS INICIAIS ---
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);

        // 1. Pega Usuário e Clínica Atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");

        const { data: profile } = await supabase
          .from('profiles')
          .select('clinic_id:clinic_id')
          .eq('id', user.id)
          .single();

        if (!profile?.clinic_id) throw new Error("Sem clínica vinculada");
        setClinicId(profile.clinic_id);

        // 2. Carregar Profissionais
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, first_name, last_name, role') 
          .eq('clinic_id', profile.clinic_id)
          .in('role', ['profissional', 'admin', 'doutor', 'esteticista', 'recepcionista']);
        
        // 3. Carregar Serviços
        const { data: servs } = await supabase
          .from('services')
          .select('id, name, duration')
          .eq('clinic_id', profile.clinic_id)
          .eq('isActive', true);

        setProfessionals(profs || []);
        setServices(servs || []);

        // 4. Carregar O Agendamento
        const { data: appointment, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patients ( name )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        // 5. Preencher o Estado
        if (appointment) {
          const dbDate = new Date(appointment.start_time); 
          const dateStr = dbDate.toISOString().split('T')[0]; 
          const timeStr = dbDate.toTimeString().slice(0, 5);

          setFormData({
            date: dateStr,
            start_time: timeStr,
            professional_id: appointment.professional_id, // Já vem snake_case do banco
            service_id: appointment.service_id,           // Já vem snake_case do banco
            notes: appointment.notes || ""
          });

          const pName = Array.isArray(appointment.patient) 
            ? appointment.patient[0]?.name 
            : appointment.patient?.name;
            
          setPatientName(pName || 'Paciente');
        }
      } catch (error) {
        console.error(error);
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
    if (!clinicId) return;
    
    setSaving(true);
    try {
      // 1. Validar e Construir Datas
      const combinedDateTimeString = `${formData.date}T${formData.start_time}:00`;
      const startAt = new Date(combinedDateTimeString);

      // CORREÇÃO: Usando service_id padronizado
      const selectedService = services.find(s => s.id === formData.service_id);
      const duration = selectedService?.duration || 30; 
      const endAt = addMinutes(startAt, duration);

      // 2. Payload CORRIGIDO (Estado bate com Banco)
      const payload = {
        start_time: startAt.toISOString(),
        end_time: endAt.toISOString(),
        professional_id: formData.professional_id, // ✅ Agora existe no state
        service_id: formData.service_id,           // ✅ Agora existe no state
        notes: formData.notes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Agendamento atualizado!");
      navigate(-1); 
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10"/></div>;

  return (
    <div className="min-h-screen p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-900 animate-in fade-in duration-500">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
        
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300"/>
            </Button>
            <h1 className="text-2xl font-bold dark:text-white">Editar Agendamento</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
            {/* CARD PACIENTE */}
            <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl flex items-center gap-3 border border-pink-100 dark:border-pink-900/30">
                <div className="bg-white dark:bg-gray-800 p-2.5 rounded-full text-pink-600 shadow-sm"><User size={20}/></div>
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Paciente</p>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{patientName}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-bold mb-2 block dark:text-white flex items-center gap-2">
                        <Calendar size={16} className="text-pink-500"/> Data
                    </label>
                    <input 
                        type="date" 
                        required 
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})} 
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="text-sm font-bold mb-2 block dark:text-white flex items-center gap-2">
                        <Clock size={16} className="text-pink-500"/> Horário
                    </label>
                    <input 
                        type="time" 
                        required 
                        value={formData.start_time} 
                        onChange={e => setFormData({...formData, start_time: e.target.value})} 
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-bold mb-2 block dark:text-white flex items-center gap-2">
                        <Stethoscope size={16} className="text-blue-500"/> Profissional
                    </label>
                    <select 
                        // CORREÇÃO: value e onChange usando professional_id (snake_case)
                        value={formData.professional_id} 
                        onChange={e => setFormData({...formData, professional_id: e.target.value})} 
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    >
                        <option value="">Selecione...</option>
                        {professionals.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.first_name} {p.last_name || ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-bold mb-2 block dark:text-white flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-500"/> Procedimento
                    </label>
                    <select 
                        // CORREÇÃO: value e onChange usando service_id (snake_case)
                        value={formData.service_id} 
                        onChange={e => setFormData({...formData, service_id: e.target.value})} 
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    >
                        <option value="">Selecione...</option>
                        {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="text-sm font-bold mb-2 block dark:text-white flex items-center gap-2">
                    <FileText size={16} className="text-gray-400"/> Notas Internas
                </label>
                <textarea 
                    rows={3} 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none"
                    placeholder="Observações sobre o agendamento..."
                />
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-gray-900 hover:bg-black text-white h-12 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
                {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </form>
      </div>
    </div>
  );
}