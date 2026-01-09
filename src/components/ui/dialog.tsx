import * as React from "react"
import { X } from "lucide-react"

// Componente Base do Dialog
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay Escuro (Fundo) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange?.(false)}
      ></div>
      
      {/* Conteúdo do Modal */}
      <div className="relative z-10 w-full animate-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  // A classe 'max-w-sm' ou outras virão via props para ajustar tamanho
  return (
    <div className={`mx-auto bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">{children}</div>;
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h2>;
}