import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, Stethoscope } from 'lucide-react'; 
import { addMinutes, format, parseISO } from 'date-fns';

// Schema de Validação
const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Selecione um paciente"),
  professional_id: z.string().min(1, "Selecione um profissional"),
  treatment_id: z.string().min(1, "Selecione um procedimento"),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export function AppointmentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const preSelectedDate = searchParams.get('date'); 
  const initialDate = preSelectedDate ? format(parseISO(preSelectedDate), 'yyyy-MM-dd') : '';
  const initialTime = preSelectedDate ? format(parseISO(preSelectedDate), 'HH:mm') : '';

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [treatmentsList, setTreatmentsList] = useState<any[]>([]);
  const [professionalsList, setProfessionalsList] = useState<any[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      date: initialDate,
      time: initialTime
    }
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Buscar Pacientes (Fazemos uma LEFT JOIN para garantir que o paciente apareça, mesmo sem nome)
        const { data: patients, error: patError } = await supabase
          .from('patients')
          .select(`
            id,
            cpf,
            profiles (id, first_name, last_name)
          `)
          .order('created_at', { ascending: false });

        if (patError) throw patError;
        
        // 2. Buscar Tratamentos
        const { data: treatments, error: treatError } = await supabase
          .from('treatments')
          .select('*')
          .order('name');

        if (treatError) throw treatError;

        // 3. Buscar Profissionais (Excluindo apenas quem tem o cargo 'paciente' e pegando a formação)
        const { data: professionals, error: profError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, formacao') 
          .neq('role', 'paciente'); 

        if (profError) throw profError;

        setPatientsList(patients || []);
        setTreatmentsList(treatments || []);
        setProfessionalsList(professionals || []);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar listas. Tente cadastrar um Paciente/Profissional e verifique as RLS.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${data.date}T${data.time}`);
      
      const selectedTreatment = treatmentsList.find(t => t.id === data.treatment_id);
      let durationMinutes = 60;
      
      if (selectedTreatment?.duration) {
          const durationStr = String(selectedTreatment.duration);
          if(durationStr.includes('min')) {
             durationMinutes = parseInt(durationStr);
          } else if (durationStr.includes(':')) {
             const [h, m] = durationStr.split(':').map(Number);
             durationMinutes = (h * 60) + m;
          }
      }

      const endDateTime = addMinutes(startDateTime, durationMinutes);

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: data.patient_id,
          professional_id: data.professional_id,
          treatment_id: data.treatment_id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'scheduled',
          notes: data.notes
        });

      if (error) throw error;

      toast.success('Agendamento realizado!');
      navigate('/appointments');

    } catch (error: any) {
      console.error('Erro ao agendar:', error);
      if (error.message?.includes('professional_id')) {
         toast.error('Erro: Coluna de profissional não encontrada no banco.');
      } else {
         toast.error('Erro ao salvar: ' + (error.message || 'Desconhecido'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/appointments')}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Agendar Horário</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        
        {/* Paciente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente</label>
          <select 
            {...register('patient_id')}
            className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
          >
            <option value="">Selecione um paciente...</option>
            {patientsList.map(p => (
              <option key={p.id} value={p.id}>
                {p.profiles && p.profiles.first_name 
                  ? `${p.profiles.first_name} ${p.profiles.last_name || ''}`
                  : `Paciente (CPF: ${p.cpf})`}
              </option>
            ))}
          </select>
          {errors.patient_id && <span className="text-xs text-red-500">{errors.patient_id.message}</span>}
          {patientsList.length === 0 && <p className="text-xs text-orange-500 mt-1">Nenhum paciente encontrado. <span className='text-pink-600 hover:underline cursor-pointer' onClick={() => navigate('/patients/new')}>Cadastrar novo?</span></p>}
          
        </div>

        {/* Profissional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <Stethoscope size={16} className="text-pink-600" /> Profissional
          </label>
          <select 
            {...register('professional_id')}
            className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
          >
            <option value="">Selecione o doutor(a)...</option>
            {professionalsList.map(p => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.formacao || p.role}) 
              </option>
            ))}
          </select>
          {errors.professional_id && <span className="text-xs text-red-500">{errors.professional_id.message}</span>}
          {professionalsList.length === 0 && (
             <p className="text-xs text-red-500 mt-1">
                Atenção: Nenhum profissional cadastrado.
             </p>
          )}
        </div>

        {/* Tratamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Procedimento</label>
          <select 
            {...register('treatment_id')}
            className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
          >
            <option value="">Selecione o procedimento...</option>
            {treatmentsList.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.duration} - R$ {t.price})
              </option>
            ))}
          </select>
          {errors.treatment_id && <span className="text-xs text-red-500">{errors.treatment_id.message}</span>}
        </div>

        {/* Data e Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
            <Input type="date" {...register('date')} error={errors.date?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horário</label>
            <Input type="time" {...register('time')} error={errors.time?.message} />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
          <textarea 
            {...register('notes')}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white h-24 resize-none"
            placeholder="Detalhes adicionais..."
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting} className="bg-pink-600 hover:bg-pink-700 text-white w-full">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Confirmar Agendamento
          </Button>
        </div>

      </form>
    </div>
  );
}