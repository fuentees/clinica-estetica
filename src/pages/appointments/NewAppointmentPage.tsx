import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { 
    CalendarCheck, User, Clock, Stethoscope, ArrowLeft, Loader2, Calendar, 
    Sparkles, FileText, CheckCircle2, Search, Info, Package, DoorOpen
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";
import { addMinutes } from "date-fns"; 

interface Professional { id: string; first_name: string; last_name?: string; }
interface Patient { id: string; name: string; }
interface Service { id: string; name: string; duration: number; }
interface InventoryItem { name: string; quantity: number; }

export function NewAppointmentPage() {
    const navigate = useNavigate();
    const { profile, user, isProfessional, isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [serviceKit, setServiceKit] = useState<InventoryItem[]>([]);

    const [patientSearch, setPatientSearch] = useState("");
    const [showPatientList, setShowPatientList] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        professional_id: "",
        patient_id: "",
        service_id: "",
        date: new Date().toISOString().split('T')[0],
        time: "09:00",
        room: "",
        notes: ""
    });

    useEffect(() => {
        if (profile?.clinic_id) {
            loadAllData();
        }
    }, [profile]);

    useEffect(() => {
        if (formData.service_id) {
            const fetchKit = async () => {
                const { data } = await supabase
                    .from('procedure_items')
                    .select('inventory_id, quantity_needed, inventory:inventory_id ( name )')
                    .eq('procedure_id', formData.service_id);
                if (data) {
                    setServiceKit(data.map((item: any) => ({
                        name: item.inventory?.name || 'Insumo',
                        quantity: item.quantity_needed
                    })));
                }
            };
            fetchKit();
        }
    }, [formData.service_id]);

    async function loadAllData() {
        try {
            setLoading(true);
            if (!profile?.clinic_id) return;

            const [profsReq, patientsReq, servicesReq] = await Promise.all([
                supabase.from("profiles").select("id, first_name, last_name, role").eq("clinic_id", profile.clinic_id).eq("is_active", true).in("role", ["profissional", "esteticista", "doutor"]).order("first_name"),
                supabase.from("patients").select("id, name").eq("clinic_id", profile.clinic_id).order("name"),
                supabase.from("services").select("id, name, duration").eq("clinic_id", profile.clinic_id).eq("isActive", true).order("name")
            ]);

            if (patientsReq.data) setPatients(patientsReq.data);
            if (servicesReq.data) setServices(servicesReq.data);
            if (profsReq.data) {
                setProfessionals(profsReq.data);
                if (isProfessional && !isAdmin) {
                    setFormData(prev => ({ ...prev, professional_id: user?.id || "" }));
                } else if (profsReq.data.length > 0) {
                    setFormData(prev => ({ ...prev, professional_id: profsReq.data[0].id }));
                }
            }
        } catch (error) {
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }

    // ✅ FUNÇÃO QUE FALTAVA
    const selectPatient = (p: Patient) => {
        setFormData(prev => ({ ...prev, patient_id: p.id }));
        setPatientSearch(p.name);
        setShowPatientList(false);
    };

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()));

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
                room: formData.room,
                notes: formData.notes
            });
            if (error) throw error;
            toast.success("Agendamento criado com sucesso!");
            navigate("/appointments"); 
        } catch (error: any) {
            toast.error("Erro ao agendar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900"><Loader2 className="animate-spin text-pink-600 size-10"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
            <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" onClick={() => navigate("/appointments")} className="rounded-full w-10 h-10 p-0 bg-white shadow-sm hover:bg-gray-100"><ArrowLeft size={20} /></Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><CalendarCheck className="text-pink-600"/> Novo Agendamento</h1>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-600"></div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Stethoscope size={14} className="text-pink-600"/> Profissional</label>
                                <select value={formData.professional_id} onChange={e => setFormData({...formData, professional_id: e.target.value})} disabled={isProfessional && !isAdmin} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none disabled:opacity-70" required>
                                    <option value="">Selecione...</option>
                                    {professionals.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name || ''}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Sparkles size={14} className="text-purple-600"/> Serviço</label>
                                <select value={formData.service_id} onChange={e => setFormData({...formData, service_id: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none" required>
                                    <option value="">Selecione...</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><User size={14} className="text-blue-600"/> Paciente</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type="text" placeholder="Pesquisar paciente..." value={patientSearch} onFocus={() => setShowPatientList(true)} onChange={(e) => { setPatientSearch(e.target.value); setShowPatientList(true); }} className="w-full pl-10 p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                                {showPatientList && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                        {filteredPatients.map(p => (
                                            <button key={p.id} type="button" onClick={() => selectPatient(p)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold border-b last:border-0">{p.name}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block"><Calendar size={14} className="inline mr-1"/> Data</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block"><Clock size={14} className="inline mr-1"/> Hora</label>
                                <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block"><DoorOpen size={14} className="inline mr-1"/> Sala</label>
                                <select value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="">Opcional</option>
                                    {["Sala 1", "Sala 2", "Consultório 1"].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><FileText size={14}/> Observações</label>
                            <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 outline-none resize-none" placeholder="Notas internas..."/>
                        </div>

                        <Button type="submit" disabled={saving} className="w-full h-12 text-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.01]">
                            {saving ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2"/>} Confirmar Agendamento
                        </Button>
                    </form>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-xl border-t-4 border-pink-500 sticky top-6">
                        <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2"><Info size={16} className="text-pink-500"/> Logística</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[10px] font-black uppercase text-pink-400 mb-2 flex items-center gap-2"><Package size={12}/> Materiais</p>
                                {serviceKit.length > 0 ? (
                                    <div className="space-y-2">
                                        {serviceKit.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-xs font-bold">
                                                <span className="text-gray-300">{item.name}</span>
                                                <span className="text-pink-500">{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-gray-500 italic">Selecione o serviço...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}