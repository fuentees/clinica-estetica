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
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  X, 
  Zap, 
  History as HistoryIcon 
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
        blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800",
        red: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800",
        green: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800",
        purple: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800",
        orange: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800",
    };
    
    return (
        <div className={`p-6 rounded-[2rem] border-2 ${styles[color]} flex flex-col shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all">
                <Icon size={64} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{label}</span>
            <span className="text-4xl font-black tracking-tighter z-10 italic">{value}</span>
            <span className="text-[10px] font-bold uppercase opacity-50 mt-2 z-10 flex items-center gap-1">
              <TrendingUp size={12}/> {sub}
            </span>
        </div>
    );
};

const MetricBox = ({ label, value, unit, color, icon: Icon }: any) => (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 hover:border-pink-100 transition-all group shadow-inner">
        <div className={`p-2 rounded-xl mb-2 bg-white dark:bg-gray-800 shadow-sm transition-colors`}>
            <Icon size={14} className={color}/>
        </div>
        <span className={`block font-black text-xl tracking-tighter ${color}`}>{value ?? '-'}<small className="text-[10px] text-gray-400 ml-0.5 font-bold uppercase">{unit}</small></span>
        <span className="text-[9px] uppercase text-gray-400 font-black tracking-widest text-center leading-tight mt-1">{label}</span>
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
    if (id) fetchHistory();
  }, [id]);

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from("bioimpedance_records")
        .select("*")
        .eq("patient_id", id) // Se der erro, troque por .eq("patient_id", id)
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

      // Payload mapeado para snake_case (padrão banco)
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
          cintura: cleanData.cintura,
          abdomen: cleanData.abdomen,
          quadril: cleanData.quadril,
          braco_dir: cleanData.braco_dir,
          coxa_dir: cleanData.coxa_dir
      };

      const { error } = await supabase.from("bioimpedance_records").insert(payload);
      if (error) throw error;
      
      toast.success("Métricas atualizadas!");
      reset({ data_avaliacao: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      fetchHistory();
    } catch (err) {
      toast.error("Erro ao processar salvamento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Excluir este registro permanentemente?")) return;
    await supabase.from("bioimpedance_records").delete().eq("id", itemId);
    setHistory(history.filter(h => h.id !== itemId));
    toast.success("Registro removido.");
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-900">
      <Loader2 className="animate-spin text-rose-600" size={40}/>
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Carregando Métricas...</p>
    </div>
  );

  const hasData = history.length > 0;
  const latest = hasData ? history[history.length - 1] : null;

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
              <div className="p-5 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] text-rose-600">
                <Scale size={40} />
              </div>
              <div>
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Antropometria</h1>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de evolução física e composição tecidual</p>
              </div>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className={`h-14 px-8 rounded-2xl shadow-xl transition-all font-black uppercase tracking-widest ${
              showForm ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            {showForm ? <><X size={18} className="mr-2"/> Fechar</> : <><Plus size={18} className="mr-2"/> Novo Exame</>}
          </Button>
      </div>

      {showForm ? (
         <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Data da Coleta</label>
                        <input type="date" {...register("data_avaliacao")} defaultValue={new Date().toISOString().split('T')[0]} className="w-full h-12 px-5 bg-gray-50 dark:bg-gray-900 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Peso Corporal (kg)</label>
                        <input type="number" step="0.1" {...register("peso")} className="w-full h-12 px-5 bg-gray-50 dark:bg-gray-900 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-black text-lg italic" placeholder="00.0" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Altura (m)</label>
                        <input type="text" {...register("altura")} onChange={handleHeightChange} className="w-full h-12 px-5 bg-gray-50 dark:bg-gray-900 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-black text-lg italic" placeholder="1.00" maxLength={4} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-rose-500 to-purple-600 p-6 rounded-[2.5rem] shadow-lg flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl"><Activity size={24}/></div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Índice de Massa Corporal</span>
                          <p className="text-xs font-bold leading-none mt-1">Calculado automaticamente</p>
                        </div>
                    </div>
                    <input readOnly {...register("imc")} className="w-32 text-right text-4xl font-black bg-transparent outline-none italic tracking-tighter" placeholder="--" />
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2 italic">
                      <BarChart3 size={16} className="text-rose-500"/> Composição Bioelétrica
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InputModern label="% Gordura" register={register} name="gordura_percentual" icon={Flame} color="text-rose-500" />
                        <InputModern label="Músculo (kg)" register={register} name="massa_muscular_kg" icon={Activity} color="text-emerald-500" />
                        <InputModern label="% Água" register={register} name="agua_corporal" icon={Droplets} color="text-blue-500" />
                        <InputModern label="Nível Visceral" register={register} name="gordura_visceral" icon={AlertTriangle} color="text-amber-500" />
                        <InputModern label="Idade Metab." register={register} name="idade_metabolica" icon={Calendar} color="text-gray-500" />
                        <InputModern label="TMB (Kcal)" register={register} name="metabolismo_basal" icon={Zap} color="text-purple-500" />
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2 italic">
                      <Ruler size={16} className="text-blue-500"/> Perimetria Clínica (cm)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <InputSimple label="Cintura" register={register} name="cintura" />
                        <InputSimple label="Abdômen" register={register} name="abdomen" />
                        <InputSimple label="Quadril" register={register} name="quadril" />
                        <InputSimple label="Braço Dir." register={register} name="braco_dir" />
                        <InputSimple label="Coxa Dir." register={register} name="coxa_dir" />
                    </div>
                </div>

                <Button type="submit" disabled={saving} className="w-full h-16 bg-gray-900 hover:bg-black text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all transform hover:-translate-y-1">
                    {saving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" size={20}/>} Finalizar e Salvar
                </Button>
             </form>
         </div>
      ) : (
        <>
            {!hasData ? (
                <div className="text-center py-32 bg-white dark:bg-gray-800 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700">
                    <div className="bg-gray-50 dark:bg-gray-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Scale size={48} className="text-gray-200"/>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase">Nenhuma Análise Registrada</h3>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-4">Inicie o acompanhamento corporal deste paciente.</p>
                </div>
            ) : (
                <div className="space-y-10 animate-in fade-in duration-1000">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard label="Peso Atual" value={`${latest.weight}kg`} sub="Estabilidade Corporal" color="blue" icon={Scale} />
                        <KpiCard label="Gordura" value={`${latest.body_fat_percent || '-'}%`} sub="Nível de Adiposidade" color="red" icon={Flame} />
                        <KpiCard label="Massa Magra" value={`${latest.muscle_mass_kg || '-'}kg`} sub="Tônus Muscular" color="green" icon={Activity} />
                        <KpiCard label="IMC" value={`${latest.bmi || '-'}`} sub="Enquadramento Saúde" color="purple" icon={Activity} />
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><BarChart3 size={120}/></div>
                        <h3 className="font-black text-xl text-gray-900 dark:text-white mb-10 flex items-center gap-3 italic tracking-tighter uppercase">
                             <TrendingUp className="text-rose-500" size={28}/> Curva de Evolução
                        </h3>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorGordura" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorMusculo" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })} stroke="#9ca3af" fontSize={10} tickMargin={15} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', padding: '20px' }} labelFormatter={(l) => new Date(l).toLocaleDateString("pt-BR", { dateStyle: 'full' })} />
                                    <Legend verticalAlign="top" height={50} align="right" iconType="circle" iconSize={8}/>
                                    <Area type="monotone" dataKey="body_fat_percent" name="% Gordura" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorGordura)" />
                                    <Area type="monotone" dataKey="muscle_mass_kg" name="Músculo (kg)" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorMusculo)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3 ml-4">
                          <HistoryIcon size={18} className="text-gray-400"/>
                          <h3 className="font-black text-gray-400 text-xs uppercase tracking-[0.3em]">Linha do Tempo</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {history.slice().reverse().map((r) => (
                                <div key={r.id} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-pink-100 transition-all duration-500 group relative">
                                    
                                    <button onClick={() => handleDelete(r.id)} className="absolute top-8 right-8 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                                        <Trash2 size={20}/>
                                    </button>

                                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                                            <div className="flex items-center gap-6 min-w-[280px]">
                                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center text-gray-400 group-hover:text-pink-500 transition-colors">
                                                    <Calendar size={28}/>
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black text-gray-900 dark:text-white capitalize italic tracking-tighter">
                                                        {new Date(r.date).toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                    <div className="flex gap-2 mt-1">
                                                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-widest italic">IMC: {r.bmi}</span>
                                                      <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md uppercase tracking-widest italic">{r.weight}kg</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                <MetricBox label="% Gordura" value={r.body_fat_percent} unit="%" color="text-rose-500" icon={Flame} />
                                                <MetricBox label="Músculo" value={r.muscle_mass_kg} unit="kg" color="text-emerald-500" icon={Activity} />
                                                <MetricBox label="Visceral" value={r.visceral_fat_level} unit="lvl" color="text-amber-500" icon={AlertTriangle} />
                                                <MetricBox label="H2O Corp." value={r.body_water_percent} unit="%" color="text-blue-500" icon={Droplets} />
                                                <MetricBox label="Cintura" value={r.cintura} unit="cm" color="text-purple-500" icon={Ruler} />
                                                <MetricBox label="Abdômen" value={r.abdomen} unit="cm" color="text-purple-500" icon={Ruler} />
                                            </div>
                                            
                                            <div className="xl:block hidden text-gray-100 dark:text-gray-800">
                                               <ChevronRight size={40}/>
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

const InputModern = ({ label, register, name, icon: Icon, color }: any) => (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border-2 border-transparent focus-within:border-rose-100 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all shadow-inner">
        <label className="text-[9px] font-black text-gray-400 uppercase mb-2 flex items-center gap-2 tracking-widest">
            <Icon size={14} className={color}/> {label}
        </label>
        <input type="number" step="0.1" {...register(name)} className="w-full bg-transparent outline-none font-black text-gray-900 dark:text-white text-2xl italic tracking-tighter placeholder-gray-200" placeholder="0.0" />
    </div>
);

const InputSimple = ({ label, register, name }: any) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-100 transition-all">
        <label className="text-[9px] font-black text-gray-400 uppercase block mb-2 tracking-widest">{label}</label>
        <div className="flex items-baseline gap-1">
          <input type="number" step="0.1" {...register(name)} className="w-full bg-transparent outline-none font-black text-gray-900 dark:text-white text-xl italic" placeholder="00" />
          <span className="text-[10px] font-bold text-gray-300 uppercase">cm</span>
        </div>
    </div>
);