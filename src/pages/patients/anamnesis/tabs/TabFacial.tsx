import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Sun, Layers, Eye, Droplets, ScanFace, Sparkles } from "lucide-react"; // Removido 'Target'
import * as Constants from "../../../../data/anamnesisOptions";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";
import { BodyMappingComponent } from "../../../../components/anamnesis/BodyMappingComponent";

// --- SELETORES VISUAIS ---
const FitzpatrickSelector = ({ value, onChange }: any) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
    {Constants.FITZPATRICK_OPCOES.map((opt: any) => (
      <div key={opt.label} onClick={() => onChange(opt.label)} className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center transition-all hover:scale-105 ${value === opt.label ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-100' : 'border-gray-100 hover:border-amber-200'}`}>
        <div className="w-full h-8 rounded-lg mb-2 shadow-inner" style={{ backgroundColor: opt.color }}></div>
        <span className="font-bold text-gray-800 text-xs">{opt.label}</span>
      </div>
    ))}
  </div>
);

const BaumannSelector = ({ value = [], onChange }: any) => {
  const toggle = (id: string) => {
    const current = Array.isArray(value) ? value : [];
    if (current.includes(id)) onChange(current.filter((x:string) => x !== id));
    else onChange([...current, id]);
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {Constants.BAUMANN_TYPES.map((type: any) => (
          <div key={type.id} onClick={() => toggle(type.id)} className={`cursor-pointer p-2 rounded-lg border text-[10px] font-black uppercase transition-all ${Array.isArray(value) && value.includes(type.id) ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}>
            <span className="block font-black text-xs mb-0.5">{type.id}</span>
            <span className="opacity-80">{type.label}</span>
          </div>
      ))}
    </div>
  );
};

const PeriocularSelector = ({ value, onChange }: any) => (
  <div className="grid grid-cols-1 gap-2">
    {Constants.OLHEIRAS_TIPOS.map((opt: any) => (
      <div key={opt.label} onClick={() => onChange(opt.label)} className={`cursor-pointer rounded-2xl border-2 p-4 flex items-center gap-4 transition-all ${value === opt.label ? 'border-blue-500 bg-blue-50' : 'border-gray-50 bg-white hover:border-blue-100'}`}>
        <div className="bg-gray-100 p-2 rounded-xl"><Eye size={16} className="text-gray-500"/></div>
        <div>
          <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{opt.label}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase">{opt.desc}</p>
        </div>
      </div>
    ))}
  </div>
);

export function TabFacial() {
  const { register, control } = useFormContext();
  const temTelangiectasias = useWatch({ name: "tem_telangiectasias", control });

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-8">
        
        {/* Classificação */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Sun size={18} className="text-amber-500"/> Fitzpatrick
            </h3>
            <Controller name="facial_fitzpatrick" control={control} render={({ field }) => <FitzpatrickSelector value={field.value} onChange={field.onChange} />} />
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Layers size={18} className="text-purple-500"/> Baumann
            </h3>
            <Controller name="facial_baumann" control={control} render={({ field }) => <BaumannSelector value={field.value} onChange={field.onChange} />} />
          </div>
        </div>

        {/* HOME CARE */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-cyan-500"></div>
             <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3 italic uppercase tracking-tighter">
                <Sparkles size={24} className="text-cyan-500"/> Rotina Home Care
             </h3>
             <Components.CheckboxGroup name="rotina_skincare" label="O que o paciente usa?" options={Constants.ROTINA_SKINCARE} control={control} />
             
             <div className="mt-8 pt-8 border-t border-gray-50">
                <Components.TextareaField 
                    label="Produtos em uso (Marcas/Ativos)"
                    name="produtos_em_uso" 
                    register={register} 
                    placeholder="Ex: Protetor La Roche, Vitamina C pela manhã..." 
                />
             </div>
        </div>

        {/* Análise Detalhada */}
        <Components.Section title="Análise da Pele" icon={ScanFace} description="Características Tissulares">
            <div className="grid md:grid-cols-3 gap-6">
                <Components.SelectField label="Biotipo" name="biotipo_cutaneo" register={register} options={Constants.BIOTIPOS} />
                <Components.SelectField label="Textura" name="facial_textura" register={register} options={Constants.TEXTURAS_PELE} />
                <Components.SelectField label="Acne (Grau)" name="facial_acne_grau" register={register} options={Constants.GRAUS_ACNE} />
            </div>
            
            <div className="mt-10 pt-10 border-t border-gray-100 grid md:grid-cols-2 gap-10">
                <Components.CheckboxGroup name="facial_lesoes" label="Lesões Elementares:" options={Constants.LESOES_ACNE} control={control} />
                <Components.CheckboxGroup name="facial_discromias" label="Manchas / Discromias:" options={Constants.DISCROMIAS} control={control} />
            </div>
        </Components.Section>
      </div>

      {/* Coluna Direita */}
      <div className="lg:col-span-1 space-y-6">
        <div className="sticky top-24 bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                <h3 className="font-black text-gray-900 uppercase italic tracking-tighter flex items-center gap-2">
                  <ScanFace size={20} className="text-rose-500"/> Mapa Facial
                </h3>
                <span className="text-[10px] bg-rose-50 text-rose-600 px-3 py-1 rounded-full uppercase font-black">Interativo</span>
            </div>
            
            <div className="flex justify-center bg-gray-50 rounded-[2rem] p-6 mb-8 border-2 border-dashed border-gray-100">
                <Controller name="body_mapping" control={control} render={({ field }) => <BodyMappingComponent value={field.value || []} onChange={field.onChange} viewMode="face" />} />
            </div>
            
            <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
                <h3 className="font-black text-red-800 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                  <Droplets size={18} className="animate-pulse"/> Vascularização
                </h3>
                <Components.YesNoRadio label="Possui Telangiectasias?" name="tem_telangiectasias" register={register} watchValue={temTelangiectasias} />
                
                {String(temTelangiectasias) === "true" && (
                    <div className="mt-6 pt-6 border-t border-red-200 animate-in slide-in-from-top-4 duration-300">
                        <Components.RegionGrid name="facial_telangiectasias_local" label="Regiões Acometidas" options={Constants.REGIOES_FACIAIS} control={control} />
                    </div>
                )}
            </div>
        </div>

        {/* Olheiras */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
            <h3 className="font-black text-gray-900 uppercase italic tracking-tighter mb-6 flex items-center gap-2">
              <Eye size={20} className="text-blue-500"/> Olheiras
            </h3>
            <Controller name="facial_olheiras_tipo" control={control} render={({ field }) => <PeriocularSelector value={field.value} onChange={field.onChange} />} />
        </div>
      </div>
    </div>
  );
}