import { useState, useEffect } from "react";
// 1. Subindo 3 níveis para chegar na src e entrar na lib
import { supabase } from "../../../lib/supabase"; 
import { Package, Plus, Trash2 } from "lucide-react";
// 2. Como o botão está na mesma pasta 'ui', usamos apenas './button'
import { Button } from "../../ui/button"; 
import { toast } from "react-hot-toast";

export function CabinetManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Acidos");

  useEffect(() => {
    fetchCabinet();
  }, []);

  async function fetchCabinet() {
    try {
      const { data, error } = await supabase.from("clinic_cabinet").select("*").order("name");
      if (error) throw error;
      if (data) setProducts(data);
    } catch (err) {
      console.error("Erro ao carregar gabinete:", err);
    }
  }

  async function handleAdd() {
    if (!name) return;
    try {
      const { error } = await supabase.from("clinic_cabinet").insert([{ name, category }]);
      if (error) throw error;
      
      toast.success("Produto adicionado!");
      setName("");
      fetchCabinet();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("clinic_cabinet").delete().eq("id", id);
      if (error) throw error;
      fetchCabinet();
      toast.success("Removido.");
    } catch (err: any) {
      toast.error("Erro ao deletar.");
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-2xl text-pink-600">
          <Package size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black italic tracking-tighter uppercase text-gray-900 dark:text-white">Gabinete VILAGI</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Controle de Ativos para IA</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <input 
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none" 
          placeholder="Ex: Toxina Botulift 100u" 
          value={name} 
          onChange={e => setName(e.target.value)} 
        />
        <select 
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm outline-none w-full md:w-40" 
          value={category} 
          onChange={e => setCategory(e.target.value)}
        >
          <option value="Acidos">Ácidos</option>
          <option value="Injetaveis">Injetáveis</option>
          <option value="Tecnologias">Aparelhos</option>
          <option value="HomeCare">Home Care</option>
        </select>
        <Button onClick={handleAdd} className="bg-pink-600 hover:bg-pink-700 text-white h-12 rounded-xl px-6">
          <Plus size={20}/>
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {products.length === 0 && (
          <p className="text-center py-10 text-gray-400 text-xs italic">Nenhum item no gabinete.</p>
        )}
        {products.map(p => (
          <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 group hover:border-pink-200 transition-all">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</p>
              <p className="text-[9px] uppercase text-gray-400 font-black tracking-widest">{p.category}</p>
            </div>
            <button 
              onClick={() => handleDelete(p.id)} 
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}