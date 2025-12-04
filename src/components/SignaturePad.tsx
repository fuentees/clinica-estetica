import { useRef, useState, useCallback } from 'react'; // <-- 'React' removido
import SignatureCanvas from 'react-signature-canvas';
import { Button } from './ui/button'; 
import { Loader2, Trash2, Check, PenTool } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SignaturePadProps {
  onEnd: (dataURL: string) => void;
  isLoading?: boolean;
}

export function SignaturePad({ onEnd, isLoading = false }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Limpa a assinatura
  const clear = useCallback(() => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
    }
    onEnd(''); 
  }, [onEnd]);

  // Salva a assinatura (converte para imagem)
  const save = useCallback(() => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      // getTrimmedCanvas() remove os espaços em branco à volta da assinatura
      const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      onEnd(dataURL);
      setIsEmpty(false);
      toast.success("Assinatura capturada!");
    } else {
      toast.error("Por favor, assine no campo.");
      setIsEmpty(true);
    }
  }, [onEnd]);

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden">
      
      {/* Cabeçalho do Componente */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <PenTool size={16} className="text-pink-600" />
          Assinatura do Cliente
        </h3>
        <span className="text-xs text-gray-400">Use o mouse ou dedo</span>
      </div>
      
      {/* Área de Desenho */}
      <div className="bg-white cursor-crosshair relative">
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-2xl font-bold opacity-20 select-none">Assine Aqui</span>
          </div>
        )}
        <SignatureCanvas
          ref={sigCanvas}
          onBegin={handleBegin}
          canvasProps={{ 
            className: 'w-full h-48', 
            style: { width: '100%', height: '192px' } 
          }}
          penColor="black"
        />
      </div>

      {/* Rodapé com Ações */}
      <div className="flex justify-end gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <Button 
          onClick={clear} 
          variant="secondary" 
          type="button" 
          size="sm" 
          className="text-xs h-9 px-4"
          disabled={isLoading}
        >
          <Trash2 size={14} className="mr-1" /> Limpar
        </Button>
        
        <Button 
            onClick={save} 
            disabled={isLoading || isEmpty} 
            type="button" 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white text-xs h-9 px-6"
        >
          {isLoading ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : <Check size={14} className="mr-1" />}
          Confirmar Assinatura
        </Button>
      </div>
    </div>
  );
}