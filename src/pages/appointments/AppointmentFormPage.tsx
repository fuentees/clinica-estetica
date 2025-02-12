import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase"; // ✅ Ajustado caminho
import type { AppointmentFormData } from "../../types/appointment"; // ✅ Ajustado caminho
import { scheduleAppointmentReminder } from "../../utils/scheduleReminder";
import { FormEvent, useState } from "react";

export function AppointmentFormPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AppointmentFormData>({
    patient_id: "",
    professional_id: "",
    treatment_id: "",
    start_time: "",
    end_time: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ✅ Agora é um evento de formulário válido

    try {
      console.log("🚀 Enviando dados para criar consulta:", formData);

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          ...formData,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar lembrete para o paciente (se necessário)
      await scheduleAppointmentReminder(appointment);

      toast.success("Consulta agendada com sucesso!");
      navigate("/appointments");
    } catch (error) {
      console.error("❌ Erro ao salvar consulta:", error);
      toast.error("Erro ao salvar a consulta. Tente novamente.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">📅 Agendar Consulta</h1>
      <p className="text-gray-600">Preencha os dados abaixo para criar uma nova consulta.</p>

      <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Paciente</label>
            <input
              type="text"
              name="patient_id"
              value={formData.patient_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Profissional</label>
            <input
              type="text"
              name="professional_id"
              value={formData.professional_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tratamento</label>
            <input
              type="text"
              name="treatment_id"
              value={formData.treatment_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data</label>
            <input
              type="date"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Hora de término</label>
          <input
            type="time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Agendar Consulta
        </button>
      </form>
    </div>
  );
}
