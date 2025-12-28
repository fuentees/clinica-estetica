import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Appointment } from "../types/appointment";

export function useAppointments() {
  return useQuery<Appointment[], Error>({
    queryKey: ["appointments"],
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `id, start_time, end_time, notes,
           patient:patient_id ( id, first_name, last_name ),
           professional:professional_id ( id, first_name, last_name ),
           treatment:treatment_id ( id, name, description, duration )`
        )
        .order("start_time", { ascending: true });

      if (error) {
        console.error("❌ Erro ao buscar compromissos do Supabase:", error);
        throw new Error(error.message);
      }

      console.log("✅ Compromissos carregados:", data);

      // Se `data` for nulo ou indefinido, retorna um array vazio
      if (!data) return [];

      return data.map((appointment) => ({
        id: appointment.id,
        start_time: new Date(appointment.start_time), // Converte string para Date
        end_time: new Date(appointment.end_time),
        notes: appointment.notes || "",
        patient: appointment.patient
          ? {
              id: appointment.patient?.id ?? "", // Usa "??" para evitar `undefined`
              first_name: appointment.patient?.first_name ?? "Nome não informado",
              last_name: appointment.patient?.last_name ?? "",
            }
          : null,
        professional: appointment.professional
          ? {
              id: appointment.professional?.id ?? "",
              first_name: appointment.professional?.first_name ?? "Não atribuído",
              last_name: appointment.professional?.last_name ?? "",
            }
          : null,
        treatment: appointment.treatment
          ? {
              id: appointment.treatment?.id ?? "",
              name: appointment.treatment?.name ?? "Não especificado",
              description: appointment.treatment?.description ?? "",
              duration: appointment.treatment?.duration ?? 0,
            }
          : null,
      }));
    },
  });
}
