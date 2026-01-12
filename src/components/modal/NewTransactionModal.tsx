import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { X, Check, Loader2, Tag, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewTransactionModal({ isOpen, onClose, onSuccess }: NewTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense", // Padrão: Despesa
    category: "Comissão",
    payment_method: "pix",
    date: new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // 1. Validar Usuário e Clínica
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      const { data: profile } = await supabase.from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (!profile?.clinic_id) throw new Error("Clínica não identificada");

      // 2. Preparar Data ISO
      const isoDate = new Date(formData.date).toISOString();

      // 3. Inserir na Tabela Transactions
      const { error } = await supabase.from('transactions').insert({
        clinic_id: profile.clinic_id,
        description: formData.description,
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category,
        payment_method: formData.payment_method,
        status: 'paid', // Lançamentos manuais geralmente já estão liquidados
        created_at: isoDate,
        paid_at: isoDate,
        due_date: isoDate, // Corrigido: Evita o erro de NOT NULL constraint
      });

      if (error) throw error;

      toast.success("Lançamento registrado com sucesso!");
      onSuccess(); // Recarrega a lista e os gráficos ao fundo
      onClose();   // Fecha o modal
      
      // Limpar formulário para o próximo uso
      setFormData({
        description: "",
        amount: "",
        type: "expense",
        category: "Comissão",
        payment_method: "pix",
        date: new Date().toISOString().split('T')[0]
      });

    } catch (error: any) {
      console.error("Erro no lançamento:", error);
      toast.error("Erro ao salvar: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-700">
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white uppercase italic tracking-tighter text-lg">Novo Lançamento</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Financeiro & Fluxo de Caixa</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-colors text-gray-400"
          >
            <X size={22}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* SELETOR DE TIPO (RECEITA / DESPESA) */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl gap-1">
            <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'income', category: 'Vendas'})}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.type === 'income' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
                Entrada / Receita
            </button>
            <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'expense', category: 'Comissão'})}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.type === 'expense' ? 'bg-white dark:bg-gray-800 text-rose-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
                Saída / Despesa
            </button>
          </div>

          <div className="space-y-4">
            {/* DESCRIÇÃO */}
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Descrição</label>
                <input 
                    required
                    placeholder="Ex: Aluguel, Comissão, Insumos..."
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-gray-700 dark:text-gray-200 transition-all"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>

            {/* VALOR E DATA */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                        <DollarSign size={10}/> Valor (R$)
                    </label>
                    <input 
                        required
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-lg text-gray-900 dark:text-white"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data</label>
                    <input 
                        type="date"
                        required
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-700 dark:text-gray-200"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                </div>
            </div>

            {/* CATEGORIA E MÉTODO */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                        <Tag size={10}/> Categoria
                    </label>
                    <select 
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-gray-600 dark:text-gray-300 appearance-none cursor-pointer"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                        {formData.type === 'income' ? (
                            <>
                                <option value="Vendas">Vendas de Serviços</option>
                                <option value="Produtos">Venda de Produtos</option>
                                <option value="Outros">Outras Entradas</option>
                            </>
                        ) : (
                            <>
                                <option value="Comissão">Comissão Profissional</option>
                                <option value="Insumos">Materiais / Insumos</option>
                                <option value="Aluguel">Aluguel / Condomínio</option>
                                <option value="Energia/Água">Energia / Água</option>
                                <option value="Marketing">Marketing / ADS</option>
                                <option value="Pessoal">Salários / Encargos</option>
                                <option value="Outros">Outras Despesas</option>
                            </>
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Método</label>
                    <select 
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-gray-600 dark:text-gray-300 appearance-none cursor-pointer"
                        value={formData.payment_method}
                        onChange={e => setFormData({...formData, payment_method: e.target.value})}
                    >
                        <option value="pix">Pix (Imediato)</option>
                        <option value="credit_card">Cartão de Crédito</option>
                        <option value="debit_card">Cartão de Débito</option>
                        <option value="cash">Dinheiro Espécie</option>
                        <option value="transfer">Transferência</option>
                    </select>
                </div>
            </div>
          </div>

          {/* BOTÃO SUBMIT */}
          <button 
            disabled={loading}
            type="submit" 
            className="w-full py-5 bg-gray-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 mt-6 transition-all shadow-xl shadow-gray-200 dark:shadow-none"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : <><Check size={18}/> Confirmar Lançamento</>}
          </button>

        </form>
      </div>
    </div>
  );
}