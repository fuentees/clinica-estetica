import { Plus, Trash2, Pill, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { PrescriptionTreatment } from "../hooks/usePatientEvolution";

interface Props {
  items: PrescriptionTreatment[];
  onAdd: () => void;
  onUpdate: (index: number, data: PrescriptionTreatment) => void;
  onRemove: (index: number) => void;
}

export function PrescriptionModule({ items, onAdd, onUpdate, onRemove }: Props) {
  return (
    <div className="space-y-8 mt-10 p-10 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-[3rem] border-2 border-emerald-100/50">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-xl">
            <Pill size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tighter italic">Itens da Receita</h3>
            <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest">Ativos e Dosagens</p>
          </div>
        </div>
        <Button 
          type="button" 
          onClick={onAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-16 px-8 font-black uppercase text-xs tracking-[0.2em] shadow-xl"
        >
          <Plus size={20} className="mr-2" /> Adicionar Item
        </Button>
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border-2 border-emerald-100 shadow-2xl relative animate-in zoom-in-95 duration-300">
          <button 
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute top-8 right-8 h-12 w-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
          >
            <Trash2 size={24} />
          </button>

          <div className="space-y-8">
            {/* Nome do Medicamento - FONTE GRANDE */}
            <div className="space-y-3">
              <label className="text-xs font-black text-emerald-600 uppercase tracking-widest ml-2 italic">Produto / Fórmula Principal</label>
              <input 
                className="w-full h-20 px-8 border-4 border-emerald-50 dark:border-gray-800 rounded-[2rem] font-black text-2xl focus:border-emerald-500 outline-none transition-all placeholder:text-gray-200 italic"
                placeholder="Ex: Sérum Clareador Noturno"
                value={item.name}
                onChange={(e) => onUpdate(idx, { ...item, name: e.target.value })}
              />
            </div>

            {/* Composição / Ativos */}
            <div className="bg-emerald-50/40 dark:bg-gray-800/50 p-8 rounded-[2.5rem] border-2 border-dashed border-emerald-200">
              <label className="text-xs font-black text-emerald-500 uppercase tracking-widest block mb-6 italic">Composição Química / Ativos</label>
              <div className="space-y-4">
                {item.components.map((comp, cIdx) => (
                  <div key={cIdx} className="flex gap-4 items-center">
                    <input 
                      className="flex-1 h-14 px-6 bg-white dark:bg-gray-900 border-2 border-emerald-50 rounded-2xl text-lg font-bold shadow-inner outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Nome do Ativo"
                      value={comp.name}
                      onChange={(e) => {
                        const newComps = [...item.components];
                        newComps[cIdx].name = e.target.value;
                        onUpdate(idx, { ...item, components: newComps });
                      }}
                    />
                    <input 
                      className="w-32 h-14 px-6 bg-white dark:bg-gray-900 border-2 border-emerald-50 rounded-2xl text-lg font-black italic shadow-inner outline-none text-center focus:ring-2 focus:ring-emerald-500"
                      placeholder="Qtd"
                      value={comp.quantity}
                      onChange={(e) => {
                        const newComps = [...item.components];
                        newComps[cIdx].quantity = e.target.value;
                        onUpdate(idx, { ...item, components: newComps });
                      }}
                    />
                    <button 
                       type="button"
                       onClick={() => {
                         const newComps = item.components.filter((_, i) => i !== cIdx);
                         onUpdate(idx, { ...item, components: newComps });
                       }}
                       className="text-gray-300 hover:text-rose-500 transition-colors"
                    ><X size={20}/></button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => onUpdate(idx, { ...item, components: [...item.components, { name: '', quantity: '' }] })}
                  className="h-12 px-6 text-xs text-emerald-600 font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white rounded-2xl transition-all mt-4 border-2 border-emerald-100"
                >
                  <Plus size={18} /> Adicionar Ativo
                </button>
              </div>
            </div>

            {/* Instruções - FONTE GRANDE */}
            <div className="space-y-3">
              <label className="text-xs font-black text-emerald-600 uppercase tracking-widest ml-2 italic">Modo de Uso / Posologia</label>
              <textarea 
                className="w-full p-8 border-4 border-emerald-50 dark:border-gray-800 rounded-[3rem] font-bold text-lg focus:border-emerald-500 outline-none transition-all resize-none h-40 italic leading-relaxed shadow-inner"
                placeholder="Descreva como o paciente deve utilizar..."
                value={item.observations}
                onChange={(e) => onUpdate(idx, { ...item, observations: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}