import React from "react";
import { X, UserCheck, ImageIcon } from "lucide-react";
import { ClinicalRecord } from "../types/clinical";

interface RecordDetailsModalProps {
  record: ClinicalRecord | null;
  onClose: () => void;
}

export function RecordDetailsModal({ record, onClose }: RecordDetailsModalProps) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
       <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-[2rem]">
             <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{record.subject}</h3>
                <p className="text-xs font-bold text-gray-500">{new Date(record.date).toLocaleDateString('pt-BR')}</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
          </div>
          
          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
             <div>
                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Descrição</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800">
                    {record.description}
                </p>
             </div>
             
             {/* Fotos */}
             {record.attachments?.photos && record.attachments.photos.length > 0 && (
                 <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 flex items-center gap-2">
                        <ImageIcon size={14}/> Evidência Fotográfica
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                        {record.attachments.photos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                                <img src={url} alt={`Evidência ${i}`} className="w-full h-full object-cover"/>
                            </a>
                        ))}
                    </div>
                 </div>
             )}
             
             {/* Produtos */}
             {record.attachments?.usedProducts && record.attachments.usedProducts.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Produtos Utilizados</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {record.attachments.usedProducts.map((p, i) => (
                            <div key={i} className="flex justify-between p-3 border rounded-xl text-xs border-gray-100 dark:border-gray-800 bg-gray-50">
                                <span className="font-bold">{p.name}</span>
                                <span className="text-gray-500 bg-white px-2 py-0.5 rounded border">Lote: {p.batch}</span>
                            </div>
                        ))}
                    </div>
                </div>
             )}
             
             {record.profiles && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600"><UserCheck size={14}/></div>
                    <div><p className="text-xs font-bold dark:text-white">Dr(a). {record.profiles.first_name}</p></div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}