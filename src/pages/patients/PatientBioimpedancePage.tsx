import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { 
  Scale, 
  Save, 
  Trash2, 
  BarChart3, 
  Loader2,
  Ruler, 
  Activity
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";

// --- MÁSCARA PARA ALTURA ---
const maskHeight = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length >= 3) {
    return numbers.replace(/(\d)(\d{2})/, "$1.$2").substring(0, 4); 
  }
  return numbers;
};

// --- COMPONENTES VISUAIS ---
const KpiCard = ({ label, value, sub, color }: { label: string, value: string | number, sub: string, color: "blue" | "red" | "green" | "purple" }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
        red: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
        green: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
        purple: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
    };
    return (
        <div className={`p-4 rounded-xl border ${colors[color]} flex flex-col shadow-sm`}>
            <span className="text-xs font-bold uppercase opacity-70">{label}</span>
            <span className="text-2xl font-bold mt-1">{value}</span>
            <span className="text-xs opacity-80 mt-1">{sub}</span>
        </div>
    );
};

const MetricBox = ({ label, value, unit, color }: { label: string, value: string | number | null, unit: string, color: string }) => (
    <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
        <span className={`block font-bold text-base ${color}`}>{value ?? '-'}<small className="text-xs text-gray-400 ml-0.5">{unit}</small></span>
        <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">{label}</span>
    </div>
);

// --- PÁGINA PRINCIPAL ---
export function PatientBioimpedancePage() {
  const { id } = useParams();
  // useNavigate removido pois não é usado
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm();

  // Monitora Peso e Altura para IMC Automático
  const peso = watch("peso");
  const altura = watch("altura");

  useEffect(() => {
    if (peso && altura) {
      const p = parseFloat(peso);
      const aStr = String(altura).replace(',', '.');
      const a = parseFloat(aStr);
      
      if (p > 0 && a > 0) {
        const heightInMeters = a > 3 ? a / 100 : a;
        const imc = p / (heightInMeters * heightInMeters);
        setValue("imc", imc.toFixed(2));
      }
    }
  }, [peso, altura, setValue]);

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskHeight(e.target.value);
      setValue("altura", masked);
  };

  useEffect(() => {
    fetchHistory();
  }, [id]);

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from("bioimpedance")
        .select("*")
        .eq("patient_id", id)
        .order("data_avaliacao", { ascending: true });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === "" ? null : v])
      );

      if(cleanData.altura) {
          cleanData.altura = parseFloat(String(cleanData.altura).replace(',', '.'));
      }

      const { error } = await supabase.from("bioimpedance").insert({
        patient_id: id,
        ...cleanData
      });

      if (error) throw error;
      
      toast.success("Medidas salvas!");
      reset({ data_avaliacao: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      fetchHistory();
    } catch (err) {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Excluir esta avaliação?")) return;
    await supabase.from("bioimpedance").delete().eq("id", itemId);
    setHistory(history.filter(h => h.id !== itemId));
    toast.success("Excluído.");
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600"/></div>;

  const hasData = history.length > 0;
  const latest = hasData ? history[history.length - 1] : null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[600px]">
      
      {/* Topo */}
      <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
              <Scale className="text-pink-600" /> Acompanhamento Corporal
          </h2>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className={`${showForm ? 'bg-gray-500' : 'bg-pink-600'} hover:opacity-90 text-white`}
          >
            {showForm ? 'Cancelar' : 'Nova Avaliação'}
          </Button>
      </div>

      {/* --- MODO FORMULÁRIO --- */}
      {showForm ? (
         <div className="max-w-3xl mx-auto bg-gray-50 dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-700">
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* 1. Dados Básicos */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">Dados Gerais</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-gray-500 block mb-1">Data</label>
                            <input type="date" {...register("data_avaliacao")} defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">Peso (kg)</label>
                            <input type="number" step="0.1" {...register("peso")} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white" placeholder="0.0" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">Altura (m)</label>
                            <input 
                                type="text" 
                                {...register("altura")} 
                                onChange={handleHeightChange}
                                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white" 
                                placeholder="1.65" 
                                maxLength={4}
                            />
                        </div>
                    </div>
                    <div className="mt-3 bg-white dark:bg-gray-800 p-2 rounded border flex justify-between items-center w-full md:w-1/2">
                       <span className="text-sm font-bold text-gray-500">IMC Calculado</span>
                       <input readOnly {...register("imc")} className="w-16 text-right font-bold text-pink-600 bg-transparent outline-none" placeholder="-" />
                   </div>
                </div>

                {/* 2. Composição Corporal */}
                <div className="pt-4 border-t dark:border-gray-700">
                    <h3 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2"><Activity size={16}/> Composição Corporal</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       <InputMini label="% Gordura" register={register} name="gordura_percentual" />
                       <InputMini label="Músculo (kg)" register={register} name="massa_muscular_kg" />
                       <InputMini label="% Água" register={register} name="agua_corporal" />
                       <InputMini label="G. Visceral" register={register} name="gordura_visceral" />
                       <InputMini label="Idade Metab." register={register} name="idade_metabolica" />
                       <InputMini label="Basal (Kcal)" register={register} name="metabolismo_basal" />
                    </div>
                </div>

                {/* 3. Perimetria Completa */}
                <div className="pt-4 border-t dark:border-gray-700">
                    <h3 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2"><Ruler size={16}/> Perimetria (cm)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <InputMini label="Tórax" register={register} name="torax" />
                       <InputMini label="Cintura" register={register} name="cintura" />
                       <InputMini label="Abdômen" register={register} name="abdomen" />
                       <InputMini label="Quadril" register={register} name="quadril" />
                       <InputMini label="Braço Dir." register={register} name="braco_dir" />
                       <InputMini label="Braço Esq." register={register} name="braco_esq" />
                       <InputMini label="Coxa Dir." register={register} name="coxa_dir" />
                       <InputMini label="Coxa Esq." register={register} name="coxa_esq" />
                    </div>
                </div>

                <Button type="submit" disabled={saving} className="w-full bg-pink-600 hover:bg-pink-700 text-white h-12 text-lg">
                   {saving ? <Loader2 className="animate-spin" /> : <Save className="mr-2" size={18} />} Salvar Medição
                </Button>
             </form>
         </div>
      ) : (
        /* --- MODO DASHBOARD --- */
        <>
            {!hasData ? (
                <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-xl text-gray-400">
                    <Scale size={48} className="mx-auto mb-3 opacity-50"/>
                    <p className="text-lg">Nenhuma avaliação registrada.</p>
                    <p className="text-sm">Clique em "Nova Avaliação" para começar.</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    
                    {/* 1. KPIs */}
                    {latest && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard label="Peso Atual" value={`${latest.peso} kg`} sub="Última pesagem" color="blue" />
                            <KpiCard label="% Gordura" value={`${latest.gordura_percentual || '-'}%`} sub="Corporal" color="red" />
                            <KpiCard label="Cintura" value={`${latest.cintura || '-'} cm`} sub="Medida atual" color="green" />
                            <KpiCard label="IMC" value={`${latest.imc || '-'}`} sub="Índice atual" color="purple" />
                        </div>
                    )}

                    {/* 2. GRÁFICO */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2">
                             <BarChart3 size={18}/> Evolução da Composição
                        </h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                                        dataKey="data_avaliacao" 
                                        tickFormatter={(d) => new Date(d).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })} 
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickMargin={10}
                                    />
                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                                        labelFormatter={(l) => new Date(l).toLocaleDateString("pt-BR")} 
                                    />
                                    <Legend verticalAlign="top" height={36}/>
                                    <Area type="monotone" dataKey="gordura_percentual" name="% Gordura" stroke="#ef4444" fillOpacity={1} fill="url(#colorGordura)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="massa_muscular_kg" name="Músculo (kg)" stroke="#22c55e" fillOpacity={1} fill="url(#colorMusculo)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. HISTÓRICO TABULAR */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300">Histórico Detalhado</h3>
                        {history.slice().reverse().map((r) => (
                            <div key={r.id} className="bg-gray-50 dark:bg-gray-900/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700 relative group">
                                <button 
                                    onClick={() => handleDelete(r.id)} 
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={16}/>
                                </button>

                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-bold text-gray-800 dark:text-white capitalize">
                                        {new Date(r.data_avaliacao).toLocaleDateString("pt-BR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-600 font-mono">
                                        IMC: {r.imc}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
                                    <MetricBox label="% Gordura" value={r.gordura_percentual} unit="%" color="text-red-500" />
                                    <MetricBox label="Músculo" value={r.massa_muscular_kg} unit="kg" color="text-green-500" />
                                    <MetricBox label="Água" value={r.agua_corporal} unit="%" color="text-blue-500" />
                                    <MetricBox label="Visceral" value={r.gordura_visceral} unit="" color="text-orange-500" />
                                    <MetricBox label="TMB" value={r.metabolismo_basal} unit="kcal" color="text-purple-500" />
                                    <MetricBox label="Metabólica" value={r.idade_metabolica} unit="anos" color="text-gray-500" />
                                </div>

                                {(r.cintura || r.abdomen || r.quadril) && (
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Medidas</p>
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs text-gray-600 dark:text-gray-300">
                                            {r.cintura && <span>Cintura: <strong>{r.cintura}</strong></span>}
                                            {r.abdomen && <span>Abdômen: <strong>{r.abdomen}</strong></span>}
                                            {r.quadril && <span>Quadril: <strong>{r.quadril}</strong></span>}
                                            {r.braco_dir && <span>Braço D: <strong>{r.braco_dir}</strong></span>}
                                            {r.coxa_dir && <span>Coxa D: <strong>{r.coxa_dir}</strong></span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
}

const InputMini = ({ label, register, name }: any) => (
    <div>
        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{label}</label>
        <input type="number" step="0.01" {...register(name)} className="w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-pink-500 transition-colors" />
    </div>
);