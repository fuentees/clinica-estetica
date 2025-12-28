import { useFormContext } from "react-hook-form";
import { Scale, Activity, Flame, Droplets, Bone } from "lucide-react";

const InputBio = ({ label, name, icon: Icon, color, register }: any) => (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:border-gray-200">
        <div className={`p-2 rounded-full mb-2 ${color.bg}`}>
            <Icon size={18} className={color.text} />
        </div>
        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</label>
        <div className="relative w-full">
            <input 
                type="number" 
                step="0.1" 
                {...register(name)} 
                className="w-full text-center bg-transparent text-xl font-black text-gray-800 dark:text-white outline-none placeholder-gray-200" 
                placeholder="-" 
            />
        </div>
    </div>
);

export function TabBioimpedancia() {
  const { register } = useFormContext();

  return (
    <div className="space-y-8 animate-in fade-in">
        
        {/* Banner Informativo */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-8 text-white shadow-lg shadow-blue-200/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h3 className="text-2xl font-bold flex items-center gap-3"><Scale className="w-8 h-8 text-white/80"/> Bioimpedância Rápida</h3>
                    <p className="text-blue-50 opacity-90 mt-1 max-w-lg">Insira os dados da balança para registrar no prontuário atual. Para histórico completo e gráficos, use o módulo "Bioimpedância" no menu.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[150px]">
                    <span className="text-xs font-bold uppercase opacity-70 block mb-1">IMC Calculado</span>
                    <span className="text-3xl font-black">--.--</span>
                </div>
            </div>
        </div>

        {/* Grid de Inputs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <InputBio 
                label="% Gordura" 
                name="corporal_adipometria_dados.bio_fat" 
                icon={Flame} 
                color={{ bg: 'bg-red-50', text: 'text-red-500' }} 
                register={register} 
            />
            <InputBio 
                label="Músculo (kg)" 
                name="corporal_adipometria_dados.bio_muscle" 
                icon={Activity} 
                color={{ bg: 'bg-green-50', text: 'text-green-500' }} 
                register={register} 
            />
            <InputBio 
                label="Gordura Visceral" 
                name="corporal_adipometria_dados.bio_visceral" 
                icon={Activity} 
                color={{ bg: 'bg-orange-50', text: 'text-orange-500' }} 
                register={register} 
            />
            <InputBio 
                label="% Água" 
                name="corporal_adipometria_dados.bio_water" 
                icon={Droplets} 
                color={{ bg: 'bg-blue-50', text: 'text-blue-500' }} 
                register={register} 
            />
            <InputBio 
                label="Massa Óssea" 
                name="corporal_adipometria_dados.bio_bone" 
                icon={Bone} 
                color={{ bg: 'bg-gray-100', text: 'text-gray-500' }} 
                register={register} 
            />
        </div>

        {/* Área de Notas */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <label className="text-sm font-bold text-gray-700 uppercase mb-3 block">Análise Profissional & Metas</label>
            <textarea 
                {...register("corporal_adipometria_dados.bio_notes")} 
                className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none text-gray-600"
                placeholder="Ex: Paciente evoluiu bem na massa magra, foco agora é redução visceral..."
            />
        </div>

    </div>
  );
}