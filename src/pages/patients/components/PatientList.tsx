import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import type { Patient } from "../../../types/patient";

interface PatientListProps {
  searchTerm: string;
}

export function PatientList({ searchTerm }: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*, profiles:profile_id (first_name, last_name, email, phone)")
          .ilike("profiles.first_name", `%${searchTerm}%`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        console.error("Erro ao carregar pacientes:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, [searchTerm]);

  if (loading) {
    return <div>Carregando...</div>;
  }

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
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td>
                <Link to={`patients/${patient.id}`} className="text-blue-600 hover:text-blue-800">
                  {patient.profiles.first_name} {patient.profiles.last_name}
                </Link>
              </td>
              <td>{patient.cpf}</td>
              <td>{new Date(patient.date_of_birth).toLocaleDateString()}</td>
              <td>
                <Link to={`/patients/${patient.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                  Editar
                </Link>
                <Link to={`/patients/${patient.id}/history`} className="text-green-600 hover:text-green-900">
                  Histórico
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
