import { useState } from "react";
import { usePatients } from "../../hooks/usePatients"; // Hook para carregar pacientes
import { useAppointments } from "../../hooks/useAppointments";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

export function AppointmentFormPage() {
  const navigate = useNavigate();
  const { data: patients, isLoading: loadingPatients } = usePatients(); // Obtém pacientes cadastrados
  const { data: appointments } = useAppointments();
  const [patientId, setPatientId] = useState(""); // Estado para armazenar o paciente selecionado
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Previne envios duplicados

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId || !startTime || !endTime) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true); // Evita envios duplicados

    console.log("Enviando consulta com:", { patientId, startTime, endTime, notes });

    const { error } = await supabase
      .from("appointments")
      .insert([{ patient_id: patientId, start_time: startTime, end_time: endTime, notes }]);

    if (error) {
      console.error("❌ Erro ao salvar consulta:", error);
      toast.error("Erro ao agendar consulta. Tente novamente.");
      setIsSubmitting(false);
      return;
    }

    toast.success("✅ Consulta salva com sucesso!");
    navigate("/appointments");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📅 Agendar Consulta</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropdown para selecionar o paciente */}
        <div>
          <label className="block text-sm font-medium">Paciente *</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full p-2 border rounded"
            required
            disabled={loadingPatients}
          >
            <option value="">Selecione um paciente</option>
            {loadingPatients ? (
              <option>Carregando pacientes...</option>
            ) : (
              patients?.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Campo de Data e Hora de Início */}
        <div>
          <label className="block text-sm font-medium">Início *</label>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Campo de Data e Hora de Término */}
        <div>
          <label className="block text-sm font-medium">Término *</label>
          <Input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium">Notas</label>
          <textarea
            className="w-full p-2 border rounded"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
        </div>

        {/* Botão de salvar */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Consulta"}
        </Button>
      </form>
    </div>
  );
}
