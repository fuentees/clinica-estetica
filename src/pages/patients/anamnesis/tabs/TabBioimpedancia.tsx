import { useFormContext, useWatch } from "react-hook-form";
import { Scale, Activity, Flame, Droplets, Bone, Calculator, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";

// Componente Local de Input (Estilizado para Métricas Grandes)
const InputBio = ({ label, name, icon: Icon, color, register, unit }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:border-gray-200 group relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-[3rem] opacity-5 transition-transform group-hover:scale-110 ${color.bg.replace('/20', '')}`}></div>

        <div className={`p-3 rounded-2xl mb-3 transition-transform group-hover:scale-110 ${color.bg}`}>
            <Icon size={20} className={color.text} />
        </div>
        <label className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">{label}</label>
        <div className="relative w-full flex items-baseline justify-center gap-1">
            <input 
                type="number" 
                step="0.1" 
                {...register(name)} 
                className="w-full text-center bg-transparent text-3xl font-bold text-gray-900 dark:text-white outline-none placeholder-gray-200 transition-colors focus:text-pink-600" 
                placeholder="0.0" 
            />
            {unit && <span className="text-xs font-bold text-gray-300 absolute right-2 bottom-2">{unit}</span>}
        </div>
    </div>
);

export function TabBioimpedancia() {
  const { register, control } = useFormContext();
  const [imc, setImc] = useState<string>("--.--");

  // OBS: Lendo da raiz ("peso", "altura") para compartilhar dados com a TabCorporal
  const peso = useWatch({ control, name: "peso" });
  const altura = useWatch({ control, name: "altura" });

  useEffect(() => {
    if (peso && altura) {
        // Normaliza altura (se digitou 170cm vira 1.70m)
        const p = parseFloat(String(peso).replace(',', '.'));
        const a = parseFloat(String(altura).replace(',', '.'));
        const altMetros = a > 3 ? a / 100 : a; 
        
        if (p > 0 && altMetros > 0) {
            const valorImc = p / (altMetros * altMetros);
            setImc(valorImc.toFixed(2));
        }
    } else {
        setImc("--.--");
    }
  }, [peso, altura]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Banner Informativo com Cálculo de IMC */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-xl shadow-blue-200/40 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-10 rotate-12">
                <Calculator size={140} />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                <div className="text-center md:text-left space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Scale className="w-6 h-6 text-white"/>
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-tight">Bioimpedância</h3>
                    </div>
                    <p className="text-blue-50 opacity-90 max-w-lg text-sm font-medium">
                        Registre os parâmetros da balança para este prontuário. Os dados alimentam o gráfico de evolução.
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/20 text-center min-w-[160px] shadow-lg">
                    <span className="text-[10px] font-bold uppercase opacity-80 block mb-1 tracking-widest text-cyan-100">IMC Automático</span>
                    <span className="text-4xl font-bold tracking-tighter">
                        {imc}
                    </span>
                    <p className="text-[9px] mt-1 font-bold opacity-70 uppercase">kg/m² (Calculado)</p>
                </div>
            </div>
        </div>

        {/* Grid de Inputs Bio (Estilo Dashboard Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <InputBio 
                label="% Gordura" 
                name="corporal_adipometria_dados.bio_fat" 
                icon={Flame} 
                unit="%"
                color={{ bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-500' }} 
                register={register} 
            />
            <InputBio 
                label="Massa Muscular" 
                name="corporal_adipometria_dados.bio_muscle" 
                icon={Activity} 
                unit="kg"
                color={{ bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-500' }} 
                register={register} 
            />
            <InputBio 
                label="Gord. Visceral" 
                name="corporal_adipometria_dados.bio_visceral" 
                icon={Activity} 
                unit="lvl"
                color={{ bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-500' }} 
                register={register} 
            />
            <InputBio 
                label="% Água" 
                name="corporal_adipometria_dados.bio_water" 
                icon={Droplets} 
                unit="%"
                color={{ bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-500' }} 
                register={register} 
            />
            <InputBio 
                label="Massa Óssea" 
                name="corporal_adipometria_dados.bio_bone" 
                icon={Bone} 
                unit="kg"
                color={{ bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500' }} 
                register={register} 
            />
        </div>

        {/* Área de Notas e Análise */}
        <Components.Section title="Análise Profissional & Estratégia" icon={TrendingUp} description="Planejamento baseado nos dados">
            <Components.TextAreaField 
                label="Notas Clínicas"
                name="corporal_adipometria_dados.bio_notes" 
                register={register} 
                placeholder="Descreva aqui as observações sobre a composição corporal, retenção hídrica ou metas específicas..."
            />
        </Components.Section>

    </div>
  );
}