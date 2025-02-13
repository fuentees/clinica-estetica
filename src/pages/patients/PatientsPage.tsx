import { Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { supabase } from '../../lib/supabase';
import { PatientList } from './components/PatientList';
import type { Patient } from "../../types/patient";

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('id, profile_id, first_name, last_name, email, phone, date_of_birth, cpf, address, medical_history, allergies, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar pacientes:', error);
      } else {
        setPatients(data as Patient[] || []);
      }
      setLoading(false);
    }

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) =>
    `${patient.first_name ?? ''} ${patient.last_name ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Link to="/patients/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar pacientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando pacientes...</p>
      ) : (
        <PatientList patients={filteredPatients} />
      )}
    </div>
  );
}
