import { Search, Printer, Calendar, Ban, History, ChevronRight, FileText } from "lucide-react";
import { Button } from "../../../components/ui/button"; 

// ✅ CORREÇÃO 1: Importando do arquivo novo e específico (getProcedureColor)
import { getProcedureColor } from "../utils/getProcedureColor";

interface EvolutionTimelineProps {
  records: any[];
  onSearch: (term: string) => void;
  onSelectRecord: (rec: any) => void;
  onInvalidate: (id: string) => void;
}

export function EvolutionTimeline({ records, onSearch, onSelectRecord, onInvalidate }: EvolutionTimelineProps) {
  return (
    <div className="space-y-8">
       {/* Barra de Busca */}
       <div className="bg-white dark:bg-gray-800 p-2 pl-4 pr-2 rounded-[2rem] border border-gray-200 dark:border-gray-700 shadow-sm flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
            <input 
              onChange={e => onSearch(e.target.value)} 
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-transparent border-0 outline-none dark:text-white font-medium placeholder:text-gray-400" 
              placeholder="Pesquisar no histórico..."
            />
          </div>
          <Button variant="ghost" onClick={() => window.print()} className="rounded-full w-12 h-12 hover:bg-gray-100"><Printer size={20} className="text-gray-500"/></Button>
       </div>
       
       <div className="relative pl-6">
          {/* LINHA VERTICAL CONTÍNUA */}
          <div className="absolute top-4 bottom-0 left-[27px] w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent dark:from-gray-700 dark:via-gray-800"></div>
          
          {records.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText size={40} className="text-gray-400"/></div>
              <p className="font-bold text-gray-500">Nenhum registro encontrado</p>
            </div>
          ) : (
            // ✅ CORREÇÃO 2: Removido o 'index' que não estava sendo usado
            records.map((item) => (
             <div key={item.id} className={`relative pl-12 mb-10 group ${item.deleted_at ? 'opacity-60 grayscale' : ''}`}>
                
                {/* BOLINHA DA TIMELINE */}
                <div className={`absolute top-8 left-[3px] w-12 h-12 rounded-full z-10 border-4 shadow-lg flex items-center justify-center bg-white transition-transform group-hover:scale-110 ${item.deleted_at ? 'border-red-100' : 'border-pink-100'}`}>
                    <div className={`w-4 h-4 rounded-full ${item.deleted_at ? 'bg-red-400' : 'bg-pink-500'}`}></div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <span className="px-4 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 inline-flex items-center gap-2 text-gray-500">
                           <Calendar size={12}/> {new Date(item.date).toLocaleDateString('pt-BR')}
                         </span>
                         <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-gray-900 dark:text-white">
                           {item.subject} 
                           <span className={`text-[9px] px-2 py-1 rounded-lg border font-bold ${getProcedureColor(item.subject)}`}>
                             {item.subject.split(' ')[0]}
                           </span> 
                           {item.deleted_at && <span className="bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[9px]">INVALIDADO</span>}
                         </h3>
                      </div>
                      {!item.deleted_at && (
                        <button onClick={() => onInvalidate(item.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Invalidar Registro">
                          <Ban size={20}/>
                        </button>
                      )}
                   </div>
                   
                   <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-gray-900/30 p-6 rounded-3xl border border-gray-50 dark:border-gray-800 line-clamp-3 mb-6 font-medium">
                     {item.description}
                   </p>
                   
                   <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <History size={12}/> Registrado em {new Date(item.created_at).toLocaleDateString()}
                      </div>
                      <div 
                        onClick={() => onSelectRecord(item)} 
                        className="flex items-center gap-2 text-[10px] font-black text-pink-600 uppercase cursor-pointer hover:bg-pink-50 px-4 py-2 rounded-full transition-colors"
                      >
                        Ver detalhes <ChevronRight size={12}/>
                      </div>
                   </div>
                </div>
             </div>
          )))}
       </div>
    </div>
  );
}