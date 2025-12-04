import { useEffect, useState } from "react";
import { useForm, useController } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { Loader2, ArrowLeft, Save, HeartPulse, Sparkles, FileCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import React from "react";

// Opções
const DOENCAS = ['Hipertensão', 'Diabetes', 'Cardiopatias', 'Autoimunes', 'Epilepsia'];
const ALERGIAS = ['Antibióticos', 'Anestésicos', 'Látex', 'Cosméticos', 'AAS'];
const QUEIXAS = ['Gordura Localizada', 'Flacidez', 'Celulite', 'Melasma', 'Acne', 'Rugas'];
const FOTOTIPOS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export function PatientAnamnesisPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"saude" | "estetica" | "final">("saude");
    const [patientName, setPatientName] = useState("");

    // REMOVIDO: 'watch' que não estava sendo usado
    const { register, handleSubmit, setValue, control } = useForm();

    useEffect(() => {
        if (id) fetchAnamnesis();
    }, [id]);

    async function fetchAnamnesis() {
        try {
            const { data, error } = await supabase.from('patients')
                .select(`*, profiles:profile_id(first_name, last_name)`)
                .eq('id', id).single();
            
            if (error) throw error;
            
            setPatientName(`${data.profiles?.first_name} ${data.profiles?.last_name}`);

            // Preencher campos
            setValue('doencas_cronicas', strToArray(data.doencas_cronicas));
            setValue('alergias_medicamentosas', strToArray(data.alergias_medicamentosas));
            setValue('queixa_principal', strToArray(data.queixa_principal));
            
            // Campos booleanos e texto
            ['gestante', 'lactante', 'uso_anticoncepcional', 'historico_queloide', 'tabagismo', 'uso_isotretinoina'].forEach(key => {
                setValue(key, data[key] || false);
            });
            ['cirurgias_previas', 'observacoes_saude', 'objetivo_paciente', 'consumo_alcool', 'exposicao_solar', 'fototipo', 'biotipo_cutaneo', 'apto_status'].forEach(key => {
                setValue(key, data[key] || '');
            });

        } catch (err) {
            toast.error("Erro ao carregar anamnese.");
        } finally {
            setLoading(false);
        }
    }

    const strToArray = (s: string) => s ? s.split('; ') : [];
    const arrayToStr = (a: any) => Array.isArray(a) ? a.join('; ') : a;

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                doencas_cronicas: arrayToStr(data.doencas_cronicas),
                alergias_medicamentosas: arrayToStr(data.alergias_medicamentosas),
                queixa_principal: arrayToStr(data.queixa_principal),
            };
            
            const { error } = await supabase.from('patients').update(payload).eq('id', id);
            if (error) throw error;
            
            toast.success("Anamnese salva com sucesso!");
            navigate(`/patients/${id}/history`);
        } catch (err) {
            toast.error("Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/patients/${id}/history`)}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ficha de Anamnese</h1>
                        <p className="text-sm text-gray-500">{patientName}</p>
                    </div>
                </div>
                <Button onClick={handleSubmit(onSubmit)} disabled={saving} className="bg-green-600 text-white">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} Salvar
                </Button>
            </div>

            {/* ABAS */}
            <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
                <TabButton active={activeTab === 'saude'} onClick={() => setActiveTab('saude')} icon={<HeartPulse size={18}/>} label="Saúde Geral" />
                <TabButton active={activeTab === 'estetica'} onClick={() => setActiveTab('estetica')} icon={<Sparkles size={18}/>} label="Estética" />
                <TabButton active={activeTab === 'final'} onClick={() => setActiveTab('final')} icon={<FileCheck size={18}/>} label="Conclusão" />
            </div>

            <form className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                
                {/* ABA SAÚDE */}
                <div className={activeTab === 'saude' ? 'block' : 'hidden'}>
                    <div className="grid md:grid-cols-2 gap-8">
                        <CheckboxGroup name="doencas_cronicas" label="Doenças Crônicas" options={DOENCAS} control={control} />
                        <CheckboxGroup name="alergias_medicamentosas" label="Alergias" options={ALERGIAS} control={control} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t dark:border-gray-700">
                        <Check name="gestante" label="Gestante?" register={register} />
                        <Check name="lactante" label="Lactante?" register={register} />
                        <Check name="uso_anticoncepcional" label="Anticoncepcional?" register={register} />
                        <Check name="historico_queloide" label="Histórico Queloide?" register={register} />
                    </div>
                    <div className="mt-6">
                        <label className="block text-sm font-medium mb-1">Cirurgias / Observações</label>
                        <textarea {...register("observacoes_saude")} className="w-full p-2 border rounded-md h-24 dark:bg-gray-900 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>

                {/* ABA ESTÉTICA */}
                <div className={activeTab === 'estetica' ? 'block' : 'hidden'}>
                    <div className="grid md:grid-cols-2 gap-8">
                        <CheckboxGroup name="queixa_principal" label="Queixas Principais" options={QUEIXAS} control={control} />
                        <div>
                            <label className="block text-sm font-medium mb-1">Objetivo do Paciente</label>
                            <textarea {...register("objetivo_paciente")} className="w-full p-2 border rounded-md h-32 dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="O que mais incomoda?" />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 mt-6 pt-6 border-t dark:border-gray-700">
                         <div>
                            <label className="block text-sm font-medium mb-1">Fototipo</label>
                            <select {...register("fototipo")} className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white">
                                <option value="">Selecione</option>
                                {FOTOTIPOS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                         </div>
                         <InputWithLabel label="Exposição Solar" {...register("exposicao_solar")} />
                         <div className="flex flex-col gap-2 mt-6">
                             <Check name="tabagismo" label="Fumante" register={register} />
                             <Check name="uso_isotretinoina" label="Uso de Roacutan" register={register} />
                         </div>
                    </div>
                </div>

                {/* ABA FINAL */}
                <div className={activeTab === 'final' ? 'block' : 'hidden'}>
                    <div className="max-w-md mx-auto text-center">
                        <label className="block text-lg font-bold mb-4">Parecer Técnico (Aptidão)</label>
                        <select {...register("apto_status")} className="w-full p-4 text-lg border-2 border-blue-200 rounded-xl text-center font-bold dark:bg-gray-900 dark:border-blue-900 dark:text-white">
                            <option value="Apto">✅ APTO para procedimentos</option>
                            <option value="Apto com ressalvas">⚠️ APTO COM RESSALVAS</option>
                            <option value="Não apto">🚫 NÃO APTO (Contraindicação)</option>
                        </select>
                    </div>
                </div>

            </form>
        </div>
    );
}

// --- Componentes Auxiliares ---
const TabButton = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} type="button" className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${active ? 'bg-white dark:bg-gray-700 shadow text-pink-600 font-bold' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{icon} {label}</button>
);

const CheckboxGroup = ({ name, label, options, control }: any) => {
    const { field } = useController({ name, control });
    return (
        <div>
            <h4 className="font-semibold mb-2 dark:text-white">{label}</h4>
            <div className="grid grid-cols-2 gap-2">
                {options.map((opt: string) => (
                    <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer dark:text-gray-300">
                        <input type="checkbox" value={opt} checked={field.value?.includes(opt)} 
                            onChange={e => {
                                const val = e.target.value;
                                const curr = field.value || [];
                                field.onChange(e.target.checked ? [...curr, val] : curr.filter((v: any) => v !== val));
                            }} 
                            className="rounded text-pink-600 focus:ring-pink-500" />
                        {opt}
                    </label>
                ))}
            </div>
        </div>
    );
};

const Check = ({ name, label, register }: any) => (
    <label className="flex items-center gap-2 cursor-pointer dark:text-gray-300">
        <input type="checkbox" {...register(name)} className="rounded text-pink-600 focus:ring-pink-500 w-5 h-5" />
        <span className="font-medium">{label}</span>
    </label>
);

const InputWithLabel = React.forwardRef(({ label, ...props }: any, ref) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <Input {...props} ref={ref} />
    </div>
));