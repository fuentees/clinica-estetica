import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  ShieldCheck, Loader2, X, FileSignature, MessageCircle, Copy
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

export function ConsentModal({ isOpen, onClose, onSigned, patientId, professionalId, clinicId, procedureName }: any) {
  const [consentId, setConsentId] = useState<string | null>(null);
  const [profSignature, setProfSignature] = useState<string | null>(null);
  const [patientSignature, setPatientSignature] = useState<string | null>(null);
  const [profPassword, setProfPassword] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [status, setStatus] = useState<'working' | 'completed'>('working');
  const [content, setContent] = useState("");
  const [patientData, setPatientData] = useState<{name: string, phone: string} | null>(null);
  const [loading, setLoading] = useState(true);

  // Link de assinatura
  const signLink = consentId ? `${window.location.origin}/sign?cid=${consentId}` : "";

  // Reset ao fechar/abrir
  useEffect(() => {
    if (isOpen && patientId) {
      loadAllData();
    }
    return () => {
      setConsentId(null);
      setPatientSignature(null);
      setStatus('working');
      setProfPassword("");
    };
  }, [isOpen, patientId]);

  // ✅ REALTIME: Monitora a tabela e atualiza a tela
  useEffect(() => {
    if (!consentId || status === 'completed') return;

    const channel = supabase
      .channel(`room:${consentId}`)
      .on(
        'postgres_changes',
        { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'patient_consents',
            filter: `id=eq.${consentId}`
        },
        (payload) => {
          if (payload.new && payload.new.patient_signature) {
             setPatientSignature(payload.new.patient_signature);
             if (payload.new.status === 'signed') {
                 toast.success("Assinatura do paciente recebida!", { icon: '✍️' });
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consentId, status]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const { data: pData } = await supabase.from('patients').select('name, phone').eq('id', patientId).single();
      const { data: profData } = await supabase.from('profiles').select('signature_data').eq('id', professionalId).single();

      setPatientData({ name: pData?.name || "Paciente", phone: pData?.phone || "" });
      setProfSignature(profData?.signature_data || null);

      // Carrega templates
      const { data: templates } = await supabase.from('consent_templates').select('*').eq('clinic_id', clinicId).is('deleted_at', null);
      
      // Lógica de Match do Template
      const procLower = (procedureName || "").toLowerCase();
      const match = templates?.find((t: any) => {
          if (t.title.toLowerCase().includes(procLower)) return true;
          return t.procedure_keywords?.some((k: string) => procLower.includes(k.toLowerCase()));
      });

      let finalContent = match ? match.content : `TERMO DE CONSENTIMENTO: ${procedureName}`;
      finalContent = finalContent
        .replace(/{PROCEDIMENTO}/g, procedureName)
        .replace(/{PACIENTE_NOME}/g, pData?.name || "Paciente")
        .replace(/{PACIENTE}/g, pData?.name || "Paciente")
        .replace(/{DATA}/g, new Date().toLocaleDateString('pt-BR'))
        .replace(/{DATA_ATUAL}/g, new Date().toLocaleDateString('pt-BR'));
        
      setContent(finalContent);

      // 🔍 CORREÇÃO CRÍTICA 1: Usar 'signed_at' em vez de 'created_at'
      // O seu banco não tem created_at, mas signed_at tem default now()
      const today = new Date().toISOString().split('T')[0];
      const { data: existingConsent } = await supabase
        .from('patient_consents')
        .select('*')
        .eq('patient_id', patientId)
        .eq('procedure_name', procedureName) // Seu banco tem essa coluna!
        .gte('signed_at', `${today}T00:00:00`) // ✅ Corrigido para signed_at
        .order('signed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingConsent) {
        setConsentId(existingConsent.id);
        if (existingConsent.patient_signature) {
          setPatientSignature(existingConsent.patient_signature);
        }
      } else {
        // 🔍 CORREÇÃO CRÍTICA 2: Remover metadata e usar colunas certas
        const payload: any = {
            clinic_id: clinicId, 
            patient_id: patientId, 
            professional_id: professionalId,
            procedure_name: procedureName, // ✅ Agora vai salvar
            content_snapshot: finalContent, 
            status: 'pending',
            type: 'termo' // Padrão do seu banco
        };

        if (match) {
            payload.template_id = match.id;
        }

        const { data: record, error: insError } = await supabase
          .from('patient_consents')
          .insert([payload])
          .select().single();

        if (insError) throw insError;
        setConsentId(record.id);
      }

    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao sincronizar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
      if (!signLink) return;
      navigator.clipboard.writeText(signLink);
      toast.success("Link copiado!", { icon: <Copy size={16}/> });
  };

  const handleFinalize = async () => {
    if (!profPassword) return toast.error("Senha profissional obrigatória");
    if (!patientSignature) return toast.error("Aguarde a assinatura do paciente!");

    setIsFinalizing(true);
    try {
      // Atualiza com as colunas corretas do seu schema
      const { error } = await supabase
        .from('patient_consents')
        .update({
          status: 'completed', 
          prof_signature_snapshot: profSignature, 
          prof_validated_with_password: true,
          // signed_at já é atualizado automaticamente pelo default ou mantemos o original
        })
        .eq('id', consentId);

      if (error) throw error;
      
      setStatus('completed');
      onSigned(); 
      toast.success("PRONTUÁRIO ASSINADO E ARQUIVADO!");
      setTimeout(() => onClose(), 1500);
    } catch (e) { 
      toast.error("Erro na validação."); 
    } finally { 
      setIsFinalizing(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-7xl rounded-[3rem] shadow-2xl border-[10px] border-pink-50 flex flex-col h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b-2 flex justify-between items-center bg-white">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-gray-900 text-white rounded-3xl"><FileSignature size={32}/></div>
                <div>
                    <h2 className="font-black uppercase text-xl text-gray-900 italic tracking-tighter">Sincronização Jurídica</h2>
                    <p className="text-[10px] text-pink-600 font-black uppercase tracking-[0.3em]">{procedureName}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-4 hover:bg-red-50 rounded-2xl text-gray-400 transition-all"><X size={32}/></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Esquerda: Documento */}
            <div className="flex-[1.8] p-10 overflow-y-auto bg-gray-50/50 border-r-4 border-gray-100">
               <div className="bg-white p-16 rounded-[3rem] border-2 border-gray-100 shadow-sm relative min-h-full flex flex-col justify-between">
                  <div className="font-medium text-gray-700 leading-relaxed uppercase text-[11px] whitespace-pre-wrap tracking-tighter text-justify">
                      {content}
                  </div>

                  <div className="mt-20 grid grid-cols-2 gap-20">
                      {/* PACIENTE */}
                      <div className="flex flex-col items-center">
                          <div className="h-24 flex items-end justify-center w-full pb-1">
                              {patientSignature ? (
                                <img src={patientSignature} className="max-h-full grayscale mix-blend-multiply animate-in zoom-in duration-500 mb-[-12px]" alt="Assinatura Paciente"/>
                              ) : (
                                <div className="flex flex-col items-center gap-2 opacity-20 pb-4">
                                  <Loader2 className="animate-spin" size={18}/>
                                  <span className="text-[7px] font-black uppercase tracking-widest italic">Aguardando...</span>
                                </div>
                              )}
                          </div>
                          <div className="w-full border-t-2 border-gray-900 pt-4 text-center">
                              <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">Assinatura do Paciente</p>
                              <p className="text-[8px] text-gray-300 mt-1 italic font-black">VALIDADO DIGITALMENTE</p>
                          </div>
                      </div>
                      
                      {/* PROFISSIONAL */}
                      <div className="flex flex-col items-center">
                          <div className="h-24 flex items-end justify-center w-full pb-1">
                              {status === 'completed' && profSignature ? (
                                <img src={profSignature} className="max-h-full grayscale mix-blend-multiply animate-in zoom-in duration-500 mb-[-12px]" alt="Assinatura Profissional"/>
                              ) : (
                                <div className="h-1 bg-gray-50/50 w-32 mb-4 rounded-full"></div>
                              )}
                          </div>
                          <div className="w-full border-t-2 border-gray-900 pt-4 text-center">
                              <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">Responsável Técnico</p>
                              <p className="text-[8px] text-gray-300 mt-1 italic font-black">AUTENTICADO COM SENHA</p>
                          </div>
                      </div>
                  </div>
               </div>
            </div>

            {/* Direita: Controles */}
            <div className="w-[450px] p-10 bg-white flex flex-col justify-between">
                <div className="space-y-8">
                    <div className="text-center space-y-6">
                      <p className="font-black uppercase text-[11px] text-pink-500 tracking-[0.3em] bg-pink-50 py-2 rounded-full italic">1. Vincular Dispositivo</p>
                      <div className="bg-white p-6 inline-block rounded-[3rem] border-[12px] border-gray-900 shadow-2xl relative">
                        {patientSignature && (
                          <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-[2rem] text-white animate-in fade-in">
                              <ShieldCheck size={64} className="mb-2"/>
                              <span className="font-black text-xs uppercase tracking-[0.2em]">Assinado</span>
                          </div>
                        )}
                        {!loading && consentId ? <QRCodeSVG value={signLink} size={200} /> : <Loader2 className="animate-spin" size={40}/>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                          onClick={() => window.open(`https://wa.me/55${patientData?.phone.replace(/\D/g,'')}?text=Acesse para assinar: ${signLink}`)} 
                          disabled={loading || !consentId || !!patientSignature} 
                          variant="outline" 
                          className="h-16 rounded-2xl border-2 border-emerald-100 text-emerald-600 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-emerald-50"
                        >
                          <MessageCircle size={20}/> WhatsApp
                        </Button>

                        <Button 
                          onClick={handleCopyLink} 
                          disabled={loading || !consentId} 
                          variant="outline" 
                          className="h-16 rounded-2xl border-2 border-blue-100 text-blue-600 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-blue-50"
                        >
                          <Copy size={20}/> Copiar
                        </Button>
                    </div>
                </div>

                <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl space-y-6">
                    <p className="font-black uppercase text-[10px] text-pink-400 tracking-[0.4em] text-center">2. Autenticação Final</p>
                    <input type="password" value={profPassword} onChange={e => setProfPassword(e.target.value)} placeholder="SENHA" className="w-full h-16 bg-white/5 rounded-2xl text-center font-black text-white outline-none border border-white/10 focus:border-pink-500 transition-all text-xl tracking-[0.5em]" />
                    <Button onClick={handleFinalize} disabled={isFinalizing || !patientSignature || status === 'completed'} className="w-full h-16 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em]">Finalizar e Arquivar</Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}