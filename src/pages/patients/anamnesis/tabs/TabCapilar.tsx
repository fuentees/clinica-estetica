import { useFormContext, Controller } from "react-hook-form";
import { Target, Thermometer, UploadCloud, ImageIcon } from "lucide-react";
import * as Constants from "../../../../data/anamnesisOptions";
import * as Components from "../../../../components/anamnesis/AnamnesisFormComponents";

const VisualScaleSelector = ({ options, value, onChange }: any) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    {options.map((opt: string) => (
      <div key={opt} onClick={() => onChange(opt)} className={`cursor-pointer group rounded-2xl border p-4 flex flex-col items-center transition-all hover:scale-105 ${value === opt ? 'border-rose-500 bg-rose-50 shadow-md ring-2 ring-rose-100' : 'bg-white border-gray-100 hover:border-rose-200'}`}>
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-rose-50"><ImageIcon size={18} className="text-gray-400 group-hover:text-rose-400"/></div>
        <span className="text-xs font-bold text-gray-700">{opt}</span>
      </div>
    ))}
  </div>
);

export function TabCapilar() {
  const { register, control } = useFormContext();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Análise da Haste */}
        <Components.Section title="Análise da Haste e Couro Cabeludo">
            <div className="grid md:grid-cols-3 gap-6">
                <Components.SelectField label="Tipo de Cabelo" name="capilar_tipo" register={register} options={Constants.CAPILAR_TIPO} />
                <Components.SelectField label="Frequência Lavagem" name="capilar_frequencia_lavagem" register={register} options={Constants.CAPILAR_LAVAGEM} />
                <Components.SelectField label="Diâmetro do Fio" name="capilar_diametro" register={register} options={Constants.CAPILAR_DIAMETRO} />
            </div>
            <div className="grid md:grid-cols-3 gap-6 mt-4">
                <Components.SelectField label="Oleosidade Fio" name="capilar_oleosidade_fio" register={register} options={Constants.CAPILAR_OLEOSIDADE} />
                <Components.SelectField label="Oleosidade Couro" name="capilar_oleosidade_couro" register={register} options={Constants.CAPILAR_COURO} />
                <Components.SelectField label="Elasticidade" name="capilar_elasticidade" register={register} options={Constants.CAPILAR_ELASTICIDADE} />
            </div>
        </Components.Section>

        {/* Escalas de Alopecia */}
        <div className="grid md:grid-cols-1 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Target size={18} className="text-pink-500"/> Escala de Savin (Alopecia Feminina)</h3>
                <Controller name="capilar_escala_savin" control={control} render={({ field }) => <VisualScaleSelector options={Constants.ESCALA_SAVIN} value={field.value} onChange={field.onChange} />} />
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Target size={18} className="text-blue-500"/> Escala de Norwood (Alopecia Masculina)</h3>
                <Controller name="capilar_escala_norwood" control={control} render={({ field }) => <VisualScaleSelector options={Constants.ESCALA_NORWOOD} value={field.value} onChange={field.onChange} />} />
            </div>
        </div>

        {/* Hábitos e Tricoscopia */}
        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-400 to-purple-500"></div>
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Thermometer size={18} className="text-rose-500"/> Hábitos Nocivos</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Components.CheckboxItem name="capilar_usa_bone" label="Usa Boné/Chapéu" register={register} />
                    <Components.CheckboxItem name="capilar_usa_preso" label="Tração (Preso)" register={register} />
                    <Components.CheckboxItem name="capilar_usa_secador" label="Usa Secador" register={register} />
                    <Components.CheckboxItem name="capilar_usa_chapinha" label="Usa Chapinha" register={register} />
                </div>
            </div>
            
            <div className="group bg-gray-50 border-2 border-dashed border-gray-300 p-10 rounded-3xl text-center hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform"><UploadCloud className="h-8 w-8 text-rose-400" /></div>
                <p className="text-lg font-bold text-gray-800">Tricoscopia Digital</p>
                <p className="text-sm text-gray-500">Clique para anexar imagens do microscópio.</p>
            </div>
        </div>
    </div>
  );
}