import { useFormContext, Controller } from "react-hook-form";
import { Target, Thermometer, UploadCloud, ImageIcon, Scissors, Microscope } from "lucide-react";
// ADICIONADO O IMPORT DO BUTTON ABAIXO
import { Button } from "../../../../components/ui/button";
import * as Constants from "../../../../data/anamnesisOptions";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";

// Seletor Visual Aprimorado
const VisualScaleSelector = ({ options, value, onChange }: any) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    {options.map((opt: string) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`group rounded-2xl border-2 p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ${
          value === opt 
            ? 'border-pink-500 bg-pink-50 shadow-md ring-4 ring-pink-100' 
            : 'bg-white border-gray-100 hover:border-pink-200'
        }`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
          value === opt ? 'bg-pink-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-pink-50 group-hover:text-pink-400'
        }`}>
          <ImageIcon size={22} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-tight text-center ${
          value === opt ? 'text-pink-700' : 'text-gray-500'
        }`}>
          {opt}
        </span>
      </button>
    ))}
  </div>
);

export function TabCapilar() {
  const { register, control } = useFormContext();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Banner de Seção */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-[2rem] p-8 text-white shadow-xl shadow-rose-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                <Scissors size={120} />
            </div>
            <div className="relative z-10">
                <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                    <Scissors className="w-8 h-8"/> Avaliação Capilar
                </h3>
                <p className="text-rose-50 opacity-90 mt-2 max-w-xl font-medium">
                    Analise a saúde do couro cabeludo e a integridade da haste. Use as escalas visuais para classificar o grau de alopecia.
                </p>
            </div>
        </div>

        {/* Análise Técnica */}
        <Components.Section title="Análise da Haste e Couro">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Components.SelectField label="Tipo de Cabelo" name="capilar_tipo" register={register} options={Constants.CAPILAR_TIPO} />
                <Components.SelectField label="Frequência Lavagem" name="capilar_frequencia_lavagem" register={register} options={Constants.CAPILAR_LAVAGEM} />
                <Components.SelectField label="Diâmetro do Fio" name="capilar_diametro" register={register} options={Constants.CAPILAR_DIAMETRO} />
                <Components.SelectField label="Oleosidade Fio" name="capilar_oleosidade_fio" register={register} options={Constants.CAPILAR_OLEOSIDADE} />
                <Components.SelectField label="Oleosidade Couro" name="capilar_oleosidade_couro" register={register} options={Constants.CAPILAR_COURO} />
                <Components.SelectField label="Elasticidade" name="capilar_elasticidade" register={register} options={Constants.CAPILAR_ELASTICIDADE} />
            </div>
        </Components.Section>

        {/* Escalas de Alopecia */}
        <div className="grid grid-cols-1 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-3 uppercase text-sm tracking-widest">
                        <Target size={20} className="text-pink-500"/> Escala de Savin (Feminina)
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase">Padrão Ludwig</span>
                </div>
                <Controller 
                    name="capilar_escala_savin" 
                    control={control} 
                    render={({ field }) => (
                        <VisualScaleSelector options={Constants.ESCALA_SAVIN} value={field.value} onChange={field.onChange} />
                    )} 
                />
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-3 uppercase text-sm tracking-widest">
                        <Target size={20} className="text-blue-500"/> Escala de Norwood (Masculina)
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase">Androgenética</span>
                </div>
                <Controller 
                    name="capilar_escala_norwood" 
                    control={control} 
                    render={({ field }) => (
                        <VisualScaleSelector options={Constants.ESCALA_NORWOOD} value={field.value} onChange={field.onChange} />
                    )} 
                />
            </div>
        </div>

        {/* Hábitos e Tricoscopia */}
        <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rose-400 to-pink-600"></div>
                <h3 className="font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3 uppercase text-sm tracking-widest">
                    <Target size={20} className="text-rose-500"/> Fatores de Agressão
                </h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <Components.CheckboxItem name="capilar_usa_bone" label="Uso constante de Boné" register={register} />
                    <Components.CheckboxItem name="capilar_usa_preso" label="Tração (Cabelo Preso)" register={register} />
                    <Components.CheckboxItem name="capilar_usa_secador" label="Calor (Secador)" register={register} />
                    <Components.CheckboxItem name="capilar_usa_chapinha" label="Calor (Chapinha)" register={register} />
                </div>
            </div>
            
            <div className="md:col-span-2 group bg-gray-50 dark:bg-gray-900 border-4 border-dashed border-gray-200 dark:border-gray-700 p-8 rounded-[2rem] text-center hover:bg-pink-50 dark:hover:bg-pink-900/10 hover:border-pink-300 transition-all cursor-pointer flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform text-pink-500">
                    <Microscope size={32} />
                </div>
                <p className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tighter">Tricoscopia Digital</p>
                <p className="text-xs text-gray-500 mt-2 font-medium">Clique para anexar o laudo ou imagens do microscópio.</p>
                <div className="mt-6">
                    <Button variant="outline" className="rounded-xl border-pink-200 text-pink-600 hover:bg-pink-600 hover:text-white">
                        <UploadCloud size={16} className="mr-2" /> Anexar Fotos
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}