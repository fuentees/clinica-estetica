import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Appointment } from "../types/appointment";

export function useAppointments() {
  return useQuery<Appointment[], Error>({
    queryKey: ["appointments"],
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, 
          created_at,   
          updated_at,   
          start_time, 
          end_time, 
          notes,
          status,
          patient_id,
          professional_id,
          treatment_id,
          patient:patient_id ( id, first_name, last_name ),
          professional:professional_id ( id, first_name, last_name ),
          treatment:treatment_id ( id, name, description, duration )
        `)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("❌ Erro ao buscar compromissos:", error);
        throw new Error(error.message);
      }

      if (!data) return [];

      return data.map((appointment: any) => {
        const patientData = Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient;
        const professionalData = Array.isArray(appointment.professional) ? appointment.professional[0] : appointment.professional;
        const treatmentData = Array.isArray(appointment.treatment) ? appointment.treatment[0] : appointment.treatment;

        // Montamos o objeto completo para satisfazer a interface Appointment
        return {
          id: appointment.id,
          created_at: appointment.created_at, // ✅ Adicionado
          updated_at: appointment.updated_at, // ✅ Adicionado
          patient_id: appointment.patient_id,
          professional_id: appointment.professional_id,
          treatment_id: appointment.treatment_id,
          
          date: appointment.start_time.split('T')[0],
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          status: appointment.status || "scheduled",
          notes: appointment.notes || "",
          
          patient: patientData ? {
            id: patientData.id,
            first_name: patientData.first_name || "Nome não informado",
            last_name: patientData.last_name || "",
          } : undefined,

          professional: professionalData ? {
            id: professionalData.id,
            first_name: professionalData.first_name || "Não atribuído",
            last_name: professionalData.last_name || "",
          } : undefined,

          treatment: treatmentData ? {
            id: treatmentData.id,
            name: treatmentData.name || "Não especificado",
            description: treatmentData.description || "",
            duration: treatmentData.duration || 0,
          } : undefined,
        } as unknown as Appointment; // ✅ O "unknown" intermediário força o TS a aceitar a conversão se houver pequenas discrepâncias opcionais
      });
    },
  });
}