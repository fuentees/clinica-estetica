import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Calendar, Clock, User, FileText, Save, ArrowLeft, 
  Loader2, Sparkles, Stethoscope, Info, Package, DoorOpen, CheckCircle2, XCircle, UserX, Check
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { addMinutes, format } from "date-fns";

interface InventoryItem { name: string; quantity: number; unit: string; }

export default function AppointmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]); 
  const [patientName, setPatientName] = useState("Carregando...");
  const [serviceKit, setServiceKit] = useState<InventoryItem[]>([]);

  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    professional_id: "",
    service_id: "",
    room: "",
    status: "scheduled", // ✅ Adicionado status ao estado
    notes: ""
  });

  const AVAILABLE_ROOMS = ["Sala 1 - Facial", "Sala 2 - Corporal", "Consultório 1", "Consultório 2", "Box 3"];

  // --- 1. CARREGAR DADOS ---
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single();
        if (!profile?.clinic_id) throw new Error("Sem clínica vinculada");

        const [profs, servs] = await Promise.all([
          supabase.from('profiles').select('id, first_name, last_name, role').eq('clinic_id', profile.clinic_id).in('role', ['profissional', 'esteticista', 'doutor', 'biomedica']),
          supabase.from('services').select('id, name, duration').eq('clinic_id', profile.clinic_id)
        ]);

        setProfessionals(profs.data || []);
        setServices(servs.data || []);

        const { data: appointment, error } = await supabase
          .from('appointments')
          .select(`*, patient:patients ( name )`)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (appointment) {
          const dbDate = new Date(appointment.start_time); 
          setFormData({
            date: format(dbDate, 'yyyy-MM-dd'),
            start_time: dbDate.toTimeString().slice(0, 5),
            professional_id: appointment.professional_id,
            service_id: appointment.service_id,
            room: appointment.room || "",
            status: appointment.status || "scheduled",
            notes: appointment.notes || ""
          });
          setPatientName(appointment.patient?.name || 'Paciente');
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

  // ✅ BUSCA DE KIT
  useEffect(() => {
    const fetchKit = async () => {
      if (!formData.service_id) {
        setServiceKit([]);
        return;
      }
      try {
        const { data: items } = await supabase.from('procedure_items').select('inventory_id, quantity_needed').eq('procedure_id', formData.service_id); 
        if (items && items.length > 0) {
          const invIds = items.map(i => i.inventory_id);
          const { data: invData } = await supabase.from('inventory').select('id, name').in('id', invIds);
          if (invData) {
            setServiceKit(items.map(item => {
              const info = invData.find(iv => iv.id === item.inventory_id);
              return { name: info?.name || 'Insumo', quantity: item.quantity_needed, unit: 'un' };
            }));
          }
        } else { setServiceKit([]); }
      } catch (err) { setServiceKit([]); }
    };
    fetchKit();
  }, [formData.service_id]);

  // ✅ FUNÇÃO PARA ATUALIZAR STATUS (Gatilho de Estoque/Financeiro)
  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setFormData(prev => ({ ...prev, status: newStatus }));
      toast.success(`Status alterado para ${newStatus.toUpperCase()}`);
      
      if (newStatus === 'completed') {
        toast.success("Pronto para baixa de estoque!");
      }
    } catch (error: any) {
      toast.error("Erro ao mudar status.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const startAt = new Date(`${formData.date}T${formData.start_time}:00`);
      const selectedService = services.find(s => s.id === formData.service_id);
      const endAt = addMinutes(startAt, selectedService?.duration || 30);

      const { error } = await supabase.from('appointments').update({
          start_time: startAt.toISOString(),
          end_time: endAt.toISOString(),
          professional_id: formData.professional_id,
          service_id: formData.service_id,
          room: formData.room,
          status: formData.status,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        }).eq('id', id);

      if (error) throw error;
      toast.success("Alterações salvas!");
      navigate(-1); 
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"><Loader2 className="animate-spin text-pink-600 w-12 h-12"/></div>;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900 animate-in fade-in">
      <div className="max-w-[1400px] mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="bg-white dark:bg-gray-800 shadow-sm border rounded-xl"><ArrowLeft size={20} /></Button>
            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Gerenciar <span className="text-pink-600">Agendamento</span></h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Controle de Fluxo Vilagi</p>
            </div>
        </div>

        {/* ✅ BARRA DE STATUS INTELIGENTE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Button type="button" variant="outline" onClick={() => handleUpdateStatus('confirmed')} className={`h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 transition-all ${formData.status === 'confirmed' ? 'bg-purple-600 text-white border-none shadow-lg' : 'border-purple-100 text-purple-600 hover:bg-purple-50'}`}>
                <Check size={16}/> Confirmar
            </Button>
            <Button type="button" variant="outline" onClick={() => handleUpdateStatus('completed')} className={`h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 transition-all ${formData.status === 'completed' ? 'bg-emerald-600 text-white border-none shadow-lg' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}>
                <CheckCircle2 size={16}/> Realizado
            </Button>
            <Button type="button" variant="outline" onClick={() => handleUpdateStatus('no_show')} className={`h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 transition-all ${formData.status === 'no_show' ? 'bg-gray-600 text-white border-none shadow-lg' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}>
                <UserX size={16}/> Faltou
            </Button>
            <Button type="button" variant="outline" onClick={() => handleUpdateStatus('canceled')} className={`h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 transition-all ${formData.status === 'canceled' ? 'bg-rose-600 text-white border-none shadow-lg' : 'border-rose-100 text-rose-600 hover:bg-rose-50'}`}>
                <XCircle size={16}/> Cancelar
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
                        <div className="w-16 h-16 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center text-pink-600 shadow-sm"><User size={32}/></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Paciente</p>
                            <p className="font-black text-gray-900 dark:text-white text-2xl uppercase italic">{patientName}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block flex items-center gap-2"><Sparkles size={14} className="text-purple-600"/> Procedimento</label>
                        <select value={formData.service_id} onChange={e => setFormData({...formData, service_id: e.target.value})} className="w-full h-16 px-6 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 font-bold text-sm shadow-inner appearance-none cursor-pointer">
                            {services.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block flex items-center gap-2"><Stethoscope size={14} className="text-blue-600"/> Profissional</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {professionals.map(p => (
                                <label key={p.id} className={`cursor-pointer p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${formData.professional_id === p.id ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-50 bg-gray-50 dark:bg-gray-900'}`}>
                                    <input type="radio" name="professional" value={p.id} checked={formData.professional_id === p.id} onChange={() => setFormData({...formData, professional_id: p.id})} className="hidden" />
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl text-white shadow-lg ${formData.professional_id === p.id ? 'bg-pink-500' : 'bg-gray-400'}`}>{p.first_name[0]}</div>
                                    <span className="text-[10px] font-black uppercase truncate w-full text-center tracking-tight">{p.first_name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block flex items-center gap-1"><Calendar size={12}/> Data</label>
                            <Input type="date" value={formData.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, date: e.target.value})} className="h-14 border-none bg-gray-50 font-black text-sm" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block flex items-center gap-1"><Clock size={12}/> Hora</label>
                            <Input type="time" value={formData.start_time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, start_time: e.target.value})} className="h-14 border-none bg-gray-50 font-black text-sm" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block flex items-center gap-1"><DoorOpen size={12}/> Sala</label>
                            <select value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="w-full h-14 bg-gray-50 dark:bg-gray-900 border-none rounded-xl font-black text-xs outline-none cursor-pointer shadow-inner">
                                <option value="">Selecione...</option>
                                {AVAILABLE_ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block flex items-center gap-2"><FileText size={14}/> Observações de Sessão</label>
                        <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 resize-none text-sm font-medium" />
                    </div>

                    <Button type="submit" disabled={saving} className="w-full h-20 rounded-[1.5rem] bg-gray-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 group overflow-hidden relative">
                        {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} className="mr-2"/> Salvar Alterações</>}
                    </Button>
                </form>
            </div>

            <div className="lg:col-span-4 space-y-6">
                <div className="bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl sticky top-8 border-t-[12px] border-pink-600">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3"><Info size={24} className="text-pink-500"/> Logística</h3>
                    <div className="space-y-6">
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                            <p className="text-[10px] font-black uppercase text-pink-400 mb-6 flex items-center gap-2"><Package size={14}/> Kit Necessário</p>
                            {serviceKit.length > 0 ? (
                                <div className="space-y-4">
                                    {serviceKit.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-3">
                                            <span className="text-xs font-bold text-gray-200 uppercase">{item.name}</span>
                                            <span className="text-xs text-pink-500 font-black">{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[8px] font-black uppercase text-gray-500 text-center py-6">Sem materiais vinculados</p>
                            )}
                        </div>
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between">
                            <div><p className="text-[10px] font-black uppercase text-blue-400 mb-1">Tempo Reservado</p>
                            <p className="text-4xl font-black italic">{services.find(s => s.id === formData.service_id)?.duration || '0'} MIN</p></div>
                            <Clock size={40} className="text-blue-500 opacity-30" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}