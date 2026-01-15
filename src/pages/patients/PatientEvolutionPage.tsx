import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { TrendingUp, ShieldCheck, Play, StopCircle, Loader2, KeyRound, History, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { supabase } from "../../lib/supabase"; // Importação necessária para o Realtime

import { usePatientEvolution } from "./hooks/usePatientEvolution";
import { useConsentFlow } from "./hooks/useConsentFlow";
import { EvolutionForm } from "./components/EvolutionForm";
import { EvolutionTimeline } from "./components/EvolutionTimeline";
import { ConsentModal } from "./components/ConsentModal";
import { SessionTimer } from "./components/SessionTimer";
import { PrintableView } from "./components/PrintableView";
import { RecordDetailsModal } from "./components/RecordDetailsModal";
import { printStyles } from "./utils/printStyles";
import { ClinicalRecord } from "./types/clinical";

export function PatientEvolutionPage() {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [profPass, setProfPass] = useState("");

  const { 
    loading, 
    records, 
    servicesList, 
    inventoryList, 
    customTemplates, 
    stats, 
    context, 
    saveEvolution, 
    invalidateRecord,
    saveNewTemplate,
    deleteTemplate 
  } = usePatientEvolution(id);

  const { status: consentStatus, pendingTemplate, modalOpen, setModalOpen, checkConsentRequirement, setStatus } = useConsentFlow(context.clinicId, id, context.professionalId, context.professionalName, context.patientName);

  // ✅ MONITORAMENTO REALTIME: Detecta assinatura do paciente no celular instantaneamente
  useEffect(() => {
    if (!id || consentStatus !== 'pending') return;

    const channel = supabase
      .channel('consent-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'patient_consents',
          filter: `patient_id=eq.${id}`
        },
        (payload) => {
          if (payload.new.status === 'signed') {
            setStatus('signed');
            toast.success("Assinatura detectada! Termo validado.", {
              icon: <CheckCircle2 className="text-emerald-500" />,
              duration: 5000
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, consentStatus, setStatus]);

  const handleEndSession = () => {
    if (!profPass) return toast.error("Senha obrigatória");
    setIsSessionActive(false); setShowEndModal(false); setProfPass("");
    toast.success("Atendimento Encerrado!");
  };

  const handleSave = async (data: any, files: File[]): Promise<void> => {
    if (!isSessionActive) { toast.error("Inicie o atendimento!"); return; }
    // Travamento de segurança SaaS Vilagi
    if (consentStatus === 'pending') { 
      toast.error("Assinatura obrigatória para este procedimento!", {
        description: "O paciente precisa assinar o termo antes de salvar a evolução."
      } as any); 
      return; 
    }
    await saveEvolution(data, files);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-600" size={40}/></div>;

  const filteredRecords = records.filter((r: ClinicalRecord) => r.subject.toLowerCase().includes(searchTerm.toLowerCase()));
  const lastValidDescription = records.find(r => !r.deleted_at)?.description || "";

  return (
    <div className="max-w-[95%] mx-auto p-6 space-y-8 animate-in fade-in duration-700 bg-gray-50/50 min-h-screen">
      <style>{printStyles}</style>
      <Toaster position="top-right" />

      <PrintableView patientName={context.patientName} records={records} />
      <RecordDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      
      <ConsentModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSigned={() => { 
          if(setStatus) setStatus('signed'); 
          toast.success("Termo assinado com sucesso!"); 
        }} 
        patientId={id || ""} 
        professionalId={context.professionalId || ""} 
        clinicId={context.clinicId || ""} 
        procedureName={pendingTemplate?.title || ""} 
      />

      {showEndModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-4 border-4 border-pink-50">
              <h3 className="text-xl font-black flex items-center gap-2 text-gray-900 dark:text-white uppercase italic tracking-tighter"><ShieldCheck className="text-emerald-500" size={28}/> Finalizar Sessão</h3>
              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">Confirme sua identidade para encerrar o prontuário.</p>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={20}/>
                <input 
                  type="password" 
                  value={profPass} 
                  onChange={e => setProfPass(e.target.value)} 
                  className="w-full h-14 bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-4 outline-none focus:border-pink-500 font-black tracking-[0.5em] transition-all" 
                  placeholder="••••••••" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowEndModal(false)} className="flex-1 h-14 rounded-2xl font-bold border-2">Cancelar</Button>
                <Button onClick={handleEndSession} className="flex-1 bg-gray-900 hover:bg-black text-white h-14 rounded-2xl font-black uppercase tracking-widest">Assinar</Button>
              </div>
           </div>
        </div>
      )}

      {/* HEADER DINÂMICO VILAGI */}
      <div className="bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 no-print relative overflow-hidden">
         <div className="absolute top-0 right-0 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
         
         <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-700 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/20">
                <TrendingUp size={40} className="text-white"/>
            </div>
            <div>
               <h2 className="text-[10px] font-black uppercase text-pink-500 tracking-[0.4em] mb-2 italic">Prontuário de Estética Avançada</h2>
               <div className="flex flex-col">
                   <p className="text-4xl font-black tracking-tighter italic uppercase">{context.patientName}</p>
                   <div className="flex items-center gap-4 mt-3">
                       <span className="text-[10px] font-black bg-white/5 px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-widest">Sessões: {stats.totalVisits}</span>
                       <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/10 uppercase tracking-widest italic">Última: {stats.lastVisit}</span>
                   </div>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-8 relative z-10 bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-inner">
            <SessionTimer isActive={isSessionActive} />
            <div className="h-16 w-px bg-white/10 hidden md:block"></div>
            {!isSessionActive ? 
               <Button onClick={() => setIsSessionActive(true)} className="bg-pink-600 hover:bg-pink-700 text-white h-16 px-10 gap-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"><Play size={24}/> INICIAR</Button> : 
               <Button onClick={() => setShowEndModal(true)} className="bg-red-500 hover:bg-red-600 text-white h-16 px-10 gap-4 rounded-2xl font-black uppercase tracking-[0.2em] animate-pulse shadow-2xl shadow-red-500/20"><StopCircle size={24}/> ENCERRAR</Button>
            }
         </div>
      </div>

      <div className="flex flex-col gap-12 no-print">
         {/* FORMULÁRIO DE EVOLUÇÃO */}
         <div className="w-full bg-white dark:bg-gray-800 p-10 rounded-[3.5rem] shadow-xl border border-gray-100 dark:border-gray-700 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-b-full"></div>
            <EvolutionForm 
                services={servicesList} 
                inventory={inventoryList} 
                consentStatus={consentStatus} 
                isSessionActive={isSessionActive} 
                onProcedureChange={checkConsentRequirement} 
                onOpenConsent={() => setModalOpen(true)} 
                onSave={handleSave} 
                isSaving={false}
                lastRecordDescription={lastValidDescription}
                patientId={id}
                customTemplates={customTemplates}
                onSaveTemplate={saveNewTemplate}
                onDeleteTemplate={deleteTemplate} 
            />
         </div>

         {/* TIMELINE DE HISTÓRICO */}
         <div className="pt-6">
            <div className="flex items-center justify-between mb-10 px-4">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4 uppercase italic tracking-tighter">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-2xl">
                    <History size={24} />
                  </div>
                  Histórico Clínico
              </h3>
            </div>
            <EvolutionTimeline 
              records={filteredRecords} 
              onSearch={setSearchTerm} 
              onSelectRecord={setSelectedRecord} 
              onInvalidate={invalidateRecord} 
            />
         </div>
      </div>
    </div>
  );
}