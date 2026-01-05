import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Plus, Trash2, Syringe, Package, Loader2, Target, Info, Calendar, FileText } from "lucide-react";
import { Button } from "../../../../components/ui/button";
// Se não tiver o BodyMappingComponent, comente a linha abaixo e o uso dele
import { BodyMappingComponent } from "../../../../components/anamnesis/BodyMappingComponent";
import { toast } from "react-hot-toast";
import { supabase } from "../../../../lib/supabase";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../contexts/AuthContext";

interface ProductItem { id: string; name: string; brand: string; volume: string; dilution: string; }

export function TabInjetaveis() {
  const { id: patientId } = useParams();
  const { profile } = useAuth();
  const { control, watch } = useFormContext();
  
  const [viewMode, setViewMode] = useState<'face' | 'body'>('face');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', brand: '', volume: '', dilution: '' });
  const [showProductForm, setShowProductForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const currentPlanAreas = watch("body_mapping") || [];

  const handleAddProduct = () => {
    if (!newProduct.name) return toast.error("Informe o nome do produto");
    setProducts([...products, { ...newProduct, id: crypto.randomUUID() }]);
    setNewProduct({ name: '', brand: '', volume: '', dilution: '' });
    setShowProductForm(false);
    toast.success("Produto adicionado ao plano");
  };

  const handleSavePlan = async () => {
    if (products.length === 0 && currentPlanAreas.length === 0) {
      return toast.error("Selecione áreas no mapa ou adicione produtos.");
    }
    
    if (!profile?.clinicId) return toast.error("Clínica não identificada.");

    setIsSaving(true);
    try {
        const { error } = await supabase.from('injectable_plans').insert([{ 
          patient_id: patientId, 
          clinicId: profile.clinicId, 
          date, 
          products, 
          areas: currentPlanAreas, 
          notes,
          createdAt: new Date().toISOString()
        }]);

        if (error) throw error;
        
        toast.success("Plano de aplicação salvo com sucesso!");
        setProducts([]); 
        setNotes("");
    } catch (e) { 
        console.error(e);
        toast.error("Erro ao salvar o registro."); 
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- COLUNA ESQUERDA (MAPA) --- */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-50 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 shadow-sm">
                      <Target size={20} />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Planejamento Visual</h3>
                      <p className="text-xs text-gray-500 font-medium">Marque os pontos de aplicação no mapa</p>
                   </div>
                </div>
                
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                    <button 
                      type="button"
                      onClick={() => setViewMode('face')} 
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'face' ? 'bg-white dark:bg-gray-800 shadow-sm text-rose-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Face
                    </button>
                    <button 
                      type="button"
                      onClick={() => setViewMode('body')} 
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'body' ? 'bg-white dark:bg-gray-800 shadow-sm text-rose-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Corpo
                    </button>
                </div>
            </div>

            <div className="flex justify-center bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 min-h-[500px] transition-all overflow-hidden relative">
                <Controller 
                  name="body_mapping" 
                  control={control} 
                  render={({ field }) => (
                    <BodyMappingComponent 
                      value={field.value || []} 
                      onChange={field.onChange} 
                      viewMode={viewMode} 
                    />
                  )} 
                />
                
                <div className="absolute bottom-4 left-0 w-full flex justify-center">
                   <span className="bg-white/80 dark:bg-gray-800/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                      <Info size={12}/> {currentPlanAreas.length} Pontos Selecionados
                   </span>
                </div>
            </div>
        </div>
      </div>

      {/* --- COLUNA DIREITA (PRODUTOS & SAVE) --- */}
      <div className="space-y-6">
        
        {/* Gestão de Produtos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                      <Package size={16}/>
                   </div>
                   <h3 className="font-bold text-gray-900 dark:text-white text-sm">Insumos</h3>
                </div>
                <Button 
                  type="button"
                  variant="ghost"
                  size="sm" 
                  onClick={() => setShowProductForm(!showProductForm)} 
                  className="text-purple-600 hover:bg-purple-50 hover:text-purple-700 text-xs font-bold"
                >
                  <Plus size={14} className="mr-1"/> Adicionar
                </Button>
            </div>

            {showProductForm && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mb-4 border border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2">
                    <div className="space-y-3 mb-3">
                        <input 
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400" 
                          placeholder="Nome (ex: Botox, Sculptra)" 
                          value={newProduct.name} 
                          onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input 
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400" 
                              placeholder="Marca" 
                              value={newProduct.brand} 
                              onChange={e => setNewProduct({...newProduct, brand: e.target.value})} 
                            />
                            <input 
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400" 
                              placeholder="Vol. (ml/U)" 
                              value={newProduct.volume} 
                              onChange={e => setNewProduct({...newProduct, volume: e.target.value})} 
                            />
                        </div>
                    </div>
                    <Button onClick={handleAddProduct} className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs h-9">
                      Confirmar
                    </Button>
                </div>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {products.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                    <Syringe className="mx-auto text-gray-300 mb-2" size={24}/>
                    <p className="text-gray-400 text-xs font-medium">Lista vazia</p>
                  </div>
                ) : (
                  products.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 transition-colors group">
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white text-sm">{p.name}</p>
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{p.brand} • {p.volume}</p>
                        </div>
                        <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="text-gray-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  ))
                )}
            </div>
        </div>

        {/* Resumo Final e Salvamento */}
        <div className="bg-gray-900 dark:bg-black p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
            {/* Decoração de fundo sutil */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gray-800 rounded-full blur-2xl opacity-50"></div>
            
            <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <FileText size={16} />
                   </div>
                   <h3 className="font-bold text-sm uppercase tracking-wider">Resumo da Sessão</h3>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1"><Calendar size={10}/> Data</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-emerald-500 transition-all font-medium" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Observações</label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none h-24 resize-none text-xs font-medium focus:border-emerald-500 transition-all placeholder:text-gray-600" 
                    placeholder="Agulha 30G, Cânula 22G, plano justa-ósseo..." 
                  />
                </div>
                
                <Button 
                  onClick={handleSavePlan} 
                  disabled={isSaving}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl font-bold shadow-lg shadow-emerald-500/20 uppercase text-xs tracking-widest transition-all hover:translate-y-[-2px] active:translate-y-0"
                >
                  {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : "Registrar Aplicação"}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}