import React, { useRef, useState } from "react";
import { useController, UseControllerProps } from "react-hook-form";
import { X, CheckCircle, Calendar } from "lucide-react";
import { Input } from "../ui/input"; // Ajuste o caminho se necessário

// --- Helpers de Estilo ---
export const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-8">
    <div className="mb-4 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border-l-4 border-red-600">
      <h2 className="text-lg font-bold text-red-800 dark:text-red-100">{title}</h2>
    </div>
    {children}
  </div>
);

export const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={(e) => { e.preventDefault(); onClick(); }} 
    className={`flex items-center gap-2 py-2 px-4 rounded-lg transition-all whitespace-nowrap ${active ? "bg-red-50 text-red-700 font-bold border border-red-300 shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"}`}
  >
    {icon} <span className="hidden md:inline">{label}</span>
  </button>
);

export const Field = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    {children}
  </div>
);

// --- Inputs Especializados ---

export const InputWithLabel = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, ...props }, ref) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <Input {...props} ref={ref} />
    </div>
  )
);
InputWithLabel.displayName = "InputWithLabel";

export const CheckboxGroup = ({ name, label, options, control }: { name: string, label: string, options: string[], control: any }) => {
  const { field } = useController({ name, control, defaultValue: [] });
  return (
    <div>
      <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">{label}</h4>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60 p-1 rounded">
            <input 
              type="checkbox" 
              value={opt} 
              checked={field.value?.includes(opt)} 
              onChange={(e) => { 
                const val = e.target.value; 
                const curr = field.value || []; 
                field.onChange(e.target.checked ? [...curr, val] : curr.filter((v: any) => v !== val)); 
              }} 
              className="rounded text-red-600 focus:ring-red-500 w-4 h-4" 
            /> 
            <span className="text-gray-700 dark:text-gray-300">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const RegionGrid = ({ name, options, control }: { name: string, options: string[], control: any }) => {
  const { field } = useController({ name, control, defaultValue: [] });
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = field.value?.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const curr = field.value || [];
                field.onChange(isSelected ? curr.filter((v: any) => v !== opt) : [...curr, opt]);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                isSelected 
                  ? "bg-red-100 border-red-500 text-red-800 font-bold shadow-sm" 
                  : "bg-white border-gray-300 text-gray-600 hover:border-red-300"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const CheckboxItem = ({ name, label, register }: { name: string, label: string, register: any }) => (
  <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-md">
    <input type="checkbox" {...register(name)} className="rounded text-red-600 focus:ring-red-500 w-5 h-5" />
    <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
  </label>
);

export const SelectField = ({ label, name, register, options }: { label: string, name: string, register: any, options: string[] }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <select {...register(name)} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus-visible:ring-red-500 outline-none">
      <option value="">Selecione</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export const LabelSlider = ({ label, name, register, min, max, low, high }: any) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between"><span>{label}</span></label>
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400">{low}</span>
      <input type="range" min={min} max={max} {...register(name)} className="w-full accent-red-600 cursor-pointer" />
      <span className="text-xs text-gray-400">{high}</span>
    </div>
  </div>
);

export const YesNoRadio = ({ label, name, register, watchValue, trueLabel = "Sim", falseLabel = "Não" }: any) => {
  const isTrue = watchValue === "true" || watchValue === true;
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="true" {...register(name)} className="w-4 h-4 text-red-600 focus:ring-red-500" />
          <span className={isTrue ? "font-bold text-red-700" : "text-gray-700 dark:text-gray-300"}>{trueLabel}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="false" {...register(name)} className="w-4 h-4 text-red-600 focus:ring-red-500" />
          <span className={!isTrue && watchValue !== undefined ? "font-bold text-gray-900" : "text-gray-700 dark:text-gray-300"}>{falseLabel}</span>
        </label>
      </div>
    </div>
  );
};

export const ProcedureListWithDates = ({ control, register, setValue, list }: any) => {
  const { field } = useController({ name: "procedimentos_previos", control, defaultValue: [] });
  const selectedProcedures = field.value || [];

  const handleCheck = (proc: string, checked: boolean) => {
    if (checked) {
      field.onChange([...selectedProcedures, proc]);
    } else {
      field.onChange(selectedProcedures.filter((p: string) => p !== proc));
      setValue(`data_proc_${proc}`, ""); 
    }
  };

  return (
    <div>
      <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">Procedimentos Realizados:</h4>
      <div className="space-y-3">
        {list.map((proc: string) => {
          const isChecked = selectedProcedures.includes(proc);
          return (
            <div key={proc} className={`p-3 rounded-lg border transition-all ${isChecked ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleCheck(proc, e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-5 h-5"
                  />
                  <span className={`font-medium ${isChecked ? "text-red-800" : "text-gray-700"}`}>{proc}</span>
                </label>
                {isChecked && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-xs text-red-700 flex items-center gap-1 font-bold">
                      <Calendar size={12} /> Última sessão:
                    </span>
                    <input 
                      type="date" 
                      {...register(`data_proc_${proc}`)}
                      className="text-sm p-1 border rounded bg-white text-gray-600 focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SignaturePad({ onEnd, existingSignature, isLoading }: { onEnd: (data: string) => void; existingSignature: string | null; isLoading?: boolean; }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!existingSignature);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    if (hasSignature || isLoading) return; 
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing || hasSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      onEnd(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
  };

  const clear = (e: any) => {
    e.preventDefault();
    if(isLoading) return;
    setHasSignature(false);
    onEnd(""); 
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  if (hasSignature && existingSignature) {
      return (
          <div className="border-2 border-dashed border-green-300 rounded-xl bg-green-50 p-4 text-center">
              <img src={existingSignature} alt="Assinatura Salva" className="mx-auto max-h-[150px] mb-2" />
              <div className="flex items-center justify-center gap-2 text-green-700 font-bold mb-2">
                  <CheckCircle size={16} /> Assinatura Registrada
              </div>
              <button type="button" onClick={clear} disabled={!!isLoading} className="text-red-600 hover:underline text-sm flex items-center justify-center gap-1 mx-auto disabled:opacity-50">
                  <X size={14} /> Apagar e Assinar Novamente
              </button>
          </div>
      )
  }

  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-center ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        className="bg-white rounded-lg mx-auto touch-none cursor-crosshair max-w-full border border-gray-200"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="mt-2 flex justify-center gap-4 text-sm text-gray-500">
        <span>Assine acima com o dedo ou mouse</span>
        <button type="button" onClick={clear} disabled={!!isLoading} className="text-red-600 hover:underline flex items-center gap-1 disabled:opacity-50">
          <X size={14} /> Limpar
        </button>
      </div>
    </div>
  );
}
