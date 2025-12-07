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
  Package, CheckCircle2, User, Sparkles, CreditCard, AlertTriangle,
  MessageCircle, Mail, MapPin, AlertCircle
} from 'lucide-react'; 
import { addMinutes, format, parseISO } from 'date-fns';

const AVAILABLE_ROOMS = [
    { id: 'Sala 01', label: 'Sala 01 - Facial' },
    { id: 'Sala 02', label: 'Sala 02 - Corporal' },
    { id: 'Sala VIP', label: 'Sala VIP' },
    { id: 'Box 01', label: 'Box Avaliação' },
];

// --- SCHEMA ---
const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Selecione um paciente"),
  professional_id: z.string().min(1, "Selecione um profissional"),
  treatment_id: z.string().min(1, "Selecione um procedimento"),
  room: z.string().min(1, "Selecione uma sala"),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
  notes: z.string().optional(),
  send_whatsapp: z.boolean().default(true),
  send_email: z.boolean().default(false),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

// --- TIPAGEM ---
interface Patient { id: string; name: string; cpf?: string; phone?: string; email?: string; profiles?: any; }
interface Professional { id: string; first_name: string; last_name?: string; formacao?: string; role: string; }
interface Treatment { id: string; name: string; duration: string; price: number; }
interface PackageType { id: string; title: string; total_sessions: number; used_sessions: number; }

export function AppointmentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const preSelectedDate = searchParams.get('date'); 
  const initialDate = preSelectedDate ? format(parseISO(preSelectedDate), 'yyyy-MM-dd') : new Date().toISOString().split('T')[0];
  const initialTime = preSelectedDate ? format(parseISO(preSelectedDate), 'HH:mm') : '';

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Listas
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [treatmentsList, setTreatmentsList] = useState<Treatment[]>([]);
  const [professionalsList, setProfessionalsList] = useState<Professional[]>([]);
  const [activePackages, setActivePackages] = useState<PackageType[]>([]);
  const [usePackageId, setUsePackageId] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { date: initialDate, time: initialTime, send_whatsapp: true, send_email: false, room: 'Sala 01' }
  });

  const selectedPatientId = watch('patient_id');
  const selectedTreatmentId = watch('treatment_id');
  const selectedProfessionalId = watch('professional_id');
  const watchDate = watch('date');
  const watchTime = watch('time');
  const watchRoom = watch('room');

  // --- CARREGAMENTO (COM SKELETON LOGIC) ---
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Pacientes
        const { data: patients } = await supabase.from('patients').select(`*, profiles(first_name, last_name)`).order('created_at', { ascending: false });
        const safePatients = (patients || []).map((p: any) => ({ ...p, profiles: Array.isArray(p.profiles) ? p.profiles[0] : (p.profiles || {}) }));
        setPatientsList(safePatients);

        // 2. Tratamentos
        const { data: treatments } = await supabase.from('treatments').select('*').order('name');
        setTreatmentsList(treatments || []);

        // 3. Profissionais
        const { data: professionals } = await supabase.from('profiles').select('id, first_name, last_name, role, formacao').neq('role', 'paciente');
        setProfessionalsList(professionals || []);

      } catch (error) { toast.error('Erro ao carregar dados.'); } finally { setLoading(false); }
    }
    loadData();
  }, []);

  // --- BUSCA PACOTES ---
  useEffect(() => {
    if (selectedPatientId) {
        async function fetchPackages() {
            try {
                const { data } = await supabase.from("patient_packages").select("*").eq("patient_id", selectedPatientId).eq("status", "active");
                if (data) setActivePackages(data.filter(p => p.used_sessions < p.total_sessions));
            } catch (e) { console.log(e); }
            setUsePackageId(null);
        }
        fetchPackages();
    } else { setActivePackages([]); setUsePackageId(null); }
  }, [selectedPatientId]);

  // --- HELPERS ---
  const getPatientDisplay = (p: Patient | undefined) => {
      if (!p) return "Selecione...";
      if (p.profiles && p.profiles.first_name) return `${p.profiles.first_name} ${p.profiles.last_name || ''}`;
      if (p.name) return p.name;
      return `Paciente (CPF: ${p.cpf || 'S/N'})`;
  };

  const selectedPatient = patientsList.find(p => p.id === selectedPatientId);
  const selectedTreatment = treatmentsList.find(t => t.id === selectedTreatmentId);
  const selectedProfessional = professionalsList.find(p => p.id === selectedProfessionalId);

  // --- SUBMIT (AGORA COM ANTI-CONFLITO) ---
  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${data.date}T${data.time}`);
      
      let durationMinutes = 60;
      if (selectedTreatment?.duration) {
          const durationStr = String(selectedTreatment.duration);
          if(durationStr.includes('min')) durationMinutes = parseInt(durationStr);
          else if (durationStr.includes(':')) { const [h, m] = durationStr.split(':').map(Number); durationMinutes = (h * 60) + m; }
      }
      const endDateTime = addMinutes(startDateTime, durationMinutes);

      // --- 1. VERIFICAÇÃO DE CONFLITO (PREMIUM) ---
      // Verifica se o médico ou a sala já estão ocupados neste horário exato
      // (Para ser mais robusto, idealmente checaria intervalos, mas igualdade já ajuda muito)
      const { data: conflicts } = await supabase.from('appointments')
        .select('id, start_time')
        .eq('date', data.date)
        .eq('start_time', startDateTime.toISOString())
        .neq('status', 'cancelled')
        .or(`professional_id.eq.${data.professional_id},room.eq.${data.room}`);

      if (conflicts && conflicts.length > 0) {
          toast.error("⚠️ Conflito de Agenda! O Profissional ou a Sala já estão ocupados neste horário.", { duration: 5000 });
          setIsSubmitting(false);
          return; // Para tudo!
      }

      // --- 2. SALVAR ---
      const { error } = await supabase.from('appointments').insert({
          patient_id: data.patient_id,
          professional_id: data.professional_id,
          treatment_id: data.treatment_id,
          room: data.room,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'scheduled',
          notes: data.notes,
        });

      if (error) throw error;

      // --- 3. DEBITAR PACOTE ---
      if (usePackageId) {
          const pkg = activePackages.find(p => p.id === usePackageId);
          if (pkg) {
              await supabase.from("patient_packages").update({ used_sessions: pkg.used_sessions + 1 }).eq("id", pkg.id);
              toast.success(`Pacote debitado! Restam ${pkg.total_sessions - (pkg.used_sessions + 1)} sessões.`);
          }
      } else {
          toast.success('Agendamento confirmado!');
      }

      // --- 4. AUTOMAÇÃO ---
      const dateStr = new Date(`${data.date}T${data.time}`).toLocaleDateString('pt-BR');
      const timeStr = data.time;
      const profName = selectedProfessional?.first_name || "Doutora";
      const treatName = selectedTreatment?.name || "Procedimento";
      const location = data.room || "Clínica";

      // Mensagem Premium
      const messageBody = `Olá *${getPatientDisplay(selectedPatient)}*! ✨\n\nTudo bem? Passando para confirmar seu horário:\n\n🗓️ *${dateStr}* às *${timeStr}*\n💆‍♀️ *${treatName}*\n👩‍⚕️ Com *${profName}*\n📍 *${location}*\n\nPodemos confirmar? 🥰`;

      if (data.send_whatsapp && selectedPatient?.phone) {
          const phone = selectedPatient.phone.replace(/\D/g, ""); // Remove ( ) -
          // Pequeno delay para garantir que o toast apareça antes da nova aba
          setTimeout(() => {
             window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(messageBody)}`, "_blank");
          }, 500);
      }

      if (data.send_email && selectedPatient?.email) {
          setTimeout(() => {
              window.open(`mailto:${selectedPatient.email}?subject=${encodeURIComponent("Confirmação de Agendamento")}&body=${encodeURIComponent(messageBody)}`, "_blank");
          }, 1500);
      }

      navigate('/appointments');

    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao agendar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SKELETON LOADING (PREMIUM FEEL) ---
  if (loading) return (
    <div className="max-w-[1400px] mx-auto p-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-8"/>
        <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8 space-y-6">
                <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl"/>
                <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl"/>
                <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl"/>
            </div>
            <div className="col-span-4">
                <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl"/>
            </div>
        </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/appointments')} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300"/>
        </Button>
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="text-pink-600" /> Cockpit de Agendamento
            </h1>
            <p className="text-sm text-gray-500">Configure os detalhes da sessão abaixo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === ESQUERDA: FORMULÁRIO (7/12) === */}
        <div className="lg:col-span-7 space-y-6">
            <form id="appt-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* 1. PACIENTE */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <User size={16} /> 1. Quem será atendido?
                    </h2>
                    
                    {patientsList.length === 0 ? (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">Nenhum paciente carregado.</div>
                    ) : (
                        <div className="relative">
                            <select {...register('patient_id')} className="w-full p-4 pl-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all text-lg font-medium cursor-pointer">
                                <option value="">Selecione um paciente...</option>
                                {patientsList.map(p => <option key={p.id} value={p.id}>{getPatientDisplay(p)}</option>)}
                            </select>
                            {activePackages.length > 0 && selectedPatientId && (
                                <div className="absolute right-3 top-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1"><Package size={12}/> Possui Pacotes</div>
                            )}
                        </div>
                    )}
                    {errors.patient_id && <span className="text-xs text-red-500 mt-2 block">{errors.patient_id.message}</span>}
                </section>

                {/* 2. PROFISSIONAL */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Sparkles size={16} /> 2. Profissional Responsável
                    </h2>
                    
                    {professionalsList.length === 0 ? (
                        <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100"><p className="text-sm text-orange-700">Nenhum profissional encontrado.</p></div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {professionalsList.map(p => (
                                <label key={p.id} className={`cursor-pointer relative p-3 rounded-xl border-2 transition-all hover:scale-[1.02] flex flex-col items-center text-center gap-2 ${selectedProfessionalId === p.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-md' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 grayscale hover:grayscale-0'}`}>
                                    <input type="radio" value={p.id} {...register('professional_id')} className="absolute opacity-0 w-full h-full cursor-pointer" />
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${selectedProfessionalId === p.id ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gray-400'}`}>
                                        {p.first_name ? p.first_name[0] : '?'}
                                    </div>
                                    <div>
                                        <span className="block font-bold text-sm text-gray-800 dark:text-white leading-tight">{p.first_name}</span>
                                        <span className="block text-[10px] uppercase text-gray-500 mt-0.5">{p.formacao || 'Doutor(a)'}</span>
                                    </div>
                                    {selectedProfessionalId === p.id && <div className="absolute top-2 right-2 text-pink-500 bg-white rounded-full"><CheckCircle2 size={16}/></div>}
                                </label>
                            ))}
                        </div>
                    )}
                    {errors.professional_id && <span className="text-xs text-red-500 mt-2 block">{errors.professional_id.message}</span>}
                </section>

                {/* 3. DETALHES, SALA & DATA */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Clock size={16} /> 3. Detalhes da Sessão
                    </h2>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Procedimento</label>
                            <select {...register('treatment_id')} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500">
                                <option value="">Selecione...</option>
                                {treatmentsList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            {errors.treatment_id && <span className="text-xs text-red-500 mt-1 block">{errors.treatment_id.message}</span>}
                        </div>

                        {/* SELEÇÃO DE SALA */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-1"><MapPin size={12}/> Local / Sala</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {AVAILABLE_ROOMS.map(room => (
                                    <label key={room.id} className={`cursor-pointer border rounded-lg p-2 text-center text-sm transition-all ${watchRoom === room.id ? 'bg-pink-600 text-white border-pink-600 shadow-md' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-pink-300'}`}>
                                        <input type="radio" value={room.id} {...register('room')} className="hidden" />
                                        <span className="block font-bold">{room.id}</span>
                                        <span className="block text-[10px] opacity-80">{room.label.split(' - ')[1] || 'Geral'}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.room && <span className="text-xs text-red-500 mt-1 block">{errors.room.message}</span>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data</label>
                                <Input type="date" {...register('date')} className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-12" />
                                {errors.date && <span className="text-xs text-red-500 mt-1 block">{errors.date.message}</span>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Horário</label>
                                <Input type="time" {...register('time')} className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-12" />
                                {errors.time && <span className="text-xs text-red-500 mt-1 block">{errors.time.message}</span>}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Observações</label>
                            <textarea {...register('notes')} rows={2} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-pink-500 resize-none text-sm" placeholder="Ex: Sala 2, preparar material X..."></textarea>
                        </div>
                    </div>
                </section>
            </form>
        </div>

        {/* === DIREITA: TICKET (5/12) === */}
        <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 sticky top-6 overflow-hidden">
                {/* TICKET HEADER */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white relative overflow-hidden">
                    <h3 className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Confirmação</h3>
                    <h2 className="text-2xl font-bold">{selectedTreatment?.name || 'Novo Agendamento'}</h2>
                    <p className="text-sm opacity-70 mt-1">
                        {watchDate ? new Date(watchDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Data não selecionada'}
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* RESUMO */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <span className="block text-xs text-gray-400 uppercase font-bold">Paciente</span>
                            <span className="block text-sm font-semibold text-gray-800 dark:text-white truncate">{getPatientDisplay(selectedPatient)}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <span className="block text-xs text-gray-400 uppercase font-bold">Profissional</span>
                            <span className="block text-sm font-semibold text-gray-800 dark:text-white truncate">{selectedProfessional ? selectedProfessional.first_name : '-'}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
                        <div>
                            <span className="text-xs text-gray-400 uppercase font-bold block">Horário</span>
                            <span className="text-2xl font-bold text-gray-800 dark:text-white">{watchTime || '--:--'}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-400 uppercase font-bold block">Sala</span>
                            <span className="text-lg font-semibold text-gray-800 dark:text-white">{watchRoom || '-'}</span>
                        </div>
                    </div>

                    {/* ENVIOS */}
                    <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border transition-all ${watch('send_whatsapp') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                            <input type="checkbox" {...register('send_whatsapp')} className="rounded text-green-600 focus:ring-green-500"/>
                            <div className="text-xs font-bold text-gray-700 flex items-center gap-1"><MessageCircle size={14} className="text-green-600"/> WhatsApp</div>
                        </label>
                        <label className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border transition-all ${watch('send_email') ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                            <input type="checkbox" {...register('send_email')} className="rounded text-blue-600 focus:ring-blue-500"/>
                            <div className="text-xs font-bold text-gray-700 flex items-center gap-1"><Mail size={14} className="text-blue-600"/> E-mail</div>
                        </label>
                    </div>

                    {/* PAGAMENTO */}
                    {selectedTreatment && (
                        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mt-2"><CreditCard size={12}/> Cobrança</p>
                            
                            {activePackages.map(pkg => (
                                <label key={pkg.id} className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${usePackageId === pkg.id ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-green-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" className="w-4 h-4 text-green-600" name="payment" checked={usePackageId === pkg.id} onChange={() => setUsePackageId(pkg.id)}/>
                                        <div>
                                            <span className="block text-sm font-bold text-gray-800 dark:text-white">{pkg.title}</span>
                                            <span className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Saldo: {pkg.total_sessions - pkg.used_sessions} sessões</span>
                                        </div>
                                    </div>
                                    <Package size={18} className={usePackageId === pkg.id ? "text-green-600" : "text-gray-300"}/>
                                </label>
                            ))}

                            <label className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${usePackageId === null ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" className="w-4 h-4 text-blue-600" name="payment" checked={usePackageId === null} onChange={() => setUsePackageId(null)}/>
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">Pagamento Avulso</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">R$ {selectedTreatment.price}</span>
                            </label>
                        </div>
                    )}

                    {/* WARNING DE CONFLITO VISUAL (OPCIONAL) */}
                    <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs border border-yellow-100">
                        <AlertCircle size={16} className="mt-0.5 shrink-0"/>
                        <p>O sistema verificará a disponibilidade de sala e profissional ao clicar em confirmar.</p>
                    </div>

                    <Button 
                        form="appt-form" type="submit" disabled={isSubmitting} 
                        className="w-full h-14 text-lg font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-lg shadow-pink-200 dark:shadow-none transition-transform active:scale-[0.98] mt-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />} 
                        {usePackageId ? "Debitar e Agendar" : "Confirmar Agenda"}
                    </Button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}