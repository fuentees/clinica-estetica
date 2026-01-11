import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export function useAutoStock() {
  
  async function deductFromAppointment(appointmentId: string) {
    try {
      console.log("Iniciando baixa para agendamento:", appointmentId);

      // 1. Busca dados do agendamento para saber qual foi o serviço
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('service_id, clinic_id')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !appointment) {
        console.error("Erro ao buscar agendamento:", fetchError);
        throw new Error('Agendamento não encontrado');
      }

      // 2. Chama a função do banco que dá baixa nos itens do kit
      const { error: rpcError } = await supabase
        .rpc('perform_procedure_deduction', { 
          p_procedure_id: appointment.service_id, 
          p_clinic_id: appointment.clinic_id 
        });

      if (rpcError) throw rpcError;

      toast.success("Estoque atualizado: Itens do kit foram descontados! 📉", {
        icon: '📦',
        duration: 4000
      });
      
      return true;

    } catch (error) {
      console.error("Erro na baixa automática:", error);
      toast.error("Erro ao processar baixa de estoque.");
      return false;
    }
  }

  return { deductFromAppointment };
}