import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        {/* Botão para fechar o modal */}
        <button 
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título do Modal */}
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{title}</h2>

        {/* Conteúdo do Modal */}
        <div className="text-gray-700 dark:text-gray-300">
          {children}
        </div>

        {/* Botão de fechar */}
        <div className="mt-6 flex justify-end">
          <button 
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
