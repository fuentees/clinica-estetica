import { useParams } from "react-router-dom";
// Importa o componente da lista (que está em src/components/patients)
import { PatientPrescriptionsList } from "../../components/patients/PatientPrescriptionsList"; 

// AQUI ESTAVA O ERRO: Precisa ter "export function" antes do nome
export function PatientPrescriptionsPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return <div>ID do paciente não encontrado.</div>;

  return (
    <div className="p-6">
      <PatientPrescriptionsList patientId={id} />
    </div>
  );
}