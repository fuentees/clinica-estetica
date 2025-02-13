import { Link } from "react-router-dom";
import type { Patient } from "../../../types/patient";

interface PatientListProps {
  patients: Patient[];
}

export function PatientList({ patients }: PatientListProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Data de Nascimento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {patients.length > 0 ? (
            patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-100">
                <td className="px-4 py-2">
                  <Link to={`/patients/${patient.id}`} className="text-blue-600 hover:text-blue-800">
                    {patient.first_name ?? "Nome não informado"} {patient.last_name ?? ""}
                  </Link>
                </td>
                <td className="px-4 py-2">{patient.cpf}</td>
                <td className="px-4 py-2">{new Date(patient.date_of_birth).toLocaleDateString()}</td>
                <td className="px-4 py-2 flex space-x-4">
                  <Link to={`/patients/${patient.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                    Editar
                  </Link>
                  <Link to={`/patients/${patient.id}/history`} className="text-green-600 hover:text-green-900">
                    Histórico
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-500">
                Nenhum paciente encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
