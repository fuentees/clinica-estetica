import React from "react";
import { useController } from "react-hook-form";
import { 
  CheckCircle2, 
  Calendar, 
  ChevronDown, 
  Info, 
  AlertCircle
} from "lucide-react";

// 🛡️ Utils
const ensureArray = (v: any): string[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim() !== "") return v.split("; ").map(s => s.trim());
  return [];
};

// 1. CONTAINER DE SEÇÃO (Igual aos Cards do Dashboard)
export const Section = ({ title, children, icon: Icon, description }: any) => (
  <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-all hover:shadow-md group">
    <div className="flex items-center gap-4 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-pink-600 shadow-sm">
          <Icon size={20} />
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {title}
        </h2>
        {description && <p className="text-xs text-gray-500 font-medium">{description}</p>}
      </div>
    </div>
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

// 2. WRAPPER DE CAMPO
export const Field = ({ label, children }: any) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">{label}</label>}
    {children}
  </div>
);

// 3. GRUPO DE CHECKBOXES
export const CheckboxGroup = ({ name, label, options, control }: any) => {
  const { field } = useController({ name, control, defaultValue: [] });
  const safeValue = ensureArray(field.value);

  return (
    <div className="space-y-3">
      {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">{label}</label>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {options.map((opt: string) => {
          const active = safeValue.includes(opt);
          return (
            <label key={opt} className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
              active 
                ? 'bg-pink-50 border-pink-200 shadow-sm dark:bg-pink-900/20 dark:border-pink-800' 
                : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
            }`}>
              <span className={`text-sm font-bold ${active ? 'text-pink-700 dark:text-pink-400' : 'text-gray-600 dark:text-gray-300'}`}>{opt}</span>
              <input type="checkbox" checked={active} className="hidden" onChange={(e) => {
                const next = e.target.checked ? [...safeValue, opt] : safeValue.filter(v => v !== opt);
                field.onChange(next);
              }} />
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                active ? 'bg-pink-500 border-pink-500 scale-100' : 'bg-white border-gray-300 scale-90'
              }`}>
                {active && <CheckCircle2 size={12} className="text-white" />}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

// 4. GRADE DE REGIÕES (Pílulas)
export const RegionGrid = ({ name, options, control, label }: any) => {
  const { field } = useController({ name, control, defaultValue: [] });
  const safeValue = ensureArray(field.value);
  
  return (
    <div className="space-y-3">
      {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => {
          const active = safeValue.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => {
              const next = active ? safeValue.filter(v => v !== opt) : [...safeValue, opt];
              field.onChange(next);
            }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              active 
                ? 'bg-gray-900 border-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
            }`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 5. INPUT COM LABEL (Estilo Dashboard)
export const InputWithLabel = React.forwardRef(({ label, style, ...props }: any, ref: any) => (
  <div className="w-full group space-y-2">
    {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1 transition-colors group-focus-within:text-pink-600">{label}</label>}
    <input 
      {...props} 
      ref={ref} 
      style={style} 
      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all placeholder:text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
    />
  </div>
));
InputWithLabel.displayName = "InputWithLabel";

// 6. SELECT PERSONALIZADO
export const SelectField = ({ label, name, register, options }: any) => (
  <div className="relative group w-full space-y-2">
    {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1 transition-colors group-focus-within:text-pink-600">{label}</label>}
    <div className="relative">
      <select 
        {...register(name)} 
        className="w-full appearance-none bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      >
        <option value="">Selecione...</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

// 7. COMPONENTE SIM/NÃO
export const YesNoRadio = ({ label, name, register, watchValue }: any) => {
  const current = String(watchValue);
  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">{label}</label>}
      <div className="flex gap-2">
        <label className={`flex-1 cursor-pointer py-3 px-4 rounded-xl border text-center transition-all ${current === "true" ? 'bg-pink-600 border-pink-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-medium'}`}>
          <input type="radio" value="true" {...register(name)} className="hidden" />
          <span className="text-xs font-bold uppercase">Sim</span>
        </label>
        <label className={`flex-1 cursor-pointer py-3 px-4 rounded-xl border text-center transition-all ${current === "false" ? 'bg-gray-800 border-gray-800 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-medium'}`}>
          <input type="radio" value="false" {...register(name)} className="hidden" />
          <span className="text-xs font-bold uppercase">Não</span>
        </label>
      </div>
    </div>
  );
};

// 8. SLIDER
export const LabelSlider = ({ label, name, register, min, max, low, high }: any) => (
  <div className="w-full space-y-3">
    {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">{label}</label>}
    <input
      type="range"
      min={min}
      max={max}
      step="1"
      {...register(name)}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600 hover:accent-pink-500 transition-all dark:bg-gray-700"
    />
    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
      <span>{low}</span>
      <span>{high}</span>
    </div>
  </div>
);

// 9. CHECKBOX ITEM ÚNICO
export const CheckboxItem = ({ name, label, register }: any) => (
  <label className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:border-pink-200 hover:shadow-sm transition-all dark:bg-gray-800 dark:border-gray-700">
    <div className="relative flex items-center">
      <input type="checkbox" {...register(name)} className="peer w-5 h-5 rounded-md border-2 border-gray-300 text-pink-600 focus:ring-pink-500/20 transition-all checked:border-pink-600 checked:bg-pink-600" />
      <CheckCircle2 className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" size={12} />
    </div>
    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{label}</span>
  </label>
);

// 10. LISTA DE PROCEDIMENTOS
export const ProcedureListWithDates = ({ control, register, setValue, list }: any) => {
  const { field } = useController({ name: "procedimentos_previos", control, defaultValue: [] });
  const safeValue = ensureArray(field.value);

  return (
    <div className="space-y-3">
      {list.map((proc: string) => {
        const isChecked = safeValue.includes(proc);
        const inputName = `data_proc_${proc.toLowerCase().replace(/\s+/g, '_')}`;
        return (
          <div key={proc} className={`p-4 rounded-2xl border transition-all ${isChecked ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/10 dark:border-pink-800' : 'bg-gray-50 border-transparent dark:bg-gray-800 dark:border-gray-700'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isChecked} onChange={(e) => {
                  const next = e.target.checked ? [...safeValue, proc] : safeValue.filter(v => v !== proc);
                  field.onChange(next);
                  if(!e.target.checked) setValue(inputName, ""); 
                }} className="w-5 h-5 rounded-md border-gray-300 text-pink-600 focus:ring-pink-500" />
                <span className={`text-sm font-bold ${isChecked ? 'text-pink-700 dark:text-pink-400' : 'text-gray-600 dark:text-gray-400'}`}>{proc}</span>
              </label>
              
              {isChecked && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12}/> Data:
                  </span>
                  <input 
                    type="date" 
                    {...register(inputName)} 
                    className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 outline-none focus:border-pink-500 dark:bg-gray-900 dark:border-gray-600 dark:text-white" 
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

// 11. TEXTAREA (Design Dashboard)
export const TextAreaField = ({ label, name, register, placeholder }: any) => (
  <div className="w-full space-y-2">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">{label}</label>
    <textarea 
      {...register(name)} 
      placeholder={placeholder}
      className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all h-32 resize-none placeholder:text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
    />
  </div>
);