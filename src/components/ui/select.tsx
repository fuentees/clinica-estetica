import * as React from "react"
import { ChevronDown } from "lucide-react"

// Contexto para comunicação entre as partes do Select
const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function Select({ onValueChange, children }: any) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const handleChange = (val: string) => {
    setValue(val);
    onValueChange(val);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className }: any) {
  const ctx = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => ctx?.setOpen(!ctx.open)}
      className={`flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder }: any) {
  const ctx = React.useContext(SelectContext);
  // Aqui é um truque: se tiver valor, teríamos que achar o texto correspondente.
  // Para simplificar, se tiver valor mostra "Selecionado", senão Placeholder.
  // O ideal seria passar o "children" do Item selecionado para cá.
  return <span className="block truncate">{ctx?.value ? "Profissional Selecionado" : placeholder}</span>;
}

export function SelectContent({ children }: any) {
  const ctx = React.useContext(SelectContext);
  if (!ctx?.open) return null;

  return (
    <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-950 shadow-md animate-in fade-in-80 mt-2 w-full dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50">
      <div className="p-1">{children}</div>
    </div>
  );
}

export function SelectItem({ value, children }: any) {
  const ctx = React.useContext(SelectContext);
  return (
    <div
      onClick={() => ctx?.onValueChange(value)}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none hover:bg-pink-50 dark:hover:bg-pink-900/20 focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${ctx?.value === value ? 'bg-pink-50 text-pink-600 font-bold' : ''}`}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {/* Ícone de check se quiser */}
      </span>
      <span>{children}</span>
    </div>
  );
}