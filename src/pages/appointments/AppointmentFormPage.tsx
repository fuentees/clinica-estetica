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
  Package, CheckCircle2, User, Sparkles, CreditCard, AlertTriangle, DoorOpen 
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
  firstName: string;
  lastName?: string;
  formacao?: string;
  role: string;
  fullName?: string;
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

// Salas Disponíveis
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
  
  // Listas de Dados
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]); 
  const [professionalsList, setProfessionalsList] = useState<Professional[]>([]);

  // Controle de Pacotes
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
  }, [preSelectedProfId, preSelectedDate, setValue]);

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não logado");

        const { data: profile } = await supabase
          .from('profiles')
          .select('clinicId')
          .eq('id', user.id)
          .single();

        if (!profile?.clinicId) throw new Error("Usuário sem clínica vinculada");
        setClinicId(profile.clinicId);
        
        // 2. Pacientes
        const { data: patients, error: patError } = await supabase
            .from('patients')
            .select('id, cpf, name') 
            .eq('clinicId', profile.clinicId)
            .order('name', { ascending: true });
        
        if (patError) throw patError;
        setPatientsList(patients || []);

        // 3. Serviços
        const { data: services, error: servError } = await supabase
            .from('services')
            .select('id, name, duration, price')
            .eq('clinicId', profile.clinicId)
            .eq('isActive', true)
            .order('name');
        
        if (servError) throw servError;
        setServicesList(services || []);

        // 4. Profissionais
        const { data: professionals, error: profError } = await supabase
            .from('profiles')
            .select('id, firstName, lastName, fullName, role') 
            .eq('clinicId', profile.clinicId)
            .in('role', ['profissional', 'admin']); 
        
        if (profError) throw profError;
        setProfessionalsList(professionals || []);

      } catch (error: any) {
        console.error("ERRO DE CARREGAMENTO:", error);
        toast.error("Erro ao carregar dados iniciais."); 
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- BUSCA PACOTES (CORRIGIDO AQUI) ---
  useEffect(() => {
    if (selectedPatientId) {
        async function fetchPackages() {
            // Tenta buscar pacotes. Se a tabela não existir, o 'error' será capturado e ignorado.
            const { data, error } = await supabase
              .from("patient_packages")
              .select("*")
              .eq("patient_id", selectedPatientId)
              .eq("status", "active");
            
            if (!error && data) {
                const valid = data.filter((p: any) => p.used_sessions < p.total_sessions);
                setActivePackages(valid);
                setUsePackageId(null);
            }
        }
        
        // AQUI ESTAVA O ERRO: A função estava comentada. Agora está ativa.
        fetchPackages(); 
    } else {
        setActivePackages([]);
        setUsePackageId(null);
    }
  }, [selectedPatientId]);

  // --- DADOS DO RESUMO ---
  const selectedPatient = patientsList.find(p => p.id === selectedPatientId);
  const selectedService = servicesList.find(s => s.id === selectedServiceId);
  const selectedProfessional = professionalsList.find(p => p.id === selectedProfessionalId);

  // --- SUBMIT ---
  const onSubmit = async (data: AppointmentFormData) => {
    if (!clinicId) {
        toast.error("Erro de identificação da clínica.");
        return;
    }
    setIsSubmitting(true);
    
    try {
      const startDateTime = new Date(`${data.date}T${data.time}`);
      
      const durationMinutes = selectedService?.duration || 60;
      const endDateTime = addMinutes(startDateTime, durationMinutes);

      const { error } = await supabase.from('appointments').insert({
          clinicId: clinicId,
          patientId: data.patientId,
          professionalId: data.professionalId,
          serviceId: data.serviceId,
          startAt: startDateTime.toISOString(),
          endAt: endDateTime.toISOString(),
          status: 'scheduled',
          notes: data.notes,
        });

      if (error) throw error;

      if (usePackageId) {
          const pkg = activePackages.find(p => p.id === usePackageId);
          if (pkg) {
              await supabase.from("patient_packages").update({ used_sessions: pkg.used_sessions + 1 }).eq("id", pkg.id);
              toast.success(`1 Sessão descontada do pacote!`);
          }
      }

      toast.success('Agendamento confirmado!');
      
      if (preSelectedProfId) {
          navigate(-1);
      } else {
          navigate('/appointments');
      }

    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao agendar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
          <ArrowLeft size={20} />
        </Button>
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Sessão</h1>
            <p className="text-sm text-gray-500">
                {preSelectedProfId ? 'Agendando diretamente para o profissional.' : 'Preencha os dados para agendar um novo atendimento.'}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === COLUNA ESQUERDA: FORMULÁRIO (8/12) === */}
        <div className="lg:col-span-8 space-y-6">
            <form id="appt-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* 1. SELEÇÃO DE PACIENTE */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white"><User size={18} className="text-pink-600"/> Dados do Paciente</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do Paciente</label>
                            {patientsList.length === 0 ? (
                                <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                    Nenhum paciente cadastrado nesta clínica. Cadastre um paciente antes de agendar.
                                </div>
                            ) : (
                                <select {...register('patientId')} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500 transition-all">
                                    <option value="">Selecione...</option>
                                    {patientsList.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.cpf ? `(CPF: ${p.cpf})` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.patientId && <span className="text-xs text-red-500 mt-1 block">{errors.patientId.message}</span>}
                        </div>
                    </div>
                </section>

                {/* 2. SELEÇÃO DE PROFISSIONAL (VISUAL) */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white"><Sparkles size={18} className="text-purple-600"/> Profissional</h2>
                    
                    {professionalsList.length === 0 ? (
                        <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/50">
                            <AlertTriangle className="mx-auto text-orange-500 mb-2" size={24} />
                            <p className="text-sm font-bold text-orange-700 dark:text-orange-300">Nenhum profissional encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {professionalsList.map(p => (
                                <label key={p.id} className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all hover:shadow-md flex flex-col items-center text-center gap-2 ${selectedProfessionalId === p.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'}`}>
                                    <input type="radio" value={p.id} {...register('professionalId')} className="absolute opacity-0 w-full h-full cursor-pointer" />
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${selectedProfessionalId === p.id ? 'bg-pink-500' : 'bg-gray-400'}`}>
                                        {p.firstName ? p.firstName[0] : '?'}
                                    </div>
                                    <div>
                                        <span className="block font-bold text-sm text-gray-800 dark:text-white">{p.firstName}</span>
                                        <span className="block text-[10px] uppercase text-gray-500">{p.role}</span>
                                    </div>
                                    {selectedProfessionalId === p.id && <div className="absolute top-2 right-2 text-pink-500"><CheckCircle2 size={16}/></div>}
                                </label>
                            ))}
                        </div>
                    )}
                    {errors.professionalId && <span className="text-xs text-red-500 mt-2 block">{errors.professionalId.message}</span>}
                </section>

                {/* 3. SERVIÇO & DATA & SALA */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white"><Clock size={18} className="text-blue-600"/> Detalhes da Sessão</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Serviço / Procedimento</label>
                            {servicesList.length === 0 ? (
                                <div className="p-3 border rounded-xl bg-gray-50 text-gray-500 text-sm">
                                    Nenhum serviço cadastrado. Vá em Serviços para criar.
                                </div>
                            ) : (
                                <select {...register('serviceId')} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500">
                                    <option value="">Selecione...</option>
                                    {servicesList.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                                    ))}
                                </select>
                            )}
                            {errors.serviceId && <span className="text-xs text-red-500 mt-1 block">{errors.serviceId.message}</span>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data</label>
                                <div className="relative">
                                    <Input type="date" {...register('date')} className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700" />
                                    <CalendarIcon size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none"/>
                                </div>
                                {errors.date && <span className="text-xs text-red-500 mt-1 block">{errors.date.message}</span>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Horário</label>
                                <div className="relative">
                                    <Input type="time" {...register('time')} className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700" />
                                    <Clock size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none"/>
                                </div>
                                {errors.time && <span className="text-xs text-red-500 mt-1 block">{errors.time.message}</span>}
                            </div>
                        </div>

                        {/* SELEÇÃO DE SALA */}
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><DoorOpen size={12}/> Sala / Consultório</label>
                            <select {...register('room')} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500">
                                <option value="">Selecione a sala (Opcional)</option>
                                {AVAILABLE_ROOMS.map(room => (
                                    <option key={room} value={room}>{room}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Observações (Opcional)</label>
                            <textarea {...register('notes')} rows={3} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500 resize-none" placeholder="Ex: Preparar material X..."></textarea>
                        </div>
                    </div>
                </section>
            </form>
        </div>

        {/* === COLUNA DIREITA: RESUMO & PAGAMENTO (4/12) === */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* CARD DE RESUMO (STICKY) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 sticky top-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Resumo do Agendamento</h3>
                
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Paciente</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white text-right">
                            {selectedPatient ? selectedPatient.name : '-'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Profissional</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white text-right">
                            {selectedProfessional ? selectedProfessional.firstName : '-'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Data/Hora</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white text-right">
                            {watchDate && watchTime ? `${new Date(watchDate).toLocaleDateString('pt-BR')} às ${watchTime}` : '-'}
                        </span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Serviço</p>
                        <p className="text-base font-bold text-pink-600">{selectedService?.name || 'Nenhum selecionado'}</p>
                    </div>
                </div>

                {/* SEÇÃO DE COBRANÇA */}
                {selectedService && (
                    <div className="mb-6 animate-in fade-in slide-in-from-bottom-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><CreditCard size={12}/> Método de Cobrança</p>
                        
                        <div className="space-y-2">
                            {/* OPÇÃO 1: PACOTES (Se houver) */}
                            {activePackages.map(pkg => (
                                <label key={pkg.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${usePackageId === pkg.id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-green-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="payment_method" checked={usePackageId === pkg.id} onChange={() => setUsePackageId(pkg.id)} className="text-green-600 focus:ring-green-500 w-4 h-4"/>
                                        <div>
                                            <span className="block text-sm font-bold text-gray-800 dark:text-white">{pkg.title}</span>
                                            <span className="text-xs text-gray-500">Saldo: {pkg.total_sessions - pkg.used_sessions} sessões</span>
                                        </div>
                                    </div>
                                    <Package size={18} className="text-green-600"/>
                                </label>
                            ))}

                            {/* OPÇÃO 2: AVULSO */}
                            <label className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${usePackageId === null ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-blue-200'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="payment_method" checked={usePackageId === null} onChange={() => setUsePackageId(null)} className="text-blue-600 focus:ring-blue-500 w-4 h-4"/>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-800 dark:text-white">Pagamento Avulso</span>
                                        <span className="text-xs text-gray-500">Valor da sessão única</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-blue-600">
                                    {selectedService.price ? `R$ ${selectedService.price}` : 'R$ -'}
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                <Button 
                    form="appt-form" 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full h-12 text-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-200 dark:shadow-none transition-all"
                >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />} 
                    Confirmar Agenda
                </Button>
            </div>
        </div>

      </div>
    </div>
  );
}