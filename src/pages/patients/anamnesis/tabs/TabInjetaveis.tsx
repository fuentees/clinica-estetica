import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { MapPin, Plus, Trash2, Syringe, Calendar, FileText, Package } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { BodyMappingComponent } from "../../../../components/anamnesis/BodyMappingComponent";
import { toast } from "react-hot-toast";
import { supabase } from "../../../../lib/supabase";
import { useParams } from "react-router-dom";

interface ProductItem { id: string; name: string; brand: string; volume: string; dilution: string; }

export function TabInjetaveis() {
  const { id } = useParams();
  const { control, watch } = useFormContext();
  
  const [viewMode, setViewMode] = useState<'face' | 'body'>('face');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', brand: '', volume: '', dilution: '' });
  const [showProductForm, setShowProductForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const currentPlanAreas = watch("body_mapping") || [];

  const handleAddProduct = () => {
    if (!newProduct.name) return toast.error("Nome obrigatório");
    setProducts([...products, { ...newProduct, id: crypto.randomUUID() }]);
    setNewProduct({ name: '', brand: '', volume: '', dilution: '' });
    setShowProductForm(false);
  };

  const handleSavePlan = async () => {
    if (products.length === 0 && currentPlanAreas.length === 0) return toast.error("Adicione produtos ou marque áreas.");
    try {
        const { error } = await supabase.from('injectable_plans').insert([{ patient_id: id, date, products, areas: currentPlanAreas, notes }]);
        if (error) throw error;
        toast.success("Aplicação registrada!");
        setProducts([]); setNotes("");
    } catch (e) { toast.error("Erro ao salvar."); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-rose-100/50 border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2"><MapPin className="text-rose-500"/> Mapeamento</h3>
                <div className="flex bg-gray-100 p-1.5 rounded-xl">
                    <button onClick={() => setViewMode('face')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'face' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500'}`}>Facial</button>
                    <button onClick={() => setViewMode('body')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'body' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500'}`}>Corporal</button>
                </div>
            </div>
            <div className="flex justify-center bg-gray-50/50 p-6 rounded-2xl border-2 border-dashed border-gray-200 min-h-[500px]">
                <Controller name="body_mapping" control={control} render={({ field }) => <BodyMappingComponent value={field.value || []} onChange={field.onChange} viewMode={viewMode} />} />
            </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><Package size={18} className="text-purple-500"/> Produtos</h3>
                <Button size="sm" onClick={() => setShowProductForm(!showProductForm)} className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-0 h-8 text-xs font-bold"><Plus size={14} className="mr-1"/> Add</Button>
            </div>
            {showProductForm && (
                <div className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-200 animate-in slide-in-from-top-2">
                    <div className="space-y-3 mb-4">
                        <input className="w-full p-3 bg-white border-0 rounded-xl shadow-sm text-sm outline-none" placeholder="Nome (ex: Botox)" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                        <div className="grid grid-cols-2 gap-2">
                            <input className="w-full p-3 bg-white border-0 rounded-xl shadow-sm text-sm outline-none" placeholder="Marca" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} />
                            <input className="w-full p-3 bg-white border-0 rounded-xl shadow-sm text-sm outline-none" placeholder="Vol/Diluição" value={newProduct.volume} onChange={e => setNewProduct({...newProduct, volume: e.target.value})} />
                        </div>
                    </div>
                    <Button onClick={handleAddProduct} className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 text-sm">Confirmar</Button>
                </div>
            )}
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {products.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">Lista vazia.</div> : products.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div><p className="font-bold text-gray-800 text-sm">{p.name}</p><p className="text-xs text-gray-500">{p.brand} • {p.volume}</p></div>
                        <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Syringe className="text-emerald-400"/> Resumo</h3>
            <div className="space-y-4">
                <div><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-white outline-none" /></div>
                <div><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Notas</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-white outline-none h-28 resize-none text-sm" placeholder="Pontos, profundidade..." /></div>
                <Button onClick={handleSavePlan} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl font-bold shadow-lg mt-2">Registrar Aplicação</Button>
            </div>
        </div>
      </div>
    </div>
  );
}