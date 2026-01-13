import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { X, Check, Loader2, Tag, DollarSign, Scissors } from "lucide-react";
import { toast } from "react-hot-toast";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

export function NewTransactionModal({ isOpen, onClose, onSuccess }: NewTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense", 
    category: "Comissão",
    payment_method: "pix",
    date: new Date().toISOString().split('T')[0],
    service_id: "" 
  });

  // Carrega serviços apenas se for Entrada (Receita)
  useEffect(() => {
    if (isOpen && formData.type === 'income') {
      loadServices();
    }
  }, [isOpen, formData.type]);

  async function loadServices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single();
      
      const { data } = await supabase
        .from('services')
        .select('id, name, price')
        .eq('clinic_id', profile?.clinic_id)
        .order('name');
      
      if (data) setServices(data);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single();

      if (!profile?.clinic_id) throw new Error("Clínica não identificada");

      const isoDate = new Date(formData.date).toISOString();

      // ✅ LOGICA DE DESCRIÇÃO LIMPA: Prioriza o nome do serviço
      const selectedService = services.find(s => s.id === formData.service_id);
      
      // Se tiver serviço, a descrição principal vira o NOME DO SERVIÇO
      // O que o usuário digitou vira um complemento (opcional)
      const finalDescription = selectedService 
        ? (formData.description ? `${selectedService.name} - ${formData.description}` : selectedService.name)
        : formData.description;

      const { error } = await supabase.from('transactions').insert({
        clinic_id: profile.clinic_id,
        description: finalDescription, // Ex: "Limpeza de Pele - Paciente Maria"
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category,
        payment_method: formData.payment_method,
        service_id: formData.service_id || null, // Vínculo oficial para o ranking
        status: 'paid',
        created_at: isoDate,
        paid_at: isoDate,
        due_date: isoDate,
      });

      if (error) throw error;

      toast.success("Lançamento registrado com sucesso!");
      onSuccess();
      onClose();
      
      // Reset total do form
      setFormData({
        description: "",
        amount: "",
        type: "expense",
        category: "Comissão",
        payment_method: "pix",
        date: new Date().toISOString().split('T')[0],
        service_id: ""
      });

    } catch (error: any) {
      toast.error("Erro ao salvar: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans text-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        
        <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-black uppercase italic tracking-tighter text-lg">Novo Lançamento</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Financeiro Vilagi</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-colors text-gray-400"><X size={22}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="flex p-1 bg-gray-100 rounded-2xl gap-1">
            <button type="button" onClick={() => setFormData({...formData, type: 'income', category: 'Vendas'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>Entrada / Receita</button>
            <button type="button" onClick={() => setFormData({...formData, type: 'expense', category: 'Comissão'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-400'}`}>Saída / Despesa</button>
          </div>

          <div className="space-y-4">
            {formData.type === 'income' && (
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1"><Scissors size={10}/> Procedimento</label>
                <select 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
                    value={formData.service_id}
                    onChange={e => {
                        const s = services.find(serv => serv.id === e.target.value);
                        setFormData({
                          ...formData, 
                          service_id: e.target.value, 
                          amount: s ? s.price.toString() : formData.amount
                        });
                    }}
                >
                    <option value="">-- Selecione o Serviço --</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Observação / Descrição</label>
                <input 
                    placeholder={formData.type === 'income' ? "Ex: Nome da Paciente..." : "Ex: Aluguel, Luz, Insumos..."}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1"><DollarSign size={10}/> Valor (R$)</label>
                    <input required type="number" step="0.01" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-lg" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data</label>
                    <input type="date" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1"><Tag size={10}/> Categoria</label>
                    <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {formData.type === 'income' ? (
                            <><option value="Vendas">Vendas de Serviços</option><option value="Produtos">Produtos</option></>
                        ) : (
                            <><option value="Comissão">Comissão</option><option value="Insumos">Materiais</option><option value="Aluguel">Aluguel</option></>
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Método</label>
                    <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold" value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                        <option value="pix">Pix</option><option value="credit_card">Cartão Crédito</option><option value="cash">Dinheiro</option>
                    </select>
                </div>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 mt-6 transition-all shadow-xl active:scale-95">
            {loading ? <Loader2 className="animate-spin" size={18}/> : <><Check size={18}/> Confirmar Lançamento</>}
          </button>
        </form>
      </div>
    </div>
  );
}