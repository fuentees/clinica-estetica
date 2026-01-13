import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import { 
  Calendar, 
  Plus, 
  Clock, 
  Syringe, 
  Save, 
  Trash2, 
  History,
  Loader2,
  Search,
  Printer,
  FileText,
  ChevronRight,
  Stethoscope,
  Camera,
  Package,
  X,
  Copy,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  Ban
} from "lucide-react";
import { Button } from "../../components/ui/button";

// --- CONSTANTES & TEMPLATES ---
const CLINICAL_TEMPLATES = {
    botox: "Queixa: Rugas dinâmicas em terço superior.\nPlanejamento: Aplicação de Toxina Botulínica.\nPontos: Glabela, Frontal e Orbicular dos olhos.\nDose total: __ UI.\nOrientações: Não deitar por 4h, não massagear.",
    preenchimento: "Queixa: Perda de volume em __.\nPlanejamento: Preenchimento com Ácido Hialurônico.\nPlano: Justaósseo / Subcutâneo.\nCânula: 22G.\nQuantidade: __ ml.\nReação imediata: Leve edema, sem intercorrências.",
    bioestimulador: "Objetivo: Melhora da flacidez em __.\nProduto: __ (Hidroxiapatita/PLLA).\nDiluição: __.\nVetores: Em leque.\nMassagem: Realizada no consultório e orientada 5x5x5."
};

// --- TIPAGEM ---
interface UsedProduct {
  inventoryId: string;
  name: string;
  batch: string;
  quantity: string;
}

interface Treatment {
  id: string;
  date: string;          
  subject: string;       
  description: string;   
  attachments: {
      usedProducts?: UsedProduct[];
      photos?: string[];
      nextSession?: string;
  };
  created_at: string;
  deleted_at?: string | null; // 🔴 NOVO: Soft Delete Check
  profiles?: { 
      first_name: string;
      last_name: string;
      role: string;
  };
}

interface Service { id: string; name: string; }
interface InventoryItem { id: string; name: string; }

// --- HELPER DE CORES ---
const getProcedureColor = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("botox") || t.includes("toxina")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (t.includes("preenchimento") || t.includes("bio")) return "bg-pink-100 text-pink-700 border-pink-200";
    if (t.includes("laser") || t.includes("lavieen")) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-600 border-gray-200"; 
};

export function PatientEvolutionPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState({ totalVisits: 0, lastVisit: 'Nunca' });
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form States
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState(""); 
  const [newDesc, setNewDesc] = useState("");
  const [nextSession, setNextSession] = useState("");
  const [tempProduct, setTempProduct] = useState(""); 
  const [tempBatch, setTempBatch] = useState("");     
  const [usedProductsList, setUsedProductsList] = useState<UsedProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let currentClinicId = null;

      if (user) {
          const { data: profile } = await supabase.from('profiles').select('id, clinic_id').eq('id', user.id).single();
          if (profile) {
              setClinicId(profile.clinic_id);
              setProfessionalId(profile.id);
              currentClinicId = profile.clinic_id;
          }
      }

      if (currentClinicId) {
          const [services, inventory] = await Promise.all([
              supabase.from('services').select('id, name').eq('clinic_id', currentClinicId).order('name'),
              supabase.from('inventory').select('id, name').eq('clinic_id', currentClinicId).gt('quantity', 0).order('name')
          ]);
          
          if (services.data) setServicesList(services.data);
          if (inventory.data) setInventoryList(inventory.data);

          const { data: hist, error } = await supabase
            .from("evolution_records") 
            .select(`
                *,
                profiles:professional_id (first_name, last_name, role)
            `)
            .eq("patient_id", id)
            .order("date", { ascending: false });

          if (error) throw error;
          
          // Mapeamento mantendo o campo deleted_at
          const formatted = (hist || []).map((item: any) => ({
              id: item.id,
              date: item.date,
              subject: item.subject,
              description: item.description,
              attachments: item.attachments || {},
              created_at: item.created_at,
              deleted_at: item.deleted_at, // 🔴 Importante
              profiles: item.profiles
          }));

          setTreatments(formatted);
          
          // Filtra apenas ativos para estatísticas
          const activeRecords = formatted.filter((t: any) => !t.deleted_at);
          if (activeRecords.length > 0) {
              setStats({
                  totalVisits: activeRecords.length,
                  lastVisit: new Date(activeRecords[0].date).toLocaleDateString('pt-BR')
              });
          }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÕES AUXILIARES ---
  const applyTemplate = (templateKey: keyof typeof CLINICAL_TEMPLATES) => {
      setNewDesc(CLINICAL_TEMPLATES[templateKey]);
      toast.success("Template aplicado!");
  };

  const copyLastEvolution = () => {
      // Pega apenas o último ATIVO
      const activeTreatments = treatments.filter(t => !t.deleted_at);
      if (activeTreatments.length === 0) return toast.error("Sem histórico válido para copiar.");
      
      const last = activeTreatments[0];
      setNewType(last.subject);
      setNewDesc(last.description);
      toast.success("Dados copiados!");
  };

  const handleAddProduct = () => {
      if (!tempProduct) return toast.error("Selecione um produto.");
      if (!tempBatch) return toast.error("Informe o lote.");

      const productInfo = inventoryList.find(i => i.id === tempProduct);
      const newItem: UsedProduct = {
          inventoryId: tempProduct,
          name: productInfo?.name || "Desconhecido",
          batch: tempBatch,
          quantity: "1"
      };

      setUsedProductsList([...usedProductsList, newItem]);
      setTempProduct("");
      setTempBatch("");
  };

  const handleRemoveProduct = (idx: number) => {
      const newList = [...usedProductsList];
      newList.splice(idx, 1);
      setUsedProductsList(newList);
  };

  const handleSaveEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType) return toast.error("Selecione o procedimento.");
    if (!clinicId || !professionalId) return toast.error("Erro de identificação.");

    setIsSaving(true);
    try {
      const { error } = await supabase.from("evolution_records").insert({
        clinic_id: clinicId,
        patient_id: id,
        professional_id: professionalId,
        date: new Date(newDate).toISOString(),
        subject: newType,
        description: newDesc,
        attachments: {
            usedProducts: usedProductsList,
            nextSession: nextSession,
            photos: [] 
        }
      });

      if (error) throw error;

      toast.success("Prontuário atualizado!");
      setNewType(""); setNewDesc(""); setUsedProductsList([]); setNextSession("");
      fetchData();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 🔴 SOFT DELETE: Agora INVALIDA o registro em vez de apagar
  const handleInvalidateRecord = async (treatmentId: string) => {
    if (!confirm("ATENÇÃO: Deseja invalidar este registro clínico? Esta ação ficará gravada no histórico.")) return;
    try {
      // Ao invés de .delete(), fazemos .update()
      const { error } = await supabase
        .from("evolution_records")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", treatmentId);

      if (error) throw error;

      toast.success("Registro invalidado.");
      fetchData(); // Recarrega para mostrar o estado atualizado
    } catch (error) {
      toast.error("Erro ao invalidar.");
    }
  };

  const filteredTreatments = treatments.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10"/></div>;

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <Toaster position="top-right" />

      {/* HEADER INTELIGENTE */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-[2rem] shadow-xl flex justify-between items-center">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                  <TrendingUp size={24} className="text-pink-400"/>
              </div>
              <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Resumo Clínico</h2>
                  <div className="flex gap-6 mt-1">
                      <p className="text-lg font-bold">Total Visitas: <span className="text-pink-400">{stats.totalVisits}</span></p>
                      <p className="text-lg font-bold">Último Atendimento: <span className="text-emerald-400">{stats.lastVisit}</span></p>
                  </div>
              </div>
          </div>
          <Button onClick={copyLastEvolution} variant="outline" className="border-white/20 text-black hover:bg-white/10 hover:text-white gap-2">
              <Copy size={16}/> Repetir Última Evolução
          </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === ESQUERDA: FORMULÁRIO === */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl shadow-pink-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700 sticky top-24">
            
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                    <Stethoscope size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Nova Evolução</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Registro Técnico</p>
                </div>
            </div>
            
            <form onSubmit={handleSaveEvolution} className="space-y-5">
              
              {/* DATA & PROCEDIMENTO */}
              <div className="space-y-4">
                <input 
                  type="date" 
                  value={newDate} 
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-pink-500"
                />
                <div className="relative">
                    <select 
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                        className="w-full h-12 pl-4 pr-10 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-pink-500 appearance-none cursor-pointer"
                    >
                        <option value="">Selecione o Procedimento...</option>
                        {servicesList.map(s => <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>)}
                    </select>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none"/>
                </div>
              </div>

              {/* TEMPLATES RÁPIDOS */}
              <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Templates Rápidos</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      <button type="button" onClick={() => applyTemplate('botox')} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-black uppercase hover:bg-purple-100 transition-colors whitespace-nowrap border border-purple-100">Botox</button>
                      <button type="button" onClick={() => applyTemplate('preenchimento')} className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-lg text-[10px] font-black uppercase hover:bg-pink-100 transition-colors whitespace-nowrap border border-pink-100">Preenchimento</button>
                      <button type="button" onClick={() => applyTemplate('bioestimulador')} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-colors whitespace-nowrap border border-blue-100">Bioestimulador</button>
                  </div>
              </div>

              {/* DESCRIÇÃO */}
              <textarea 
                rows={6}
                placeholder="Descreva a técnica, profundidade, reação imediata..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              />

              {/* --- RASTREABILIDADE --- */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                  <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                      <Package size={12}/> Rastreabilidade / Lotes
                  </label>
                  
                  <div className="flex flex-col gap-3 mb-3">
                      <select 
                          value={tempProduct}
                          onChange={e => setTempProduct(e.target.value)}
                          className="w-full h-10 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold outline-none"
                      >
                          <option value="">Selecione o Produto...</option>
                          {inventoryList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              placeholder="Lote / Validade" 
                              value={tempBatch}
                              onChange={e => setTempBatch(e.target.value)}
                              className="flex-1 h-10 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none"
                          />
                          <Button type="button" onClick={handleAddProduct} size="sm" className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                              <Plus size={16}/>
                          </Button>
                      </div>
                  </div>

                  {usedProductsList.length > 0 && (
                      <div className="space-y-2 mt-2">
                          {usedProductsList.map((prod, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 shadow-sm">
                                  <div>
                                      <p className="text-[10px] font-black uppercase text-gray-700">{prod.name}</p>
                                      <p className="text-[9px] text-gray-400 font-medium">Lote: <span className="text-blue-500">{prod.batch}</span></p>
                                  </div>
                                  <button type="button" onClick={() => handleRemoveProduct(idx)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* FOTOS */}
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-pink-300 hover:bg-pink-50/50 transition-all cursor-pointer group">
                  <Camera size={20} className="mb-1 group-hover:text-pink-500"/>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-center">Anexar Fotos</span>
              </div>

              {/* RETORNO */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Sugestão de Retorno</label>
                <div className="relative">
                    <Clock className="absolute top-1/2 -translate-y-1/2 left-4 text-orange-400" size={16} />
                    <input 
                    type="date" 
                    value={nextSession}
                    onChange={e => setNextSession(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSaving}
                className="w-full h-14 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-xl shadow-xl transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2 text-pink-500" />}
                Salvar Prontuário
              </Button>
            </form>
          </div>
        </div>

        {/* === DIREITA: TIMELINE PREMIUM (8/12) === */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Busca */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                      type="text" 
                      placeholder="Pesquisar no histórico..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-500"
                  />
              </div>
          </div>

          {filteredTreatments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 py-32 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700 text-center flex flex-col items-center opacity-50">
              <FileText size={48} className="mb-4 text-gray-300"/>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="relative space-y-8 pl-4">
              <div className="absolute top-0 bottom-0 left-[27px] w-0.5 bg-gradient-to-b from-pink-200 via-gray-200 to-transparent dark:from-pink-900 dark:via-gray-800"></div>

              {filteredTreatments.map((item) => {
                // SE ESTIVER DELETADO (INVALIDADO)
                if (item.deleted_at) {
                    return (
                        <div key={item.id} className="relative pl-12 opacity-50 grayscale hover:grayscale-0 transition-all">
                            <div className="absolute top-8 left-4 -translate-x-1/2 w-6 h-6 bg-red-100 border-4 border-red-200 rounded-full z-10 flex items-center justify-center">
                                <X size={12} className="text-red-500"/>
                            </div>
                            <div className="bg-gray-50 border-2 border-dashed border-red-200 p-6 rounded-[2rem]">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-gray-400 uppercase">Registro Invalidado</h3>
                                    <span className="text-[10px] font-bold text-red-400">{new Date(item.deleted_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 line-through">{item.subject}</p>
                            </div>
                        </div>
                    );
                }

                // SE ESTIVER ATIVO (NORMAL)
                return (
                <div key={item.id} className="relative group animate-in slide-in-from-bottom-4 duration-500 pl-12">
                  
                  <div className="absolute top-8 left-4 -translate-x-1/2 w-6 h-6 bg-white dark:bg-gray-900 border-4 border-pink-200 dark:border-pink-900 rounded-full z-10 shadow-sm group-hover:border-pink-500 transition-colors"></div>

                  <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-pink-100 transition-all">
                    
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar size={12}/> {new Date(item.date).toLocaleDateString('pt-BR')}
                                </span>
                                {item.profiles && (
                                    <span className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <UserCheck size={12}/> Dr(a). {item.profiles.first_name}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                {item.subject}
                                <span className={`text-[9px] px-2 py-0.5 rounded border ${getProcedureColor(item.subject)}`}>
                                    {item.subject.split(' ')[0]}
                                </span>
                            </h3>
                        </div>
                        {/* Botão de "Apagar" agora é Invalidação */}
                        <button onClick={() => handleInvalidateRecord(item.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Invalidar Registro (Jurídico)">
                            <Ban size={18}/>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                            {item.description || "Sem notas clínicas."}
                        </p>

                        {item.attachments?.usedProducts && item.attachments.usedProducts.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {item.attachments.usedProducts.map((prod, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <Syringe size={12} className="text-blue-500"/>
                                        <div>
                                            <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase block">{prod.name}</span>
                                            <span className="text-[9px] font-medium text-blue-400">Lote: {prod.batch}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {item.attachments?.nextSession && (
                            <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-xl border border-orange-100 dark:border-orange-800">
                                <Clock size={14} className="text-orange-500"/>
                                <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
                                    Retorno sugerido: {new Date(item.attachments.nextSession).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Assinado digitalmente em {new Date(item.created_at).toLocaleDateString()}</p>
                        <div className="flex items-center gap-1 text-[9px] font-black text-pink-500 uppercase cursor-pointer hover:underline">Ver detalhes <ChevronRight size={10}/></div>
                    </div>

                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}