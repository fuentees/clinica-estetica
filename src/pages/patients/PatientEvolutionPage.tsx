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
  Printer,
  FileText
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

// Helper para cores das tags baseadas no texto
const getProcedureColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("botox") || t.includes("toxina")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (t.includes("preenchimento") || t.includes("bioestimulador")) return "bg-pink-100 text-pink-700 border-pink-200";
    if (t.includes("laser") || t.includes("lavieen")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (t.includes("peeling") || t.includes("limpeza")) return "bg-green-100 text-green-700 border-green-200";
    return "bg-gray-100 text-gray-700 border-gray-200"; // Padrão
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
        .order("data_procedimento", { ascending: false }); // Mais recentes primeiro

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
    <div className="min-h-screen grid md:grid-cols-12 gap-8">
      <Toaster position="top-right" />

      {/* --- ESQUERDA: FORMULÁRIO DE NOVA EVOLUÇÃO (1/3 da tela) --- */}
      <div className="md:col-span-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white border-b pb-4 dark:border-gray-700">
            <PlusCircle size={20} className="text-pink-600" /> Nova Evolução
          </h2>
          
          <form onSubmit={handleAddTreatment} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Data do Procedimento</label>
              <input 
                type="date" 
                value={newDate} 
                onChange={e => setNewDate(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Procedimento</label>
              <div className="relative">
                <Syringe className="absolute top-3 left-3 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Ex: Botox, Preenchimento..." 
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full pl-10 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Descrição Técnica / Evolução</label>
              <textarea 
                rows={5}
                placeholder="Descreva a aplicação, regiões, feedback do paciente..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-all resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Produtos / Lotes (Rastreabilidade)</label>
              <input 
                type="text" 
                placeholder="Ex: Dysport Lote 1234..." 
                value={newProducts}
                onChange={e => setNewProducts(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Retorno Sugerido</label>
              <div className="relative">
                <Clock className="absolute top-3 left-3 text-gray-400" size={16} />
                <input 
                  type="date" 
                  value={nextSession}
                  onChange={e => setNextSession(e.target.value)}
                  className="w-full pl-10 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-pink-200 dark:shadow-none transition-all mt-2"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
              Registrar Evolução
            </Button>
          </form>
        </div>
      </div>

      {/* --- DIREITA: LINHA DO TEMPO (2/3 da tela) --- */}
      <div className="md:col-span-8">
        
        {/* Barra de Ferramentas do Histórico */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <History className="text-pink-600" /> Histórico Clínico
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar procedimento..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                </div>
                {/* Botão de Imprimir corrigido (sem size='icon') */}
                <Button variant="outline" className="p-2" title="Imprimir Histórico">
                    <Printer size={18} className="text-gray-600" />
                </Button>
            </div>
        </div>

        {filteredTreatments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">Nenhum registro encontrado.</p>
            <p className="text-sm text-gray-400 mt-1">O histórico do paciente aparecerá aqui.</p>
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:inset-0 before:ml-4 sm:before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent dark:before:via-gray-700">
            
            {filteredTreatments.map((item) => (
              <div key={item.id} className="relative group">
                
                {/* O Ponto da Linha do Tempo */}
                <div className="absolute top-6 -left-4 sm:-left-8 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-white dark:bg-gray-900 border-4 border-pink-100 dark:border-pink-900 rounded-full">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-pink-500 rounded-full" />
                </div>

                {/* O Card do Conteúdo */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow ml-4 sm:ml-6">
                  
                  {/* Cabeçalho do Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                            <Calendar size={12}/> {new Date(item.data_procedimento).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-3 mt-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {item.tipo_procedimento}
                            </h3>
                            {/* Tag Colorida */}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${getProcedureColor(item.tipo_procedimento)}`}>
                                {item.tipo_procedimento.split(' ')[0]}
                            </span>
                        </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="self-end sm:self-start text-gray-300 hover:text-red-500 transition-colors p-1"
                      title="Excluir este registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Corpo do Card */}
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                      {item.descricao || "Sem observações detalhadas."}
                    </p>
                    
                    {(item.produtos_usados || item.proxima_sessao) && (
                        <div className="flex flex-wrap gap-4 pt-2">
                            {item.produtos_usados && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <Syringe size={14} className="text-blue-500" />
                                    <span className="font-semibold">Produtos:</span> {item.produtos_usados}
                                </div>
                            )}
                            {item.proxima_sessao && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <Clock size={14} className="text-orange-500" />
                                    <span className="font-semibold">Retorno:</span> {new Date(item.proxima_sessao).toLocaleDateString('pt-BR')}
                                </div>
                            )}
                        </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}