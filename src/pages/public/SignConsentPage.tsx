import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { FileSignature, Loader2, Eraser, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';

export function SignConsentPage() {
  const [searchParams] = useSearchParams();
  const consentId = searchParams.get('cid');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [consent, setConsent] = useState<any>(null);
  const [step, setStep] = useState<'reading' | 'signing' | 'completed'>('reading');
  
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (consentId) fetchConsent();
  }, [consentId]);

  async function fetchConsent() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_consents')
        .select('*')
        .eq('id', consentId)
        .single();
      if (error) throw error;
      setConsent(data);
    } catch (err) {
      toast.error("Termo não localizado.");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    // 1. Verificação de segurança para o TypeScript e para a assinatura vazia
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return toast.error("Assine para continuar.");
    }

    setIsSaving(true);
    try {
      const canvas = sigCanvas.current.getTrimmedCanvas();
      
      // ✅ Proteção contra undefined/null para o TS
      if (!canvas) {
        throw new Error("Falha ao processar área de assinatura.");
      }
      
      // ✅ Aplica o atributo de performance de forma segura
      canvas.getContext('2d', { willReadFrequently: true });
      const signatureData = canvas.toDataURL("image/png");

      console.log("📡 Enviando assinatura para o ID:", consentId);

      const { error } = await supabase
        .from('patient_consents')
        .update({ 
          patient_signature: signatureData,
          status: 'signed',
          signed_at: new Date().toISOString()
        })
        .eq('id', consentId);

      if (error) {
        console.error("❌ ERRO DO BANCO:", error);
        throw new Error(error.message);
      }

      setStep('completed');
      toast.success("Assinado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Falha no envio: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-pink-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white p-6 border-b-2 border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500 text-white rounded-lg"><FileSignature size={20}/></div>
              <h1 className="font-black uppercase text-xs tracking-widest text-gray-900 italic">VILAGI Digital</h1>
          </div>
      </header>

      <main className="flex-1 p-6 max-w-xl mx-auto w-full">
        {step === 'reading' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-gray-100">
                <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-6 italic">Leia com atenção:</p>
                <div className="text-[11px] font-medium text-gray-700 leading-relaxed uppercase whitespace-pre-wrap text-justify">
                   {consent?.content_snapshot}
                </div>
             </div>
             <Button onClick={() => setStep('signing')} className="w-full h-16 rounded-2xl bg-gray-900 hover:bg-black text-white font-black uppercase text-xs tracking-widest transition-all">
                Li e concordo: Assinar
             </Button>
          </div>
        )}

        {step === 'signing' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
             <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest italic">Assine no quadro abaixo:</p>
                  <button onClick={() => sigCanvas.current?.clear()} className="text-[10px] font-black uppercase text-gray-300 hover:text-red-500 transition-colors">Limpar</button>
                </div>
                <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 h-64 touch-none">
                  <SignatureCanvas 
                    ref={sigCanvas}
                    penColor="#111"
                    canvasProps={{ 
                      className: "w-full h-full cursor-crosshair",
                      // ✅ Cast para any para aceitar willReadFrequently sem reclamar no TS
                      ...({ willReadFrequently: "true" } as any) 
                    }}
                  />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setStep('reading')} className="h-16 rounded-2xl border-2 border-gray-100 font-black uppercase text-[10px] tracking-widest text-gray-400">Voltar</Button>
                <Button onClick={handleSave} disabled={isSaving} className="h-16 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-pink-100">
                    {isSaving ? <Loader2 className="animate-spin"/> : "Finalizar"}
                </Button>
             </div>
          </div>
        )}

        {step === 'completed' && (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border-2 border-emerald-100 shadow-inner">
                <ShieldCheck size={48}/>
              </div>
              <div>
                <h3 className="font-black uppercase text-xl text-gray-900 tracking-widest">Sucesso!</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Termo assinado e enviado com segurança.</p>
              </div>
              <div className="p-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[9px] tracking-[0.3em] shadow-2xl">
                 Pode devolver o celular ao profissional
              </div>
          </div>
        )}
      </main>

      <footer className="p-8 text-center mt-auto">
          <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest italic">VILAGI - Estética Avançada © 2026</p>
      </footer>
    </div>
  );
}