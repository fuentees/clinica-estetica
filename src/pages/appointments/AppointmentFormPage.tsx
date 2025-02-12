import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import type { AppointmentFormData } from "../../../types/appointment";
import { scheduleAppointmentReminder } from "../../../utils/scheduleReminder";

export function AppointmentFormPage() {
  const navigate = useNavigate();

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      console.log("Enviando dados para criar consulta:", data);

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          ...data,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Consulta criada com sucesso:", appointment);

      toast.success("Consulta agendada com sucesso!");
      navigate("/appointments");
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      toast.error("Erro ao agendar consulta");
    }
  };

  return (
    <div>
      <h1>Formulário de Consulta</h1>
      {/* Adicione o formulário aqui */}
    </div>
  );
}
