import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PatientList } from './components/PatientList';

export function PatientsPage() {
  const [search, setSearch] = useState('');

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

      <PatientList searchTerm={search} />
    </div>
  );
}