import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  Activity, 
  Scale, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  Calendar
} from "lucide-react";
import { Button } from "../../components/ui/button";

// --- CORREÇÃO DO CAMINHO DE IMPORTAÇÃO ---
// Como o arquivo está dentro de pages/patients/components/patient...
// Usamos "./" para começar na pasta atual (pages/patients)
import { PatientPackagesWidget } from "./components/patient/PatientPackagesWidget";

export function PatientOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    lastTreatment: null,
    lastBio: null,
    totalSessions: 0,
    nextAppointment: null
  });

  useEffect(() => {
    async function loadOverview() {
      try {
        const { data: treatments } = await supabase.from("treatments").select("*").eq("patient_id", id).order("data_procedimento", { ascending: false }).limit(1);
        const { data: bio } = await supabase.from("bioimpedance").select("*").eq("patient_id", id).order("data_avaliacao", { ascending: false }).limit(2);
        const { count } = await supabase.from("treatments").select("*", { count: 'exact', head: true }).eq("patient_id", id);
        
        setData({
          lastTreatment: treatments?.[0] || null,
          lastBio: bio || [],
          totalSessions: count || 0,
          nextAppointment: null 
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadOverview();
  }, [id]);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  const bioCurrent = data.lastBio?.[0];
  const bioPrevious = data.lastBio?.[1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* --- COLUNA ESQUERDA (RESUMO) --- */}
      <div className="lg:col-span-2 space-y-6">
          
          {/* CARD 1: Status Clínico */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-600"><Activity size={24} /></div>
                    <span className="text-xs font-bold uppercase text-gray-400">Tratamentos</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{data.totalSessions} Sessões</h3>
                <p className="text-sm text-gray-500 mb-4">Realizadas até hoje</p>
                
                {data.lastTreatment ? (
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Último Procedimento</p>
                        <p className="font-semibold text-gray-800 dark:text-white truncate">{data.lastTreatment.tipo_procedimento}</p>
                        <p className="text-xs text-gray-500">{new Date(data.lastTreatment.data_procedimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                ) : (
                    <div className="text-sm text-gray-400 italic">Nenhum procedimento registrado.</div>
                )}
                
                <Button variant="ghost" onClick={() => navigate("evolution")} className="w-full mt-4 text-pink-600 hover:text-pink-700 hover:bg-pink-50">
                    Ver Histórico <ArrowRight size={16} className="ml-2"/>
                </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD 2: Bioimpedância Rápida */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600"><Scale size={24} /></div>
                        <span className="text-xs font-bold uppercase text-gray-400">Corporal</span>
                    </div>
                    {bioCurrent ? (
                        <>
                            <div className="flex items-end gap-2 mb-1">
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{bioCurrent.peso} kg</h3>
                                {bioPrevious && (
                                    <span className={`text-xs font-bold mb-1 ${bioCurrent.peso < bioPrevious.peso ? 'text-green-500' : 'text-red-500'}`}>
                                        {bioCurrent.peso < bioPrevious.peso ? '▼' : '▲'} {Math.abs(bioCurrent.peso - bioPrevious.peso).toFixed(1)}kg
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mb-4">em {new Date(bioCurrent.data_avaliacao).toLocaleDateString('pt-BR')}</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg text-center">
                                    <span className="text-xs text-gray-400 block">Gordura</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{bioCurrent.gordura_percentual || '-'}%</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg text-center">
                                    <span className="text-xs text-gray-400 block">Músculo</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{bioCurrent.massa_muscular_kg || '-'}kg</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400"><span className="text-sm">Sem dados</span></div>
                    )}
                    <Button variant="ghost" onClick={() => navigate("bioimpedance")} className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        Ver Gráficos <ArrowRight size={16} className="ml-2"/>
                    </Button>
                </div>

                {/* CARD 3: Agenda */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600"><Calendar size={24} /></div>
                        <span className="text-xs font-bold uppercase text-gray-400">Agenda</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1"><AlertCircle size={16} className="text-orange-500"/></div>
                            <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Próximo Retorno</p>
                                <p className="text-xs text-gray-500">{data.lastTreatment?.proxima_sessao ? new Date(data.lastTreatment.proxima_sessao).toLocaleDateString('pt-BR') : "Não agendado"}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-3">
                        <Button onClick={() => navigate("evolution")} variant="outline" className="text-xs">+ Evolução</Button>
                        <Button onClick={() => navigate("/appointments/new")} className="bg-purple-600 hover:bg-purple-700 text-white text-xs">Agendar</Button>
                    </div>
                </div>
          </div>
      </div>

      {/* --- COLUNA DIREITA (WIDGET DE PACOTES) --- */}
      <div className="lg:col-span-1 space-y-6">
          {/* Widget de Pacotes */}
          <PatientPackagesWidget patientId={id!} /> 
      </div>

    </div>
  );
}