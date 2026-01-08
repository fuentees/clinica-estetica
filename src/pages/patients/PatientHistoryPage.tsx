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
  FileText,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import { Button } from "../../components/ui/button";

// Tipagem atualizada para bater com o Schema (EvolutionRecord)
interface Treatment {
  id: string;
  date: string;          
  subject: string;       
  description: string;   
  attachments: {
    products?: string;
    nextSession?: string;
  };
  created_at: string;
}

const getProcedureColor = (type: string) => {
    const t = (type || "").toLowerCase();
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
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [profId, setProfId] = useState<string | null>(null);
  
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
      setLoading(true);
      
      // Busca dados do usuário logado para segurança
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('id, clinicId').eq('id', user.id).single();
        if (profile) {
          setClinicId(profile.clinic_id);
          setProfId(profile.id);
        }
      }

      // Busca na tabela evolution_records conforme o Schema
      const { data: hist, error } = await supabase
        .from("evolution_records")
        .select("*")
        .eq("patient_id", id)
        .order("date", { ascending: false });

      if (error) throw error;

      const formatted = (hist || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        subject: item.subject,
        description: item.description,
        attachments: item.attachments || {},
        created_at: item.created_at || item.createdAt
      }));

      setTreatments(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType) return toast.error("Informe o tipo de procedimento.");
    if (!clinicId || !profId) return toast.error("Sua sessão expirou. Recarregue a página.");

    setIsSaving(true);
    try {
      const { error } = await supabase.from("evolution_records").insert({
        clinic_id: clinicId,
        patient_id: id,
        professional_id: profId,
        date: new Date(newDate).toISOString(),
        subject: newType,
        description: newDesc,
        attachments: {
          products: newProducts,
          nextSession: nextSession
        }
      });

      if (error) throw error;

      toast.success("Evolução registrada!");
      setNewType(""); setNewDesc(""); setNewProducts(""); setNextSession("");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (treatmentId: string) => {
    if (!confirm("Tem certeza que deseja apagar este registro?")) return;
    try {
      await supabase.from("evolution_records").delete().eq("id", treatmentId);
      toast.success("Registro apagado.");
      setTreatments(treatments.filter(t => t.id !== treatmentId));
    } catch (error) {
      toast.error("Erro ao apagar.");
    }
  };

  const filteredTreatments = treatments.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-gray-900/50 rounded-3xl">
      <Loader2 className="animate-spin text-pink-600" size={40} />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sincronizando Histórico...</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-700">
      <Toaster position="top-right" />

      {/* --- ESQUERDA: FORMULÁRIO --- */}
      <div className="lg:col-span-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl shadow-pink-100/20 dark:shadow-none border border-gray-100 dark:border-gray-700 sticky top-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-pink-50 dark:bg-pink-900/30 text-pink-600 rounded-2xl">
              <PlusCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Evolução</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Anotações da Sessão</p>
            </div>
          </div>
          
          <form onSubmit={handleAddTreatment} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data do Atendimento</label>
              <input 
                type="date" 
                value={newDate} 
                onChange={e => setNewDate(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Procedimento</label>
              <div className="relative">
                <Syringe className="absolute top-1/2 -translate-y-1/2 left-4 text-pink-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Ex: Botox, Peeling..." 
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Relato Técnico / Evolução</label>
              <textarea 
                rows={5}
                placeholder="Descreva a aplicação, parâmetros, reações..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Insumos (Marca/Lote)</label>
              <input 
                type="text" 
                placeholder="Rastreabilidade dos produtos..." 
                value={newProducts}
                onChange={e => setNewProducts(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Previsão de Retorno</label>
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
              Registrar Visita
            </Button>
          </form>
        </div>
      </div>

      {/* --- DIREITA: HISTÓRICO --- */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm gap-4">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic uppercase tracking-tighter">
              <History className="text-pink-600" /> Linha do Tempo
            </h2>
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Filtrar histórico..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                />
            </div>
        </div>

        {filteredTreatments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 py-32 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 text-gray-200">
              <ClipboardList size={40} />
            </div>
            <p className="text-gray-500 font-black uppercase text-xs tracking-widest italic">Aguardando primeiro registro...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTreatments.map((item) => (
              <div key={item.id} className="group relative animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-pink-100 transition-all duration-500 relative">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <Calendar size={12} className="text-pink-500"/> 
                            {new Date(item.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                                {item.subject}
                            </h3>
                            <span className={`text-[9px] px-3 py-1 rounded-lg border font-black uppercase tracking-widest ${getProcedureColor(item.subject)}`}>
                                {item.subject.split(' ')[0]}
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

                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 text-gray-400"><FileText size={80}/></div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line relative z-10">
                        {item.description || "Nenhuma nota clínica registrada para esta sessão."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                        {item.attachments?.products && (
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <Syringe size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-tighter italic">Rastreabilidade: {item.attachments.products}</span>
                            </div>
                        )}
                        {item.attachments?.nextSession && (
                            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2.5 rounded-full border border-orange-100 dark:border-orange-900/30">
                                <Clock size={14} className="text-orange-500" />
                                <span className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-tighter">
                                  Próxima Sessão: {new Date(item.attachments.nextSession).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        )}
                    </div>
                  </div>
                  
                  <div className="absolute right-8 bottom-8 text-gray-50 dark:text-gray-900 pointer-events-none group-hover:text-pink-100/30 transition-colors">
                     <ChevronRight size={64} />
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