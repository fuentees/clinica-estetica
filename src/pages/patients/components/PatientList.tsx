import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  User, Calendar, FileSignature, 
  History, Edit3, ChevronRight, 
  Search, ShieldCheck 
} from "lucide-react";
import type { Patient } from "../../../types/patient";
import { ConsentForm } from "./ConsentForm";
import { Button } from "../../../components/ui/button";

interface PatientListProps {
  patients: Patient[];
}

export function PatientList({ patients }: PatientListProps) {
  const [selectedPatientForConsent, setSelectedPatientForConsent] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Grid de Cards de Pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <div 
              key={patient.id} 
              className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-xl hover:border-pink-100 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 flex items-center justify-center text-pink-600 font-bold text-xl shadow-inner">
                    {patient.first_name?.[0] || <User size={24} />}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white leading-tight">
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      CPF: {patient.cpf || "---.---.------"}
                    </p>
                  </div>
                </div>
                <Link 
                  to={`/patients/${patient.id}/anamnesis`} 
                  className="p-2 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-all"
                  title="Abrir Prontuário"
                >
                  <ChevronRight size={20} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
                     <Calendar size={10}/> Nascimento
                   </p>
                   <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                     {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                   </p>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
                     <ShieldCheck size={10}/> Status
                   </p>
                   <p className="text-[10px] font-black text-emerald-600 uppercase">Ativo</p>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setSelectedPatientForConsent(patient.id)}
                  className="h-10 rounded-xl text-[10px] font-black uppercase tracking-tighter border-pink-100 text-pink-600 hover:bg-pink-50"
                >
                  <FileSignature size={14} className="mr-2" />
                  Termo
                </Button>
                <Link to={`/patients/${patient.id}/edit`} className="w-full">
                  <Button variant="outline" className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                    <Edit3 size={14} className="mr-2" />
                    Editar
                  </Button>
                </Link>
                <Link to={`/patients/${patient.id}/history`} className="col-span-2">
                  <Button className="w-full h-10 rounded-xl bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest">
                    <History size={14} className="mr-2" />
                    Histórico de Procedimentos
                  </Button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700">
            <Search size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">
              Nenhum paciente cadastrado nesta unidade.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Consentimento */}
      {selectedPatientForConsent && (
        <ConsentForm 
          patientId={selectedPatientForConsent}
          treatmentId="general" // Pode ser dinâmico depois
          onClose={() => setSelectedPatientForConsent(null)}
        />
      )}
    </div>
  );
}