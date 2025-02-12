import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Patient } from '../../types/patient';

export function PatientHistoryPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatient() {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select("*, profiles:profile_id ( first_name, last_name, email, phone ), patient_treatments ( *, treatments ( name, description ), appointments ( start_time, end_time, status, notes ) )")
          .eq('id', id)
          .single();

        if (error) throw error;
        setPatient(data);
      } catch (error) {
        console.error('Error loading patient:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPatient();
  }, [id]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!patient) {
    return <div>Paciente não encontrado</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Histórico do Paciente: {patient.profiles.first_name} {patient.profiles.last_name}
      </h1>

      <div className="space-y-6">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Informações Pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p>{patient.profiles.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p>{patient.profiles.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CPF</p>
              <p>{patient.cpf}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Data de Nascimento</p>
              <p>{new Date(patient.date_of_birth).toLocaleDateString()}</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Histórico Médico</h2>
          <p className="whitespace-pre-wrap">{patient.medical_history || 'Nenhum histórico registrado'}</p>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Alergias</h2>
          <p className="whitespace-pre-wrap">{patient.allergies || 'Nenhuma alergia registrada'}</p>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tratamentos Realizados</h2>
          {patient.patient_treatments?.length > 0 ? (
            <div className="space-y-4">
              {patient.patient_treatments.map((treatment) => (
                <div key={treatment.id} className="border-b pb-4">
                  <h3 className="font-medium">{treatment.treatments.name}</h3>
                  <p className="text-sm text-gray-600">{treatment.treatments.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Data: {new Date(treatment.appointments.start_time).toLocaleDateString()}
                  </p>
                  {treatment.notes && (
                    <p className="text-sm mt-2">Observações: {treatment.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>Nenhum tratamento registrado</p>
          )}
        </section>
      </div>
    </div>
  );
}
