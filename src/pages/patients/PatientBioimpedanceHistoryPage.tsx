import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Loader2, ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-hot-toast";

type BioRecord = {
  id: string;
  data: string;
  equipamento: string | null;
  responsavel: string | null;
  gordura_percentual: number | null;
  massa_magra_percentual: number | null;
  agua_percentual: number | null;
  gordura_visceral: number | null;
  massa_muscular_kg: number | null;
  massa_gorda_kg: number | null;
  massa_ossea_kg: number | null;
  tmb: number | null;
  idade_metabolica: number | null;
  whr: number | null;
  observacoes: string | null;
};

export function PatientBioimpedanceHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [records, setRecords] = useState<BioRecord[]>([]);

  useEffect(() => {
    if (id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);

      // 1) Carrega nome do paciente + perfil
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id, profile_id, profiles:profile_id(first_name, last_name)")
        .eq("id", id)
        .single();

      if (patientError) throw patientError;

      const patient: any = patientData || {};
      let profile = patient.profiles;

      if (Array.isArray(profile)) {
        profile = profile[0];
      }

      const firstName = profile?.first_name ?? "";
      const lastName = profile?.last_name ?? "";

      setPatientName(`${firstName} ${lastName}`.trim());

      // 2) Carrega histórico de bioimpedância
      const { data: bio, error: bioError } = await supabase
        .from("patient_bioimpedance")
        .select(
          `
          id,
          data,
          equipamento,
          responsavel,
          gordura_percentual,
          massa_magra_percentual,
          agua_percentual,
          gordura_visceral,
          massa_muscular_kg,
          massa_gorda_kg,
          massa_ossea_kg,
          tmb,
          idade_metabolica,
          whr,
          observacoes
        `
        )
        .eq("patient_id", id)
        .order("data", { ascending: true });

      if (bioError) throw bioError;

      setRecords((bio || []) as BioRecord[]);
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
        <Loader2 className="animate-spin text-pink-600" />
      </div>
    );
  }

  const hasData = records.length > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto pb-20">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/patients/${id}/history`)}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="text-pink-600" /> Evolução da Bioimpedância
            </h1>
            <p className="text-sm text-gray-500">{patientName}</p>
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl">
          Nenhuma avaliação de bioimpedância registrada ainda para este paciente.
        </div>
      )}

      {hasData && (
        <div className="space-y-8">
          {/* Bloco 1 – Composição Corporal */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Composição Corporal (%)
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={records}>
                  <XAxis
                    dataKey="data"
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) =>
                      typeof value === "number" ? value.toFixed(1) : value
                    }
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString("pt-BR")
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="gordura_percentual"
                    name="% Gordura"
                    stroke="#ef4444"
                    dot
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="massa_magra_percentual"
                    name="% Massa magra"
                    stroke="#22c55e"
                    dot
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="agua_percentual"
                    name="% Água"
                    stroke="#3b82f6"
                    dot
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bloco 2 – Risco Metabólico */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Marcadores de Risco Metabólico
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={records}>
                  <XAxis
                    dataKey="data"
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) =>
                      typeof value === "number" ? value.toFixed(1) : value
                    }
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString("pt-BR")
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="gordura_visceral"
                    name="Gordura visceral (nível)"
                    stroke="#a855f7"
                    dot
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="idade_metabolica"
                    name="Idade metabólica"
                    stroke="#f97316"
                    dot
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="whr"
                    name="WHR (cintura/quadril)"
                    stroke="#10b981"
                    dot
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bloco 3 – Lista das avaliações */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Avaliações registradas
            </h2>
            <div className="space-y-4">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between border-b last:border-b-0 pb-3 md:pb-2 gap-2"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {new Date(r.data).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.equipamento || "Equipamento não informado"} •{" "}
                      {r.responsavel || "Responsável não informado"}
                    </p>
                    {r.observacoes && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {r.observacoes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {r.gordura_percentual != null && (
                      <BadgeInfo label="% gordura" value={r.gordura_percentual} />
                    )}
                    {r.massa_magra_percentual != null && (
                      <BadgeInfo label="% magra" value={r.massa_magra_percentual} />
                    )}
                    {r.gordura_visceral != null && (
                      <BadgeInfo label="visceral" value={r.gordura_visceral} />
                    )}
                    {r.tmb != null && (
                      <BadgeInfo label="TMB" value={r.tmb} suffix="kcal" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BadgeInfo({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
      <span className="font-semibold mr-1">{label}:</span>
      <span>
        {value}
        {suffix ? ` ${suffix}` : ""}
      </span>
    </span>
  );
}
