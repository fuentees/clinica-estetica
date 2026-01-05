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
  FileText,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { Button } from "../../components/ui/button";

// Tipagem do Tratamento (Integral)
interface Treatment {
  id: string;
  data_procedimento: string;
  tipo_procedimento: string;
  descricao: string;
  produtos_usados: string;
  proxima_sessao: string;
  created_at: string;
}

// Helper para cores das tags baseadas no texto (Integral)
const getProcedureColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("botox") || t.includes("toxina")) return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400";
    if (t.includes("preenchimento") || t.includes("bioestimulador")) return "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400";
    if (t.includes("laser") || t.includes("lavieen")) return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
    if (t.includes("peeling") || t.includes("limpeza")) return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
    return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400"; 
};

export function PatientEvolutionPage() {
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form States (Todos os seus campos originais)
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

  const filteredTreatments = treatments.filter(t => 
    t.tipo_procedimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950">
      <Loader2 className="animate-spin text-pink-600" size={40}/>
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Carregando Timeline...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <Toaster position="top-right" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* --- ESQUERDA: FORMULÁRIO (4/12) --- */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl shadow-pink-100/20 dark:shadow-none border border-gray-100 dark:border-gray-700 sticky top-24">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-900 dark:text-white uppercase tracking-tighter italic">
              <PlusCircle size={24} className="text-pink-600" /> Registrar Visita
            </h2>
            
            <form onSubmit={handleAddTreatment} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Data do Atendimento</label>
                <input 
                  type="date" 
                  value={newDate} 
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Procedimento Realizado</label>
                <div className="relative">
                  <Syringe className="absolute top-1/2 -translate-y-1/2 left-4 text-pink-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ex: Toxina Botulínica..." 
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Evolução / Notas Clínicas</label>
                <textarea 
                  rows={6}
                  placeholder="Descreva a técnica, profundidade, reações imediatas..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Rastreabilidade (Lote/Validade)</label>
                <input 
                  type="text" 
                  placeholder="Marca e Lote dos insumos..." 
                  value={newProducts}
                  onChange={e => setNewProducts(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Agendamento de Retorno</label>
                <div className="relative">
                  <Clock className="absolute top-1/2 -translate-y-1/2 left-4 text-orange-400" size={18} />
                  <input 
                    type="date" 
                    value={nextSession}
                    onChange={e => setNextSession(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSaving}
                className="w-full h-14 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} className="mr-2 text-pink-500" />}
                Salvar Evolução
              </Button>
            </form>
          </div>
        </div>

        {/* --- DIREITA: HISTÓRICO (8/12) --- */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header do Histórico */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm gap-4">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic uppercase tracking-tighter">
                <History className="text-pink-600" /> Linha do Tempo Clínica
              </h2>
              <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                          type="text" 
                          placeholder="Pesquisar histórico..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                      />
                  </div>
                  <Button variant="outline" className="h-12 w-12 rounded-xl border-gray-200" title="Imprimir Relatório">
                      <Printer size={20} className="text-gray-600 dark:text-gray-400" />
                  </Button>
              </div>
          </div>

          {filteredTreatments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 py-32 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 text-gray-200">
                <FileText size={40} />
              </div>
              <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Nenhum registro clínico nesta busca.</p>
            </div>
          ) : (
            <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-pink-200 before:to-transparent dark:before:via-pink-900/30">
              
              {filteredTreatments.map((item) => (
                <div key={item.id} className="relative group animate-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Indicador da Timeline */}
                  <div className="absolute top-8 left-5 -translate-x-1/2 flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-900 border-[6px] border-pink-50 dark:border-pink-900 shadow-sm rounded-2xl z-10 group-hover:scale-110 transition-transform">
                      <div className="w-2 h-2 bg-pink-500 rounded-full" />
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-pink-100 transition-all duration-500 ml-16">
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                      <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} className="text-pink-500"/> 
                                {new Date(item.data_procedimento).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                                  {item.tipo_procedimento}
                              </h3>
                              <span className={`text-[9px] px-3 py-1 rounded-lg border-2 font-black uppercase tracking-widest ${getProcedureColor(item.tipo_procedimento)}`}>
                                  {item.tipo_procedimento.split(' ')[0]}
                              </span>
                          </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-3 bg-gray-50 dark:bg-gray-900 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-inner"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 text-gray-400"><FileText size={80}/></div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line relative z-10">
                          {item.descricao || "Descrição técnica não informada."}
                        </p>
                      </div>
                      
                      {(item.produtos_usados || item.proxima_sessao) && (
                          <div className="flex flex-wrap gap-4 pt-2">
                              {item.produtos_usados && (
                                  <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                      <Syringe size={16} className="text-blue-500" />
                                      <div>
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Insumos</p>
                                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300">{item.produtos_usados}</p>
                                      </div>
                                  </div>
                              )}
                              {item.proxima_sessao && (
                                  <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 px-4 py-2.5 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                      <Clock size={16} className="text-orange-500" />
                                      <div>
                                        <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Retorno</p>
                                        <p className="text-xs font-bold text-orange-800 dark:text-orange-300">
                                          {new Date(item.proxima_sessao).toLocaleDateString('pt-BR')}
                                        </p>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                    </div>

                    {/* Rodapé Interno do Card */}
                    <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                       <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Registrado em {new Date(item.created_at).toLocaleDateString()}</p>
                       <div className="flex items-center gap-1 text-[9px] font-black text-pink-500 uppercase">Ver detalhes <ChevronRight size={10}/></div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}