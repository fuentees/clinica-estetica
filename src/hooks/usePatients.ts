import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Patient } from "../types/patient";

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name");

      if (error) {
        console.error("❌ Erro ao buscar pacientes:", error);
        throw new Error(error.message);
      }

      console.log("✅ Pacientes carregados:", data);
      return data as Patient[];
    },
  });
}
