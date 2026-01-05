import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Sun, Layers, Eye, Droplets, ScanFace, Sparkles } from "lucide-react";
import * as Constants from "../../../../data/anamnesisOptions";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";
// Se não tiver o componente, comente a linha abaixo
import { BodyMappingComponent } from "../../../../components/anamnesis/BodyMappingComponent";

// --- SELETORES VISUAIS ---

const FitzpatrickSelector = ({ value, onChange }: any) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    {Constants.FITZPATRICK_OPCOES?.map((opt: any) => (
      <button
        key={opt.label}
        type="button"
        onClick={() => onChange(opt.label)}
        className={`rounded-2xl border p-3 flex flex-col items-center transition-all hover:scale-105 hover:shadow-md ${
          value === opt.label 
            ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-200 shadow-sm' 
            : 'border-gray-200 bg-white hover:border-amber-300'
        }`}
      >
        <div className="w-full h-8 rounded-lg mb-3 shadow-inner border border-black/5" style={{ backgroundColor: opt.color }}></div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${value === opt.label ? 'text-amber-700' : 'text-gray-600'}`}>
          {opt.label}
        </span>
      </button>
    )) || <p className="text-xs text-gray-400 p-4">Opções não carregadas</p>}
  </div>
);

const BaumannSelector = ({ value = [], onChange }: any) => {
  const current = Array.isArray(value) ? value : [];
  const toggle = (id: string) => {
    if (current.includes(id)) onChange(current.filter((x:string) => x !== id));
    else onChange([...current, id]);
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      {Constants.BAUMANN_TYPES?.map((type: any) => (
          <button
            key={type.id}
            type="button"
            onClick={() => toggle(type.id)}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col items-start ${
              current.includes(type.id) 
                ? 'bg-purple-600 border-purple-600 text-white shadow-md transform scale-[1.02]' 
                : 'bg-white border-gray-200 text-gray-500 hover:border-purple-300 hover:bg-purple-50/50'
            }`}
          >
            <span className="text-sm font-bold mb-1">{type.id}</span>
            <span className="text-[10px] opacity-90 font-medium leading-tight">{type.label}</span>
          </button>
      )) || <p className="text-xs text-gray-400 p-4">Opções não carregadas</p>}
    </div>
  );
};

const PeriocularSelector = ({ value, onChange }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {Constants.OLHEIRAS_TIPOS?.map((opt: any) => (
      <button
        key={opt.label}
        type="button"
        onClick={() => onChange(opt.label)}
        className={`rounded-2xl border p-4 flex items-center gap-4 transition-all text-left group ${
          value === opt.label 
            ? 'border-blue-500 bg-blue-50 shadow-sm' 
            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
        }`}
      >
        <div className={`p-3 rounded-xl transition-colors shrink-0 ${
          value === opt.label ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-200 group-hover:text-blue-600'
        }`}>
          <Eye size={20}/>
        </div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${value === opt.label ? 'text-blue-900' : 'text-gray-700'}`}>{opt.label}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-1 leading-tight">{opt.desc}</p>
        </div>
      </button>
    )) || <p className="text-xs text-gray-400 p-4">Opções não carregadas</p>}
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export function TabFacial() {
  const { register, control } = useFormContext();
  const temTelangiectasias = useWatch({ name: "tem_telangiectasias", control });

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- COLUNA ESQUERDA (PRINCIPAL - FORMULÁRIOS) --- */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* 1. Classificações de Biotipo e Fototipo */}
        <div className="grid md:grid-cols-2 gap-6">
          <Components.Section 
            title="Fototipo Fitzpatrick" 
            icon={Sun}
            description="Sensibilidade à radiação UV"
          >
            <Controller name="facial_fitzpatrick" control={control} render={({ field }) => <FitzpatrickSelector value={field.value} onChange={field.onChange} />} />
          </Components.Section>
          
          <Components.Section 
            title="Tipologia de Baumann" 
            icon={Layers}
            description="Classificação científica da pele"
          >
            <Controller name="facial_baumann" control={control} render={({ field }) => <BaumannSelector value={field.value} onChange={field.onChange} />} />
          </Components.Section>
        </div>

        {/* 2. Rotina Skincare */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
             <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-500"></div>
             
             <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-600">
                   <Sparkles size={20}/>
                </div>
                <div>
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hábitos & Home Care</h2>
                   <p className="text-xs text-gray-500 font-medium">Rotina diária do paciente</p>
                </div>
             </div>

             <Components.CheckboxGroup name="rotina_skincare" label="Protocolos de uso diário:" options={Constants.ROTINA_SKINCARE} control={control} />
             
             <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700">
                <Components.TextAreaField 
                   label="Produtos, Marcas e Ativos (Manhã/Noite)"
                   name="produtos_em_uso" 
                   register={register} 
                   placeholder="Ex: Ácido Hialurônico, Retinol 0.3%, Protetor Solar com Cor..." 
                />
             </div>
        </div>

        {/* 3. Análise da Pele (Acne/Manchas) */}
        <Components.Section title="Avaliação Tissular" icon={ScanFace} description="Análise morfológica da face">
            <div className="grid md:grid-cols-3 gap-6">
                <Components.SelectField label="Biotipo Cutâneo" name="biotipo_cutaneo" register={register} options={Constants.BIOTIPOS} />
                <Components.SelectField label="Textura Epidérmica" name="facial_textura" register={register} options={Constants.TEXTURAS_PELE} />
                <Components.SelectField label="Grau de Acne" name="facial_acne_grau" register={register} options={Constants.GRAUS_ACNE} />
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 grid md:grid-cols-2 gap-8">
                <Components.CheckboxGroup name="facial_lesoes" label="Lesões Ativas / Inflamatórias:" options={Constants.LESOES_ACNE} control={control} />
                <Components.CheckboxGroup name="facial_discromias" label="Manchas & Discromias:" options={Constants.DISCROMIAS} control={control} />
            </div>
        </Components.Section>

        {/* 4. Região Periocular (MOVIDO PARA CÁ PARA NÃO SER SOBREPOSTO) */}
        <Components.Section 
            title="Região Periocular" 
            icon={Eye} 
            description="Olheiras e bolsas palpebrais"
        >
            <Controller name="facial_olheiras_tipo" control={control} render={({ field }) => <PeriocularSelector value={field.value} onChange={field.onChange} />} />
        </Components.Section>

      </div>

      {/* --- COLUNA DIREITA (FIXA - APENAS VISUALIZAÇÃO/MAPA) --- */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Este bloco fica FIXO na tela enquanto a esquerda rola */}
        <div className="sticky top-24 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ScanFace size={20} className="text-pink-600"/> Mapa de Queixas
                    </h3>
                    <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-1 rounded-lg uppercase font-bold tracking-wider">Interativo</span>
                </div>
                
                <div className="flex justify-center bg-gray-50 dark:bg-gray-900 rounded-3xl p-4 mb-6 border border-dashed border-gray-200 dark:border-gray-800">
                    <Controller 
                      name="body_mapping_facial" 
                      control={control} 
                      render={({ field }) => (
                        <BodyMappingComponent value={field.value || []} onChange={field.onChange} viewMode="face" />
                      )} 
                    />
                </div>
                
                {/* Bloco Vascular (Fica logo abaixo do mapa) */}
                <div className={`p-5 rounded-2xl border transition-all duration-500 ${
                  String(temTelangiectasias) === "true" ? 'bg-red-50 border-red-100 shadow-sm' : 'bg-gray-50 border-gray-100'
                }`}>
                    <h3 className={`font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-wider ${
                      String(temTelangiectasias) === "true" ? 'text-red-700' : 'text-gray-500'
                    }`}>
                      <Droplets size={16} className={String(temTelangiectasias) === "true" ? 'text-red-500' : 'text-gray-400'}/> Vascularização
                    </h3>
                    <Components.YesNoRadio label="Presença de Telangiectasias?" name="tem_telangiectasias" register={register} watchValue={temTelangiectasias} />
                    
                    {String(temTelangiectasias) === "true" && (
                        <div className="mt-4 pt-4 border-t border-red-200/50 animate-in zoom-in-95 duration-300">
                            <Components.RegionGrid name="facial_telangiectasias_local" label="Locais afetados:" options={Constants.REGIOES_FACIAIS} control={control} />
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}