import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Eraser, FileSignature, Loader2 } from 'lucide-react';

export default function PatientSignPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);
  const sigCanvas = useRef<any>(null);

  const patientId = searchParams.get('p');
  const procedure = searchParams.get('proc');
  const consentId = searchParams.get('cid'); // ID do registro de consentimento criado

  const handleSaveSignature = async () => {
    if (sigCanvas.current.isEmpty()) return toast.error("POR FAVOR, DESENHE SUA ASSINATURA.");
    
    setLoading(true);
    try {
      const signatureImg = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      
      // Atualiza o registro de consentimento com a assinatura do paciente
      const { error } = await supabase
        .from('patient_consents')
        .update({ 
          patient_signature: signatureImg,
          status: 'signed_by_patient',
          patient_signed_at: new Date().toISOString()
        })
        .eq('id', consentId);

      if (error) throw error;
      setSigned(true);
      toast.success("ASSINATURA ENVIADA COM SUCESSO!");
    } catch (err) {
      toast.error("ERRO AO ENVIAR ASSINATURA.");
    } finally {
      setLoading(false);
    }
  };

  if (signed) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-emerald-50">
        <CheckCircle2 size={80} className="text-emerald-500 animate-bounce" />
        <h1 className="font-black uppercase text-2xl tracking-widest text-emerald-900">Assinado com Sucesso!</h1>
        <p className="text-emerald-700 font-medium uppercase text-xs tracking-widest">Você já pode fechar esta aba e retornar ao profissional.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col space-y-6">
      <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-xl">
        <h2 className="font-black uppercase text-lg tracking-widest flex items-center gap-3">
          <FileSignature className="text-pink-500"/> Assinatura Digital
        </h2>
        <p className="text-[10px] font-black uppercase text-gray-400 mt-1 tracking-widest">Procedimento: {procedure}</p>
      </div>

      <div className="flex-1 bg-white border-4 border-dashed border-gray-200 rounded-[2.5rem] relative overflow-hidden">
        <SignatureCanvas 
          ref={sigCanvas}
          penColor='black'
          canvasProps={{className: 'w-full h-full cursor-crosshair'}}
        />
        <div className="absolute bottom-4 right-4 pointer-events-none opacity-20">
          <p className="font-black uppercase text-sm tracking-[0.5em] -rotate-12">Assine Aqui</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => sigCanvas.current.clear()} variant="outline" className="h-16 flex-1 rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-gray-200">
          <Eraser className="mr-2" size={18}/> Limpar
        </Button>
        <Button onClick={handleSaveSignature} disabled={loading} className="h-16 flex-[2] bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">
          {loading ? <Loader2 className="animate-spin mr-2"/> : "Finalizar Assinatura"}
        </Button>
      </div>
    </div>
  );
}