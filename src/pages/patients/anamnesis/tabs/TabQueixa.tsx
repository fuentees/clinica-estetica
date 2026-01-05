import { useFormContext, useWatch, Controller } from "react-hook-form";
import { 
  Target, FileText, MapPin, CheckCircle2, ChevronRight, AlertOctagon, Info
} from "lucide-react";
import * as Constants from "../../../../data/anamnesisOptions";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";

// --- CONFIGURAÇÃO DE GATILHOS (Trigger Mapping) ---
const MAPA_REGIOES: Record<string, { label: string, field: string, options: string[], color: string }> = {
  "Gordura Localizada": { 
    label: "Zonas de Acúmulo Adiposo", field: "locais_gordura", options: Constants.REGIOES_CORPORAIS, color: "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10" 
  },
  "Flacidez Corporal": { 
    label: "Regiões de Perda de Tônus", field: "locais_flacidez_corporal", options: Constants.REGIOES_CORPORAIS, color: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10" 
  },
  "Flacidez Facial": { 
    label: "Áreas com Ptose / Perda de Contorno", field: "locais_flacidez_facial", options: ["Terço Superior", "Pálpebras", "Jowls (Buldogue)", "Pescoço", "Papada"], color: "bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/10" 
  },
  "Celulite (FEG)": { 
    label: "Localização da Paniculopatia", field: "locais_celulite", options: ["Glúteos", "Posterior Coxa", "Culote", "Abdômen", "Braços"], color: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/10" 
  },
  "Melasma / Manchas": { 
    label: "Zonas de Hipercromia", field: "locais_manchas", options: Constants.REGIOES_FACIAIS, color: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10" 
  }
};

// Componente de Seleção por Pílulas (Multi-Select Pills)
const MultiRegionSelector = ({ control, name, options }: any) => (
    <Controller
        name={name}
        control={control}
        render={({ field }) => {
            const values = Array.isArray(field.value) ? field.value : [];
            const toggle = (opt: string) => field.onChange(values.includes(opt) ? values.filter((v: string) => v !== opt) : [...values, opt]);
            return (
                <div className="flex flex-wrap gap-2 mt-3">
                    {options && options.map((opt: string) => (
                        <button 
                            key={opt} 
                            type="button"
                            onClick={() => toggle(opt)} 
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all flex items-center gap-2 ${
                              values.includes(opt) 
                                ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-105' 
                                : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                            }`}
                        >
                            {values.includes(opt) && <CheckCircle2 size={12} className="text-pink-400"/>} 
                            {opt}
                        </button>
                    ))}
                </div>
            );
        }}
    />
);

export function TabQueixa() {
  const { register, control } = useFormContext();
  const selectedQueixas = useWatch({ name: "queixa_principal", control }) || [];
  const queixasArray = Array.isArray(selectedQueixas) ? selectedQueixas : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {/* 1. SELEÇÃO DA QUEIXA */}
            <Components.Section 
                title="Motivo da Consulta" 
                icon={FileText} 
                description="Selecione as disfunções estéticas que mais incomodam o paciente"
            >
                <Components.CheckboxGroup name="queixa_principal" label="Queixas Atuais:" options={Constants.QUEIXAS} control={control} />
            </Components.Section>

            {/* 2. ÁREA DINÂMICA (SUB-DETALHAMENTO) */}
            {queixasArray.length > 0 && (
                <div className="space-y-6 animate-in zoom-in-95 fade-in duration-500">
                    <div className="flex items-center gap-3 px-4 py-2 bg-pink-50 dark:bg-pink-900/10 rounded-2xl w-fit border border-pink-100 dark:border-pink-900/30">
                      <MapPin size={16} className="text-pink-600"/> 
                      <h4 className="text-[10px] font-black text-pink-700 dark:text-pink-400 uppercase tracking-[0.2em]">Detalhamento de Áreas</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {queixasArray.map((queixa: string) => {
                          const config = MAPA_REGIOES[queixa];
                          if (!config) return null;
                          return (
                              <div key={queixa} className={`p-8 rounded-[2rem] border-2 shadow-sm transition-all ${config.color} border-opacity-40`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-lg font-black flex items-center gap-2 tracking-tighter italic">
                                      <ChevronRight size={18} className="text-current opacity-50"/> {queixa}
                                    </h5>
                                    <Info size={16} className="opacity-40" />
                                  </div>
                                  <p className="text-[10px] opacity-70 mb-4 ml-6 font-bold uppercase tracking-widest">{config.label}</p>
                                  <div className="ml-6">
                                    <MultiRegionSelector name={config.field} options={config.options} control={control} />
                                  </div>
                              </div>
                          );
                      })}
                    </div>
                </div>
            )}

            {/* 3. STORYTELLING */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>
                  <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Histórico Detalhado (Storytelling)</label>
                </div>
                <textarea 
                  {...register("queixa_principal_detalhada")} 
                  className="w-full p-6 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-pink-100 dark:focus:border-pink-900 rounded-[2rem] outline-none h-40 resize-none text-gray-600 dark:text-gray-300 transition-all font-medium"
                  placeholder="Desde quando isso te incomoda? Já fez algum tratamento antes? Como isso afeta sua autoestima?"
                />
            </div>
        </div>

        {/* 4. LATERAL: SCORE DE PRIORIDADE E CONTEXTO */}
        <div className="lg:col-span-1">
            <div className="bg-gray-900 dark:bg-gray-950 rounded-[3rem] p-10 text-white shadow-2xl sticky top-24 space-y-10 overflow-hidden">
                {/* Efeito visual no card lateral */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                
                <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Score de</h3>
                      <p className="text-pink-500 font-black uppercase text-xs tracking-[0.3em] mt-1">Urgência</p>
                    </div>
                    <AlertOctagon className="text-pink-500 animate-pulse" size={32}/>
                </div>

                <div className="space-y-10 relative z-10">
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-6">Nível de Prioridade do Paciente</label>
                        <input 
                          type="range" 
                          min="1" 
                          max="5" 
                          {...register("nivel_urgencia")} 
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500" 
                        />
                        <div className="flex justify-between text-[9px] font-black uppercase mt-4 text-gray-500 tracking-tighter">
                          <span>Baixa Prioridade</span>
                          <span className="text-pink-500">Urgência Imediata</span>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-white/5 space-y-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Expectativa de Evento</label>
                          <input 
                              {...register("evento_especifico")} 
                              placeholder="Ex: Casamento em 3 meses" 
                              className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-pink-500 transition-all text-sm font-bold"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tempo da Disfunção</label>
                          <input 
                              {...register("tempo_queixa")} 
                              placeholder="Há quanto tempo percebe?"
                              className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-pink-500 transition-all text-sm font-bold"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fatores de Piora</label>
                          <input 
                              {...register("fatores_agravantes")} 
                              placeholder="Ex: Sol, Alimentação, Ciclo..." 
                              className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-pink-500 transition-all text-sm font-bold"
                          />
                        </div>
                    </div>
                </div>

                <div className="bg-pink-500/10 p-6 rounded-3xl border border-pink-500/20 text-center relative z-10">
                   <p className="text-[10px] text-pink-200 font-bold uppercase tracking-widest leading-relaxed">
                     Esta análise ajuda a definir a agressividade do protocolo inicial.
                   </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}