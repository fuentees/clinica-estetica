import { useEffect, useState } from "react";
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
  Activity,
  Droplets,
  Flame,
  Calendar,
  Plus,
  AlertTriangle // Adicionado
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

// --- COMPONENTES VISUAIS PREMIUM ---
const KpiCard = ({ label, value, sub, color, icon: Icon }: { label: string, value: string | number, sub: string, color: "blue" | "red" | "green" | "purple" | "orange", icon: any }) => {
    const styles = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        red: "bg-rose-50 text-rose-700 border-rose-100",
        green: "bg-emerald-50 text-emerald-700 border-emerald-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        orange: "bg-amber-50 text-amber-700 border-amber-100",
    };
    
    return (
        <div className={`p-5 rounded-2xl border ${styles[color]} flex flex-col shadow-sm relative overflow-hidden group hover:shadow-md transition-all`}>
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={48} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{label}</span>
            <span className="text-3xl font-black tracking-tight z-10">{value}</span>
            <span className="text-xs font-medium opacity-80 mt-1 z-10">{sub}</span>
        </div>
    );
};

const MetricBox = ({ label, value, unit, color, icon: Icon }: any) => (
    <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
        <div className={`p-2 rounded-full mb-2 bg-gray-50 group-hover:bg-${color.split('-')[1]}-50 transition-colors`}>
            <Icon size={16} className={color}/>
        </div>
        <span className={`block font-bold text-lg ${color}`}>{value ?? '-'}<small className="text-xs text-gray-400 ml-0.5">{unit}</small></span>
        <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">{label}</span>
    </div>
);

// --- PÁGINA PRINCIPAL ---
export function PatientBioimpedancePage() {
  const { id } = useParams();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm();

  // IMC Automático
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
        .from("bioimpedance_records")
        .select("*")
        .eq("patient_id", id)
        .order("date", { ascending: true });

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

      // Ajuste de nomes para bater com a tabela nova
      const payload = {
          patient_id: id,
          date: cleanData.data_avaliacao,
          weight: cleanData.peso,
          height: cleanData.altura,
          bmi: cleanData.imc,
          body_fat_percent: cleanData.gordura_percentual,
          muscle_mass_kg: cleanData.massa_muscular_kg,
          body_water_percent: cleanData.agua_corporal,
          visceral_fat_level: cleanData.gordura_visceral,
          metabolic_age: cleanData.idade_metabolica,
          basal_metabolic_rate: cleanData.metabolismo_basal,
          // Perimetria
          cintura: cleanData.cintura,
          abdomen: cleanData.abdomen,
          quadril: cleanData.quadril,
          braco_dir: cleanData.braco_dir,
          coxa_dir: cleanData.coxa_dir
      };

      const { error } = await supabase.from("bioimpedance_records").insert(payload);

      if (error) throw error;
      
      toast.success("Medidas salvas com sucesso!");
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
    if (!confirm("Excluir esta avaliação permanentemente?")) return;
    await supabase.from("bioimpedance_records").delete().eq("id", itemId);
    setHistory(history.filter(h => h.id !== itemId));
    toast.success("Exame excluído.");
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-rose-600 w-10 h-10"/></div>;

  const hasData = history.length > 0;
  const latest = hasData ? history[history.length - 1] : null;

  return (
    <div className="bg-gray-50/50 dark:bg-gray-900 min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-3 bg-rose-100 rounded-xl"><Scale className="text-rose-600 w-8 h-8" /></div>
                  Bioimpedância
              </h1>
              <p className="text-gray-500 mt-2 ml-16">Monitore a evolução corporal e métricas de saúde.</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className={`px-6 py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 ${showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
          >
            {showForm ? <span className="flex items-center gap-2"><Trash2 size={18}/> Cancelar</span> : <span className="flex items-center gap-2"><Plus size={18}/> Novo Exame</span>}
          </Button>
      </div>

      {/* --- MODO FORMULÁRIO --- */}
      {showForm ? (
         <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-4">
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Seção 1: Dados Gerais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Data da Avaliação</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
                            <input type="date" {...register("data_avaliacao")} defaultValue={new Date().toISOString().split('T')[0]} className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-gray-700 font-medium" />
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Peso (kg)</label>
                        <input type="number" step="0.1" {...register("peso")} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-gray-800 font-bold text-lg" placeholder="0.0" />
                    </div>
                    <div className="col-span-1">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Altura (m)</label>
                        <input type="text" {...register("altura")} onChange={handleHeightChange} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-gray-800 font-bold text-lg" placeholder="1.70" maxLength={4} />
                    </div>
                </div>

                {/* IMC Calculado (Visual) */}
                <div className="bg-gradient-to-r from-rose-50 to-purple-50 p-4 rounded-xl border border-rose-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Activity className="text-rose-500" />
                        <span className="text-sm font-bold text-rose-800">IMC Calculado Automaticamente</span>
                    </div>
                    <input readOnly {...register("imc")} className="w-24 text-right text-2xl font-black text-purple-700 bg-transparent outline-none" placeholder="--" />
                </div>

                {/* Seção 2: Composição */}
                <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2"><Scale size={16} className="text-purple-500"/> Composição Corporal</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InputModern label="% Gordura" register={register} name="gordura_percentual" icon={Flame} color="text-red-500" />
                        <InputModern label="Músculo (kg)" register={register} name="massa_muscular_kg" icon={Activity} color="text-green-500" />
                        <InputModern label="% Água" register={register} name="agua_corporal" icon={Droplets} color="text-blue-500" />
                        <InputModern label="Visceral" register={register} name="gordura_visceral" icon={AlertTriangle} color="text-orange-500" />
                        <InputModern label="Idade Metab." register={register} name="idade_metabolica" icon={Calendar} color="text-gray-500" />
                        <InputModern label="Basal (Kcal)" register={register} name="metabolismo_basal" icon={Flame} color="text-purple-500" />
                    </div>
                </div>

                {/* Seção 3: Perimetria */}
                <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2"><Ruler size={16} className="text-blue-500"/> Perimetria (cm)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <InputSimple label="Cintura" register={register} name="cintura" />
                        <InputSimple label="Abdômen" register={register} name="abdomen" />
                        <InputSimple label="Quadril" register={register} name="quadril" />
                        <InputSimple label="Braço Dir." register={register} name="braco_dir" />
                        <InputSimple label="Coxa Dir." register={register} name="coxa_dir" />
                    </div>
                </div>

                <Button type="submit" disabled={saving} className="w-full bg-rose-600 hover:bg-rose-700 text-white h-14 rounded-2xl text-lg font-bold shadow-xl shadow-rose-200 transition-all transform hover:-translate-y-1">
                    {saving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>} Salvar Avaliação
                </Button>
             </form>
         </div>
      ) : (
        /* --- MODO DASHBOARD --- */
        <>
            {!hasData ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Scale size={32} className="text-gray-300"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Nenhum exame encontrado</h3>
                    <p className="text-gray-500 mt-2">Clique em "Novo Exame" para começar o acompanhamento.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    
                    {/* 1. KPIs DESTAQUE */}
                    {latest && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4">
                            <KpiCard label="Peso Atual" value={`${latest.weight} kg`} sub="Última pesagem" color="blue" icon={Scale} />
                            <KpiCard label="% Gordura" value={`${latest.body_fat_percent || '-'}%`} sub="Corporal" color="red" icon={Flame} />
                            <KpiCard label="Massa Muscular" value={`${latest.muscle_mass_kg || '-'} kg`} sub="Esquelética" color="green" icon={Activity} />
                            <KpiCard label="IMC" value={`${latest.bmi || '-'}`} sub="Índice de Massa" color="purple" icon={Activity} />
                        </div>
                    )}

                    {/* 2. GRÁFICO PREMIUM */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-8 flex items-center gap-2">
                             <BarChart3 className="text-rose-500"/> Evolução da Composição Corporal
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorGordura" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorMusculo" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(d) => new Date(d).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })} 
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                                        labelFormatter={(l) => new Date(l).toLocaleDateString("pt-BR")} 
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle"/>
                                    <Area type="monotone" dataKey="body_fat_percent" name="% Gordura" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorGordura)" />
                                    <Area type="monotone" dataKey="muscle_mass_kg" name="Músculo (kg)" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorMusculo)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. HISTÓRICO EM CARDS */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider ml-2">Histórico Detalhado</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {history.slice().reverse().map((r) => (
                                <div key={r.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group relative">
                                    
                                    <button 
                                        onClick={() => handleDelete(r.id)} 
                                        className="absolute top-6 right-6 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 bg-gray-50 rounded-lg hover:bg-red-50"
                                    >
                                        <Trash2 size={18}/>
                                    </button>

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <Calendar className="text-gray-400 w-6 h-6"/>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                                                    {new Date(r.date).toLocaleDateString("pt-BR", { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                                <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">IMC: {r.bmi}</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            <MetricBox label="% Gordura" value={r.body_fat_percent} unit="%" color="text-red-500" icon={Flame} />
                                            <MetricBox label="Músculo" value={r.muscle_mass_kg} unit="kg" color="text-green-500" icon={Activity} />
                                            <MetricBox label="Visceral" value={r.visceral_fat_level} unit="" color="text-orange-500" icon={AlertTriangle} />
                                            <MetricBox label="Água" value={r.body_water_percent} unit="%" color="text-blue-500" icon={Droplets} />
                                            <MetricBox label="Cintura" value={r.cintura} unit="cm" color="text-purple-500" icon={Ruler} />
                                            <MetricBox label="Abdômen" value={r.abdomen} unit="cm" color="text-purple-500" icon={Ruler} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
}

// --- SUB-COMPONENTES PARA FORMULÁRIO ---
const InputModern = ({ label, register, name, icon: Icon, color }: any) => (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 focus-within:ring-2 focus-within:ring-rose-500 focus-within:bg-white transition-all">
        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
            <Icon size={12} className={color.replace('text-', 'text-opacity-50 ')}/> {label}
        </label>
        <input type="number" step="0.1" {...register(name)} className="w-full bg-transparent outline-none font-bold text-gray-800 text-lg placeholder-gray-300" placeholder="-" />
    </div>
);

const InputSimple = ({ label, register, name }: any) => (
    <div className="bg-white p-3 rounded-xl border border-gray-200">
        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{label}</label>
        <input type="number" step="0.1" {...register(name)} className="w-full bg-transparent outline-none font-bold text-gray-800" placeholder="cm" />
    </div>
);