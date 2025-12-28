import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import { 
  Calendar, 
  PlusCircle, 
  Clock, 
  Syringe, 
  Save, 
  Trash2, 
  History,
  Loader2,
  Search,
  FileText // Usado no estado vazio
} from "lucide-react";
import { Button } from "../../components/ui/button";

// Tipagem do Tratamento
interface Treatment {
  id: string;
  data_procedimento: string;
  tipo_procedimento: string;
  descricao: string;
  produtos_usados: string;
  proxima_sessao: string;
  created_at: string;
}

// Helper para cores das tags
const getProcedureColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("botox") || t.includes("toxina")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (t.includes("preenchimento") || t.includes("bioestimulador")) return "bg-pink-100 text-pink-700 border-pink-200";
    if (t.includes("laser") || t.includes("lavieen")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (t.includes("peeling") || t.includes("limpeza")) return "bg-green-100 text-green-700 border-green-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
};

export function PatientEvolutionPage() {
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form States
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newProducts, setNewProducts] = useState("");
  const [nextSession, setNextSession] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const { data: hist, error } = await supabase
        .from("treatments")
        .select("*")
        .eq("patient_id", id)
        .order("data_procedimento", { ascending: false });

      if (error) throw error;
      setTreatments(hist || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType) return toast.error("Informe o tipo de procedimento.");

    setIsSaving(true);
    try {
      const { error } = await supabase.from("treatments").insert({
        patient_id: id,
        data_procedimento: newDate,
        tipo_procedimento: newType,
        descricao: newDesc,
        produtos_usados: newProducts,
        proxima_sessao: nextSession || null
      });

      if (error) throw error;

      toast.success("Evolução registrada!");
      setNewType(""); setNewDesc(""); setNewProducts(""); setNextSession("");
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (treatmentId: string) => {
    if (!confirm("Tem certeza que deseja apagar este registro?")) return;
    try {
      await supabase.from("treatments").delete().eq("id", treatmentId);
      toast.success("Registro apagado.");
      setTreatments(treatments.filter(t => t.id !== treatmentId));
    } catch (error) {
      toast.error("Erro ao apagar.");
    }
  };

  // Filtragem local
  const filteredTreatments = treatments.filter(t => 
    t.tipo_procedimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="min-h-screen grid md:grid-cols-12 gap-8 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
      <Toaster position="top-right" />

      {/* --- ESQUERDA: FORMULÁRIO (1/3) --- */}
      <div className="md:col-span-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white border-b pb-4 dark:border-gray-700">
            <PlusCircle size={20} className="text-pink-600" /> Nova Evolução
          </h2>
          
          <form onSubmit={handleAddTreatment} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Data</label>
              <input 
                type="date" 
                value={newDate} 
                onChange={e => setNewDate(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Procedimento</label>
              <div className="relative">
                <Syringe className="absolute top-3 left-3 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Ex: Botox..." 
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full pl-10 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Descrição</label>
              <textarea 
                rows={5}
                placeholder="Relato técnico..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Produtos / Lotes</label>
              <input 
                type="text" 
                placeholder="Ex: Lote 1234" 
                value={newProducts}
                onChange={e => setNewProducts(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Retorno</label>
              <div className="relative">
                <Clock className="absolute top-3 left-3 text-gray-400" size={16} />
                <input 
                  type="date" 
                  value={nextSession}
                  onChange={e => setNextSession(e.target.value)}
                  className="w-full pl-10 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg shadow-sm mt-2"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
              Salvar
            </Button>
          </form>
        </div>
      </div>

      {/* --- DIREITA: HISTÓRICO (2/3) --- */}
      <div className="md:col-span-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <History className="text-pink-600" /> Histórico
            </h2>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
            </div>
        </div>

        {filteredTreatments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTreatments.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group">
                  
                  {/* Botão Excluir (Hover) */}
                  <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} />
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                            <Calendar size={12}/> {new Date(item.data_procedimento).toLocaleDateString('pt-BR')}
                        </span>
                        <div className="flex items-center gap-3 mt-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {item.tipo_procedimento}
                            </h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${getProcedureColor(item.tipo_procedimento)}`}>
                                {item.tipo_procedimento.split(' ')[0]}
                            </span>
                        </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                      {item.descricao || "Sem observações."}
                  </p>

                  <div className="flex flex-wrap gap-3">
                      {item.produtos_usados && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              <Syringe size={12}/> {item.produtos_usados}
                          </span>
                      )}
                      {item.proxima_sessao && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                              <Clock size={12}/> Retorno: {new Date(item.proxima_sessao).toLocaleDateString('pt-BR')}
                          </span>
                      )}
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}