import { useFormContext, useWatch, Controller } from "react-hook-form";
import { 
  Target, FileText, Clock, AlertTriangle, 
  MapPin, CheckCircle2, ChevronRight, AlertOctagon, Search
} from "lucide-react";
import * as Constants from "../../../../data/anamnesisOptions";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";

// --- CONFIGURAÇÃO INTELIGENTE (GATILHOS) ---
const MAPA_REGIOES: Record<string, { label: string, field: string, options: string[], color: string }> = {
  "Gordura Localizada": { 
    label: "Onde a gordura incomoda?", field: "locais_gordura", options: Constants.REGIOES_CORPORAIS, color: "bg-red-50 text-red-600 border-red-100" 
  },
  "Flacidez Corporal": { 
    label: "Regiões com flacidez", field: "locais_flacidez_corporal", options: Constants.REGIOES_CORPORAIS, color: "bg-blue-50 text-blue-600 border-blue-100" 
  },
  "Flacidez Facial": { 
    label: "Áreas de flacidez", field: "locais_flacidez_facial", options: ["Pálpebras", "Jowls (Buldogue)", "Pescoço", "Papada", "Maçãs do Rosto"], color: "bg-pink-50 text-pink-600 border-pink-100" 
  },
  "Celulite (FEG)": { 
    label: "Onde tem celulite?", field: "locais_celulite", options: ["Glúteos", "Posterior Coxa", "Culote", "Anterior Coxa", "Abdômen", "Braços"], color: "bg-orange-50 text-orange-600 border-orange-100" 
  },
  "Estrias": { 
    label: "Local das estrias", field: "locais_estrias", options: Constants.REGIOES_CORPORAIS, color: "bg-purple-50 text-purple-600 border-purple-100" 
  },
  "Melasma / Manchas": { 
    label: "Onde estão as manchas?", field: "locais_manchas", options: Constants.REGIOES_FACIAIS, color: "bg-amber-50 text-amber-600 border-amber-100" 
  },
  "Acne / Cicatrizes": { 
    label: "Regiões afetadas", field: "locais_acne", options: Constants.REGIOES_FACIAIS, color: "bg-green-50 text-green-600 border-green-100" 
  }
};

// Componente de Seleção Multipla (Pílulas)
const MultiRegionSelector = ({ control, name, options }: any) => (
    <Controller
        name={name}
        control={control}
        defaultValue={[]}
        render={({ field }) => {
            const values = Array.isArray(field.value) ? field.value : [];
            const toggle = (opt: string) => field.onChange(values.includes(opt) ? values.filter((v: string) => v !== opt) : [...values, opt]);
            return (
                <div className="flex flex-wrap gap-2 mt-2">
                    {options && options.map((opt: string) => (
                        <div key={opt} onClick={() => toggle(opt)} className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${values.includes(opt) ? 'bg-gray-800 text-white border-gray-800 shadow-md scale-105' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                            {values.includes(opt) && <CheckCircle2 size={12} className="text-green-400"/>} {opt}
                        </div>
                    ))}
                </div>
            );
        }}
    />
);

export function TabQueixa() {
  const { register, control } = useFormContext();
  const selectedQueixas = useWatch({ name: "queixa_principal" }) || [];
  const queixasArray = Array.isArray(selectedQueixas) ? selectedQueixas : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. SELEÇÃO DA QUEIXA E REGIÕES DINÂMICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <Components.Section 
                title="Motivo da Consulta" 
                icon={FileText} 
                description="Identificação dos principais incômodos"
            >
                <Components.CheckboxGroup name="queixa_principal" label="Selecione o que incomoda:" options={Constants.QUEIXAS} control={control} />
            </Components.Section>

            {/* ÁREA DINÂMICA: Aparece conforme as queixas marcadas */}
            {queixasArray.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-500">
                    <h4 className="text-xs font-black text-gray-400 uppercase ml-4 flex items-center gap-2 tracking-[0.2em]"><MapPin size={14}/> Detalhamento por Região</h4>
                    {queixasArray.map((queixa: string) => {
                        const config = MAPA_REGIOES[queixa];
                        if (!config) return null;
                        return (
                            <div key={queixa} className={`p-6 rounded-[2rem] border shadow-sm transition-all ${config.color} bg-opacity-40 border-opacity-60`}>
                                <h5 className="text-sm font-black flex items-center gap-2 mb-1 tracking-tight"><ChevronRight size={16}/> {queixa}</h5>
                                <p className="text-[10px] opacity-70 mb-3 ml-6 font-black uppercase tracking-widest">{config.label}</p>
                                <div className="ml-5"><MultiRegionSelector name={config.field} options={config.options} control={control} /></div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Components.TextareaField 
              label="Storytelling da Queixa" 
              name="queixa_principal_detalhada" 
              register={register} 
              placeholder="Descreva a história da disfunção, sensações, início..." 
            />
        </div>

        {/* 2. LATERAL: URGÊNCIA E CONTEXTO */}
        <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl sticky top-24 space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase">Urgência</h3>
                    <AlertOctagon className="text-rose-500 animate-pulse"/>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Nível de Prioridade</label>
                        <input type="range" min="1" max="5" {...register("nivel_urgencia")} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                        <div className="flex justify-between text-[10px] font-black uppercase mt-3 text-gray-500">
                          <span>Baixa</span>
                          <span>Imediata</span>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-6">
                        <Components.InputWithLabel 
                            label="Evento Gatilho" 
                            {...register("evento_especifico")} 
                            placeholder="Ex: Casamento, Verão..." 
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <Components.InputWithLabel 
                            label="Duração" 
                            {...register("tempo_queixa")} 
                            placeholder="Desde quando?"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <Components.InputWithLabel 
                            label="Piora com" 
                            {...register("fatores_agravantes")} 
                            placeholder="Calor, Stress..." 
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}