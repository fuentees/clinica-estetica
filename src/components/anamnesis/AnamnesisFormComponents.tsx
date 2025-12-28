import React from "react";
import { useController } from "react-hook-form";
import { 
  CheckCircle2, 
  Calendar, 
  ChevronDown, 
  Info, 
  AlertCircle,
  PlusCircle
} from "lucide-react";

// 🛡️ PROTEÇÃO TOTAL: Garante que o componente nunca tente ler .join ou .includes em strings
const ensureArray = (v: any): string[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim() !== "") return v.split("; ").map(s => s.trim());
  return [];
};

// 1. CONTAINER DE SEÇÃO (Visual Premium)
export const Section = ({ title, children, icon: Icon, description }: any) => (
  <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-10 transition-all hover:shadow-lg group">
    <div className="flex items-center gap-5 mb-8 border-l-[10px] border-rose-500 pl-6">
      {Icon && <Icon className="text-rose-500 group-hover:scale-110 transition-transform" size={32} />}
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{title}</h2>
        {description && <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

// 2. WRAPPER DE CAMPO (Utilizado para títulos simples)
export const Field = ({ label, children }: any) => (
  <div className="space-y-3 w-full">
    {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block ml-4">{label}</label>}
    {children}
  </div>
);

// 3. GRUPO DE CHECKBOXES (Seleção Múltipla Estilizada)
export const CheckboxGroup = ({ name, label, options, control }: any) => {
  const { field } = useController({ name, control, defaultValue: [] });
  const safeValue = ensureArray(field.value);

  return (
    <div className="space-y-4">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-4 ml-4">{label}</label>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((opt: string) => {
          const active = safeValue.includes(opt);
          return (
            <label key={opt} className={`group flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${
              active ? 'bg-rose-50 border-rose-200 ring-4 ring-rose-500/5' : 'bg-gray-50 border-transparent hover:border-gray-200'
            }`}>
              <span className={`text-sm font-black tracking-tight ${active ? 'text-rose-700' : 'text-gray-600'}`}>{opt}</span>
              <input type="checkbox" checked={active} className="hidden" onChange={(e) => {
                const next = e.target.checked ? [...safeValue, opt] : safeValue.filter(v => v !== opt);
                field.onChange(next);
              }} />
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all ${
                active ? 'bg-rose-500 border-rose-500 rotate-0 scale-100' : 'bg-white border-gray-200 opacity-0 group-hover:opacity-100 rotate-45 scale-75'
              }`}>
                {active && <CheckCircle2 size={16} className="text-white" />}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

// 4. GRADE DE REGIÕES (Pílulas de Seleção Rápida)
export const RegionGrid = ({ name, options, control, label }: any) => {
  const { field } = useController({ name, control, defaultValue: [] });
  const safeValue = ensureArray(field.value);
  return (
    <div className="space-y-4">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-4 ml-4">{label}</label>}
      <div className="flex flex-wrap gap-2 pt-2">
        {options.map((opt: string) => {
          const active = safeValue.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => {
              const next = active ? safeValue.filter(v => v !== opt) : [...safeValue, opt];
              field.onChange(next);
            }} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${
              active ? 'bg-gray-900 border-gray-900 text-white shadow-xl scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-900 hover:text-gray-900'
            }`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 5. INPUT COM LABEL (Design Arredondado)
export const InputWithLabel = React.forwardRef(({ label, style, ...props }: any, ref: any) => (
  <div className="w-full group">
    {label && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-4 transition-colors group-focus-within:text-rose-500">{label}</label>}
    <input {...props} ref={ref} style={style} className="w-full bg-gray-50 border-2 border-transparent p-5 rounded-[1.5rem] text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-rose-200 focus:ring-8 focus:ring-rose-500/5 transition-all placeholder:text-gray-300 placeholder:font-medium" />
  </div>
));
InputWithLabel.displayName = "InputWithLabel";

// 6. SELECT PERSONALIZADO
export const SelectField = ({ label, name, register, options }: any) => (
  <div className="relative group w-full">
    {label && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-4 transition-colors group-focus-within:text-rose-500">{label}</label>}
    <div className="relative">
      <select {...register(name)} className="w-full appearance-none bg-gray-50 border-2 border-transparent p-5 rounded-[1.5rem] text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-rose-200 focus:ring-8 focus:ring-rose-500/5 transition-all">
        <option value="">Selecione...</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
    </div>
  </div>
);

// 7. COMPONENTE SIM/NÃO (Estilo Pílula Dupla)
export const YesNoRadio = ({ label, name, register, watchValue }: any) => {
  const current = String(watchValue);
  return (
    <div className="space-y-3">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">{label}</label>}
      <div className="flex gap-2">
        <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 text-center transition-all ${current === "true" ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 font-bold'}`}>
          <input type="radio" value="true" {...register(name)} className="hidden" />
          <span className="text-xs font-black uppercase">Sim</span>
        </label>
        <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 text-center transition-all ${current === "false" ? 'bg-gray-800 border-gray-800 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 font-bold'}`}>
          <input type="radio" value="false" {...register(name)} className="hidden" />
          <span className="text-xs font-black uppercase">Não</span>
        </label>
      </div>
    </div>
  );
};

// 8. SLIDER DE URGÊNCIA (Utilizado na barra lateral)
export const LabelSlider = ({ label, name, register, min, max, low, high }: any) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 ml-2">{label}</label>}
    <input
      type="range"
      min={min}
      max={max}
      step="1"
      {...register(name)}
      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all"
    />
    <div className="flex justify-between text-[10px] font-black uppercase mt-3 text-gray-500">
      <span>{low}</span>
      <span>{high}</span>
    </div>
  </div>
);

// 9. ITEM ÚNICO CHECKBOX
export const CheckboxItem = ({ name, label, register }: any) => (
  <label className="flex items-center gap-5 p-6 bg-white border-2 border-gray-50 rounded-[2rem] cursor-pointer hover:shadow-md hover:border-rose-100 transition-all active:scale-[0.98]">
    <div className="relative flex items-center">
      <input type="checkbox" {...register(name)} className="peer w-7 h-7 rounded-xl border-2 border-gray-200 text-rose-500 focus:ring-rose-500/20 transition-all checked:border-rose-500" />
      <CheckCircle2 className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" size={16} />
    </div>
    <span className="text-sm font-black text-gray-700 uppercase tracking-tight">{label}</span>
  </label>
);

// 10. LISTA DE PROCEDIMENTOS COM DATAS
export const ProcedureListWithDates = ({ control, register, setValue, list }: any) => {
  const { field } = useController({ name: "procedimentos_previos", control, defaultValue: [] });
  const safeValue = ensureArray(field.value);

  return (
    <div className="space-y-4">
      {list.map((proc: string) => {
        const isChecked = safeValue.includes(proc);
        const inputName = `data_proc_${proc.toLowerCase().replace(/\s+/g, '_')}`;
        return (
          <div key={proc} className={`p-6 rounded-[2rem] border-2 transition-all ${isChecked ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-gray-50 border-transparent'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" checked={isChecked} onChange={(e) => {
                  const next = e.target.checked ? [...safeValue, proc] : safeValue.filter(v => v !== proc);
                  field.onChange(next);
                  if(!e.target.checked) setValue(inputName, ""); 
                }} className="w-6 h-6 rounded-xl border-2 border-gray-200 text-rose-500" />
                <span className={`text-sm font-black uppercase tracking-tight ${isChecked ? 'text-rose-900' : 'text-gray-500'}`}>{proc}</span>
              </label>
              
              {isChecked && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                    <Calendar size={14}/> Última Sessão:
                  </span>
                  <input 
                    type="date" 
                    {...register(inputName)} 
                    className="bg-white p-3 rounded-xl border border-rose-100 text-xs font-bold text-rose-700 outline-none focus:ring-4 focus:ring-rose-500/10" 
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 11. ÁREA DE TEXTO ESTILIZADA
export const TextareaField = ({ label, name, register, placeholder }: any) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-4">{label}</label>
    <textarea 
      {...register(name)} 
      placeholder={placeholder}
      className="w-full bg-gray-50 border-2 border-transparent p-8 rounded-[2.5rem] text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-rose-200 focus:ring-8 focus:ring-rose-500/5 transition-all h-48 resize-none"
    />
  </div>
);