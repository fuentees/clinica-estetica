import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext"; // Importação adicionada
import { 
    CalendarCheck, User, Clock, Stethoscope, ArrowLeft, Loader2, Calendar, 
    Sparkles, FileText, CheckCircle2
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";
import { addMinutes } from "date-fns"; 

// Interfaces
interface Professional { 
    id: string; 
    first_name: string; 
    last_name?: string; 
}
interface Patient { id: string; name: string; }
interface Service { id: string; name: string; duration: number; }

export function NewAppointmentPage() {
    const navigate = useNavigate();
    const { profile, user, isProfessional, isAdmin } = useAuth(); // Hooks de permissão
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Listas de Dados
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Formulário
    const [formData, setFormData] = useState({
        professional_id: "",
        patient_id: "",
        service_id: "",
        date: new Date().toISOString().split('T')[0],
        time: "09:00",
        notes: ""
    });

    useEffect(() => {
        if (profile?.clinic_id) {
            loadAllData();
        }
    }, [profile]);

    async function loadAllData() {
        try {
            setLoading(true);
            
            if (!profile?.clinic_id) return;

            // Busca TUDO em paralelo
            const [profsReq, patientsReq, servicesReq] = await Promise.all([
                supabase.from("profiles")
                    .select("id, first_name, last_name, role")
                    .eq("clinic_id", profile.clinic_id)
                    .eq("is_active", true)
                    .in("role", ["profissional", "esteticista", "doutor", "admin", "recepcionista"])
                    .order("first_name"),
                
                supabase.from("patients")
                    .select("id, name")
                    .eq("clinic_id", profile.clinic_id)
                    .order("name"),

                supabase.from("services")
                    .select("id, name, duration")
                    .eq("clinic_id", profile.clinic_id)
                    .eq("isActive", true)
                    .order("name")
            ]);

            if (patientsReq.data) setPatients(patientsReq.data);
            if (servicesReq.data) setServices(servicesReq.data);

            if (profsReq.data) {
                setProfessionals(profsReq.data);
                
                // LÓGICA DE SEGURANÇA: 
                // Se for profissional (Larissa), trava o ID dela. Se for Admin, permite escolher.
                if (isProfessional && !isAdmin) {
                    setFormData(prev => ({ ...prev, professional_id: user?.id || "" }));
                } else if (profsReq.data.length > 0) {
                    setFormData(prev => ({ ...prev, professional_id: profsReq.data[0].id }));
                }
            }

        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.professional_id || !formData.patient_id || !formData.service_id || !formData.date || !formData.time) {
            toast.error("Preencha todos os campos obrigatórios.");
            return;
        }

        setSaving(true);
        try {
            const startAt = new Date(`${formData.date}T${formData.time}`);
            const selectedService = services.find(s => s.id === formData.service_id);
            const duration = selectedService?.duration || 30;
            const endAt = addMinutes(startAt, duration);

            const { error } = await supabase.from("appointments").insert({
                clinic_id: profile?.clinic_id,
                patient_id: formData.patient_id,
                professional_id: formData.professional_id,
                service_id: formData.service_id,
                start_time: startAt.toISOString(),
                end_time: endAt.toISOString(),
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

    if (loading) return <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900"><Loader2 className="animate-spin text-pink-600 size-10"/></div>;

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

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                <Stethoscope size={14} className="text-pink-600"/> Profissional
                            </label>
                            <select 
                                value={formData.professional_id}
                                onChange={e => setFormData({...formData, professional_id: e.target.value})}
                                // Desabilita se for profissional ( Larissa não muda o próprio nome)
                                disabled={isProfessional && !isAdmin}
                                className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
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
                                value={formData.service_id}
                                onChange={e => setFormData({...formData, service_id: e.target.value})}
                                className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            >
                                <option value="">Selecione...</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <User size={14} className="text-blue-600"/> Paciente
                        </label>
                        <select 
                            value={formData.patient_id}
                            onChange={e => setFormData({...formData, patient_id: e.target.value})}
                            className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        >
                            <option value="">Selecione o paciente...</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

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