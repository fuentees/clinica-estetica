import React from "react";
import { X, UserCheck, ImageIcon, Printer, ClipboardList, Package } from "lucide-react";
import { ClinicalRecord } from "../types/clinical";
import { Button } from "../../../components/ui/button";

interface RecordDetailsModalProps {
  record: ClinicalRecord | null;
  onClose: () => void;
  onPrint: (record: any) => void; // ✅ Adicionado para resolver o erro de TS
}

export function RecordDetailsModal({ record, onClose, onPrint }: RecordDetailsModalProps) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] border border-white/20 overflow-hidden">
        
        {/* Header Estilizado */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-600">
              <ClipboardList size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                {record.subject}
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {new Date(record.date).toLocaleDateString('pt-BR')} às {new Date(record.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onPrint(record)}
              className="rounded-full text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 gap-2"
            >
              <Printer size={18} />
              <span className="hidden sm:inline font-black text-[10px] uppercase">Imprimir</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="rounded-full w-10 h-10 p-0 hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
        
        {/* Body com Scroll */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Sessão de Descrição */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-pink-500 tracking-widest flex items-center gap-2">
              Relato Técnico da Evolução
            </h4>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-6 bg-gray-50 dark:bg-gray-950 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 leading-relaxed shadow-inner">
              {record.description}
            </div>
          </div>
          
          {/* Galeria de Fotos */}
          {record.attachments?.photos && record.attachments.photos.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase text-pink-500 tracking-widest flex items-center gap-2">
                <ImageIcon size={14}/> Evidências Fotográficas
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {record.attachments.photos.map((url, i) => (
                  <a 
                    key={i} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group relative aspect-square rounded-[1.5rem] overflow-hidden border border-gray-100 dark:border-gray-800 hover:ring-2 hover:ring-pink-500 transition-all shadow-sm"
                  >
                    <img src={url} alt={`Evidência ${i}`} className="w-full h-full object-cover transition-transform group-hover:scale-110"/>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <ImageIcon className="text-white" size={24} />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Produtos Utilizados */}
          {record.attachments?.usedProducts && record.attachments.usedProducts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase text-pink-500 tracking-widest flex items-center gap-2">
                <Package size={14}/> Insumos Utilizados na Sessão
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {record.attachments.usedProducts.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border rounded-2xl text-xs border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shadow-sm">
                    <span className="font-black uppercase tracking-tight text-gray-700 dark:text-gray-200">{p.name}</span>
                    <span className="text-[9px] font-black text-pink-600 bg-white dark:bg-gray-950 px-2 py-1 rounded-lg border border-pink-100 dark:border-pink-900/30">
                      LOTE: {p.batch}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Assinatura do Profissional (Snapshot) */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600">
                <UserCheck size={20}/>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável Técnico</p>
                <p className="text-sm font-black text-gray-900 dark:text-white italic">
                  {record.professional?.fullName || record.metadata?.professional_name || "Profissional Vilagi"}
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Registro Autenticado Digitalmente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}