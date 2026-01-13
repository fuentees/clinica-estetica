import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'react-hot-toast';
import { 
  Loader2, ArrowLeft, Clock, 
  Package, CheckCircle2, User, Sparkles, DoorOpen, Stethoscope,
  Info, FileText, Search
} from 'lucide-react'; 
import { addMinutes, format, parseISO } from 'date-fns';

const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Selecione um paciente"),
  professional_id: z.string().min(1, "Selecione um profissional"),
  service_id: z.string().min(1, "Selecione um procedimento"),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
  room: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface Patient { id: string; name: string; }
interface Professional { id: string; first_name: string; role: string; }
interface Service { id: string; name: string; duration: number; }
interface InventoryItem { name: string; quantity: number; unit: string; }

const AVAILABLE_ROOMS = ["Sala 1 - Facial", "Sala 2 - Corporal", "Consultório 1", "Consultório 2", "Box 3"];

export function AppointmentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const initialDate = searchParams.get('date') 
    ? format(parseISO(searchParams.get('date')!), 'yyyy-MM-dd') 
    : new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]); 
  const [professionalsList, setProfessionalsList] = useState<Professional[]>([]);
  const [serviceKit, setServiceKit] = useState<InventoryItem[]>([]);
  
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientList, setShowPatientList] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { 
        date: initialDate, 
        time: '09:00',
        professional_id: searchParams.get('professionalId') || ''
    }
  });

  const selectedServiceId = watch('service_id');
  const selectedProfessionalId = watch('professional_id');

  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single();
        if (!profile?.clinic_id) return;
        setClinicId(profile.clinic_id);

        const [pats, servs, profs] = await Promise.all([
          supabase.from('patients').select('id, name').eq('clinic_id', profile.clinic_id).order('name'),
          supabase.from('services').select('id, name, duration').eq('clinic_id', profile.clinic_id).order('name'),
          supabase.from('profiles')
            .select('id, first_name, role')
            .eq('clinic_id', profile.clinic_id)
            .in('role', ['profissional', 'esteticista', 'doutor', 'biomedica', 'biomedico']) 
        ]);

        if (pats.data) setPatientsList(pats.data);
        if (servs.data) setServicesList(servs.data);
        if (profs.data) setProfessionalsList(profs.data);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    const fetchKit = async () => {
      if (!selectedServiceId) {
        setServiceKit([]);
        return;
      }

      try {
        const { data: items } = await supabase
          .from('procedure_items')
          .select('inventory_id, quantity_needed')
          .eq('procedure_id', selectedServiceId); 

        if (items && items.length > 0) {
          const invIds = items.map(i => i.inventory_id);
          
          const { data: invData } = await supabase
            .from('inventory')
            .select('id, name')
            .in('id', invIds);

          if (invData) {
            const formatted = items.map(item => {
              const info = invData.find(iv => iv.id === item.inventory_id);
              return {
                name: info?.name || 'Insumo',
                quantity: item.quantity_needed,
                unit: 'it' 
              };
            });
            setServiceKit(formatted);
          }
        } else {
          setServiceKit([]);
        }
      } catch (err) {
        setServiceKit([]);
      }
    };

    fetchKit();
  }, [selectedServiceId]);

  const filteredPatients = patientsList.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const selectPatient = (p: Patient) => {
    setValue('patient_id', p.id);
    setPatientSearch(p.name);
    setShowPatientList(false);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!clinicId) return;
    setIsSubmitting(true);
    try {
      // Cria a data combinando dia e hora (no fuso local)
      const startDateTime = new Date(`${data.date}T${data.time}`);
      const service = servicesList.find(s => s.id === data.service_id);
      const endDateTime = addMinutes(startDateTime, service?.duration || 60);

      // ✅ CORREÇÃO DE FUSO HORÁRIO: Remove o deslocamento do 'Z' (UTC)
      const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, -1);
      };

      const { error } = await supabase.from('appointments').insert({
          clinic_id: clinicId,
          patient_id: data.patient_id,
          professional_id: data.professional_id,
          service_id: data.service_id,
          // ✅ Envia string exata sem conversão automática de timezone
          start_time: toLocalISO(startDateTime), 
          end_time: toLocalISO(endDateTime),
          status: 'scheduled',
          room: data.room,
          notes: data.notes,
      });

      if (error) throw error;
      toast.success('Agendamento confirmado!');
      navigate('/appointments');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-12 h-12" /></div>;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-900 animate-in fade-in">
      
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="bg-white dark:bg-gray-800 shadow-sm border rounded-xl"><ArrowLeft size={20} /></Button>
        <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Novo <span className="text-pink-600">Agendamento</span></h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Controle de Logística e Agenda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-6">
            <form id="appt-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* BUSCA DE PACIENTE */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 relative" ref={dropdownRef}>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block flex items-center gap-2"><User size={14} className="text-pink-600"/> Paciente</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Pesquisar paciente..."
                            value={patientSearch}
                            onFocus={() => setShowPatientList(true)}
                            onChange={(e) => {
                                setPatientSearch(e.target.value);
                                setShowPatientList(true);
                            }}
                            className="w-full pl-12 pr-12 h-16 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 text-sm font-bold shadow-inner"
                        />
                        {showPatientList && (
                            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                                {filteredPatients.map(p => (
                                    <button key={p.id} type="button" onClick={() => selectPatient(p)} className="w-full text-left px-6 py-4 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-sm font-bold text-gray-700 dark:text-gray-200 border-b last:border-0 border-gray-50 dark:border-gray-800 transition-colors">
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* PROCEDIMENTO */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block flex items-center gap-2"><Sparkles size={14} className="text-purple-600"/> Tratamento</label>
                    <select {...register('service_id')} className="w-full h-16 px-6 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 font-bold text-sm shadow-inner appearance-none cursor-pointer">
                        <option value="">-- Selecione o serviço --</option>
                        {servicesList.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                </div>

                {/* PROFISSIONAL */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-4 block flex items-center gap-2"><Stethoscope size={14} className="text-blue-600"/> Profissional</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {professionalsList.map(p => (
                            <label key={p.id} className={`cursor-pointer p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${selectedProfessionalId === p.id ? 'border-pink-500 bg-pink-50 shadow-md ring-2 ring-pink-500/20' : 'border-gray-50 bg-gray-50 dark:bg-gray-900'}`}>
                                <input type="radio" value={p.id} {...register('professional_id')} className="hidden" />
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl text-white shadow-lg ${selectedProfessionalId === p.id ? 'bg-pink-500 scale-110' : 'bg-gray-400'} transition-transform`}>
                                    {p.first_name[0]}
                                </div>
                                <span className="text-[10px] font-black uppercase truncate w-full text-center tracking-tight">{p.first_name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* LOGÍSTICA */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Data</label>
                        <Input type="date" {...register('date')} className="h-14 border-none bg-gray-50 font-black text-sm" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Hora</label>
                        <Input type="time" {...register('time')} className="h-14 border-none bg-gray-50 font-black text-sm" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block flex items-center gap-1"><DoorOpen size={12}/> Sala</label>
                        <select {...register('room')} className="w-full h-14 bg-gray-50 dark:bg-gray-900 border-none rounded-xl font-black text-xs outline-none cursor-pointer">
                            <option value="">Selecione (Opcional)</option>
                            {AVAILABLE_ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block flex items-center gap-2"><FileText size={14}/> Notas de Sessão</label>
                    <textarea {...register('notes')} rows={3} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 resize-none text-sm font-medium" placeholder="Informações adicionais..."></textarea>
                </div>
            </form>
        </div>

        {/* DASHBOARD DIREITO */}
        <div className="lg:col-span-4">
            <div className="bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl sticky top-8 border-t-[12px] border-pink-600">
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3"><Info size={24} className="text-pink-500"/> Logística</h3>
                
                <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                        <p className="text-[10px] font-black uppercase text-pink-400 mb-6 flex items-center gap-2"><Package size={14}/> Kit de Materiais</p>
                        
                        {serviceKit.length > 0 ? (
                          <div className="space-y-4">
                            {serviceKit.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-3">
                                <span className="text-xs font-bold text-gray-200 uppercase">{item.name}</span>
                                <span className="text-xs text-pink-500 font-black">{item.quantity} <span className="text-[9px] text-gray-500 uppercase">{item.unit}</span></span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-10 text-center opacity-40 border-2 border-dashed border-white/10 rounded-2xl">
                            <Package size={24} className="mx-auto mb-3" />
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] leading-relaxed">Selecione o tratamento para<br/>carregar o kit</p>
                          </div>
                        )}
                    </div>

                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between">
                         <div>
                            <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Duração Reservada</p>
                            <p className="text-4xl font-black italic tracking-tighter">{servicesList.find(s => s.id === selectedServiceId)?.duration || '0'} <span className="text-sm">MIN</span></p>
                         </div>
                         <Clock size={40} className="text-blue-500 opacity-30" />
                    </div>
                </div>

                <Button form="appt-form" type="submit" disabled={isSubmitting} className="w-full mt-12 h-20 rounded-[1.5rem] bg-pink-600 hover:bg-pink-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 group">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} className="mr-2" /> Confirmar Agenda</>}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}