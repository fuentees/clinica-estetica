import React, { useState, useMemo, useRef } from "react";
import { ChevronRight, Save, Loader2, AlertTriangle, CheckCircle2, Clock, CalendarDays, PackagePlus, Trash2, Search, X, Camera, Copy, PlusCircle, Pill, FileText, ExternalLink, Plus, Edit3, Lock } from "lucide-react";
import { Button } from "../../../components/ui/button"; 
import { CLINICAL_TEMPLATES } from "../utils/clinicalTemplates";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface EvolutionFormProps {
  services: any[];
  inventory: any[];
  // ✅ ATUALIZADO: Adicionado 'completed' à tipagem para suportar o estado final jurídico
  consentStatus: 'none' | 'pending' | 'signed' | 'completed'; 
  isSessionActive: boolean;
  onProcedureChange: (type: string) => void;
  onOpenConsent: () => void;
  onSave: (data: any, files: File[]) => Promise<void>; 
  isSaving: boolean;
  lastRecordDescription: string;
  patientId?: string;
  customTemplates: any[]; 
  onSaveTemplate: (title: string, desc: string, id?: string) => Promise<void>; 
  onDeleteTemplate: (id: string) => Promise<void>;
  disabled?: boolean; // Prop de suporte para bloqueio global
}

export function EvolutionForm({ 
  services, inventory, consentStatus, isSessionActive, 
  onProcedureChange, onOpenConsent, onSave, isSaving, 
  lastRecordDescription, patientId, customTemplates, onSaveTemplate, onDeleteTemplate,
  disabled 
}: EvolutionFormProps) {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState("");
  const [desc, setDesc] = useState("");
  const [nextSession, setNextSession] = useState("");
  
  const [products, setProducts] = useState<any[]>([]);
  const [prodSearch, setProdSearch] = useState(""); 
  const [selectedProd, setSelectedProd] = useState<any>(null); 
  const [isListOpen, setIsListOpen] = useState(false); 
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionItems, setPrescriptionItems] = useState<{drug: string, dosage: string, instructions: string}[]>([]);
  const [tempDrug, setTempDrug] = useState("");
  const [tempDosage, setTempDosage] = useState("");
  const [tempInstr, setTempInstr] = useState("");

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ id: "", title: "", content: "" });

  // ✅ LÓGICA DE BLOQUEIO JURÍDICO: Só libera se for 'none' ou 'completed'
  const isJuridicallyLocked = useMemo(() => {
    if (type === "") return false;
    return consentStatus !== 'none' && consentStatus !== 'completed';
  }, [consentStatus, type]);

  const filteredInventory = useMemo(() => {
    if (!prodSearch) return [];
    return inventory.filter(i => i.name.toLowerCase().includes(prodSearch.toLowerCase()));
  }, [prodSearch, inventory]);

  const handleSelectProductFromList = (item: any) => {
      setSelectedProd(item);
      setProdSearch(item.name); 
      setIsListOpen(false); 
  };

  const handleAddProduct = () => {
    if(!selectedProd) return; 
    setProducts(prev => [...prev, { inventoryId: selectedProd.id, name: selectedProd.name, batch: selectedProd.batch || "S/L", quantity: "1" }]);
    setProdSearch(""); setSelectedProd(null);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          setPhotos(prev => [...prev, ...newFiles]);
          setPhotoPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
      }
  };

  const handleAddPrescriptionItem = () => {
      if (!tempDrug) return;
      setPrescriptionItems([...prescriptionItems, { drug: tempDrug, dosage: tempDosage, instructions: tempInstr }]);
      setTempDrug(""); setTempDosage(""); setTempInstr("");
  };

  const handleGoToPrescriptionPage = () => {
    if (!patientId) return toast.error("ID DO PACIENTE NÃO IDENTIFICADO.");
    sessionStorage.setItem('evolution_draft', desc);
    navigate(`/prescriptions/new?patient_id=${patientId}`);
  };

  const handleSaveCustomTemplate = async () => {
    if (!templateForm.title || !templateForm.content) return toast.error("TÍTULO E CONTEÚDO SÃO OBRIGATÓRIOS");
    try {
      await onSaveTemplate(templateForm.title, templateForm.content, templateForm.id || undefined);
      setShowTemplateModal(false);
      setTemplateForm({ id: "", title: "", content: "" });
      toast.success(templateForm.id ? "MODELO ATUALIZADO!" : "NOVO MODELO SALVO!");
    } catch (error) {
      toast.error("ERRO AO SALVAR MODELO");
    }
  };

  const handleDeleteTemplateClick = async (id: string) => {
    if (window.confirm("DESEJA REALMENTE EXCLUIR ESTE MODELO?")) {
        try { await onDeleteTemplate(id); toast.success("MODELO EXCLUÍDO!"); } catch (error) { toast.error("ERRO AO EXCLUIR"); }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ Travamento extra no submit
    if (isJuridicallyLocked) {
      return toast.error("CONCLUA A ASSINATURA DO TERMO PARA SALVAR.");
    }
    onSave({ date, subject: type, description: desc, attachments: { usedProducts: products, nextSession, prescription: prescriptionItems } }, photos);
    if (isSessionActive && !isJuridicallyLocked) { 
        setDesc(""); setProducts([]); setNextSession(""); setPhotos([]); setPhotoPreviews([]); 
        setPrescriptionItems([]); setShowPrescription(false);
    }
  };

  return (
    <div className={`relative transition-all duration-500 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* 1. CABEÇALHO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="text-sm font-black text-gray-400 uppercase mb-2 block tracking-[0.2em]">DATA DO ATENDIMENTO</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full h-14 pl-6 pr-4 bg-gray-50 border-2 border-gray-100 focus:border-pink-500 rounded-2xl font-black outline-none transition-all uppercase text-sm tracking-widest"/>
          </div>
          <div>
            <label className="text-sm font-black text-gray-400 uppercase mb-2 block tracking-[0.2em]">PROCEDIMENTO</label>
            <div className="relative">
                <select value={type} onChange={(e) => { const val = e.target.value; setType(val); onProcedureChange(val); }} className="w-full h-14 pl-4 pr-10 bg-gray-50 border-2 border-gray-100 focus:border-pink-500 rounded-2xl font-black outline-none appearance-none transition-all uppercase text-sm tracking-widest">
                    <option value="">SELECIONE...</option>
                    {services.map(s => <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>)}
                </select>
                <ChevronRight size={20} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none"/>
            </div>
          </div>
        </div>

        {/* STATUS DO TERMO ATUALIZADO */}
        {type && consentStatus !== 'none' && (
          <div className={`p-5 rounded-[2rem] border-2 mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-sm ${
            consentStatus === 'completed' 
              ? 'bg-emerald-50 border-emerald-100' 
              : 'bg-amber-50 border-amber-100'
          }`}>
             <div className="flex items-center gap-4">
                {consentStatus === 'completed' ? (
                  <div className="bg-emerald-500 p-2 rounded-full text-white shadow-lg shadow-emerald-200">
                    <CheckCircle2 size={24}/>
                  </div>
                ) : (
                  <div className="bg-amber-500 p-2 rounded-full text-white shadow-lg shadow-amber-200">
                    <AlertTriangle size={24}/>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${consentStatus === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      SITUAÇÃO JURÍDICA
                  </span>
                  <span className={`text-sm font-black uppercase italic ${consentStatus === 'completed' ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {consentStatus === 'completed' ? "Termo Finalizado e Arquivado" : 
                       consentStatus === 'signed' ? "Aguardando sua Validação Profissional" : "Assinatura do Paciente Pendente"}
                  </span>
                </div>
             </div>
             {consentStatus !== 'completed' && (
               <Button type="button" onClick={onOpenConsent} className="h-14 bg-gray-900 hover:bg-black text-white text-xs font-black px-10 rounded-2xl tracking-[0.2em] uppercase shadow-xl transition-all hover:scale-105 active:scale-95">
                 {consentStatus === 'signed' ? "VALIDAR AGORA" : "ASSINAR TERMO"}
               </Button>
             )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 2. EVOLUÇÃO CLÍNICA COM TRAVA JURÍDICA */}
          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm relative overflow-hidden">
            {isJuridicallyLocked && (
                <div className="absolute inset-0 z-40 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-[2.5rem] border-4 border-dashed border-gray-100 transition-all">
                    <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-center space-y-4 max-w-xs border-4 border-pink-500/20">
                        <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto">
                          <Lock className="text-pink-500" size={32}/>
                        </div>
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] leading-relaxed">
                          ACESSO BLOQUEADO:<br/>CONCLUA O FLUXO JURÍDICO PARA EVOLUIR
                        </p>
                        <Button onClick={onOpenConsent} className="bg-white text-black h-10 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-pink-50">LIBERAR AGORA</Button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h3 className="font-black uppercase text-sm text-gray-800 flex items-center gap-2 tracking-[0.2em]"><FileText size={20} className="text-pink-500"/> EVOLUÇÃO CLÍNICA</h3>
                <div className="flex gap-3">
                    <Button type="button" onClick={() => setDesc(lastRecordDescription)} variant="outline" className="h-14 px-8 text-xs font-black uppercase tracking-widest gap-3 border-dashed rounded-2xl border-2 hover:bg-gray-50 transition-all">
                        <Copy size={18} className="text-pink-500"/> ANTERIOR
                    </Button>
                    <Button type="button" onClick={() => { setTemplateForm({ id: "", title: "", content: desc }); setShowTemplateModal(true); }} variant="outline" className="h-14 px-8 text-xs font-black uppercase tracking-widest gap-3 border-dashed rounded-2xl border-2 hover:bg-gray-50 transition-all">
                        <Plus size={18} className="text-pink-500"/> SALVAR MODELO
                    </Button>
                </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 mb-4 custom-scrollbar">
                {Object.keys(CLINICAL_TEMPLATES).map(k => (
                    <div key={k} className="relative group flex-shrink-0">
                      <button type="button" onClick={() => setDesc((CLINICAL_TEMPLATES as any)[k])} className="px-8 py-4 bg-gray-50 hover:bg-pink-50 text-gray-600 hover:text-pink-600 rounded-2xl text-xs font-black uppercase border-2 border-gray-100 transition-all whitespace-nowrap tracking-widest pr-12 italic">
                        {k}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setTemplateForm({ id: "", title: k, content: (CLINICAL_TEMPLATES as any)[k] }); setShowTemplateModal(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-pink-500 transition-colors">
                        <Edit3 size={16}/>
                      </button>
                    </div>
                ))}
                {customTemplates?.map(t => (
                    <div key={t.id} className="relative group flex-shrink-0">
                      <button type="button" onClick={() => setDesc(t.description)} className="px-8 py-4 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-2xl text-xs font-black uppercase border-2 border-pink-200 transition-all whitespace-nowrap pr-24 tracking-widest italic">
                          {t.title}
                      </button>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTemplateForm({ id: t.id, title: t.title, content: t.description }); setShowTemplateModal(true); }} className="p-1.5 text-pink-400 hover:text-pink-600"><Edit3 size={16}/></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteTemplateClick(t.id); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                      </div>
                    </div>
                ))}
            </div>

            <textarea rows={12} value={desc} onChange={e => setDesc(e.target.value)} placeholder="DESCREVA A TÉCNICA UTILIZADA NO PROCEDIMENTO..." className="w-full p-8 bg-gray-50 border-2 border-gray-100 focus:border-pink-500 rounded-[2rem] outline-none resize-none shadow-inner text-base font-black uppercase tracking-widest transition-all italic"/>
          </div>

          {/* 3. INSUMOS */}
          <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border-2 border-blue-100">
             <h4 className="text-xs font-black uppercase text-blue-900 tracking-[0.2em] mb-6 flex items-center gap-2"><PackagePlus size={20}/> INSUMOS DO ATENDIMENTO</h4>
             <div className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-white p-6 rounded-3xl shadow-sm border-2 border-blue-100 relative">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="text" placeholder="PESQUISAR INSUMO NO ESTOQUE..." value={prodSearch} onChange={(e) => { setProdSearch(e.target.value); setIsListOpen(true); }} className="w-full h-14 pl-14 pr-4 bg-gray-50 border-0 rounded-2xl text-xs font-black outline-none uppercase tracking-widest"/>
                    {isListOpen && prodSearch && !selectedProd && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 z-50 max-h-60 overflow-y-auto">
                            {filteredInventory.map(item => (<div key={item.id} onClick={() => handleSelectProductFromList(item)} className="p-5 hover:bg-blue-50 cursor-pointer border-b-2 border-gray-50 text-xs font-black uppercase tracking-widest">{item.name} <span className="text-gray-400 ml-3 italic">({item.batch || "S/L"})</span></div>))}
                        </div>
                    )}
                </div>
                <Button type="button" onClick={handleAddProduct} disabled={!selectedProd} className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95">ADICIONAR</Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm transition-all hover:border-blue-400">
                        <div className="text-xs font-black uppercase tracking-widest">{p.name} <span className="text-blue-500 ml-6 italic font-bold">LOTE: {p.batch}</span></div>
                        <button type="button" onClick={() => setProducts(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={24}/></button>
                    </div>
                ))}
             </div>
          </div>

          {/* 4. FOTOS */}
          <div className="bg-purple-50/50 p-8 rounded-[2.5rem] border-2 border-purple-100 shadow-sm">
             <h4 className="text-xs font-black uppercase text-purple-900 tracking-[0.2em] mb-6 flex items-center gap-2"><Camera size={20}/> DOCUMENTAÇÃO FOTOGRÁFICA</h4>
             <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-purple-300 rounded-3xl bg-white hover:bg-purple-50 flex flex-col items-center justify-center cursor-pointer transition-all group hover:scale-105 shadow-inner">
                    <Camera size={32} className="text-purple-400 group-hover:scale-110 transition-transform"/>
                    <span className="text-[10px] font-black uppercase text-purple-400 mt-3 tracking-widest">UPLOAD</span>
                    <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoSelect}/>
                </div>
                {photoPreviews.map((src, i) => (
                    <div key={i} className="aspect-square relative rounded-3xl overflow-hidden shadow-xl group border-4 border-white transition-all hover:scale-105">
                        <img src={src} alt="Preview" className="w-full h-full object-cover"/>
                        <button type="button" onClick={() => {setPhotos(prev => prev.filter((_, idx) => idx !== i)); setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));}} className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"><X size={16}/></button>
                    </div>
                ))}
             </div>
          </div>

          {/* 5. PRESCRIÇÃO */}
          <div className={`rounded-[2.5rem] border-2 transition-all p-8 shadow-sm ${showPrescription ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-8">
                      <div>
                        <h3 className="font-black uppercase text-sm text-gray-700 flex items-center gap-2 tracking-[0.2em]"><Pill size={20} className="text-emerald-500"/> PRESCRIÇÃO</h3>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1 italic">ATIVAR PARA MEDICAMENTOS</p>
                      </div>
                      <div 
                        onClick={() => setShowPrescription(!showPrescription)}
                        className={`w-16 h-8 rounded-full relative cursor-pointer transition-colors duration-300 shadow-inner ${showPrescription ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${showPrescription ? 'left-9' : 'left-2'}`} />
                      </div>
                  </div>
                  {showPrescription && (
                    <Button type="button" onClick={handleGoToPrescriptionPage} variant="outline" className="h-12 px-8 rounded-2xl text-xs font-black uppercase gap-3 border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 tracking-widest border-2">PÁGINA COMPLETA <ExternalLink size={18}/></Button>
                  )}
              </div>

              {showPrescription && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input type="text" placeholder="MEDICAMENTO" value={tempDrug} onChange={e => setTempDrug(e.target.value)} className="h-14 px-6 bg-white border-2 border-emerald-100 rounded-2xl outline-none text-xs font-black uppercase tracking-widest focus:border-emerald-500 transition-all shadow-inner"/>
                          <input type="text" placeholder="DOSE" value={tempDosage} onChange={e => setTempDosage(e.target.value)} className="h-14 px-6 bg-white border-2 border-emerald-100 rounded-2xl outline-none text-xs font-black uppercase tracking-widest focus:border-emerald-500 transition-all shadow-inner"/>
                          <div className="flex gap-3">
                             <input type="text" placeholder="FREQUÊNCIA" value={tempInstr} onChange={e => setTempInstr(e.target.value)} className="flex-1 h-14 px-6 bg-white border-2 border-emerald-100 rounded-2xl outline-none text-xs font-black uppercase tracking-widest focus:border-emerald-500 transition-all shadow-inner"/>
                             <Button type="button" onClick={handleAddPrescriptionItem} className="h-14 w-14 p-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl transition-all active:scale-90"><PlusCircle size={28}/></Button>
                          </div>
                      </div>
                      <div className="space-y-4">
                          {prescriptionItems.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white p-6 rounded-[1.5rem] shadow-sm border-2 border-emerald-100 transition-all hover:border-emerald-400">
                                  <div className="text-xs font-black uppercase tracking-widest"><strong>{item.drug}</strong> ({item.dosage}) <span className="text-gray-300 mx-4">|</span> <span className="text-gray-500 italic font-bold">{item.instructions}</span></div>
                                  <button type="button" onClick={() => setPrescriptionItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={24}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          {/* RODAPÉ ATUALIZADO COM TRAVA NO BOTÃO SALVAR */}
          <div className="flex items-center gap-8 pt-8 border-t-2 border-gray-100">
             <div className="flex-1 relative">
                <Clock className="absolute top-1/2 -translate-y-1/2 left-6 text-orange-500" size={24} />
                <input type="date" value={nextSession} onChange={e => setNextSession(e.target.value)} className="w-full h-20 pl-16 pr-8 bg-orange-50/40 border-2 border-transparent focus:border-orange-200 rounded-[2rem] text-sm font-black outline-none text-orange-900 uppercase tracking-[0.2em] transition-all shadow-inner"/>
             </div>
             <Button 
                type="submit" 
                disabled={isSaving || !isSessionActive || isJuridicallyLocked} 
                variant="primary" 
                className={`h-20 px-20 rounded-[2rem] shadow-2xl font-black uppercase tracking-[0.4em] text-sm transition-all ${
                  isJuridicallyLocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black text-white hover:scale-[1.03] active:scale-95'
                }`}
             >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={24}/>
                ) : isJuridicallyLocked ? (
                  <><Lock size={28} className="mr-5"/> BLOQUEADO</>
                ) : (
                  <><Save size={28} className="mr-5 text-pink-500"/> SALVAR ATENDIMENTO</>
                )}
             </Button>
          </div>
        </form>

        {/* ✅ MODAL DE GERENCIAMENTO DE MODELOS */}
        {showTemplateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="bg-white p-8 md:p-12 rounded-[3rem] w-full max-w-4xl shadow-2xl space-y-8 border-[6px] border-pink-50 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh] custom-scrollbar">
                  <div className="flex justify-between items-center border-b-2 border-pink-100 pb-6">
                     <h3 className="font-black uppercase text-base text-gray-900 tracking-[0.4em] flex items-center gap-4 italic"><PlusCircle className="text-pink-500" size={28}/> {templateForm.id ? "EDITAR MODELO" : "CRIAR NOVO MODELO"}</h3>
                     <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-red-500"><X size={32}/></button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                          <label className="text-xs font-black text-pink-500 uppercase tracking-widest pl-2">TÍTULO DO MODELO</label>
                          <input autoFocus value={templateForm.title} onChange={e => setTemplateForm({...templateForm, title: e.target.value})} placeholder="EX: PROTOCOLO PÓS-PROCEDIMENTO" className="w-full h-16 border-2 border-gray-100 rounded-3xl px-8 outline-none focus:border-pink-500 font-black uppercase text-sm tracking-widest shadow-inner bg-gray-50"/>
                      </div>

                      <div className="space-y-3">
                          <label className="text-xs font-black text-pink-500 uppercase tracking-widest pl-2">CONTEÚDO DO MODELO (TEXTO QUE SERÁ PREENCHIDO)</label>
                          <textarea rows={10} value={templateForm.content} onChange={e => setTemplateForm({...templateForm, content: e.target.value})} placeholder="DIGITE O TEXTO PADRÃO AQUI..." className="w-full p-8 border-2 border-gray-100 rounded-[2rem] outline-none focus:border-pink-500 font-bold uppercase text-sm tracking-widest shadow-inner bg-gray-50 resize-none italic"/>
                      </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                      <Button onClick={() => setShowTemplateModal(false)} variant="outline" className="flex-1 h-16 rounded-[1.5rem] uppercase text-xs font-black tracking-widest border-2">CANCELAR</Button>
                      <Button onClick={handleSaveCustomTemplate} variant="primary" className="flex-1 h-16 bg-pink-600 text-white rounded-[1.5rem] uppercase text-xs font-black tracking-widest shadow-xl shadow-pink-200 transition-all hover:bg-pink-700">SALVAR MODELO</Button>
                  </div>
              </div>
          </div>
        )}
    </div>
  );
}