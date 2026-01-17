import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { TrendingUp, Play, Loader2, History, Activity, CheckCircle2, FileText, Send } from "lucide-react"; 
import { Button } from "../../components/ui/button";
import { supabase } from "../../lib/supabase";

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
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [clinicData, setClinicData] = useState<any>(null);
  
  const [postTemplates, setPostTemplates] = useState<any[]>([]);
  const [sendingPost, setSendingPost] = useState(false);

  // Hook principal
  const { 
    loading, records, servicesList, customTemplates, stats, context, 
    saveEvolution, invalidateRecord, saveNewTemplate, deleteTemplate, 
    activeAppointmentId, printRecord,
    activePrescription,
    addPrescriptionItem,
    updatePrescriptionItem,
    removePrescriptionItem,
    startSession // ✅ 1. AGORA ESTAMOS IMPORTANDO A FUNÇÃO DO BANCO!
  } = usePatientEvolution(id);

  // Hook de Consentimento
  const { status: consentStatus, pendingTemplate, modalOpen, setModalOpen, checkConsentRequirement, setStatus } = useConsentFlow(
    context.clinicId, 
    id, 
    context.professionalId, 
    context.professionalName, 
    context.patientName
  );

  // 1. Busca Dados da Clínica e Templates Pós
  useEffect(() => {
    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
            if (profile?.clinic_id) {
                const { data: clinic } = await supabase.from('clinics').select('*').eq('id', profile.clinic_id).single();
                setClinicData(clinic);

                const { data: posts } = await supabase
                    .from('consent_templates')
                    .select('*')
                    .eq('clinic_id', profile.clinic_id)
                    .eq('type', 'pos')
                    .eq('status', 'ativo')
                    .is('deleted_at', null);
                
                setPostTemplates(posts || []);
            }
        }
    }
    fetchData();
  }, []);

  // Lógica de Sessão e AutoStart
  useEffect(() => {
    const storedSession = localStorage.getItem(`session_active_${id}`);
    const autoStart = searchParams.get('autoStart') === 'true';
    
    if (autoStart || storedSession === 'true' || activeAppointmentId) {
        if (!isSessionActive) {
            setIsSessionActive(true);
            if (!localStorage.getItem(`timer_start_${id}`)) {
                localStorage.setItem(`timer_start_${id}`, Date.now().toString());
            }
            localStorage.setItem(`session_active_${id}`, 'true');
        }
    }
  }, [id, searchParams, activeAppointmentId, isSessionActive]);

  useEffect(() => {
    if (!id || consentStatus !== 'pending') return;
    const channel = supabase.channel('consent-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'patient_consents', filter: `patient_id=eq.${id}` }, 
        (payload) => {
          if (payload.new.status === 'signed') {
            if (setStatus) setStatus('signed');
            toast.success("Assinatura do termo detectada!", { icon: <CheckCircle2 className="text-emerald-500" /> });
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, consentStatus, setStatus]);

  // ✅ 2. FUNÇÃO CORRIGIDA: Agora chama o banco (startSession) ANTES de atualizar a tela
  const handleStartSession = async () => {
      // Chama a lógica do Hook (Banco de Dados)
      await startSession(); 

      // Atualiza a tela (Visual)
      setIsSessionActive(true);
      localStorage.setItem(`session_active_${id}`, 'true');
      if (!localStorage.getItem(`timer_start_${id}`)) {
          localStorage.setItem(`timer_start_${id}`, Date.now().toString());
      }
      // O toast de sucesso já vem do startSession, não precisa duplicar aqui
  };

  const handleSendPostInstructions = async (templateId: string) => {
    const template = postTemplates.find(t => t.id === templateId);
    if (!template || !id) return;

    setSendingPost(true);
    try {
        let content = template.content;
        content = content.replace(/{PACIENTE_NOME}/g, context.patientName);
        content = content.replace(/{PACIENTE_CPF}/g, "Confidencial");
        content = content.replace(/{PROFISSIONAL_NOME}/g, context.professionalName);
        content = content.replace(/{CLINICA_NOME}/g, clinicData?.name || "Clínica");
        content = content.replace(/{DATA_ATUAL}/g, new Date().toLocaleDateString('pt-BR'));

        const html = `
            <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orientações Pós - ${context.patientName}</title>
            <style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap'); body { font-family: 'Montserrat', sans-serif; padding: 40px; color: #333; } .header { border-bottom: 2px solid #db2777; padding-bottom: 20px; margin-bottom: 30px; } h1 { color: #db2777; font-size: 24px; text-transform: uppercase; } .content { line-height: 1.6; } .footer { margin-top: 50px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }</style>
            </head><body>
            <div class="header"><h1>${template.title}</h1><p>Paciente: ${context.patientName}</p></div>
            <div class="content">${content}</div>
            <div class="footer">Gerado por ${clinicData?.name || "Sistema VILAGI"}</div>
            </body></html>
        `;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const fileName = `pos/${id}-${Date.now()}.html`;
        
        await supabase.storage.from('documents').upload(fileName, blob, { upsert: true, contentType: 'text/html;charset=utf-8' });

        const { data: linkData, error: dbError } = await supabase.from('document_links').insert({
            patient_id: id,
            file_path: fileName,
        }).select().single();

        if (dbError) throw dbError;

        const appUrl = `${window.location.origin}/doc/${linkData.token}`;
        const message = `Olá ${context.patientName.split(' ')[0]}! 👋\n\nAqui estão suas orientações pós-procedimento:\n\n👉 *${appUrl}*\n\nQualquer dúvida, nos chame.`;
        const encoded = encodeURIComponent(message);
        
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
        toast.success("Link de orientações gerado!");

    } catch (error) {
        console.error(error);
        toast.error("Erro ao gerar orientações.");
    } finally {
        setSendingPost(false);
    }
  };

  const handleSave = async (data: any, files: File[]): Promise<void> => {
    if (!isSessionActive) { toast.error("Inicie o atendimento!"); return; }
    
    if (consentStatus === 'pending') { 
        setModalOpen(true);
        toast.error("Assinatura do termo obrigatória para este procedimento!"); 
        return; 
    }

    try {
      await saveEvolution(data, files);
      setIsSessionActive(false);
      localStorage.removeItem(`session_active_${id}`);
      localStorage.removeItem(`timer_start_${id}`);
      
      if (postTemplates.length > 0) {
          toast((t) => (
              <div className="flex flex-col gap-2">
                  <span className="font-bold">Evolução Salva! Deseja enviar orientações?</span>
                  <div className="flex gap-2">
                      {postTemplates.slice(0, 2).map(tmpl => (
                          <button key={tmpl.id} onClick={() => { handleSendPostInstructions(tmpl.id); toast.dismiss(t.id); }} className="px-3 py-1 bg-pink-100 text-pink-700 text-xs rounded-lg font-bold hover:bg-pink-200">
                              {tmpl.title}
                          </button>
                      ))}
                      <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">Não</button>
                  </div>
              </div>
          ), { duration: 6000, icon: '🎉' });
      } else {
          toast.success("Evolução salva com sucesso!");
      }

    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-600" size={40}/></div>;

  const filteredRecords = records.filter((r: ClinicalRecord) => 
    r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lastValidDescription = records.find(r => !r.deleted_at)?.description || "";

  return (
    <div className="max-w-[95%] mx-auto p-6 space-y-8 animate-in fade-in duration-700 bg-gray-50/50 min-h-screen">
      <style>{printStyles}</style>
      <Toaster position="top-right" />

      <PrintableView patientName={context.patientName} records={records} />
      
      <RecordDetailsModal 
        record={selectedRecord} 
        onClose={() => setSelectedRecord(null)} 
        onPrint={printRecord} 
      />
      
      <ConsentModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSigned={() => { if(setStatus) setStatus('signed'); }} 
        patientId={id || ""} 
        professionalId={context.professionalId || ""} 
        clinicId={context.clinicId || ""} 
        procedureName={pendingTemplate?.title || "Procedimento"} 
      />

      {/* HEADER PACIENTE */}
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
            <SessionTimer isActive={isSessionActive} patientId={id || "temp"} />
            <div className="h-16 w-px bg-white/10 hidden md:block"></div>
            
            {!isSessionActive ? (
                <Button 
                    onClick={handleStartSession} 
                    className="text-white h-16 px-10 gap-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-300 bg-pink-600 hover:bg-pink-700 hover:scale-[1.02] active:scale-95"
                >
                    <Play size={24}/> INICIAR
                </Button>
            ) : (
                <div className="h-16 px-10 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center gap-4 animate-pulse cursor-default select-none shadow-lg">
                    <Activity size={24} /> EM ANDAMENTO
                </div>
            )}
         </div>
      </div>

      <div className="flex flex-col gap-12 no-print">
         <div className="w-full bg-white dark:bg-gray-800 p-10 rounded-[3.5rem] shadow-xl border border-gray-100 dark:border-gray-700 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-b-full"></div>
            
            <EvolutionForm 
                services={servicesList} 
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
                activePrescription={activePrescription}
                addPrescriptionItem={addPrescriptionItem}
                updatePrescriptionItem={updatePrescriptionItem}
                removePrescriptionItem={removePrescriptionItem}
                postTemplates={postTemplates} 
                onSendPostInstruction={handleSendPostInstructions}
            />
         </div>

         {/* TIMELINE HISTÓRICA */}
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
              onPrint={printRecord}
              patientName={context.patientName}
              clinicData={clinicData}
              postTemplates={postTemplates}
              onSendPostInstruction={handleSendPostInstructions}
            />
         </div>
      </div>
    </div>
  );
}