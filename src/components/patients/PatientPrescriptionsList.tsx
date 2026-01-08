import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { FileText, Calendar, Stethoscope, ChevronRight, Plus, Printer } from "lucide-react";
// O import abaixo sobe para 'src/components' e entra em 'ui'
import { Button } from "../ui/button";

interface Props {
  patient_id: string;
}

export function PatientPrescriptionsList({ patientId }: Props) {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      fetchData();
    }
  }, [patientId]);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          id, 
          created_at, 
          notes,
          professional:profiles(first_name, last_name, name, email)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const getProfName = (p: any) => {
      const prof = Array.isArray(p.professional) ? p.professional[0] : p.professional;
      if (!prof) return 'Profissional';
      const name = prof.first_name 
        ? `${prof.first_name} ${prof.last_name || ''}` 
        : (prof.name || prof.email);
      return name;
  };

  const handleOpen = (id: string) => {
      navigate(`/prescriptions/new?id=${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-pink-600"/>
            Histórico de Receitas
        </h3>
        
        <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/prescriptions/new')} 
            className="text-pink-600 hover:bg-pink-50 border-pink-200"
        >
            <Plus size={16} className="mr-2"/> Nova Receita
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando histórico...</div>
        ) : prescriptions.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center text-gray-400">
                <FileText size={32} className="mb-2 opacity-20"/>
                <p>Nenhuma receita registrada.</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {prescriptions.map(item => (
                    <div 
                        key={item.id} 
                        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                        onClick={() => handleOpen(item.id)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 flex items-center justify-center">
                                <FileText size={18}/>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {item.notes || "Receita Médica"}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12}/>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Stethoscope size={12}/>
                                        {getProfName(item)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-300 group-hover:text-pink-600">
                                <Printer size={18}/>
                            </Button>
                            <ChevronRight size={18} className="text-gray-300"/>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}