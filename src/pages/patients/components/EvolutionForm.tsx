import React, { useState, useRef } from "react";
import { 
  Save, Loader2, Camera, Copy, Plus, Lock, X, 
  FileText, Trash2, Syringe, Clock, Pill, ChevronRight, AlertTriangle, AlertOctagon, CheckCircle2, ArrowLeft
} from "lucide-react";
import { Button } from "../../../components/ui/button"; 
import { CLINICAL_TEMPLATES } from "../utils/clinicalTemplates";
import { toast } from "react-hot-toast";
import { supabase } from "../../../lib/supabase";

import { PrescriptionModule } from "./PrescriptionModule";
import { PrescriptionTreatment } from "../hooks/usePatientEvolution";

interface EvolutionFormProps {
  services: any[];
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
  disabled?: boolean; 
  activePrescription: PrescriptionTreatment[];
  addPrescriptionItem: () => void;
  updatePrescriptionItem: (index: number, data: PrescriptionTreatment) => void;
  removePrescriptionItem: (index: number) => void;
}

export function EvolutionForm({ 
  services, consentStatus, isSessionActive, 
  onProcedureChange, onOpenConsent, onSave, isSaving, 
  lastRecordDescription, customTemplates, onSaveTemplate, onDeleteTemplate,
  disabled,
  activePrescription, addPrescriptionItem, updatePrescriptionItem, removePrescriptionItem
}: EvolutionFormProps) {
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState("");
  const [desc, setDesc] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [returnProcedure, setReturnProcedure] = useState("");
  const [showPrescription, setShowPrescription] = useState(false);
  
  // Estados de Controle
  const [isIntercurrence, setIsIntercurrence] = useState(false);
  const [showSignatureInput, setShowSignatureInput] = useState(false); // ✅ Controla visibilidade da senha

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ id: "", title: "", content: "" });
  const [password, setPassword] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // --- HANDLERS ---
  const handleSaveCustomTemplate = async () => {
    if (!templateForm.title || !templateForm.content) return toast.error("Preencha título e conteúdo");
    try {
      await onSaveTemplate(templateForm.title, templateForm.content, templateForm.id || undefined);
      setShowTemplateModal(false);
      setTemplateForm({ id: "", title: "", content: "" });
      toast.success("Modelo salvo!");
    } catch (error) { toast.error("Erro ao salvar"); }
  };

  const handleDeleteTemplateClick = async (id: string) => {
    if (window.confirm("Excluir este modelo?")) {
        try { await onDeleteTemplate(id); toast.success("Excluído!"); } catch (error) { toast.error("Erro ao excluir"); }
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          setPhotos(prev => [...prev, ...newFiles]);
          setPhotoPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
      }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleImportAssets = () => {
    if (!isSessionActive) return toast.error("Inicie a sessão.");
    const selectedService = services.find(s => s.name === type || s.id === type);
    if (selectedService?.products?.length > 0) {
        const assetsText = "\n\n--- KIT UTILIZADO ---\n" + selectedService.products.map((p: any) => `• ${p.name} (${p.quantity || '1'}un)`).join("\n");
        setDesc(prev => prev + assetsText);
        toast.success("Ativos importados!");
    } else { toast.error("Sem kit cadastrado."); }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSessionActive) return toast.error("⚠️ Inicie a sessão para editar.");
    if (!desc.trim()) return toast.error("A evolução não pode estar vazia.");
    
    // ✅ Em vez de salvar direto, abre o campo de senha
    setShowSignatureInput(true);
  };

  const handleFinalConfirm = async () => {
    if (!password) return toast.error("Senha de assinatura obrigatória.");

    try {
        setIsValidating(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) throw new Error("Erro de auth");
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: password });
        if (signInError) { setIsValidating(false); return toast.error("Senha incorreta."); }

        const finalSubject = isIntercurrence ? `${type} - [INTERCORRÊNCIA]` : type;

        const evolutionData = { 
            date, 
            subject: finalSubject, 
            description: desc, 
            return_date: returnDate ? `${returnDate}T${returnTime || '09:00'}:00` : null,
            return_procedure_id: returnProcedure || null,
            attachments: { prescription: showPrescription ? activePrescription : [] } 
        };
        await onSave(evolutionData, photos);
        
        // Reset Total
        setDesc(""); setPhotos([]); setPhotoPreviews([]); setPassword(""); 
        setShowPrescription(false); setIsIntercurrence(false); setShowSignatureInput(false);

    } catch (error: any) { toast.error("Erro: " + error.message); } finally { setIsValidating(false); }
  };

  // Styles comuns
  const cardStyle = `bg-white p-6 rounded-3xl border shadow-sm transition-all duration-500 ${isIntercurrence ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-100 hover:shadow-md'}`;
  const labelStyle = "text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1";
  const inputStyle = "w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base font-bold focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed text-gray-700";

  return (
    <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* --- CABEÇALHO --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelStyle}>Data do Atendimento</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={!isSessionActive} className={inputStyle}/>
          </div>
          <div>
            <label className={labelStyle}>Procedimento Realizado</label>
            <div className="relative">
              <select value={type} onChange={(e) => { setType(e.target.value); onProcedureChange(e.target.value); }} disabled={!isSessionActive} className={`${inputStyle} appearance-none uppercase text-sm font-bold`}>
                  <option value="">Selecione o procedimento...</option>
                  {services.map(s => <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={20} className="rotate-90"/></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleInitialSubmit} className="space-y-8">
          
          {/* --- EVOLUÇÃO TÉCNICA (CARD PRINCIPAL) --- */}
          <div className={cardStyle}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold text-base flex items-center gap-2 uppercase tracking-wide ${isIntercurrence ? 'text-red-600' : 'text-gray-800'}`}>
                  <div className={`p-2 rounded-lg transition-colors ${isIntercurrence ? 'bg-red-100 text-red-600' : 'bg-pink-100 text-pink-600'}`}>
                      {isIntercurrence ? <AlertTriangle size={20}/> : <FileText size={20}/>}
                  </div>
                  {isIntercurrence ? "Relatório de Incidente" : "Descrição da Evolução"}
                </h3>
                <div className="flex gap-2">
                    <Button type="button" disabled={!isSessionActive} onClick={() => setDesc(lastRecordDescription)} variant="ghost" size="sm" className="h-9 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-pink-600 hover:bg-pink-50">
                        <Copy size={14} className="mr-1.5"/> Copiar Anterior
                    </Button>
                    <Button type="button" disabled={!isSessionActive} onClick={() => { setTemplateForm({ id: "", title: "", content: desc }); setShowTemplateModal(true); }} variant="ghost" size="sm" className="h-9 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-pink-600 hover:bg-pink-50">
                        <Plus size={14} className="mr-1.5"/> Modelo
                    </Button>
                </div>
            </div>

            {/* BARRA DE TEMPLATES */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 custom-scrollbar mask-gradient-right">
                {Object.keys(CLINICAL_TEMPLATES).map(k => (
                    <button key={k} type="button" disabled={!isSessionActive} onClick={() => setDesc((CLINICAL_TEMPLATES as any)[k])} className="px-4 py-1.5 bg-gray-50 hover:bg-pink-50 text-gray-600 hover:text-pink-600 rounded-lg text-xs font-bold uppercase border border-gray-100 transition-colors whitespace-nowrap">
                        {k}
                    </button>
                ))}
                {customTemplates?.map(t => (
                    <div key={t.id} className="relative group flex-shrink-0">
                      <button type="button" disabled={!isSessionActive} onClick={() => setDesc(t.description)} className="px-4 py-1.5 bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-lg text-xs font-bold uppercase border border-pink-100 transition-colors whitespace-nowrap pr-6">
                          {t.title}
                      </button>
                      <button type="button" onClick={() => handleDeleteTemplateClick(t.id)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                    </div>
                ))}
            </div>

            <textarea 
                rows={10} value={desc} onChange={e => setDesc(e.target.value)} disabled={!isSessionActive}
                placeholder={isIntercurrence ? "⚠️ DESCREVA O OCORRIDO COM DETALHES..." : isSessionActive ? "Descreva os detalhes técnicos, produtos utilizados e reações..." : "⚠️ Inicie o atendimento para editar..."} 
                className={`w-full p-6 border rounded-2xl outline-none resize-none text-base font-medium leading-relaxed text-gray-700 placeholder:text-gray-300 transition-all focus:ring-4 ${isIntercurrence ? 'bg-red-50/50 border-red-200 focus:border-red-500 focus:ring-red-500/10 placeholder:text-red-300' : 'bg-gray-50/50 border-gray-200 focus:border-pink-500 focus:ring-pink-500/5'}`}
            />

            {/* BARRA DE AÇÕES INFERIOR (KIT + INTERCORRÊNCIA) */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-100 gap-4">
                
                {/* ✅ BOTÃO DE INTERCORRÊNCIA (Posicionado aqui) */}
                <button 
                    type="button"
                    onClick={() => isSessionActive && setIsIntercurrence(!isIntercurrence)}
                    disabled={!isSessionActive}
                    className={`
                        h-10 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all border
                        ${isIntercurrence 
                            ? 'bg-red-500 text-white border-red-600 shadow-md animate-pulse' 
                            : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-500'
                        }
                    `}
                >
                    {isIntercurrence ? <AlertOctagon size={14} /> : <AlertTriangle size={14} />}
                    {isIntercurrence ? "Modo Intercorrência Ativo" : "Marcar como Intercorrência"}
                </button>

                <Button type="button" onClick={handleImportAssets} disabled={!isSessionActive} variant="ghost" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 text-xs font-bold h-10">
                    <Syringe size={16} className="mr-2" /> Importar Kit do Serviço
                </Button>
            </div>
          </div>

          {/* --- PRESCRIÇÃO HOME CARE --- */}
          <div className={`rounded-3xl border transition-all duration-300 overflow-hidden ${showPrescription ? 'bg-emerald-50/30 border-emerald-200 shadow-sm' : 'bg-white border-gray-100'}`}>
            <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => isSessionActive && setShowPrescription(!showPrescription)}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${showPrescription ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                  <Pill size={24} />
                </div>
                <div>
                  <h3 className={`text-base font-bold uppercase tracking-wide ${showPrescription ? 'text-emerald-800' : 'text-gray-500'}`}>
                    Prescrição Home Care
                  </h3>
                  <p className="text-xs font-medium text-gray-400">Ativar recomendação terapêutica</p>
                </div>
              </div>

              <div className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${showPrescription ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${showPrescription ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </div>

            {showPrescription && (
              <div className="px-6 pb-8 border-t border-emerald-100/50 animate-in slide-in-from-top-2">
                 <PrescriptionModule 
                    items={activePrescription}
                    onAdd={addPrescriptionItem}
                    onUpdate={updatePrescriptionItem}
                    onRemove={removePrescriptionItem}
                  />
              </div>
            )}
          </div>

          {/* --- GRID: FOTOS & RETORNO --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-purple-50/30 p-6 rounded-3xl border border-purple-100/50">
              <h4 className="text-sm font-bold uppercase text-purple-900 tracking-wider mb-4 flex items-center gap-2">
                <Camera size={18} className="text-purple-500"/> Evidências Fotográficas
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <div onClick={() => isSessionActive && fileInputRef.current?.click()} className={`aspect-square border-2 border-dashed border-purple-200 rounded-2xl bg-white/50 flex flex-col items-center justify-center transition-all ${isSessionActive ? 'cursor-pointer hover:bg-white hover:border-purple-300 hover:shadow-md' : 'opacity-50'}`}>
                    <Plus size={24} className="text-purple-400"/>
                    <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoSelect} disabled={!isSessionActive}/>
                </div>
                {photoPreviews.map((src, i) => (
                    <div key={i} className="aspect-square relative rounded-2xl overflow-hidden border-2 border-white shadow-sm group">
                        <img src={src} className="w-full h-full object-cover" alt="preview"/>
                        <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"><X size={12}/></button>
                    </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100/50 space-y-4">
              <h4 className="text-sm font-bold uppercase text-blue-800 tracking-wider flex items-center gap-2">
                <Clock size={18} className="text-blue-500"/> Agendar Retorno
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" disabled={!isSessionActive} value={returnDate} onChange={e => setReturnDate(e.target.value)} className="h-12 px-4 bg-white border border-blue-100 rounded-xl text-sm font-bold outline-none focus:border-blue-500 text-gray-700"/>
                  <input type="time" disabled={!isSessionActive} value={returnTime} onChange={e => setReturnTime(e.target.value)} className="h-12 px-4 bg-white border border-blue-100 rounded-xl text-sm font-bold outline-none focus:border-blue-500 text-gray-700"/>
                </div>
                <select disabled={!isSessionActive} value={returnProcedure} onChange={e => setReturnProcedure(e.target.value)} className="w-full h-12 px-4 bg-white border border-blue-100 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500 text-gray-700">
                    <option value="">Selecione o próximo passo...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* --- RODAPÉ INTELIGENTE (DUPLA CONFIRMAÇÃO) --- */}
          <div className={`rounded-[2.5rem] transition-all duration-500 ${showSignatureInput ? 'bg-white p-6 border-2 border-pink-100 shadow-xl' : 'mt-8'}`}>
              
              {!showSignatureInput ? (
                  // ESTADO 1: Botão Grande de Finalizar
                  <Button 
                    type="submit" // Aciona o handleInitialSubmit
                    disabled={!isSessionActive} 
                    className={`h-24 w-full rounded-[2rem] shadow-2xl font-black uppercase tracking-[0.3em] text-lg transition-all active:scale-95 flex items-center justify-center gap-4 ${isIntercurrence ? 'bg-red-600 hover:bg-red-700 shadow-red-200 text-white' : 'bg-gray-900 hover:bg-black shadow-gray-200 text-white'}`}
                  >
                    {isIntercurrence ? <AlertOctagon size={32}/> : <CheckCircle2 size={32}/>}
                    {isIntercurrence ? "REGISTRAR INCIDENTE" : "FINALIZAR ATENDIMENTO"}
                  </Button>
              ) : (
                  // ESTADO 2: Confirmação de Senha
                  <div className="animate-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center gap-3 mb-6 text-gray-800">
                          <Lock size={24} className="text-pink-500"/>
                          <h4 className="text-lg font-black uppercase tracking-wide">Autenticação Requerida</h4>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-4">
                          <input 
                              autoFocus
                              type="password" 
                              value={password} 
                              onChange={e => setPassword(e.target.value)} 
                              placeholder="Digite sua senha para assinar..." 
                              className="flex-1 h-16 bg-gray-50 border-2 border-pink-100 focus:border-pink-500 rounded-2xl px-6 text-2xl font-black outline-none transition-all shadow-inner"
                          />
                          
                          <div className="flex gap-2">
                              <Button 
                                type="button" 
                                onClick={handleFinalConfirm} // Aciona o envio real
                                disabled={isSaving || isValidating || !password}
                                className="h-16 px-8 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg flex-1 md:flex-none min-w-[140px]"
                              >
                                {isValidating ? <Loader2 className="animate-spin"/> : "Assinar"}
                              </Button>
                              <Button 
                                type="button" 
                                onClick={() => setShowSignatureInput(false)}
                                className="h-16 px-6 bg-white border-2 border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl font-bold uppercase tracking-widest"
                              >
                                <ArrowLeft size={24}/>
                              </Button>
                          </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-4 text-center font-medium">Ao assinar, você confirma a veracidade das informações clínicas acima.</p>
                  </div>
              )}
          </div>
        </form>

        {/* MODAL TEMPLATE */}
        {showTemplateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-gray-800">Novo Modelo</h3><button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={18}/></button></div>
                  <input autoFocus value={templateForm.title} onChange={e => setTemplateForm({...templateForm, title: e.target.value})} placeholder="Título do Modelo" className={inputStyle}/>
                  <textarea rows={5} value={templateForm.content} onChange={e => setTemplateForm({...templateForm, content: e.target.value})} placeholder="Texto do modelo..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none text-sm"/>
                  <Button onClick={handleSaveCustomTemplate} className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold">Salvar</Button>
              </div>
          </div>
        )}
    </div>
  );
}