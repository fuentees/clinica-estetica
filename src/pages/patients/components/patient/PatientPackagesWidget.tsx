import { useEffect, useState } from "react";
// Ajuste os caminhos de importação conforme sua estrutura de pastas
import { supabase } from "../../../../lib/supabase"; 
import { Package, Minus, Archive, Hash } from "lucide-react"; // Importei Hash para ícone de número
import { toast } from "react-hot-toast";
import { Button } from "../../../../components/ui/button"; 

export function PatientPackagesWidget({ patientId }: { patientId: string }) {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newTitle, setNewTitle] = useState("");
  const [newTotal, setNewTotal] = useState<string>("10"); // Mudei para string para facilitar digitação

  useEffect(() => {
    fetchPackages();
  }, [patientId]);

  async function fetchPackages() {
    try {
      const { data } = await supabase
        .from("patient_packages")
        .select("*")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      
      setPackages(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddPackage = async () => {
      if (!newTitle) return toast.error("Digite o nome do pacote");
      if (!newTotal || Number(newTotal) <= 0) return toast.error("Digite a quantidade de sessões");
      
      try {
          const { error } = await supabase.from("patient_packages").insert({
              patient_id: patientId,
              title: newTitle,
              total_sessions: Number(newTotal),
              used_sessions: 0
          });
          if (error) throw error;
          
          toast.success("Pacote criado!");
          setNewTitle("");
          setNewTotal("10");
          setShowAddForm(false);
          fetchPackages();
      } catch (e) {
          toast.error("Erro ao criar.");
      }
  };

  const updateSession = async (pkg: any, increment: number) => {
      const newValue = pkg.used_sessions + increment;
      if (newValue < 0 || newValue > pkg.total_sessions) return;

      try {
          await supabase.from("patient_packages").update({
              used_sessions: newValue
          }).eq("id", pkg.id);

          if (newValue === pkg.total_sessions) {
              toast.success("Pacote Concluído! 🎉");
          }

          setPackages(packages.map(p => p.id === pkg.id ? { ...p, used_sessions: newValue } : p));
      } catch (e) {
          toast.error("Erro ao atualizar.");
      }
  };

  const handleArchive = async (id: string) => {
      if(!confirm("Arquivar este pacote como concluído?")) return;
      await supabase.from("patient_packages").update({ status: 'completed' }).eq("id", id);
      fetchPackages();
      toast.success("Arquivado.");
  }

  if (loading) return <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Package className="text-pink-600" size={20}/> Pacotes Ativos
            </h3>
            <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs font-bold text-pink-600 hover:bg-pink-50 px-3 py-1.5 rounded transition-colors border border-pink-100 dark:border-pink-900"
            >
                {showAddForm ? "Cancelar" : "+ Novo Pacote"}
            </button>
        </div>

        {/* --- FORMULÁRIO DE NOVO PACOTE (MELHORADO) --- */}
        {showAddForm && (
            <div className="bg-pink-50/50 dark:bg-pink-900/10 p-4 rounded-xl mb-6 border border-pink-100 dark:border-pink-900/30 animate-in slide-in-from-top-2">
                <p className="text-xs font-bold text-pink-600 uppercase mb-3">Cadastrar Novo Pacote</p>
                
                <div className="space-y-3">
                    {/* Campo Nome */}
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Nome do Procedimento</label>
                        <input 
                            className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none" 
                            placeholder="Ex: Drenagem Linfática"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3">
                        {/* Campo Quantidade (Agora bem visível) */}
                        <div className="w-1/3">
                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block flex items-center gap-1">
                                <Hash size={10}/> Qtd. Sessões
                            </label>
                            <input 
                                type="number" 
                                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none text-center font-bold" 
                                value={newTotal}
                                onChange={e => setNewTotal(e.target.value)}
                                min="1"
                            />
                        </div>
                        
                        {/* Botão Salvar */}
                        <div className="flex-1 flex items-end">
                            <Button onClick={handleAddPackage} size="sm" className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold">
                                Salvar Pacote
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* LISTA DE PACOTES */}
        <div className="space-y-4">
            {packages.length === 0 && !showAddForm ? (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <Package size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400 italic">Nenhum pacote ativo.</p>
                    <p className="text-xs text-gray-400">Clique em "+ Novo Pacote" para começar.</p>
                </div>
            ) : (
                packages.map(pkg => {
                    const progress = (pkg.used_sessions / pkg.total_sessions) * 100;
                    const isComplete = pkg.used_sessions >= pkg.total_sessions;

                    return (
                        <div key={pkg.id} className="group border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all bg-white dark:bg-gray-800">
                            
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-gray-800 dark:text-white">{pkg.title}</span>
                                {isComplete && (
                                    <button onClick={() => handleArchive(pkg.id)} className="text-gray-300 hover:text-green-500 p-1" title="Arquivar (Concluído)">
                                        <Archive size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Info de Progresso */}
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progresso</span>
                                <span className="font-bold">{pkg.used_sessions} de {pkg.total_sessions}</span>
                            </div>

                            {/* BARRA DE PROGRESSO */}
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4 border border-gray-50 dark:border-gray-600">
                                <div 
                                    className={`h-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-pink-500 to-rose-500'}`} 
                                    style={{ width: `${progress}%` }} 
                                />
                            </div>

                            {/* BOTÕES DE CONTROLE (+ / -) */}
                            <div className="flex justify-between gap-2">
                                <button 
                                    onClick={() => updateSession(pkg, -1)}
                                    disabled={pkg.used_sessions <= 0}
                                    className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Minus size={16} />
                                </button>
                                <button 
                                    onClick={() => updateSession(pkg, 1)}
                                    disabled={isComplete}
                                    className="flex-1 py-2 rounded-lg bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/40 text-pink-600 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-wide transition-colors"
                                >
                                    {isComplete ? "Concluído" : "Marcar Sessão (+1)"}
                                </button>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    </div>
  );
}