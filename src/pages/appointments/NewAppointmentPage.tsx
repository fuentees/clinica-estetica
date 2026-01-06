import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
    CalendarCheck, User, Clock, Stethoscope, ArrowLeft, Loader2, Calendar, 
    Sparkles, FileText, CheckCircle2
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";
import { addMinutes } from "date-fns"; 

// Interfaces Ajustadas para o Banco
interface Professional { 
    id: string; 
    first_name: string; 
    last_name?: string; 
}
interface Patient { id: string; name: string; }
interface Service { id: string; name: string; duration: number; }

export function NewAppointmentPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clinicId, setClinicId] = useState<string | null>(null);

    // Listas de Dados
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Formulário
    const [formData, setFormData] = useState({
        professionalId: "",
        patientId: "",
        serviceId: "",
        date: new Date().toISOString().split('T')[0], // Hoje
        time: "09:00",
        notes: ""
    });

    useEffect(() => {
        loadAllData();
    }, []);

    async function loadAllData() {
        try {
            setLoading(true);
            
            // 1. Pega usuário e clínica
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não logado");

            const { data: profile } = await supabase.from("profiles").select("clinicId").eq("id", user.id).single();
            if (!profile?.clinicId) throw new Error("Sem clínica");
            
            setClinicId(profile.clinicId);

            // 2. Busca TUDO em paralelo
            const [profsReq, patientsReq, servicesReq] = await Promise.all([
                // Busca Profissionais (com first_name e last_name)
                supabase.from("profiles")
                    .select("id, first_name, last_name, role")
                    .eq("clinicId", profile.clinicId)
                    .eq("is_active", true) // snake_case
                    .in("role", ["profissional", "esteticista", "doutor", "admin", "recepcionista"])
                    .order("first_name"),
                
                // Busca Pacientes
                supabase.from("patients")
                    .select("id, name")
                    .eq("clinicId", profile.clinicId)
                    .order("name"),

                // Busca Serviços
                supabase.from("services")
                    .select("id, name, duration")
                    .eq("clinicId", profile.clinicId)
                    .eq("isActive", true)
                    .order("name")
            ]);

            // Formata e Salva nos estados
            if (profsReq.data) {
                setProfessionals(profsReq.data);
                // Seleciona o primeiro profissional automaticamente se houver
                if (profsReq.data.length > 0) setFormData(prev => ({ ...prev, professionalId: profsReq.data[0].id }));
            }
            if (patientsReq.data) setPatients(patientsReq.data);
            if (servicesReq.data) setServices(servicesReq.data);

        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação básica
        if (!formData.professionalId || !formData.patientId || !formData.serviceId || !formData.date || !formData.time) {
            toast.error("Preencha todos os campos obrigatórios.");
            return;
        }

        setSaving(true);
        try {
            // 1. Calcular Horários
            const startAt = new Date(`${formData.date}T${formData.time}`);
            
            // Pega a duração do serviço escolhido (ou 30 min padrão)
            const selectedService = services.find(s => s.id === formData.serviceId);
            const duration = selectedService?.duration || 30;
            
            const endAt = addMinutes(startAt, duration);

            // 2. Inserir no Banco (USANDO SNAKE_CASE NAS COLUNAS)
            const { error } = await supabase.from("appointments").insert({
                clinicId: clinicId,
                patient_id: formData.patientId,         // ✅ Corrigido
                professional_id: formData.professionalId, // ✅ Corrigido
                service_id: formData.serviceId,         // ✅ Corrigido
                start_time: startAt.toISOString(),      // ✅ Corrigido
                end_time: endAt.toISOString(),          // ✅ Corrigido
                status: "scheduled",
                notes: formData.notes
            });

            if (error) throw error;

            toast.success("Agendamento criado com sucesso!");
            navigate("/appointments"); 

        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao agendar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-600 size-10"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
            <div className="w-full max-w-2xl">
                
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => navigate("/appointments")} className="rounded-full w-10 h-10 p-0 bg-white shadow-sm hover:bg-gray-100">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CalendarCheck className="text-pink-600"/> Novo Agendamento
                        </h1>
                        <p className="text-sm text-gray-500">Preenchimento rápido de consulta.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-600"></div>

                    {/* Linha 1: Profissional e Serviço */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                <Stethoscope size={14} className="text-pink-600"/> Profissional
                            </label>
                            <select 
                                value={formData.professionalId}
                                onChange={e => setFormData({...formData, professionalId: e.target.value})}
                                className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none"
                                required
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
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                <Sparkles size={14} className="text-purple-600"/> Serviço
                            </label>
                            <select 
                                value={formData.serviceId}
                                onChange={e => setFormData({...formData, serviceId: e.target.value})}
                                className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            >
                                <option value="">Selecione...</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Linha 2: Paciente */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <User size={14} className="text-blue-600"/> Paciente
                        </label>
                        {patients.length > 0 ? (
                            <select 
                                value={formData.patientId}
                                onChange={e => setFormData({...formData, patientId: e.target.value})}
                                className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            >
                                <option value="">Selecione o paciente...</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        ) : (
                            <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded-lg border border-yellow-200">
                                Nenhum paciente cadastrado. Cadastre um paciente primeiro.
                            </div>
                        )}
                    </div>

                    {/* Linha 3: Data e Hora */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                <Calendar size={14} className="text-gray-600"/> Data
                            </label>
                            <input 
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                <Clock size={14} className="text-gray-600"/> Hora
                            </label>
                            <input 
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                                className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <FileText size={14} className="text-gray-400"/> Observações
                        </label>
                        <textarea 
                            rows={2}
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                            placeholder="Alguma observação especial?"
                        />
                    </div>

                    <Button 
                        type="submit" 
                        disabled={saving || patients.length === 0}
                        className="w-full h-12 text-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
                    >
                        {saving ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2"/>}
                        Confirmar Agendamento
                    </Button>
                </form>
            </div>
        </div>
    );
}