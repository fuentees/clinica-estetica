import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Loader2, ArrowLeft, BarChart3, Scale, FileText } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { toast } from "react-hot-toast";

// Tipagem dos dados do banco
type BioRecord = {
  id: string;
  data: string;
  peso: number;
  altura: number;
  imc: number;
  gordura_percentual: number;
  massa_magra_percentual: number;
  agua_percentual: number;
  gordura_visceral: number;
  massa_muscular_kg: number; // Nome da coluna no banco: massa_muscular_esqueletica_kg
  massa_gorda_kg: number;
  massa_ossea_kg: number;
  tmb: number;
  idade_metabolica: number;
  whr: number; // Razão Cintura/Quadril
  nivel_retencao_hidrica: string;
  observacoes: string;
  arquivo_balanca: string;
};

// Componente Auxiliar para Cards de KPI
const KpiCard = ({ label, value, sub, color }: { label: string, value: string | number, sub: string, color: "blue" | "red" | "green" | "purple" }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
        red: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
        green: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
        purple: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
    };
    return (
        <div className={`p-4 rounded-xl border ${colors[color]} flex flex-col`}>
            <span className="text-xs font-bold uppercase opacity-70">{label}</span>
            <span className="text-2xl font-bold mt-1">{value}</span>
            <span className="text-xs opacity-80 mt-1">{sub}</span>
        </div>
    );
};

const MetricBox = ({ label, value, unit, color }: { label: string, value: string | number | null, unit: string, color: string }) => (
    <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <span className={`block font-bold text-lg ${color}`}>{value ?? '-'}<small className="text-xs text-gray-400 ml-0.5">{unit}</small></span>
        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">{label}</span>
    </div>
);

export function PatientBioimpedancePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [records, setRecords] = useState<BioRecord[]>([]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);

      // 1. Carrega nome do paciente
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("profiles(first_name, last_name)")
        .eq("id", id)
        .single();

      if (patientError) throw patientError;

      // @ts-ignore
      const profile = patientData.profiles;
      // Verifica se profiles é array ou objeto
      const profData = Array.isArray(profile) ? profile[0] : profile;
      
      setPatientName(`${profData?.first_name || ''} ${profData?.last_name || ''}`.trim());

      // 2. Carrega histórico de bioimpedância ordenado por data
      const { data: bio, error: bioError } = await supabase
        .from("patient_bioimpedance")
        .select("*")
        .eq("patient_id", id)
        .order("data", { ascending: true });

      if (bioError) throw bioError;

      // Mapeia os dados do banco para o tipo BioRecord (ajustando nomes de colunas se necessário)
      const formattedRecords = (bio || []).map((item: any) => ({
          ...item,
          // Garante compatibilidade caso o nome da coluna varie
          massa_muscular_kg: item.massa_muscular_esqueletica_kg || item.massa_muscular_kg,
          razao_cintura_quadril: item.razao_cintura_quadril || item.whr
      }));

      setRecords(formattedRecords);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar histórico de bioimpedância.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
      </div>
    );
  }

  const hasData = records.length > 0;
  // Dados mais recentes para destaque
  const latest = hasData ? records[records.length - 1] : null;

  return (
    <div className="p-6 max-w-6xl mx-auto pb-20">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/patients/${id}/history`)}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="text-pink-600" /> Evolução Corporal
            </h1>
            <p className="text-sm text-gray-500">{patientName}</p>
          </div>
        </div>
        <Button 
            onClick={() => navigate(`/patients/${id}/sessions/new`)} 
            className="bg-pink-600 hover:bg-pink-700 text-white shadow-md"
        >
            <Scale size={18} className="mr-2" /> Nova Medição
        </Button>
      </div>

      {!hasData ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-12 rounded-xl text-center dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
          <Scale className="mx-auto h-12 w-12 text-yellow-600 mb-3 opacity-50" />
          <p className="font-bold text-lg">Nenhuma avaliação registrada.</p>
          <p className="text-sm mt-2">Clique em "Nova Medição" para registrar a primeira bioimpedância.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Destaques da Última Medição */}
          {latest && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="Peso Atual" value={`${latest.peso} kg`} sub="Última pesagem" color="blue" />
                  <KpiCard label="% Gordura" value={`${latest.gordura_percentual}%`} sub="Ideal: 18-28%" color="red" />
                  <KpiCard label="Massa Muscular" value={`${latest.massa_muscular_kg} kg`} sub="Esquelética" color="green" />
                  <KpiCard label="Idade Metabólica" value={`${latest.idade_metabolica} anos`} sub="Referência" color="purple" />
              </div>
          )}

          {/* GRÁFICO PRINCIPAL: GORDURA vs MÚSCULO (Área) */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-500"/> Gráfico de Composição
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={records} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGordura" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMusculo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="data" 
                    tickFormatter={(d) => new Date(d).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })} 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickMargin={10}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                    labelFormatter={(l) => new Date(l).toLocaleDateString("pt-BR")} 
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area 
                    type="monotone" 
                    dataKey="gordura_percentual" 
                    name="% Gordura" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorGordura)" 
                    strokeWidth={3} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="massa_muscular_kg" 
                    name="Músculo (kg)" 
                    stroke="#22c55e" 
                    fillOpacity={1} 
                    fill="url(#colorMusculo)" 
                    strokeWidth={3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO SECUNDÁRIO: ÁGUA E TMB (Linha) */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Hidratação e Metabolismo</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={records} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="data" 
                    tickFormatter={(d) => new Date(d).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}
                    stroke="#9ca3af"
                  />
                  <YAxis yAxisId="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                  <Tooltip labelFormatter={(l) => new Date(l).toLocaleDateString("pt-BR")} />
                  <Legend />
                  
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="agua_percentual" 
                    name="% Água" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={{r: 4}}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="tmb" 
                    name="TMB (Kcal)" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={{r: 4}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* HISTÓRICO DETALHADO (CARDS) */}
          <div className="space-y-4">
              <h3 className="font-bold text-gray-700 dark:text-white text-lg ml-1">Histórico de Medições</h3>
              {records.slice().reverse().map((r) => (
                <div key={r.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                      <div>
                          <p className="text-lg font-bold text-gray-800 dark:text-white capitalize">
                            {new Date(r.data).toLocaleDateString("pt-BR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <div className="flex gap-3 text-xs text-gray-500 mt-1">
                              <span>TMB: <strong>{r.tmb} kcal</strong></span>
                              <span>•</span>
                              <span>Visceral: <strong>{r.gordura_visceral}</strong></span>
                              <span>•</span>
                              <span>RCQ: <strong>{r.whr || '-'}</strong></span>
                          </div>
                      </div>
                      {r.arquivo_balanca && (
                          <a 
                            href={r.arquivo_balanca} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                              <FileText size={16} /> Ver Ficha Original
                          </a>
                      )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricBox label="% Gordura" value={r.gordura_percentual} unit="%" color="text-red-500" />
                      <MetricBox label="Massa Muscular" value={r.massa_muscular_kg} unit="kg" color="text-green-500" />
                      <MetricBox label="Retenção Hídrica" value={r.nivel_retencao_hidrica || '-'} unit="" color="text-blue-500" />
                      <MetricBox label="Idade Metab." value={r.idade_metabolica} unit="anos" color="text-purple-500" />
                  </div>

                  {r.observacoes && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-600 dark:text-gray-300 italic">
                          "{r.observacoes}"
                      </div>
                  )}
                </div>
              ))}
          </div>

        </div>
      )}
    </div>
  );
}