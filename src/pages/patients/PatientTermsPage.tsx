import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { 
  Printer, 
  CheckSquare, 
  Loader2, 
  ShieldCheck, 
  FileText, 
  Eraser, 
  History, 
  User as UserIcon,
  Smartphone,
  Copy,
  Share2,
  Monitor,
  MoreVertical,
  CalendarCheck,
  AlertCircle,
  Edit3, 
  Save,
  Lock,
  FileWarning,
  Fingerprint,
  Eye,
  Download,
  Smartphone as PhoneIcon
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import * as Components from "../../components/anamnesis/AnamnesisFormComponents";
import * as Constants from "../../data/anamnesisOptions";
import SignatureCanvas from "react-signature-canvas";

// ✅ NOVO IMPORT DO GERADOR CORRETO
import { generateConsentPdf } from "../../utils/generateConsentPdf"; 

// --- UTILITÁRIOS ---
async function generateContentHash(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- COMPONENTE INTERNO DE ASSINATURA ---
function LocalSignaturePad({ onEnd, existingSignature, isLoading }: any) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    onEnd("");
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      onEnd("");
    } else {
      onEnd(sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-950 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 overflow-hidden shadow-inner">
        {!isLoading && existingSignature ? (
           <div className="relative w-full h-64 flex items-center justify-center bg-white">
              <img src={existingSignature} alt="Assinatura Salva" className="h-full object-contain opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 hover:bg-transparent transition-all pointer-events-none">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded">Assinatura Registrada</p>
              </div>
           </div>
        ) : (
            <SignatureCanvas
            ref={sigCanvas}
            onEnd={save}
            canvasProps={{ className: "w-full h-64 cursor-crosshair" }}
            />
        )}
      </div>
      <div className="flex justify-between items-center px-2">
        {existingSignature ? (
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14}/> Assinatura biométrica registrada
          </span>
        ) : (
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={14}/> Aguardando assinatura
          </span>
        )}
        <button
          type="button"
          onClick={() => { onEnd(""); if(sigCanvas.current) sigCanvas.current.clear(); }}
          disabled={isLoading}
          className="text-[10px] font-black text-gray-400 hover:text-rose-500 uppercase tracking-widest flex items-center gap-2 transition-colors ml-auto group"
        >
          <Eraser size={14} className="group-hover:rotate-12 transition-transform" /> Limpar / Refazer
        </button>
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export function PatientTermsPage() {
  const { id } = useParams();
  
  const [activeTab, setActiveTab] = useState<'general' | 'history'>('general');
  const [generalMode, setGeneralMode] = useState<'screen' | 'remote'>('screen');
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingTerm, setIsEditingTerm] = useState(false);
  const [termContent, setTermContent] = useState(Constants.TERMO_LGPD_COMPLETO);
  const [contentChanged, setContentChanged] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [fullData, setFullData] = useState<any>(null);
  const [lastValidSnapshot, setLastValidSnapshot] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [clinicData, setClinicData] = useState<any>(null); // Guardar dados da clínica para o PDF

  const generalSignLink = `${window.location.origin}/sign-general/${id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generalSignLink)}`;

  const { register, handleSubmit, setValue, watch } = useForm();
  const termoAceito = watch("termo_aceito");

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`terms_updates_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_consents', filter: `patient_id=eq.${id}` }, 
        () => { toast.success("Atualização detectada!", { icon: '🔄' }); fetchData(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); }
  }, [id]);

  useEffect(() => {
    if (lastValidSnapshot && lastValidSnapshot.content_snapshot) {
      setContentChanged(termContent !== lastValidSnapshot.content_snapshot);
    } else {
      setContentChanged(termContent !== Constants.TERMO_LGPD_COMPLETO);
    }
  }, [termContent, lastValidSnapshot]);

  async function fetchData() {
    try {
      setLoading(true);
      
      const { data: patientData, error: patientError } = await supabase.from("patients").select("*").eq("id", id).single();
      if (patientError) throw patientError;

      // Busca dados da clínica para o PDF
      if (patientData.clinic_id) {
          const { data: cData } = await supabase.from("clinics").select("*").eq("id", patientData.clinic_id).single();
          setClinicData(cData);
      } else if (patientData.profile_id) {
          // Fallback se não tiver clinic_id no paciente
          const { data: prof } = await supabase.from("profiles").select("clinic_id").eq("id", patientData.profile_id).single();
          if (prof?.clinic_id) {
             const { data: cData } = await supabase.from("clinics").select("*").eq("id", prof.clinic_id).single();
             setClinicData(cData);
          }
      }

      const { data: allHistory } = await supabase.from('patient_consents').select('*').eq('patient_id', id).order('signed_at', { ascending: false });

      if (patientData) {
        setFullData(patientData);
        setValue("termo_aceito", patientData.termo_aceito || false);
        setValue("autoriza_foto", patientData.autoriza_foto || false);
        setValue("autoriza_midia", patientData.autoriza_midia || false);
        const json = patientData.procedimentos_detalhes_json || {}; 
        let currentSignature = json.assinatura_base64 || null;
        if (allHistory && allHistory.length > 0) {
            const recentWithSig = allHistory.find((h: any) => h.signature_snapshot);
            if (recentWithSig) currentSignature = recentWithSig.signature_snapshot;
        }
        if (currentSignature) setSavedSignature(currentSignature);
      }

      if (allHistory && allHistory.length > 0) {
        setHistoryList(allHistory);
        const validTerm = allHistory.find((item: any) => (item.type === 'general_lgpd' || item.type === 'termo') && item.status === 'valid');
        if (validTerm) {
            setLastValidSnapshot(validTerm);
            if (validTerm.content_snapshot) setTermContent(validTerm.content_snapshot);
        } else {
            setLastValidSnapshot(null);
        }
      } else {
        setHistoryList([]);
        setLastValidSnapshot(null);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  // ✅ NOVO GERADOR DE PDF (CORRETO)
  const handlePrint = () => {
    if (!fullData) return;
    
    // Gera PDF do que está na tela agora
    generateConsentPdf(
      clinicData, 
      fullData, 
      {
        title: "Termo de Consentimento (Rascunho/Vigente)",
        content: termContent,
        signature: signatureData || savedSignature,
        signedAt: new Date().toISOString(),
        hash: "Visualização"
      }
    );
    toast.success("PDF do Termo Gerado.");
    setShowMenu(false);
  }

  // ✅ NOVO GERADOR PARA HISTÓRICO (EVITA 3 ASSINATURAS)
  const handleDownloadHistoryItem = (item: any) => {
    if (!fullData) return;
    
    // Gera PDF apenas deste item histórico específico
    generateConsentPdf(
      clinicData,
      fullData,
      {
        title: item.procedure_name || "Termo de Consentimento",
        content: item.content_snapshot || Constants.TERMO_LGPD_COMPLETO,
        signature: item.signature_snapshot, // Pega só a assinatura deste item
        signedAt: item.signed_at,
        ip: item.ip_address,
        hash: item.content_hash
      }
    );
    toast.success("PDF do histórico gerado!");
  };

  const handleCopyLink = () => { navigator.clipboard.writeText(generalSignLink); toast.success("Link copiado!"); };
  const handleWhatsAppGeneral = () => {
    if (!fullData?.phone) return toast.error("Sem telefone.");
    const message = `Olá ${fullData.name}, por favor assine o Termo Geral: ${generalSignLink}`;
    window.open(`https://api.whatsapp.com/send?phone=55${fullData.phone.replace(/\D/g, "")}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleStartEditing = () => {
    if (lastValidSnapshot && !confirm("⚠️ Criar nova versão revogará a anterior. Continuar?")) return;
    setIsEditingTerm(true);
  };

  const onSubmit = async (formData: any) => {
    const finalSignature = signatureData || savedSignature;
    if (!finalSignature) return toast.error("Assinatura obrigatória.");
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const contentHash = await generateContentHash(termContent);

      if (lastValidSnapshot) {
        await supabase.from('patient_consents').update({ status: 'revoked', revoked_at: now }).eq('id', lastValidSnapshot.id);
      }

      await supabase.from("patients").update({
        termo_aceito: formData.termo_aceito,
        autoriza_foto: formData.autoriza_foto,
        autoriza_midia: formData.autoriza_midia,
        updated_at: now,
        procedimentos_detalhes_json: { ...(fullData.procedimentos_detalhes_json || {}), assinatura_base64: finalSignature }
      }).eq("id", id);

      const { error } = await supabase.from('patient_consents').insert({
        clinic_id: fullData.clinic_id || clinicData?.id,
        patient_id: id,
        professional_id: fullData.profile_id,
        type: 'general_lgpd', 
        procedure_name: `TERMO GERAL (V.${new Date().getFullYear()})`,
        content_snapshot: termContent,
        signature_snapshot: finalSignature,
        content_hash: contentHash,
        signed_mode: generalMode,
        signed_at: now,
        status: 'valid',
        ip_address: 'presencial-admin',
        user_agent: 'painel-admin'
      });

      if (error) throw error;
      toast.success("Assinado e Validado!");
      setIsEditingTerm(false);
      setSavedSignature(finalSignature);
      setSignatureData("");
      fetchData(); 
      setActiveTab('history');
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  if (loading) return <div className="h-[60vh] flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-pink-600" size={40}/><p className="text-xs font-bold text-gray-400">Carregando...</p></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>
            <ShieldCheck size={16} /> Termo Geral LGPD
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>
            <History size={16} /> Histórico
          </button>
        </div>
        <div className="relative">
          <Button variant="outline" onClick={() => setShowMenu(!showMenu)} className="h-12 px-6 rounded-xl border-gray-200 hover:bg-gray-50 text-[10px] font-black uppercase tracking-widest">
            <MoreVertical size={16} className="mr-2 text-gray-500" /> Ações
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-14 w-56 bg-white dark:bg-gray-900 border border-gray-100 rounded-2xl shadow-2xl p-2 z-50">
              <button onClick={handlePrint} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600"><Printer size={16}/> Baixar PDF Vigente</button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'general' ? (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
          <div className="flex justify-between items-end px-2">
             <div className="flex items-center gap-3">
                {lastValidSnapshot ? (
                  <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                    <div className="bg-emerald-200 p-1.5 rounded-full"><CalendarCheck size={16} className="text-emerald-800" /></div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest leading-none">Status: VIGENTE</p>
                      <p className="text-[10px] font-medium leading-none mt-1 opacity-80">Assinado em {new Date(lastValidSnapshot.signed_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 text-amber-700 border border-amber-100 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                    <div className="bg-amber-200 p-1.5 rounded-full"><AlertCircle size={16} className="text-amber-800" /></div>
                    <div><p className="text-[9px] font-black uppercase tracking-widest leading-none">Status: PENDENTE</p></div>
                  </div>
                )}
             </div>
             <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button onClick={() => setGeneralMode('screen')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${generalMode === 'screen' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}><Monitor size={14} className="inline mr-2"/> Tela</button>
                <button onClick={() => setGeneralMode('remote')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${generalMode === 'remote' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}><Smartphone size={14} className="inline mr-2"/> Link</button>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4 relative z-10">
                <div className="flex items-center gap-3"><h3 className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] flex items-center gap-2"><FileText size={14}/> Cláusulas</h3>{contentChanged && !isEditingTerm && <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full"><FileWarning size={10} /> Modificado</span>}</div>
                <button onClick={handleStartEditing} disabled={isEditingTerm} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEditingTerm ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{isEditingTerm ? <Lock size={14}/> : <Edit3 size={14}/>} {isEditingTerm ? "Editando..." : "Editar"}</button>
            </div>
            
            {isEditingTerm ? (
                <div className="animate-in fade-in relative z-10">
                    <textarea value={termContent} onChange={(e) => setTermContent(e.target.value)} className="w-full h-[500px] p-6 bg-gray-50 rounded-2xl border-2 border-pink-100 outline-none text-sm text-gray-700 font-mono resize-none leading-relaxed"/>
                    <div className="mt-4 flex justify-end"><Button size="sm" variant="ghost" onClick={() => { setIsEditingTerm(false); fetchData(); }}>Cancelar</Button><Button size="sm" onClick={() => setIsEditingTerm(false)} className="bg-emerald-600 text-white ml-2"><Save size={14} className="mr-2"/> Pronto</Button></div>
                </div>
            ) : (
                <div className="h-[500px] overflow-y-auto pr-6 custom-scrollbar text-sm leading-8 text-gray-600 font-medium text-justify whitespace-pre-wrap relative z-10">{termContent}</div>
            )}
          </div>

          {generalMode === 'screen' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in zoom-in-95">
              <div className="bg-pink-50/30 p-10 rounded-[3rem] border-2 border-pink-100"><h3 className="text-[10px] font-black text-pink-800 mb-8 flex items-center gap-3 uppercase tracking-widest"><CheckSquare size={20}/> Aceite</h3><div className="grid gap-4"><Components.CheckboxItem name="termo_aceito" label="Li e aceito integralmente os termos." register={register} /><Components.CheckboxItem name="autoriza_foto" label="Autorizo fotos." register={register} /><Components.CheckboxItem name="autoriza_midia" label="Autorizo uso de imagem." register={register} /></div></div>
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 ml-1 flex items-center gap-2"><UserIcon size={14} className="text-pink-500" /> Assinatura</label><LocalSignaturePad onEnd={setSignatureData} existingSignature={savedSignature} isLoading={saving} /></div>
              <div className="flex justify-end"><Button type="submit" disabled={saving || !termoAceito} className={`h-16 px-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 ${termoAceito ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'}`}>{saving ? <Loader2 className="animate-spin" /> : <Fingerprint size={20} className="text-pink-500" />} {saving ? "Validando..." : "Assinar"}</Button></div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center p-14 bg-white rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-8"><div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-gray-900 relative"><div className="absolute -top-3 -right-3 bg-pink-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg animate-bounce">Scan Me</div><img src={qrCodeUrl} alt="QR Code" className="w-56 h-56 object-contain"/></div><div className="space-y-2"><h3 className="text-2xl font-black text-gray-900">Aguardando Assinatura...</h3><p className="text-sm text-gray-500">Envie o link. A tela atualizará automaticamente.</p></div><div className="flex gap-3 w-full max-w-md"><Button variant="outline" onClick={handleCopyLink} className="flex-1 h-14 rounded-xl gap-2 font-bold uppercase text-xs tracking-widest"><Copy size={16}/> Copiar Link</Button><Button onClick={handleWhatsAppGeneral} className="flex-1 h-14 rounded-xl gap-2 font-bold uppercase text-xs tracking-widest bg-emerald-500 text-white"><Share2 size={16}/> WhatsApp</Button></div></div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 shadow-sm animate-in slide-in-from-right-4 duration-500">
          <div className="mb-8 flex items-center justify-between"><h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter">Histórico</h3><span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">Leitura</span></div>
          <div className="space-y-4">
            {historyList.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">Vazio.</div> : historyList.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-pink-200 transition-all">
                    <div className="flex items-center gap-4"><div className={`p-3 rounded-2xl ${item.status === 'valid' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}><FileText size={20} /></div><div><h4 className="text-sm font-bold text-gray-900 uppercase">{item.procedure_name || 'Termo'}</h4><div className="flex items-center gap-3 mt-1 text-xs text-gray-500"><span className="flex items-center gap-1"><CalendarCheck size={12}/> {new Date(item.signed_at).toLocaleDateString()}</span><span>{item.signed_mode === 'remote' ? 'Remoto' : 'Presencial'}</span></div></div></div>
                    <div className="flex items-center gap-4">{item.status === 'valid' ? <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">Vigente</span> : <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest">Revogado</span>}<div className="flex gap-2"><Button size="sm" variant="outline" className="h-10 w-10 p-0 rounded-xl" onClick={() => { setTermContent(item.content_snapshot); setActiveTab('general'); }} title="Ver"><Eye size={16}/></Button><Button size="sm" variant="outline" className="h-10 w-10 p-0 rounded-xl" onClick={() => handleDownloadHistoryItem(item)} title="Baixar PDF"><Download size={16}/></Button></div></div>
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}