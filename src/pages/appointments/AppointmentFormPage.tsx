import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'react-hot-toast';
import { 
  Loader2, ArrowLeft, Calendar as CalendarIcon, Clock, 
  Package, CheckCircle2, User, Sparkles, CreditCard, AlertTriangle, DoorOpen, Stethoscope 
} from 'lucide-react'; 
import { addMinutes, format, parseISO } from 'date-fns';

// --- SCHEMA ---
const appointmentSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  professionalId: z.string().min(1, "Selecione um profissional"),
  serviceId: z.string().min(1, "Selecione um procedimento"),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
  room: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

// --- TIPAGEM ---
interface Patient {
  id: string;
  name: string;
  cpf?: string;
}

interface Professional {
  id: string;
  first_name: string;
  last_name?: string;
  role: string;
  full_name?: string;
  email?: string;
}

interface Service { 
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface PackageType {
  id: string;
  title: string;
  total_sessions: number;
  used_sessions: number;
}

const AVAILABLE_ROOMS = ["Sala 1 - Facial", "Sala 2 - Corporal", "Consultório 1", "Consultório 2", "Box 3"];

export function AppointmentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const preSelectedDate = searchParams.get('date'); 
  const preSelectedProfId = searchParams.get('professionalId');

  const initialDate = preSelectedDate ? format(parseISO(preSelectedDate), 'yyyy-MM-dd') : new Date().toISOString().split('T')[0];
  const initialTime = '09:00';

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]); 
  const [professionalsList, setProfessionalsList] = useState<Professional[]>([]);
  const [activePackages, setActivePackages] = useState<PackageType[]>([]);
  const [usePackageId, setUsePackageId] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { 
        date: initialDate, 
        time: initialTime,
        professionalId: preSelectedProfId || '' 
    }
  });

  const selectedPatientId = watch('patientId');
  const selectedServiceId = watch('serviceId');
  const selectedProfessionalId = watch('professionalId');
  const watchDate = watch('date');
  const watchTime = watch('time');

  useEffect(() => {
      if (preSelectedProfId) setValue('professionalId', preSelectedProfId);
      if (preSelectedDate) setValue('date', initialDate);
  }, [preSelectedProfId, preSelectedDate, setValue, initialDate]);

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
        if (isMounted && loading) {
            setLoading(false);
            toast.error("O sistema demorou para responder.");
        }
    }, 10000);

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não logado");

        const { data: profile } = await supabase
          .from('profiles')
          .select('clinicId')
          .eq('id', user.id)
          .single();

        if (!profile?.clinicId) throw new Error("Usuário sem clínica vinculada");
        if (isMounted) setClinicId(profile.clinicId);
        
        const [patientsReq, servicesReq, professionalsReq] = await Promise.allSettled([
            supabase.from('patients').select('id, cpf, name').eq('clinicId', profile.clinicId).order('name'),
            supabase.from('services').select('id, name, duration, price').eq('clinicId', profile.clinicId).order('name'),
            supabase.from('profiles').select('id, first_name, last_name, email, role, clinicId').eq('clinicId', profile.clinicId)
        ]);

        if (isMounted) {
            if (patientsReq.status === 'fulfilled' && patientsReq.value.data) setPatientsList(patientsReq.value.data);
            if (servicesReq.status === 'fulfilled' && servicesReq.value.data) setServicesList(servicesReq.value.data);
            if (professionalsReq.status === 'fulfilled' && professionalsReq.value.data) {
                const data = professionalsReq.value.data;
                const filteredProfs = data.filter((p: any) => 
                    ['profissional', 'admin', 'doutor', 'esteticista', 'recepcionista'].includes(p.role || 'profissional')
                );
                setProfessionalsList(filteredProfs);
            }
        }
      } catch (error: any) {
        console.error("ERRO CRÍTICO:", error);
      } finally {
        if (isMounted) setLoading(false);
        clearTimeout(timeout);
      }
    }
    loadData();
    return () => { isMounted = false; clearTimeout(timeout); };
  }, []);

  // Busca Pacotes
  useEffect(() => {
    if (selectedPatientId) {
        const fetchPackages = async () => {
            const { data } = await supabase
              .from("patient_packages") // Verifique se esta tabela existe no seu schema se for usar pacotes
              .select("*")
              .eq("patient_id", selectedPatientId)
              .eq("status", "active");
            
            if (data) {
                const valid = data.filter((p: any) => p.used_sessions < p.total_sessions);
                setActivePackages(valid);
                setUsePackageId(null);
            }
        };
        // fetchPackages(); // Comentado para evitar erro caso a tabela de pacotes não exista ainda
        setActivePackages([]); 
    } else {
        setActivePackages([]);
        setUsePackageId(null);
    }
  }, [selectedPatientId]);

  const selectedPatient = patientsList.find(p => p.id === selectedPatientId);
  const selectedService = servicesList.find(s => s.id === selectedServiceId);
  const selectedProfessional = professionalsList.find(p => p.id === selectedProfessionalId);

  const onSubmit = async (data: AppointmentFormData) => {
    if (!clinicId) return toast.error("Erro de identificação da clínica.");
    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${data.date}T${data.time}`);
      const durationMinutes = selectedService?.duration || 60;
      const endDateTime = addMinutes(startDateTime, durationMinutes);

      // ✅ CORREÇÃO AQUI: Usando snake_case para as colunas do banco
      const { error } = await supabase.from('appointments').insert({
          clinicId: clinicId,
          patient_id: data.patientId,       // Mapeado de patientId -> patient_id
          professional_id: data.professionalId, // Mapeado de professionalId -> professional_id
          service_id: data.serviceId,       // Mapeado de serviceId -> service_id
          start_time: startDateTime.toISOString(), // Mapeado de startAt -> start_time
          end_time: endDateTime.toISOString(),     // Mapeado de endAt -> end_time
          status: 'scheduled',
          notes: data.notes,
      });

      if (error) throw error;

      // Lógica de Pacotes (Se existir)
      if (usePackageId) {
          /* const pkg = activePackages.find(p => p.id === usePackageId);
          if (pkg) {
              await supabase.from("patient_packages")
                .update({ used_sessions: pkg.used_sessions + 1 })
                .eq("id", pkg.id);
              toast.success(`1 Sessão descontada do pacote!`);
          }
          */
      }
      toast.success('Agendamento confirmado!');
      if (preSelectedProfId) navigate(-1); else navigate('/appointments');

    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao agendar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
        <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Sincronizando Agenda...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-900 animate-in fade-in duration-500">
      
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
          <ArrowLeft size={20} />
        </Button>
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Sessão</h1>
            <p className="text-sm text-gray-500">Agendamento de atendimento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORMULÁRIO */}
        <div className="lg:col-span-8 space-y-6">
            <form id="appt-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* 1. SELEÇÃO DE PACIENTE */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white"><User size={18} className="text-pink-600"/> Dados do Paciente</h2>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do Paciente</label>
                        {patientsList.length === 0 ? (
                            <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg text-yellow-800 text-sm flex items-center gap-2"><AlertTriangle size={16}/> Nenhum paciente cadastrado.</div>
                        ) : (
                            <select {...register('patientId')} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer">
                                <option value="">Selecione o paciente...</option>
                                {patientsList.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                            </select>
                        )}
                        {errors.patientId && <span className="text-xs text-red-500 mt-1 block">{errors.patientId.message}</span>}
                    </div>
                </section>

                {/* 2. SELEÇÃO DE PROFISSIONAL */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white"><Sparkles size={18} className="text-purple-600"/> Profissional</h2>
                        <span className="text-xs text-gray-400 font-mono">Total: {professionalsList.length}</span>
                    </div>
                    
                    {professionalsList.length === 0 ? (
                        <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/50">
                            <AlertTriangle className="mx-auto text-orange-500 mb-2" size={24} />
                            <p className="text-sm font-bold text-orange-700 dark:text-orange-300">Nenhum profissional encontrado.</p>
                            <p className="text-xs text-orange-600 mt-1">Verifique se existem usuários vinculados a esta clínica.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {professionalsList.map(p => (
                                <label key={p.id} className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all hover:shadow-md flex flex-col items-center text-center gap-3 ${selectedProfessionalId === p.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-md ring-1 ring-pink-500' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-pink-200'}`}>
                                    <input type="radio" value={p.id} {...register('professionalId')} className="absolute opacity-0 w-full h-full cursor-pointer left-0 top-0" />
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg transition-colors ${selectedProfessionalId === p.id ? 'bg-pink-500' : 'bg-gray-400 dark:bg-gray-600'}`}>
                                        {p.first_name ? p.first_name[0].toUpperCase() : (p.email ? p.email[0].toUpperCase() : '?')}
                                    </div>
                                    <div className="w-full">
                                        <span className="block font-bold text-sm text-gray-800 dark:text-white truncate">
                                            {p.first_name || p.email || "Sem Nome"}
                                        </span>
                                        <span className="block text-[10px] uppercase font-semibold text-gray-500 mt-1 tracking-wide">{p.role || "Colaborador"}</span>
                                    </div>
                                    {selectedProfessionalId === p.id && (
                                        <div className="absolute top-2 right-2 text-pink-500 animate-in zoom-in duration-200"><CheckCircle2 size={18} fill="currentColor" className="text-white"/></div>
                                    )}
                                </label>
                            ))}
                        </div>
                    )}
                    {errors.professionalId && <span className="text-xs text-red-500 mt-2 block font-medium">{errors.professionalId.message}</span>}
                </section>

                {/* 3. SERVIÇO & DATA & SALA */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white"><Clock size={18} className="text-blue-600"/> Detalhes da Sessão</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><Stethoscope size={12}/> Tratamento / Serviço</label>
                            <select {...register('serviceId')} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer">
                                <option value="">Selecione...</option>
                                {servicesList.map(s => (<option key={s.id} value={s.id}>{s.name} • {s.duration} min • R$ {s.price}</option>))}
                            </select>
                            {errors.serviceId && <span className="text-xs text-red-500 mt-1 block">{errors.serviceId.message}</span>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data</label>
                                <Input type="date" {...register('date')} className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700" />
                                {errors.date && <span className="text-xs text-red-500 mt-1 block">{errors.date.message}</span>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Horário</label>
                                <Input type="time" {...register('time')} className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700" />
                                {errors.time && <span className="text-xs text-red-500 mt-1 block">{errors.time.message}</span>}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><DoorOpen size={12}/> Sala / Consultório</label>
                            <select {...register('room')} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500">
                                <option value="">Selecione a sala (Opcional)</option>
                                {AVAILABLE_ROOMS.map(room => (<option key={room} value={room}>{room}</option>))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Observações (Opcional)</label>
                            <textarea {...register('notes')} rows={3} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500 resize-none" placeholder="Ex: Paciente tem sensibilidade..."></textarea>
                        </div>
                    </div>
                </section>
            </form>
        </div>

        {/* RESUMO */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 sticky top-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Resumo do Agendamento</h3>
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Paciente</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white text-right truncate max-w-[150px]">{selectedPatient ? selectedPatient.name : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Profissional</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white text-right">{selectedProfessional ? (selectedProfessional.first_name || 'Sem Nome') : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Data/Hora</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white text-right">{watchDate && watchTime ? `${new Date(watchDate).toLocaleDateString('pt-BR')} às ${watchTime}` : '-'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Serviço Selecionado</p>
                        <p className="text-base font-bold text-pink-600">{selectedService?.name || 'Nenhum selecionado'}</p>
                    </div>
                </div>
                
                {selectedService && (
                    <div className="mb-6 animate-in fade-in slide-in-from-bottom-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><CreditCard size={12}/> Método de Cobrança</p>
                        <div className="space-y-2">
                            {/* Lógica de pacotes simplificada para visualização */}
                            <label className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${usePackageId === null ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-blue-200'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="payment_method" checked={usePackageId === null} onChange={() => setUsePackageId(null)} className="text-blue-600 focus:ring-blue-500 w-4 h-4"/>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-800 dark:text-white">Pagamento Avulso</span>
                                        <span className="text-xs text-gray-500">Sessão única</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-blue-600">
                                    {selectedService.price ? `R$ ${selectedService.price}` : 'R$ -'}
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                <Button form="appt-form" type="submit" disabled={isSubmitting} className="w-full h-12 text-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-200 dark:shadow-none transition-all">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />} Confirmar Agenda
                </Button>
            </div>
        </div>

      </div>
    </div>
  );
}